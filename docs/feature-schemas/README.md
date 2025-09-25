# Complete Resource Development Guide

**Schema-driven development with auto-generated components, IndexedDB caching, and branch-aware operations**

## 🎯 System Overview

The Feature Schema System is the **Single Source of Truth (SSOT)** that powers the entire application. From one schema definition, you get:

- ✅ **Complete CRUD System** - Forms, tables, modals, API endpoints
- ✅ **IndexedDB Caching** - <50ms reads with offline support
- ✅ **Branch-Aware Operations** - Workspace isolation with Copy-on-Write
- ✅ **Mobile-First UI** - Responsive components out of the box
- ✅ **Action System Integration** - Optimistic updates and background sync
- ✅ **Junction Auto-Discovery** - Relationship management without configuration
- ✅ **Background Bootstrap** - Non-blocking initialization of critical resources

### **Current Scale**
- **93 Resource Schemas** across 12+ feature directories
- **400+ Auto-Generated Actions** (create, read, update, delete, list + custom)
- **Background Bootstrap** loading critical resources (branches, nodes) in <3 seconds
- **Junction Auto-Discovery** from relationship definitions
- **Unified Action Client** with branch context and tenant isolation

---

## 📚 Complete Development Guide

### **Phase 1: Understanding the System**

| Guide | Description | Essential For |
|-------|-------------|---------------|
| **[00-system-overview.md](./00-system-overview.md)** | Current architecture and data flow | **Everyone** - Start here |
| **[01-field-configuration.md](./01-field-configuration.md)** | Field types, validation, auto-population | Schema design |
| **[02-registration-integration.md](./02-registration-integration.md)** | Registration process and action system | Adding new resources |
| **[03-auto-generated-integration.md](./03-auto-generated-integration.md)** | Using AutoForm, AutoTable, AutoModal, AutoTree | Building UI |
| **[04-examples-recipes.md](./04-examples-recipes.md)** | Real-world patterns and complete examples | Complex scenarios |

### **Phase 2: Development Workflow**

#### **🚀 Quick Start (15 minutes)**
```bash
# 1. Create schema file
mkdir src/features/products
touch src/features/products/products.schema.ts

# 2. Define schema (copy from examples)
# 3. Register in resource-registry.ts
# 4. Use auto-generated components
```

#### **📋 Complete Development Checklist**
- [ ] Create feature directory and schema file
- [ ] Implement ResourceSchema with all required fields
- [ ] Register schema in `src/lib/resource-system/resource-registry.ts`
- [ ] Add Prisma model (for server persistence)
- [ ] Test with AutoForm, AutoTable, AutoModal components
- [ ] Verify IndexedDB initialization and caching
- [ ] Test branch-aware operations
- [ ] Add junction relationships (if needed)

---

## 🏗️ Current Architecture

