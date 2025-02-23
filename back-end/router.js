const express = require("express");
const router = express.Router();

const Opportunity = require("./models/Opportunity");
const PolicyHolder = require("./models/PolicyHolder");
const Policy = require("./models/Policy");
const Proposal = require("./models/Proposal");

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
        res.bstatus(500).json({ success: false, message: "Error fetching opportunities", error: error.message });
    }
});

router.get("/proposals", async (req, res, next) => {
    try {
        const proposals = await Proposal.find().sort({ CreatedDate: -1 });
        res.status(200).json(proposals);
    } catch (error) {
        res.bstatus(500).json({ success: false, message: "Error fetching proposals", error: error.message });
    }
});

router.get("//api/search?q=keyword", (req, res, next) => {

});

module.exports = router;