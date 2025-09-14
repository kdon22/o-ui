# Hooks & Data Fetching

## Table of Contents
1. [Hooks Overview](#hooks-overview)
2. [useActionQuery - Cache-First Reads](#useactionquery---cache-first-reads)
3. [useActionMutation - SSOT Mutations](#useactionmutation---ssot-mutations) 
4. [Resource Convenience Hooks](#resource-convenience-hooks)
5. [Cache Invalidation System](#cache-invalidation-system)
6. [Performance Patterns](#performance-patterns)
7. [Error Handling](#error-handling)
8. [Branch Context](#branch-context)
9. [Best Practices](#best-practices)

---

## Hooks Overview

The Action System provides **two primary hooks** for data operations with **bulletproof cache invalidation**:

- **`useActionQuery`** - Cache-first data fetching with <50ms performance
- **`useActionMutation`** - SSOT mutations with automatic cache invalidation

### **Hook Architecture**

```
React Components
        ↓
useActionQuery / useActionMutation 
        ↓
TanStack Query (UI state management)
        ↓
ActionClient (cache-first execution) 
        ↓
IndexedDB → Memory → Server API
        ↓
Automatic Cache Invalidation System
```

### **Performance Philosophy**

- **Reads**: Cache-first priority (IndexedDB → Memory → Server)
- **Writes**: Optimistic updates (instant UI → background sync)
- **Invalidation**: Forced refetch bypasses staleTime for immediate updates
- **Navigation**: <50ms tree navigation with warm cache
- **Forms**: Instant feedback with automatic rollback on errors

---

## useActionQuery - Cache-First Reads

### **Basic Usage**

```typescript
import { useActionQuery } from '@/hooks/use-action-api';

// Load all offices (cache-first, <50ms)
const { data: offices, isLoading, fromCache, executionTime } = useActionQuery('office.list');

// Load single office by ID
const { data: office } = useActionQuery('office.get', { id: officeId });

// Load with filters
const { data: activeOffices } = useActionQuery('office.list', { 
  status: 'active',
  isActive: true 
});
```

### **Hook Signature**

```typescript
function useActionQuery<TData = any>(
  action: string,                    // Action to execute (e.g., 'office.list')
  data?: any,                       // Action parameters/filters
  options?: ActionQueryOptions<TData> // Additional options
): ActionQueryResult<TData>
```

### **ActionQueryOptions**

```typescript
interface ActionQueryOptions<TData> {
  // React Query options
  enabled?: boolean;                 // Enable/disable query
  staleTime?: number;               // How long data stays fresh (default: 10min)
  maxCacheAge?: number;             // Alias for staleTime
  refetchOnWindowFocus?: boolean;   // Refetch on window focus
  
  // Performance options
  preferCache?: boolean;            // Prefer IndexedDB over server (default: true)
  
  // Retry configuration
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
}
```

### **ActionQueryResult**

```typescript
interface ActionQueryResult<TData> {
  // Data
  data: TData | undefined;          // Query result data
  
  // Loading states
  isLoading: boolean;               // Initial loading
  isFetching: boolean;              // Any fetch in progress
  isRefetching: boolean;            // Background refetch
  
  // Cache information
  fromCache: boolean;               // Data came from cache
  executionTime: number;            // Query execution time (ms)
  
  // Status
  isError: boolean;                 // Query failed
  error: Error | null;              // Error object
  isSuccess: boolean;               // Query succeeded
  
  // Actions
  refetch: () => Promise<any>;      // Manual refetch
  remove: () => void;               // Remove from cache
}
```

### **Performance Patterns**

```typescript
// Ultra-fast repeated access
const { data: offices, fromCache, executionTime } = useActionQuery('office.list');
// First call: ~50ms from IndexedDB
// Subsequent calls: ~5ms from memory cache

// Prefetch for instant navigation
const queryClient = useQueryClient();
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['action-api', 'actions', 'office.get', { id: nextOfficeId }],
    queryFn: () => actionClient.executeAction({ action: 'office.get', data: { id: nextOfficeId }})
  });
}, [nextOfficeId]);

// Conditional queries
const { data: officeDetails } = useActionQuery(
  'office.get', 
  { id: selectedOfficeId },
  { enabled: !!selectedOfficeId } // Only run when ID is available
);
```

---

## useActionMutation - SSOT Mutations

### **The SSOT Solution**

The `useActionMutation` hook is the **Single Source of Truth** for all write operations, providing:
- ✅ **Automatic cache invalidation** that actually works
- ✅ **Optimistic updates** with instant UI feedback
- ✅ **Error rollback** with user-friendly messages
- ✅ **Background sync** for offline support

### **Basic Usage**

```typescript
import { useActionMutation } from '@/hooks/use-action-api';

// Create mutation with automatic invalidation
const { mutate: createOffice, isLoading, error } = useActionMutation('office.create', {
  onSuccess: (data) => {
    // Cache invalidation happens automatically BEFORE this callback
    toast.success('Office created successfully!');
    router.push(`/offices/${data.data.id}`);
  },
  onError: (error) => {
    // Optimistic updates automatically rolled back
    toast.error('Failed to create office');
  }
});

// Use the mutation
const handleSubmit = (formData) => {
  createOffice(formData);
  // UI updates instantly, list refreshes automatically
};
```

### **Hook Signature**

```typescript
function useActionMutation<TData = any, TVariables = any>(
  action: string,                    // Action to execute (e.g., 'office.create')
  options?: ActionMutationOptions<TData, TVariables>
): UseMutationResult<ActionResponse<TData>, Error, TVariables>
```

### **ActionMutationOptions**

```typescript
interface ActionMutationOptions<TData, TVariables> {
  // Custom invalidation (optional - system handles automatically)
  invalidateQueries?: string[];     // Additional queries to invalidate
  
  // Background processing
  background?: boolean;             // Queue for background sync
  
  // Standard TanStack Mutation options
  onSuccess?: (data: ActionResponse<TData>, variables: TVariables, context: any) => void;
  onError?: (error: Error, variables: TVariables, context: any) => void;
  onMutate?: (variables: TVariables) => Promise<any> | any;
  onSettled?: (data: ActionResponse<TData> | undefined, error: Error | null, variables: TVariables, context: any) => void;
}
```

### **Automatic Cache Invalidation**

The system automatically invalidates the correct queries based on the action:

```typescript
// System automatically determines what to invalidate
const { mutate: createOffice } = useActionMutation('office.create');
// Automatically invalidates:
// - office.list queries
// - Related resource families
// - Junction relationships

const { mutate: updateOffice } = useActionMutation('office.update');  
// Automatically invalidates:
// - office.list queries
// - office.get queries for this specific office
// - Related resources that might be affected
```

### **Advanced Usage**

```typescript
// Complex operations with navigation context
const { mutate: createRule } = useActionMutation('rule.create', {
  onSuccess: (result) => {
    // System invalidation already happened
    toast.success(`Rule "${result.data.name}" created!`);
    
    // Navigate to the new rule
    router.push(`/rules/${result.data.id}`);
  },
  onError: (error) => {
    // Optimistic updates rolled back automatically
    console.error('Rule creation failed:', error);
    toast.error('Failed to create rule. Please try again.');
  }
});

// Usage with navigation context (for junction auto-creation)
const handleCreateRule = (formData) => {
  createRule({
    ...formData,
    nodeId: selectedNodeId // Junction auto-creation context
  });
};
```

---

## Resource Convenience Hooks

These hooks are **wrappers around the SSOT system** for backward compatibility and convenience:

### **useResourceList**

```typescript
// Convenience wrapper around useActionQuery
const { data: offices, isLoading } = useResourceList('offices', {
  filters: { status: 'active' }
});

// Equivalent to:
const { data: offices, isLoading } = useActionQuery('office.list', {
  status: 'active'
});
```

### **useResourceItem**

```typescript
// Load single resource
const { data: office, isLoading } = useResourceItem('offices', officeId);

// Equivalent to:
const { data: office, isLoading } = useActionQuery('office.get', { id: officeId });
```

### **useResourceCreate/Update/Delete**

```typescript
// All use the SSOT useActionMutation internally
const { mutate: createOffice } = useResourceCreate('offices');
const { mutate: updateOffice } = useResourceUpdate('offices');
const { mutate: deleteOffice } = useResourceDelete('offices');

// Equivalent to:
const { mutate: createOffice } = useActionMutation('office.create');
const { mutate: updateOffice } = useActionMutation('office.update');
const { mutate: deleteOffice } = useActionMutation('office.delete');
```

---

## Cache Invalidation System

### **The Problem We Solved**

Previously, cache invalidation was unreliable:

```typescript
// ❌ OLD: Manual invalidation often failed
const mutation = useMutation({
  mutationFn: createOffice,
  onSuccess: () => {
    // Often forgotten, wrong keys, or overridden by user callbacks
    queryClient.invalidateQueries(['offices']);
  }
});
```

### **The Solution: Automatic Smart Invalidation**

```typescript
// ✅ NEW: Automatic, bulletproof invalidation
const { mutate: createOffice } = useActionMutation('office.create', {
  onSuccess: (data) => {
    // System invalidation already happened automatically
    // This callback runs AFTER cache is updated
    toast.success('Office created!');
  }
});
```

### **Invalidation Strategies**

The system uses three levels of invalidation:

#### **1. Resource Family Invalidation** (Most Common)
```typescript
// Creating an office invalidates:
// - office.list queries
// - office.get queries  
// - Related junction queries (nodeOffices, etc.)
await queryClient.refetchQueries({
  queryKey: ['action-api', 'resource', 'office'],
  type: 'active'
});
```

#### **2. Smart Invalidation** (Complex Operations)
```typescript
// For operations with navigation context or junction auto-creation
await queryClient.refetchQueries({
  queryKey: ['action-api', 'actions'],
  type: 'active'
});
```

#### **3. Nuclear Invalidation** (Rare)
```typescript
// For extremely complex operations
await queryClient.refetchQueries({ type: 'active' });
```

### **Key Technical Details**

- **Uses `refetchQueries` not `invalidateQueries`** - Forces immediate refetch bypassing staleTime
- **System callback runs first** - User callbacks run after invalidation is complete
- **Smart detection** - Automatically determines invalidation level based on operation complexity

---

## Performance Patterns

### **Optimizing Read Performance**

```typescript
// Prefetch for instant navigation
const prefetchOffice = (officeId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['action-api', 'actions', 'office.get', { id: officeId }],
    queryFn: () => actionClient.executeAction({ action: 'office.get', data: { id: officeId }}),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Infinite queries for large datasets
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['action-api', 'actions', 'office.list'],
  queryFn: ({ pageParam = 0 }) => 
    actionClient.executeAction({ 
      action: 'office.list', 
      data: { offset: pageParam, limit: 50 }
    }),
  getNextPageParam: (lastPage, pages) => 
    lastPage.data.length === 50 ? pages.length * 50 : undefined
});
```

### **Optimizing Write Performance**

```typescript
// Batch operations for better performance
const { mutate: batchCreateOffices } = useActionMutation('office.createBatch', {
  onSuccess: () => {
    // Single invalidation for all created offices
    toast.success(`Created ${offices.length} offices!`);
  }
});

// Optimistic updates with custom logic
const { mutate: updateOffice } = useActionMutation('office.update', {
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['action-api', 'actions', 'office.get', { id: variables.id }]);
    
    // Snapshot previous value
    const previousOffice = queryClient.getQueryData(['action-api', 'actions', 'office.get', { id: variables.id }]);
    
    // Optimistically update
    queryClient.setQueryData(['action-api', 'actions', 'office.get', { id: variables.id }], old => ({
      ...old,
      ...variables.updates
    }));
    
    return { previousOffice };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousOffice) {
      queryClient.setQueryData(['action-api', 'actions', 'office.get', { id: variables.id }], context.previousOffice);
    }
  }
});
```

---

## Error Handling

### **Automatic Error Handling**

```typescript
const { mutate: createOffice, error, isError } = useActionMutation('office.create', {
  onError: (error, variables, context) => {
    // Optimistic updates automatically rolled back
    console.error('Office creation failed:', error);
    
    // Show user-friendly error
    if (error.message.includes('duplicate')) {
      toast.error('An office with this name already exists');
    } else {
      toast.error('Failed to create office. Please try again.');
    }
  }
});

// Error state in UI
if (isError) {
  return <div className="error">Error: {error?.message}</div>;
}
```

### **Retry Logic**

```typescript
// Automatic retry with exponential backoff
const { data: offices } = useActionQuery('office.list', {}, {
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.status >= 400 && error.status < 500) return false;
    
    // Retry up to 3 times for network errors
    return failureCount < 3;
  },
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

---

## Branch Context

### **Automatic Branch Awareness**

```typescript
// All operations automatically use current branch context
const { data: offices } = useActionQuery('office.list');
// Automatically includes current branchId in query

const { mutate: createOffice } = useActionMutation('office.create');
// Automatically creates office in current branch
```

### **Branch-Specific Operations**

```typescript
// Copy-on-Write automatically handled
const { mutate: updateOffice } = useActionMutation('office.update');

updateOffice({ id: 'office123', updates: { name: 'New Name' }});
// If office exists in different branch:
// 1. Automatically copies to current branch
// 2. Applies updates to the copy
// 3. Invalidates cache for both branches
```

---

## Best Practices

### **1. Use the SSOT System**

```typescript
// ✅ DO: Use the SSOT hooks
const { mutate: createOffice } = useActionMutation('office.create');

// ❌ DON'T: Create custom mutations that bypass the system
const customMutation = useMutation({
  mutationFn: createOffice // Bypasses automatic invalidation
});
```

### **2. Trust Automatic Invalidation**

```typescript
// ✅ DO: Let the system handle invalidation
const { mutate: createOffice } = useActionMutation('office.create', {
  onSuccess: (data) => {
    // Cache already invalidated automatically
    toast.success('Office created!');
  }
});

// ❌ DON'T: Manual invalidation (usually unnecessary)
const { mutate: createOffice } = useActionMutation('office.create', {
  onSuccess: (data) => {
    queryClient.invalidateQueries(['offices']); // Redundant
  }
});
```

### **3. Handle Loading States**

```typescript
// ✅ DO: Show appropriate loading states
const { data: offices, isLoading, isFetching } = useActionQuery('office.list');
const { mutate: createOffice, isLoading: isCreating } = useActionMutation('office.create');

return (
  <div>
    {isLoading && <Skeleton />}
    {isFetching && !isLoading && <RefreshIndicator />}
    <Button disabled={isCreating} onClick={() => createOffice(data)}>
      {isCreating ? 'Creating...' : 'Create Office'}
    </Button>
  </div>
);
```

### **4. Optimize for Performance**

```typescript
// ✅ DO: Use appropriate staleTime
const { data: offices } = useActionQuery('office.list', {}, {
  staleTime: 5 * 60 * 1000 // 5 minutes for relatively static data
});

// ✅ DO: Prefetch for better UX
const prefetchOfficeDetails = useCallback((officeId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['action-api', 'actions', 'office.get', { id: officeId }],
    queryFn: () => actionClient.executeAction({ action: 'office.get', data: { id: officeId }})
  });
}, [queryClient]);
```

### **5. Handle Errors Gracefully**

```typescript
// ✅ DO: Provide meaningful error messages
const { mutate: createOffice } = useActionMutation('office.create', {
  onError: (error) => {
    const message = error.message.includes('duplicate') 
      ? 'An office with this name already exists'
      : 'Failed to create office. Please try again.';
    
    toast.error(message);
  }
});
```

---

## Migration Guide

### **From Old Custom Mutations**

```typescript
// ❌ OLD: Custom mutation with manual invalidation
const createOfficeMutation = useMutation({
  mutationFn: async (data) => {
    const actionClient = getActionClient();
    return actionClient.executeAction({ action: 'office.create', data });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['offices']); // Often wrong or forgotten
  }
});

// ✅ NEW: SSOT with automatic invalidation
const { mutate: createOffice } = useActionMutation('office.create', {
  onSuccess: (data) => {
    // Cache invalidation happens automatically
    toast.success('Office created!');
  }
});
```

### **From Resource Hooks**

```typescript
// ✅ KEEP: Resource hooks still work (they use SSOT internally)
const { data: offices } = useResourceList('offices');
const { mutate: createOffice } = useResourceCreate('offices');

// ✅ OR: Use the core hooks directly
const { data: offices } = useActionQuery('office.list');
const { mutate: createOffice } = useActionMutation('office.create');
```

---

The hooks system provides a **bulletproof foundation** for data operations with automatic cache invalidation that you can trust. The SSOT architecture ensures consistent behavior across your entire application while maintaining the performance and offline capabilities that make the Action System powerful.