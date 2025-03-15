const { Client } = require("pg");
const chalk = new (require("chalk").Chalk);

const constants = require("./config/values");

const DB = new Client({
    host: constants.values.POSTGRESQL_URL,
    user: constants.values.POSTGRESQL_USER_NAME,
    password: constants.values.POSTGRESQL_PWD,
    database: constants.values.POSTGRESQL_DB,
    ssl: { rejectUnauthorized: false }
});

DB.connect()
    .then(() => {
        console.log(`✅ Postgres DB Connected`);
    })
    .catch((error) => {
        console.error(`❌ Postgres DB Connection Error:", ${error}`);
    });

module.exports = DB;