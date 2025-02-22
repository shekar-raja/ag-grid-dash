const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema({
    ProposalID: String,
    ClientName: String,
    Description: String,
    PremiumAmount: Number,
    Status: String,
    ProposalDate: String
});

module.exports = mongoose.model("Proposal", ProposalSchema);