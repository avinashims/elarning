const { getRedis } = require('../config/redis');

const CACHE_TTL = 300;

async function cacheGet(key) {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttl = CACHE_TTL) {
  try {
    const redis = getRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // silently fail if redis unavailable
  }
}

async function cacheDel(pattern) {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // silently fail
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };
