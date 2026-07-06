const format = (data, msg) => (typeof data === 'string' ? [data] : [msg, data]);

const logger = {
  info: (data, msg) => console.log('[urlScanner]', ...format(data, msg)),
  warn: (data, msg) => console.warn('[urlScanner]', ...format(data, msg)),
  error: (data, msg) => console.error('[urlScanner]', ...format(data, msg))
};

module.exports = { logger };
