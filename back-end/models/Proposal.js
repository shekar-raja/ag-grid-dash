const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema({
    ProposalID: String,
    ClientName: String,
    Description: String,
    PremiumAmount: Number,
    Status: String,
    ProposalDate: String,
    embedding: { type: [Number], index: "2dsphere" }
});

module.exports = mongoose.model("Proposal", ProposalSchema);