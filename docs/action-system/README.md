# Action System Documentation

A comprehensive guide to the powerful, schema-driven Action System that enables cache-first, offline-capable applications with auto-generated UIs and **bulletproof cache invalidation**.

## 🚀 Quick Start

The Action System is designed for **rapid development** with **Linear-like performance**. Get started in 3 steps:

```typescript
// 1. Define a schema (Single Source of Truth)
const USER_SCHEMA = {
  databaseKey: 'users',
  modelName: 'User',
  actionPrefix: 'user',
  fields: [
    { key: 'id', type: 'text', required: true },
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true, unique: true },
    { key: 'role', type: 'select', options: { static: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' }
    ]}}
  ],
  actions: {
    create: { enabled: true },
    update: { enabled: true },
    delete: { enabled: true },
    list: { enabled: true }
  }
};

// 2. Use auto-generated components
const UserPage = () => (
  <div>
    <AutoTable resourceKey="users" />
    <AutoModal resourceKey="users" mode="create" />
  </div>
);

// 3. Enjoy instant performance with automatic cache invalidation
const { data } = useActionQuery('user.list');
const { mutate: createUser } = useActionMutation('user.create');
// ⚡ <50ms reads from IndexedDB
// 🔄 Background sync with server
// 📱 Works offline
// ✅ Lists update immediately after mutations
```

## 📚 Documentation Guide

### **Core Concepts** (Start Here)
0. **[Complete System Overview](./00-system-overview.md)** - High-level architecture overview
1. **[Detailed System Overview](./01-system-overview.md)** - Architecture and key concepts
2. **[ActionClient Core](./02-action-client-core.md)** - The heart of the system (updated)
3. **[Resource Schemas](./03-resource-schemas.md)** - Single Source of Truth design

### **Frontend Development**
4. **[Hooks & Data Fetching](./04-hooks-and-data-fetching.md)** - Modular hook system patterns
5. **[Auto-Generated Components](./05-auto-generated-components.md)** - UI components from schemas
6. **[Creating New Resources](./06-creating-new-resources.md)** - Complete step-by-step guide

### **Backend & Advanced**
7. **[Server Integration](./07-server-integration.md)** - API endpoints, handlers, and Prisma service
8. **[Best Practices](./08-best-practices.md)** - Development guidelines and patterns
9. **[Troubleshooting Guide](./09-troubleshooting-guide.md)** - 🚨 Common issues and solutions
10. **[Cache Invalidation](./10-cache-invalidation.md)** - Schema-driven cache invalidation system

### **Component Documentation**
1. **[Frontend Components](./01-frontend-components.md)** - UI layer integration
2. **[Backend Components](./02-backend-components.md)** - Server architecture details
4. **[Data Flow](./04-data-flow.md)** - Complete request/response cycle
5. **[Developer Examples](./05-developer-examples.md)** - Practical usage patterns

## 🎯 Key Benefits

### **Developer Experience**
- **⚡ Lightning Fast**: <50ms reads, <200ms API responses
- **🔄 Offline-First**: Full CRUD operations work without network
- **📱 Mobile-First**: Auto-responsive components with touch optimization
- **🎨 Auto-Generated**: Forms, tables, modals generated from schemas
- **🔒 Branch-Aware**: Git-like versioning with Copy-on-Write
- **🛡️ Type-Safe**: Full TypeScript support throughout
- **✅ Bulletproof Cache**: Automatic invalidation that actually works

