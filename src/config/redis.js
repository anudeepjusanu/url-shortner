const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('🔗 Redis connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

const gracefulShutdown = async () => {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

const cacheGet = async (key) => {
  try {
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, ttl = 3600) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const cacheDel = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const cacheExists = async (key) => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
};

module.exports = {
  redis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheExists
};