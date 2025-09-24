/**
 * useFormContext - Composed Hook for Form Components
 * 
 * Convenience hook that provides all context data needed for
 * auto-forms and form components including defaults and validation.
 */

import { useMemo } from 'react';
import { useAuth } from '../use-auth';
import { useBranchContext } from '../use-branch-context';
import { useNavigationContext } from '../use-navigation-context';
import type { FormContext } from '../../types';

export function useFormContext(): FormContext {
  const { tenantId, userId, isAuthenticated } = useAuth();
  const { currentBranchId, defaultBranchId, isReady: branchReady } = useBranchContext();
  const { lastSelectedNodeId } = useNavigationContext();
  
  return useMemo(() => {
    // Not ready if not authenticated
    if (!isAuthenticated || !tenantId || !userId) {
      return {
        tenantId: '',
        currentBranchId: '',
        defaultBranchId: '',
        userId: '',
        lastSelectedNodeId: null,
        isReady: false,
      };
    }
    
    // Not ready if branch context isn't ready
    if (!branchReady || !currentBranchId || !defaultBranchId) {
      return {
        tenantId,
        currentBranchId: '',
        defaultBranchId: '',
        userId,
        lastSelectedNodeId: null,
        isReady: false,
      };
    }
    
    // Ready - return complete form context
    return {
      tenantId,
      currentBranchId,
      defaultBranchId,
      userId,
      lastSelectedNodeId, // For auto-populating forms
      isReady: true,
    };
  }, [
    isAuthenticated, 
    tenantId, 
    userId, 
    branchReady, 
    currentBranchId, 
    defaultBranchId, 
    lastSelectedNodeId
  ]);
}
