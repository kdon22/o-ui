/**
 * useActionClientContext - Composed hook for ActionClient usage
 *
 * Provides tenantId and strict BranchContext for the Action System.
 * Never falls back; returns isReady=false until both auth and branch
 * contexts are available.
 */

import { useMemo } from 'react';
import { useAuth } from '../use-auth';
import { useBranchContext } from '../use-branch-context';
import type { ActionClientContext, BranchContext as SessionBranchContext } from '../../types';

export function useActionClientContext(): ActionClientContext {
  const { tenantId, userId, isAuthenticated } = useAuth();
  const branch = useBranchContext();

  return useMemo((): ActionClientContext => {
    // Not ready until authenticated and branch context ready
    if (!isAuthenticated || !tenantId || !userId || !branch.isReady) {
      return {
        tenantId: '',
        // Provide a structurally-correct placeholder to satisfy types,
        // but callers must gate on isReady before using it.
        branchContext: {
          currentBranchId: '',
          defaultBranchId: '',
          tenantId: '',
          userId: '',
          isReady: true,
        } as SessionBranchContext,
        isReady: false,
      };
    }

    const branchContext: SessionBranchContext = {
      currentBranchId: branch.currentBranchId,
      defaultBranchId: branch.defaultBranchId,
      tenantId: branch.tenantId,
      userId: branch.userId,
      isReady: true,
    };

    return {
      tenantId,
      branchContext,
      isReady: true,
    };
  }, [isAuthenticated, tenantId, userId, branch.currentBranchId, branch.defaultBranchId, branch.tenantId, branch.userId, branch.isReady]);
}
