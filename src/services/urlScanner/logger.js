const appLogger = require("../../config/logger");

const format = (data, msg) => (typeof data === "string" ? [data] : [msg, data]);

const logger = {
  info: (data, msg) => appLogger.info("[urlScanner]", ...format(data, msg)),
  warn: (data, msg) => appLogger.warn("[urlScanner]", ...format(data, msg)),
  error: (data, msg) => appLogger.error("[urlScanner]", ...format(data, msg)),
};

module.exports = { logger };
