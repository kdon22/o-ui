/**
 * Cache Manager - 2-Minute Freshness System
 * 
 * Provides in-memory caching with automatic expiration for action responses.
 * Works alongside IndexedDB for multi-tier caching strategy.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly FRESHNESS_WINDOW = 2 * 60 * 1000; // 2 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.FRESHNESS_WINDOW;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Debug utilities
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
} 