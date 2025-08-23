// Client-side caching utility for landing page statistics
// Implements localStorage caching with 5-minute expiration

interface LandingStatsData {
  stories: any[];
  pagination: any;
  aggregateStats: any;
  performance?: any;
  timestamp: string;
}

interface CacheEntry {
  data: LandingStatsData;
  expiry: number;
  cacheKey: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_PREFIX = 'landing_stats_';

export class LandingStatsCache {
  private static generateCacheKey(page: number, limit: number, includeRealCommentCounts: boolean): string {
    return `${CACHE_PREFIX}page_${page}_limit_${limit}_comments_${includeRealCommentCounts}`;
  }

  /**
   * Check if localStorage is available
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
      }
      // Test localStorage access
      const testKey = '__cache_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  static getCachedData(page: number, limit: number, includeRealCommentCounts: boolean = true): LandingStatsData | null {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('📋 localStorage not available, skipping cache check');
        return null;
      }

      const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
      console.log(`📋 Checking cache for: ${cacheKey}`);

      const cachedItem = localStorage.getItem(cacheKey);
      
      if (!cachedItem) {
        console.log(`🔍 No cache found for: ${cacheKey}`);
        return null;
      }

      const cacheEntry: CacheEntry = JSON.parse(cachedItem);
      const now = Date.now();

      // Check if cache has expired
      if (now > cacheEntry.expiry) {
        console.log(`⏰ Cache expired for: ${cacheKey} (expired ${((now - cacheEntry.expiry) / 1000).toFixed(1)}s ago)`);
        this.removeCachedData(page, limit, includeRealCommentCounts);
        return null;
      }

      const timeRemaining = (cacheEntry.expiry - now) / 1000;
      console.log(`✅ Cache hit for: ${cacheKey} (${timeRemaining.toFixed(1)}s remaining)`);
      
      return cacheEntry.data;
    } catch (error) {
      console.error('❌ Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Store data in cache with expiration
   */
  static setCachedData(
    page: number,
    limit: number,
    includeRealCommentCounts: boolean,
    data: LandingStatsData
  ): void {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('💾 localStorage not available, skipping cache write');
        return;
      }

      const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
      const expiry = Date.now() + CACHE_DURATION;
      
      const cacheEntry: CacheEntry = {
        data,
        expiry,
        cacheKey
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log(`💾 Cached data for: ${cacheKey} (expires in ${CACHE_DURATION / 1000}s)`);
      
      // Clean up old cache entries to prevent localStorage bloat
      this.cleanupExpiredEntries();
    } catch (error) {
      console.error('❌ Error writing to cache:', error);
      
      // If localStorage is full, try to clear expired entries and retry
      if (error.name === 'QuotaExceededError') {
        console.log('🧹 LocalStorage quota exceeded, cleaning up...');
        this.cleanupExpiredEntries();
        try {
          const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
          const cacheEntry: CacheEntry = {
            data,
            expiry: Date.now() + CACHE_DURATION,
            cacheKey
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
          console.log(`💾 Cached data after cleanup: ${cacheKey}`);
        } catch (retryError) {
          console.error('❌ Failed to cache even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Remove specific cached data
   */
  static removeCachedData(page: number, limit: number, includeRealCommentCounts: boolean): void {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('🗑️ localStorage not available, skipping cache removal');
        return;
      }

      const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Removed cache for: ${cacheKey}`);
    } catch (error) {
      console.error('❌ Error removing from cache:', error);
    }
  }

  /**
   * Clear all landing stats cache
   */
  static clearAllCache(): void {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('🧹 localStorage not available, skipping cache clear');
        return;
      }

      const keys = Object.keys(localStorage);
      const landingStatsKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      landingStatsKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`🧹 Cleared ${landingStatsKeys.length} landing stats cache entries`);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const landingStatsKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = Date.now();
      let cleanedCount = 0;

      landingStatsKeys.forEach(key => {
        try {
          const cachedItem = localStorage.getItem(key);
          if (cachedItem) {
            const cacheEntry: CacheEntry = JSON.parse(cachedItem);
            if (now > cacheEntry.expiry) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
    totalSize: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      const landingStatsKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = Date.now();
      
      let expiredCount = 0;
      let validCount = 0;
      let totalSize = 0;

      landingStatsKeys.forEach(key => {
        try {
          const cachedItem = localStorage.getItem(key);
          if (cachedItem) {
            totalSize += cachedItem.length;
            const cacheEntry: CacheEntry = JSON.parse(cachedItem);
            if (now > cacheEntry.expiry) {
              expiredCount++;
            } else {
              validCount++;
            }
          }
        } catch (error) {
          expiredCount++; // Count unparseable entries as expired
        }
      });

      return {
        totalEntries: landingStatsKeys.length,
        expiredEntries: expiredCount,
        validEntries: validCount,
        totalSize
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        validEntries: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Check if data should be considered fresh (less than 2.5 minutes old)
   * Useful for deciding whether to show a refresh indicator
   */
  static isCacheFresh(page: number, limit: number, includeRealCommentCounts: boolean): boolean {
    try {
      const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
      const cachedItem = localStorage.getItem(cacheKey);
      
      if (!cachedItem) return false;

      const cacheEntry: CacheEntry = JSON.parse(cachedItem);
      const now = Date.now();
      const halfExpiryTime = cacheEntry.expiry - (CACHE_DURATION / 2);
      
      return now < halfExpiryTime;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Remote cache invalidation support
 * Allows server to signal cache clear via API
 */
export const remoteCacheInvalidation = {
  /**
   * Clear cache based on server invalidation signal
   */
  async checkAndClearIfInvalidated(): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/clear-landing-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.instructions?.clearAll) {
          console.log('🌐 Server requested cache clear, clearing all landing stats cache');
          LandingStatsCache.clearAllCache();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking cache invalidation:', error);
      return false;
    }
  },

  /**
   * Set up periodic check for cache invalidation (every 2 minutes)
   */
  setupPeriodicCheck(): () => void {
    const interval = setInterval(() => {
      remoteCacheInvalidation.checkAndClearIfInvalidated();
    }, 2 * 60 * 1000); // Check every 2 minutes

    // Return cleanup function
    return () => clearInterval(interval);
  }
};

// Export convenience functions for common operations
export const landingStatsCache = {
  get: LandingStatsCache.getCachedData,
  set: LandingStatsCache.setCachedData,
  remove: LandingStatsCache.removeCachedData,
  clear: LandingStatsCache.clearAllCache,
  cleanup: LandingStatsCache.cleanupExpiredEntries,
  stats: LandingStatsCache.getCacheStats,
  isFresh: LandingStatsCache.isCacheFresh,
  // Remote invalidation
  remote: remoteCacheInvalidation,
};

export default LandingStatsCache;
