#!/usr/bin/env node

const redis = require('redis');

async function clearRateLimits() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await client.connect();
    console.log('Connected to Redis');

    // Clear all rate limit keys
    const keys = await client.keys('*auth*');
    console.log('Found auth rate limit keys:', keys);

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} rate limit keys`);
    }

    // Also clear any strict auth keys
    const strictKeys = await client.keys('*strict_auth*');
    console.log('Found strict auth keys:', strictKeys);

    if (strictKeys.length > 0) {
      await client.del(strictKeys);
      console.log(`Cleared ${strictKeys.length} strict auth keys`);
    }

    await client.quit();
    console.log('Rate limits cleared successfully');
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    process.exit(1);
  }
}

clearRateLimits();