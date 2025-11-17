const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

/**
 * Logger utility using Winston
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Daily rotating log files
 * - Separate files for errors
 * - Console output in development
 * - JSON formatting for production
 * - Specialized loggers for different domains
 */

const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, label, ...metadata }) => {
    let msg = `${timestamp} [${level}]`;
    if (label) msg += ` [${label}]`;
    msg += `: ${message}`;

    // Add metadata if exists
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

/**
 * Create transport for daily rotating files
 */
const createDailyRotateTransport = (filename, level = 'info') => {
  return new winston.transports.DailyRotateFile({
    dirname: logDir,
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: level,
    format: logFormat
  });
};

/**
 * Base logger configuration
 */
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: logFormat,
  transports: [
    // All logs
    createDailyRotateTransport('application', 'info'),

    // Error logs
    createDailyRotateTransport('errors', 'error')
  ],
  exceptionHandlers: [
    createDailyRotateTransport('exceptions')
  ],
  rejectionHandlers: [
    createDailyRotateTransport('rejections')
  ],
  exitOnError: false
});

// Add console transport in development
if (isDevelopment) {
  baseLogger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Create a child logger with a specific label
 */
const createLogger = (label) => {
  return baseLogger.child({ label });
};

/**
 * Specialized loggers for different domains
 */

// HTTP request logger
const httpLogger = createLogger('HTTP');

// Database logger
const dbLogger = createLogger('Database');

// Authentication logger
const authLogger = createLogger('Auth');

// Payment logger
const paymentLogger = createLogger('Payment');

// Analytics logger
const analyticsLogger = createLogger('Analytics');

// Email logger
const emailLogger = createLogger('Email');

// System logger
const systemLogger = createLogger('System');

/**
 * Log HTTP request
 */
const logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`
  };

  if (req.user) {
    logData.userId = req.user._id || req.user.id;
  }

  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  httpLogger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
};

/**
 * Log database operation
 */
const logDatabaseOperation = (operation, collection, details = {}) => {
  dbLogger.info(`Database ${operation}`, {
    operation,
    collection,
    ...details
  });
};

/**
 * Log database error
 */
const logDatabaseError = (operation, collection, error) => {
  dbLogger.error(`Database ${operation} failed`, {
    operation,
    collection,
    error: error.message,
    stack: error.stack
  });
};

/**
 * Log authentication event
 */
const logAuth = (event, userId, details = {}) => {
  authLogger.info(`Auth: ${event}`, {
    event,
    userId,
    ...details
  });
};

/**
 * Log authentication failure
 */
const logAuthFailure = (event, reason, details = {}) => {
  authLogger.warn(`Auth failed: ${event}`, {
    event,
    reason,
    ...details
  });
};

/**
 * Log payment event
 */
const logPayment = (event, paymentData) => {
  paymentLogger.info(`Payment: ${event}`, {
    event,
    ...paymentData
  });
};

/**
 * Log payment error
 */
const logPaymentError = (event, error, paymentData = {}) => {
  paymentLogger.error(`Payment failed: ${event}`, {
    event,
    error: error.message,
    ...paymentData
  });
};

/**
 * Log analytics event
 */
const logAnalytics = (event, data) => {
  analyticsLogger.info(`Analytics: ${event}`, {
    event,
    ...data
  });
};

/**
 * Log email event
 */
const logEmail = (event, recipient, details = {}) => {
  emailLogger.info(`Email: ${event}`, {
    event,
    recipient,
    ...details
  });
};

/**
 * Log email error
 */
const logEmailError = (event, recipient, error) => {
  emailLogger.error(`Email failed: ${event}`, {
    event,
    recipient,
    error: error.message
  });
};

/**
 * Log system event
 */
const logSystem = (event, details = {}) => {
  systemLogger.info(`System: ${event}`, {
    event,
    ...details
  });
};

/**
 * Log system error
 */
const logSystemError = (event, error) => {
  systemLogger.error(`System error: ${event}`, {
    event,
    error: error.message,
    stack: error.stack
  });
};

/**
 * Express middleware for request logging
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
  });

  next();
};

/**
 * Express middleware for error logging
 */
const errorLoggerMiddleware = (err, req, res, next) => {
  const logData = {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };

  if (req.user) {
    logData.userId = req.user._id || req.user.id;
  }

  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log sensitive data
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.apiKey;
    logData.body = sanitizedBody;
  }

  httpLogger.error('Request error', logData);
  next(err);
};

/**
 * Stream for Morgan HTTP logger
 */
const stream = {
  write: (message) => {
    httpLogger.info(message.trim());
  }
};

module.exports = {
  // Base logger
  logger: baseLogger,

  // Specialized loggers
  httpLogger,
  dbLogger,
  authLogger,
  paymentLogger,
  analyticsLogger,
  emailLogger,
  systemLogger,

  // Helper functions
  createLogger,
  logRequest,
  logDatabaseOperation,
  logDatabaseError,
  logAuth,
  logAuthFailure,
  logPayment,
  logPaymentError,
  logAnalytics,
  logEmail,
  logEmailError,
  logSystem,
  logSystemError,

  // Express middleware
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  stream
};
