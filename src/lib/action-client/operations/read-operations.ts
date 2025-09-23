/**
 * Read Operations - IndexedDB-First Read Strategy
 * 
 * Handles:
 * - Cache-first read operations
 * - IndexedDB fallback with branch awareness
 * - API fallback for missing data
 * - Response building and caching
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';
import type { CacheManager } from '../core/cache-manager';
import type { IndexedDBManager } from '../core/indexeddb-manager';
import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';
// ✅ REMOVED: Old junction handler - replaced by schema-driven system

export class ReadOperations {
  
  constructor(
    private cache: CacheManager,
    private indexedDB: IndexedDBManager
  ) {}

  /**
   * Check if a resource requires branch context based on its schema
   */
  private requiresBranchContext(action: string): boolean {
    try {
      const resourceType = action.split('.')[0];
      const schema = getResourceByActionPrefix(resourceType);
      return !schema?.notHasBranchContext;
    } catch (error) {
      // If we can't determine, assume branch context is required for safety
      return true;
    }
  }

  /**
   * Handle read operations with cache-first strategy
   */
  async handleReadOperation(
    action: string,
    data: any,
    options: any,
    cacheKey: string,
    mapping: any,
    branchContext: BranchContext | null,
    fetchFromAPIFn: (action: string, data: any, options: any, branchContext: BranchContext | null, startTime: number) => Promise<ActionResponse>
  ): Promise<ActionResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Check memory cache first (sub-10ms)
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return await this.buildCacheResponse(cachedData, action, options, startTime, true, branchContext);
      }

      // Step 2: Skip IndexedDB if skipCache is set
      if (options?.skipCache) {
        return await fetchFromAPIFn(action, data, options, branchContext, startTime);
      }

      // Step 3: Check IndexedDB (10-50ms) with conditional branch logic
      const storeName = mapping.store;
      const needsBranchContext = this.requiresBranchContext(action);
      let indexedData: any;
      
      if (data?.id) {
        if (needsBranchContext) {
          indexedData = await this.indexedDB.getBranchAware(storeName, data.id, branchContext);
        } else {
          indexedData = await this.indexedDB.get(storeName, data.id);
        }
      } else {
        if (needsBranchContext) {
          // Use branch-aware method for branch-scoped resources
          indexedData = await this.indexedDB.getAllBranchAware(storeName, branchContext, options);
          // DEBUG: log branch overlay results for this list
          try {
            if (Array.isArray(indexedData)) {
              console.log('🔎 [ReadOperations] list overlay (branch-aware)', {
                action,
                storeName,
                count: indexedData.length,
                branchIds: [...new Set(indexedData.map((r: any) => r?.branchId))],
                currentBranchId: branchContext?.currentBranchId,
                defaultBranchId: branchContext?.defaultBranchId
              });
            }
          } catch {}
        } else {
          // Use regular method for tenant-wide resources (like packageInstallations)
          indexedData = await this.indexedDB.getAll(storeName, options);
          console.log('🔎 [ReadOperations] list overlay (tenant-wide)', {
            action,
            storeName,
            count: Array.isArray(indexedData) ? indexedData.length : 0,
            needsBranchContext: false
          });
        }
      }

      // Step 4: Return IndexedDB data if available
      const hasValidData = indexedData && (Array.isArray(indexedData) ? indexedData.length > 0 : indexedData);
      if (hasValidData) {
        // 🚨 CRITICAL DEBUG: Check if IndexedDB is serving mixed branch data
        if (Array.isArray(indexedData) && action.includes('node.list')) {
          console.log('🚨 [ReadOperations] IndexedDB data branch analysis:', {
            action,
            requestedBranchId: branchContext?.currentBranchId,
            indexedDataCount: indexedData.length,
            branchDistribution: indexedData.map((item: any) => ({
              id: item.id,
              branchId: item.branchId,
              name: item.name
            })),
            uniqueBranchIds: [...new Set(indexedData.map((item: any) => item.branchId))],
            allMatchRequestedBranch: indexedData.every((item: any) => 
              item.branchId === branchContext?.currentBranchId
            ),
            timestamp: new Date().toISOString()
          });
        }
        
        this.cache.set(cacheKey, indexedData);
        return await this.buildCacheResponse(indexedData, action, options, startTime, false, branchContext);
      }

      // Step 5: Fallback to API
      return await fetchFromAPIFn(action, data, options, branchContext, startTime);
      
    } catch (error) {
      console.error(`🔥 [ReadOperations] Read operation failed for ${action}:`, error);
      
      // Graceful fallback
      const isListAction = action.includes('.list');
      const fallbackData = isListAction ? [] : null;
      
      return {
        success: true,
        data: fallbackData,
        cached: false,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        action: action,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build response from cached data with junction loading from IndexedDB
   */
  private async buildCacheResponse(
    cachedData: any, 
    action: string, 
    options: any, 
    startTime: number, 
    fromMemory: boolean,
    branchContext: BranchContext | null
  ): Promise<ActionResponse> {
    
    // Load junction data from IndexedDB
    let junctionData: any = {};
    
    try {
      // For list actions that should include junction data, load from IndexedDB
      if (action.includes('.list') && Array.isArray(cachedData) && cachedData.length > 0) {
        
        // Load relevant junction tables based on action type
        if (action.includes('process.list')) {
          // Load junction tables for process queries - defensive loading
          const junctionTables = ['nodeProcesses', 'processRules'];
          
          for (const tableName of junctionTables) {
            try {
              const junctionData_temp = await this.indexedDB.getAllBranchAware(tableName, branchContext) || [];
              if (junctionData_temp.length > 0) {
                junctionData[tableName] = junctionData_temp;
              }
            } catch (tableError) {
              console.warn(`⚠️ [ReadOperations] Junction table '${tableName}' not found or inaccessible:`, tableError);
              // Continue loading other junction tables
            }
          }
          
        } else if (action.includes('rule.list')) {
          // Load junction tables for rule queries - defensive loading
          const junctionTables = ['processRules', 'ruleIgnores'];
          
          for (const tableName of junctionTables) {
            try {
              const junctionData_temp = await this.indexedDB.getAllBranchAware(tableName, branchContext) || [];
              if (junctionData_temp.length > 0) {
                junctionData[tableName] = junctionData_temp;
              }
            } catch (tableError) {
              console.warn(`⚠️ [ReadOperations] Junction table '${tableName}' not found or inaccessible:`, tableError);
              // Continue loading other junction tables
            }
          }
          
        } else if (action.includes('workflow.list')) {
          // Load junction tables for workflow queries - defensive loading  
          const junctionTables: string[] = []; // No junction tables for workflows anymore
          
          for (const tableName of junctionTables) {
            try {
              const junctionData_temp = await this.indexedDB.getAllBranchAware(tableName, branchContext) || [];
              if (junctionData_temp.length > 0) {
                junctionData[tableName] = junctionData_temp;
              }
            } catch (tableError) {
              console.warn(`⚠️ [ReadOperations] Junction table '${tableName}' not found or inaccessible:`, tableError);
              // Continue loading other junction tables
            }
          }
          
        } else if (action.includes('node.list')) {
          // Load all junction tables for node queries - defensive loading
          const junctionTables = ['nodeProcesses', 'ruleIgnores'];
          
          for (const tableName of junctionTables) {
            try {
              const junctionData_temp = await this.indexedDB.getAllBranchAware(tableName, branchContext) || [];
              if (junctionData_temp.length > 0) {
                junctionData[tableName] = junctionData_temp;
              }
            } catch (tableError) {
              console.warn(`⚠️ [ReadOperations] Junction table '${tableName}' not found or inaccessible:`, tableError);
              // Continue loading other junction tables
            }
          }
        }
      }
      
    } catch (junctionError) {
      console.warn('⚠️ [ReadOperations] Failed to load junction data from IndexedDB:', junctionError);
    }
    
    return {
      success: true,
      data: cachedData,
      ...(Object.keys(junctionData).length > 0 && { junctions: junctionData }),
      cached: fromMemory,
      executionTime: Date.now() - startTime,
      timestamp: Date.now(),
      action: action
    };
  }
} 