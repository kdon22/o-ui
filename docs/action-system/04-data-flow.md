# Complete Data Flow - UI to Database

## 🎯 **Overview**

This document traces the complete data flow through the Unified Action System, from user interaction in the UI to database operations and back to the UI.

## 🔄 **Complete Request/Response Cycle**

### **Flow Diagram**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │  Frontend   │    │   Action    │    │  Backend    │
│ Interaction │    │ Components  │    │   Client    │    │ Components  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
   1.  │ Form Submit       │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
   2.  │                   │ executeAction()   │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
   3.  │                   │                   │ POST /api/actions │
       │                   │                   ├──────────────────►│
       │                   │                   │                   │
   4.  │                   │                   │                   │ ActionRouter
       │                   │                   │                   │ ├─► Handler
       │                   │                   │                   │ ├─► PrismaService
       │                   │                   │                   │ └─► Database
       │                   │                   │                   │
   5.  │                   │                   │ ActionResponse    │
       │                   │                   │◄──────────────────┤
       │                   │                   │                   │
   6.  │                   │ Result            │                   │
       │                   │◄──────────────────┤                   │
       │                   │                   │                   │
   7.  │ Success Callback  │                   │                   │
       │◄──────────────────┤                   │                   │
       │                   │                   │                   │
```

## 📝 **Step-by-Step Flow: Creating a Process**

Let's trace a complete example of creating a Process from a Node page.

### **Step 1: User Interaction**

```typescript
// User is on Node page: /nodes/node-123
// User clicks "Create Process" button
// AutoForm modal opens

<AutoForm
  schema={PROCESS_SCHEMA}
  mode="create"
  navigationContext={{ nodeId: 'node-123' }}  // Detected from URL
  enableJunctionCreation={true}
  onSubmit={handleProcessCreated}
  onCancel={closeModal}
