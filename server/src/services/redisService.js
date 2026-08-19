import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let client = null;
let isConnected = false;

// In-memory fallback cache in case Redis is not running
const fallbackCache = new Map();

try {
  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 1) {
          return new Error('Redis connection retry limit reached');
        }
        return 500;
      },
      connectTimeout: 2000
    }
  });

  let errorLogged = false;
  client.on('error', (err) => {
    if (!errorLogged) {
      console.warn('ℹ️ Redis offline, using high-performance in-memory cache.');
      errorLogged = true;
    }
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('🔌 Redis Client Connected');
    isConnected = true;
  });

  client.connect().catch(() => {
    isConnected = false;
  });
} catch (error) {
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
