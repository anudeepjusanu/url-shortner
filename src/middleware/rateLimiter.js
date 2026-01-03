const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { redis } = require('../config/redis');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests from this IP',
    keyGenerator,
    skip,
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ipKeyGenerator,
    skip: skip || (() => false),
    // Temporarily disable Redis store to fix hanging issue
    // store: redis ? { ... } : undefined
  });
};

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => `auth:${ipKeyGenerator(req)}`,
  skip: (req) => req.method !== 'POST'
});

const urlCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many URLs created, please try again later',
  keyGenerator: (req) => {
    if (req.user) {
      const userKey = `url_creation:user:${req.user.id}`;
      const roleMultiplier = {
        'admin': 10,
        'premium': 5,
        'user': 1
      };
      return {
        key: userKey,
        max: 100 * (roleMultiplier[req.user.role] || 1)
      };
    }
    return `url_creation:ip:${ipKeyGenerator(req)}`;
  }
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    if (!req.user) return 50;
    
    const limits = {
      'admin': 10000,
      'premium': 2000,
      'user': 500
    };
    
    return limits[req.user.role] || 500;
  },
  message: 'API rate limit exceeded',
  keyGenerator: (req) => {
    return req.user ? `api:user:${req.user.id}` : `api:ip:${ipKeyGenerator(req)}`;
  }
});

const redirectLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many redirect requests',
  keyGenerator: (req) => `redirect:${ipKeyGenerator(req)}`,
  skip: (req) => {
    const userAgent = req.get('User-Agent') || '';
    return /bot|crawler|spider/i.test(userAgent);
  }
});

const strictAuthLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many failed attempts, account temporarily locked',
  keyGenerator: (req) => `strict_auth:${req.body.email || ipKeyGenerator(req)}`,
  skipSuccessfulRequests: true,
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many password reset requests, please try again later',
  keyGenerator: (req) => `password_reset:${req.body.email || ipKeyGenerator(req)}`
});

const dynamicLimiter = (req, res, next) => {
  const endpoint = req.route?.path || req.path;
  const method = req.method;
  
  const limits = {
    'POST:/api/auth/login': authLimiter,
    'POST:/api/auth/register': authLimiter,
    'POST:/api/auth/forgot-password': passwordResetLimiter,
    'POST:/api/urls': urlCreationLimiter,
    'GET:/api/*': apiLimiter
  };
  
  const key = `${method}:${endpoint}`;
  const limiter = limits[key] || generalLimiter;
  
  limiter(req, res, next);
};

const bypassLimiter = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return generalLimiter(req, res, next);
};

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  urlCreationLimiter,
  apiLimiter,
  redirectLimiter,
  strictAuthLimiter,
  passwordResetLimiter,
  dynamicLimiter,
  bypassLimiter
};