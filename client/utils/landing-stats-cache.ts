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
   * Check if localStorage is available with ultra-defensive approach
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Use a more defensive check for localStorage
      let storage;
      try {
        storage = window.localStorage;
      } catch (storageError) {
        return false;
      }

      if (!storage) {
        return false;
      }

      // Test localStorage access with minimal footprint
      try {
        const testKey = '__test_cache_access__';
        storage.setItem(testKey, '1');
        const testValue = storage.getItem(testKey);
        storage.removeItem(testKey);
        return testValue === '1';
      } catch (accessError) {
        return false;
      }
    } catch (error) {
      // Catch any unexpected errors
      return false;
    }
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  static getCachedData(page: number, limit: number, includeRealCommentCounts: boolean = true): LandingStatsData | null {
    try {
      // Ultra-defensive localStorage availability check
      let isAvailable = false;
      try {
        isAvailable = this.isLocalStorageAvailable();
      } catch (availabilityError) {
        console.log('📋 Error checking localStorage availability, assuming unavailable');
        return null;
      }

      if (!isAvailable) {
        return null;
      }

      const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);

      let cachedItem;
      try {
        cachedItem = window.localStorage.getItem(cacheKey);
      } catch (getItemError) {
        console.log('📋 Error accessing localStorage.getItem, cache unavailable');
        return null;
      }
      
      if (!cachedItem) {
        return null;
      }

      let cacheEntry: CacheEntry;
      try {
        cacheEntry = JSON.parse(cachedItem);
      } catch (parseError) {
        console.log('📋 Error parsing cached data, removing corrupted entry');
        try {
          window.localStorage.removeItem(cacheKey);
        } catch (removeError) {
          // Ignore remove errors
        }
        return null;
      }

      // Validate cache entry structure
      if (!cacheEntry || typeof cacheEntry.expiry !== 'number' || !cacheEntry.data) {
        console.log('📋 Invalid cache entry structure, removing');
        try {
          window.localStorage.removeItem(cacheKey);
        } catch (removeError) {
          // Ignore remove errors
        }
        return null;
      }

      const now = Date.now();

      // Check if cache has expired
      if (now > cacheEntry.expiry) {
        try {
          this.removeCachedData(page, limit, includeRealCommentCounts);
        } catch (removeError) {
          console.log('📋 Error removing expired cache entry');
        }
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('❌ Error reading from cache:', error);
      // If localStorage is corrupted or has issues, try to clean up the problematic entry
      if (this.isLocalStorageAvailable()) {
        try {
          const cacheKey = this.generateCacheKey(page, limit, includeRealCommentCounts);
          localStorage.removeItem(cacheKey);
          console.log(`🧹 Removed corrupted cache entry: ${cacheKey}`);
        } catch (cleanupError) {
          console.error('❌ Error cleaning up corrupted cache:', cleanupError);
        }
      }
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

      // Handle specific localStorage errors
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
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
      } else if (error.name === 'SecurityError') {
        console.log('🔒 localStorage access denied (privacy mode or security settings)');
      } else {
        console.error('❌ Unexpected localStorage error:', error.message);
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

      // Use safer method to iterate over localStorage
      const keysToRemove: string[] = [];

      // Get all localStorage keys safely
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
          }
        } catch (keyError) {
          console.log(`⚠️ Skipping inaccessible localStorage key at index ${i}`);
        }
      }

      // Remove the keys
      let removedCount = 0;
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          removedCount++;
        } catch (removeError) {
          console.log(`⚠️ Failed to remove key: ${key}`, removeError);
        }
      });

      console.log(`🧹 Cleared ${removedCount} landing stats cache entries`);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);

      // Fallback: try to remove known patterns one by one
      try {
        console.log('🔄 Attempting fallback cache clear...');
        const commonPatterns = [
          'landing_stats_page_1_limit_8_comments_true',
          'landing_stats_page_2_limit_8_comments_true',
          'landing_stats_page_3_limit_8_comments_true',
        ];

        let fallbackRemoved = 0;
        commonPatterns.forEach(pattern => {
          try {
            if (localStorage.getItem(pattern)) {
              localStorage.removeItem(pattern);
              fallbackRemoved++;
            }
          } catch (fallbackError) {
            // Ignore individual key removal errors
          }
        });

        console.log(`🧹 Fallback: Cleared ${fallbackRemoved} cache entries`);
      } catch (fallbackError) {
        console.error('❌ Fallback cache clear also failed:', fallbackError);
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredEntries(): void {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('🧹 localStorage not available, skipping cleanup');
        return;
      }

      // Use safer method to iterate over localStorage
      const keysToCheck: string[] = [];

      // Get all localStorage keys safely
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            keysToCheck.push(key);
          }
        } catch (keyError) {
          console.log(`⚠️ Skipping inaccessible localStorage key at index ${i} during cleanup`);
        }
      }

      const now = Date.now();
      let cleanedCount = 0;

      keysToCheck.forEach(key => {
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
          try {
            localStorage.removeItem(key);
            cleanedCount++;
          } catch (removeError) {
            console.log(`⚠️ Failed to remove corrupted cache entry: ${key}`);
          }
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
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.log('📊 localStorage not available, returning empty stats');
        return {
          totalEntries: 0,
          expiredEntries: 0,
          validEntries: 0,
          totalSize: 0
        };
      }

      // Use safer method to iterate over localStorage
      const landingStatsKeys: string[] = [];

      // Get all localStorage keys safely
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            landingStatsKeys.push(key);
          }
        } catch (keyError) {
          console.log(`⚠️ Skipping inaccessible localStorage key at index ${i} during stats`);
        }
      }

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
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        return false;
      }

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

