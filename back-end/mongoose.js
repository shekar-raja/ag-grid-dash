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
    console.log(`${chalk('✓')} Mongo Connected`)
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

/** On Mongo disconnect */
// mongoose.connection.on('disconnected', (error) => {
//     console.log(`${chalk.red('x')} MongoDB disconnected. ${error}`);
//     setTimeout(() => {
//         if (mongoose.connection.readyState === 0) {
//             db = mongoose.connect(connectionURI);
//         }
//     }, 1000);
// });

/* If the Node process ends, close the Mongoose connection **/
// process.on('SIGINT', () => {
//     mongoose.connection.close(() => {
//         console.log('Mongoose default connection disconnected through app termination');
//         process.exit(0);
//     });
// });


module.exports = mongoose;