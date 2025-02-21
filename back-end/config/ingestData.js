const mongoose = require("../mongoose");
const path = require("path");
const fs = require("fs");

const PolicyHolder = require("../models/PolicyHolder");
const Opportunity = require("../models/Opportunity");
const Proposal = require("../models/Proposal");
const Policy = require("../models/Policy");

// Function to Import JSON Data
const ingest = async function importData() {
    try {
        console.log("Ingesting data");
        // Load JSON Data
        const policyHolders = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "policy_holders.json"), "utf-8"));
        const opportunities = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "opportunities.json"), "utf-8"));
        const proposals = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "proposals.json"), "utf-8"));
        const policies = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "policies.json"), "utf-8"));

        // Insert Data into Collections
        await PolicyHolder.insertMany(policyHolders);
        console.log("✅ Policy Holders Imported Successfully!");

        await Opportunity.insertMany(opportunities);
        console.log("✅ Opportunities Imported Successfully!");

        await Proposal.insertMany(proposals);
        console.log("✅ Proposals Imported Successfully!");

        await Policy.insertMany(policies);
        console.log("✅ Policies Imported Successfully!");

        console.log("🎉 All Data Successfully Imported into MongoDB Cloud!");
        // mongoose.connection.close();
    } catch (err) {
        console.error("❌ Error Importing Data:", err);
        mongoose.connection.close();
    }
}

module.exports = ingest;