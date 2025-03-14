const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema({
    leadID: String,
    leadName: String,
    status: String,
    phone: Number,
    email: String,
    priority: String,
    lastInteraction: String,
    followUp: String,
    source: String,
    comments: String,
    embedding: { type: [Number], index: "2dsphere" }
});

module.exports = mongoose.model("Opportunity", OpportunitySchema);