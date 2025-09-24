/**
 * Action Client - Unified System Entry Point
 * 
 * GOLD STANDARD: No legacy code, unified system only
 * - <50ms reads from IndexedDB cache
 * - Enhanced resource methods with relationship support
 * - Complex business logic operations built-in
 * - Junction table operations through relationships
 * - Branch-aware operations throughout
 */

import UnifiedActionClient, { 
  createAndInitializeUnifiedActionClient as createAndInitializeUnifiedActionClientImpl 
} from './unified-action-client';

// ============================================================================
// UNIFIED ACTION CLIENT - PURE ES6 MODULE PATTERN
// ============================================================================

export function createUnifiedActionClient(tenantId: string): UnifiedActionClient {
  return new UnifiedActionClient(tenantId);
}

export async function createAndInitializeUnifiedActionClient(
  tenantId: string, 
  branchContext: any
): Promise<UnifiedActionClient> {
  return await createAndInitializeUnifiedActionClientImpl(tenantId, branchContext);
}

// Export the main client class
export { default as UnifiedActionClient } from './unified-action-client';

// ============================================================================
// CORE TYPES
// ============================================================================

export type { 
  BranchContext,
  ActionRequest,
  CompoundKey,
  StorageKey 
} from './types';

export type { ActionResponse, QueryOptions, MutationContext } from '@/lib/resource-system/schemas';

// Temporary type alias for compatibility
export type ActionClient = UnifiedActionClient;

// ============================================================================
// DEFAULT EXPORT - UNIFIED SYSTEM
// ============================================================================

export default UnifiedActionClient;

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

export const ActionClientFactory = {
  create: (tenantId: string) => {
    return createUnifiedActionClient(tenantId);
  },
  
  createAndInitialize: async (tenantId: string, branchContext: any) => {
    return await createAndInitializeUnifiedActionClient(tenantId, branchContext);
  }
};

// ============================================================================
// TEMPORARY COMPATIBILITY LAYER - WILL BE REMOVED
// ============================================================================

/**
 * Temporary function to maintain compatibility while migrating
 * This wraps the unified client to match the old interface
 */
export function getActionClient(tenantId: string, branchContext?: any) {
  if (!tenantId) {
    throw new Error('getActionClient requires tenantId');
  }
  
  const client = createUnifiedActionClient(tenantId);
  
  // Attach branch context immediately so writes/IndexedDB are branch-aware
  if (branchContext) {
    try {
      // Set branch context on the client instance
      (client as any).setBranchContext?.(branchContext);
      // Initialize unified layer in the background (non-blocking)
      if (typeof (client as any).initializeUnified === 'function') {
        void (client as any).initializeUnified(branchContext);
      }
    } catch (err) {
      console.warn('[getActionClient] Failed to initialize branch context:', err);
    }
  }
  
  return client;
}

/**
 * Temporary stub for clearAllTenantDatabases
 */
export async function clearAllTenantDatabases() {
  console.warn('clearAllTenantDatabases is deprecated. Use actionClient.clearCache() instead.');
  // For now, do nothing - individual clients will handle their own cache clearing
}