const express = require("express");
const router = express.Router();
const axios = require("axios");

const Opportunity = require("./models/Opportunity");
const PolicyHolder = require("./models/PolicyHolder");
const Policy = require("./models/Policy");
const Proposal = require("./models/Proposal");
const embeddings = require("./embeddings");
const config = require("./config/values");

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
        const opportunities = await Opportunity.find().sort({ CreatedDate: -1 });
        res.status(200).json(opportunities);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching opportunities", error: error.message });
    }
});

router.get("/proposals", async (req, res, next) => {
    try {
        const proposals = await Proposal.find().sort({ CreatedDate: -1 });
        res.status(200).json(proposals);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching proposals", error: error.message });
    }
});

router.post("/search", async (req, res) => {
    try {
        const collections = {
            opportunities: {
                collection: Opportunity,
                index: "opportunities_index"
            },
            proposals: {
                collection: Proposal,
                index: "proposals_index"
            },
            policyholders: {
                collection: PolicyHolder,
                index: "policy_holders_index"
            }
            // policies: Policy
        }
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        // Generate embedding for the query
        const response = await axios.post(config.values.PYTHON_SERVER_URL + "/generate_embedding", { text: query });
        const queryEmbedding = response.data.embedding;

        let searchResults = {};

        for (let key in collections) {
            console.log(`Searching in ${key} collection...`);
            const results = await embeddings.functions.performVectorSearch(queryEmbedding, collections[key]["collection"], collections[key]["index"]);
            // searchResults.push(...results);
            searchResults[key] = results;
        }

        res.json({ results: searchResults });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/generate-embeddings", async (req, res) => {
    try {
        await embeddings.functions.generateAndStoreEmbeddings(Opportunity);
        await embeddings.functions.generateAndStoreEmbeddings(PolicyHolder);
        await embeddings.functions.generateAndStoreEmbeddings(Policy);
        await embeddings.functions.generateAndStoreEmbeddings(Proposal);
        
        res.json({ message: "Embeddings created for all datasets!" });
    } catch (error) {
        res.json({ message: "Server side error occurred", error: error });
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
            console.log(`Removing embeddings in ${key} collection...`);
            const results = await embeddings.functions.removeEmbeddings(collections[key]);
        }
        
        res.json({ message: "Embeddings removed for all datasets!" });
    } catch (error) {
        res.json({ message: "Server side error occurred", error: error });
    }
});

module.exports = router;