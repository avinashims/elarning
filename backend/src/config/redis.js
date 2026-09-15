const Redis = require('ioredis');
const config = require('./index');

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
  }
  return redis;
}

async function connectRedis() {
  const client = getRedis();
  try {
    await client.connect();
    console.log('Redis connected');
  } catch (err) {
    if (err.message !== 'Redis is already connecting/connected') {
      console.warn('Redis unavailable, caching disabled:', err.message);
    }
  }
}

module.exports = { getRedis, connectRedis };
