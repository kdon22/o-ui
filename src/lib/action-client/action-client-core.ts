/**
 * ActionClient Core - Orchestrator for Modular Action System
 * 
 * Clean orchestration of:
 * - Read/Write operations
 * - API integration
 * - Storage helpers
 * - Junction handling
 * - Branch management
 * - Resource initialization
 */

import type { 
  ActionRequest, 
  BranchContext 
} from './types';

import type { 
  ActionResponse,
  QueryOptions, 
  MutationContext
} from '@/lib/resource-system/schemas';

import { AutoValueService } from '@/lib/resource-system/auto-value-service';
import type { AutoValueContext } from '@/lib/resource-system/auto-value-types';

import { 
  ACTION_MAPPINGS, 
  generateResourceMethods, 
  type ResourceMethods 
} from '@/lib/resource-system/resource-registry';

import { formatBranchContext } from '@/lib/utils/branch-utils';

// ✅ Types imported below with actual imports
import { isJunctionTable } from '@/lib/resource-system/unified-resource-registry';

// Import modular components
import { CacheManager } from './core/cache-manager';
import { SyncQueue } from './core/sync-queue';
import { IndexedDBManager } from './core/indexeddb-manager';
import { ReadOperations } from './operations/read-operations';
import { WriteOperations } from './operations/write-operations';
import { APIClient } from './api/api-client';
import { StorageHelpers } from './storage/storage-helpers';
// ✅ REMOVED: Old junction handler - replaced by schema-driven system

// ============================================================================
// CORE ACTION CLIENT - Clean Orchestrator
// ============================================================================

export class ActionClientCore {
  private indexedDB: IndexedDBManager;
  private cache: CacheManager;
  private syncQueue: SyncQueue;
  private readOps: ReadOperations;
  private writeOps: WriteOperations;
  private apiClient: APIClient;
  private storageHelpers: StorageHelpers;
  
  private resources: Record<string, ResourceMethods> = {};
  private branchContext: BranchContext | null = null;
  private currentTenantId: string;

  constructor(tenantId?: string) {
    // Handle SSR scenarios where tenantId might not be available
    if (!tenantId) {
      console.warn('ActionClientCore created without tenantId - this may cause issues during SSR');
      this.currentTenantId = 'ssr-mock';
      
      // Create mock services for SSR
      this.indexedDB = {
        get: async () => null,
        set: async () => {},
        setMany: async () => {},
        getAll: async () => [],
        getAllBranchAware: async () => [],
        delete: async () => {},
        getBranchAware: async () => null,
        setBranchAware: async () => {},
        clearTenantData: async () => {},
        setTenantId: () => {},
        getTenantId: () => 'ssr-mock',
        getReadyState: () => false,
        ensureReady: async () => {}
      } as any;
      
      this.cache = new CacheManager();
      this.syncQueue = new SyncQueue();
      this.apiClient = {
        executeAction: async () => ({
          success: false,
          error: 'APIClient not available during SSR',
          data: null,
          cached: false,
          executionTime: 0
        }),
        setTenantId: () => {}
      } as any;
      
      this.storageHelpers = new StorageHelpers(this.indexedDB);
      this.readOps = new ReadOperations(this.cache, this.indexedDB);
      this.writeOps = new WriteOperations(this.cache, this.indexedDB, this.syncQueue, this.storageHelpers);
      
      return;
    }
    
    this.currentTenantId = tenantId;
    
    // Initialize core services
    this.indexedDB = new IndexedDBManager(tenantId, true); // Enable compound keys
    this.cache = new CacheManager();
    this.syncQueue = new SyncQueue();
    this.apiClient = new APIClient(tenantId);
    
    // Initialize storage helpers first
    this.storageHelpers = new StorageHelpers(this.indexedDB);
    
    // Initialize operation handlers with storage helpers
    this.readOps = new ReadOperations(this.cache, this.indexedDB);
    this.writeOps = new WriteOperations(this.cache, this.indexedDB, this.syncQueue, this.storageHelpers);
    
    this.initializeResources();
  }

  // ============================================================================
  // TENANT & BRANCH MANAGEMENT
  // ============================================================================

  setTenantId(tenantId: string): void {
    if (!tenantId) {
      throw new Error('tenantId is required - cannot switch to undefined tenant');
    }
    if (this.currentTenantId !== tenantId) {
      // Switching tenant
      this.currentTenantId = tenantId;
      this.indexedDB = new IndexedDBManager(tenantId, true); // Create new instance with compound keys
      this.apiClient.setTenantId(tenantId);
      
      // Update operation handlers with new IndexedDB
      this.readOps = new ReadOperations(this.cache, this.indexedDB);
      this.writeOps = new WriteOperations(this.cache, this.indexedDB, this.syncQueue);
      this.storageHelpers = new StorageHelpers(this.indexedDB);
      
      this.clearCache();
      this.initializeResources();
    }
  }

  getTenantId(): string {
    return this.currentTenantId;
  }

