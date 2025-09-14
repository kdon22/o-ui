# Action System Troubleshooting Guide

## Table of Contents
1. [Cache Invalidation Issues](#cache-invalidation-issues) 🚨 **RECENTLY FIXED**
2. [Performance Problems](#performance-problems)
3. [Data Not Updating](#data-not-updating)
4. [Type Errors](#type-errors)
5. [Offline Issues](#offline-issues)
6. [Branch Context Problems](#branch-context-problems)
7. [Auto-Generated Component Issues](#auto-generated-component-issues)
8. [Server Integration Issues](#server-integration-issues)
9. [Development Environment Issues](#development-environment-issues)

---

## Cache Invalidation Issues

### 🎉 **RECENTLY FIXED: Lists Not Updating After Mutations**

**Problem**: After creating or updating items, lists didn't refresh automatically. Users had to manually refresh the page.

**Root Cause**: Multiple issues in the cache invalidation system:
1. User `onSuccess` callbacks were overriding system invalidation callbacks
2. `invalidateQueries` was being used instead of `refetchQueries`
3. Different mutation patterns bypassed the SSOT system

**✅ Solution Implemented**:

```typescript
// ✅ FIXED: System invalidation runs first, then user callbacks
const mutationOptions = {
  mutationFn,
  onSuccess: async (result, variables, context) => {
    // 1. SYSTEM INVALIDATION RUNS FIRST
    await invalidateCacheAfterMutation(queryClient, action, variables);
    
    // 2. THEN USER CALLBACK
    if (userOnSuccess) {
      userOnSuccess(result, variables, context);
    }
  }
};

// ✅ FIXED: Uses refetchQueries to bypass staleTime
await queryClient.refetchQueries({
  queryKey: ['action-api', 'resource', resource],
  type: 'active'
});
```

**Verification**:
- ✅ Rule creation updates list immediately
- ✅ Office creation updates list immediately  
- ✅ All CRUD operations follow the same pattern
- ✅ No more manual refresh needed

### **Remaining Cache Issues**

#### **Stale Data After Mutations**

**Symptoms**:
- Data appears updated in one component but not another
- Inconsistent state across the application

**Diagnosis**:
```typescript
// Check if queries are using different keys
const { data: offices1 } = useActionQuery('office.list');
const { data: offices2 } = useActionQuery('office.list', { status: 'active' });
// These have different cache keys and may not invalidate together
```

**Solution**:
```typescript
// Use consistent query patterns
const { data: allOffices } = useActionQuery('office.list');
const activeOffices = allOffices?.filter(office => office.status === 'active');

// OR ensure proper invalidation for filtered queries
const { mutate: createOffice } = useActionMutation('office.create', {
  invalidateQueries: ['office.list'] // Invalidates all office.list variants
});
```

#### **Cache Not Persisting Across Sessions**

**Symptoms**:
- Data loads slowly on app restart
- IndexedDB appears empty

**Diagnosis**:
```typescript
// Check IndexedDB in DevTools
// Application tab → Storage → IndexedDB → your-app-db
```

**Solution**:
```typescript
// Ensure proper IndexedDB initialization
const actionClient = getActionClient(tenantId, branchContext);
await actionClient.initialize(); // Make sure this is called
```

---

## Performance Problems

### **Slow Query Performance**

**Symptoms**:
- Queries taking >200ms consistently
- UI feels sluggish

**Diagnosis**:
```typescript
const { data, executionTime, fromCache } = useActionQuery('office.list');
console.log('Execution time:', executionTime, 'From cache:', fromCache);
```

**Solutions**:

1. **Check Cache Hit Rate**:
```typescript
// Should see fromCache: true after first load
if (!fromCache && executionTime > 100) {
  console.warn('Cache miss - investigate IndexedDB');
}
```

2. **Optimize Query Patterns**:
```typescript
// ✅ DO: Use consistent query keys
const { data: offices } = useActionQuery('office.list', { 
  tenantId, // Include stable identifiers
  branchId 
});

// ❌ DON'T: Create new objects in query data
const { data: offices } = useActionQuery('office.list', { 
  filters: { status: 'active' } // New object every render
});
```

3. **Implement Prefetching**:
```typescript
// Prefetch for instant navigation
const prefetchOffice = useCallback((officeId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['action-api', 'actions', 'office.get', { id: officeId }],
    queryFn: () => actionClient.executeAction({ action: 'office.get', data: { id: officeId }})
  });
}, []);
```

### **Memory Leaks**

**Symptoms**:
- Browser memory usage grows over time
- App becomes slower after extended use

**Diagnosis**:
```typescript
// Check TanStack Query cache size
console.log('Query cache size:', queryClient.getQueryCache().getAll().length);
```

**Solution**:
```typescript
// Set appropriate cache times
const { data: offices } = useActionQuery('office.list', {}, {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
});

// Clean up on unmount for large datasets
useEffect(() => {
  return () => {
    queryClient.removeQueries(['action-api', 'actions', 'large-dataset']);
  };
}, []);
```

---

## Data Not Updating

### **Component Not Re-rendering**

**Symptoms**:
- Data changes in DevTools but UI doesn't update
- Stale data displayed in components

**Diagnosis**:
```typescript
// Check if query is enabled and has correct dependencies
const { data, isLoading, dataUpdatedAt } = useActionQuery('office.list', {
  // Check if filters change
  status: selectedStatus
}, {
  enabled: !!selectedStatus // Make sure query runs when expected
});

console.log('Last updated:', new Date(dataUpdatedAt));
```

**Solutions**:

1. **Check Query Dependencies**:
```typescript
// ✅ DO: Include all dependencies
const { data: offices } = useActionQuery('office.list', {
  status: selectedStatus,
  branchId: currentBranchId
});

// ❌ DON'T: Miss dependencies
const { data: offices } = useActionQuery('office.list');
// Missing status/branch context
```

2. **Verify Mutation Success**:
```typescript
const { mutate: createOffice, isSuccess, data: mutationResult } = useActionMutation('office.create', {
  onSuccess: (data) => {
    console.log('Mutation succeeded:', data);
    // Should see this log after successful creation
  },
  onError: (error) => {
    console.error('Mutation failed:', error);
  }
});
```

### **Optimistic Updates Not Working**

**Symptoms**:
- UI doesn't update immediately after mutations
- Loading states persist too long

**Solution**:
```typescript
// Ensure optimistic updates are properly configured
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

## Type Errors

### **Schema Type Mismatches**

**Symptoms**:
- TypeScript errors in components using schemas
- Runtime errors about missing properties

**Diagnosis**:
```typescript
// Check schema definition
const OFFICE_SCHEMA = {
  databaseKey: 'offices',
  modelName: 'Office', // Must match Prisma model
  actionPrefix: 'office', // Must match action names
  fields: [
    // Check field types match usage
    { key: 'name', type: 'text', required: true }
  ]
};
```

**Solutions**:

1. **Regenerate Types**:
```bash
# Regenerate Prisma types
npx prisma generate

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

2. **Fix Schema Definitions**:
```typescript
// ✅ DO: Match Prisma model exactly
const OFFICE_SCHEMA = {
  modelName: 'Office', // Matches model Office in schema.prisma
  fields: [
    { key: 'id', type: 'text' },
    { key: 'name', type: 'text', required: true },
    { key: 'createdAt', type: 'date' }
  ]
};

// ❌ DON'T: Mismatch with database
const OFFICE_SCHEMA = {
  modelName: 'OfficeEntity', // Doesn't match Prisma
  fields: [
    { key: 'title', type: 'text' } // Field doesn't exist in DB
  ]
};
```

### **Action Name Mismatches**

**Symptoms**:
- Runtime errors about unknown actions
- 404 errors from API endpoints

**Solution**:
```typescript
// ✅ DO: Use consistent action naming
const OFFICE_SCHEMA = {
  actionPrefix: 'office', // Creates office.create, office.list, etc.
};

// Usage must match
const { data } = useActionQuery('office.list'); // ✅ Correct
const { data } = useActionQuery('offices.list'); // ❌ Wrong prefix
```

---

## Offline Issues

### **Offline Operations Failing**

**Symptoms**:
- Mutations fail when offline
- Data doesn't sync when back online

**Diagnosis**:
```typescript
// Check if ActionClient is properly initialized
const actionClient = getActionClient(tenantId, branchContext);
console.log('ActionClient initialized:', !!actionClient);

// Check IndexedDB stores
// DevTools → Application → Storage → IndexedDB
```

**Solution**:
```typescript
// Ensure proper offline configuration
const { mutate: createOffice } = useActionMutation('office.create', {
  background: true, // Queue for background sync
  onError: (error) => {
    if (error.message.includes('offline')) {
      toast.info('Saved locally. Will sync when online.');
    }
  }
});
```

### **Sync Queue Not Processing**

**Symptoms**:
- Changes made offline don't sync when back online
- Duplicate data after sync

**Solution**:
```typescript
// Check sync queue status
const syncStatus = useSyncStatus(); // If available
console.log('Pending operations:', syncStatus.pendingCount);

// Force sync when back online
useEffect(() => {
  const handleOnline = () => {
    actionClient.processSyncQueue();
  };
  
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

---

## Branch Context Problems

### **Wrong Branch Data**

**Symptoms**:
- Seeing data from wrong branch
- Changes not appearing in current branch

**Diagnosis**:
```typescript
// Check branch context
const { branchContext } = useEnterpriseSession();
console.log('Current branch:', branchContext?.currentBranchId);
console.log('Default branch:', branchContext?.defaultBranchId);
```

**Solution**:
```typescript
// Ensure branch context is properly set
const { data: offices } = useActionQuery('office.list', {
  // Branch context is automatically included
}, {
  enabled: !!branchContext?.currentBranchId // Wait for branch context
});
```

### **Copy-on-Write Not Working**

**Symptoms**:
- Updates modify original instead of creating branch copy
- Changes appear in wrong branch

**Solution**:
```typescript
// Verify branch context in mutations
const { mutate: updateOffice } = useActionMutation('office.update', {
  onSuccess: (data) => {
    console.log('Updated office branch:', data.data.branchId);
    // Should match current branch for CoW operations
  }
});
```

---

## Auto-Generated Component Issues

### **AutoTable Not Displaying Data**

**Symptoms**:
- Table shows loading state indefinitely
- Empty table despite data existing

**Diagnosis**:
```typescript
// Check if schema is properly registered
import { OFFICE_SCHEMA } from '@/features/offices/offices.schema';
console.log('Schema:', OFFICE_SCHEMA);

// Check data loading
const { data, isLoading, error } = useActionQuery('office.list');
console.log('Data:', data, 'Loading:', isLoading, 'Error:', error);
```

**Solution**:
```typescript
// ✅ DO: Ensure schema is properly configured
<AutoTable 
  resourceKey="offices" // Must match schema databaseKey
  action="office.list"  // Must match schema actionPrefix
/>

// ❌ DON'T: Use mismatched keys
<AutoTable 
  resourceKey="office"    // Wrong - should be "offices"
  action="offices.list"   // Wrong - should be "office.list"
/>
```

### **AutoForm Validation Errors**

**Symptoms**:
- Form validation not working
- Submit button always disabled

**Solution**:
```typescript
// Check field validation in schema
const OFFICE_SCHEMA = {
  fields: [
    { 
      key: 'name', 
      type: 'text', 
      required: true,
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'maxLength', value: 100, message: 'Name too long' }
      ]
    }
  ]
};
```

---

## Server Integration Issues

### **API Endpoint Errors**

**Symptoms**:
- 404 errors for action endpoints
- 500 errors during mutations

**Diagnosis**:
```typescript
// Check API endpoint
// Should be: /api/workspaces/current/actions
// POST with action and data in body
```

**Solution**:
```typescript
// Verify API route exists
// File: app/api/workspaces/current/actions/route.ts

export async function POST(request: Request) {
  const { action, data, options, branchContext } = await request.json();
  
  // Ensure ActionRouter is properly configured
  const result = await actionRouter.execute(action, data, options, branchContext);
  
  return Response.json(result);
}
```

### **Prisma Integration Issues**

**Symptoms**:
- Database errors during operations
- Data not persisting correctly

**Solution**:
```typescript
// Check Prisma schema matches ResourceSchema
// File: prisma/schema.prisma

model Office {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Branch-aware fields
  tenantId  String
  branchId  String
  
  @@index([tenantId, branchId])
}
```

---

## Development Environment Issues

### **Hot Reload Problems**

**Symptoms**:
- Changes not reflecting in browser
- Stale cache after code changes

**Solution**:
```bash
# Clear all caches
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### **TypeScript Compilation Errors**

**Symptoms**:
- Build fails with type errors
- IDE showing incorrect types

**Solution**:
```bash
# Regenerate all types
npx prisma generate
npm run build

# Restart TypeScript in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Debugging Tools

### **DevTools Extensions**

1. **TanStack Query DevTools**:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

2. **IndexedDB Inspector**:
- Chrome DevTools → Application → Storage → IndexedDB
- Look for your app's database and stores

### **Logging Helpers**

```typescript
// Add to components for debugging
const { data, isLoading, error, dataUpdatedAt } = useActionQuery('office.list');

useEffect(() => {
  console.log('Query state:', {
    data: data?.length,
    isLoading,
    error: error?.message,
    lastUpdated: new Date(dataUpdatedAt)
  });
}, [data, isLoading, error, dataUpdatedAt]);
```

### **Performance Monitoring**

```typescript
// Monitor query performance
const { data, executionTime, fromCache } = useActionQuery('office.list');

if (executionTime > 100) {
  console.warn(`Slow query: ${executionTime}ms, fromCache: ${fromCache}`);
}
```

---

## Getting Help

### **Before Reporting Issues**

1. **Check Recent Fixes**: Many cache invalidation issues were recently resolved
2. **Verify SSOT Usage**: Ensure you're using `useActionMutation` for all writes
3. **Check Console**: Look for error messages and warnings
4. **Test in Isolation**: Create minimal reproduction case

### **Information to Include**

- Action System version
- Browser and version
- Steps to reproduce
- Console errors
- Network tab showing API calls
- IndexedDB state (if relevant)

### **Common Solutions Summary**

- **Lists not updating**: ✅ Fixed in recent update - use `useActionMutation`
- **Slow performance**: Check cache hit rates and prefetch patterns
- **Type errors**: Regenerate Prisma types and restart TypeScript
- **Offline issues**: Verify ActionClient initialization and IndexedDB
- **Branch problems**: Check branch context and Copy-on-Write logic

---

The Action System is designed to be reliable and performant. Most issues stem from not following the SSOT patterns or missing recent updates. When in doubt, use the core hooks (`useActionQuery`, `useActionMutation`) and trust the automatic invalidation system.