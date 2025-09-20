/**
 * Action Query Hook - Cache-first data fetching
 * 
 * Provides TanStack Query integration with ActionClient for reads
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect, useRef } from 'react';
import type { ActionRequest, ActionResponse } from '@/lib/resource-system/schemas';
import { getActionClient } from '@/lib/action-client';
import { useOptionalCacheContext } from '@/components/providers/cache-provider';
import { useEnterpriseSession } from '../use-enterprise-action-api';
import { queryKeys } from './query-keys';

// ============================================================================
// TYPES
// ============================================================================

export interface ActionQueryOptions<TData = any> extends Omit<UseQueryOptions<ActionResponse<TData>>, 'queryKey' | 'queryFn'> {
  skipCache?: boolean;
  background?: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Cache-first query hook with automatic fallback to API
 * 
 * @param action - Action name (e.g., 'node.list', 'process.get')
 * @param data - Action data/parameters
 * @param options - Query options
 * @returns TanStack Query result with enhanced features
 */
export function useActionQuery<TData = any>(
  action: string,
  data?: any,
  options?: ActionQueryOptions<TData>
) {
  const queryClient = useQueryClient();
  const { session, branchContext } = useEnterpriseSession();
  
  // Gracefully handle CacheProvider not being available yet
  const cacheContext = useOptionalCacheContext();
  
  const queryKey = useMemo(() => {
    const branchId = branchContext?.currentBranchId || undefined;
    const key = queryKeys.actionData(action, data, branchId);
    return key;
  }, [action, data, branchContext?.currentBranchId]);

  // ==========================================================================
  // BRANCH SWITCH DETECTION
  // ==========================================================================
  // When switching branches we do NOT want to keep previous data because that
  // shows items from the prior branch until the refetch completes. Detect the
  // change and disable keepPreviousData + placeholderData for that frame.
  const currentBranchId = branchContext?.currentBranchId || undefined;
  const prevBranchIdRef = useRef<string | undefined>(currentBranchId);
  const isBranchSwitch = prevBranchIdRef.current !== currentBranchId;
  useEffect(() => {
    prevBranchIdRef.current = currentBranchId;
  }, [currentBranchId]);

  // ============================================================================
  // INITIAL DATA FROM CACHE
  // ============================================================================
  const initialData = useCallback(() => {
    if (!cacheContext?.isInitialized) return undefined;
    
    // Try to get initial data from cache
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) {
      return cachedData as ActionResponse<TData>;
    }
    
    return undefined;
  }, [action, queryKey, queryClient, cacheContext?.isInitialized]);

  // ============================================================================
  // QUERY FUNCTION
  // ============================================================================
  const queryFn = useCallback(async (): Promise<ActionResponse<TData>> => {
    const startTime = performance.now();
    
    const request: ActionRequest = {
      action,
      data,
      options: {
        ...options,
        // Pass skipCache directly - SSOT with ActionClient
      },
      branchContext: branchContext || undefined
    };

    // Only log server requests in development when debugging
    if (process.env.NODE_ENV === 'development' && action.includes('debug')) {
      console.log('🚀 [useActionQuery] Server request:', {
        action,
        currentBranchId: request.branchContext?.currentBranchId,
      });
    }

    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
      // Return a safe error response instead of throwing during SSR
      return {
        success: false,
        error: 'Tenant ID not available - session not loaded yet',
        data: null,
        cached: false,
        executionTime: 0
      } as ActionResponse<TData>;
    }

    const actionClient = getActionClient(tenantId, branchContext);
    const result = await actionClient.executeAction(request);
    
    // 🔍 DEBUG: Log server response details  
    console.log('🚀 [useActionQuery] Server response:', {
      action,
      success: result.success,
      cached: result.cached,
      executionTime: result.executionTime,
      dataSize: result.data ? JSON.stringify(result.data).length : 0,
      timestamp: new Date().toISOString()
    });

    return result;
  }, [action, data, options, branchContext, session?.user?.tenantId]);

  // ============================================================================
  // QUERY CONFIGURATION
  // ============================================================================
  const query = useQuery({
    queryKey,
    queryFn,
    initialData: initialData(),
    
    // Performance optimizations
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
    
    // Branch switch handling
    placeholderData: isBranchSwitch ? undefined : (previousData) => previousData,
    
    // Error handling
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message?.includes('Tenant ID not available')) {
        return false;
      }
      return failureCount < 3;
    },
    
    // Merge with user options
    ...options,
  });

  // ============================================================================
  // ENHANCED RETURN VALUE
  // ============================================================================
  const isActuallyLoading = query.isLoading && !query.data;
  
  return {
    ...query,
    
    // Enhanced loading states
    isActuallyLoading,
    isBackground: query.isFetching && !isActuallyLoading,
  };
}
