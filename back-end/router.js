const express = require("express");
const router = express.Router();

const Opportunity = require("./models/Opportunity");
const PolicyHolder = require("./models/PolicyHolder");

router.get("/policyholders", async (req, res, next) => {
    try {
        const policyholders = await PolicyHolder.find()
        res.status(200).json(policyholders);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching policy holders"});
    }
});

router.get("/policies", (req, res, next) => {

});

router.get("/opportunities", async (req, res, next) => {
    try {
        const opportunities = await Opportunity.find().sort({ CreatedDate: -1 });
        res.status(200).json(opportunities);
    } catch (error) {
        res.bstatus(500).json({ success: false, message: "Error fetching opportunities", error: error.message });
    }
});

router.get("//api/search?q=keyword", (req, res, next) => {

});

module.exports = router;