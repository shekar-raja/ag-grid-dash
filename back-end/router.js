const express = require("express");
const router = express.Router();
const axios = require("axios");

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
        const table_names = {
            "opportunity": "opportunity"
        };
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        // Choose the correct table based on predefined logic
        const table_name = table_names["opportunity"];

        logger.info(`Sending query to Python API for table '${table_name}': ${query}`);

        const response = await axios.post(
            config.values.PYTHON_SERVER_URL + "/search",
            { text: query, table_name },
            { timeout: 60000 }
        );

        if (!response.data || !response.data.matched_ids) {
            logger.error("Invalid response from Python search API.");
            return res.status(500).json({ error: "Invalid response from search API" });
        }

        const matchedIds = response.data.matched_ids;
        const queryPlaceholders = matchedIds.map((_, i) => `$${i + 1}`).join(", ");

        if (matchedIds.length === 0) {
            return res.status(200).json({ results: [], message: "No results found" });
        }

        logger.info(`Fetching ${matchedIds.length} documents from PostgreSQL.`);

        const { rows } = await DB.query(
            `SELECT id, "leadId", "leadName", "status", "priority", "followUp", "source", "comments" FROM ${table_name} WHERE id IN (${queryPlaceholders});`,
            matchedIds
        );

        logger.info(`Retrieved ${rows.length} matching documents.`);
        res.status(200).json({ results: rows });
    } catch (error) {
        next(error);
    }
});

module.exports = router;