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

// Connect immediately
redis.connect().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err.message);
});

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

// In-memory fallback cache used when Redis is unavailable (e.g. local dev)
const memoryCache = new Map();

const isRedisReady = () => redis.status === 'ready';

const cacheGet = async (key) => {
  if (isRedisReady()) {
    try {
      const result = await redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Cache get error (Redis):', error);
    }
  }
  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const cacheSet = async (key, value, ttl = 3600) => {
  if (isRedisReady()) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error (Redis):', error);
    }
  }
  // Memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
  return true;
};

const cacheDel = async (key) => {
  if (isRedisReady()) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error (Redis):', error);
    }
  }
  memoryCache.delete(key);
  return true;
};

const cacheExists = async (key) => {
  if (isRedisReady()) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error (Redis):', error);
    }
  }
  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return false;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return false;
  }
  return true;
};

module.exports = {
  redis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheExists
};