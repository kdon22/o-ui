/**
 * Enterprise Action API Hooks - SSR Compatible
 * 
 * GOLD STANDARD: Never throws during SSR, handles session loading gracefully
 * - Pages render immediately with loading states
 * - API calls fail gracefully if no session
 * - Progressive enhancement pattern
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getActionClient } from '@/lib/action-client';
import type { ActionRequest, ActionResponse, BranchContext } from '@/lib/action-client/types';
import { useBranchContextWithLoading } from '@/lib/context/branch-context';

// ============================================================================
// ENTERPRISE SESSION HOOK - NEVER THROWS
// ============================================================================

export function useEnterpriseSession() {
  const { data: session, status } = useSession();
  
  // ============================================================================
  // BRANCH CONTEXT FROM SSOT - SINGLE SOURCE OF TRUTH
  // ============================================================================
  
  const branchContext = useBranchContextWithLoading();
  
  return {
    session,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    isReady: status === 'authenticated',
    userId: session?.user?.id || null,
    tenantId: session?.user?.tenantId || null,
    branchContext, // From SSOT - null during loading, ready context when available
    // Never throws - returns null for unauthenticated states
  };
}

// ============================================================================
// ENTERPRISE ACTION QUERY - SSR COMPATIBLE
// ============================================================================

export interface EnterpriseQueryOptions<TData = any> extends Omit<UseQueryOptions<ActionResponse<TData>>, 'queryKey' | 'queryFn'> {
  fallbackToCache?: boolean;
  maxCacheAge?: number;
  background?: boolean;
  skipCache?: boolean;
}

export function useEnterpriseActionQuery<TData = any>(
  action: string,
  data?: any,
  options?: EnterpriseQueryOptions<TData>
) {
  const queryClient = useQueryClient();
  const { session, isAuthenticated, isLoading: sessionLoading, tenantId, branchContext } = useEnterpriseSession();
  
  // ✅ ENTERPRISE: Handle session loading gracefully
  const queryKey = [action, data, branchContext?.currentBranchId];
  
  const queryFn = async (): Promise<ActionResponse<TData>> => {
    // Return early if no session - no error thrown
    if (!isAuthenticated || !tenantId) {
      return {
        success: false,
        error: 'Session not available',
        data: null,
        cached: false,
        executionTime: 0
      } as ActionResponse<TData>;
    }

    const request: ActionRequest = {
      action,
      data,
      options: {
        ...options,
      },
      branchContext: branchContext || undefined
    };

    try {
      const actionClient = getActionClient(tenantId, branchContext);
      const result = await actionClient.executeAction(request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        cached: false,
        executionTime: 0
      } as ActionResponse<TData>;
    }
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && !sessionLoading, // Only run when session is ready
    ...options,
  });
}

// ============================================================================
// ENTERPRISE ACTION MUTATION - SSR COMPATIBLE
// ============================================================================

export interface EnterpriseMutationOptions<TData = any, TVariables = any> extends Omit<UseMutationOptions<ActionResponse<TData>, Error, TVariables>, 'mutationFn'> {
  optimistic?: boolean;
  invalidateQueries?: string[];
  background?: boolean;
}

export function useEnterpriseActionMutation<TData = any, TVariables = any>(
  action: string,
  options?: EnterpriseMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { session, isAuthenticated, tenantId, branchContext } = useEnterpriseSession();

  const mutationFn = async (variables: TVariables): Promise<ActionResponse<TData>> => {
    // Return early if no session - no error thrown
    if (!isAuthenticated || !tenantId) {
      throw new Error('Session not available - please log in');
    }

    const request: ActionRequest = {
      action,
      data: variables,
      branchContext: branchContext || undefined,
      context: {
        userId: session?.user?.id || 'current-user',
        tenantId: tenantId,
        timestamp: Date.now(),
      }
    };

    try {
      const actionClient = getActionClient(tenantId, branchContext);
      const result = await actionClient.executeAction(request);
      
      if (!result.success) {
        throw new Error(result.error || `Action ${action} failed`);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  return useMutation({
    mutationFn,
    ...options,
  });
}

// ============================================================================
// ENTERPRISE RESOURCE HOOKS - SSR COMPATIBLE
// ============================================================================

export function useEnterpriseResourceItem<TData = any>(
  resource: string,
  id: string,
  options?: EnterpriseQueryOptions<TData>
) {
  return useEnterpriseActionQuery<TData>(`${resource}.read`, { id }, options);
}

export function useEnterpriseResourceCreate<TData = any, TVariables = any>(
  resource: string,
  options?: EnterpriseMutationOptions<TData, TVariables>
) {
  return useEnterpriseActionMutation<TData, TVariables>(`${resource}.create`, options);
}

export function useEnterpriseResourceUpdate<TData = any, TVariables = any>(
  resource: string,
  options?: EnterpriseMutationOptions<TData, TVariables>
) {
  return useEnterpriseActionMutation<TData, TVariables>(`${resource}.update`, options);
}

export function useEnterpriseResourceDelete<TVariables = any>(
  resource: string,
  options?: EnterpriseMutationOptions<void, TVariables>
) {
  return useEnterpriseActionMutation<void, TVariables>(`${resource}.delete`, options);
}

// ============================================================================
// ENTERPRISE UTILITY HOOKS
// ============================================================================

export function useEnterpriseDataAvailability(action: string, data?: any) {
  const { isAuthenticated, isLoading: sessionLoading } = useEnterpriseSession();
  
  return {
    isAvailable: isAuthenticated && !sessionLoading,
    isAuthenticated,
    isLoading: sessionLoading,
  };
}