### **Data Flow (Actual Implementation)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Schema Definition                                │
│               src/features/*/**.schema.ts                          │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────────────────────┐
│              Resource Registry (SSOT)                              │
│         src/lib/resource-system/resource-registry.ts               │
│    • Auto-discovers 93 schemas                                     │
│    • Generates 400+ action mappings                                │
│    • Creates IndexedDB store configurations                        │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────────────────────┐
│               Background Bootstrap                                  │
│       src/components/providers/background-bootstrap.tsx            │
│    • Loads critical resources (branches, nodes) in background      │
│    • 3-second timeout per resource with fail-open strategy         │
│    • Progressively loads non-critical resources                    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────────────────────┐
│                Action Client System                                 │
│         src/lib/action-client/unified-action-client.ts             │
│    • Branch-aware operations                                       │
│    • IndexedDB-first reads (<50ms)                                 │
│    • Optimistic updates with background sync                       │
│    • Tenant isolation                                              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────────────────────┐
│            Auto-Generated Components                                │
│         src/components/auto-generated/*                            │
│    • AutoForm - Schema-driven forms                                │
│    • AutoTable - Data tables with CRUD                             │
│    • AutoModal - Create/edit dialogs                               │
│    • AutoTree - Hierarchical navigation                            │
└─────────────────────────────────────────────────────────────────────┘
```

### **System Integration Points**

1. **ResourceSchema** → Defines structure, validation, UI config
2. **Resource Registry** → Auto-discovers and maps all resources
3. **Background Bootstrap** → Non-blocking initialization of IndexedDB
4. **Action Client** → Branch-aware CRUD with caching
5. **Auto-Components** → Schema-driven UI components
6. **Junction System** → Auto-discovered from relationship definitions

---

## 🚀 Quick Start Examples

### **Minimal Working Schema**

```typescript
// src/features/products/products.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PRODUCT_SCHEMA: ResourceSchema = {
  // ✅ REQUIRED: Identity (BULLETPROOF 3-FIELD DESIGN)
  databaseKey: 'products',
  modelName: 'Product',
  actionPrefix: 'products',

  // ✅ REQUIRED: IndexedDB key function
  indexedDBKey: (record: any) => record.id,

  // ✅ UI Configuration
  display: {
    title: 'Products',
    description: 'Manage product catalog',
    icon: 'package'
  },

  // ✅ Fields (see field-configuration.md for all options)
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      autoValue: { source: 'auto.uuid', required: true },
      form: { showInForm: false } // Hidden in forms
    },
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      form: { row: 1, width: 'full', order: 1, showInForm: true },
      mobile: { priority: 'high', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'lg' },
      validation: [
        { type: 'required', message: 'Product name is required' },
        { type: 'minLength', value: 3, message: 'Name too short' }
      ]
    },
    // Standard system fields
    {
      key: 'tenantId',
      autoValue: { source: 'session.user.tenantId', required: true },
      form: { showInForm: false }
    },
    {
      key: 'branchId',
      autoValue: { source: 'session.user.branchContext.currentBranchId', required: true },
      form: { showInForm: false }
    }
  ],

  // ✅ Search Configuration
  search: {
    enabled: true,
    fields: ['name', 'description'],
    placeholder: 'Search products...'
  },

  // ✅ Actions
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    read: true
  }
};
```

### **Register the Schema**

```typescript
// src/lib/resource-system/resource-registry.ts

// ✅ ADD IMPORT
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// ✅ ADD TO SCHEMA_RESOURCES ARRAY
const SCHEMA_RESOURCES: ResourceSchema[] = [
  // ... existing schemas
  PRODUCT_SCHEMA, // Add your schema here
];
```

### **Use Auto-Generated Components**

```tsx
// src/app/products/page.tsx
import { AutoTable } from '@/components/auto-generated/table/auto-table';

export default function ProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      {/* ✅ INSTANT CRUD INTERFACE */}
      <AutoTable resourceKey="products" />
    </div>
  );
}
```

**Result**: Complete CRUD interface with create/edit forms, data table, search, mobile responsiveness, offline support, and branch awareness!

---

## 📋 Development Workflow

### **Step 1: Plan Your Resource**
- [ ] Define data structure and relationships
- [ ] Identify required vs optional fields
- [ ] Plan UI layout (form rows, table columns)
- [ ] Consider mobile vs desktop display priorities

### **Step 2: Create Schema**
- [ ] Create feature directory: `src/features/yourFeature/`
- [ ] Create schema file: `yourFeature.schema.ts`
- [ ] Implement ResourceSchema interface
- [ ] Define all fields with proper configuration
- [ ] Add validation rules and auto-values
- [ ] Configure search and actions

### **Step 3: Register Schema**
- [ ] Import schema in `resource-registry.ts`
- [ ] Add to `SCHEMA_RESOURCES` array
- [ ] Verify no TypeScript errors

### **Step 4: Add Prisma Model** (for server persistence)
- [ ] Add model to `prisma/schema.prisma`
- [ ] Include standard fields: `id`, `tenantId`, `branchId`, `createdAt`, `updatedAt`
- [ ] Run `npx prisma generate`

### **Step 5: Test & Validate**
- [ ] Create test page with AutoTable
- [ ] Test create/edit with AutoForm
- [ ] Test mobile responsiveness
- [ ] Verify IndexedDB caching works
- [ ] Test offline functionality
- [ ] Test branch switching

### **Step 6: Add Advanced Features** (optional)
- [ ] Junction relationships
- [ ] Custom actions
- [ ] Complex validation
- [ ] Custom UI components

---

## 🔍 Key System Files

### **Core System**
- `src/lib/resource-system/resource-registry.ts` - Central registration
- `src/lib/resource-system/schemas.ts` - ResourceSchema interface
- `src/components/providers/background-bootstrap.tsx` - Resource loading
- `src/lib/action-client/unified-action-client.ts` - CRUD operations

### **Auto-Generated Components**
- `src/components/auto-generated/form/auto-form.tsx` - Schema-driven forms
- `src/components/auto-generated/table/auto-table.tsx` - Data tables
- `src/components/auto-generated/modal/auto-modal.tsx` - Create/edit modals
- `src/components/auto-generated/tree/auto-tree.tsx` - Hierarchical navigation

### **Server Integration**
- `src/app/api/workspaces/current/actions/route.ts` - Unified API endpoint
- `src/lib/server/action-system/core/action-router-core.ts` - Server routing

---

## 🚨 Critical Success Factors

### **1. Follow the BULLETPROOF 3-FIELD DESIGN**
```typescript
{
  databaseKey: 'products',     // IndexedDB store + API routing
  modelName: 'Product',        // Prisma model name
  actionPrefix: 'products',    // Action naming (products.create, etc.)
}
```

### **2. Include Standard System Fields**
```typescript
fields: [
  { key: 'id', autoValue: { source: 'auto.uuid', required: true } },
  { key: 'tenantId', autoValue: { source: 'session.user.tenantId', required: true } },
  { key: 'branchId', autoValue: { source: 'session.user.branchContext.currentBranchId', required: true } },
  // ... your custom fields
]
```

### **3. Configure Display Options for ALL Fields**
```typescript
{
  key: 'name',
  form: { row: 1, width: 'full', order: 1, showInForm: true },
  mobile: { priority: 'high', showInTable: true },
  desktop: { showInTable: true, tableWidth: 'lg' }
}
```

### **4. Implement Required indexedDBKey Function**
```typescript
// Simple key for most entities
indexedDBKey: (record: any) => record.id,

