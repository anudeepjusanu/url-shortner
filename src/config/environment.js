require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener',
  
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: process.env.REDIS_DB || 0,
  
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  RATE_LIMIT: parseInt(process.env.RATE_LIMIT) || 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
  
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  
  DEFAULT_SHORT_CODE_LENGTH: parseInt(process.env.DEFAULT_SHORT_CODE_LENGTH) || 6,
  MAX_SHORT_CODE_LENGTH: parseInt(process.env.MAX_SHORT_CODE_LENGTH) || 12,
  MIN_SHORT_CODE_LENGTH: parseInt(process.env.MIN_SHORT_CODE_LENGTH) || 4,
  
  CACHE_TTL: {
    URL_CACHE: parseInt(process.env.URL_CACHE_TTL) || 3600,
    ANALYTICS_CACHE: parseInt(process.env.ANALYTICS_CACHE_TTL) || 300,
    USER_CACHE: parseInt(process.env.USER_CACHE_TTL) || 1800,
  },
  
  SECURITY: {
    ENABLE_HTTPS: process.env.ENABLE_HTTPS === 'true',
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    COOKIE_SECURE: process.env.NODE_ENV === 'production',
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'strict',
  },
  
  ANALYTICS: {
    TRACK_CLICKS: process.env.TRACK_CLICKS !== 'false',
    TRACK_GEOLOCATION: process.env.TRACK_GEOLOCATION !== 'false',
    TRACK_USER_AGENT: process.env.TRACK_USER_AGENT !== 'false',
    TRACK_REFERRER: process.env.TRACK_REFERRER !== 'false',
  },
  
  ADMIN: {
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },

  // SMTP Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'LaghhuLink',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ''
};

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const validateConfig = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Running in development mode with default values');
    }
  }
  
  if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'your-secret-key' || config.JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
      console.error('❌ Default JWT secrets detected in production!');
      process.exit(1);
    }
  }
};

validateConfig();

module.exports = config;