const express = require("express");
const cors = require("cors");
const router = require("./router");


const app = express();
app.use("/api", router);
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

module.exports = app;