  async clearTenantData(): Promise<void> {
    await this.indexedDB.clearTenantData();
    this.clearCache();
  }

  setBranchContext(context: BranchContext): void {
    this.branchContext = context;
  }

  getBranchContext(): BranchContext | null {
    return this.branchContext;
  }

  private getBranchAwareKey(baseKey: string, branchId?: string): string {
    // 🔥 CRITICAL FIX: Use consistent compound key format for cache
    // For cache keys, we still use string format but without legacy :branch: separator
    const tenantPrefix = this.currentTenantId ? `${this.currentTenantId}:` : '';
    const branchSuffix = branchId ? `@${branchId}` : '';
    return `${tenantPrefix}${baseKey}${branchSuffix}`;
  }

  // ============================================================================
  // RESOURCE INITIALIZATION
  // ============================================================================

  private initializeResources(): void {
    this.resources = {};
    
    try {
      Object.entries(ACTION_MAPPINGS).forEach(([action, mapping]) => {
        const [resourceType] = action.split('.');
        
        // Skip cache warming for junction tables as they don't need it
        if (isJunctionTable(resourceType)) return;
        
        if (!this.resources[resourceType]) {
          this.resources[resourceType] = generateResourceMethods(resourceType, (request) => 
            this.executeAction(request)
          );
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize resources:', error);
    }
  }

  get<T extends keyof typeof this.resources>(resource: T): typeof this.resources[T] {
    return this.resources[resource];
  }

  // ============================================================================
  // CORE EXECUTION - Delegates to Operation Handlers
  // ============================================================================

  async executeAction(request: ActionRequest): Promise<ActionResponse> {
    // 🚨 DEBUG: Track duplicate executeAction calls
    const stack = new Error().stack;
    const callerInfo = stack?.split('\n').slice(1, 4).join(' → ') || 'unknown';
    
    console.log('🚨🚨🚨 [ActionClientCore] executeAction CALLED:', {
      action: request.action,
      actionType: typeof request.action,
      actionStringified: JSON.stringify(request.action),
      hasData: !!request.data,
      dataId: request.data?.id,
      callerStack: callerInfo,
      timestamp: new Date().toISOString()
    });
    const { action, data, options, branchContext } = request;
    
    console.log('🚨 [ActionClientCore] EXECUTE ACTION ENTRY POINT:', {
      action,
      dataKeys: data ? Object.keys(data) : null,
      hasOptions: !!options,
      hasBranchContext: !!branchContext,
      timestamp: new Date().toISOString()
    });
    
    const mapping = ACTION_MAPPINGS[action];
    
    if (!mapping) {
      console.error('🚨 [ActionClientCore] UNKNOWN ACTION:', {
        action,
        availableActions: Object.keys(ACTION_MAPPINGS).slice(0, 10), // Show first 10
        timestamp: new Date().toISOString()
      });
      throw new Error(`Unknown action: ${action}`);
    }



    const activeBranchContext = branchContext || this.branchContext;
    
    // 🔍 DEBUG: Log branch context resolution
    console.log('🔍 [ActionClientCore] Branch context resolution:', {
      parameterBranchContext: branchContext,
      instanceBranchContext: this.branchContext,
      activeBranchContext: activeBranchContext,
      activeBranchContextKeys: activeBranchContext ? Object.keys(activeBranchContext) : null,
      activeTenantId: activeBranchContext?.tenantId,
      activeCurrentBranchId: activeBranchContext?.currentBranchId,
      timestamp: new Date().toISOString()
    });
    
    const baseCacheKey = `${action}:${JSON.stringify(data || {})}`;
    const cacheKey = this.getBranchAwareKey(baseCacheKey, activeBranchContext?.currentBranchId);
    
    // ============================================================================
    // AUTO-VALUE PROCESSING - Process once before IndexedDB and server
    // ============================================================================
    
    let processedData = data;
    
    // Only process auto-values for write operations (create/update)
    console.log('🔍 [ActionClientCore] Auto-value processing check:', {
      action,
      mappingMethod: mapping.method,
      isNotGet: mapping.method !== 'GET',
      hasActiveBranchContext: !!activeBranchContext,
      hasSchema: !!mapping.schema,
      schemaActionPrefix: mapping.schema?.actionPrefix,
      timestamp: new Date().toISOString()
    });
    
    if (mapping.method !== 'GET' && activeBranchContext) {
      const schema = mapping.schema;
      if (schema) {
        console.log('🚀 [ActionClientCore] Processing auto-values before write operations:', {
          action,
          entityType: mapping.resource,
          inputDataKeys: data ? Object.keys(data) : [],
          hasBranchContext: !!activeBranchContext,
          timestamp: new Date().toISOString()
        });
        
        // Build AutoValueContext from ActionClient BranchContext
        const autoValueBranchContext = {
          currentBranchId: activeBranchContext.currentBranchId,
          defaultBranchId: activeBranchContext.defaultBranchId,
          tenantId: activeBranchContext.tenantId,
          userId: activeBranchContext.userId,
          isReady: true as const
        };
        
        const autoValueContext: AutoValueContext = {
          tenantId: activeBranchContext.tenantId,
          branchContext: autoValueBranchContext,
          userId: activeBranchContext.userId,
          mode: action.endsWith('.create') ? 'create' : 'update',
          navigationContext: options?.navigationContext || null
        };
        
        // 🔍 DEBUG: Add stack trace to identify duplicate calls
        const stack = new Error().stack;
        const callerInfo = stack?.split('\n').slice(1, 4).join(' → ') || 'unknown';
        
        console.log('🔧 [ActionClientCore] AutoValue context:', {
          mode: autoValueContext.mode,
          tenantId: autoValueContext.tenantId,
          userId: autoValueContext.userId,
          hasNavigationContext: !!autoValueContext.navigationContext,
          navigationContext: autoValueContext.navigationContext,
          optionsNavigationContext: options?.navigationContext,
          originalOptionsKeys: options ? Object.keys(options) : null,
          callStack: callerInfo,
          timestamp: new Date().toISOString()
        });
        
        try {
          const autoValueService = AutoValueService.getInstance();
          const autoValueResult = await autoValueService.generateAutoValues(schema, data, autoValueContext);
          
          if (autoValueResult?.success && autoValueResult?.data) {
            processedData = autoValueResult.data;
            console.log('✅ [ActionClientCore] Using auto-value processed data:', {
              originalDataKeys: data ? Object.keys(data) : [],
              processedDataKeys: Object.keys(processedData),
              autoValuesAdded: Object.keys(processedData).filter(key => !(key in (data || {}))),
              processedDataParentId: processedData.parentId,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn('⚠️ [ActionClientCore] Auto-value service failed, using original data:', {
              success: autoValueResult?.success,
              error: autoValueResult?.error,
              timestamp: new Date().toISOString()
            });
            processedData = data;
          }
        } catch (error) {
          console.error('❌ [ActionClientCore] Auto-value processing failed:', {
            action,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
          // Continue with original data if auto-value processing fails
          processedData = data;
        }
      }
    }
    
    // READ operations - Delegate to ReadOperations
    if (mapping.method === 'GET') {
      console.log('🚨 [ActionClientCore] ROUTING TO READ operations:', {
        action,
        timestamp: new Date().toISOString()
      });
      
      return this.readOps.handleReadOperation(
        action,
        processedData, // Use processed data (though for GET operations, processedData === data)
        options,
        cacheKey,
        mapping,
        activeBranchContext,
        // Bind API fetch method
        (action, data, options, branchContext, startTime) => 
          this.apiClient.fetchFromAPIWithResponse(
            action, 
            data, 
            options, 
            branchContext, 
            startTime,
            (apiData, action, options, branchContext) => 
              this.storageHelpers.storeAPIResponse(apiData, action, options, branchContext)
          )
      );
    }
    
    
    // WRITE operations - Delegate to WriteOperations
    console.log('🚨 [ActionClientCore] ROUTING TO write operations with processed data:', {
      action,
      originalDataKeys: data ? Object.keys(data) : [],
      processedDataKeys: processedData ? Object.keys(processedData) : [],
      dataWasProcessed: processedData !== data,
      timestamp: new Date().toISOString()
    });
    
    const writeResult = await this.writeOps.handleWriteOperation(
      action,
      processedData, // ✅ Use processed data with auto-values populated
      options,
      mapping,
      activeBranchContext,
      // Bind API fetch method
      (action, data, options, branchContext) => 
        this.apiClient.fetchFromAPI(action, data, options, branchContext),
      // Bind storage update method
      (data, storeName, branchContext) =>
        this.storageHelpers.updateIndexedDBWithServerResponse(data, storeName, branchContext)
    );
    
    console.log('🔥 [ActionClientCore] Write operation completed', {
      action,
      writeResult,
      success: writeResult.success,
      hasData: !!writeResult.data,
      timestamp: new Date().toISOString()
    });
    
    return writeResult;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  clearCache(): void {
    this.cache.clear();
  }

  getSyncQueueStatus() {
    return this.syncQueue.getQueueStatus();
  }

  clearSyncQueue(): void {
    this.syncQueue.clearQueue();
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidate(pattern);
  }

  invalidateBranchCache(branchId: string): void {
    // 🔥 CRITICAL FIX: Use consistent cache key format (no legacy :branch: separator)
    this.cache.invalidate(`@${branchId}`);
  }

  async warmCache(resources: string[]): Promise<void> {
    const promises = resources.map(resource => 
      this.executeAction({ action: `${resource}.list` })
    );
    await Promise.all(promises);
  }

  async warmBranchCache(resources: string[], branchContext: BranchContext): Promise<void> {
    const promises = resources.map(resource => 
      this.executeAction({ 
        action: `${resource}.list`,
        branchContext 
      })
    );
    await Promise.all(promises);
  }
}

// Export type for use in global management
export type ActionClient = ActionClientCore;