const express = require("express");
const cors = require("cors");
const path = require("path");

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

// app.use('/', express.static('../front-end/dist/ag-grid-dash/browser'));
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve('../front-end/dist/ag-grid-dash/browser/index.html'), { req });
// });

module.exports = app;