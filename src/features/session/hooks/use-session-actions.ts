/**
 * Session Actions Hook - ActionClient Integration
 * 
 * Provides session management through the ActionClient system:
 * - Branch switching with <50ms performance
 * - Offline-first session updates
 * - Optimistic UI updates
 * - Background server synchronization
 */

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useSessionData } from '@/lib/session/client';
import type { 
  UpdateBranchPayload, 
  RefreshContextPayload,
  BranchContext,
  SessionBranchData 
} from '../types';

export function useSessionActions() {
  const queryClient = useQueryClient();
  const { tenantId, isLoading, sessionValid } = useSessionData();
  
  // Only initialize ActionClient when session is ready
  const actionClient = useMemo(() => {
    if (isLoading || !sessionValid || !tenantId) {
      return null;
    }
    return getActionClient(tenantId);
  }, [tenantId, isLoading, sessionValid]);

  // ============================================================================
  // BRANCH SWITCHING ACTION
  // ============================================================================

  const updateBranch = useCallback(async (payload: UpdateBranchPayload): Promise<void> => {
    // Handle loading state gracefully
    if (!actionClient) {
      if (isLoading) {
        // Return early instead of throwing during SSR
        console.log('⏳ [SessionActions] Session still loading, skipping branch switch');
        return;
      }
      throw new Error('Session not available - please refresh and try again');
    }

    console.log('🔄 [SessionActions] Starting optimistic branch switch:', {
      targetBranchId: payload.branchId,
      targetBranchName: payload.branchName,
      timestamp: new Date().toISOString()
    });

    try {
      // Use ActionClient for optimistic updates + background sync
      await actionClient.session.updateBranch({
        ...payload,
        // ActionClient handles:
        // ✅ Immediate IndexedDB update
        // ✅ Optimistic UI state changes
        // ✅ Background server sync to /api/auth/session/branch
        // ✅ Rollback on failure
        // ✅ Retry logic with exponential backoff
      });

      console.log('✅ [SessionActions] Branch switch completed successfully:', {
        newBranchId: payload.branchId,
        branchName: payload.branchName
      });

      // Invalidate all queries for fresh branch data
      await queryClient.invalidateQueries();

      console.log('🗑️ [SessionActions] Query cache invalidated for new branch');

    } catch (error) {
      console.error('❌ [SessionActions] Branch switch failed:', {
        targetBranchId: payload.branchId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [actionClient, queryClient, isLoading]);

  // ============================================================================
  // SESSION REFRESH ACTION
  // ============================================================================

  const refreshContext = useCallback(async (payload: RefreshContextPayload = {}): Promise<void> => {
    if (!actionClient) {
      if (isLoading) {
        console.log('⏳ [SessionActions] Session still loading, skipping refresh');
        return;
      }
      throw new Error('Session not available - please refresh and try again');
    }

    console.log('🔄 [SessionActions] Refreshing session context:', {
      forceRefresh: payload.forceRefresh,
      timestamp: new Date().toISOString()
    });

    try {
      await actionClient.session.refreshContext(payload);
      
      console.log('✅ [SessionActions] Session context refreshed');
      
      // Invalidate session-related queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.includes('session') || queryKey.includes('branch');
        }
      });

    } catch (error) {
      console.error('❌ [SessionActions] Session refresh failed:', error);
      throw error;
    }
  }, [actionClient, queryClient, isLoading]);

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  const getCurrentBranchContext = useCallback(async (): Promise<BranchContext | null> => {
    if (!actionClient) {
      console.log('⏳ [SessionActions] ActionClient not available, cannot get branch context');
      return null;
    }

    try {
      const sessionData = await actionClient.session.read('current');
      
      if (!sessionData) {
        return null;
      }

      return {
        currentBranchId: sessionData.currentBranchId,
        defaultBranchId: sessionData.defaultBranchId,
        tenantId: sessionData.tenantId,
        userId: sessionData.userId
      };
    } catch (error) {
      console.error('❌ [SessionActions] Failed to get branch context:', error);
      return null;
    }
  }, [actionClient]);

  const getSessionBranchData = useCallback(async (): Promise<SessionBranchData | null> => {
    if (!actionClient) {
      console.log('⏳ [SessionActions] ActionClient not available, cannot get session branch data');
      return null;
    }

    try {
      // This would call actionClient to get current session + available branches
      const [sessionData, branches] = await Promise.all([
        actionClient.session.read('current'),
        actionClient.branches.list()
      ]);

      if (!sessionData || !branches) {
        return null;
      }

      const availableBranches = branches.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        description: branch.description,
        isDefault: branch.id === sessionData.defaultBranchId
      }));

      const currentBranch = availableBranches.find(b => b.id === sessionData.currentBranchId) || null;
      const defaultBranch = availableBranches.find(b => b.id === sessionData.defaultBranchId) || null;

      return {
        currentBranch,
        defaultBranch,
        availableBranches
      };
    } catch (error) {
      console.error('❌ [SessionActions] Failed to get session branch data:', error);
      return null;
    }
  }, [actionClient]);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    // State
    isLoading: isLoading || !actionClient,
    isReady: !isLoading && !!actionClient,
    
    // Actions
    updateBranch,
    refreshContext,
    
    // Utilities  
    getCurrentBranchContext,
    getSessionBranchData,
    
    // Direct access to action client for advanced use (may be null during loading)
    sessionClient: actionClient?.session || null
  };
}