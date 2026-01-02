#!/usr/bin/env node

const redis = require('redis');

async function clearRateLimits() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await client.connect();
    console.log('Connected to Redis');

    // Clear all rate limit related keys
    const patterns = ['*auth*', '*strict_auth*', '*url_creation*', '*api:*', '*redirect:*', '*password_reset*', '*rl:*'];
    
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys matching ${pattern}`);
        await client.del(keys);
        console.log(`Cleared ${keys.length} keys`);
      }
    }

    await client.quit();
    console.log('All rate limits cleared successfully');
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    process.exit(1);
  }
}

clearRateLimits();