const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema({
    OpportunityID: String,
    ClientName: String,
    Description: String,
    Amount: Number,
    Status: String,
    CreatedDate: String,
    embedding: { type: [Number], index: "2dsphere" }
});

module.exports = mongoose.model("Opportunity", OpportunitySchema);