require("dotenv").config();
const logger = require("./logger");

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "0.0.0.0",

  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/url-shortener",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: process.env.REDIS_DB || 0,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  RATE_LIMIT: parseInt(process.env.RATE_LIMIT) || 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"],

  BASE_URL: process.env.BASE_URL || "http://localhost:3000",

  DEFAULT_SHORT_CODE_LENGTH:
    parseInt(process.env.DEFAULT_SHORT_CODE_LENGTH) || 6,
  MAX_SHORT_CODE_LENGTH: parseInt(process.env.MAX_SHORT_CODE_LENGTH) || 16,
  MIN_SHORT_CODE_LENGTH: parseInt(process.env.MIN_SHORT_CODE_LENGTH) || 4,

  CACHE_TTL: {
    URL_CACHE: parseInt(process.env.URL_CACHE_TTL) || 3600,
    ANALYTICS_CACHE: parseInt(process.env.ANALYTICS_CACHE_TTL) || 300,
    USER_CACHE: parseInt(process.env.USER_CACHE_TTL) || 1800,
  },

  SECURITY: {
    ENABLE_HTTPS: process.env.ENABLE_HTTPS === "true",
    TRUST_PROXY: process.env.TRUST_PROXY === "true",
    COOKIE_SECURE: process.env.NODE_ENV === "production",
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "strict",
  },

  ANALYTICS: {
    TRACK_CLICKS: process.env.TRACK_CLICKS !== "false",
    TRACK_GEOLOCATION: process.env.TRACK_GEOLOCATION !== "false",
    TRACK_USER_AGENT: process.env.TRACK_USER_AGENT !== "false",
    TRACK_REFERRER: process.env.TRACK_REFERRER !== "false",
  },

  ADMIN: {
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
  },

  GOOGLE_AUTH: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID || "",
    ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID || "",
  },

  SMTP_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.EMAIL_PORT || process.env.SMTP_PORT,
  SMTP_SECURE: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === "true",
  SMTP_USER: process.env.EMAIL_USER || process.env.SMTP_USER,
  SMTP_PASS: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  SMTP_FROM: process.env.EMAIL_FROM || process.env.SMTP_FROM,
};

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

// JWT_SECRET/JWT_REFRESH_SECRET no longer have insecure hardcoded fallbacks,
// so a missing value must fail startup in every environment, not just
// production — otherwise the app would either run unauthenticatable or (if a
// fallback existed) sign tokens with a guessable secret.
const requiredSecrets = ["JWT_SECRET", "JWT_REFRESH_SECRET"];

const validateConfig = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    logger.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => logger.error(`   - ${envVar}`));

    const missingSecrets = missing.filter((envVar) =>
      requiredSecrets.includes(envVar),
    );

    if (config.NODE_ENV === "production" || missingSecrets.length > 0) {
      process.exit(1);
    } else {
      logger.warn("⚠️ Running in development mode with default values");
    }
  }
};

validateConfig();

module.exports = config;
