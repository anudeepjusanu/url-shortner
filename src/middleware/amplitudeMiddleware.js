const amplitudeService = require('../services/amplitudeService');

/**
 * Middleware to track API requests in Amplitude
 */
const amplitudeMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // Get user ID from request (if authenticated)
    const userId = req.user?.id || req.user?._id || null;

    // Track API request
    amplitudeService.trackAPIRequest(userId, {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Track errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      amplitudeService.trackAPIError(userId, {
        endpoint: req.path,
        method: req.method,
        errorType: res.statusCode >= 500 ? 'server_error' : 'client_error',
        errorMessage: res.statusMessage || 'Unknown error',
        statusCode: res.statusCode,
      });
    }

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = amplitudeMiddleware;
