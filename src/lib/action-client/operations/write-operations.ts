/**
 * Write Operations - Optimistic Updates & Sync
 * 
 * Handles:
 * - Optimistic updates to IndexedDB
 * - Create, Update, Delete operations
 * - Branch-aware writes with Copy-on-Write
 * - Cache invalidation
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';
import type { CacheManager } from '../core/cache-manager';
import type { IndexedDBManager } from '../core/indexeddb-manager';
import type { SyncQueue } from '../core/sync-queue';
import type { StorageHelpers } from '../storage/storage-helpers';
import { getUnifiedResourceRegistry } from '@/lib/resource-system/unified-resource-registry';
import { junctionAutoCreator, type AutoCreateContext } from '../helpers/junction-auto-creator';
import { changeTrackingHelper, type ChangeTrackingContext } from '../helpers/change-tracking-helper';
// ✅ REMOVED: Auto-value processing moved to ActionClientCore
// import { AutoValueService } from '@/lib/resource-system';
// import type { AutoValueContext } from '@/lib/resource-system';
// import { getResourceSchema } from '@/lib/resource-system/unified-resource-registry';

export class WriteOperations {
  
  constructor(
    private cache: CacheManager,
    private indexedDB: IndexedDBManager,
    private syncQueue: SyncQueue,
    private storageHelpers?: StorageHelpers
  ) {}

  /**
   * Handle write operations with optimistic updates
   */
  async handleWriteOperation(
    action: string,
    data: any,
    options: any,
    mapping: any,
    branchContext: BranchContext | null,
    fetchFromAPIFn: (action: string, data: any, options: any, branchContext: BranchContext | null) => Promise<ActionResponse>,
    updateIndexedDBWithServerResponseFn: (data: any, storeName: string, branchContext: BranchContext | null) => Promise<void>
  ): Promise<ActionResponse> {
    const startTime = Date.now();
    
    try {
      // ==============================================================
      // Copy-on-Write guard: if editing an entity that came from
      // default branch overlay (no branch copy yet), auto-fork first
      // ==============================================================
      if (mapping.method !== 'GET' && action.endsWith('.update') && branchContext) {
        try {
          const storeName = mapping.store;
          // Try to find a current-branch copy first
          const currentCopy = await this.indexedDB.getBranchAware(storeName, data.id, branchContext);
          if (!currentCopy) {
            // No branch copy — attempt to read from default branch to confirm lineage
            const { CompoundKeyManager } = await import('../utils/compound-key-manager');
            const fallbackKey = CompoundKeyManager.createFallbackKey(data.id, branchContext);
            const defaultCopy = await this.indexedDB.get<any>(storeName, fallbackKey);
            if (defaultCopy) {
              // Build branch fork payload using schema-based keying via storage helpers
              const forkPayload = {
                ...defaultCopy,
                id: defaultCopy.id, // keep same id; storage helpers will key by schema.indexedDBKey
                branchId: branchContext.currentBranchId,
                // Preserve original lineage field if present; otherwise add original<Model>Id if schema uses it
                ...(defaultCopy.originalId ? { originalId: defaultCopy.originalId } : {}),
              };
              // Create branch copy
              const createAction = `${mapping.resource}.create`;
              await fetchFromAPIFn(createAction, forkPayload, options, branchContext);
            }
          }
        } catch {
          // Non-fatal; proceed with normal flow
        }
      }

      // Step 1: Apply optimistic updates (with smart ID handling)
      if (mapping.optimistic) {
        await this.applyOptimisticUpdate(action, data, options, mapping, branchContext);
      }

      // Step 2: Invalidate related caches
      const [resourcePrefix] = action.split('.');
      if (branchContext) {
        // 🔥 CRITICAL FIX: Use consistent cache key format (no legacy :branch: separator)
        this.cache.invalidate(`${resourcePrefix}@${branchContext.currentBranchId}`);
      } else {
        this.cache.invalidate(resourcePrefix);
      }

      // Step 3: Try API call immediately
      try {
        const apiResult = await fetchFromAPIFn(action, data, options, branchContext);
        
        console.log('🎯 [WriteOperations] API call result:', {
          action,
          success: apiResult.success,
          hasData: !!apiResult.data,
          dataType: typeof apiResult.data,
          dataId: apiResult.data?.id,
          apiResult: apiResult,
          timestamp: new Date().toISOString()
        });
        
        if (apiResult.success && apiResult.data) {
          console.log('✅ [WriteOperations] API success - updating IndexedDB:', {
            action,
            data: apiResult.data,
            store: mapping.store,
            timestamp: new Date().toISOString()
          });
          
          // Update IndexedDB with server response
          console.log('🔥🔥🔥 [WriteOperations] ABOUT TO CALL updateIndexedDBWithServerResponseFn:', {
            action,
            dataId: apiResult.data?.id,
            storeName: mapping.store,
            timestamp: new Date().toISOString()
          });
          await updateIndexedDBWithServerResponseFn(apiResult.data, mapping.store, branchContext);
          console.log('✅✅✅ [WriteOperations] updateIndexedDBWithServerResponseFn COMPLETED:', {
            action,
            dataId: apiResult.data?.id,
            storeName: mapping.store,
            timestamp: new Date().toISOString()
          });
          
          // 🚀 FACTORY: Auto-manage junctions using factory pattern
          if (action.endsWith('.create')) {
            console.log('🔥🔥🔥 [WriteOperations] ABOUT TO CALL handleJunctionAutoCreation:', {
              action,
              hasData: !!data,
              hasApiResult: !!apiResult,
              hasBranchContext: !!branchContext,
              timestamp: new Date().toISOString()
            });
            await this.handleJunctionAutoCreation(action, data, apiResult, branchContext, options, fetchFromAPIFn);
            
          } else if (action.endsWith('.update')) {
            await this.handleJunctionAutoUpdate(action, data, apiResult, branchContext, options, fetchFromAPIFn);
          } else if (action.endsWith('.delete')) {
            await this.handleJunctionAutoDelete(action, data, apiResult, branchContext, options, fetchFromAPIFn);
          }

          // 📊 GOLD STANDARD: Track change for version history and audit trail
          await this.trackEntityChange(action, data, apiResult, branchContext, options);
        } else {
          console.warn('⚠️ [WriteOperations] API call did not meet success criteria:', {
            action,
            success: apiResult.success,
            hasData: !!apiResult.data,
            apiResult,
            timestamp: new Date().toISOString()
          });
        }
        
        return {
          ...apiResult,
          executionTime: Date.now() - startTime
        };
        
      } catch (networkError) {
        // Network failure, queue for background sync
        this.syncQueue.add(action, data);
        
        return {
          success: true,
          data: data,
          queued: true,
          executionTime: Date.now() - startTime,
          timestamp: Date.now(),
          action: action
        };
      }
      
    } catch (error) {
      console.error(`🔥 [WriteOperations] Write operation failed for ${action}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        action: action
      };
    }
  }

  /**
   * Apply optimistic updates to IndexedDB for immediate UI feedback
   */
  private async applyOptimisticUpdate(
    action: string, 
    data: any, 
    options: any,
    mapping: any, 
    branchContext: BranchContext | null
  ): Promise<void> {
    // 🚨 DEBUG: Track where this is being called from
    const stack = new Error().stack;
    const callerInfo = stack?.split('\n').slice(1, 4).join(' → ') || 'unknown';
    
    console.log('🚨🚨🚨 [WriteOperations] applyOptimisticUpdate CALLED FROM:', {
      action,
      dataId: data?.id,
      hasOptimisticFlag: !!data?.__optimistic,
      callerStack: callerInfo,
      timestamp: new Date().toISOString()
    });
    const [, operation] = action.split('.');
    const storeName = mapping.store;
    
    switch (operation) {
      case 'create':
        let createData;
        
        console.log('🚨 [WriteOperations] OPTIMISTIC CREATE DEBUG - ENTRY:', {
          action,
          storeName,
          inputDataId: data?.id,
          inputDataKeys: data ? Object.keys(data) : null,
          inputData: data,
          isJunctionTable: getUnifiedResourceRegistry().isJunctionTable(storeName),
          timestamp: new Date().toISOString()
        });
        
        // For junction tables, ensure branchId is present and let storage helpers build keys using schema.indexedDBKey
        if (getUnifiedResourceRegistry().isJunctionTable(storeName)) {
          console.log('🔗 [WriteOperations] Processing junction table:', { storeName });
          // Ensure branchId is set using branch context; this guarantees branch-aware compound key
          const branchId = branchContext?.currentBranchId || (data as any)?.branchId;
          createData = { ...data, ...(branchId ? { branchId } : {}) };
          // Don't override ID - let storage helpers create the composite key from junction fields
        } else {
          console.log('📊 [WriteOperations] Processing entity table:', { storeName });
          
          // 🚀 AUTO-VALUE SYSTEM: Generate missing auto-values from schema
          let processedData = data;
          
          console.log('🔍 [WriteOperations] Checking if AutoValue processing needed:', {
            hasId: !!data.id,
            hasTenantId: !!data.tenantId,
            hasBranchId: !!data.branchId,
            dataId: data.id,
            dataTenantId: data.tenantId,
            dataBranchId: data.branchId,
            shouldProcess: !data.id || !data.tenantId || !data.branchId,
            timestamp: new Date().toISOString()
          });
          
          // ✅ AUTO-VALUES: Already processed in ActionClientCore - data comes pre-processed
          console.log('✅ [WriteOperations] Using pre-processed data from ActionClientCore (auto-values already applied)', {
            dataKeys: Object.keys(data),
            hasId: !!data.id,
            hasParentId: !!data.parentId
          });
          
          // BULLETPROOF FIX: Use the ID from processed data (generated by autoValue system)
          let optimisticId = processedData.id;
          let idSource = 'provided';
          
          if (!optimisticId) {
            // 🛡️ SCHEMA-DRIVEN SYSTEM: This should never happen with proper autoValue configuration
            throw new Error(`No ID provided by schema autoValue system. Check schema has 'autoValue: { source: "auto.uuid" }' for ID field. Data keys: ${Object.keys(processedData).join(', ')}`);
          } else if (typeof optimisticId === 'string' && optimisticId.length === 36 && optimisticId.includes('-')) {
            // Client provided a proper UUID (from autoValue system) - use it consistently
            idSource = 'form-generated-uuid';
            console.log('🔥 [WriteOperations] Using form-generated UUID (autoValue):', {
              optimisticId,
              reason: 'form-autovalue-generated-consistent-uuid',
              timestamp: new Date().toISOString()
            });
          } else {
            idSource = 'form-other';
            console.log('🔥 [WriteOperations] Using form-provided ID:', {
              optimisticId,
              idLength: String(optimisticId).length,
              idType: typeof optimisticId,
              timestamp: new Date().toISOString()
            });
          }
          
          createData = {
            id: optimisticId,
            ...processedData, // Use processedData with auto-generated values
            // Only override timestamps if not already set by autoValue system
            createdAt: processedData.createdAt || new Date().toISOString(),
            updatedAt: processedData.updatedAt || new Date().toISOString(),
            // Mark as optimistic for UI feedback and cleanup identification
            __optimistic: true,
            __optimisticIdSource: idSource, // Track how ID was created for better debugging
            // Preserve server generation flags for later cleanup
            __useServerGeneratedId: data.__useServerGeneratedId,
            __clientTempId: data.__clientTempId
          };
        }
        
        console.log('🚨 [WriteOperations] OPTIMISTIC CREATE RESULT:', {
          action,
          storeName,
          optimisticId: createData.id,
          inputId: data?.id,
          idSource: createData.__optimisticIdSource,
          wasGenerated: !data?.id,
          isOptimistic: createData.__optimistic,
          finalData: createData,
          timestamp: new Date().toISOString()
        });
        
        // Always route through StorageHelpers so the storage key uses [indexedDBKey, currentBranchId]
        if (this.storageHelpers) {
          await this.storageHelpers.storeSingleData(createData, storeName, branchContext);
        } else {
          const { CompoundKeyManager } = await import('../utils/compound-key-manager');
          const key = branchContext?.currentBranchId
            ? (CompoundKeyManager as any).createBranchKey(createData.id, branchContext.currentBranchId)
            : createData.id;
          await this.indexedDB.set(storeName, createData, key);
        }
        
        console.log('🚨 [WriteOperations] OPTIMISTIC RECORD STORED IN INDEXEDDB:', {
          action,
          storeName,
          optimisticId: createData.id,
          idSource: createData.__optimisticIdSource,
          storedSuccessfully: true,
           usedStorageHelpers: getUnifiedResourceRegistry().isJunctionTable(storeName),
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'update':
        const existing = await this.indexedDB.get(storeName, data.id);
        if (existing) {
          const updated = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
          };
          if (this.storageHelpers) {
            await this.storageHelpers.storeSingleData(updated, storeName, branchContext);
          } else {
            const { CompoundKeyManager } = await import('../utils/compound-key-manager');
            const key = branchContext?.currentBranchId
              ? (CompoundKeyManager as any).createBranchKey(updated.id, branchContext.currentBranchId)
              : updated.id;
            await this.indexedDB.set(storeName, updated, key);
          }
        }
        break;
        
      case 'delete':
        await this.indexedDB.delete(storeName, data.id);
        break;
    }
  }


  /**
   * 🏆 GOLD STANDARD: Simple junction auto-creation
   */
  private async handleJunctionAutoCreation(
    parentAction: string,
    parentData: any,
    parentResult: any,
    branchContext: BranchContext | null,
    originalOptions: any,
    fetchFromAPIFn: (action: string, data: any, options: any, branchContext: BranchContext | null) => Promise<ActionResponse>
  ): Promise<void> {
    // 🚨 SINGLE BYPASS: Only run if we have navigation context and not already processing
    if (!originalOptions?.navigationContext || originalOptions?._processingJunctions) {
      console.log('⏭️ [WriteOperations] Skipping junction auto-creation (missing navigationContext or already processing)', {
        parentAction,
        hasNavigationContext: !!originalOptions?.navigationContext,
        navigationContextKeys: originalOptions?.navigationContext ? Object.keys(originalOptions.navigationContext) : [],
        processingJunctions: !!originalOptions?._processingJunctions,
        timestamp: new Date().toISOString()
      });
      return; // ✅ CLEAN BYPASS
    }
    
    // 🔍 DEBUG: Track where junction auto-creation is called from
    const stack = new Error().stack;
    const callerInfo = stack?.split('\n').slice(1, 3).join(' → ') || 'unknown';
    
    console.log('🔗 [WriteOperations] Junction auto-creation starting:', {
      parentAction,
      navigationContext: originalOptions.navigationContext,
      parentId: parentResult.data?.id,
      calledFrom: callerInfo,
      hasNavigationContext: !!originalOptions.navigationContext,
      processingJunctions: !!originalOptions._processingJunctions,
      shouldSkip: !!originalOptions._processingJunctions
    });
    
    try {
      console.log('🔍 [WriteOperations] Using junction auto-creator instance...');
      
      console.log('🔍 [WriteOperations] Building context:', {
        parentAction,
        hasParentData: !!parentData,
        hasParentResult: !!parentResult,
        hasBranchContext: !!branchContext
      });
      
      const context: AutoCreateContext = {
        parentAction,
        parentData,
        parentResult,
        branchContext,
        navigationContext: originalOptions?.navigationContext || null
      };

      // 🏆 GOLD STANDARD: Use action system, NOT direct API calls
      const executeJunctionAction = async (action: string, data: any): Promise<ActionResponse> => {
        const stack = new Error().stack;
        const callerInfo = stack?.split('\n').slice(1, 3).join(' → ') || 'unknown';
        
        console.log('🔍 [WriteOperations] Executing junction via ACTION SYSTEM:', { 
          action, 
          data,
          calledFrom: callerInfo,
          hasNavigationContext: !!originalOptions?.navigationContext,
          processingJunctions: !!originalOptions?._processingJunctions
        });
        
        // 🚀 USE ACTION SYSTEM: This will handle auto-values correctly with navigation context
        // Import the action client to execute the junction action properly
        const { getActionClient } = await import('../global-client');
        const actionClient = getActionClient(branchContext?.tenantId || '1BD', branchContext || undefined);
        
        // 🚨 CRITICAL FIX: Prevent calling the same action that triggered junction creation
        if (action === parentAction) {
          console.error('🔥 [WriteOperations] PREVENTED INFINITE RECURSION: Junction trying to call same action as parent!', {
            parentAction,
            junctionAction: action,
            data,
            timestamp: new Date().toISOString()
          });
          return {
            success: false,
            error: `Junction action ${action} cannot be the same as parent action ${parentAction}`,
            timestamp: Date.now(),
            action
          };
        }
        
        // Execute through action system with preserved navigation context
        try {
          const result = await actionClient.executeAction({
            action,
            data,
            ...originalOptions,
            _processingJunctions: true // Prevent infinite recursion
          });
          
          return result;
        } catch (error) {
          console.error('🔥 [WriteOperations] Junction execution error:', { 
            action, 
            data,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name
            } : error,
            errorType: typeof error,
            fullError: error
          });
          
          return {
            success: false,
            error: `Junction execution failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: Date.now(),
            action
          };
        }
      };

      console.log('🔍 [WriteOperations] Calling autoCreateJunctions...', {
        parentAction,
        hasNavigationContext: !!originalOptions?.navigationContext,
        navigationContextKeys: originalOptions?.navigationContext ? Object.keys(originalOptions.navigationContext) : []
      });
      
      // 🔍 DEBUG: Log what junctions are registered for this parent action
      const registeredJunctions = junctionAutoCreator.getRegisteredJunctions();
      console.log('🔍 [WriteOperations] Junction registry debug:', {
        parentAction,
        registeredJunctions: registeredJunctions[parentAction] || [],
        allRegisteredActions: Object.keys(registeredJunctions),
        timestamp: new Date().toISOString()
      });
      
      await junctionAutoCreator.autoCreateJunctions(context, executeJunctionAction);
      console.log('✅ [WriteOperations] Junction auto-creation completed successfully');
      
    } catch (error) {
      console.error('🔥 [WriteOperations] Junction auto-creation error:', {
        parentAction,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
    }
  }

  /**
   * Handle junction auto-update using factory pattern
   */
  private async handleJunctionAutoUpdate(
    parentAction: string,
    parentData: any,
    parentResult: any,
    branchContext: BranchContext | null,
    originalOptions: any,
    fetchFromAPIFn: (action: string, data: any, options: any, branchContext: BranchContext | null) => Promise<ActionResponse>
  ): Promise<void> {
    try {
      const context = {
        parentAction: parentAction.replace('.update', '.create'), // Use create action for registry lookup
        parentData,
        parentResult,
        updateData: parentData, // The update data
        branchContext
      };

      const executeJunctionAction = async (action: string, data: any): Promise<ActionResponse> => {
        console.log('🔗 [WriteOperations] Junction update preserving navigation context:', {
          junctionAction: action,
          hasOriginalOptions: !!originalOptions,
          originalNavigationContext: originalOptions?.navigationContext,
          timestamp: new Date().toISOString()
        });
        
        return await fetchFromAPIFn(action, data, originalOptions, branchContext);
      };

      const junctionResults = await junctionAutoCreator.autoUpdateJunctions(context, executeJunctionAction);

      if (junctionResults.length > 0) {
        console.log('✅ [WriteOperations] Junction auto-update completed:', {
          parentAction,
          parentId: parentResult.data?.id || parentResult.id,
          junctionsUpdated: junctionResults.filter(r => r.success).length,
          results: junctionResults.map(r => ({ action: r.action, success: r.success }))
        });
      }

    } catch (error) {
      console.error('🔥 [WriteOperations] Junction auto-update error:', {
        parentAction,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Handle junction auto-delete using factory pattern
   */
  private async handleJunctionAutoDelete(
    parentAction: string,
    parentData: any,
    parentResult: any,
    branchContext: BranchContext | null,
    originalOptions: any,
    fetchFromAPIFn: (action: string, data: any, options: any, branchContext: BranchContext | null) => Promise<ActionResponse>
  ): Promise<void> {
    try {
      const context = {
        parentAction: parentAction.replace('.delete', '.create'), // Use create action for registry lookup
        parentData,
        parentResult,
        branchContext
      };

      const executeJunctionAction = async (action: string, data: any): Promise<ActionResponse> => {
        console.log('🔗 [WriteOperations] Junction delete preserving navigation context:', {
          junctionAction: action,
          hasOriginalOptions: !!originalOptions,
          originalNavigationContext: originalOptions?.navigationContext,
          timestamp: new Date().toISOString()
        });
        
        return await fetchFromAPIFn(action, data, originalOptions, branchContext);
      };

      const junctionResults = await junctionAutoCreator.autoDeleteJunctions(context, executeJunctionAction);

      if (junctionResults.length > 0) {
        console.log('✅ [WriteOperations] Junction auto-delete completed:', {
          parentAction,
          parentId: parentResult.data?.id || parentResult.id,
          junctionsDeleted: junctionResults.filter(r => r.success).length,
          results: junctionResults.map(r => ({ action: r.action, success: r.success }))
        });
      }

    } catch (error) {
      console.error('🔥 [WriteOperations] Junction auto-delete error:', {
        parentAction,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  // ============================================================================
  // GOLD STANDARD CHANGE TRACKING
  // ============================================================================

  /**
   * Track entity change for version history and audit trail
   */
  private async trackEntityChange(
    action: string,
    requestData: any,
    apiResult: ActionResponse,
    branchContext: BranchContext | null,
    options: any
  ): Promise<void> {
    
    try {
      console.log('📊 [WriteOperations] Tracking entity change:', {
        action,
        entityId: apiResult.data?.id || requestData?.id,
        branchId: branchContext?.currentBranchId,
        timestamp: new Date().toISOString()
      });

      // Extract entity information
      const [resourceType] = action.split('.');
      const entityType = this.capitalizeFirst(resourceType);
      const entityId = apiResult.data?.id || requestData?.id;

      if (!entityId) {
        console.warn('⚠️ [WriteOperations] Cannot track change - no entity ID found:', {
          action,
          apiResult: apiResult.data,
          requestData
        });
        return;
      }

      // Get before data for updates (from optimistic update cache or request)
      let beforeData: any = undefined;
      if (action.endsWith('.update')) {
        // Try to get the before state from IndexedDB
        try {
          const mapping = this.getActionMapping(action);
          if (mapping?.store && branchContext) {
            beforeData = await this.indexedDB.getBranchAware(mapping.store, entityId, branchContext);
          }
        } catch {
          // Non-fatal - we'll track without before data
        }
      }

      // Prepare change tracking context
      const trackingContext: ChangeTrackingContext = {
        action,
        entityType,
        entityId,
        beforeData,
        afterData: apiResult.data,
        branchContext,
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        batchId: options?.batchId,
        reason: options?.reason || `User ${action.split('.')[1]} operation`,
        description: options?.description,
        tags: options?.tags
      };

      // Track the change
      const trackingResult = await changeTrackingHelper.trackChange(trackingContext, apiResult);

      if (trackingResult.tracked) {
        console.log('✅ [WriteOperations] Change tracked successfully:', {
          action,
          entityType,
          entityId,
          versionId: trackingResult.versionId,
          changeLogId: trackingResult.changeLogId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ [WriteOperations] Change tracking failed:', {
          action,
          entityType,
          entityId,
          error: trackingResult.error,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ [WriteOperations] Change tracking error:', {
        action,
        entityId: apiResult.data?.id || requestData?.id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Non-fatal error - don't break the main operation
    }
  }

  /**
   * Get action mapping for resource
   */
  private getActionMapping(action: string): any {
    // This would typically come from the resource registry
    // For now, return a basic mapping
    const [resource] = action.split('.');
    return {
      store: resource,
      resource
    };
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate session ID for grouping related operations
   */
  private generateSessionId(): string {
    // In a real implementation, this would be managed at the session level
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate request ID for tracking atomic operations
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
} 