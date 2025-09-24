/**
 * useCRUDContext - Composed Hook for CRUD Operations
 * 
 * Convenience hook that combines auth + branch + navigation context
 * for CRUD forms and operations.
 */

import { useMemo } from 'react';
import { useAuth } from '../use-auth';
import { useBranchContext } from '../use-branch-context';
import { useNavigationContext } from '../use-navigation-context';
import type { CRUDContext } from '../../types';

export function useCRUDContext(): CRUDContext {
  const { tenantId, userId, isAuthenticated } = useAuth();
  const { currentBranchId, isReady: branchReady } = useBranchContext();
  const { lastSelectedNodeId } = useNavigationContext();
  
  return useMemo(() => {
    // Not ready if not authenticated
    if (!isAuthenticated || !tenantId || !userId) {
      return {
        tenantId: '',
        currentBranchId: '',
        parentNodeId: null,
        userId: '',
        isReady: false,
      };
    }
    
    // Not ready if branch context isn't ready
    if (!branchReady || !currentBranchId) {
      return {
        tenantId,
        currentBranchId: '',
        parentNodeId: null,
        userId,
        isReady: false,
      };
    }
    
    // Ready - return complete CRUD context
    return {
      tenantId,
      currentBranchId,
      parentNodeId: lastSelectedNodeId, // For auto-populating parent in forms
      userId,
      isReady: true,
    };
  }, [isAuthenticated, tenantId, userId, branchReady, currentBranchId, lastSelectedNodeId]);
}
