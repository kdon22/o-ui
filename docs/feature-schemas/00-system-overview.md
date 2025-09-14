# Feature Schema System - Complete Developer Guide

**Schema-driven development with auto-generated components, forms, tables, and complete CRUD operations**

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture) 
3. [Schema Lifecycle](#schema-lifecycle)
4. [File Structure](#file-structure)
5. [Quick Start](#quick-start)
6. [Related Documentation](#related-documentation)

---

## System Overview

The Feature Schema System is the **Single Source of Truth (SSOT)** for all data structures, UI components, and business logic in the application. It provides:

### **🎯 Core Benefits**

- **Zero-Code Development**: Define a schema → Get complete CRUD system
- **Type Safety**: Full TypeScript support with auto-generated types
- **Mobile-First**: Responsive forms, tables, and modals out of the box
- **Offline-First**: IndexedDB caching with <50ms read performance
- **Branch-Aware**: Complete workspace branching with Copy-on-Write
- **Action System**: Optimistic updates with background sync
- **DRY Principle**: One schema generates forms, tables, modals, and APIs

### **🔧 What Gets Auto-Generated**

From a single `ResourceSchema`, the system automatically creates:

```typescript
// Single schema definition
export const RULE_SCHEMA: ResourceSchema = {
  databaseKey: 'rule',
  modelName: 'Rule', 
  actionPrefix: 'rule',
  // ... field definitions
};
```

**Auto-generates:**
- ✅ **IndexedDB Store**: Optimized with compound keys and indexes
- ✅ **API Endpoints**: RESTful endpoints with validation
- ✅ **React Components**: AutoForm, AutoTable, AutoModal
- ✅ **TypeScript Types**: Complete type definitions
- ✅ **Action System**: CRUD operations with optimistic updates
- ✅ **Validation**: Zod schemas with custom rules
- ✅ **Navigation**: Tree structures and breadcrumbs
- ✅ **Search**: Full-text search with filtering

---

## Core Architecture

### **1. Schema-First Development**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Schema File   │───▶│  Resource        │───▶│  Auto-Generated │
│  rules.schema   │    │  Registry        │    │  Components     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  TypeScript     │    │  Action System   │    │  UI Components  │
│  Types          │    │  Integration     │    │  (Forms/Tables) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **2. BULLETPROOF 3-FIELD DESIGN**

Every schema follows this pattern:

```typescript
export const YOUR_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'yourEntity',     // IndexedDB store + API endpoints
  modelName: 'YourEntity',       // Prisma model access
  actionPrefix: 'yourEntity',    // Action naming (yourEntity.create, etc.)
  
  // ... rest of configuration
};
```

### **3. Auto-Discovery System**

The system uses **auto-discovery** to find and register schemas:

```typescript
// src/lib/resource-system/resource-registry.ts
const SCHEMA_RESOURCES: ResourceSchema[] = [
  BRANCH_SCHEMA,     // Auto-discovered from @/features/branches/branches.schema
  NODE_SCHEMA,       // Auto-discovered from @/features/nodes/nodes.schema  
  RULE_SCHEMA,       // Auto-discovered from @/features/rules/rules.schema
  // ... all other schemas
];
```

---

## Schema Lifecycle

### **Phase 1: Schema Definition**
```typescript
// src/features/yourFeature/yourFeature.schema.ts
export const YOUR_SCHEMA: ResourceSchema = {
  databaseKey: 'yourEntity',
  // ... complete configuration
};
```

### **Phase 2: Registration**
```typescript
// src/lib/resource-system/resource-registry.ts
import { YOUR_SCHEMA } from '@/features/yourFeature/yourFeature.schema';

const SCHEMA_RESOURCES: ResourceSchema[] = [
  // ... existing schemas
  YOUR_SCHEMA,  // Add your schema here
];
```

### **Phase 3: Auto-Generation**
- **IndexedDB Store**: Created automatically during app initialization
- **API Routes**: Generated server-side action handlers
- **React Components**: Available via `useResourceCreate`, `useResourceList`, etc.
- **Types**: Auto-generated TypeScript interfaces

### **Phase 4: Usage**
```tsx
// Instant CRUD operations
const { data: rules } = useResourceList('rule');
const createRule = useResourceCreate('rule');
const updateRule = useResourceUpdate('rule');

// Auto-generated components
<AutoForm schema={RULE_SCHEMA} mode="create" />
<AutoTable schema={RULE_SCHEMA} />
<AutoModal schema={RULE_SCHEMA} />
```

---

## File Structure

### **Required Files**

```
src/features/yourFeature/
├── yourFeature.schema.ts     # ✅ REQUIRED - Main schema definition
├── types.ts                  # ✅ REQUIRED - TypeScript type exports
└── index.ts                  # ✅ REQUIRED - Public exports
```

### **Optional Files**

```
src/features/yourFeature/
├── components/               # Custom components
│   ├── your-modal.tsx       
│   └── your-display.tsx     
├── hooks/                   # Custom hooks
│   └── use-your-actions.ts  
├── services/                # Business logic
│   └── your-service.ts      
└── constants.ts             # Feature constants
```

### **Schema File Template**

```typescript
/**
 * YourFeature Schema - [Brief Description]
 * 
 * Single Source of Truth for:
 * - [List key responsibilities]
 * - [Auto-generated components]
 * - [Business logic]
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const YOUR_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'yourEntity',       // IndexedDB store + API endpoints
  modelName: 'YourEntity',         // Prisma model access  
  actionPrefix: 'yourEntity',      // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Your Features',
    description: 'Manage your features and configurations',
    icon: 'settings',              // Lucide icon name
    color: 'blue'                  // UI color theme
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'md',                   // sm, md, lg, xl
    layout: 'compact',             // compact, spacious
    showDescriptions: true
  },

  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    // See field-configuration.md for complete field options
  ],

  // ============================================================================
  // ADDITIONAL CONFIGURATION
  // ============================================================================
  search: { /* search config */ },
  actions: { /* actions config */ },
  mobile: { /* mobile config */ },
  desktop: { /* desktop config */ },
  
  // ✅ REQUIRED: IndexedDB key function
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type YourEntity = {
  id: string;
  // ... other fields
};

export type CreateYourEntity = Omit<YourEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateYourEntity = Partial<Omit<YourEntity, 'id' | 'createdAt'>>;
```

---

## Quick Start

### **Step 1: Create Schema File**

```bash
# Create feature directory
mkdir src/features/products
cd src/features/products
```

```typescript
// src/features/products/products.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PRODUCT_SCHEMA: ResourceSchema = {
  databaseKey: 'products',
  modelName: 'Product', 
  actionPrefix: 'products',
  
  display: {
    title: 'Products',
    description: 'Manage product catalog',
    icon: 'package',
    color: 'green'
  },
  
  form: {
    width: 'lg',
    layout: 'compact',
    showDescriptions: true
  },
  
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: { source: 'auto.uuid', required: true }
    },
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name...',
      form: { row: 1, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Product name is required' },
        { type: 'maxLength', value: 100, message: 'Name too long' }
      ]
    },
    // ... more fields
  ],
  
  search: {
    enabled: true,
    fields: ['name', 'description'],
    placeholder: 'Search products...'
  },
  
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    read: true
  },
  
  mobile: { showInList: true, priority: 'high' },
  desktop: { showInTable: true },
  
  indexedDBKey: (record: any) => record.id
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};
```

### **Step 2: Register Schema**

```typescript
// src/lib/resource-system/resource-registry.ts
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

const SCHEMA_RESOURCES: ResourceSchema[] = [
  // ... existing schemas
  PRODUCT_SCHEMA,  // Add your schema
];
```

### **Step 3: Use Auto-Generated Components**

```tsx
// src/app/products/page.tsx
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

export default function ProductsPage() {
  return (
    <div className="p-6">
      <h1>Products</h1>
      <AutoTable schema={PRODUCT_SCHEMA} />
    </div>
  );
}
```

**Result**: Complete CRUD interface with:
- ✅ Product listing table
- ✅ Create product form
- ✅ Edit product inline
- ✅ Delete with confirmation
- ✅ Search and filtering
- ✅ Mobile-responsive design
- ✅ Optimistic updates
- ✅ Offline support

---

## Related Documentation

### **Core Guides**
- [Field Configuration Guide](./01-field-configuration.md) - Complete field options and validation
- [Registration & Integration](./02-registration-integration.md) - How to register and integrate schemas
- [Auto-Generated Components](./03-auto-generated-integration.md) - Using AutoForm, AutoTable, AutoModal
- [Advanced Patterns](./04-advanced-patterns.md) - Relationships, junctions, and complex scenarios
- [Examples & Recipes](./05-examples-recipes.md) - Real-world examples and code patterns

### **Component Documentation**
- [AutoForm Documentation](../auto-generated/auto-form.md) - Complete form system
- [AutoTable Documentation](../auto-generated/auto-table.md) - Complete table system  
- [Action System Guide](../action-system/) - Backend integration and API

### **Architecture Guides**
- [Resource System Architecture](../architecture/) - System design and patterns
- [Data Flow Guide](../action-system/04-data-flow.md) - How data flows through the system

---

## Key Principles

### **1. Schema-First Development**
Always start with the schema. Everything else is auto-generated from it.

### **2. DRY (Don't Repeat Yourself)**
One schema definition creates forms, tables, APIs, and types.

### **3. Mobile-First Design**
All auto-generated components are responsive and touch-optimized.

### **4. Offline-First Performance**
IndexedDB provides <50ms reads with background sync.

### **5. Branch-Aware Operations**
Complete workspace isolation with Copy-on-Write support.

### **6. Type Safety**
Full TypeScript support with generated types and validation.

---

**Next**: Read [Field Configuration Guide](./01-field-configuration.md) to learn about all available field types and options.
