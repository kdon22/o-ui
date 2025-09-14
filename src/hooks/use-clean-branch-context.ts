/**
 * Clean Branch Context Hook - Session-Based Only
 * 
 * Zero complexity, zero state management, just session data.
 * Replaces the complex branch provider system with simple session-based approach.
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface CleanBranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  isFeatureBranch: boolean;
  tenantId: string;
  userId: string;
}

/**
 * Get branch context from session only - no complex state management
 */
export function useCleanBranchContext(): CleanBranchContext {
  const { data: session } = useSession();
  
  return useMemo(() => ({
    currentBranchId: session?.user?.branchContext?.currentBranchId || 'main',
    defaultBranchId: session?.user?.branchContext?.defaultBranchId || 'main',
    isFeatureBranch: (session?.user?.branchContext?.currentBranchId || 'main') !== 
                     (session?.user?.branchContext?.defaultBranchId || 'main'),
    tenantId: session?.user?.tenantId || '',
    userId: session?.user?.id || ''
  }), [session]);
}

/**
 * Branch switching via NextAuth session update only
 * No cache invalidation needed - query keys handle separation automatically
 */
export function useCleanBranchSwitching() {
  const { update: updateSession } = useSession();
  
  const switchBranch = async (branchId: string) => {
    console.log('🔄 [CleanBranchSwitching] Switching to branch:', branchId);
    
    await updateSession({
      currentBranchId: branchId,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ [CleanBranchSwitching] Branch switch completed - query keys handle cache separation');
    // ✅ That's it! Query keys handle the rest automatically
  };
  
  return { switchBranch };
}
