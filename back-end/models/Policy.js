const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema({
    PolicyID: String,
    HolderID: String,
    PolicyType: String,
    CoverageAmount: Number,
    Status: String,
    StartDate: String,
    EndDate: String,
    embedding: { type: [Number], index: "2dsphere" }
});

module.exports = mongoose.model("Policy", PolicySchema);