const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const { redis } = require("../config/redis");
const redirectService = require("../services/redirectService");

// Mirrors getFrontendBaseUrl in redirectController.js — derives the frontend
// origin from the request host so a rate-limited redirect on qa.snip.sa
// lands back on qa.snip.sa instead of a hardcoded dev placeholder.
const getFrontendBaseUrl = (req) => {
  const rawHost = req?.get?.("host") || "";
  const requestDomain = rawHost.split(":")[0];
  if (requestDomain && redirectService.isMainDomain(requestDomain)) {
    return `${req.protocol}://${rawHost}`;
  }
  return (
    process.env.BASE_URL || `https://${process.env.BASE_DOMAIN || "snip.sa"}`
  );
};

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests from this IP",
    keyGenerator,
    skip,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
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
  message: "Too many requests from this IP, please try again later",
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts, please try again later",
  keyGenerator: (req) => `auth:${ipKeyGenerator(req)}`,
  skip: (req) => req.method !== "POST",
});

// Login has its own bucket, keyed by email (falling back to IP), so it isn't
// starved by register/OTP/Google traffic sharing authLimiter's IP-only bucket,
// and so unrelated users behind the same NAT/office IP don't share one pool.
// max is higher than authLimiter's 20 because a single login with OTP
// verification is 2 requests to this same route, plus room for retries.
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login attempts, please try again later",
  keyGenerator: (req) => {
    const normalizedEmail = req.body?.email
      ? req.body.email.trim().toLowerCase()
      : null;
    return normalizedEmail
      ? `login:${normalizedEmail}`
      : `login:${ipKeyGenerator(req)}`;
  },
});

const urlCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    if (req.user) {
      const roleMultiplier = { admin: 10, premium: 5, user: 1 };
      return 100 * (roleMultiplier[req.user.role] || 1);
    }
    return 100;
  },
  message: "Too many URLs created, please try again later",
  keyGenerator: (req) => {
    if (req.user) {
      return `url_creation:user:${req.user.id}`;
    }
    return `url_creation:ip:${ipKeyGenerator(req)}`;
  },
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: (req) => {
    if (!req.user) return 50;

    const limits = {
      admin: 10000,
      premium: 2000,
      user: 500,
    };

    return limits[req.user.role] || 500;
  },
  message: "API rate limit exceeded",
  keyGenerator: (req) => {
    return req.user
      ? `api:user:${req.user.id}`
      : `api:ip:${ipKeyGenerator(req)}`;
  },
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `redirect:${ipKeyGenerator(req)}`,
  skip: (req) => {
    const userAgent = req.get("User-Agent") || "";
    return /bot|crawler|spider/i.test(userAgent);
  },
  handler: (req, res) => {
    const frontendUrl = getFrontendBaseUrl(req);
    const shortCode = req.params.shortCode || req.params.code || "";
    res.redirect(
      `${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`,
    );
  },
});

const strictAuthLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many failed attempts, account temporarily locked",
  keyGenerator: (req) => `strict_auth:${req.body.email || ipKeyGenerator(req)}`,
  skipSuccessfulRequests: true,
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many password reset requests, please try again later",
  keyGenerator: (req) =>
    `password_reset:${req.body.email || ipKeyGenerator(req)}`,
});

// Stricter limiter for OTP verification to prevent brute-force on 4-digit codes.
// Allows 5 attempts per 15 minutes per email (or IP if email absent).
const otpVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP verification attempts, please try again later",
  keyGenerator: (req) => {
    const normalizedEmail = req.body.email
      ? req.body.email.trim().toLowerCase()
      : null;
    return normalizedEmail
      ? `otp_verify:${normalizedEmail}`
      : `otp_verify:${ipKeyGenerator(req)}`;
  },
});

// QR Code download limiter - more lenient for downloads
const qrDownloadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: (req) => {
    if (!req.user) return 100; // 100 downloads per hour for non-authenticated

    const limits = {
      admin: 50000, // Unlimited for admins
      premium: 10000, // 10k downloads per hour for premium
      user: 1000, // 1k downloads per hour for regular users
    };

    return limits[req.user.role] || 1000;
  },
  message: "Too many QR code downloads, please try again later",
  keyGenerator: (req) => {
    return req.user
      ? `qr_download:user:${req.user.id}`
      : `qr_download:ip:${ipKeyGenerator(req)}`;
  },
});

const dynamicLimiter = (req, res, next) => {
  const endpoint = req.route?.path || req.path;
  const method = req.method;

  const limits = {
    "POST:/api/auth/login": authLimiter,
    "POST:/api/auth/register": authLimiter,
    "POST:/api/auth/forgot-password": passwordResetLimiter,
    "POST:/api/urls": urlCreationLimiter,
    "GET:/api/*": apiLimiter,
  };

  const key = `${method}:${endpoint}`;
  const limiter = limits[key] || generalLimiter;

  limiter(req, res, next);
};

const bypassLimiter = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return generalLimiter(req, res, next);
};

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  loginLimiter,
  urlCreationLimiter,
  apiLimiter,
  redirectLimiter,
  strictAuthLimiter,
  passwordResetLimiter,
  otpVerificationLimiter,
  qrDownloadLimiter,
  dynamicLimiter,
  bypassLimiter,
};