### **Business Value**
- **🚀 Rapid Development**: New resources in <30 minutes
- **📈 Linear Performance**: No performance degradation as data grows
- **💰 Cost Efficient**: Reduced server load, fewer API calls
- **🔧 Maintainable**: Single schema change updates entire system
- **🏢 Enterprise Ready**: Multi-tenant, secure, auditable

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Auto-Generated Components  │   React Hooks   │  Schemas   │
│  • AutoTable               │   • useActionQuery│  • Fields  │
│  • AutoForm                │   • useActionMutation • Actions │
│  • AutoModal               │   • Branch Context│  • Display │
│  • AutoTree                │                   │  • Valid.  │
├─────────────────────────────────────────────────────────────┤
│                     ActionClient Core                       │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ IndexedDB     │  │ TanStack    │  │ Background      │  │
│  │ Cache         │  │ Query       │  │ Sync Queue      │  │
│  │ <50ms reads   │  │ <10ms       │  │ Offline support │  │
│  └───────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                Cache Invalidation System                    │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Smart         │  │ Resource    │  │ Forced          │  │
│  │ Invalidation  │  │ Family      │  │ Refetch         │  │
│  │ Auto-detect   │  │ Grouping    │  │ Bypasses stale  │  │
│  └───────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (Next.js)                     │
│  Single Endpoint: /api/workspaces/current/actions          │
├─────────────────────────────────────────────────────────────┤
│                    Backend (Server)                        │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐│
│  │ ActionRouter    │  │ Handlers    │  │ PrismaService   ││
│  │ • Route Actions │  │ • Create    │  │ • Branch-Aware  ││
│  │ • Load Balance  │  │ • Update    │  │ • Copy-on-Write ││
│  │ │ Error Handle  │  │ • Delete    │  │ • Multi-Tenant  ││
│  │                 │  │ • Read      │  │                 ││
│  └─────────────────┘  └─────────────┘  └─────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                   │
│  Branch-aware tables with tenant isolation                 │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Performance Characteristics

| Operation | Target | Typical | Notes |
|-----------|--------|---------|-------|
| **Reads** | <50ms | ~20ms | IndexedDB cache-first |
| **Writes** | <100ms | ~60ms | Optimistic updates |
| **API Response** | <200ms | ~150ms | Server processing |
| **Cold Navigation** | <500ms | ~300ms | Including data load |
| **Cache Hit Rate** | >90% | ~95% | After initial load |
| **List Updates** | <50ms | ~20ms | Immediate after mutations |

## 🛠️ SSOT (Single Source of Truth) Architecture

### **The Problem We Solved**
Previously, the system had multiple mutation patterns that caused cache invalidation failures:

```typescript
// ❌ OLD: Multiple inconsistent patterns
const customMutation = useMutation({ ... }); // No invalidation
const resourceMutation = useResourceCreate(); // Sometimes worked
// User onSuccess callbacks overriding system invalidation
```

### **The Solution: True SSOT**
Now every mutation goes through the same system with guaranteed invalidation:

```typescript
// ✅ NEW: Single pattern everywhere
const mutation = useActionMutation('rule.create'); // Always invalidates
const createRule = useResourceCreate('rule');      // Wrapper around above
// System invalidation runs first, then user callbacks
```

### **Key SSOT Components**

1. **`useActionMutation`** - Core mutation hook with automatic invalidation
2. **`ActionClient`** - Handles all data operations (IndexedDB + API)
3. **Cache Invalidation Service** - Automatic, smart invalidation with `refetchQueries`
4. **Resource Hooks** - Convenience wrappers that use the SSOT

## 🚀 Quick Reference

### **Common Patterns**

```typescript
// Data Fetching (Cache-First)
const { data, isLoading, error } = useActionQuery('resource.list', {
  filters: { status: 'active' }
});

// Mutations (Optimistic Updates with Guaranteed Invalidation)
const { mutate } = useActionMutation('resource.create', {
  onSuccess: (data) => {
    toast.success('Created successfully!');
    // Cache invalidation happens automatically!
  }
});

// Auto-Generated UI Components
<AutoTable
  resourceKey="resources"
  features={['search', 'sort', 'pagination']}
  mobileOptimized={true}
/>

<AutoForm
  resourceKey="resources"
  mode="create"
  onSubmit={(data) => mutate(data)}
/>
```

### **Resource Schema Template**

```typescript
const EXAMPLE_SCHEMA: ResourceSchema = {
  // Core Identity
  databaseKey: 'examples',
  modelName: 'Example',
  actionPrefix: 'example',
  
  // Field Definitions
  fields: [
    { key: 'id', type: 'text', required: true },
    { key: 'name', type: 'text', required: true, maxLength: 100 },
    { key: 'status', type: 'select', options: { static: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]}},
    { key: 'createdAt', type: 'date', autoValue: 'now' }
  ],
  
  // Display Configuration
  display: {
    title: 'Examples',
    icon: 'example',
    color: 'blue',
    listView: ['name', 'status', 'createdAt'],
    detailView: ['name', 'status', 'createdAt'],
    searchFields: ['name']
  },
  
  // Action Configuration
  actions: {
    create: { enabled: true },
    update: { enabled: true },
    delete: { enabled: true },
    list: { enabled: true }
  },
  
  // Validation Rules
  validation: [
    { field: 'name', rules: [
      { type: 'required', message: 'Name is required' },
      { type: 'maxLength', value: 100, message: 'Name too long' }
    ]}
  ],
  
  // Relationships
  relationships: {
    // Define belongsTo, hasMany, etc.
  }
};
```