/>
```

### **Step 2: Form Submission Processing**

```typescript
// Inside AutoForm component
const onFormSubmit = useCallback(async (formData) => {
  console.log('🎯 [AutoForm] Form submission started', {
    entityType: 'process',
    mode: 'create',
    enableJunctionCreation: true,
    navigationContext: { nodeId: 'node-123' },
    formData: { name: 'New Process', description: '...' }
  });

  // AutoForm detects junction creation is enabled and context exists
  if (mode === 'create' && enableJunctionCreation) {
    // Use contextual create mutation
    const result = await contextualCreateMutation.mutateAsync(formData);
    
    console.log('✅ [AutoForm] Contextual create completed', {
      entityId: result.entity.data?.id,
      junctionCreated: result.junctionCreated
    });

    // Call parent onSubmit with entity data
    await onSubmit(result.entity.data);
  }
}, [mode, enableJunctionCreation, contextualCreateMutation, onSubmit]);
```

### **Step 3: Contextual Create Hook Execution**

```typescript
// Inside useContextualCreate hook
const mutationFn = async (entityData) => {
  console.log('🚀 [useContextualCreate] Starting contextual creation', {
    entityType: 'process',
    navigationContext: { nodeId: 'node-123' },
    entityData: { name: 'New Process', description: '...' }
  });

  // Step 3a: Create main entity
  console.log('🔥 [useContextualCreate] Creating main entity');
  const entity = await actionClient.executeAction({
    action: 'process.create',
    data: entityData
  });

  if (!entity.success) {
    throw new Error('Failed to create process');
  }

  console.log('✅ [useContextualCreate] Main entity created', {
    entityId: entity.data.id
  });

  // Step 3b: Check if junction should be created
  const shouldCreate = shouldCreateJunction('process', { nodeId: 'node-123' });
  console.log('🔍 [useContextualCreate] Junction check', {
    shouldCreate: true,  // process + node context = nodeProcesses junction
  });

  // Step 3c: Get junction mapping
  const junctionInfo = getJunctionMapping('process', { nodeId: 'node-123' });
  console.log('🗺️ [useContextualCreate] Junction mapping', {
    junctionAction: 'nodeProcesses.create',
    sourceEntity: 'node',
    sourceId: 'node-123'
  });

  // Step 3d: Create junction record
  console.log('🔗 [useContextualCreate] Creating junction');
  const junction = await actionClient.executeAction({
    action: 'nodeProcesses.create',
    data: {
      nodeId: 'node-123',
      processId: entity.data.id,
      tenantId: 'tenant-123',
      branchId: 'main'
    }
  });

  console.log('✅ [useContextualCreate] Junction created', {
    success: junction.success
  });

  return {
    entity,
    junction: junction.success ? junction : null,
    junctionCreated: junction.success
  };
};
```

### **Step 4: ActionClient Processing**

```typescript
// Inside ActionClientCore.executeAction()
async executeAction(request: ActionRequest): Promise<ActionResponse> {
  console.log('🚨 [ActionClientCore] EXECUTE ACTION ENTRY POINT', {
    action: 'process.create',
    dataKeys: ['name', 'description'],
    timestamp: new Date().toISOString()
  });

  const mapping = ACTION_MAPPINGS['process.create'];
  console.log('🗺️ [ActionClientCore] Action mapping found', {
    store: 'processes',
    method: 'POST',
    endpoint: '/api/workspaces/current/actions',
    cached: false,
    optimistic: true
  });

  // Route to WriteOperations for POST method
  console.log('🚨 [ActionClientCore] ROUTING TO write operations');
  
  return this.writeOps.handleWriteOperation(
    'process.create',
    { name: 'New Process', description: '...' },
    options,
    cacheKey,
    mapping,
    activeBranchContext
  );
}
```

### **Step 5: Write Operations Processing**

```typescript
// Inside WriteOperations.handleWriteOperation()
async handleWriteOperation(action, data, options, cacheKey, mapping, branchContext) {
  console.log('🔥 [WriteOperations] Processing write operation', {
    action: 'process.create',
    store: 'processes',
    optimistic: true
  });

  // Step 5a: Optimistic update to IndexedDB
  console.log('⚡ [WriteOperations] Applying optimistic update');
  const optimisticData = {
    ...data,
    id: generateOptimisticId(),
    __optimistic: true,
    createdAt: new Date().toISOString()
  };

  await this.indexedDB.add('processes', optimisticData);
  console.log('✅ [WriteOperations] Optimistic update applied to IndexedDB');

  // Step 5b: Queue for background sync
  console.log('📤 [WriteOperations] Queuing for background sync');
  this.syncQueue.add({
    action: 'process.create',
    data: data,
    timestamp: Date.now(),
    retryCount: 0
  });

  // Step 5c: Make API call
  console.log('🌐 [WriteOperations] Making API call');
  const apiResponse = await this.apiClient.fetchFromAPI(
    'process.create',
    data,
    options,
    branchContext
  );

  if (apiResponse.success) {
    console.log('✅ [WriteOperations] API call successful');
    
    // Replace optimistic data with real data
    await this.indexedDB.update('processes', optimisticData.id, {
      ...apiResponse.data,
      __optimistic: false
    });
  } else {
    console.error('❌ [WriteOperations] API call failed');
    
    // Remove optimistic data
    await this.indexedDB.delete('processes', optimisticData.id);
    throw new Error(apiResponse.error);
  }

  return apiResponse;
}
```

### **Step 6: API Request**

```typescript
// Inside APIClient.fetchFromAPI()
async fetchFromAPI(action, data, options, branchContext) {
  console.log('🌐 [APIClient] Making API request', {
    action: 'process.create',
    endpoint: '/api/workspaces/current/actions',
    method: 'POST'
  });

  const requestPayload = {
    action: 'process.create',
    data: { name: 'New Process', description: '...' },
    options: {},
    branchContext: {
      currentBranchId: 'main',
      defaultBranchId: 'main',
      tenantId: 'tenant-123'
    }
  };

  const response = await fetch('/api/workspaces/current/actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-123'
    },
    body: JSON.stringify(requestPayload)
  });

  const result = await response.json();
  console.log('📨 [APIClient] API response received', {
    success: result.success,
    hasData: !!result.data,
    executionTime: result.executionTime
  });

  return result;
}
```

### **Step 7: Backend API Processing**

```typescript
// Inside /api/workspaces/current/actions/route.ts
export async function POST(request: NextRequest) {
  console.log('🔥 [API] Request received', {
    action: 'process.create',
    hasData: true,
    timestamp: new Date().toISOString()
  });

  const startTime = Date.now();

  // Extract request data
  const actionRequest = {
    action: 'process.create',
    data: { name: 'New Process', description: '...' },
    branchContext: { currentBranchId: 'main', ... }
  };

  // Extract context
  const session = await getServerSession(authOptions);
  const executionContext = {
    userId: session.user.id,
    tenantId: 'tenant-123',
    branchId: 'main',
    defaultBranchId: 'main',
    session
  };

  console.log('🔥 [API] Execution context prepared', {
    userId: executionContext.userId,
    tenantId: executionContext.tenantId,
    branchId: executionContext.branchId
  });

  // Route to ActionRouter
  const actionRouter = getActionRouter();
  const result = await actionRouter.executeAction(actionRequest, executionContext);

  console.log('✅ [API] Action executed successfully', {
    success: result.success,
    executionTime: Date.now() - startTime
  });

  return NextResponse.json({
    success: true,
    data: result.data,
    timestamp: Date.now(),
    action: 'process.create',
    executionTime: Date.now() - startTime
  });
}
```

### **Step 8: ActionRouter Processing**

```typescript
// Inside ActionRouterCore.executeAction()
async executeAction(request, context) {
  console.log('🔥 [ActionRouterCore] executeAction started', {
    action: 'process.create',
    context: context
  });

  // Parse action
  const parsedAction = parseAction('process.create');
  console.log('🔥 [ActionRouterCore] Action parsed', {
    resourceType: 'process',
    operation: 'create'
  });

  // Get resource schema
  const schema = getResourceSchema('process');
  console.log('📋 [ActionRouterCore] Schema found', {
    modelName: 'Process',
    databaseKey: 'processes'
  });

  // Get handler
  const handler = this.handlerFactory.getHandler('create');
  console.log('🎯 [ActionRouterCore] Handler found', {
    handlerType: 'CreateHandler'
  });

  // Execute handler
  const result = await handler.execute(
    parsedAction,
    { name: 'New Process', description: '...' },
    {},
    context,
    schema
  );

  console.log('✅ [ActionRouterCore] Handler execution completed', {
    success: result.success,
    entityId: result.data?.id
  });

  return result;
}
```

### **Step 9: CreateHandler Processing**

```typescript
// Inside CreateHandler.execute()
async execute(parsedAction, data, options, context, schema) {
  console.log('🔧 [CreateHandler] Processing create operation', {
    resourceType: 'process',
    modelName: 'Process'
  });

  // Validate and clean data
  const cleanData = this.validateAndCleanData(data, schema);
  console.log('✅ [CreateHandler] Data validated and cleaned');

  // Add context fields
  const entityData = {
    ...cleanData,
    id: generateId(),
    tenantId: context.tenantId,
    branchId: context.branchId,
    createdBy: context.userId,
    updatedBy: context.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log('🏗️ [CreateHandler] Entity data prepared', {
    id: entityData.id,
    tenantId: entityData.tenantId,
    branchId: entityData.branchId
  });

  // Create entity using PrismaService
  const result = await this.prismaService.create(
    'Process',
    entityData,
    {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId
    }
  );

  console.log('✅ [CreateHandler] Entity created successfully', {
    id: result.id,
    name: result.name
  });

  return {
    success: true,
    data: result,
    timestamp: Date.now()
  };
}
```

### **Step 10: PrismaService Database Operation**

```typescript
// Inside PrismaService.create()
async create(modelName, data, context) {
  console.log('🗄️ [PrismaService] Creating entity', {
    modelName: 'Process',
    tenantId: context.tenantId,
    branchId: context.branchId
  });

  const model = this.getModel('Process'); // this.prisma.process

  const entityData = {
    ...data,
    tenantId: context.tenantId,
    branchId: context.branchId
  };

  console.log('📝 [PrismaService] Executing database create');
  
  const result = await model.create({ 
    data: entityData,
    include: {
      // Include related data if needed
    }
  });

  console.log('✅ [PrismaService] Database create successful', {
    id: result.id,
    name: result.name,
    createdAt: result.createdAt
  });

  return result;
}
```

### **Step 11: Response Chain Back to UI**

The response flows back through the same chain in reverse:

1. **PrismaService** returns created entity
2. **CreateHandler** returns ActionResult with entity data
3. **ActionRouter** returns ActionResult to API
4. **API Endpoint** returns standardized JSON response
5. **APIClient** receives and validates response
6. **WriteOperations** updates IndexedDB with real data
7. **ActionClient** returns response to hook
8. **useContextualCreate** processes entity result and creates junction
9. **AutoForm** calls parent onSubmit with final data
10. **Parent Component** handles success (closes modal, refreshes data, etc.)

## 🔄 **Junction Creation Flow**

After the main entity is created, the junction creation follows a similar but separate flow:

### **Junction Request Processing**

```typescript
// Step 1: Junction action execution
const junction = await actionClient.executeAction({
  action: 'nodeProcesses.create',
  data: {
    nodeId: 'node-123',
    processId: 'process-456',  // ID of created process
    tenantId: 'tenant-123',
    branchId: 'main'
  }
});

// Step 2: Same flow as main entity
// - ActionClient → WriteOperations → APIClient → API → ActionRouter → CreateHandler → PrismaService

// Step 3: Junction record created in database
// NodeProcess table: { nodeId: 'node-123', processId: 'process-456', ... }
```

## 📊 **Read Operations Flow**

For comparison, here's the flow for read operations (e.g., listing processes):

### **Read Flow Diagram**

```
User Request (Load Process List)
    ↓
useActionQuery({ action: 'process.list' })
    ↓
ActionClient.executeAction()
    ↓
ReadOperations.handleReadOperation()
    ↓
1. Check IndexedDB cache
    ↓
2. If cache miss or stale → API call
    ↓
API → ActionRouter → ListHandler → PrismaService
    ↓
3. Store response in IndexedDB
    ↓
4. Return data to UI
    ↓
UI updates with data
```

### **Cache-First Read Processing**

```typescript
// Inside ReadOperations.handleReadOperation()
async handleReadOperation(action, data, options, cacheKey, mapping, branchContext) {
  console.log('📖 [ReadOperations] Processing read operation', {
    action: 'process.list',
    cacheKey: 'process.list:{}:main'
  });

  // Step 1: Check IndexedDB cache
  const cachedData = await this.cacheManager.get(cacheKey);
  
  if (cachedData && !this.isCacheStale(cachedData)) {
    console.log('⚡ [ReadOperations] Cache hit - returning cached data', {
      itemCount: cachedData.data?.length,
      cacheAge: Date.now() - cachedData.timestamp
    });
    return cachedData;
  }

  console.log('🌐 [ReadOperations] Cache miss/stale - fetching from API');

  // Step 2: Fetch from API
  const apiResponse = await this.apiClient.fetchFromAPIWithResponse(
    action,
    data,
    options,
    branchContext,
    startTime,
    // Storage callback
    (apiData, action, options, branchContext) => 
      this.storageHelpers.storeAPIResponse(apiData, action, options, branchContext)
  );

  console.log('✅ [ReadOperations] API data fetched and stored', {
    itemCount: apiResponse.data?.length,
    hasJunctions: !!apiResponse.junctions
  });

  return apiResponse;
}
```

## 🗄️ **IndexedDB Operations**

The IndexedDB operations provide offline-first capabilities:

### **Write to IndexedDB**

```typescript
// Inside IndexedDBManager
async add(storeName, data) {
  console.log('💾 [IndexedDB] Adding record', {
    store: storeName,
    id: data.id,
    optimistic: data.__optimistic
  });

  const db = await this.getDatabase();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  await store.add(data);
  
  console.log('✅ [IndexedDB] Record added successfully');
}

async update(storeName, id, data) {
  console.log('💾 [IndexedDB] Updating record', {
    store: storeName,
    id: id,
    optimistic: data.__optimistic
  });

  const db = await this.getDatabase();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  await store.put({ ...data, id });
  
  console.log('✅ [IndexedDB] Record updated successfully');
}
```

### **Read from IndexedDB**

```typescript
async get(storeName, id) {
  console.log('💾 [IndexedDB] Getting record', {
    store: storeName,
    id: id
  });

  const db = await this.getDatabase();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  const result = await store.get(id);
  
  console.log('💾 [IndexedDB] Record retrieved', {
    found: !!result,
    optimistic: result?.__optimistic
  });

  return result;
}
```

## 🔄 **Background Sync Operations**

The SyncQueue handles background synchronization:

### **Sync Processing**

```typescript
// Inside SyncQueue.processQueue()
private async processQueue() {
  console.log('🔄 [SyncQueue] Processing sync queue', {
    queueLength: this.queue.length
  });

  while (this.queue.length > 0) {
    const item = this.queue.shift();
    
    try {
      console.log('📤 [SyncQueue] Processing sync item', {
        action: item.action,
        timestamp: item.timestamp,
        retryCount: item.retryCount
      });

      await this.processItem(item);
      
      console.log('✅ [SyncQueue] Sync item processed successfully');
      
    } catch (error) {
      console.error('❌ [SyncQueue] Sync item failed', {
        action: item.action,
        error: error.message,
        retryCount: item.retryCount
      });

      if (item.retryCount < 3) {
        // Retry with exponential backoff
        item.retryCount++;
        setTimeout(() => this.queue.push(item), 1000 * Math.pow(2, item.retryCount));
      }
    }
  }
}
```

## 🎯 **Performance Optimizations**

### **Optimistic Updates**

```typescript
// Immediate UI feedback
const optimisticData = {
  ...formData,
  id: generateOptimisticId(),
  __optimistic: true,
  createdAt: new Date().toISOString()
};

// 1. Update UI immediately
updateQueryCache(optimisticData);

// 2. Update IndexedDB immediately  
await indexedDB.add('processes', optimisticData);

// 3. API call in background
const apiResult = await apiCall();

// 4. Replace optimistic data with real data
await indexedDB.update('processes', optimisticData.id, apiResult.data);
updateQueryCache(apiResult.data);
```

### **Caching Strategy**

```typescript
// Multi-layer caching
const cacheKey = `${action}:${JSON.stringify(data)}:${branchId}`;

// 1. TanStack Query cache (in-memory)
const queryData = queryClient.getQueryData([cacheKey]);

// 2. IndexedDB cache (persistent)
const indexedData = await indexedDB.get(storeName, cacheKey);

// 3. API call (if cache miss/stale)
const apiData = await apiClient.fetchFromAPI(action, data);
```

### **Batch Operations**

```typescript
// Batch multiple operations for better performance
const batchOperations = [
  { action: 'process.create', data: processData },
  { action: 'nodeProcesses.create', data: junctionData }
];

// Execute in transaction for consistency
await prisma.$transaction(async (tx) => {
  const results = [];
  for (const op of batchOperations) {
    const result = await executeOperation(op, tx);
    results.push(result);
  }
  return results;
});
```

## 🐛 **Error Handling Flow**

### **Error Propagation**

```typescript
try {
  // API call fails
  const result = await apiClient.fetchFromAPI(action, data);
} catch (apiError) {
  console.error('🚨 [ActionClient] API call failed', {
    action,
    error: apiError.message
  });

  // Remove optimistic data
  await indexedDB.delete(storeName, optimisticId);
  
  // Update query cache to remove optimistic item
  queryClient.setQueryData(queryKey, (old) => 
    old?.filter(item => item.id !== optimisticId)
  );

  // Propagate error to UI
  throw new Error(`Failed to create ${entityType}: ${apiError.message}`);
}
```

### **Error Recovery**

```typescript
// Retry mechanism with exponential backoff
const retryOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## 📈 **Monitoring and Logging**

### **Performance Tracking**

```typescript
// Track execution times throughout the flow
const performanceLog = {
  action: 'process.create',
  timestamps: {
    userAction: Date.now(),
    formSubmit: 0,
    actionClient: 0,
    apiCall: 0,
    database: 0,
    response: 0,
    uiUpdate: 0
  }
};

// Log at each stage
performanceLog.timestamps.formSubmit = Date.now();
performanceLog.timestamps.actionClient = Date.now();
// ... etc

// Final performance summary
console.log('📊 [Performance] Complete flow timing', {
  totalTime: performanceLog.timestamps.uiUpdate - performanceLog.timestamps.userAction,
  apiTime: performanceLog.timestamps.response - performanceLog.timestamps.apiCall,
  databaseTime: performanceLog.timestamps.database - performanceLog.timestamps.apiCall
});
```

### **Error Tracking**

```typescript
// Comprehensive error context
const errorContext = {
  action,
  userId: session?.user?.id,
  tenantId,
  branchId,
  timestamp: Date.now(),
  userAgent: request.headers.get('user-agent'),
  requestId: generateRequestId(),
  stackTrace: error.stack
};

console.error('🚨 [Error] Operation failed', errorContext);

// Send to error tracking service
errorTracker.captureException(error, errorContext);
```

## 🎯 **Summary**

The complete data flow demonstrates:

1. **Seamless Integration**: UI components work seamlessly with the action system
2. **Optimistic Updates**: Immediate UI feedback with background synchronization
3. **Offline Support**: IndexedDB provides offline capabilities with sync when online
4. **Error Resilience**: Comprehensive error handling and recovery mechanisms
5. **Performance**: Multi-layer caching and optimized database operations
6. **Junction Orchestration**: Automatic relationship creation based on context
7. **Branch Awareness**: All operations respect workspace branching and tenant isolation

The system provides a robust, performant, and developer-friendly way to handle all data operations from simple CRUD to complex relationship management.

## 🔗 **Related Documentation**

- **[Frontend Components](./01-frontend-components.md)** - UI components and hooks
- **[Backend Components](./02-backend-components.md)** - Server-side processing
- **[Junction System](./03-junction-system.md)** - Automatic relationship creation
- **[Performance](./08-performance.md)** - Optimization strategies