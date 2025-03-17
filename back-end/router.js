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

router.post("/search", async (req, res, next) => {
    try {
        const collections = {
            opportunities: {
                collection: Opportunity,
                index: "opportunity_index"
            },
            // proposals: {
            //     collection: Proposal,
            //     index: "proposals_index"
            // },
            // policyholders: {
            //     collection: PolicyHolder,
            //     index: "policy_holders_index"
            // }
            // policies: Policy
        }
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        // Generate embedding for the query
        const response = await axios.post(config.values.PYTHON_SERVER_URL + "/generate_embedding", { text: query });
        const queryEmbedding = response.data.embedding;

        let searchResults = {};

        for (let key in collections) {
            logger.info(`Searching in ${key} collection...`);
            const results = await embeddings.functions.performVectorSearch(queryEmbedding, collections[key]["collection"], collections[key]["index"]);
            // searchResults.push(...results);
            searchResults[key] = results;
        }

        res.json({ results: searchResults });
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

router.get("/remove-embeddings", async (req, res) => {
    try {
        const collections = {
            opportunities: Opportunity,
            proposals: Proposal,
            policyholders: PolicyHolder,
            policies: Policy
        }

        for (let key in collections) {
            logger.info(`Removing embeddings in ${key} collection...`);
            const results = await embeddings.functions.removeEmbeddings(collections[key]);
        }
        
        res.json({ message: "Embeddings removed for all datasets!" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;