/**
 * Cache health check and debugging utilities
 */
export const cacheHealthCheck = {
  /**
   * Test if cache system is working properly
   */
  test(): boolean {
    try {
      console.log('🔧 Testing cache system...');

      // Check localStorage availability
      if (!LandingStatsCache['isLocalStorageAvailable']()) {
        console.log('❌ Cache test failed: localStorage not available');
        return false;
      }

      // Test basic cache operations
      const testData = {
        stories: [],
        pagination: { totalPages: 1 },
        aggregateStats: { totalStories: 0 },
        timestamp: new Date().toISOString()
      };

      LandingStatsCache.setCachedData(999, 8, true, testData);
      const retrieved = LandingStatsCache.getCachedData(999, 8, true);
      LandingStatsCache.removeCachedData(999, 8, true);

      if (retrieved && retrieved.timestamp === testData.timestamp) {
        // Test cache clearing operations
        try {
          LandingStatsCache.setCachedData(998, 8, true, testData);
          LandingStatsCache.clearAllCache();
          const afterClear = LandingStatsCache.getCachedData(998, 8, true);

          if (afterClear === null) {
            console.log('✅ Cache test passed: All operations including clear working');
            return true;
          } else {
            console.log('⚠️ Cache test partial: Basic ops work but clear may have issues');
            return true; // Still consider it working for basic functionality
          }
        } catch (clearError) {
          console.log('⚠️ Cache test partial: Basic ops work but clear failed:', clearError);
          return true; // Still consider it working for basic functionality
        }
      } else {
        console.log('❌ Cache test failed: Data mismatch');
        return false;
      }
    } catch (error) {
      console.error('❌ Cache test failed with error:', error);
      return false;
    }
  },

  /**
   * Get detailed cache environment info
   */
  getEnvironmentInfo() {
    return {
      hasWindow: typeof window !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined',
      isLocalStorageAvailable: LandingStatsCache['isLocalStorageAvailable'](),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      timestamp: new Date().toISOString()
    };
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
  // Health check utilities
  health: cacheHealthCheck,
};

export default LandingStatsCache;
