const mongoose = require("mongoose");

const PolicyHolderSchema = new mongoose.Schema({
    HolderID: String,
    Name: String,
    DOB: String,
    Email: String,
    Phone: String,
    Address: String,
    RiskScore: Number,
    TotalPremiumPaid: Number,
    ExistingClaims: Number,
    embedding: { type: [Number], index: "2dsphere" }
});

module.exports = mongoose.model("PolicyHolder", PolicyHolderSchema);