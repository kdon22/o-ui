/**
 * ActionClient Singleton - Enterprise Pattern
 * 
 * GOLD STANDARD: Single instance per tenant, no re-initialization spam
 * - One ActionClient per tenantId (cached)
 * - Automatic branch context updates
 * - No multiple initializations
 * - Fast <50ms access after first load
 */

import type UnifiedActionClient from './unified-action-client';
import type { BranchContext } from './types';

// ============================================================================
// SINGLETON CACHE
// ============================================================================

const clientCache = new Map<string, UnifiedActionClient>();
let isInitializing = new Map<string, Promise<UnifiedActionClient>>();

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

function getCacheKey(tenantId: string): string {
  return `tenant:${tenantId}`;
}

// ============================================================================
// SINGLETON ACCESS PATTERN
// ============================================================================

export async function getActionClientSingleton(
  tenantId: string, 
  branchContext?: BranchContext
): Promise<UnifiedActionClient> {
  console.log('[ActionClientSingleton] getActionClientSingleton called', {
    tenantId,
    hasBranchContext: !!branchContext,
    branchIds: branchContext ? {
      current: branchContext.currentBranchId,
      default: branchContext.defaultBranchId
    } : null,
    timestamp: new Date().toISOString()
  });
  if (!tenantId) {
    throw new Error('ActionClient requires tenantId');
  }

  const cacheKey = getCacheKey(tenantId);

  // ✅ Return existing client if available
  const existingClient = clientCache.get(cacheKey);
  if (existingClient?.isUnifiedInitialized()) {
    // Update branch context if provided
    if (branchContext) {
      (existingClient as any).setBranchContext?.(branchContext);
    }
    console.log('[ActionClientSingleton] cache HIT - returning existing client', {
      tenantId,
      initialized: existingClient.isUnifiedInitialized(),
      timestamp: new Date().toISOString()
    });
    return existingClient;
  }

  // ✅ Prevent multiple simultaneous initializations
  if (isInitializing.has(cacheKey)) {
    console.log('[ActionClientSingleton] initialization in progress - awaiting existing promise', {
      tenantId,
      timestamp: new Date().toISOString()
    });
    return await isInitializing.get(cacheKey)!;
  }

  // ✅ Initialize new client
  console.log('[ActionClientSingleton] cache MISS - creating new client', {
    tenantId,
    hasBranchContext: !!branchContext,
    timestamp: new Date().toISOString()
  });
  const initPromise = createAndCacheClient(tenantId, branchContext);
  isInitializing.set(cacheKey, initPromise);

  try {
    const client = await initPromise;
    clientCache.set(cacheKey, client);
    console.log('[ActionClientSingleton] client created and cached', {
      tenantId,
      initialized: client.isUnifiedInitialized(),
      timestamp: new Date().toISOString()
    });
    return client;
  } finally {
    console.log('[ActionClientSingleton] initialization promise cleared', {
      tenantId,
      timestamp: new Date().toISOString()
    });
    isInitializing.delete(cacheKey);
  }
}

// ============================================================================
// CLIENT CREATION & INITIALIZATION
// ============================================================================

async function createAndCacheClient(
  tenantId: string, 
  branchContext?: BranchContext
): Promise<UnifiedActionClient> {
  
  // Lazy import to avoid circular dependencies
  const { createAndInitializeUnifiedActionClient } = await import('./unified-action-client');
  
  const client = await createAndInitializeUnifiedActionClient(
    tenantId, 
    branchContext || getDefaultBranchContext()
  );

  return client;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getDefaultBranchContext(): BranchContext {
  return {
    currentBranchId: 'main',
    defaultBranchId: 'main',
    tenantId: '',
    userId: '',
  };
}

export function clearClientCache(tenantId?: string): void {
  if (tenantId) {
    const cacheKey = getCacheKey(tenantId);
    clientCache.delete(cacheKey);
    isInitializing.delete(cacheKey);
  } else {
    clientCache.clear();
    isInitializing.clear();
  }
}

export function getCachedClient(tenantId: string): UnifiedActionClient | null {
  const cacheKey = getCacheKey(tenantId);
  return clientCache.get(cacheKey) || null;
}

// ============================================================================
// CONTEXT UPDATE HELPER
// ============================================================================

export function updateBranchContext(tenantId: string, branchContext: BranchContext): void {
  const client = getCachedClient(tenantId);
  if (client) {
    (client as any).setBranchContext?.(branchContext);
  }
}
