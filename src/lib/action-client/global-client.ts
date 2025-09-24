/**
 * Global Client Management - Multi-Tenant Instance Management
 * 
 * Handles:
 * - Global ActionClient instance management
 * - Multi-tenant switching
 * - Database cleanup operations
 * - Debug utilities
 */

import type { ActionClient } from './action-client-core';
import type { BranchContext } from './types';

// ============================================================================
// GLOBAL INSTANCE MANAGEMENT - Multi-Tenant Support
// ============================================================================

let globalActionClient: ActionClient | null = null;

import { ActionClientCore } from './action-client-core';

/**
 * Create a new ActionClient instance
 */
export function createActionClient(tenantId: string): ActionClient {
  return new ActionClientCore(tenantId);
}

/**
 * Get or create ActionClient with proper branchContext
 * This is the standard way to get an ActionClient - always configured and ready
 */
export function getActionClient(tenantId: string, branchContext?: BranchContext): ActionClient {
  if (!tenantId) {
    throw new Error('getActionClient requires tenantId');
  }
  
  if (!globalActionClient || globalActionClient.getTenantId() !== tenantId) {
    globalActionClient = createActionClient(tenantId);
  }
  
  // Set branch context only if provided (for global entities, it's optional)
  if (branchContext) {
    globalActionClient.setBranchContext(branchContext);
  }
  
  return globalActionClient;
}

/**
 * Switch global tenant context
 */
export function switchTenant(tenantId: string): void {
  const client = getActionClient(tenantId);
  // Global action client switched to tenant
}

/**
 * Clear data for specific tenant
 */
export async function clearTenantData(tenantId: string): Promise<void> {
  const client = getActionClient(tenantId);
  await client.clearTenantData();
}

/**
 * Clear all tenant databases (nuclear option)
 */
export async function clearAllTenantDatabases(): Promise<void> {
  // Clearing all tenant databases
  
  try {
    const databases = await indexedDB.databases();
    const tenantDbs = databases.filter(db => db.name?.startsWith('o-'));
    
    await Promise.all(tenantDbs.map(async db => {
      if (db.name) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(db.name!);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onblocked = () => resolve(); // Continue anyway
        });
      }
    }));
    
    // All tenant databases cleared successfully
    globalActionClient = null;
    
  } catch (error) {
    
    throw error;
  }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Setup browser console debug utilities
 */
export function setupDebugUtilities(): void {
  if (typeof window !== 'undefined') {
    (window as any).__DEBUG_SYNC_QUEUE = {
      checkStatus: () => {
        const client = globalActionClient;
        if (!client) {
          // No ActionClient available
          return null;
        }
        return client.getSyncQueueStatus();
      },
      clearQueue: () => {
        const client = globalActionClient;
        if (!client) {
          // No ActionClient available
          return;
        }
        client.clearSyncQueue();
        // Sync queue cleared
      }
    };
  }
}

// Auto-setup debug utilities
setupDebugUtilities();