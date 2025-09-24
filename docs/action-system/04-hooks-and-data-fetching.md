# Hooks & Data Fetching - Complete Modular System Guide

## Table of Contents
1. [Modular Hook Architecture](#modular-hook-architecture)
2. [useActionQuery - Cache-First Reads](#useactionquery---cache-first-reads)
3. [useActionMutation - SSOT Mutations](#useactionmutation---ssot-mutations)
4. [Resource Convenience Hooks](#resource-convenience-hooks)
5. [Cache Invalidation System](#cache-invalidation-system)
6. [Query Keys & Organization](#query-keys--organization)
7. [Branch Context Integration](#branch-context-integration)
8. [Performance Patterns](#performance-patterns)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Modular Hook Architecture

The Action System uses a **modular hook architecture** that has been **refactored from 1,376 lines to focused modules** under `src/hooks/query/` for improved maintainability and reliability.

### **Architecture Overview**

```
React Components
        ↓
useActionQuery / useActionMutation (Entry Points)
        ↓
Modular Hook System (src/hooks/query/)
├── use-action-query.ts        # Cache-first reads (174 lines)
├── use-action-mutation.ts     # Optimistic mutations (120+ lines)
├── use-action-cache.ts        # Cache utilities
├── resource-hooks.ts          # Convenience wrappers
├── query-keys.ts              # Standardized cache keys
└── cache-invalidation.ts      # Smart invalidation system
        ↓
TanStack Query (UI state management)
        ↓
ActionClient (cache-first execution)
        ↓
IndexedDB → Memory → Server API
        ↓
Automatic Cache Invalidation with refetchQueries
```

### **Entry Point**

**File**: `src/hooks/use-action-api.ts` (39 lines - simplified)

```typescript
/**
 * SSOT Action API Hooks - Simplified Entry Point
 * 
 * Re-exports the modular query system for backward compatibility
 * while providing a clean, focused architecture.
 */

// Re-export the modular system
export {
  useActionQuery,
  useActionMutation,
  useActionCache,
  queryKeys,
  invalidateCacheAfterMutation,
  invalidateResourceFamily,
  invalidateEverything,
  debouncedInvalidateQueries,
  // Resource convenience hooks (backward compatibility)
  useResourceList,
  useResourceItem,
  useResourceCreate,
  useResourceUpdate,
  useResourceDelete
} from './query';

export type {
  ActionQueryOptions,
  ActionMutationOptions,
  QueryKeys
} from './query';
```

### **Modular System Benefits**

- **✅ Reduced from 1,376 lines to focused modules**
- **✅ Improved cache invalidation reliability** 
- **✅ Maintained full backward compatibility**
- **✅ Easier testing and maintenance**
- **✅ Clear separation of concerns**

---

## useActionQuery - Cache-First Reads

### **Implementation**

**File**: `src/hooks/query/use-action-query.ts` (174 lines)

```typescript
/**
 * Cache-first query hook with automatic fallback to API
 */
export function useActionQuery<TData = any>(
  action: string,
  data?: any,
  options?: ActionQueryOptions<TData>
) {
  const queryClient = useQueryClient();
  const { tenantId, branchContext } = useActionClientContext();
  const cacheContext = useOptionalCacheContext();
  
  // Generate cache key with branch context
  const queryKey = useMemo(() => {
    const branchId = branchContext?.currentBranchId || undefined;
    return queryKeys.actionData(action, data, branchId);
  }, [action, data, branchContext?.currentBranchId]);

  // Branch switch detection - prevent showing stale data during branch switches
  const currentBranchId = branchContext?.currentBranchId || undefined;
  const prevBranchIdRef = useRef<string | undefined>(currentBranchId);
  const isBranchSwitch = prevBranchIdRef.current !== currentBranchId;
  useEffect(() => {
    prevBranchIdRef.current = currentBranchId;
  }, [currentBranchId]);

  // Query function with ActionClient integration
  const queryFn = useCallback(async (): Promise<ActionResponse<TData>> => {
    if (!tenantId) {
      throw new Error('No tenant context available');
    }

    const actionClient = getActionClient(tenantId);
    
    const actionRequest: ActionRequest = {
      action,
      data,
      options: { 
        bypassCache: options?.bypassCache,
        background: options?.background 
      },
      branchContext
    };

    const response = await actionClient.executeAction(actionRequest);
    
    if (!response.success) {
      throw new Error(response.error || `Action failed: ${action}`);
    }

    return response;
  }, [action, data, tenantId, branchContext, options?.bypassCache, options?.background]);

  // TanStack Query integration with smart defaults
  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled !== false && !!session?.user?.tenantId,
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes default
    keepPreviousData: options?.keepPreviousData !== false && !isBranchSwitch,
    placeholderData: !isBranchSwitch ? options?.placeholderData : undefined,
    ...options
  });
}
```

### **Basic Usage Examples**

```typescript
import { useActionQuery } from '@/hooks/use-action-api';

// Load all offices (cache-first, <50ms)
const { 
  data: offices, 
  isLoading, 
  fromCache, 
  executionTime 
} = useActionQuery('office.list');

// Load single office by ID
const { data: office } = useActionQuery('office.read', { id: officeId });

// Load with filters and options
const { data: activeOffices } = useActionQuery('office.list', 
  { filters: { status: 'active' } },
  { 
    staleTime: 5 * 60 * 1000,    // 5 minutes
    enabled: !!currentUser,      // Conditional loading
    bypassCache: false          // Use cache-first strategy
  }
);

// Branch-aware queries (automatically handled)
const { data: branchOffices } = useActionQuery('office.list');
// ✅ Uses current branch context
// ✅ Fallback to default branch for missing items
// ✅ Copy-on-Write on modifications
```

### **ActionQueryOptions Interface**

```typescript
export interface ActionQueryOptions<TData = any> extends Omit<UseQueryOptions<ActionResponse<TData>>, 'queryKey' | 'queryFn'> {
  // ActionClient options
  bypassCache?: boolean;        // Skip IndexedDB cache
  background?: boolean;         // Background execution
  
  // Inherited from TanStack Query
  enabled?: boolean;            // Enable/disable query
  staleTime?: number;          // How long data stays fresh (default: 10min)
  refetchOnWindowFocus?: boolean; // Refetch on window focus
  keepPreviousData?: boolean;   // Keep previous data while loading
  placeholderData?: TData;      // Placeholder data during loading
  retry?: boolean | number;     // Retry configuration
  onSuccess?: (data: ActionResponse<TData>) => void;
  onError?: (error: Error) => void;
}
```

### **Advanced Features**

```typescript
// Real-time data with cache optimization
const { data, isLoading, executionTime } = useActionQuery(
  'process.list',
  { nodeId },
  {
    staleTime: 30000,           // 30 seconds freshness
    refetchInterval: 60000,     // Refetch every minute
    refetchIntervalInBackground: true,
    onSuccess: (response) => {
      console.log(`Query completed in ${response.meta?.executionTime}ms`);
      console.log(`From cache: ${response.cached}`);
    }
  }
);

// Conditional queries with dependencies
const { data: nodeDetails } = useActionQuery(
  'node.read',
  { id: nodeId },
  { 
    enabled: !!nodeId,          // Only run when nodeId exists
    select: (response) => response.data // Transform response
  }
);

// Parallel queries with useQueries
const results = useQueries({
  queries: nodeIds.map(id => ({
    queryKey: queryKeys.actionData('node.read', { id }),
    queryFn: () => actionClient.executeAction({
      action: 'node.read',
      data: { id }
    })
  }))
});
```

---

## useActionMutation - SSOT Mutations

### **Implementation**

**File**: `src/hooks/query/use-action-mutation.ts` (120+ lines)

```typescript
/**
 * SSOT mutation hook with automatic cache invalidation
 */
export function useActionMutation<TData = any, TError = Error, TVariables = any, TContext = unknown>(
  action: string,
  options?: ActionMutationOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  const { tenantId, branchContext } = useActionClientContext();

  // Mutation function with ActionClient integration
  const mutationFn = useCallback(async (variables: TVariables): Promise<ActionResponse<TData>> => {
    if (!tenantId) {
      throw new Error('No tenant context available');
    }

    const actionClient = getActionClient(tenantId);
    
    const actionRequest: ActionRequest = {
      action,
      data: variables,
      branchContext
    };

    const response = await actionClient.executeAction(actionRequest);
    
    if (!response.success) {
      throw new Error(response.error || `Mutation failed: ${action}`);
    }

    return response;
  }, [action, tenantId, branchContext]);

  return useMutation({
    mutationFn,
    onMutate: options?.onMutate,
    onSuccess: (data, variables, context) => {
      // SYSTEM INVALIDATION RUNS FIRST (bulletproof cache)
      invalidateCacheAfterMutation(action, data, queryClient);
      
      // User callback runs after system invalidation
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options
  });
}
```

### **Basic Usage Examples**

```typescript
import { useActionMutation } from '@/hooks/use-action-api';

// Create office with automatic cache invalidation
const { mutate: createOffice, isLoading: isCreating } = useActionMutation('office.create', {
  onSuccess: (response) => {
    toast.success('Office created successfully!');
    // ✅ Cache invalidation happens automatically!
    // ✅ Lists update immediately
  },
  onError: (error) => {
    toast.error(`Failed to create office: ${error.message}`);
    // ✅ Optimistic updates automatically rolled back
  }
});

// Update with Copy-on-Write support
const { mutate: updateOffice } = useActionMutation('office.update', {
  onSuccess: (response) => {
    const { copyOnWrite } = response.meta || {};
    if (copyOnWrite) {
      toast.info('Office updated on current branch');
    } else {
      toast.success('Office updated');
    }
  }
});

// Delete with confirmation
const { mutate: deleteOffice, isLoading: isDeleting } = useActionMutation('office.delete');

// Usage in components
const handleCreateOffice = () => {
  createOffice({
    name: 'New York Office',
    status: 'active',
    address: '123 Broadway'
  });
};

const handleUpdateOffice = () => {
  updateOffice({
    id: 'office-123',
    name: 'NYC Downtown Office'
  });
};

const handleDeleteOffice = () => {
  deleteOffice({ id: 'office-123' });
};
```

### **Advanced Mutation Patterns**

```typescript
// Optimistic updates with rollback
const { mutate: updateProcess } = useActionMutation('process.update', {
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['process'] });

    // Snapshot previous value
    const previousProcess = queryClient.getQueryData(['process', newData.id]);

    // Optimistically update to the new value
    queryClient.setQueryData(['process', newData.id], (old: any) => ({
      ...old,
      data: { ...old?.data, ...newData }
    }));

    // Return context with snapshot
    return { previousProcess };
  },
  onError: (err, newData, context) => {
    // Rollback to previous state
    if (context?.previousProcess) {
      queryClient.setQueryData(['process', newData.id], context.previousProcess);
    }
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['process'] });
  }
});

// Bulk operations
const { mutate: bulkUpdateProcesses } = useActionMutation('process.bulkUpdate', {
  onSuccess: (response) => {
    // Invalidate all process-related queries
    queryClient.invalidateQueries({ queryKey: ['process'] });
    queryClient.invalidateQueries({ queryKey: ['node'] }); // If processes affect nodes
    toast.success(`Updated ${response.data.updatedCount} processes`);
  }
});

// Complex workflow mutations
const { mutate: promoteToProduction } = useActionMutation('workflow.promote', {
  onMutate: () => {
    // Show loading state
    toast.loading('Promoting workflow to production...');
  },
  onSuccess: (response) => {
    toast.dismiss();
    toast.success('Workflow promoted successfully!');
    
    // Navigate to production view
    router.push(`/workflows/${response.data.id}/production`);
    
    // Invalidate related data
    queryClient.invalidateQueries({ queryKey: ['workflow'] });
    queryClient.invalidateQueries({ queryKey: ['deployment'] });
  },
  onError: (error) => {
    toast.dismiss();
    toast.error(`Promotion failed: ${error.message}`);
  }
});
```

---

## Resource Convenience Hooks

### **Implementation**

**File**: `src/hooks/query/resource-hooks.ts`

These hooks provide convenient wrappers around the core useActionQuery and useActionMutation hooks:

```typescript
/**
 * Resource convenience hooks for common patterns
 */

// List operations
export function useResourceList<T = any>(
  resource: string, 
  filters?: any, 
  options?: ActionQueryOptions<T[]>
) {
  return useActionQuery(`${resource}.list`, { filters }, options);
}

// Single item operations
export function useResourceItem<T = any>(
  resource: string, 
  id: string, 
  options?: ActionQueryOptions<T>
) {
  return useActionQuery(`${resource}.read`, { id }, { 
    enabled: !!id,
    ...options 
  });
}

// CRUD mutations
export function useResourceCreate<T = any>(resource: string, options?: ActionMutationOptions<T>) {
  return useActionMutation(`${resource}.create`, options);
}

export function useResourceUpdate<T = any>(resource: string, options?: ActionMutationOptions<T>) {
  return useActionMutation(`${resource}.update`, options);
}

export function useResourceDelete<T = any>(resource: string, options?: ActionMutationOptions<T>) {
  return useActionMutation(`${resource}.delete`, options);
}
```

### **Usage Examples**

```typescript
// Instead of: useActionQuery('office.list')
const { data: offices, isLoading } = useResourceList('office');

// Instead of: useActionQuery('office.read', { id })
const { data: office } = useResourceItem('office', officeId);

// Instead of: useActionMutation('office.create')
const { mutate: createOffice } = useResourceCreate('office', {
  onSuccess: () => toast.success('Office created!')
});

// Filtering with convenience hooks
const { data: activeOffices } = useResourceList('office', { status: 'active' });
const { data: userProcesses } = useResourceList('process', { userId: currentUser.id });

// Batch operations
const createMultipleOffices = useResourceCreate('office');
const deleteMultipleOffices = useResourceDelete('office');

offices.forEach(office => {
  createMultipleOffices.mutate(office);
});
```

---

## Cache Invalidation System

### **Smart Invalidation Strategy**

**File**: `src/hooks/query/cache-invalidation.ts`

The cache invalidation system uses **`refetchQueries` instead of `invalidateQueries`** for bulletproof cache consistency:

```typescript
/**
 * Cache invalidation with smart query targeting
 */
export async function invalidateCacheAfterMutation(
  action: string,
  mutationResult: ActionResponse<any>,
  queryClient: QueryClient
): Promise<void> {
  const [resourceType, operation] = action.split('.');
  
  console.log('🔄 [CacheInvalidation] Starting invalidation', {
    action,
    operation,
    resourceType,
    timestamp: new Date().toISOString()
  });

  try {
    // 1. FORCED REFETCH: Lists for this resource (bypasses staleTime)
    await queryClient.refetchQueries({
      queryKey: ['actions', resourceType, 'list'],
      type: 'active'
    });
    
    // 2. INVALIDATE: Related resources based on relationships
    if (['create', 'update', 'delete'].includes(operation)) {
      // Invalidate parent/child relationships
      const relatedResources = getRelatedResources(resourceType);
      for (const relatedResource of relatedResources) {
        queryClient.invalidateQueries({
          queryKey: ['actions', relatedResource]
        });
      }
    }
    
    // 3. SPECIFIC: Item-level invalidation for updates
    if (operation === 'update' && mutationResult.data?.id) {
      queryClient.invalidateQueries({
        queryKey: ['actions', resourceType, 'item', mutationResult.data.id]
      });
    }
    
    // 4. JUNCTION: Invalidate junction-related data
    if (mutationResult.junctions) {
      Object.keys(mutationResult.junctions).forEach(junctionTable => {
        queryClient.invalidateQueries({
          queryKey: ['actions', junctionTable]
        });
      });
    }

    console.log('✅ [CacheInvalidation] Invalidation completed', {
      action,
      invalidatedKeys: [
        `['actions', '${resourceType}', 'list']`,
        ...getRelatedResources(resourceType).map(r => `['actions', '${r}']`)
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 [CacheInvalidation] Invalidation failed:', error);
  }
}

// Resource family invalidation
export function invalidateResourceFamily(
  resourceType: string,
  queryClient: QueryClient
): void {
  queryClient.invalidateQueries({
    queryKey: ['actions', resourceType]
  });
  
  // Also invalidate related resources
  const relatedResources = getRelatedResources(resourceType);
  relatedResources.forEach(relatedResource => {
    queryClient.invalidateQueries({
      queryKey: ['actions', relatedResource]
    });
  });
}

// Emergency invalidation (use sparingly)
export function invalidateEverything(queryClient: QueryClient): void {
  console.warn('🚨 [CacheInvalidation] Emergency: Invalidating all queries');
  queryClient.invalidateQueries();
}

// Debounced invalidation for rapid mutations
export const debouncedInvalidateQueries = debounce(
  (queryClient: QueryClient, queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
  },
  100
);
```

### **Relationship-Based Invalidation**

```typescript
function getRelatedResources(resourceType: string): string[] {
  const relationships: Record<string, string[]> = {
    'office': ['process', 'node', 'user'],
    'process': ['rule', 'node', 'workflow'],
    'rule': ['process', 'node'],
    'node': ['process', 'workflow', 'rule'],
    'workflow': ['process', 'node'],
    'user': ['office', 'tenant']
  };
  
  return relationships[resourceType] || [];
}
```

---

## Query Keys & Organization

### **Standardized Key Structure**

**File**: `src/hooks/query/query-keys.ts`

```typescript
/**
 * Standardized query keys for consistent caching
 */
export const queryKeys = {
  // Root key
  all: () => ['actions'] as const,
  
  // Resource-level keys
  resource: (resource: string) => [...queryKeys.all(), resource] as const,
  
  // List queries
  resourceLists: (resource: string) => [...queryKeys.resource(resource), 'list'] as const,
  resourceList: (resource: string, filters?: any) => 
    [...queryKeys.resourceLists(resource), filters || {}] as const,
  
  // Item queries
  resourceItems: (resource: string) => [...queryKeys.resource(resource), 'item'] as const,
  resourceItem: (resource: string, id: string) => 
    [...queryKeys.resourceItems(resource), id] as const,
  
  // Action-based queries (primary pattern)
  actionData: (action: string, data?: any, branchId?: string) => {
    const baseKey = [...queryKeys.all(), action] as const;
    if (!data && !branchId) return baseKey;
    
    const keyParts: any[] = [...baseKey];
    if (data) keyParts.push(data);
    if (branchId) keyParts.push({ branchId });
    
    return keyParts as const;
  },
  
  // Branch-specific keys
  branch: (branchId: string) => [...queryKeys.all(), 'branch', branchId] as const,
  
  // Junction keys
  junction: (tableName: string) => [...queryKeys.all(), 'junction', tableName] as const
} as const;

export type QueryKeys = typeof queryKeys;
```

### **Query Key Usage Examples**

```typescript
// List queries
queryKeys.actionData('office.list')                    // ['actions', 'office.list']
queryKeys.actionData('office.list', { status: 'active' }) // ['actions', 'office.list', { status: 'active' }]

// Item queries  
queryKeys.actionData('office.read', { id: '123' })     // ['actions', 'office.read', { id: '123' }]

// Branch-aware queries
queryKeys.actionData('office.list', null, 'feature')   // ['actions', 'office.list', { branchId: 'feature' }]

// Resource-based keys (convenience)
queryKeys.resourceList('office')                       // ['actions', 'office', 'list', {}]
queryKeys.resourceItem('office', '123')                // ['actions', 'office', 'item', '123']

// Manual invalidation using keys
queryClient.invalidateQueries({ 
  queryKey: queryKeys.resource('office') 
});

queryClient.invalidateQueries({ 
  queryKey: queryKeys.actionData('office.list') 
});
```

---

## Branch Context Integration

### **Automatic Branch Awareness**

```typescript
// Hooks automatically use current branch context
const { data: offices } = useActionQuery('office.list');
// ✅ Queries current branch
// ✅ Falls back to default branch for missing items
// ✅ Cache keys include branchId

// Branch switching automatically refetches
const switchToBranch = (branchId: string) => {
  setBranchContext({ ...branchContext, currentBranchId: branchId });
  // ✅ All queries with branch context automatically refetch
  // ✅ Cache keys change to prevent stale data
};

// Copy-on-Write detection
const { mutate: updateOffice } = useActionMutation('office.update', {
  onSuccess: (response) => {
    if (response.meta?.copyOnWrite) {
      toast.info('Changes saved to current branch');
    } else {
      toast.success('Changes saved');
    }
  }
});
```

### **Branch Switch Prevention**

```typescript
// Prevent stale data during branch switches
const { data, isLoading } = useActionQuery('office.list', null, {
  // keepPreviousData disabled during branch switches
  keepPreviousData: !isBranchSwitch,
  // placeholderData cleared during branch switches  
  placeholderData: !isBranchSwitch ? previousData : undefined
});
```

---

## Performance Patterns

### **Cache-First Strategy**

```typescript
// Immediate response from cache, background update
const { data: offices, isLoading, isFetching } = useActionQuery('office.list', null, {
  staleTime: 10 * 60 * 1000,          // 10 minutes fresh
  cacheTime: 30 * 60 * 1000,          // 30 minutes cache
  refetchOnWindowFocus: false,        // Don't refetch on focus
  refetchOnReconnect: true            // Do refetch on reconnect
});

// isLoading: false (from cache), isFetching: true (background update)
```

### **Parallel Data Loading**

```typescript
// Load related data in parallel
const [
  { data: office, isLoading: officeLoading },
  { data: processes, isLoading: processesLoading },
  { data: users, isLoading: usersLoading }
] = [
  useActionQuery('office.read', { id: officeId }),
  useActionQuery('process.list', { officeId }),
  useActionQuery('user.list', { officeId })
];

const isLoading = officeLoading || processesLoading || usersLoading;
```

### **Conditional Loading**

```typescript
// Load data only when conditions are met
const { data: processDetails } = useActionQuery(
  'process.read',
  { id: processId },
  { 
    enabled: !!processId && userHasPermission,
    staleTime: Infinity // Cache forever until explicitly invalidated
  }
);

// Dependent queries
const { data: office } = useActionQuery('office.read', { id: officeId });
const { data: officeProcesses } = useActionQuery(
  'process.list',
  { officeId },
  { enabled: !!office?.data?.id }
);
```

### **Optimistic Updates Pattern**

```typescript
const { mutate: updateOfficeStatus } = useActionMutation('office.update', {
  onMutate: async (variables) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: queryKeys.resourceItem('office', variables.id) });

    // Get current data
    const previousOffice = queryClient.getQueryData(queryKeys.resourceItem('office', variables.id));

    // Optimistic update
    queryClient.setQueryData(
      queryKeys.resourceItem('office', variables.id),
      (old: any) => ({
        ...old,
        data: { ...old?.data, status: variables.status }
      })
    );

    return { previousOffice };
  },
  onError: (error, variables, context) => {
    // Rollback on error
    if (context?.previousOffice) {
      queryClient.setQueryData(
        queryKeys.resourceItem('office', variables.id),
        context.previousOffice
      );
    }
    toast.error(`Failed to update status: ${error.message}`);
  },
  onSuccess: () => {
    toast.success('Status updated successfully');
  },
  onSettled: (data, error, variables) => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.resourceItem('office', variables.id) 
    });
  }
});
```

---

## Error Handling

### **Error Boundaries & Recovery**

```typescript
// Global error handling
const { data, error, isError, refetch } = useActionQuery('office.list', null, {
  retry: (failureCount, error) => {
    // Retry network errors, but not auth errors
    if (error.message.includes('Authentication')) return false;
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    console.error('Query failed:', error);
    // Don't show toast for auth errors (handled globally)
    if (!error.message.includes('Authentication')) {
      toast.error(`Failed to load data: ${error.message}`);
    }
  }
});

// Error recovery UI
if (isError) {
  return (
    <div className="error-state">
      <p>Failed to load offices: {error.message}</p>
      <button onClick={() => refetch()}>Try Again</button>
    </div>
  );
}

// Mutation error handling with user feedback
const { mutate: createOffice, error: createError } = useActionMutation('office.create', {
  onError: (error, variables, context) => {
    // Detailed error handling based on error type
    if (error.message.includes('validation')) {
      toast.error('Please check your input and try again');
    } else if (error.message.includes('permission')) {
      toast.error('You don\'t have permission to create offices');
    } else if (error.message.includes('network')) {
      toast.error('Network error. Please check your connection');
    } else {
      toast.error(`Failed to create office: ${error.message}`);
    }
  }
});
```

### **Fallback Data Strategies**

```typescript
// Provide fallback data during loading/errors
const { data: offices = [] } = useActionQuery('office.list', null, {
  placeholderData: [], // Empty array while loading
  select: (response) => response.data || [] // Transform and provide fallback
});

// Stale-while-revalidate pattern
const { data: criticalData } = useActionQuery('critical.data', null, {
  staleTime: 0, // Always stale
  cacheTime: Infinity, // But keep in cache forever
  refetchOnMount: 'always', // Always refetch
  keepPreviousData: true // Show stale data while refetching
});
```

---

## Best Practices

### **Do's ✅**

```typescript
// ✅ Use semantic action names
useActionQuery('office.list')
useActionMutation('office.create')

// ✅ Handle loading states
const { data, isLoading, error } = useActionQuery('office.list');

// ✅ Use convenience hooks for common patterns
const { data: offices } = useResourceList('office');
const createOffice = useResourceCreate('office');

// ✅ Provide meaningful error feedback
const { mutate } = useActionMutation('office.create', {
  onError: (error) => toast.error(`Creation failed: ${error.message}`)
});

// ✅ Use optimistic updates for better UX
const { mutate } = useActionMutation('office.update', {
  onMutate: async (variables) => {
    // Optimistically update UI
  }
});

// ✅ Leverage automatic cache invalidation
// System handles this automatically - no manual invalidation needed

// ✅ Use branch context appropriately
// Hooks automatically handle branch context - no manual management needed
```

### **Don'ts ❌**

```typescript
// ❌ Don't manually invalidate queries (system handles this)
// queryClient.invalidateQueries(...) // Not needed!

// ❌ Don't override onSuccess for cache invalidation
useActionMutation('office.create', {
  onSuccess: () => {
    queryClient.invalidateQueries(...); // System does this automatically!
  }
});

// ❌ Don't use raw fetch or axios
// const data = await fetch('/api/offices'); // Use hooks instead!

// ❌ Don't ignore error handling
useActionQuery('office.list'); // Always handle errors

// ❌ Don't use overly short staleTime for frequently changing data
useActionQuery('office.list', null, {
  staleTime: 1000 // Too short! Use 5-10 minutes minimum
});

// ❌ Don't disable automatic retry for network errors
useActionQuery('office.list', null, {
  retry: false // Avoid this unless you have a good reason
});
```

### **Performance Optimization**

```typescript
// ✅ Optimal cache configuration
const { data } = useActionQuery('office.list', null, {
  staleTime: 10 * 60 * 1000,     // 10 minutes fresh
  cacheTime: 30 * 60 * 1000,      // 30 minutes in cache
  refetchOnWindowFocus: false,     // Avoid excessive refetching
  refetchInterval: 5 * 60 * 1000   // Background refresh every 5 minutes
});

// ✅ Smart data selection
const { data: officeNames } = useActionQuery('office.list', null, {
  select: (response) => response.data.map(office => ({ 
    id: office.id, 
    name: office.name 
  })) // Only select what you need
});

// ✅ Conditional loading
const { data } = useActionQuery('office.read', { id }, { 
  enabled: !!id && userCanView // Only load when needed
});

// ✅ Prefetch related data
const queryClient = useQueryClient();
const prefetchOfficeDetails = (officeId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.actionData('office.read', { id: officeId }),
    queryFn: () => actionClient.executeAction({
      action: 'office.read',
      data: { id: officeId }
    }),
    staleTime: 10 * 60 * 1000
  });
};
```

---

## File Reference

### **Core Hook Files**
- `src/hooks/use-action-api.ts` - Main entry point (39 lines, simplified)
- `src/hooks/query/index.ts` - Modular system exports
- `src/hooks/query/use-action-query.ts` - Cache-first queries (174 lines)
- `src/hooks/query/use-action-mutation.ts` - SSOT mutations (120+ lines)

### **Supporting Files**
- `src/hooks/query/use-action-cache.ts` - Cache utilities
- `src/hooks/query/resource-hooks.ts` - Convenience wrappers
- `src/hooks/query/query-keys.ts` - Standardized cache keys
- `src/hooks/query/cache-invalidation.ts` - Smart invalidation system

### **Integration Files**
- `src/lib/session` - `useActionClientContext`, `useBranchContext`
- `src/components/providers/cache-provider.tsx` - Cache context provider

---

**The modular hook system provides enterprise-grade reliability with Linear-like performance through intelligent caching, automatic invalidation, and seamless branch context integration. The refactored architecture eliminates complexity while maintaining full backward compatibility.**