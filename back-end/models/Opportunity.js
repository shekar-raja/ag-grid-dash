const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema({
    OpportunityID: String,
    ClientName: String,
    Description: String,
    Amount: Number,
    Status: String,
    CreatedDate: String
});

module.exports = mongoose.model("Opportunity", OpportunitySchema);