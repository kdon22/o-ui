/**
 * Storage Helpers - Auto-Discovery IndexedDB Storage Utilities
 * 
 * BULLETPROOF AUTO-DISCOVERY:
 * - Auto-generates composite IDs from junction schema structure
 * - No hardcoded table mappings or logic
 * - Pure factory-driven approach based on field analysis
 * - Branch-aware storage operations
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';
import type { IndexedDBManager } from '../core/indexeddb-manager';
import { ACTION_MAPPINGS } from '@/lib/resource-system/resource-registry';
import { getResourceSchema, getUnifiedResourceRegistry } from '@/lib/resource-system/unified-resource-registry';
// Removed server-only-config.ts import - using schema-driven approach
import { CompoundKeyManager } from '../utils/compound-key-manager';

// ============================================================================
// AUTO-DISCOVERY JUNCTION HANDLING
// ============================================================================

/**
 * Generate compound key for junction records - simplified version
 * Junction tables auto-discovered, using pattern-based ID generation
 */
function applySchemaIndexedDBKey(
  data: any,
  storeName: string,
  branchContext: BranchContext | null
): any {
  const schema = getResourceSchema(storeName);
  
  // ✅ SERVER-ONLY: Check if schema is configured for server-only operations
  if (schema?.serverOnly === true || schema?.indexedDBKey === null) {
    // For server-only schemas, don't process IndexedDB key - return data as-is
    return data;
  }
  
  if (!schema?.indexedDBKey) {
    throw new Error(`Missing indexedDBKey for store '${storeName}'. All resources must define indexedDBKey.`);
  }
  const withBranch = { ...data };
  const computedId = schema.indexedDBKey(withBranch);
  return { ...withBranch, id: computedId };
}

/**
 * Compute the storage key to use for IndexedDB writes.
 * - If branchContext present, use native compound key: [schemaKey, currentBranchId]
 * - Otherwise use simple schemaKey
 */
function computeStorageKeyAndBranch(
  recordWithId: any,
  storeName: string,
  branchContext: BranchContext | null,
  apiBranchId?: string | null
): { key: any; branchId?: string } {
  const idVal: string = recordWithId.id;
  const schema = getResourceSchema(storeName);
  // Branch scoping rules (priority order):
  // 1) Explicit opt-out: schema.notHasBranchContext === true → NOT branch-scoped
  // 2) Junction tables → ALWAYS branch-scoped
  // 3) Presence of 'branchId' field → branch-scoped
  // 4) Default → branch-scoped (opt-out via schema flag)
  const isBranchScoped = !schema?.notHasBranchContext && (
    getUnifiedResourceRegistry().isJunctionTable(storeName) ||
    !!schema?.fields?.some((f: any) => f.key === 'branchId')
  );

  const chosen = (apiBranchId ?? (recordWithId as any)?.branchId ?? branchContext?.currentBranchId) as string | undefined;

  if (isBranchScoped) {
    if (!chosen || chosen === 'main') {
      throw new Error(`Branch-scoped store '${storeName}' requires real branchId for key generation`);
    }
    const key = CompoundKeyManager.createBranchKey(idVal, chosen);
    return { key, branchId: chosen };
  }

  // Not branch-scoped → simple key
  return { key: idVal, branchId: chosen };
}

// ============================================================================
// STORAGE HELPERS CLASS
// ============================================================================

export class StorageHelpers {
  
  constructor(
    private indexedDB: IndexedDBManager
  ) {}

