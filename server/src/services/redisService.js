import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let client = null;
let isConnected = false;

// In-memory fallback cache in case Redis is not running
const fallbackCache = new Map();

try {
  client = createClient({ url: redisUrl });

  client.on('error', (err) => {
    console.warn('⚠️ Redis Client Error:', err.message);
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('🔌 Redis Client Connected');
    isConnected = true;
  });

  client.connect().catch((error) => {
    console.warn('⚠️ Could not connect to Redis. Falling back to in-memory cache:', error.message);
    isConnected = false;
  });
} catch (error) {
  console.warn('⚠️ Could not connect to Redis. Falling back to in-memory cache:', error.message);
  isConnected = false;
}

export const cacheService = {
  async get(key) {
    if (isConnected && client) {
      try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        console.error('Redis GET Error:', err);
      }
    }
    // Fallback
    const item = fallbackCache.get(key);
    if (item) {
      if (item.expiry && Date.now() > item.expiry) {
        fallbackCache.delete(key);
        return null;
      }
      return item.value;
    }
    return null;
  },

  async set(key, value, ttlSeconds = 86400) {
    if (isConnected && client) {
      try {
        await client.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
        });
        return true;
      } catch (err) {
        console.error('Redis SET Error:', err);
      }
    }
    // Fallback
    fallbackCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  async del(key) {
    if (isConnected && client) {
      try {
        await client.del(key);
        return true;
      } catch (err) {
        console.error('Redis DEL Error:', err);
      }
    }
    // Fallback
    fallbackCache.delete(key);
    return true;
  },

  async flush() {
    if (isConnected && client) {
      try {
        await client.flushDb();
        return true;
      } catch (err) {
        console.error('Redis FLUSH Error:', err);
      }
    }
    // Fallback
    fallbackCache.clear();
    return true;
  }
};

export default cacheService;
