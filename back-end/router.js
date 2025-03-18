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

        const { rows } = await DB.query(`SELECT id, embedding FROM opportunity WHERE embedding IS NOT NULL;`);

        if (rows.length === 0) {
            logger.warn("No embeddings found in database");
            next();
        }

        logger.info(`Found ${rows.length} embeddings. Sending in batches`);

        return embeddings.functions.indexEmbeddings(1000, rows)
            .then((result) => {
                if (result) {
                    logger.info(`${rows.length} embeddings indexed in FIASS successfully`);
                    res.status(200).json({ success: true, message: `${rows.length} embeddings indexed in FIASS successfully` });
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
        let collections = {
            opportunity: "opportunity"
        }
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        // Generate embedding for the query
        const response = await axios.post(config.values.PYTHON_SERVER_URL + "/generate-query-embedding", { text: query });
        const queryEmbedding = response.data.embedding;

        let searchResults = {};

        for (let key in collections) {
            logger.info(`Searching in ${key} collection...`);
            const results = await embeddings.functions.performVectorSearch(queryEmbedding, collections[key]["collection"], collections[key]["index"]);
            searchResults[key] = results;
        }

        res.json({ results: searchResults });
    } catch (error) {
        next(error);
    }
});

module.exports = router;