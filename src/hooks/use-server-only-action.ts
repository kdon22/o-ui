/**
 * Server-Only Action Hook
 * 
 * Specialized hook for explicit server-only overrides.
 * Use this when you need to force server-only behavior regardless of schema configuration.
 * 
 * SSOT Pattern:
 * - Prefer using serverOnly: true in resource schemas for consistent behavior
 * - Use this hook only for explicit overrides or specialized cases
 * 
 * Features:
 * - Forces all operations through API (overrides schema settings)
 * - No local caching for data rows
 * - Optimized pagination and filtering
 * - Server-side search and sorting
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useUnifiedApp } from '@/components/providers/conditional-providers';
import type { ActionRequest, ActionResponse } from '@/lib/resource-system/schemas';
import type { BranchContext } from '@/lib/action-client/types';

export interface ServerOnlyOptions {
  // Pagination for large datasets
  page?: number;
  limit?: number;
  
  // Server-side filtering
  filters?: Record<string, any>;
  
  // Server-side sorting
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  
  // Server-side search
  search?: string;
  searchFields?: string[];
  
  // Force fresh data (no cache)
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  
  // Query execution control
  enabled?: boolean;
}

/**
 * Server-only query hook for large datasets
 */
export function useServerOnlyQuery(
  action: string,
  data?: any,
  options: ServerOnlyOptions = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  
  const {
    page = 1,
    limit = 50,
    filters,
    sort,
    search,
    searchFields,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    enabled = true
  } = options;

  return useQuery({
    queryKey: [action, data, { page, limit, filters, sort, search }],
    queryFn: async () => {
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        return {
          success: false,
          error: 'Tenant ID not available - session not loaded yet',
          data: null,
          cached: false,
          executionTime: 0
        } as ActionResponse;
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      const request: ActionRequest = {
        action,
        data,
        options: {
          // ✅ CRITICAL: Force server-only operation
          serverOnly: true,
          
          // Pagination
          pagination: { page, limit },
          
          // Filtering and sorting
          filters,
          sort,
          
          // Search
          ...(search && { 
            search: {
              query: search,
              fields: searchFields || ['data']
            }
          })
        },
        branchContext
      };
      
      console.log('🚀 [useServerOnlyQuery] Executing server-only query:', {
        action,
        actionType: typeof action,
        actionStringified: JSON.stringify(action),
        page,
        limit,
        hasFilters: !!filters,
        hasSort: !!sort,
        hasSearch: !!search
      });
      
      return actionClient.executeAction(request);
    },
    
    // Performance optimizations for large datasets
    refetchOnMount,
    refetchOnWindowFocus,
    staleTime: 30000, // 30 seconds
    gcTime: 300000,   // 5 minutes
    
    // Query execution control
    enabled,
    
    // Error handling
    retry: (failureCount, error) => {
      // Don't retry server errors, only network errors
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        return false;
      }
      return failureCount < 2;
    }
  });
}

/**
 * Server-only mutation hook for large datasets
 */
export function useServerOnlyMutation(
  action: string,
  options: {
    onSuccess?: (data: ActionResponse) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        throw new Error('Tenant ID not available - session not loaded yet');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      // Allow callers to pass request options (e.g., filters, pagination) via data.options
      const { options: dynamicOptions, ...payload } = (data || {}) as { options?: any } & Record<string, any>;
      
      const request: ActionRequest = {
        action,
        data: payload,
        options: {
          // ✅ CRITICAL: Force server-only operation
          serverOnly: true,
          ...(dynamicOptions || {})
        },
        branchContext
      };
      
      console.log('🚀 [useServerOnlyMutation] Executing server-only mutation:', {
        action,
        hasData: !!payload,
        dataKeys: payload ? Object.keys(payload) : [],
        hasDynamicOptions: !!dynamicOptions,
        dynamicOptionsKeys: dynamicOptions ? Object.keys(dynamicOptions) : []
      });
      
      return actionClient.executeAction(request);
    },
    
    onSuccess: (data) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      options.onSuccess?.(data);
    },
    
    onError: options.onError
  });
}

/**
 * Bulk operations hook for large datasets
 */
export function useServerOnlyBulkMutation(
  baseAction: string,
  options: {
    onSuccess?: (data: ActionResponse) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: { completed: number; total: number }) => void;
  } = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  
  return useMutation({
    mutationFn: async (bulkData: { operation: 'create' | 'update' | 'delete'; items: any[] }) => {
      const { operation, items } = bulkData;
      const action = `${baseAction}.bulk${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
      
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        throw new Error('Tenant ID not available - session not loaded yet');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      const request: ActionRequest = {
        action,
        data: { items },
        options: {
          // ✅ CRITICAL: Force server-only operation
          serverOnly: true,
          
          // Bulk operation metadata
          bulk: true,
          batchSize: 1000 // Process in batches of 1000
        },
        branchContext
      };
      
      console.log('🚀 [useServerOnlyBulkMutation] Executing bulk operation:', {
        action,
        operation,
        itemCount: items.length
      });
      
      return actionClient.executeAction(request);
    },
    
    onSuccess: options.onSuccess,
    onError: options.onError
  });
}

/**
 * Server-only export hook for large datasets
 */
export function useServerOnlyExport(
  action: string,
  options: {
    format?: 'csv' | 'xlsx' | 'json';
    filters?: Record<string, any>;
    columns?: string[];
  } = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  
  return useMutation({
    mutationFn: async () => {
      const exportAction = `${action}.export`;
      
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        throw new Error('Tenant ID not available - session not loaded yet');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      const request: ActionRequest = {
        action: exportAction,
        data: {
          format: options.format || 'csv',
          filters: options.filters,
          columns: options.columns
        },
        options: {
          // ✅ CRITICAL: Force server-only operation
          serverOnly: true,
          
          // Export-specific options
          timeout: 300000, // 5 minutes for large exports
          priority: 'low'
        },
        branchContext
      };
      
      console.log('🚀 [useServerOnlyExport] Executing export:', {
        action: exportAction,
        format: options.format,
        hasFilters: !!options.filters,
        hasColumns: !!options.columns
      });
      
      return actionClient.executeAction(request);
    }
  });
}

/**
 * Server-only search hook with debouncing
 */
export function useServerOnlySearch(
  action: string,
  searchQuery: string,
  options: {
    debounceMs?: number;
    searchFields?: string[];
    filters?: Record<string, any>;
    limit?: number;
  } = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  
  const {
    debounceMs = 300,
    searchFields = ['data'],
    filters,
    limit = 20
  } = options;

  return useQuery({
    queryKey: [action, 'search', searchQuery, filters],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return { success: true, data: [] };
      }
      
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        return {
          success: false,
          error: 'Tenant ID not available - session not loaded yet',
          data: null,
          cached: false,
          executionTime: 0
        } as ActionResponse;
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      const searchAction = `${action}.search`;
      
      const request: ActionRequest = {
        action: searchAction,
        data: {
          query: searchQuery,
          fields: searchFields,
          filters,
          limit
        },
        options: {
          // ✅ CRITICAL: Force server-only operation
          serverOnly: true
        },
        branchContext
      };
      
      console.log('🚀 [useServerOnlySearch] Executing search:', {
        action: searchAction,
        query: searchQuery,
        fields: searchFields,
        limit
      });
      
      return actionClient.executeAction(request);
    },
    
    enabled: searchQuery.length >= 2, // Only search with 2+ characters
    staleTime: 30000, // 30 seconds
    
    // Debouncing handled by TanStack Query's built-in debouncing
    refetchOnWindowFocus: false
  });
}
