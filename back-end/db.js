const { Client } = require("pg");

const constants = require("./config/values");
const { logger } = require("./config/logger");

const DB = new Client({
    host: constants.values.POSTGRESQL_URL,
    user: constants.values.POSTGRESQL_USER_NAME,
    password: constants.values.POSTGRESQL_PWD,
    database: constants.values.POSTGRESQL_DB,
    ssl: { rejectUnauthorized: false }
});

DB.connect()
    .then(() => {
        logger.info(`✅ Postgres DB Connected`);
        logger.info(`📌 Using Database: ${constants.values.POSTGRESQL_DB}`);
        // require("./config/ingestData"); 
    })
    .catch((error) => {
        logger.error(`❌ Postgres DB Connection Error:", ${error}`);
    });

module.exports = DB;