// Compound key for junction tables
indexedDBKey: (record: any) => `${record.parentId}:${record.childId}`,
```

---

## 🔧 Troubleshooting Guide

### **Common Issues & Solutions**

| Issue | Solution | Reference |
|-------|----------|-----------|
| "Store not found" error | Verify schema is registered in `resource-registry.ts` | [Registration Guide](./02-registration-integration.md#troubleshooting) |
| Form fields not showing | Add `form: { showInForm: true }` configuration | [Field Guide](./01-field-configuration.md#form-configuration) |
| Table columns missing | Add `mobile` and `desktop` display configuration | [Field Guide](./01-field-configuration.md#table-configuration) |
| IndexedDB not loading | Check Background Bootstrap logs in console | [System Overview](./00-system-overview.md#background-bootstrap) |
| Actions not working | Verify `actions` configuration in schema | [Registration Guide](./02-registration-integration.md#action-system-integration) |

### **Debug Tools**

```typescript
// Check registered schemas
import { RESOURCE_REGISTRY } from '@/lib/resource-system/resource-registry';
console.log('Available resources:', RESOURCE_REGISTRY.map(s => s.actionPrefix));

// Check IndexedDB stores
import { getIndexedDBStoreConfigs } from '@/lib/resource-system/resource-registry';
console.log('IndexedDB stores:', getIndexedDBStoreConfigs().map(s => s.name));

// Enable bootstrap debug logging
// Check browser console for "🔍 [BackgroundBootstrap]" logs
```

---

## 🎯 Performance Best Practices

### **Schema Design**
- Use appropriate field priorities (high/medium/low) for mobile
- Implement proper validation to prevent invalid data
- Use computed fields for server-side calculations
- Add search configuration for large datasets

### **IndexedDB Optimization**
- Background Bootstrap loads critical resources automatically
- <50ms read performance with IndexedDB-first strategy
- Automatic caching and cache invalidation
- Offline-first with background sync

### **UI Performance**
- AutoTable supports virtual scrolling for large datasets
- AutoForm uses progressive enhancement
- Components are memoized by default
- Lazy loading for heavy operations

---

## 📚 Next Steps

1. **Start Here**: [System Overview](./00-system-overview.md) - Understand the architecture
2. **Define Fields**: [Field Configuration](./01-field-configuration.md) - Learn all field options
3. **Register Schema**: [Registration Guide](./02-registration-integration.md) - Complete registration process
4. **Build UI**: [Component Integration](./03-auto-generated-integration.md) - Use auto-generated components
5. **Advanced Patterns**: [Examples & Recipes](./04-examples-recipes.md) - Real-world examples

---

## 💡 Pro Tips

- **Always test mobile-first** - Use responsive design tools
- **Use debug mode** - Enable console logging during development
- **Follow naming conventions** - Consistent naming prevents errors
- **Start simple** - Add complexity gradually
- **Reference existing schemas** - Learn from `src/features/*/**.schema.ts` files
- **Test offline** - Disable network to verify caching
- **Monitor Background Bootstrap** - Watch console for loading progress

**Ready to build? Start with [System Overview](./00-system-overview.md)** 🚀