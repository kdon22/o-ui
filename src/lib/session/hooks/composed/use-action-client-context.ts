/**
 * useActionClientContext - Composed Hook for Action System
 * 
 * Convenience hook that combines auth + branch context
 * specifically for ActionClient usage patterns.
 */

import { useMemo } from 'react';
import { useAuth } from '../use-auth';
import { useBranchContext } from '../use-branch-context';
import type { ActionClientContext } from '../../types';

export function useActionClientContext(): ActionClientContext {
  const { tenantId, isAuthenticated } = useAuth();
  const branchContext = useBranchContext();
  
  return useMemo(() => {
    // Not ready if not authenticated or no tenant
    if (!isAuthenticated || !tenantId) {
      return {
        tenantId: '',
        branchContext: {
          currentBranchId: '',
          defaultBranchId: '',
          tenantId: '',
          userId: '',
          isReady: false,
        },
        isReady: false,
      };
    }
    
    // Not ready if branch context isn't ready
    if (!branchContext.isReady) {
      return {
        tenantId,
        branchContext: {
          currentBranchId: '',
          defaultBranchId: '',
          tenantId: '',
          userId: '',
          isReady: false,
        },
        isReady: false,
      };
    }
    
    // All ready - return complete context
    return {
      tenantId,
      branchContext: {
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId: branchContext.tenantId,
        userId: branchContext.userId,
        isReady: true,
      },
      isReady: true,
    };
  }, [isAuthenticated, tenantId, branchContext]);
}