  /**
   * UNIFIED: Check if we should skip IndexedDB updates for this resource
   */
  private shouldSkipIndexedDBUpdate(storeName: string): boolean {
    console.log('🔍 [StorageHelpers] Checking if should skip IndexedDB update:', {
      storeName,
      timestamp: new Date().toISOString()
    });
    
    // ✅ FIX: Handle server-only store names (e.g., 'groups-server-only' → 'groups')
    const actualSchemaKey = storeName.endsWith('-server-only') 
      ? storeName.replace('-server-only', '') 
      : storeName;
      
    console.log('🔍 [StorageHelpers] Schema lookup:', {
      originalStoreName: storeName,
      actualSchemaKey,
      timestamp: new Date().toISOString()
    });
    
    const schema = getResourceSchema(actualSchemaKey);
    
    console.log('🔍 [StorageHelpers] Schema found:', {
      actualSchemaKey,
      schemaFound: !!schema,
      serverOnly: schema?.serverOnly,
      indexedDBKey: schema?.indexedDBKey,
      timestamp: new Date().toISOString()
    });
    
    // Check schema serverOnly property
    if (schema?.serverOnly === true) {
      console.log('✅ [StorageHelpers] Skipping IndexedDB - serverOnly = true:', {
        storeName,
        actualSchemaKey,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    
    // Legacy check: if indexedDBKey is explicitly set to null
    const shouldSkip = schema?.indexedDBKey === null;
    
    console.log('🔍 [StorageHelpers] Final skip decision:', {
      storeName,
      actualSchemaKey,
      shouldSkip,
      reason: shouldSkip ? 'indexedDBKey is null' : 'should proceed with IndexedDB',
      timestamp: new Date().toISOString()
    });
    
    return shouldSkip;
  }

  /**
   * Store API response data in IndexedDB (auto-discovery)
   */
  async storeAPIResponse(
    apiData: ActionResponse, 
    action: string, 
    options: any, 
    branchContext: BranchContext | null
  ): Promise<void> {
    const mapping = ACTION_MAPPINGS[action];
    if (!mapping) return;

    const storeName = mapping.store;
    
    try {
      // Store main data
      const apiBranchId = (apiData as any)?.meta?.branchId as string | undefined;
      if (Array.isArray(apiData.data)) {
        await this.storeArrayData(apiData.data, storeName, branchContext, apiBranchId);
      } else if (apiData.data) {
        await this.storeSingleData(apiData.data, storeName, branchContext, apiBranchId);
      }
      
      // Store junction data if provided (auto-discovery)
      if (apiData.junctions) {
        await this.storeJunctionData(apiData.junctions, branchContext);
      }
      
    } catch (storageError) {
      
    }
  }

  /**
   * Store array of data items (auto-discovery)
   */
  async storeArrayData(
    data: any[], 
    storeName: string, 
    branchContext: BranchContext | null,
    apiBranchId?: string | null
  ): Promise<void> {
    const { getBaseId, getJunctionLineageKey } = await import('../utils/branch-identity');
    for (const item of data) {
      const record = applySchemaIndexedDBKey(item, storeName, branchContext);
      // Inject stable helper keys (not sent to server)
      try {
        if (record && typeof record === 'object') {
          (record as any).__baseId = getBaseId(record as any);
          (record as any).__lineageKey = getJunctionLineageKey(storeName, record as any);
        }
      } catch {}
      const { key, branchId } = computeStorageKeyAndBranch(record, storeName, branchContext, apiBranchId);
      if (branchId) record.branchId = branchId;
      await this.indexedDB.set(storeName, record, key);
    }
  }

  /**
   * Store single data item (auto-discovery)
   */
  async storeSingleData(
    data: any, 
    storeName: string, 
    branchContext: BranchContext | null,
    apiBranchId?: string | null
  ): Promise<void> {
      const { getBaseId, getJunctionLineageKey } = await import('../utils/branch-identity');
      const record = applySchemaIndexedDBKey(data, storeName, branchContext);
      try {
        if (record && typeof record === 'object') {
          (record as any).__baseId = getBaseId(record as any);
          (record as any).__lineageKey = getJunctionLineageKey(storeName, record as any);
        }
      } catch {}
      const { key, branchId } = computeStorageKeyAndBranch(record, storeName, branchContext, apiBranchId);
    if (branchId) record.branchId = branchId;
    await this.indexedDB.set(storeName, record, key);
  }

  /**
   * Store junction table data (auto-discovery)
   */
  async storeJunctionData(
    junctions: Record<string, any[]>, 
    branchContext: BranchContext | null
  ): Promise<void> {
    const { getBaseId, getJunctionLineageKey } = await import('../utils/branch-identity');
    for (const [apiTableName, junctionRecords] of Object.entries(junctions)) {
      if (Array.isArray(junctionRecords) && junctionRecords.length > 0) {
        // ✅ Use API table name directly - standardized naming ensures consistency
        const storeName = apiTableName;
        
        for (const junctionRecord of junctionRecords) {
          // Preserve server-provided branchId if present; otherwise fall back to context
          const effectiveBranchId = (junctionRecord as any).branchId || branchContext?.currentBranchId;
          const recordWithBranch = effectiveBranchId ? { ...junctionRecord, branchId: effectiveBranchId } : junctionRecord;
          const processedRecord = applySchemaIndexedDBKey(
            recordWithBranch,
            storeName,
            branchContext
          );
          try {
            if (processedRecord && typeof processedRecord === 'object') {
              // Enrich with base ids if fields present
              if ((processedRecord as any).ruleId) (processedRecord as any).ruleBaseId = (processedRecord as any).ruleBaseId || getBaseId({ id: (processedRecord as any).ruleId } as any)
              if ((processedRecord as any).processId) (processedRecord as any).processBaseId = (processedRecord as any).processBaseId || getBaseId({ id: (processedRecord as any).processId } as any)
              if ((processedRecord as any).nodeId) (processedRecord as any).nodeBaseId = (processedRecord as any).nodeBaseId || getBaseId({ id: (processedRecord as any).nodeId } as any)
              ;(processedRecord as any).__lineageKey = getJunctionLineageKey(storeName, processedRecord as any)
            }
          } catch {}
          const { key, branchId } = computeStorageKeyAndBranch(processedRecord, storeName, branchContext, (junctionRecord as any)?.branchId ?? null);
          if (branchId) processedRecord.branchId = branchId;
          await this.indexedDB.set(storeName, processedRecord, key);
        }
      }
    }
  }

  /**
   * Update IndexedDB with server response data (auto-discovery)
   * CRITICAL: This replaces optimistic records to prevent duplicates
   */
  async updateIndexedDBWithServerResponse(
    data: any, 
    storeName: string, 
    branchContext: BranchContext | null
  ): Promise<void> {
    console.log('🚨 [StorageHelpers] updateIndexedDBWithServerResponse called:', {
      storeName,
      dataId: data?.id,
      hasBranchContext: !!branchContext,
      timestamp: new Date().toISOString()
    });
    
    // ✅ UNIFIED: Check if schema is configured for server-only operations
    if (this.shouldSkipIndexedDBUpdate(storeName)) {
      console.log('⚡ [StorageHelpers] Skipping IndexedDB update for server-only resource:', {
        storeName,
        dataId: data?.id,
        timestamp: new Date().toISOString()
      });
      return; // Skip IndexedDB operations for server-only resources
    }

    console.log('🚨 [StorageHelpers] UPDATE SERVER RESPONSE:', {
      storeName,
      dataId: data?.id,
      hasBranchContext: !!branchContext,
      dataKeys: data ? Object.keys(data) : null,
      timestamp: new Date().toISOString()
    });
    
    try {
      const record = applySchemaIndexedDBKey(data, storeName, branchContext);

      // Remove any optimistic leftovers before storing definitive server response
      await this.removeOptimisticRecords(storeName, branchContext);

      const { key, branchId } = computeStorageKeyAndBranch(record, storeName, branchContext);
      if (branchId) record.branchId = branchId;
      await this.indexedDB.set(storeName, record, key);

      console.log('✅ [StorageHelpers] Record stored/updated via schema key:', {
        storeName,
        id: record.id,
        operation: 'server-response-upsert',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`🔥 [StorageHelpers] Failed to update IndexedDB:`, {
        storeName,
        dataId: data?.id,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Remove optimistic records from IndexedDB to prevent duplicates
   * ENHANCED: Better identification and removal of optimistic records
   */
  private async removeOptimisticRecords(
    storeName: string, 
    branchContext: BranchContext | null
  ): Promise<void> {
    // ✅ SERVER-ONLY: Skip optimistic cleanup for server-only resources
    const schema = getResourceSchema(storeName);
    if (schema?.serverOnly === true || schema?.indexedDBKey === null) {
      console.log('⚡ [StorageHelpers] Skipping optimistic cleanup for server-only resource:', {
        storeName,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      console.log('🧹 [StorageHelpers] Starting optimistic record cleanup:', {
        storeName,
        hasBranchContext: !!branchContext,
        branchId: branchContext?.currentBranchId,
        timestamp: new Date().toISOString()
      });
      
      // Get all records from the store
      const allRecords = await this.indexedDB.getAll(storeName);
      
      console.log('🧹 [StorageHelpers] Retrieved all records for cleanup analysis:', {
        storeName,
        totalRecords: allRecords.length,
        sampleIds: allRecords.slice(0, 5).map((r: any) => r.id),
        timestamp: new Date().toISOString()
      });
      
      // ENHANCED: Find optimistic records using multiple criteria
      const optimisticRecords = allRecords.filter((record: any) => {
        const isOptimisticFlag = record.__optimistic === true;
        const hasOptimisticPrefix = record.id && typeof record.id === 'string' && record.id.startsWith('optimistic-');
        const hasOptimisticSource = record.__optimisticIdSource !== undefined;
        // Additional check: temporary IDs that look like UUIDs but were generated client-side
        const isClientUUID = record.__optimisticIdSource === 'client-uuid';
        // NEW: Check for client temp IDs used for server-generated entities
        const isClientTempId = record.__optimisticIdSource === 'client-temp-for-server-generated';
        const hasClientTempId = record.__clientTempId !== undefined;
        
        return isOptimisticFlag || hasOptimisticPrefix || hasOptimisticSource || isClientUUID || isClientTempId || hasClientTempId;
      });
      
      console.log('🧹 [StorageHelpers] Found optimistic records to clean:', {
        storeName,
        totalRecords: allRecords.length,
        optimisticCount: optimisticRecords.length,
        optimisticDetails: optimisticRecords.map((r: any) => ({
          id: r.id,
          __optimistic: r.__optimistic,
          __optimisticIdSource: r.__optimisticIdSource,
          hasOptimisticPrefix: r.id?.startsWith?.('optimistic-'),
          createdAt: r.createdAt
        })),
        timestamp: new Date().toISOString()
      });
      
      // Remove each optimistic record
      for (const record of optimisticRecords) {
        try {
          // Use direct delete regardless of branch context for cleanup
          await this.indexedDB.delete(storeName, record.id);
          
          console.log('🗑️ [StorageHelpers] Removed optimistic record:', {
            storeName,
            optimisticId: record.id,
            idSource: record.__optimisticIdSource,
            hadOptimisticFlag: record.__optimistic === true,
            timestamp: new Date().toISOString()
          });
        } catch (deleteError) {
          console.error('❌ [StorageHelpers] Failed to delete optimistic record:', {
            storeName,
            recordId: record.id,
            error: deleteError instanceof Error ? deleteError.message : deleteError,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Verify cleanup was successful
      const remainingRecords = await this.indexedDB.getAll(storeName);
      const remainingOptimistic = remainingRecords.filter((record: any) => 
        record.__optimistic === true || 
        (record.id && typeof record.id === 'string' && record.id.startsWith('optimistic-'))
      );
      
      console.log('✅ [StorageHelpers] Optimistic cleanup completed:', {
        storeName,
        removedCount: optimisticRecords.length,
        remainingTotal: remainingRecords.length,
        remainingOptimistic: remainingOptimistic.length,
        cleanupSuccessful: remainingOptimistic.length === 0,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('⚠️ [StorageHelpers] Failed to clean optimistic records:', {
        storeName,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
}