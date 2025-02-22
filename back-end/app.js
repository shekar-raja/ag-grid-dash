const express = require("express");
const cors = require("cors");
const router = require("./router");
const bodyParser = require("body-parser");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", router);
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

require("./mongoose");
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;