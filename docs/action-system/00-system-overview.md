# Unified Action System with Junction Creation - Complete Developer Guide

## 🎯 **System Overview**

The Unified Action System is a comprehensive data management architecture that provides:

- **Unified API**: Single entry point for all CRUD operations
- **Schema-Driven**: Auto-generated actions from resource schemas
- **Junction Orchestration**: Automatic relationship creation based on context
- **Branch-Aware**: Full support for workspace branching and copy-on-write
- **Offline-First**: IndexedDB caching with background sync
- **Type-Safe**: Full TypeScript support throughout the stack

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Action System   │    │    Backend      │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│  │ AutoForm  │──┼────┼─│ ActionClient │─┼────┼─│ ActionRouter│ │
│  └───────────┘  │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│  │ Hooks     │──┼────┼─│ IndexedDB    │ │    │ │ Handlers    │ │
│  └───────────┘  │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│  │ Junction  │──┼────┼─│ SyncQueue    │─┼────┼─│ PrismaService│ │
│  │ System    │  │    │ └──────────────┘ │    │ └─────────────┘ │
│  └───────────┘  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 **Complete Data Flow**

### **1. Frontend Request**
```typescript
// User creates a Process from Node page
const result = await actionClient.executeAction({
  action: 'process.create',
  data: { name: 'New Process', description: '...' }
});
```

### **2. Action Client Processing**
```typescript
// ActionClient routes to appropriate operation
if (method === 'POST') {
  return writeOps.handleWriteOperation(action, data, options);
}
```

### **3. Junction Detection**
```typescript
// Junction system detects context and creates relationships
const shouldCreate = shouldCreateJunction('process', { nodeId: '123' });
if (shouldCreate) {
  await actionClient.executeAction({
    action: 'nodeProcesses.create',
    data: { nodeId: '123', processId: result.id }
  });
}
```

### **4. Backend Processing**
```typescript
// ActionRouter parses action and routes to handler
const parsedAction = parseAction('process.create'); // { resourceType: 'process', operation: 'create' }
const handler = handlerFactory.getHandler('create');
const result = await handler.execute(parsedAction, data, context);
```

### **5. Database Operations**
```typescript
// PrismaService handles database operations with branch context
const entity = await prismaService.create('process', data, {
  tenantId,
  branchId,
  defaultBranchId
});
```

## 📂 **File Structure Overview**

```
o-ui/src/
├── components/auto-generated/form/
│   └── auto-form.tsx                    # Main form component with junction support
├── lib/
│   ├── action-client/                   # Frontend action orchestration
│   │   ├── action-client-core.ts        # Core action client
│   │   ├── operations/                  # Read/write operations
│   │   ├── core/                        # Cache, sync, IndexedDB
│   │   └── api/                         # API communication
│   ├── junction-orchestration/          # Smart junction creation
│   │   ├── junction-context-mappings.ts # Junction relationship definitions
│   │   ├── use-contextual-create.ts     # Hook for contextual creation
│   │   └── navigation-context-utils.ts  # Context detection utilities
│   ├── resource-system/                 # Schema and action definitions
│   │   ├── resource-registry.ts         # Auto-generated action mappings
│   │   ├── schemas.ts                   # Core type definitions
│   │   └── junction-registry.ts         # Junction table configurations
│   └── server/action-system/            # Backend action processing
│       ├── core/action-router-core.ts   # Main action router
│       ├── handlers/                    # Operation handlers (CRUD)
│       └── prisma/prisma-service.ts     # Database service
└── app/api/workspaces/current/actions/
    └── route.ts                         # Main API endpoint
```

## 🚀 **Key Components**

### **Frontend Components**
- **AutoForm**: Schema-driven form with automatic junction creation
- **ActionClient**: Orchestrates all data operations with caching and sync
- **Junction System**: Detects context and creates relationships automatically
- **Hooks**: React hooks for data fetching and mutations

### **Backend Components**
- **ActionRouter**: Routes actions to appropriate handlers
- **Handlers**: Process CRUD operations (Create, Read, Update, Delete, List)
- **PrismaService**: Database operations with branch and tenant context
- **API Endpoint**: Single endpoint for all action requests

## 🎯 **Core Benefits**

1. **Developer Experience**: Single API, auto-generated actions, full TypeScript
2. **Performance**: IndexedDB caching, optimistic updates, background sync
3. **Relationships**: Automatic junction creation based on navigation context
4. **Branching**: Full workspace isolation with copy-on-write semantics
5. **Offline Support**: Full CRUD operations work without network connection
6. **Consistency**: Single source of truth for all data operations

## 📖 **Documentation Structure**

1. **[System Overview](./00-system-overview.md)** - This document
2. **[Frontend Components](./01-frontend-components.md)** - AutoForm, hooks, ActionClient
3. **[Backend Components](./02-backend-components.md)** - ActionRouter, handlers, API
4. **[Junction System](./03-junction-system.md)** - Automatic relationship creation
5. **[Data Flow](./04-data-flow.md)** - Complete request/response cycle
6. **[Developer Examples](./05-developer-examples.md)** - Practical usage patterns
7. **[Schema System](./06-schema-system.md)** - Resource and junction schemas
8. **[Branch System](./07-branch-system.md)** - Workspace branching and CoW
9. **[Performance](./08-performance.md)** - Caching, sync, and optimization
10. **[Troubleshooting](./09-troubleshooting.md)** - Common issues and solutions

## 🔧 **Quick Start**

### **1. Using AutoForm (Recommended)**
```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';

<AutoForm
  schema={PROCESS_SCHEMA}
  mode="create"
  navigationContext={{ nodeId: currentNodeId }}
  enableJunctionCreation={true}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### **2. Using ActionClient Directly**
```typescript
import { getActionClient } from '@/lib/action-client/global-client';

const actionClient = getActionClient();

// Create entity
const result = await actionClient.executeAction({
  action: 'process.create',
  data: { name: 'New Process' }
});

// List entities
const processes = await actionClient.executeAction({
  action: 'process.list',
  options: { limit: 10 }
});
```

### **3. Using Contextual Creation**
```typescript
import { useContextualCreate } from '@/lib/junction-orchestration';

const contextualCreate = useContextualCreate(
  'process',
  { nodeId: currentNodeId }
);

const result = await contextualCreate.mutateAsync({
  name: 'New Process',
  description: 'Process description'
});
// Creates both Process and NodeProcess junction automatically
```

## 🎯 **Next Steps**

- Read **[Frontend Components](./01-frontend-components.md)** to understand UI integration
- Read **[Junction System](./03-junction-system.md)** to understand automatic relationships
- Read **[Developer Examples](./05-developer-examples.md)** for practical usage patterns