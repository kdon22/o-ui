/**
 * Action Cache Hook - Cache management utilities
 * 
 * Provides utilities for manual cache management and invalidation
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { debouncedInvalidateQueries } from './cache-invalidation';
import { queryKeys } from './query-keys';

/**
 * Hook for manual cache management operations
 */
export function useActionCache() {
  const queryClient = useQueryClient();

  /**
   * Invalidate all queries for a specific resource
   */
  const invalidateResource = useCallback((resource: string) => {
    console.log('🔄 [useActionCache] Manual resource invalidation', {
      resource,
      timestamp: new Date().toISOString()
    });

    debouncedInvalidateQueries(
      queryClient,
      queryKeys.resource(resource),
      { exact: false },
      100
    );
  }, [queryClient]);

  /**
   * Invalidate a specific action query
   */
  const invalidateAction = useCallback((action: string, data?: any, branchId?: string) => {
    console.log('🔄 [useActionCache] Manual action invalidation', {
      action,
      data,
      branchId,
      timestamp: new Date().toISOString()
    });

    const queryKey = queryKeys.actionData(action, data, branchId);
    debouncedInvalidateQueries(
      queryClient,
      queryKey,
      { exact: true },
      50
    );
  }, [queryClient]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    console.log('🔄 [useActionCache] Clearing all cache', {
      timestamp: new Date().toISOString()
    });

    queryClient.clear();
  }, [queryClient]);

  /**
   * Get cached data for a specific query
   */
  const getCachedData = useCallback((action: string, data?: any, branchId?: string) => {
    const queryKey = queryKeys.actionData(action, data, branchId);
    return queryClient.getQueryData(queryKey);
  }, [queryClient]);

  /**
   * Set cached data for a specific query
   */
  const setCachedData = useCallback((action: string, data: any, cachedData: any, branchId?: string) => {
    const queryKey = queryKeys.actionData(action, data, branchId);
    queryClient.setQueryData(queryKey, cachedData);
  }, [queryClient]);

  /**
   * Prefetch data for a specific action
   */
  const prefetchAction = useCallback(async (action: string, data?: any, branchId?: string) => {
    const queryKey = queryKeys.actionData(action, data, branchId);
    
    // This would need the actual query function - for now just log
    console.log('🔄 [useActionCache] Prefetch requested', {
      action,
      data,
      branchId,
      queryKey,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implement actual prefetch with query function
  }, [queryClient]);

  return {
    invalidateResource,
    invalidateAction,
    clearCache,
    getCachedData,
    setCachedData,
    prefetchAction,
    
    // Direct access to query client for advanced usage
    queryClient
  };
}
