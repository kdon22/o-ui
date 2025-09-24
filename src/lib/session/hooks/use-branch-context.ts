/**
 * useBranchContext - Branch Context Hook
 * 
 * Single source of truth for branch context.
 * Provides branch switching, current/default branch IDs, and feature branch detection.
 * Never defaults to hardcoded 'main' - fails fast with clear errors.
 */

import { useSession } from 'next-auth/react';
import { useCallback, useMemo } from 'react';
import type { BranchContextHookReturn } from '../types';

export function useBranchContext(): BranchContextHookReturn {
  const { data: session, update: updateSession } = useSession();
  
  // ============================================================================
  // BRANCH CONTEXT DERIVATION - NO FALLBACKS
  // ============================================================================
  
  const branchData = useMemo(() => {
    // Return not-ready state during loading or if unauthenticated
    if (!session?.user) {
      return { 
        isReady: false, 
        reason: 'UNAUTHENTICATED' as const 
      };
    }
    
    // Missing tenant
    if (!session.user.tenantId) {
      return { 
        isReady: false, 
        reason: 'NO_TENANT' as const,
        error: 'User has no tenant assigned'
      };
    }
    
    // Missing branch context
    if (!session.user.branchContext) {
      return { 
        isReady: false, 
        reason: 'NO_BRANCHES' as const,
        error: 'User has no branch context in session'
      };
    }
    
    const { currentBranchId, defaultBranchId } = session.user.branchContext as any;
    
    // NO FALLBACKS: both IDs must be present in session
    
    // Fail if we can't determine branch context
    if (!currentBranchId || !defaultBranchId) {
      return { 
        isReady: false, 
        reason: 'NO_BRANCHES' as const,
        error: `Missing branch IDs - current: ${!!currentBranchId}, default: ${!!defaultBranchId}`
      };
    }
    
    // All requirements met
    return {
      isReady: true,
      currentBranchId,
      defaultBranchId,
      tenantId: session.user.tenantId,
      userId: session.user.id,
    } as const;
    
  }, [session]);
  
  // ============================================================================
  // BRANCH SWITCHING
  // ============================================================================
  
  const switchBranch = useCallback(async (branchId: string) => {
    if (!branchData.isReady) {
      throw new Error('Cannot switch branches: branch context not ready');
    }
    
    console.log('🔄 [useBranchContext] Switching to branch:', branchId);
    
    await updateSession({
      currentBranchId: branchId,
      branchContext: {
        currentBranchId: branchId,
        // Preserve other branch context data
      },
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ [useBranchContext] Branch switch completed');
  }, [branchData.isReady, updateSession]);
  
  // ============================================================================
  // DERIVED STATES
  // ============================================================================
  
  const isFeatureBranch = useMemo(() => {
    if (!branchData.isReady) return false;
    return branchData.currentBranchId !== branchData.defaultBranchId;
  }, [branchData]);
  
  // ============================================================================
  // RETURN VALUES
  // ============================================================================
  
  if (!branchData.isReady) {
    // Return non-ready state with safe defaults
    return {
      currentBranchId: '',
      defaultBranchId: '',
      tenantId: '',
      userId: '',
      isReady: false,
      switchBranch: async () => {
        throw new Error(`Branch context not ready: ${branchData.reason}${branchData.error ? ` - ${branchData.error}` : ''}`);
      },
      isFeatureBranch: false,
    };
  }
  
  return {
    currentBranchId: branchData.currentBranchId,
    defaultBranchId: branchData.defaultBranchId,
    tenantId: branchData.tenantId,
    userId: branchData.userId,
    isReady: true,
    switchBranch,
    isFeatureBranch,
  };
}
