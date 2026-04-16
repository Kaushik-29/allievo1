const env = require('./env');

let redis = null;

try {
  const Redis = require('ioredis');
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.warn('⚠ Redis error:', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });
} catch (err) {
  console.warn('⚠ Redis not available. Session/cache will use in-memory fallback.');
}

// In-memory fallback cache
const memoryCache = new Map();

const cache = {
  async get(key) {
    try {
      if (redis && redis.status === 'ready') {
        const val = await redis.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (e) { /* fallthrough */ }
    const item = memoryCache.get(key);
    if (item && item.expiry > Date.now()) return item.value;
    memoryCache.delete(key);
    return null;
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (redis && redis.status === 'ready') {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      }
    } catch (e) { /* fallthrough */ }
    memoryCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  },

  async del(key) {
    try {
      if (redis && redis.status === 'ready') {
        await redis.del(key);
        return;
      }
    } catch (e) { /* fallthrough */ }
    memoryCache.delete(key);
  },
};

async function testConnection() {
  try {
    if (!redis) return false;
    await redis.connect();
    await redis.ping();
    return true;
  } catch (err) {
    console.warn('⚠ Redis connection failed. Using in-memory cache.');
    return false;
  }
}

module.exports = { redis, cache, testConnection };
