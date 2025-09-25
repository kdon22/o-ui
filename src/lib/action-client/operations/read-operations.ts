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
// Removed server-only-config.ts import - using schema-driven approach
// ✅ REMOVED: Old junction handler - replaced by schema-driven system

export class ReadOperations {
  
  constructor(
    private cache: CacheManager,
    private indexedDB: IndexedDBManager
  ) {}

  /**
   * UNIFIED: Check if we should use server-only execution for read operations (SSOT pattern)
   */
  private shouldBypassIndexedDBForRead(action: string, options?: any): boolean {
    // Check schema serverOnly property (SSOT schema-driven approach)
    const resourceType = action.split('.')[0];
    const schema = getResourceByActionPrefix(resourceType);
    return schema?.serverOnly === true;
  }

  /**
   * Get reason for server-only execution (for debugging)
   */
  private getBypassReason(action: string, options?: any): string {
    // Manual serverOnly override removed - use schema configuration
    
    const resourceType = action.split('.')[0];
    const schema = getResourceByActionPrefix(resourceType);
    if (schema?.serverOnly) return 'schema.serverOnly=true';
    
    return 'Unknown reason';
  }

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
    
    console.log('🚀 [ReadOperations] Starting read operation:', {
      action,
      cacheKey,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasOptions: !!options,
      optionsKeys: options ? Object.keys(options) : [],
      storeName: mapping?.store,
      method: mapping?.method,
      hasBranchContext: !!branchContext,
      currentBranchId: branchContext?.currentBranchId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Step 1: Check memory cache first (sub-10ms)
      console.log('🔍 [ReadOperations] Step 1: Checking memory cache...');
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ [ReadOperations] Memory cache HIT:', {
          action,
          cacheKey,
          dataType: Array.isArray(cachedData) ? 'array' : typeof cachedData,
          dataLength: Array.isArray(cachedData) ? cachedData.length : 'N/A',
          timestamp: new Date().toISOString()
        });
        return await this.buildCacheResponse(cachedData, action, options, startTime, true, branchContext);
      }
      console.log('⚠️ [ReadOperations] Memory cache MISS:', { action, cacheKey });

      // Step 2: Check if we should use server-only execution (SSOT schema-driven)
      const shouldBypass = this.shouldBypassIndexedDBForRead(action, options);
      if (shouldBypass) {
        console.log('⚠️ [ReadOperations] Step 2: Using server-only execution (schema serverOnly: true), going directly to API:', {
          action,
          storeName: mapping.store,
          reason: this.getBypassReason(action, options)
        });
        return await fetchFromAPIFn(action, data, options, branchContext, startTime);
      }

      // Step 3: Check IndexedDB (optimized for core entities: <50ms)
      console.log('🔍 [ReadOperations] Step 3: Checking PERFORMANCE-OPTIMIZED IndexedDB...');
      
      // CRITICAL: Check if IndexedDB is in fallback mode
      if (this.indexedDB.isFallbackMode && this.indexedDB.isFallbackMode()) {
        console.log('⚠️ [ReadOperations] IndexedDB in fallback mode, skipping to API...');
        return await fetchFromAPIFn(action, data, options, branchContext, startTime);
      }
      
      // Get store name early for performance optimizations
      const storeName = mapping.store;
      
      // 🚀 CORE ENTITY FAST PATH: Core entities should have sub-10ms IndexedDB access
      const coreEntities = ['nodes', 'processes', 'rules', 'nodeProcesses', 'processRules'];
      if (coreEntities.includes(storeName)) {
        console.log(`🚀 [ReadOperations] Fast path for core entity: ${storeName}`);
      }

      // 🚀 PERFORMANCE-OPTIMIZED: Reduced readiness timeout for core schema (should open in <200ms)
      try {
        const readyInTime = await (this.indexedDB as any).waitUntilReadyOrTimeout?.(600);
        if (readyInTime === false) {
          console.warn('⏱️ [ReadOperations] IndexedDB not ready within 600ms, using API (core schema should be <200ms)');
          return await fetchFromAPIFn(action, data, options, branchContext, startTime);
        }
      } catch {
        // If helper not present or throws, continue as before
      }
      const needsBranchContext = this.requiresBranchContext(action);
      let indexedData: any;
      
      console.log('🔍 [ReadOperations] IndexedDB configuration:', {
        storeName,
        needsBranchContext,
        hasSpecificId: !!data?.id,
        specificId: data?.id,
        branchContext: branchContext ? {
          currentBranchId: branchContext.currentBranchId,
          defaultBranchId: branchContext.defaultBranchId,
          tenantId: branchContext.tenantId
        } : null
      });
      
      if (data?.id) {
        console.log('🔍 [ReadOperations] Fetching specific item by ID...');
        if (needsBranchContext) {
          console.log('🔍 [ReadOperations] Using branch-aware get for specific ID...');
          indexedData = await this.indexedDB.getBranchAware(storeName, data.id, branchContext);
        } else {
          console.log('🔍 [ReadOperations] Using regular get for specific ID...');
          indexedData = await this.indexedDB.get(storeName, data.id);
        }
        
        console.log('🔍 [ReadOperations] IndexedDB single item result:', {
          found: !!indexedData,
          itemId: indexedData?.id,
          itemBranchId: indexedData?.branchId,
          itemName: indexedData?.name
        });
      } else {
        console.log('🔍 [ReadOperations] Fetching all items (list operation)...');
        if (needsBranchContext) {
          console.log('🔍 [ReadOperations] Using branch-aware getAll...');
          console.log('🔍 [ReadOperations] STORE NAME DEBUG:', {
            action,
            storeName,
            storeNameType: typeof storeName,
            mappingStore: mapping?.store,
            mappingExists: !!mapping,
            timestamp: new Date().toISOString()
          });
          // Use branch-aware method for branch-scoped resources
          indexedData = await this.indexedDB.getAllBranchAware(storeName, branchContext, options);
          // DEBUG: log branch overlay results for this list
          try {
            if (Array.isArray(indexedData)) {
              console.log('🔎 [ReadOperations] Branch-aware list result:', {
                action,
                storeName,
                count: indexedData.length,
                branchIds: [...new Set(indexedData.map((r: any) => r?.branchId))],
                currentBranchId: branchContext?.currentBranchId,
                defaultBranchId: branchContext?.defaultBranchId,
                items: indexedData.map((item: any) => ({
                  id: item?.id,
                  name: item?.name,
                  branchId: item?.branchId
                }))
              });
            }
          } catch (err) {
            console.error('Error logging branch-aware result:', err);
          }
        } else {
          console.log('🔍 [ReadOperations] Using regular getAll (tenant-wide)...');
          // Use regular method for tenant-wide resources (like packageInstallations)
          indexedData = await this.indexedDB.getAll(storeName, options);
          console.log('🔎 [ReadOperations] Tenant-wide list result:', {
            action,
            storeName,
            count: Array.isArray(indexedData) ? indexedData.length : 0,
            needsBranchContext: false,
            items: Array.isArray(indexedData) ? indexedData.slice(0, 3).map((item: any) => ({
              id: item?.id,
              name: item?.name
            })) : []
          });
        }
      }

      // Step 4: Return IndexedDB data if available
      console.log('🔍 [ReadOperations] Step 4: Validating IndexedDB data...');
      const hasValidData = indexedData && (Array.isArray(indexedData) ? indexedData.length > 0 : indexedData);
      
      console.log('🔍 [ReadOperations] IndexedDB data validation:', {
        hasIndexedData: !!indexedData,
        isArray: Array.isArray(indexedData),
        arrayLength: Array.isArray(indexedData) ? indexedData.length : 'N/A',
        hasValidData,
        dataType: typeof indexedData
      });
      
      if (hasValidData) {
        console.log('✅ [ReadOperations] IndexedDB data found, returning cached response');
        
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
        const response = await this.buildCacheResponse(indexedData, action, options, startTime, false, branchContext);
        
        console.log('✅ [ReadOperations] Returning IndexedDB response:', {
          action,
          success: response.success,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          cached: response.cached,
          executionTime: response.executionTime
        });
        
        return response;
      }

      // Step 5: Fallback to API
      console.log('⚠️ [ReadOperations] Step 5: IndexedDB empty, falling back to API...');
      console.log('🌐 [ReadOperations] Calling API with:', {
        action,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        hasOptions: !!options,
        hasBranchContext: !!branchContext,
        currentBranchId: branchContext?.currentBranchId
      });
      
      const apiResponse = await fetchFromAPIFn(action, data, options, branchContext, startTime);
      
      console.log('🌐 [ReadOperations] API response received:', {
        action,
        success: apiResponse.success,
        hasData: !!apiResponse.data,
        dataLength: Array.isArray(apiResponse.data) ? apiResponse.data.length : 'N/A',
        cached: apiResponse.cached,
        executionTime: apiResponse.executionTime,
        error: apiResponse.error || null
      });
      
      return apiResponse;
      
    } catch (error) {
      console.error(`🔥 [ReadOperations] Read operation failed for ${action}:`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : null,
        action,
        cacheKey,
        storeName: mapping?.store,
        hasBranchContext: !!branchContext,
        currentBranchId: branchContext?.currentBranchId,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      // Graceful fallback
      const isListAction = action.includes('.list');
      const fallbackData = isListAction ? [] : null;
      
      console.log('🛡️ [ReadOperations] Using graceful fallback:', {
        action,
        isListAction,
        fallbackData: Array.isArray(fallbackData) ? `array[${fallbackData.length}]` : fallbackData,
        timestamp: new Date().toISOString()
      });
      
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
    
    console.log('🔧 [ReadOperations] Building cache response:', {
      action,
      fromMemory,
      hasData: !!cachedData,
      dataType: Array.isArray(cachedData) ? 'array' : typeof cachedData,
      dataLength: Array.isArray(cachedData) ? cachedData.length : 'N/A',
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
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
    
    const response = {
      success: true,
      data: cachedData,
      ...(Object.keys(junctionData).length > 0 && { junctions: junctionData }),
      cached: fromMemory,
      executionTime: Date.now() - startTime,
      timestamp: Date.now(),
      action: action
    };
    
    console.log('✅ [ReadOperations] Final cache response built:', {
      action,
      success: response.success,
      hasData: !!response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      hasJunctions: !!response.junctions,
      junctionTables: response.junctions ? Object.keys(response.junctions) : [],
      cached: response.cached,
      fromMemory,
      executionTime: response.executionTime,
      timestamp: new Date().toISOString()
    });
    
    return response;
  }
} 