## 🚦 Getting Started Checklist

- [ ] Read **[System Overview](./01-system-overview.md)** to understand the architecture
- [ ] Review **[Resource Schemas](./03-resource-schemas.md)** for schema design
- [ ] Follow **[Creating New Resources](./06-creating-new-resources.md)** to build your first resource
- [ ] Implement using **[Hooks & Data Fetching](./04-hooks-and-data-fetching.md)** patterns
- [ ] Add UI with **[Auto-Generated Components](./05-auto-generated-components.md)**
- [ ] Apply **[Best Practices](./08-best-practices.md)** for maintainable code

## 🔧 Key Files in Codebase

### **Core System**
- `lib/action-client/` - ActionClient implementation (unified architecture)
- `lib/resource-system/schemas.ts` - All resource schemas (SSOT)
- `lib/resource-system/resource-registry.ts` - Schema registration and auto-discovery
- `lib/resource-system/unified-resource-registry.ts` - Unified resource management
- `hooks/use-action-api.ts` - React hooks for data operations (simplified entry point)
- `hooks/query/` - Modular hook system with focused components

### **ActionClient Architecture**
- `lib/action-client/action-client-core.ts` - Core orchestrator (462 lines)
- `lib/action-client/unified-action-client.ts` - Next-gen client wrapper
- `lib/action-client/operations/` - Read/write operation handlers
- `lib/action-client/core/` - Cache, sync, and IndexedDB managers
- `lib/action-client/helpers/` - Junction auto-creator and change tracking
- `lib/action-client/api/` - Server communication layer

### **Auto-Generated Components**
- `components/auto-generated/table/` - AutoTable system
- `components/auto-generated/form/` - AutoForm system with junction support
- `components/auto-generated/modal/` - AutoModal system
- `components/auto-generated/tree/` - AutoTree system

### **Server Integration**
- `app/api/workspaces/current/actions/route.ts` - Single API endpoint (300+ lines)
- `lib/server/action-system/core/action-router-core.ts` - Action routing core
- `lib/server/action-system/handlers/` - CRUD operation handlers
- `lib/server/prisma/prisma-service.ts` - Database operations (700+ lines)
- `lib/server/action-system/utils/` - Action parsing and metadata

### **Specialized Services**
- `lib/server/action-system/services/` - Rollback and changelog services
- `lib/server/prisma/` - Data cleaning, query building, relationship processing
- `lib/resource-system/auto-value-service.ts` - Auto-value generation

## 🎓 Advanced Topics

- **Branch Management**: Git-like workspace versioning with Copy-on-Write
- **Junction Relationships**: Handling many-to-many relationships efficiently
- **Custom Handlers**: Extending the system with business logic
- **Performance Tuning**: Optimizing cache strategies and query patterns
- **Security**: Permission systems and input validation
- **Testing**: Strategies for testing schema-driven applications

## 🆘 Troubleshooting

### Common Issues

**Lists Not Updating After Mutations**
- ✅ **FIXED**: Cache invalidation now uses `refetchQueries` instead of `invalidateQueries`
- ✅ **FIXED**: User `onSuccess` callbacks no longer override system invalidation
- ✅ **FIXED**: All mutations use the SSOT `useActionMutation` system

**Slow Performance**
- Check cache hit rates in DevTools
- Verify IndexedDB is being used (`fromCache: true` in responses)
- Review query patterns for unnecessary refetching

**Type Errors**
- Ensure schemas are properly typed in `schemas.ts`
- Regenerate types if schema changes
- Check action names match schema definitions

**Data Not Updating**
- Verify cache invalidation after mutations (should be automatic now)
- Check branch context is consistent
- Review optimistic update patterns

## 📞 Support

- **Documentation Issues**: Create an issue with specific questions
- **Performance Problems**: Include performance metrics and cache stats
- **Schema Design**: Review [Best Practices](./08-best-practices.md) first
- **Component Issues**: Check [Auto-Generated Components](./05-auto-generated-components.md)

---

**The Action System provides the foundation for building Linear-like applications with enterprise-grade reliability and bulletproof cache invalidation. Start with the System Overview and follow the documentation in order for the best learning experience.**