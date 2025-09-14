/**
 * Hybrid Cache Manager
 * 
 * Orchestrates 3-tier caching: Memory → IndexedDB → Real-time computation
 * Provides sub-millisecond response times with bulletproof fallbacks.
 */

import type {
  NodeInheritanceData,
  CacheEntry,
  CacheStats,
  InvalidationEvent,
  BranchContext
} from './types'
import { NodeInheritanceEngine } from './engine'

export class HybridCacheManager {
  private memoryCache = new Map<string, CacheEntry>()
  private engine: NodeInheritanceEngine
  private stats: CacheStats = {
    memoryHits: 0,
    indexedDBHits: 0,
    computationMisses: 0,
    totalRequests: 0,
    averageResponseTime: 0
  }

  // IndexedDB connection (lazy-loaded)
  private indexedDB: IDBDatabase | null = null
  private readonly DB_NAME = 'NodeInheritanceCache'
  private readonly DB_VERSION = 1
  private readonly STORE_NAME = 'inheritance'

  constructor() {
    this.engine = new NodeInheritanceEngine()
    
    // Only initialize IndexedDB on client-side
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      // Guard against environments where opening the backing store fails
      this.initializeIndexedDB().catch(() => {
        // Disable IndexedDB tier and fall back to memory/compute only
        this.indexedDB = null
        console.warn('⚠️ [HybridCache] Disabling IndexedDB cache (open failed). Falling back to memory only.')
      })
    } else {
      console.log('🔍 [HybridCache] Skipping IndexedDB initialization (SSR or no IndexedDB support)')
    }
  }

  // ============================================================================
  // MAIN CACHE INTERFACE
  // ============================================================================

  /**
   * Gets inheritance data with 3-tier fallback strategy
   */
  async getInheritance(
    nodeId: string,
    rawDataFetcher: () => Promise<any>,
    branchContext: BranchContext
  ): Promise<NodeInheritanceData> {
    const startTime = performance.now()
    this.stats.totalRequests++

    console.log('🚀 [HybridCache] Starting inheritance lookup:', {
      nodeId,
      branchId: branchContext.currentBranchId,
      tenantId: branchContext.tenantId,
      timestamp: new Date().toISOString()
    })

    try {
      // TIER 1: Memory cache (0ms)
      const memoryResult = this.getFromMemory(nodeId)
      if (memoryResult) {
        this.stats.memoryHits++
        this.updateResponseTime(startTime)
        console.log('⚡ [HybridCache] Memory hit for:', nodeId, '(0ms)', {
          ancestorChain: memoryResult.data?.ancestorChain,
          ruleCount: memoryResult.data?.availableRules?.length || 0,
          processCount: memoryResult.data?.availableProcesses?.length || 0
        })
        return memoryResult.data
      }

      console.log('🔍 [HybridCache] Memory miss, checking IndexedDB for:', nodeId)

      // TIER 2: IndexedDB cache (5ms)
      const indexedDBResult = await this.getFromIndexedDB(nodeId)
      if (indexedDBResult) {
        this.stats.indexedDBHits++
        // Promote to memory cache
        this.setInMemory(nodeId, indexedDBResult)
        this.updateResponseTime(startTime)
        console.log('💾 [HybridCache] IndexedDB hit for:', nodeId, `(${Math.round(performance.now() - startTime)}ms)`, {
          ancestorChain: indexedDBResult.ancestorChain,
          ruleCount: indexedDBResult.availableRules?.length || 0,
          processCount: indexedDBResult.availableProcesses?.length || 0,
          computedAt: indexedDBResult.computedAt,
          cacheVersion: indexedDBResult.cacheVersion
        })
        return indexedDBResult
      }

      // TIER 3: Real-time computation (50ms)
      console.log('🔄 [HybridCache] Cache miss, computing fresh inheritance for:', nodeId)
      this.stats.computationMisses++
      
      console.log('📡 [HybridCache] Fetching raw data...')
      const rawData = await rawDataFetcher()
      
      console.log('🧮 [HybridCache] Calling InheritanceEngine.computeInheritance...')
      const computedData = await this.engine.computeInheritance(nodeId, rawData, branchContext)
      
      // Cache in both tiers for future requests
      await this.setInAllCaches(nodeId, computedData)
      
      this.updateResponseTime(startTime)
      console.log('✅ [HybridCache] Computed and cached for:', nodeId, `(${Math.round(performance.now() - startTime)}ms)`, {
        ancestorChain: computedData.ancestorChain,
        ruleCount: computedData.availableRules?.length || 0,
        processCount: computedData.availableProcesses?.length || 0
      })
      
      return computedData

    } catch (error) {
      console.error('❌ [HybridCache] Error getting inheritance:', error)
      throw error
    }
  }

  // ============================================================================
  // MEMORY CACHE OPERATIONS
  // ============================================================================

  private getFromMemory(nodeId: string): CacheEntry | null {
    const entry = this.memoryCache.get(nodeId)
    if (!entry) return null

    // Update access statistics
    entry.lastAccessed = Date.now()
    entry.hitCount++

    return entry
  }

  private setInMemory(nodeId: string, data: NodeInheritanceData): void {
    const entry: CacheEntry = {
      nodeId,
      data,
      lastAccessed: Date.now(),
      hitCount: 1
    }

    this.memoryCache.set(nodeId, entry)
    this.cleanupMemoryCache()
  }

  private cleanupMemoryCache(): void {
    // Keep memory cache under 100 entries (roughly 10MB)
    const MAX_MEMORY_ENTRIES = 100
    
    if (this.memoryCache.size <= MAX_MEMORY_ENTRIES) return

    // Remove least recently used entries
    const entries = Array.from(this.memoryCache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
    
    const toRemove = entries.slice(0, entries.length - MAX_MEMORY_ENTRIES)
    toRemove.forEach(([nodeId]) => this.memoryCache.delete(nodeId))

    console.log(`🧹 [HybridCache] Cleaned up ${toRemove.length} memory cache entries`)
  }

  // ============================================================================
  // INDEXEDDB CACHE OPERATIONS
  // ============================================================================

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

        request.onerror = () => {
          console.error('❌ [HybridCache] IndexedDB initialization failed')
          // Resolve (not reject) so the app can continue without the IDB tier
          resolve()
        }

        request.onsuccess = () => {
          this.indexedDB = request.result
          console.log('✅ [HybridCache] IndexedDB initialized')
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          try {
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'nodeId' })
              store.createIndex('computedAt', 'computedAt')
              store.createIndex('cacheVersion', 'cacheVersion')
            }
          } catch (e) {
            console.warn('⚠️ [HybridCache] IndexedDB upgrade failed; disabling cache tier.', e)
          }
        }
      } catch (e) {
        // Safari Private mode and some browsers throw on open()
        console.warn('⚠️ [HybridCache] indexedDB.open threw; disabling cache tier.', e)
        resolve()
      }
    })
  }

  private async getFromIndexedDB(nodeId: string): Promise<NodeInheritanceData | null> {
    if (!this.indexedDB) {
      console.log('🚫 [HybridCache] IndexedDB not available for:', nodeId)
      return null
    }

    console.log('🔍 [HybridCache] Checking IndexedDB for:', nodeId)

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(nodeId)
      
      request.onsuccess = () => {
        const result = request.result
        console.log('📖 [HybridCache] IndexedDB read result for:', nodeId, {
          hasResult: !!result,
          isValid: result ? this.isIndexedDBEntryValid(result) : false,
          computedAt: result?.data?.computedAt,
          ancestorChain: result?.data?.ancestorChain,
          ruleCount: result?.data?.availableRules?.length || 0,
          processCount: result?.data?.availableProcesses?.length || 0
        })
        
        if (result && this.isIndexedDBEntryValid(result)) {
          resolve(result.data)
        } else {
          console.log('❌ [HybridCache] IndexedDB entry invalid or missing for:', nodeId)
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.warn('⚠️ [HybridCache] IndexedDB read error for:', nodeId)
        resolve(null)
      }
    })
  }

  private async setInIndexedDB(nodeId: string, data: NodeInheritanceData): Promise<void> {
    if (!this.indexedDB) return

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const entry = {
        nodeId,
        data,
        storedAt: Date.now()
      }
      
      const request = store.put(entry)
      
      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.warn('⚠️ [HybridCache] IndexedDB write error for:', nodeId)
        resolve()
      }
    })
  }

  private isIndexedDBEntryValid(entry: any): boolean {
    const TTL = 10 * 60 * 1000 // 10 minutes for IndexedDB
    const age = Date.now() - entry.storedAt
    return age < TTL
  }

  // ============================================================================
  // CACHE COORDINATION
  // ============================================================================

  private async setInAllCaches(nodeId: string, data: NodeInheritanceData): Promise<void> {
    // Set in memory cache immediately
    this.setInMemory(nodeId, data)
    
    // Set in IndexedDB asynchronously
    await this.setInIndexedDB(nodeId, data)
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  /**
   * Invalidates cache for affected nodes when data changes
   */
  async invalidateInheritanceChain(
    event: InvalidationEvent,
    getDescendantNodes: (nodeId: string) => Promise<string[]>
  ): Promise<void> {
    console.log('🔄 [HybridCache] Invalidating inheritance chain:', event)

    let affectedNodes: string[] = [event.affectedNodeId]

    // For process/rule changes, invalidate all descendant nodes too
    if (event.type === 'process_change' || event.type === 'rule_change') {
      const descendants = await getDescendantNodes(event.affectedNodeId)
      affectedNodes = [...affectedNodes, ...descendants]
    }

    // Clear from memory cache
    affectedNodes.forEach(nodeId => {
      this.memoryCache.delete(nodeId)
    })

    // Clear from IndexedDB
    if (this.indexedDB) {
      const transaction = this.indexedDB.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      affectedNodes.forEach(nodeId => {
        store.delete(nodeId)
      })
    }

    console.log(`✅ [HybridCache] Invalidated ${affectedNodes.length} nodes`)
  }

  /**
   * Warms cache for commonly accessed nodes
   */
  async warmCache(
    nodeIds: string[],
    rawDataFetcher: () => Promise<any>,
    branchContext: BranchContext
  ): Promise<void> {
    console.log('🔥 [HybridCache] Warming cache for:', nodeIds.length, 'nodes')

    const promises = nodeIds.map(nodeId => 
      this.getInheritance(nodeId, rawDataFetcher, branchContext)
        .catch(error => {
          console.warn('⚠️ [HybridCache] Cache warming failed for:', nodeId, error)
        })
    )

    await Promise.all(promises)
    console.log('✅ [HybridCache] Cache warming complete')
  }

  // ============================================================================
  // MONITORING & STATISTICS
  // ============================================================================

  private updateResponseTime(startTime: number): void {
    const responseTime = performance.now() - startTime
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1)) + responseTime
    ) / this.stats.totalRequests
  }

  /**
   * Gets cache performance statistics
   */
  getCacheStats(): CacheStats & {
    memoryCacheSize: number
    memoryHitRate: number
    indexedDBHitRate: number
    computationRate: number
  } {
    const total = this.stats.totalRequests || 1

    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
      memoryHitRate: (this.stats.memoryHits / total) * 100,
      indexedDBHitRate: (this.stats.indexedDBHits / total) * 100,
      computationRate: (this.stats.computationMisses / total) * 100
    }
  }

  /**
   * Clears all caches (useful for testing)
   */
  async clearAllCaches(): Promise<void> {
    // Clear memory
    this.memoryCache.clear()

    // Clear IndexedDB
    if (this.indexedDB) {
      const transaction = this.indexedDB.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      await new Promise<void>((resolve) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
      })
    }

    // Reset stats
    this.stats = {
      memoryHits: 0,
      indexedDBHits: 0,
      computationMisses: 0,
      totalRequests: 0,
      averageResponseTime: 0
    }

    console.log('🧹 [HybridCache] All caches cleared')
  }
}