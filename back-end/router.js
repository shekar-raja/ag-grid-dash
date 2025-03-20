const express = require("express");
const router = express.Router();
const axios = require("axios");
const nlp = require("compromise");
const Fuse = require("fuse.js");

const Opportunity = require("./models/Opportunity");
const PolicyHolder = require("./models/PolicyHolder");
const Policy = require("./models/Policy");
const Proposal = require("./models/Proposal");
const embeddings = require("./embeddings");
const config = require("./config/values");
const { logger } = require("./config/logger");

const DB = require("./db");

router.get("/")

router.get("/policyholders", async (req, res, next) => {
    try {
        const policyholders = await PolicyHolder.find()
        res.status(200).json(policyholders);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching policy holders"});
    }
});

router.get("/policies", async (req, res, next) => {
    try {
        const policies = await Policy.find();
        res.status(200).json(policies);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching policies"});
    }
});

router.get("/opportunities", async (req, res, next) => {
    try {
        const query = `SELECT id, "leadId", "leadName", "phone", "email", "status", "priority", "lastInteraction", "followUp", "source", "comments"
                        FROM opportunity ORDER BY id ASC;`;
        const { rows } = await DB.query(query);

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching opportunities", error: error.message });
    }
});

router.get("/proposals", async (req, res, next) => {
    try {
        const query = `SELECT * FROM proposal ORDER BY id ASC;`;
        const { rows } = await DB.query(query);

        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/generate-embeddings", async (req, res) => {
    try {
        await embeddings.functions.generateAndStoreEmbeddings("opportunity");
        // await embeddings.functions.generateAndStoreEmbeddings(PolicyHolder);
        // await embeddings.functions.generateAndStoreEmbeddings(Policy);
        // await embeddings.functions.generateAndStoreEmbeddings(Proposal);
        
        res.json({ message: "Embeddings created for all datasets!" });
    } catch (error) {
        next(error);
    }
});

router.get("/remove-embeddings", async (req, res, next) => {
    const tables = ["opportunity"];

    embeddings.functions.removeEmbeddings(tables).then((result) => {
        res.status(200).json({ success: true, message: result})
    }).catch((error) => {
        next(error)
    });
});

router.get("/index-embeddings", async (req, res, next) => {
    try {
        logger.info("Fetching embeddings from PostgreSQL for indexing");

        // List of tables to process
        const tables = ["opportunity"]; // Add more tables as needed

        let allEmbeddings = [];

        for (let table of tables) {
            logger.info(`Fetching embeddings from table: ${table}`);
            const { rows } = await DB.query(`SELECT id, embedding FROM ${table} WHERE embedding IS NOT NULL;`);

            if (rows.length === 0) {
                logger.warn(`No embeddings found in '${table}' table`);
                continue;
            }

            allEmbeddings.push({ table_name: table, embeddings: rows });
            logger.info(`Found ${rows.length} embeddings in '${table}', preparing for indexing...`);
        }

        if (allEmbeddings.length === 0) {
            logger.warn("No embeddings found in any table.");
            return res.status(404).json({ success: false, message: "No embeddings found in any table." });
        }

        // Send embeddings to FAISS for indexing
        return embeddings.functions.indexEmbeddings(1000, allEmbeddings)
            .then((result) => {
                if (result) {
                    logger.info(`Successfully indexed embeddings in FAISS`);
                    res.status(200).json({ success: true, message: `Embeddings indexed successfully in FAISS.` });
                }
            })
            .catch((error) => {
                next(error);
            });
    } catch (error) {
        next(error);
    }
});

router.post("/search", async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        logger.info(`Performing hybrid search for query: ${query}`);

        const table_names = {
            "opportunity": "opportunity"
        };

        // Choose the correct table based on predefined logic
        const table_name = table_names["opportunity"];

        logger.info(`Sending query to Python API for table '${table_name}': ${query}`);

        const faissResponse = await axios.post(
            config.values.PYTHON_SERVER_URL + "/search",
            { text: query, table_name },
            { timeout: 60000 }
        );

        if (!faissResponse.data || !faissResponse.data.matched_ids) {
            logger.error("No valid response from FAISS search.");
            return res.status(500).json({ error: "Invalid response from search API" });
        }

        let matchedIds = faissResponse.data.matched_ids;
        if (matchedIds.length === 0) {
            return res.status(200).json({ results: [], message: "No results found" });
        }

        // Step 2️⃣: Extract Dynamic Filters from Query (using NLP)
        let fiassQuery = `SELECT id, "leadId", "leadName", "phone", "email", "status", "priority", "lastInteraction", "followUp", "source", "comments" FROM opportunity WHERE id = ANY($1)`;
        let values = [matchedIds];
        let filters = [];

        let doc = nlp(query);
        let words = doc.terms().out("array"); // Extract key entities

        // Set up fuzzy search options
        const fuzzyOptions = {
            includeScore: true,
            threshold: 0.5,
            keys: ["keyword"]
        };
        
        const createFuzzySearch = (keywords) => new Fuse(keywords.map(k => ({ keyword: k })), fuzzyOptions);

        // ** Define mappings for structured fields **
        const statusKeywords = ["converted", "in progress", "disqualified", "qualified", "closed", "new"];
        const priorityKeywords = ["high", "medium", "low", "urgent"];
        const interactionKeywords = ["chat", "email", "phone call", "meeting", "text message"];
        const sourceKeywords = ["partner", "website", "social media", "trade show", "webinar", "advertisement", "referral"];

        const statusSearch = createFuzzySearch(statusKeywords);
        const prioritySearch = createFuzzySearch(priorityKeywords);
        const interactionSearch = createFuzzySearch(interactionKeywords);
        const sourceSearch = createFuzzySearch(sourceKeywords);

        // Function to find best match using fuzzy search
        const findBestMatch = (searchObj, word) => {
            const result = searchObj.search(word);
            return result.length > 0 ? result[0].item.keyword : null; // Return best match
        };

        // Process words in query
        function processQuery(words) {
            let filters = [];
            const dateRegex = /\d{4}-\d{2}-\d{2}/; // Detect dates

            words.forEach(word => {
                let lowerWord = word.toLowerCase();

                if (dateRegex.test(word)) {
                    filters.push(`"followUp" = '${word}'`);
                } else {
                    // Use fuzzy search to find best match
                    let matchedStatus = findBestMatch(statusSearch, lowerWord);
                    let matchedPriority = findBestMatch(prioritySearch, lowerWord);
                    let matchedInteraction = findBestMatch(interactionSearch, lowerWord);
                    let matchedSource = findBestMatch(sourceSearch, lowerWord);

                    if (matchedStatus) {
                        filters.push(`"status" = '${matchedStatus}'`);
                    } else if (matchedPriority) {
                        filters.push(`"priority" = '${matchedPriority.toUpperCase()}'`);
                    } else if (matchedInteraction) {
                        filters.push(`"lastInteraction" = '${matchedInteraction}'`);
                    } else if (matchedSource) {
                        filters.push(`"source" = '${matchedSource}'`);
                    } else if (word.includes("@")) {
                        filters.push(`"email" ILIKE '%${word}%'`);
                    } else if (/^\(\d{3}\)/.test(word)) {
                        filters.push(`"phone" LIKE '${word}%'`);
                    }
                }
            });

            return filters;
        }

        filters = processQuery(words);

        let sqlQuery = ""
        
        if (filters.length > 0) {
            sqlQuery += `SELECT id, "leadId", "leadName", "phone", "email", "status", "priority", "lastInteraction", "followUp", "source", "comments" FROM opportunity WHERE `;
            sqlQuery += `${filters.join(" OR ")}`;
        }

        logger.info(`Running SQL query with extracted filters: ${sqlQuery}`);
        const semanticResults = await DB.query(fiassQuery, values);
        const lexicalResults = await DB.query(sqlQuery);

        let mergedResults = lexicalResults.rows.concat(semanticResults.rows);
        let uniqueResults = Array.from(new Map(mergedResults.map(item => [item.id, item])).values());

        res.status(200).json({ results: { "opportunities": uniqueResults }});
    } catch (error) {
        next(error);
    }
});

module.exports = router;