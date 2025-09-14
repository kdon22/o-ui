# Action System Architecture Overview

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Concepts](#key-concepts)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Performance Strategy](#performance-strategy)
6. [SSOT Implementation](#ssot-implementation)
7. [Getting Started](#getting-started)

---

## Architecture Overview

The O-UI Action System is a **schema-driven, cache-first data management architecture** that provides **Linear-like performance** (<50ms reads) through an IndexedDB-first strategy with optimistic updates, background sync, and **bulletproof cache invalidation**.

### **Core Philosophy: Schema → Everything**

```
ResourceSchema → ResourceRegistry → ActionClient → UI Components
       ↓              ↓                ↓             ↓
   Field Defs → Action Mappings → API Calls → Auto-Generated UI
```

**Every aspect of the system is generated from ResourceSchema definitions:**
- API routes and handlers  
- IndexedDB stores and indexes
- TypeScript types and validation
- UI components (forms, tables, modals)
- Hook interfaces and cache keys
- Junction relationships and queries
- **Cache invalidation patterns**

---

## Key Concepts

### 1. **Schema-Driven Development**
Every feature is defined by a single ResourceSchema:

```typescript
// src/features/offices/offices.schema.ts
export const OFFICE_SCHEMA: ResourceSchema = {
  // Core identity
  databaseKey: 'offices',     // IndexedDB store + API endpoint
  modelName: 'Office',        // Prisma model name
  actionPrefix: 'office',     // Action namespace (office.create, office.list)
  
  // UI configuration
  display: { title: 'Offices', icon: 'building', color: 'blue' },
  fields: [
    { key: 'id', type: 'text', required: true },
    { key: 'name', type: 'text', required: true },
    { key: 'status', type: 'select', options: { static: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]}}
  ],
  actions: { create: true, update: true, delete: true, list: true }
};
```

### 2. **Cache-First Performance**
**Priority: IndexedDB → Memory Cache → Server API**

```typescript
const { data, fromCache, executionTime } = useActionQuery('office.list');
// Result: <50ms from IndexedDB, instant subsequent calls from memory
```

### 3. **Optimistic Updates with Guaranteed Invalidation**
All mutations happen instantly in the UI, with automatic cache invalidation:

```typescript
const { mutate: createOffice } = useActionMutation('office.create');
await createOffice(data); 
// ✅ UI updates instantly
// ✅ Cache invalidation happens automatically  
// ✅ Lists update immediately
// ✅ Background sync to server
```

### 4. **Branch-Aware Operations**
Git-like versioning with Copy-on-Write for workspace isolation:

```typescript
// Current branch operations automatically handled
const result = await updateOffice(id, changes); 
// May create new version if item exists on different branch
```

### 5. **Auto-Generated Components**
All UI components are generated from schemas:

```typescript
<AutoTable resourceKey="offices" />          // Complete table
<AutoModal resourceKey="offices" mode="create" />  // Create modal
<AutoForm schema={OFFICE_SCHEMA} mode="edit" />   // Edit form
```

---

## System Components

### **Frontend Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │ Auto-Table  │ │ Auto-Modal  │ │    Auto-Form        │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                 React Hooks Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │useActionAPI │ │useActionQuery│ │ useActionMutation   │ │
│  │             │ │              │ │ (SSOT for writes)   │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│               TanStack Query Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │Query Cache  │ │Mutation     │ │ Cache Invalidation  │ │
│  │Management   │ │Management   │ │ System              │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  ActionClient Core                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │IndexedDB    │ │Memory Cache │ │     Sync Queue      │ │
│  │Manager      │ │  Manager    │ │                     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│               Resource System                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │Schema       │ │Resource     │ │  Junction           │ │
│  │Registry     │ │Registry     │ │  Registry           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Backend Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                 Next.js API Routes                      │
│          /api/workspaces/current/actions                │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│               ActionRouter Core                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │Action Parser│ │Handler      │ │  Validation         │ │
│  │             │ │Factory      │ │  Engine             │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                Specialized Handlers                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │CreateHandler│ │ReadHandler  │ │  UpdateHandler      │ │
│  │             │ │             │ │  DeleteHandler      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  PrismaService                          │
│            Branch-Aware Database Operations             │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### **Read Operations** (Cache-First)

```
useActionQuery('office.list')
        ↓
1. Check Memory Cache (0-5ms) 
        ↓ [miss]
2. Check IndexedDB Cache (20-50ms)
        ↓ [miss] 
3. Fetch from Server API (200-500ms)
        ↓
4. Store in IndexedDB + Memory Cache
        ↓
5. Return to React Component
```

### **Write Operations** (Optimistic with Guaranteed Invalidation)

```
useActionMutation('office.create').mutate(data)
        ↓
1. Apply Optimistic Update to UI (instant)
        ↓
2. Store in IndexedDB Cache (5-20ms)
        ↓ 
3. Queue for Background Sync
        ↓
4. Return Success to User
        ↓
5. **AUTOMATIC CACHE INVALIDATION**
   - System onSuccess runs first
   - Uses refetchQueries (not invalidateQueries)
   - Bypasses staleTime to force immediate refetch
   - Then calls user onSuccess callback
        ↓
6. Background: Sync to Server API
        ↓
7. On Success: Confirm local data
   On Error: Rollback + Show Error
```

### **Branch Operations** (Copy-on-Write)

```
updateOffice(id, changes) on branch "feature-123"
        ↓
1. Check if item exists in current branch
        ↓ [not found]
2. Check if item exists in default branch  
        ↓ [found]
3. Copy item to current branch (Copy-on-Write)
        ↓
4. Apply changes to new copy
        ↓
5. Store in IndexedDB with branch context
        ↓
6. **AUTOMATIC CACHE INVALIDATION**
   - Invalidates both current and default branch queries
   - Updates UI immediately across all components
```

---

## Performance Strategy

### **Linear-Like Performance Targets**
- **Read Operations**: <50ms from IndexedDB, <5ms from memory
- **Write Operations**: <100ms optimistic, background sync for server
- **Tree Navigation**: <50ms for 1000+ nodes 
- **Auto-Complete**: <20ms response time
- **List Updates**: <50ms after mutations (immediate)

### **IndexedDB Optimization**
```typescript
// Compound keys for 50% performance improvement
const keyPath = ['tenantId', 'branchId', 'id'];
const index = store.createIndex('branch_lookup', ['tenantId', 'branchId']);
```

### **Memory Cache Strategy**
- **L1 Cache**: TanStack Query (component lifecycle)
- **L2 Cache**: IndexedDB (persistent, cross-session)
- **L3 Cache**: Server response cache (CDN/Redis)

### **Cache Invalidation Strategy**
```typescript
// Smart invalidation with forced refetch
await queryClient.refetchQueries({
  queryKey: ['action-api', 'actions'],
  type: 'active'
});
// Bypasses staleTime, forces immediate update
```

---

## SSOT Implementation

### **The Problem We Solved**
Previously, multiple mutation patterns caused cache invalidation failures:

```typescript
// ❌ OLD: Inconsistent patterns
const customMutation = useMutation({
  mutationFn: async (data) => {
    const actionClient = getActionClient();
    return actionClient.executeAction({ action: 'rule.create', data });
  },
  onSuccess: (result) => {
    // Manual invalidation - often forgotten or wrong
    queryClient.invalidateQueries(['rules']);
  }
});

const resourceMutation = useResourceCreate(); // Sometimes worked
// User onSuccess callbacks overriding system invalidation
```

### **The Solution: True SSOT**

```typescript
// ✅ NEW: Single pattern everywhere
const mutation = useActionMutation('rule.create', {
  onSuccess: (data) => {
    // System invalidation happens automatically FIRST
    // Then user callback runs
    toast.success('Rule created!');
  }
});

// All convenience hooks use the same SSOT
const createRule = useResourceCreate('rule'); // Wrapper around useActionMutation
```

### **Key SSOT Components**

1. **`useActionMutation`** - Core mutation hook with automatic invalidation
2. **`ActionClient`** - Handles all data operations (IndexedDB + API)
3. **Cache Invalidation Service** - Smart invalidation with `refetchQueries`
4. **Resource Hooks** - Convenience wrappers that use the SSOT

### **Invalidation Flow**

```typescript
// Inside useActionMutation
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
```

---

## Getting Started

### **1. Quick Demo**
```typescript
// Load data (cache-first, <50ms)
const { data: offices } = useActionQuery('office.list');

// Create with optimistic updates and automatic invalidation
const { mutate: createOffice } = useActionMutation('office.create');
await createOffice({ name: 'New Office' }); // Instant UI update + list refresh

// Render auto-generated table
<AutoTable resourceKey="offices" />
```

### **2. Add New Resource**
```typescript
// 1. Define schema
export const CUSTOMER_SCHEMA: ResourceSchema = {
  databaseKey: 'customers',
  modelName: 'Customer', 
  actionPrefix: 'customer',
  fields: [
    { key: 'id', type: 'text', required: true },
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true }
  ],
  actions: { create: true, update: true, delete: true, list: true }
};

// 2. Register schema (auto-discovery)
// Add to src/lib/resource-system/resource-registry.ts

// 3. Use everywhere with automatic cache invalidation
const { data: customers } = useActionQuery('customer.list');
const { mutate: createCustomer } = useActionMutation('customer.create');
<AutoTable resourceKey="customers" />
```

### **3. File Structure**
```
src/
├── features/              # Resource schemas
│   ├── offices/offices.schema.ts
│   └── customers/customers.schema.ts
├── lib/
│   ├── action-client/     # Core action execution
│   ├── resource-system/   # Schema registry & types
│   └── server/           # Backend action routing
├── hooks/
│   ├── use-action-api.ts  # Main exports
│   └── query/            # Modular hook system
│       ├── use-action-query.ts
│       ├── use-action-mutation.ts
│       ├── cache-invalidation.ts
│       └── resource-hooks.ts
└── components/
    └── auto-generated/    # Schema-driven UI components
        ├── auto-table.tsx
        ├── auto-form.tsx
        └── auto-modal.tsx
```

---

## Next Steps

1. **[Action Client Core](./02-action-client-core.md)** - Deep dive into ActionClient execution
2. **[Resource Schemas](./03-resource-schemas.md)** - How to define and structure schemas  
3. **[Hooks & Data Fetching](./04-hooks-and-data-fetching.md)** - useActionAPI and useActionQuery patterns
4. **[Auto-Generated Components](./05-auto-generated-components.md)** - Schema-driven UI system
5. **[Creating New Resources](./06-creating-new-resources.md)** - Step-by-step development guide

---

## Key Benefits

✅ **Rapid Development** - Define schema once, get complete CRUD system  
✅ **Linear Performance** - <50ms reads, instant write feedback  
✅ **Type Safety** - Full TypeScript support throughout  
✅ **Offline First** - Full functionality without network  
✅ **Branch Aware** - Git-like versioning with Copy-on-Write  
✅ **Auto-Generated** - Forms, tables, APIs from single schema  
✅ **Mobile First** - Touch-optimized responsive design  
✅ **DRY Principle** - Single schema drives everything  
✅ **Bulletproof Cache** - Automatic invalidation that actually works  

The Action System provides a **bulletproof foundation** for rapid feature development with enterprise-grade performance, reliability, and cache invalidation that you can trust.