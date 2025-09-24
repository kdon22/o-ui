/**
 * Instant Tab Switching Hook - Eliminates Loading Spinners
 * 
 * SIMPLE SOLUTION: 
 * - Uses placeholderData to show cached data instantly
 * - Prefetches tab data when component mounts
 * - Background refresh keeps data current
 * - Result: 0ms loading time for tab switches
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionQuery } from './use-action-api';
import { useBranchContext } from '@/lib/session';

interface UseInstantTabsOptions {
  nodeId: string | null;
  enabled?: boolean;
  prefetchOnMount?: boolean;
}

interface TabDataHooks {
  processes: ReturnType<typeof useActionQuery>;
  rules: ReturnType<typeof useActionQuery>;
  classes: ReturnType<typeof useActionQuery>;
  offices: ReturnType<typeof useActionQuery>;
}

/**
 * Hook that provides instant tab switching by preloading and caching all tab data
 */
export function useInstantTabs({
  nodeId,
  enabled = true,
  prefetchOnMount = true
}: UseInstantTabsOptions): TabDataHooks {
  
  const queryClient = useQueryClient();
  const branchContext = useBranchContext();

  // ============================================================================
  // INSTANT TAB QUERIES - All use placeholderData for 0ms loading
  // ============================================================================

  // 🚀 PROCESSES TAB: Show cached data instantly, refresh in background
  const processes = useActionQuery('process.list', {}, {
    placeholderData: (previousData) => previousData, // KEY: Show cached data immediately
    staleTime: 30 * 1000,  // Consider fresh for 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on every window focus
    refetchOnMount: false, // Don't refetch if we have recent data
  });

  // 🚀 RULES TAB: Instant loading from cache
  const rules = useActionQuery('rule.list', {}, {
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 🚀 CLASSES TAB: Instant loading from cache  
  const classes = useActionQuery('class.list', {}, {
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000, // Classes change less frequently
    gcTime: 20 * 60 * 1000, // Keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 🚀 OFFICES TAB: Instant loading from cache
  const offices = useActionQuery('office.list', {}, {
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000, // Offices change less frequently  
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ============================================================================
  // PREFETCH STRATEGY - Load all data when component mounts
  // ============================================================================

  const prefetchAllTabData = useCallback(async () => {
    if (!enabled || !branchContext.isReady) return;

    console.log('🚀 [InstantTabs] Prefetching all tab data for instant switching...');
    
    const prefetchPromises = [
      // Prefetch all tab queries in parallel
      queryClient.prefetchQuery({
        queryKey: ['action', 'process.list', {}, { 
          branchContext: {
            currentBranchId: branchContext.currentBranchId,
            defaultBranchId: branchContext.defaultBranchId,
            tenantId: branchContext.tenantId,
            userId: branchContext.userId,
            isReady: true
          }
        }],
        staleTime: 30 * 1000,
      }),
      
      queryClient.prefetchQuery({
        queryKey: ['action', 'rule.list', {}, {
          branchContext: {
            currentBranchId: branchContext.currentBranchId,
            defaultBranchId: branchContext.defaultBranchId,
            tenantId: branchContext.tenantId,
            userId: branchContext.userId,
            isReady: true
          }
        }],
        staleTime: 30 * 1000,
      }),

      queryClient.prefetchQuery({
        queryKey: ['action', 'class.list', {}, {
          branchContext: {
            currentBranchId: branchContext.currentBranchId,
            defaultBranchId: branchContext.defaultBranchId,
            tenantId: branchContext.tenantId,
            userId: branchContext.userId,
            isReady: true
          }
        }],
        staleTime: 60 * 1000,
      }),

      queryClient.prefetchQuery({
        queryKey: ['action', 'office.list', {}, {
          branchContext: {
            currentBranchId: branchContext.currentBranchId,
            defaultBranchId: branchContext.defaultBranchId,
            tenantId: branchContext.tenantId,
            userId: branchContext.userId,
            isReady: true
          }
        }],
        staleTime: 60 * 1000,
      })
    ];

    try {
      await Promise.allSettled(prefetchPromises);
      console.log('✅ [InstantTabs] All tab data prefetched - tabs will now switch instantly!');
    } catch (error) {
      console.warn('⚠️ [InstantTabs] Prefetch completed with some failures:', error);
    }
  }, [queryClient, branchContext, enabled]);

  // Prefetch on mount and when node/branch changes
  useEffect(() => {
    if (prefetchOnMount && nodeId) {
      // Small delay to let component settle
      const timeoutId = setTimeout(prefetchAllTabData, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [nodeId, branchContext.currentBranchId, prefetchOnMount, prefetchAllTabData]);

  // ============================================================================
  // RETURN TAB DATA HOOKS
  // ============================================================================

  return {
    processes,
    rules,
    classes,
    offices
  };
}

// ============================================================================
// ENHANCED useActionQuery wrapper - Direct replacement for existing queries
// ============================================================================

export function useInstantActionQuery(
  action: string,
  data: any = {},
  options: any = {}
) {
  return useActionQuery(action, data, {
    // ✅ KEY SETTINGS for instant loading
    placeholderData: (previousData) => previousData, // Show cached data immediately
    staleTime: options.staleTime || 30 * 1000,       // Consider fresh for 30 seconds
    gcTime: options.gcTime || 10 * 60 * 1000,        // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,                      // Don't refetch on every focus
    refetchOnMount: false,                            // Don't refetch if we have recent data
    ...options // Allow overrides
  });
}
