# ActionClient Core Architecture

## Table of Contents
1. [ActionClient Overview](#actionclient-overview)
2. [Core Components](#core-components)
3. [Execution Flow](#execution-flow)
4. [Performance Optimizations](#performance-optimizations)
5. [Branch Context Management](#branch-context-management)
6. [Usage Patterns](#usage-patterns)
7. [Advanced Features](#advanced-features)

---

## ActionClient Overview

The **ActionClient** is the central orchestrator that provides Linear-like performance through a sophisticated cache-first architecture with optimistic updates and background sync.

### **Core Architecture**

```typescript
// src/lib/action-client/action-client-core.ts
export class ActionClientCore {
  private indexedDB: IndexedDBManager;     // Persistent cache (L2)
  private cache: CacheManager;             // Memory cache (L1) 
  private syncQueue: SyncQueue;            // Background sync
  private readOps: ReadOperations;         // Read operation handlers
  private writeOps: WriteOperations;       // Write operation handlers  
  private apiClient: APIClient;            // Server communication
}
```

### **Key Characteristics**
- **Cache-First**: IndexedDB → Memory → Server priority
- **Optimistic Updates**: Instant UI feedback with background sync  
- **Branch-Aware**: Copy-on-Write operations for workspace isolation
- **Compound Keys**: 50% performance improvement with native compound keys
- **Modular Design**: Clean separation of concerns

---

## Core Components

### 1. **IndexedDBManager**
Manages persistent storage with compound key optimization:

```typescript
// Compound keys for superior performance
const keyPath = ['tenantId', 'branchId', 'id'];
const index = store.createIndex('branch_lookup', ['tenantId', 'branchId']);

// Usage examples
await indexedDB.add('offices', {
  tenantId: 'tenant123',
  branchId: 'main', 
  id: 'office456',
  name: 'New York Office'
});

// Fast branch-aware queries
const offices = await indexedDB.getAllByBranch('offices', 'tenant123', 'main');
```

### 2. **CacheManager** 
Provides ultra-fast memory cache layer:

```typescript
// Sub-10ms repeated access
const cacheKey = 'office.list:{}';
cache.set(cacheKey, data, { ttl: 120000 }); // 2-minute TTL
const cachedData = cache.get(cacheKey); // ~5ms response
```

### 3. **ReadOperations**
Handles cache-first read strategy:

```typescript
// src/lib/action-client/operations/read-operations.ts
export class ReadOperations {
  async handleReadOperation(action, data, options, cacheKey, mapping, branchContext) {
    // 1. Try memory cache first (0-5ms)
    const memoryResult = this.cache.get(cacheKey);
    if (memoryResult) return memoryResult;
    
    // 2. Try IndexedDB cache (20-50ms)  
    const dbResult = await this.indexedDB.getBranchAware(mapping.store, data, branchContext);
    if (dbResult) {
      this.cache.set(cacheKey, dbResult); // Populate memory cache
      return dbResult;
    }
    
    // 3. Fallback to server API (200-500ms)
    return await this.fetchFromServer(action, data, options, branchContext);
  }
}
```

### 4. **WriteOperations**
Manages optimistic updates with background sync:

```typescript
// src/lib/action-client/operations/write-operations.ts
export class WriteOperations {
  async handleWriteOperation(action, data, options, mapping, branchContext) {
    // 1. Apply optimistic update immediately
    const optimisticResult = await this.applyOptimisticUpdate(action, data, mapping);
    
    // 2. Queue for background sync
    this.syncQueue.add(action, data, { branchContext, optimisticId: optimisticResult.id });
    
    // 3. Return instant response
    return {
      success: true,
      data: optimisticResult,
      queued: true,
      optimistic: true,
      executionTime: performance.now() - startTime
    };
  }
}
```

### 5. **SyncQueue**
Manages background sync to server:

```typescript
// src/lib/action-client/core/sync-queue.ts
export class SyncQueue {
  async add(action: string, data: any, options: any) {
    const item = {
      action,
      data: this.cleanData(data), // Remove IndexedDB metadata
      options,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    await this.queue.push(item);
    this.processQueue(); // Start background processing
  }
  
  private cleanData(data: any) {
    // Remove IndexedDB-specific fields
    const cleaned = { ...data };
    delete cleaned._optimistic;
    delete cleaned._cached; 
    delete cleaned.branchTimestamp;
    return cleaned;
  }
}
```

---

## Execution Flow

### **Read Operation Flow**

```
useActionQuery('office.list', { status: 'active' })
        ↓
ActionClient.executeAction()
        ↓
ReadOperations.handleReadOperation()
        ↓
┌─────────────────────────────────────┐
│ 1. Memory Cache Check (0-5ms)       │
│    cacheKey: "office.list:{status}" │
│    → HIT: Return instantly          │  
│    → MISS: Continue to IndexedDB    │
└─────────────────────────────────────┘
        ↓ [cache miss]
┌─────────────────────────────────────┐
│ 2. IndexedDB Check (20-50ms)        │
│    getBranchAware('offices', {...}) │
│    → HIT: Populate memory + return  │
│    → MISS: Continue to server       │
└─────────────────────────────────────┘
        ↓ [cache miss]
┌─────────────────────────────────────┐
│ 3. Server API Call (200-500ms)      │
│    POST /api/workspaces/.../actions │
│    → Store in IndexedDB + Memory    │
│    → Return fresh data              │
└─────────────────────────────────────┘
```

### **Write Operation Flow**

```
useActionAPI('office').create({ name: 'Boston Office' })
        ↓
ActionClient.executeAction()
        ↓
WriteOperations.handleWriteOperation()  
        ↓
┌─────────────────────────────────────┐
│ 1. Optimistic Update (5-20ms)       │
│    → Add to IndexedDB immediately   │
│    → Update memory cache            │
│    → Generate temp ID if needed     │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 2. Queue Background Sync            │
│    → Add to SyncQueue               │
│    → Clean metadata fields          │
│    → Set retry logic               │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 3. Return Instant Response          │
│    → UI updates immediately         │
│    → User sees change instantly     │
│    → queued: true, optimistic: true │
└─────────────────────────────────────┘
        ↓ [background]
┌─────────────────────────────────────┐
│ 4. Background Server Sync           │
│    → POST to API endpoint           │
│    → On success: confirm local data │
│    → On error: rollback + notify    │
└─────────────────────────────────────┘
```

---

## Performance Optimizations

### **1. Compound Key Performance**
Native IndexedDB compound keys provide 50%+ performance improvement:

```typescript
// Traditional approach (slow)
const keyPath = 'id';
const query = store.index('tenant_branch').getAll([tenantId, branchId]);

// Optimized compound key approach (fast)  
const keyPath = ['tenantId', 'branchId', 'id'];
const query = store.getAll(); // Direct access, no index traversal needed
```

### **2. Memory Cache Optimization**
Multi-level cache strategy eliminates repeated work:

```typescript
// L1: Memory Cache (0-5ms) - Component lifecycle
const memoryCache = new Map<string, { data: any, timestamp: number }>();

// L2: IndexedDB (20-50ms) - Cross-session persistence  
const persistentCache = await indexedDB.getAllByBranch(store, tenantId, branchId);

// L3: Server Cache (200-500ms) - Network requests only when needed
```

### **3. Batch Operations**
Reduce API calls with intelligent batching:

```typescript
// Instead of N individual requests
await Promise.all(offices.map(office => actionClient.create('office', office)));

// Use batch operations (single request)
const results = await actionClient.createBatch('office', offices);
// Performance: 90% reduction in API calls
```

### **4. Smart Cache Invalidation**
Targeted cache invalidation avoids unnecessary refetches:

```typescript
// Don't invalidate everything
queryClient.invalidateQueries(); // ❌ Slow, refetches all data

// Target specific resources
queryClient.invalidateQueries(['action-api', 'resource', 'office']); // ✅ Fast, targeted
```

---

## Branch Context Management

### **Branch-Aware Operations**
Every operation includes branch context for proper workspace isolation:

```typescript
interface BranchContext {
  tenantId: string;           // Organization identifier
  currentBranchId: string;    // Active workspace branch
  defaultBranchId: string;    // Fallback branch (usually 'main')
  userId: string;            // Current user
}
```

### **Copy-on-Write Implementation**

```typescript
// src/lib/action-client/operations/write-operations.ts
async updateWithCopyOnWrite(action, data, branchContext) {
  const { id, ...updates } = data;
  
  // 1. Check current branch first
  const currentItem = await this.indexedDB.getBranchSpecific(
    mapping.store, 
    id, 
    branchContext.currentBranchId
  );
  
  if (currentItem) {
    // Item exists in current branch - update in place
    return await this.updateInPlace(id, updates, branchContext);
  }
  
  // 2. Check default branch  
  const defaultItem = await this.indexedDB.getBranchSpecific(
    mapping.store,
    id, 
    branchContext.defaultBranchId  
  );
  
  if (defaultItem) {
    // Copy-on-Write: Create new version in current branch
    const newVersion = {
      ...defaultItem,
      ...updates,
      id: crypto.randomUUID(), // New ID for branch version
      branchId: branchContext.currentBranchId,
      originalId: defaultItem.id, 
      version: (defaultItem.version || 0) + 1,
      updatedAt: new Date(),
      updatedBy: branchContext.userId
    };
    
    return await this.indexedDB.add(mapping.store, newVersion);
  }
  
  throw new Error(`Item not found: ${id}`);
}
```

### **Branch Fallback Reading**

```typescript
async readWithFallback(store, query, branchContext) {
  // 1. Read from current branch
  const currentData = await this.indexedDB.query(store, {
    ...query,
    branchId: branchContext.currentBranchId
  });
  
  // 2. Read from default branch  
  const defaultData = await this.indexedDB.query(store, {
    ...query, 
    branchId: branchContext.defaultBranchId
  });
  
  // 3. Merge with current branch priority
  return this.mergeBranchData(currentData, defaultData);
}

private mergeBranchData(current, defaults) {
  const currentMap = new Map(current.map(item => [item.originalId || item.id, item]));
  const result = [...current];
  
  // Add default items not overridden in current branch
  defaults.forEach(defaultItem => {
    const key = defaultItem.originalId || defaultItem.id;
    if (!currentMap.has(key)) {
      result.push(defaultItem);
    }
  });
  
  return result;
}
```

---

## Usage Patterns

### **1. Basic Usage**

```typescript
import { getActionClient } from '@/lib/action-client';

// Get singleton instance
const actionClient = getActionClient(tenantId);

// Simple read operation
const response = await actionClient.executeAction({
  action: 'office.list',
  options: { limit: 50 }
});

// Simple write operation  
const createResponse = await actionClient.executeAction({
  action: 'office.create',
  data: { name: 'Seattle Office', address: '123 Main St' }
});
```

### **2. With Branch Context**

```typescript
const branchContext = {
  tenantId: 'acme-corp',
  currentBranchId: 'feature-new-offices', 
  defaultBranchId: 'main',
  userId: 'user123'
};

const response = await actionClient.executeAction({
  action: 'office.update', 
  data: { id: 'office123', name: 'Updated Name' },
  branchContext
});

// May trigger Copy-on-Write if office exists on different branch
if (response.meta?.copyOnWrite) {
  console.log(`Created new version: ${response.data.id} from ${response.meta.originalId}`);
}
```

### **3. Performance Monitoring**

```typescript
const startTime = performance.now();

const response = await actionClient.executeAction({
  action: 'office.list'
});

console.log(`Execution time: ${response.executionTime}ms`);
console.log(`From cache: ${response.cached}`);  
console.log(`Query performance: ${response.executionTime < 50 ? 'Fast' : 'Slow'}`);

// Performance targets:
// - Memory cache: 0-5ms
// - IndexedDB cache: 20-50ms  
// - Server API: 200-500ms
```

### **4. Error Handling**

```typescript
try {
  const response = await actionClient.executeAction({
    action: 'office.create',
    data: invalidData
  });
} catch (error) {
  if (error.type === 'validation') {
    console.error('Validation errors:', error.fieldErrors);
  } else if (error.type === 'network') {
    console.error('Network error, queued for retry:', error.message);
  } else if (error.type === 'branch-conflict') {
    console.error('Branch conflict detected:', error.conflictData);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

---

## Advanced Features

### **1. Resource Method Generation**
ActionClient auto-generates typed methods for each resource:

```typescript
// Auto-generated at runtime from resource schemas
const actionClient = getActionClient(tenantId);

// These methods are dynamically created:
actionClient.resources.office.create(data);     // office.create
actionClient.resources.office.update(id, data); // office.update  
actionClient.resources.office.delete(id);       // office.delete
actionClient.resources.office.list(options);    // office.list
actionClient.resources.office.get(id);          // office.get

// Custom actions from schema also included:
actionClient.resources.office.testConnection(id); // office.testConnection
```

### **2. Cache Warming**
Pre-populate cache for instant navigation:

```typescript
// Warm cache on application bootstrap
await actionClient.warmCache(['office', 'node', 'process'], {
  background: true,  // Don't block UI
  maxItems: 1000,   // Reasonable limits
  freshness: 5 * 60 * 1000 // 5 minute freshness
});

// Results in <50ms navigation performance
```

### **3. Junction Intelligence**
Automatic junction table discovery and querying:

```typescript
// Load offices with their related processes
const response = await actionClient.executeAction({
  action: 'office.list',
  options: {
    includeJunctions: ['office_processes'], // Auto-discovered relationships
    junctionFilters: {
      office_processes: { isActive: true }  // Filter related data
    }
  }
});

// Response includes junction data
console.log(response.junctions.office_processes); // Related process connections
```

### **4. Optimistic Update Rollback**
Automatic rollback on server errors:

```typescript
// User sees instant update
const response = await actionClient.executeAction({
  action: 'office.update',
  data: { id: 'office123', name: 'New Name' }
});

// Background sync fails - automatic rollback
// UI automatically reverts to previous state
// User sees error notification
// No manual rollback code needed
```

### **5. Debug and Development Tools**

```typescript
// Enable debug mode
const actionClient = getActionClient(tenantId, { debug: true });

// Detailed execution logging
actionClient.executeAction({
  action: 'office.list'
});
// Console output:
// 🔍 [ActionClient] Executing: office.list
// ⚡ [CacheManager] Memory hit: 3ms
// ✅ [ActionClient] Response: cached=true, time=3ms

// Cache statistics
const stats = actionClient.getCacheStats();
console.log(stats);
// {
//   memoryHits: 45,
//   indexedDBHits: 12, 
//   serverCalls: 3,
//   totalQueries: 60,
//   avgResponseTime: 28.5
// }
```

---

## Best Practices

### **1. Action Naming**
```typescript
// ✅ Good: Follow resource.operation pattern
'office.list'     // List all offices
'office.get'      // Get single office
'office.create'   // Create new office  
'office.update'   // Update existing office
'office.delete'   // Delete office

// ❌ Bad: Inconsistent naming
'getOffices'      // Not following pattern
'office-create'   // Wrong separator
'listOffice'      // Wrong order
```

### **2. Branch Context**
```typescript
// ✅ Good: Always provide branch context for multi-tenant apps
const response = await actionClient.executeAction({
  action: 'office.list',
  branchContext: {
    tenantId: 'current-tenant',
    currentBranchId: 'feature-branch',
    defaultBranchId: 'main',
    userId: 'current-user'
  }
});

// ❌ Bad: Missing branch context
const response = await actionClient.executeAction({
  action: 'office.list' // Will use default context, may not be correct
});
```

### **3. Performance Optimization**
```typescript
// ✅ Good: Use cache-first for navigation
const { data } = useActionQuery('office.list'); // Automatic cache-first

// ✅ Good: Use batch operations for multiple items  
await actionClient.createBatch('office', officeArray);

// ❌ Bad: Sequential operations
for (const office of officeArray) {
  await actionClient.create('office', office); // Slow, multiple requests
}
```

### **4. Error Handling**
```typescript
// ✅ Good: Comprehensive error handling
try {
  const response = await actionClient.executeAction(request);
  return response.data;
} catch (error) {
  switch (error.type) {
    case 'validation': 
      handleValidationError(error.fieldErrors);
      break;
    case 'network':
      handleNetworkError(error);
      break; 
    case 'branch-conflict':
      handleBranchConflict(error.conflictData);
      break;
    default:
      handleUnexpectedError(error);
  }
}

// ❌ Bad: Generic error handling
try {
  const response = await actionClient.executeAction(request);
} catch (error) {
  console.error(error); // Not helpful for users
}
```

---

## Next Steps

- **[Resource Schemas](./03-resource-schemas.md)** - Define schemas that drive ActionClient
- **[Hooks & Data Fetching](./04-hooks-and-data-fetching.md)** - React integration patterns
- **[Performance Optimization](./08-performance-optimization.md)** - Advanced performance techniques

The ActionClient provides the foundation for Linear-like performance with enterprise-grade reliability and developer experience. 