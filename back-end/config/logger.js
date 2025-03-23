const winston = require("winston");
const morgan = require("morgan");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ],
});

const requestLogger = morgan((tokens, req, res) => {
    return `[${new Date().toISOString()}] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} - ${tokens['response-time'](req, res)} ms`;
}, { stream: { write: (message) => logger.info(message.trim()) } });

const errorLogger = (err, req, res, next) => {
    logger.error(`❌ ${req.method} ${req.url} - ${err.message}`);
    next(err);
};

module.exports = { logger, requestLogger, errorLogger };