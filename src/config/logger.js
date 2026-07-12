const winston = require('winston');
const path = require('path');
const util = require('util');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Mirrors console.log/warn/error's behavior of accepting multiple
// mixed-type arguments (strings, objects, Errors) and rendering them
// as one readable line, so swapping console.* -> logger.* call sites
// doesn't change what gets printed.
const formatArg = (arg) => {
  if (arg instanceof Error) return arg.stack || arg.message;
  if (typeof arg === 'string') return arg;
  try {
    return util.inspect(arg, { depth: 4, colors: false });
  } catch (err) {
    return String(arg);
  }
};

const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'url-shortener-api' },
  transports: isTest ? [] : [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

if (!isTest) {
  winstonLogger.add(new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          consoleFormat
        ),
  }));
}

const wrap = (level) => (...args) => {
  if (args.length === 0) return;
  const message = args.length === 1 ? formatArg(args[0]) : args.map(formatArg).join(' ');
  winstonLogger.log(level, message);
};

// Drop-in replacement for console.log/warn/error: same call signature,
// but output is leveled, timestamped, and persisted to logs/*.log.
const logger = {
  error: wrap('error'),
  warn: wrap('warn'),
  info: wrap('info'),
  http: wrap('http'),
  debug: wrap('debug'),
  stream: {
    write: (message) => winstonLogger.http(message.trim()),
  },
};

module.exports = logger;

