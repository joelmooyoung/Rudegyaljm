<<<<<<< HEAD
// Redis import will be done conditionally when needed
=======
import { createClient } from "redis";
>>>>>>> refs/remotes/origin/main

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 10 * 60 * 1000, // 10 minutes in milliseconds
  STATS_TTL: 8 * 60 * 1000, // 8 minutes for stats
  SHORT_TTL: 5 * 60 * 1000, // 5 minutes for frequently changing data
  USE_REDIS: process.env.REDIS_URL ? true : false,
  REDIS_URL: process.env.REDIS_URL,
};

class CacheManager {
  constructor() {
    this.inMemoryCache = new Map();
    this.redisClient = null;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      errors: 0,
    };

    if (CACHE_CONFIG.USE_REDIS) {
      this.initRedis();
    }

    console.log(
      `[CACHE MANAGER] Initialized with ${CACHE_CONFIG.USE_REDIS ? "Redis" : "in-memory"} backend`,
    );
  }

  async initRedis() {
    try {
      // Dynamically import Redis only when needed
      const { createClient } = await import('redis');

      this.redisClient = createClient({
        url: CACHE_CONFIG.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      this.redisClient.on("error", (err) => {
        console.error("[CACHE MANAGER] Redis error:", err);
        this.cacheStats.errors++;
        // Fallback to in-memory cache
        this.redisClient = null;
      });

      this.redisClient.on("connect", () => {
        console.log("[CACHE MANAGER] ✅ Redis connected successfully");
      });

      await this.redisClient.connect();
    } catch (error) {
<<<<<<< HEAD
      console.warn('[CACHE MANAGER] Redis not available or connection failed, falling back to in-memory cache:', error);
=======
      console.warn(
        "[CACHE MANAGER] Redis connection failed, falling back to in-memory cache:",
        error,
      );
>>>>>>> refs/remotes/origin/main
      this.redisClient = null;
    }
  }

  async get(key) {
    try {
      if (this.redisClient) {
        return await this.getFromRedis(key);
      } else {
        return this.getFromMemory(key);
      }
    } catch (error) {
      console.error(`[CACHE MANAGER] Error getting key ${key}:`, error);
      this.cacheStats.errors++;
      return null;
    }
  }

  async set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    try {
      if (this.redisClient) {
        await this.setInRedis(key, value, ttl);
      } else {
        this.setInMemory(key, value, ttl);
      }
      console.log(`[CACHE MANAGER] ✅ Cached ${key} with TTL ${ttl}ms`);
    } catch (error) {
      console.error(`[CACHE MANAGER] Error setting key ${key}:`, error);
      this.cacheStats.errors++;
    }
  }

  async invalidate(key) {
    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.inMemoryCache.delete(key);
      }
      this.cacheStats.invalidations++;
      console.log(`[CACHE MANAGER] ✅ Invalidated cache key: ${key}`);
    } catch (error) {
      console.error(`[CACHE MANAGER] Error invalidating key ${key}:`, error);
      this.cacheStats.errors++;
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.cacheStats.invalidations += keys.length;
          console.log(
            `[CACHE MANAGER] ✅ Invalidated ${keys.length} keys matching pattern: ${pattern}`,
          );
        }
      } else {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        let invalidatedCount = 0;
        for (const key of this.inMemoryCache.keys()) {
          if (regex.test(key)) {
            this.inMemoryCache.delete(key);
            invalidatedCount++;
          }
        }
        this.cacheStats.invalidations += invalidatedCount;
        console.log(
          `[CACHE MANAGER] ✅ Invalidated ${invalidatedCount} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      console.error(
        `[CACHE MANAGER] Error invalidating pattern ${pattern}:`,
        error,
      );
      this.cacheStats.errors++;
    }
  }

  async clear() {
    try {
      if (this.redisClient) {
        await this.redisClient.flushDb();
      } else {
        this.inMemoryCache.clear();
      }
      console.log("[CACHE MANAGER] ✅ Cache cleared completely");
    } catch (error) {
      console.error("[CACHE MANAGER] Error clearing cache:", error);
      this.cacheStats.errors++;
    }
  }

  // In-memory cache methods
  getFromMemory(key) {
    const cached = this.inMemoryCache.get(key);
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.inMemoryCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    return cached.value;
  }

  setInMemory(key, value, ttl) {
    const expiresAt = Date.now() + ttl;
    this.inMemoryCache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      // 10% chance on each set
      this.cleanupExpiredMemoryEntries();
    }
  }

  cleanupExpiredMemoryEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.inMemoryCache.entries()) {
      if (now > cached.expiresAt) {
        this.inMemoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[CACHE MANAGER] 🧹 Cleaned up ${cleanedCount} expired memory entries`,
      );
    }
  }

  // Redis cache methods
  async getFromRedis(key) {
    const cached = await this.redisClient.get(key);
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    return JSON.parse(cached);
  }

  async setInRedis(key, value, ttl) {
    const ttlSeconds = Math.ceil(ttl / 1000);
    await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  // Cache invalidation triggers for specific events
  async invalidateStatsCache() {
    await this.invalidatePattern("stats:*");
    await this.invalidatePattern("dashboard:*");
    await this.invalidatePattern("landing:*");
    console.log("[CACHE MANAGER] 📊 Invalidated all statistics caches");
  }

  async invalidateUserCache() {
    await this.invalidatePattern("users:*");
    await this.invalidateStatsCache(); // User changes affect stats
    console.log("[CACHE MANAGER] 👥 Invalidated user caches");
  }

  async invalidateStoryCache() {
    await this.invalidatePattern("stories:*");
    await this.invalidateStatsCache(); // Story changes affect stats
    console.log("[CACHE MANAGER] 📚 Invalidated story caches");
  }

  async invalidateEngagementCache() {
    await this.invalidatePattern("engagement:*");
    await this.invalidateStatsCache(); // Engagement changes affect stats
    console.log("[CACHE MANAGER] 💬 Invalidated engagement caches");
  }

  // Cache key generators
  getDashboardStatsKey(variant = "default") {
    return `dashboard:stats:${variant}`;
  }

  getLandingStatsKey(page = 1, limit = 8) {
    return `landing:stats:page:${page}:limit:${limit}`;
  }

  getUserStatsKey(userId = "all") {
    return `users:stats:${userId}`;
  }

  getStoryStatsKey(storyId = "all") {
    return `stories:stats:${storyId}`;
  }

  // Cache statistics and health
  getStats() {
    const hitRate =
      this.cacheStats.hits + this.cacheStats.misses > 0
        ? (
            (this.cacheStats.hits /
              (this.cacheStats.hits + this.cacheStats.misses)) *
            100
          ).toFixed(1)
        : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      backend: this.redisClient ? "Redis" : "Memory",
      memoryEntries: this.inMemoryCache.size,
      isRedisConnected: this.redisClient ? this.redisClient.isReady : false,
      config: {
        defaultTtl: `${CACHE_CONFIG.DEFAULT_TTL / 1000}s`,
        statsTtl: `${CACHE_CONFIG.STATS_TTL / 1000}s`,
        useRedis: CACHE_CONFIG.USE_REDIS,
      },
    };
  }

  // Health check
  async healthCheck() {
    try {
      const testKey = "health:check";
      const testValue = { timestamp: Date.now() };

      await this.set(testKey, testValue, 1000); // 1 second TTL
      const retrieved = await this.get(testKey);

      const isHealthy =
        retrieved && retrieved.timestamp === testValue.timestamp;

      return {
        healthy: isHealthy,
        backend: this.redisClient ? "Redis" : "Memory",
        stats: this.getStats(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        backend: this.redisClient ? "Redis" : "Memory",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
const cacheManager = new CacheManager();

// Export configuration and utilities
export default cacheManager;
export { CACHE_CONFIG };

// Export invalidation trigger functions for use in API endpoints
export const triggerUserCacheInvalidation = () =>
  cacheManager.invalidateUserCache();
export const triggerStoryCacheInvalidation = () =>
  cacheManager.invalidateStoryCache();
export const triggerEngagementCacheInvalidation = () =>
  cacheManager.invalidateEngagementCache();
export const triggerStatsCacheInvalidation = () =>
  cacheManager.invalidateStatsCache();
