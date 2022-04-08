const winston = require("winston");
let split = require("split");
const rTracer = require("cls-rtracer");
const path = require("path");
global.rTracer = rTracer;
require("winston-daily-rotate-file");

let foldername = path.resolve(__dirname + "./../maillogs");
var maillogger;

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: `${foldername}/%DATE%-maillogfile.log`,
  datePattern: "YYYY-MM-DD",
  maxSize: "10m",
});

maillogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf((info) => {
      const rid = rTracer.id();
      return rid
        ? `${info.timestamp} ${info.level}: ${info.message}`
        : `${info.timestamp} [request-id:${rid}]: ${info.level}: ${info.message}`;
    })
  ),
  transports: [dailyRotateFileTransport],
});

maillogger.stream = split().on("data", function (message) {
  maillogger.info(message);
});

module.exports = maillogger;
