/**
 * Unified Action API Hook - Single Source of Truth (SSOT)
 * 
 * This hook provides unified server-only patterns using schema-driven configuration:
 * - Uses schema serverOnly: true for consistent behavior
 * - Centralizes server-side rendering (SSR) configuration
 * 
 * SSOT Pattern: serverOnly behavior is defined in resource schemas, not hook options.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useUnifiedApp } from '@/components/providers/conditional-providers';
import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';
import type { ActionRequest, ActionResponse, QueryOptions } from '@/lib/resource-system/schemas';
import type { BranchContext } from '@/lib/action-client/types';

export interface UnifiedActionQueryOptions {
  // Data fetching options
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  search?: string;
  searchFields?: string[];
  
  // Query control
  enabled?: boolean;
  
  // React Query options
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  
  // Performance hints
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface UnifiedActionMutationOptions {
  onSuccess?: (data: ActionResponse) => void;
  onError?: (error: Error) => void;
  invalidateQueries?: string[];
  
  // Performance overrides
  timeout?: number;
  retries?: number;
}

/**
 * Unified query hook - works optimally for all resource types
 */
export function useUnifiedActionQuery(
  action: string,
  data?: any,
  options: UnifiedActionQueryOptions = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  
  // Extract resource type from action
  const resourceType = action.split('.')[0];
  
  // Check schema configuration for server-only behavior
  const schema = getResourceByActionPrefix(resourceType);
  const isServerOnly = schema?.serverOnly === true;
  
  // Get performance config (simple defaults)
  const perfConfig = {
    timeout: 10000, // 10 seconds default
    retries: 2,
    priority: 'normal' as const
  };
  
  const {
    page = 1,
    limit = 50,
    filters,
    sort,
    search,
    searchFields,
    enabled = true,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    staleTime = isServerOnly ? 60000 : 300000, // Server-only data stales faster
    timeout = options.timeout || perfConfig.timeout,
    retries = options.retries || perfConfig.retries
  } = options;

  return useQuery({
    queryKey: [action, data, { page, limit, filters, sort, search, isServerOnly }],
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
      
      const queryOptions: QueryOptions = {
        // Pagination
        ...(page && limit && { pagination: { page, limit } }),
        
        // Filtering and sorting
        ...(filters && { filters }),
        ...(sort && { sort: { field: sort.field, direction: sort.order } }),
        
        // Search
        ...(search && { search }),
        
        // Force server-only if requested or if schema specifies it
        // serverOnly configuration handled by ActionClient based on schema
        
        // Performance
        ...(timeout && { timeout }),
        ...(retries && { retries })
      };
      
      const request: ActionRequest = {
        action,
        data,
        options: queryOptions,
        branchContext
      };
      
      console.log('🚀 [UnifiedActionQuery] Executing query:', {
        action,
        resourceType,
        isServerOnly,
        strategy: isServerOnly ? 'server-only' : 'indexeddb-first',
        page,
        limit,
        hasFilters: !!filters,
        hasSort: !!sort,
        hasSearch: !!search,
        // serverOnly configuration handled by ActionClient based on schema
        timeout,
        retries
      });
      
      return actionClient.executeAction(request);
    },
    
    // Dynamic configuration based on resource strategy
    enabled,
    refetchOnMount,
    refetchOnWindowFocus,
    staleTime,
    
    // Error handling with configurable retries
    retry: (failureCount, error) => {
      if (failureCount >= retries) {
        return false;
      }
      return true;
    },
    
    // Performance optimizations
    ...(isServerOnly && {
      // Server-only resources get less aggressive caching
      gcTime: 300000 // 5 minutes
    }),
    
    ...(!isServerOnly && {
      // IndexedDB-first resources can cache longer
      gcTime: 1800000 // 30 minutes
    })
  });
}

/**
 * Unified mutation hook - works optimally for all resource types
 */
export function useUnifiedActionMutation(
  action: string,
  options: UnifiedActionMutationOptions = {}
) {
  const { session, branchContext, tenantId } = useUnifiedApp();
  const queryClient = useQueryClient();
  
  // Extract resource type from action
  const resourceType = action.split('.')[0];
  
  // Get performance config (simple defaults)
  const perfConfig = {
    timeout: 10000, // 10 seconds default
    retries: 2,
    priority: 'normal' as const
  };
  const timeout = options.timeout || perfConfig.timeout;
  const retries = options.retries || perfConfig.retries;
  
  return useMutation({
    mutationFn: async (data: any) => {
      // Ensure we have valid tenant ID
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId || typeof validTenantId !== 'string') {
        throw new Error('Tenant ID not available - session not loaded yet');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      // Extract options from data if provided
      const { options: dynamicOptions, ...payload } = (data || {}) as { options?: any } & Record<string, any>;
      
      const queryOptions: QueryOptions = {
        ...(timeout && { timeout }),
        ...(retries && { retries }),
        ...(dynamicOptions || {})
      };
      
      const request: ActionRequest = {
        action,
        data: payload,
        options: queryOptions,
        branchContext
      };
      
      console.log('🚀 [UnifiedActionMutation] Executing mutation:', {
        action,
        resourceType,
        hasData: !!payload,
        dataKeys: payload ? Object.keys(payload) : [],
        hasDynamicOptions: !!dynamicOptions,
        timeout,
        retries
      });
      
      return actionClient.executeAction(request);
    },
    
    // Configurable retry logic
    retry: retries,
    
    onSuccess: (data) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      // Auto-invalidate queries for this resource
      queryClient.invalidateQueries({ 
        queryKey: [resourceType],
        refetchType: 'active'
      });
      
      options.onSuccess?.(data);
    },
    
    onError: options.onError
  });
}

/**
 * Convenience hooks for common patterns
 */

// List query with sensible defaults
export function useUnifiedList(resourceType: string, options: UnifiedActionQueryOptions = {}) {
  return useUnifiedActionQuery(`${resourceType}.list`, undefined, {
    limit: 50,
    ...options
  });
}

// Get single item
export function useUnifiedGet(resourceType: string, id: string, options: UnifiedActionQueryOptions = {}) {
  return useUnifiedActionQuery(`${resourceType}.read`, { id }, {
    enabled: !!id,
    ...options
  });
}

// Create mutation
export function useUnifiedCreate(resourceType: string, options: UnifiedActionMutationOptions = {}) {
  return useUnifiedActionMutation(`${resourceType}.create`, {
    invalidateQueries: [resourceType],
    ...options
  });
}

// Update mutation
export function useUnifiedUpdate(resourceType: string, options: UnifiedActionMutationOptions = {}) {
  return useUnifiedActionMutation(`${resourceType}.update`, {
    invalidateQueries: [resourceType],
    ...options
  });
}

// Delete mutation
export function useUnifiedDelete(resourceType: string, options: UnifiedActionMutationOptions = {}) {
  return useUnifiedActionMutation(`${resourceType}.delete`, {
    invalidateQueries: [resourceType],
    ...options
  });
}
