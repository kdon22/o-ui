/**
 * Unified Action Client - Next Generation Data Layer
 * 
 * GOLD STANDARD: Complete replacement for legacy action client
 * - Pure action system with no relationship engine
 * - Uses Unified Resource Registry
 * - Pure action system operations
 * - Eliminates all legacy patterns
 */

import { ActionClientCore } from './action-client-core';
import type { BranchContext } from './types';
import type { ActionResponse } from '@/lib/resource-system/schemas';
import { 
  initializeUnifiedResourceSystem,
  type UnifiedResourceRegistry 
} from '@/lib/resource-system/unified-resource-registry';

// ============================================================================
// UNIFIED ACTION CLIENT
// ============================================================================

export class UnifiedActionClient extends ActionClientCore {
  private resourceRegistry: UnifiedResourceRegistry | null = null;
  private unifiedInitialized = false;
  
  constructor(tenantId: string) {
    super(tenantId);
  }
  
  // ============================================================================
  // UNIFIED INITIALIZATION
  // ============================================================================
  
  async initializeUnified(branchContext: BranchContext): Promise<void> {
    if (this.unifiedInitialized) {
      return;
    }
    
    // Initialize unified resource system
    this.resourceRegistry = await initializeUnifiedResourceSystem(this, branchContext);
    
    this.unifiedInitialized = true;
  }
  
  // ============================================================================
  // RESOURCE ACCESS
  // ============================================================================
  
  isUnifiedInitialized(): boolean {
    return this.unifiedInitialized;
  }
  
  getResourceRegistry(): UnifiedResourceRegistry | null {
    return this.resourceRegistry;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export async function createAndInitializeUnifiedActionClient(
  tenantId: string, 
  branchContext: BranchContext
): Promise<UnifiedActionClient> {
  const client = new UnifiedActionClient(tenantId);
  await client.initializeUnified(branchContext);
  return client;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default UnifiedActionClient;