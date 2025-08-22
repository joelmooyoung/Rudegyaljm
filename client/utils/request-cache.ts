// Request deduplication utility to prevent multiple concurrent calls to the same API
class RequestCache {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  async fetch<T>(
    url: string, 
    options: RequestInit = {}, 
    ttlMs: number = 30000 // 30 seconds default TTL
  ): Promise<T> {
    const cacheKey = this.createCacheKey(url, options);

    // Check if we have a cached result that's still valid
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📋 Using cached result for ${url}`);
      return cached.data;
    }

    // Check if there's already a pending request for this URL
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ Deduplicating request for ${url}`);
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    console.log(`🔄 Making new request for ${url}`);
    const requestPromise = this.makeRequest<T>(url, options, ttlMs, cacheKey);
    
    // Store the pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from pending requests when done
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit, 
    ttlMs: number, 
    cacheKey: string
  ): Promise<T> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result if successful
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    return data;
  }

  private createCacheKey(url: string, options: RequestInit): string {
    // Create a cache key from URL and relevant options
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Clear expired cache entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats for debugging
  getStats(): { cacheSize: number; pendingRequests: number } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  requestCache.clearExpired();
}, 5 * 60 * 1000);
