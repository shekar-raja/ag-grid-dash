const path = require("path");
const fs = require("fs");
const { Client } = require("pg");

// const mongoose = require("../mongoose");
const DB = require("../db");
const PolicyHolder = require("../models/PolicyHolder");
const Opportunity = require("../models/Opportunity");
const Proposal = require("../models/Proposal");
const Policy = require("../models/Policy");
const constants = require("../config/values")

// Function to Import JSON Data to MONGODB
// const ingest = async function importData() {
//     try {
//         console.log("Ingesting data");
//         // Load JSON Data
//         // const policyHolders = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "policy_holders.json"), "utf-8"));
//         const opportunities = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "opportunities-new.json"), "utf-8"));
//         // const proposals = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "proposals.json"), "utf-8"));
//         // const policies = JSON.parse(fs.readFileSync(path.join(__dirname, "../data", "policies.json"), "utf-8"));

//         // Insert Data into Collections
//         // await PolicyHolder.insertMany(policyHolders);
//         // console.log("✅ Policy Holders Imported Successfully!");

//         await Opportunity.insertMany(opportunities);
//         console.log("✅ Opportunities Imported Successfully!");

//         // await Proposal.insertMany(proposals);
//         // console.log("✅ Proposals Imported Successfully!");

//         // await Policy.insertMany(policies);
//         // console.log("✅ Policies Imported Successfully!");

//         console.log("🎉 All Data Successfully Imported into MongoDB Cloud!");
//         // mongoose.connection.close();
//     } catch (err) {
//         console.error("❌ Error Importing Data:", err);
//         mongoose.connection.close();
//     }
// }

async function importData() {
    try {
        console.log("Starting Data Import...");

        // Load JSON Data
        const filePath = path.join(__dirname, "../data", "proposals.json");
        if (!fs.existsSync(filePath)) {
            console.log("JSON file not found.");
            return;
        }

        const proposals = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (!proposals.length) {
            console.log("No data found in JSON file.");
            return;
        }

        console.log(`📂 Found ${proposals.length} records. Processing...`);

        // **Chunk data to avoid exceeding query limits**
        const chunkSize = 1000; // PostgreSQL can handle ~1000 rows at once
        await DB.query("BEGIN");

        for (let i = 0; i < proposals.length; i += chunkSize) {
            const chunk = proposals.slice(i, i + chunkSize);

            // **Prepare Bulk Insert**
            const values = [];
            const placeholders = chunk
                .map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`)
                .join(", ");

            chunk.forEach(({ proposalId, clientName, description, premiumAmount, status, proposalDate }) => {
                values.push(
                    proposalId || null,
                    clientName || null,
                    description || null,
                    premiumAmount || null,
                    status || null,
                    proposalDate ? new Date(proposalDate) : null,
                );
            });

            // ✅ Use **lowercase column names** to match PostgreSQL schema
            const query = `
                INSERT INTO proposal ("proposalId", "clientName", "description", "premiumAmount", "status", "proposalDate")
                VALUES ${placeholders};
            `;

            await DB.query(query, values);
            console.log(`✅ Successfully imported ${chunk.length} records...`);
        }

        await DB.query("COMMIT");
        console.log(`All ${proposals.length} proposals imported into PostgreSQL!`);
    } catch (err) {
        console.error("❌ Error Importing Data:", err);
    } finally {
        await DB.end();
        console.log("Database connection closed.");
    }
}

async function createTable() {
    try {
        // await DB.connect();
        console.log("✅ Connected to PostgreSQL");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS opportunity (
                id SERIAL PRIMARY KEY,
                "leadId" TEXT,  ;
                "leadName" TEXT,
                "phone" TEXT,
                "email" TEXT,
                "status" TEXT,
                "priority" TEXT,
                "lastInteraction" TEXT,
                "followUp" DATE,
                "source" TEXT,
                "comments" TEXT
            );
        `;

        await DB.query(createTableQuery);
        console.log("✅ Table 'opportunity' created successfully!");
    } catch (err) {
        console.error("❌ Error creating table:", err);
    }
}


// createTable();

importData();

module.exports = importData;