# System Overview - Current Architecture & Data Flow

**Complete guide to the actual system architecture, data flow, and key components**

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core System Components](#core-system-components)
3. [Data Flow](#data-flow)
4. [Background Bootstrap](#background-bootstrap)
5. [Action System](#action-system)
6. [IndexedDB Integration](#indexeddb-integration)
7. [Branch-Aware Operations](#branch-aware-operations)
8. [Junction System](#junction-system)
9. [Performance Characteristics](#performance-characteristics)
10. [Development Workflow](#development-workflow)

---

## Architecture Overview

The system is built on a **schema-first, action-driven architecture** with these core principles:

### **🎯 Single Source of Truth (SSOT)**
- **One ResourceSchema** → Everything else is auto-generated
- **93 registered schemas** across 12+ feature directories
- **400+ action mappings** auto-generated from schemas
- **Zero configuration** for standard CRUD operations

### **⚡ Performance-First Design**
- **<50ms IndexedDB reads** with offline-first strategy
- **Background Bootstrap** loads critical resources without blocking UI
- **Optimistic updates** with automatic rollback on failure
- **Progressive enhancement** from mobile to desktop

### **🌿 Branch-Aware by Design**
- **Complete workspace isolation** with Copy-on-Write semantics
- **Tenant separation** built into every operation
- **Automatic fallback** from current branch to default branch
- **Junction table branching** with automatic relationship copying

---

## Core System Components

### **1. Resource Registry** `src/lib/resource-system/resource-registry.ts`

**The Central Hub** - Auto-discovers and registers all resource schemas:

```typescript
// Auto-discovery process
const SCHEMA_RESOURCES: ResourceSchema[] = [
  BRANCH_SCHEMA,     // Core system schemas
  NODE_SCHEMA,       // Business entities
  PROCESS_SCHEMA,    // Workflow components
  RULE_SCHEMA,       // Business logic
  // ... 89 more schemas
];

// Generates 400+ action mappings
const actionMappings = {
  'nodes.create': { store: 'nodes', method: 'POST', optimistic: true },
  'nodes.list': { store: 'nodes', method: 'GET', cached: true },
  'rules.create': { store: 'rules', method: 'POST', optimistic: true },
  // ... auto-generated for all schemas
};

// Creates IndexedDB store configurations
const storeConfigs = [
  { name: 'nodes', keyPath: 'id', indexes: [...] },
  { name: 'rules', keyPath: 'id', indexes: [...] },
  // ... auto-generated for all schemas
];
```

**Key Features:**
- Auto-discovery from imports
- Action mapping generation
- IndexedDB store configuration
- Junction table discovery from relationships
- Type-safe resource access

### **2. Background Bootstrap** `src/components/providers/background-bootstrap.tsx`

**Non-Blocking Initialization** - Loads resources without blocking UI rendering:

```typescript
// Critical resources loaded first (3s timeout each)
const criticalResources = [
  { type: 'branches', limit: 10 },
  { type: 'nodes', limit: 50 }
];

// Non-critical resources loaded in background
const nonCriticalResources = [
  'rules', 'processes', 'workflows', 'offices', 
  'user', 'credential', 'communication'
];
```

**Architecture Benefits:**
- **Never blocks UI** - UI renders immediately
- **Fail-open strategy** - Shows offline indicator on failure
- **Progressive loading** - Critical first, then background
- **Timeout protection** - 3-5 second limits per resource
- **Authentication-aware** - Skips bootstrap on auth pages

### **3. Action Client System** `src/lib/action-client/unified-action-client.ts`

**The Data Layer** - Handles all CRUD operations with caching and branching:

```typescript
// Unified API for all resources
await actionClient.executeAction({
  action: 'rules.create',
  data: { name: 'Validate Customer', type: 'BUSINESS' },
  branchContext: { currentBranchId, tenantId, userId }
});

// Branch-aware reads with automatic fallback
await actionClient.executeAction({
  action: 'nodes.list',
  data: { parentId: 'root' },
  branchContext // Searches current branch + default branch
});
```

**Key Capabilities:**
- **IndexedDB-first reads** (<50ms performance)
- **Optimistic updates** with rollback
- **Branch-aware operations** with automatic fallback
- **Tenant isolation** built-in
- **Offline support** with sync queue
- **Auto-value processing** (UUIDs, timestamps, user context)

### **4. Auto-Generated Components** `src/components/auto-generated/`

**Schema-Driven UI** - Components automatically generated from schemas:

```typescript
// AutoTable - Complete CRUD interface
<AutoTable resourceKey="rules" />

// AutoForm - Schema-driven forms with validation  
<AutoForm schema={RULE_SCHEMA} mode="create" onSubmit={handleSubmit} />

// AutoModal - Create/edit dialogs
<AutoModal schema={RULE_SCHEMA} config={{ resource: 'rules', action: 'create' }} />

// AutoTree - Hierarchical navigation
<AutoTree resourceKey="nodes" onNodeSelect={handleSelect} />
```

**Generated Features:**
- Mobile-first responsive design
- Inline editing and bulk operations
- Context menus and keyboard shortcuts
- Search and filtering
- Pagination and virtual scrolling
- Form validation and error handling

---

## Data Flow

### **Complete Request Lifecycle**

```
1. User Interaction
   │
   ├── AutoForm.submit() / AutoTable.edit()
   │
2. Action Client
   │
   ├── executeAction('rules.create', data)
   │   ├── Apply auto-values (UUID, tenantId, branchId)
   │   ├── Optimistic IndexedDB update
   │   └── Queue API call
   │
3. Server Action Router
   │
   ├── Parse action: 'rules.create' → { resource: 'rules', operation: 'create' }
   │   ├── Get RULE_SCHEMA from registry
   │   ├── Route to CreateHandler
   │   └── Execute with Prisma
   │
4. Response & Sync
   │
   ├── Update IndexedDB with server response
   │   ├── Auto-create junctions (if configured)
   │   ├── Invalidate TanStack Query cache
   │   └── Update UI optimistically
```

### **Branch-Aware Read Flow**

```
1. Request: actionClient.executeAction('nodes.list', { parentId: 'root' })
   │
2. IndexedDB Query
   │
   ├── Search current branch: branchId = 'development'
   │   └── Results: [node1, node2] (2 items found)
   │
   ├── Search default branch: branchId = 'main'  
   │   └── Results: [node1, node3, node4] (3 items found)
   │
3. Merge Results (current takes precedence)
   │
   ├── Final results: [node1(dev), node2(dev), node3(main), node4(main)]
   │   └── De-duplicate by originalNodeId || id
   │
4. Return to UI: 4 total nodes with proper branch context
```

**Next**: Learn about [Field Configuration](./01-field-configuration.md) to design your schema fields and validation rules.