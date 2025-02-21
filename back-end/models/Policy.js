const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema({
    PolicyID: String,
    HolderID: String,
    PolicyType: String,
    CoverageAmount: Number,
    Status: String,
    StartDate: String,
    EndDate: String
});

module.exports = mongoose.model("Policy", PolicySchema);