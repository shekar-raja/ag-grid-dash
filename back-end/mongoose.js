const mongoose = require("mongoose");
const chalk = new (require("chalk").Chalk);
const env = require("./config/values");

mongoose.Promise = global.Promise;

const connectionURI = env.values.MONGODB_URL;

const connectionParams={
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useUnifiedTopology: true,
    // auto_reconnect: true
};

mongoose.connect(connectionURI);

/** On Mongo connection successful */
mongoose.connection.on('open', () => {
    console.log(`${chalk.green('✓')} Mongo Connected`)
    // const ingest = require("./config/ingestData");
    // ingest()
});

/** On Mongo connection error */
mongoose.connection.on('error', (error) => {
    console.log(`${chalk.red('x')} Error in connecting MongoDB. ${error}`);
    setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
            db = mongoose.connect(connectionUri, connectionParams);
        }
    }, 1000);
});

module.exports = mongoose;