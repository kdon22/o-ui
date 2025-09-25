# Registration & Integration Guide - Current Implementation

**Complete guide for registering schemas and integrating with the action system, IndexedDB, and auto-generated components based on the actual current system**

## Table of Contents

1. [Registration Overview](#registration-overview)
2. [Step-by-Step Registration Process](#step-by-step-registration-process)
3. [Resource Registry Integration](#resource-registry-integration)
4. [Action System Integration](#action-system-integration)
5. [Background Bootstrap Integration](#background-bootstrap-integration)
6. [IndexedDB Integration](#indexeddb-integration)
7. [Junction Table Registration](#junction-table-registration)
8. [Cache Invalidation Strategy](#cache-invalidation-strategy)
9. [Server Integration](#server-integration)
10. [Testing & Validation](#testing--validation)
11. [Troubleshooting](#troubleshooting)

---

## Registration Overview

### **Current Architecture (Actual Implementation)**

The system uses a **centralized auto-discovery approach** where schemas are:

1. **Imported** in `src/lib/resource-system/resource-registry.ts`
2. **Added** to the `SCHEMA_RESOURCES` array
3. **Auto-processed** to generate action mappings, IndexedDB stores, and API routes
4. **Loaded** by Background Bootstrap for offline-first performance

### **93 Schemas Currently Registered**

The system currently supports:
- **Core entities**: nodes, processes, rules, offices, workflows
- **System entities**: branches, sessions, users, credentials
- **Tag system**: tag groups, tags, classes
- **Table management**: data tables, table categories, table data
- **Pull request system**: PRs, reviews, comments, settings
- **Marketplace system**: packages, installations, subscriptions
- **Queue system**: configs, messages, workers

---

## Step-by-Step Registration Process

### **Step 1: Create Feature Directory Structure**

```bash
# Create feature directory
mkdir src/features/products
cd src/features/products

# Create required files
touch products.schema.ts    # Main schema definition
touch types.ts             # TypeScript type exports
touch index.ts             # Public exports
```

### **Step 2: Implement ResourceSchema**

Create your schema file with the BULLETPROOF 3-FIELD DESIGN:

```typescript
// src/features/products/products.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PRODUCT_SCHEMA: ResourceSchema = {
  // ✅ REQUIRED: BULLETPROOF 3-FIELD DESIGN
  databaseKey: 'products',      // IndexedDB store + API endpoints
  modelName: 'Product',         // Prisma model access
  actionPrefix: 'products',     // Action naming (products.create, etc.)

  // ✅ REQUIRED: Context configuration
  // Leave defaults for standard entities with tenant/branch/audit
  notHasTenantContext: false,   // Enable tenant filtering
  notHasBranchContext: false,   // Enable branch filtering
  notHasAuditFields: false,     // Enable audit fields

  // ✅ Performance configuration (optional)
  serverOnly: false,            // Use IndexedDB caching
  cacheStrategy: 'indexeddb',   // Cache strategy

  // ✅ UI Display Configuration
  display: {
    title: 'Products',
    description: 'Manage product catalog',
    icon: 'package',
    color: 'blue'
  },

  // ✅ REQUIRED: Field Definitions
  fields: [
    // System fields (required for all schemas)
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      autoValue: { source: 'auto.uuid', required: true },
      stripOn: { create: true, update: false },
      form: { showInForm: false },
      computed: true
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      autoValue: { source: 'session.user.tenantId', required: true },
      form: { showInForm: false },
      computed: true
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      autoValue: { 
        source: 'session.user.branchContext.currentBranchId',
        fallback: 'main',
        required: true 
      },
      form: { showInForm: false },
      computed: true
    },

    // Custom business fields
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name...',
      form: {
        row: 1,
        width: 'full',
        order: 1,
        showInForm: true
      },
      mobile: {
        priority: 'high',
        showInTable: true
      },
      desktop: {
        showInTable: true,
        tableWidth: 'lg'
      },
      validation: [
        { type: 'required', message: 'Product name is required' },
        { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' }
      ]
    },

    {
      key: 'price',
      label: 'Price',
      type: 'currency',
      required: true,
      form: {
        row: 2,
        width: 'half',
        order: 1,
        showInForm: true
      },
      validation: [
        { type: 'required', message: 'Price is required' },
        { type: 'min', value: 0, message: 'Price must be positive' }
      ]
    },

    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      options: {
        dynamic: {
          resource: 'categories',
          valueField: 'id',
          labelField: 'name'
        }
      },
      form: {
        row: 2,
        width: 'half',
        order: 2,
        showInForm: true
      }
    },

    // Standard audit fields
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'datetime',
      computed: true,
      form: { showInForm: false },
      mobile: { showInTable: false },
      desktop: { showInTable: true, tableWidth: 'sm' }
    },

    {
      key: 'updatedAt',
      label: 'Updated At',
      type: 'datetime',
      computed: true,
      form: { showInForm: false },
      mobile: { showInTable: false },
      desktop: { showInTable: true, tableWidth: 'sm' }
    }
  ],

  // ✅ Search Configuration
  search: {
    enabled: true,
    fields: ['name', 'description'],
    placeholder: 'Search products...'
  },

  // ✅ Actions Configuration
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    read: true,
    optimistic: true  // Enable optimistic updates
  },

  // ✅ Mobile Configuration
  mobile: {
    cardFormat: 'compact',
    primaryField: 'name',
    secondaryFields: ['price', 'category'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },

  // ✅ Desktop Configuration
  desktop: {
    sortField: 'name',
    sortOrder: 'asc',
    editableField: 'name',
    rowActions: true,
    bulkActions: true,
    density: 'compact'
  },

  // ✅ REQUIRED: IndexedDB Key Configuration
  indexedDBKey: (record: any) => record.id
};
```

### **Step 3: Export TypeScript Types**

```typescript
// src/features/products/types.ts
export interface Product {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
}

export type CreateProduct = Omit<Product, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt' | 'createdById' | 'updatedById'>;

export type UpdateProduct = Partial<Omit<Product, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'createdById'>>;
```

### **Step 4: Create Index File**

```typescript
// src/features/products/index.ts
export { PRODUCT_SCHEMA } from './products.schema';
export type { Product, CreateProduct, UpdateProduct } from './types';
```

---

## Resource Registry Integration

### **Step 5: Register in Resource Registry**

Add your schema to the central registry:

```typescript
// src/lib/resource-system/resource-registry.ts

// ✅ ADD IMPORT (alphabetical order)
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// ✅ ADD TO SCHEMA_RESOURCES ARRAY
const SCHEMA_RESOURCES: ResourceSchema[] = [
  // Core Entities
  BRANCH_SCHEMA,
  SESSION_SCHEMA,
  NODE_SCHEMA,
  OFFICE_SCHEMA,
  PROCESS_SCHEMA,
  
  // ✅ ADD YOUR SCHEMA HERE (alphabetical order)
  PRODUCT_SCHEMA,
  
  RULE_SCHEMA,
  WORKFLOW_SCHEMA,
  
  // ... other schemas
];
```

### **What Happens After Registration**

Once registered, the system automatically generates:

#### **1. Action Mappings**
```typescript
// Auto-generated action mappings
const actionMappings = {
  'products.create': {
    store: 'products',
    method: 'POST',
    endpoint: '/api/workspaces/current/actions',
    requiresAuth: true,
    cached: false,
    optimistic: true,
    schema: PRODUCT_SCHEMA,
    resource: 'products'
  },
  'products.list': {
    store: 'products',
    method: 'GET',
    endpoint: '/api/workspaces/current/actions',
    requiresAuth: true,
    cached: true,
    optimistic: false,
    schema: PRODUCT_SCHEMA,
    resource: 'products'
  },
  'products.read': { /* ... */ },
  'products.update': { /* ... */ },
  'products.delete': { /* ... */ }
};
```

#### **2. IndexedDB Store Configuration**
```typescript
// Auto-generated IndexedDB store
const storeConfig = {
  name: 'products',
  keyPath: undefined,  // Uses compound keys
  autoIncrement: false,
  indexes: [
    { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
    { name: 'idx_branchId', keyPath: 'branchId', unique: false },
    { name: 'idx_createdAt', keyPath: 'createdAt', unique: false },
    { name: 'idx_updatedAt', keyPath: 'updatedAt', unique: false }
  ]
};
```

#### **3. React Hooks**
```typescript
// Automatically available hooks
const { data: products } = useResourceList('products');
const { data: product } = useResourceItem('products', 'product-123');
const createProduct = useResourceCreate('products');
const updateProduct = useResourceUpdate('products');
const deleteProduct = useResourceDelete('products');
```

---

## Action System Integration

### **How Actions Work (Current Implementation)**

#### **1. Action Naming Convention**
```typescript
// Format: {actionPrefix}.{operation}
'products.create'   // Create product
'products.read'     // Read single product  
'products.update'   // Update product
'products.delete'   // Delete product
'products.list'     // List products
```

#### **2. Unified API Endpoint**
All actions go through a single endpoint:
```typescript
POST /api/workspaces/current/actions

// Request format
{
  action: 'products.create',
  data: { name: 'New Product', price: 99.99 },
  options: { branchId: 'development', tenantId: 'tenant-123' }
}
```

#### **3. Action Client Integration**
```typescript
// Using the action client directly
import { getActionClient } from '@/lib/action-client';

const actionClient = getActionClient(tenantId, branchContext);

const result = await actionClient.executeAction({
  action: 'products.create',
  data: { name: 'New Product', price: 99.99 },
  branchContext: {
    currentBranchId: 'development',
    defaultBranchId: 'main',
    tenantId: 'tenant-123',
    userId: 'user-456'
  }
});
```

#### **4. React Hooks Integration**
```typescript
// Using React hooks (recommended)
import { useResourceCreate, useResourceList } from '@/hooks/query/resource-hooks';

function ProductManager() {
  const { data: products } = useResourceList('products');
  const createProduct = useResourceCreate('products');
  
  const handleCreate = async () => {
    await createProduct.mutateAsync({
      name: 'New Product',
      price: 99.99,
      categoryId: 'category-123'
    });
  };
  
  return (
    <div>
      {/* Products automatically loaded with caching */}
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      <button onClick={handleCreate}>Create Product</button>
    </div>
  );
}
```

---

## Background Bootstrap Integration

### **How Background Bootstrap Works**

The Background Bootstrap component automatically loads your registered resources:

#### **Critical Resources** (Loaded First)
```typescript
// From src/components/providers/background-bootstrap.tsx
const criticalResources = [
  { type: 'branches', limit: 10 },
  { type: 'nodes', limit: 50 }
];
```

#### **Non-Critical Resources** (Background Loading)
```typescript
const nonCriticalResources = [
  'rules', 'processes', 'workflows', 'offices', 
  'user', 'credential', 'communication',
  'products'  // Your new resource will be added here automatically
];
```

### **Adding to Critical Resources**

If your resource is essential for navigation, add it to critical resources:

```typescript
// src/components/providers/background-bootstrap.tsx

// Add to critical resources if needed for navigation
const criticalResources = [
  { type: 'branches', limit: 10 },
  { type: 'nodes', limit: 50 },
  { type: 'products', limit: 100 }  // Add if critical
];
```

### **Background Loading Process**

```typescript
// 1. Critical resources loaded with 3-second timeout each
// 2. UI renders immediately (never blocked)
// 3. Non-critical resources loaded in background with 5-second timeout each
// 4. Resources cached in IndexedDB for offline access
// 5. Progressive enhancement as resources become available
```

---

## IndexedDB Integration

### **Automatic Store Creation**

Your registered schema automatically gets an IndexedDB store:

#### **Store Configuration**
```typescript
// Auto-generated for PRODUCT_SCHEMA
{
  name: 'products',              // From databaseKey
  keyPath: undefined,            // Uses compound keys via indexedDBKey
  autoIncrement: false,
  indexes: [
    { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
    { name: 'idx_branchId', keyPath: 'branchId', unique: false },
    { name: 'idx_createdAt', keyPath: 'createdAt', unique: false },
    { name: 'idx_updatedAt', keyPath: 'updatedAt', unique: false },
    // Additional indexes based on field configuration
    { name: 'idx_name', keyPath: 'name', unique: false },
    { name: 'idx_categoryId', keyPath: 'categoryId', unique: false }
  ]
}
```

#### **Key Generation**
```typescript
// Simple entity key (most common)
indexedDBKey: (record: any) => record.id

// Compound key for junctions
indexedDBKey: (record: any) => `${record.productId}:${record.categoryId}`

// Branch-aware key (if needed)
indexedDBKey: (record: any) => `${record.id}:${record.branchId}`
```

### **Performance Characteristics**

- **<50ms reads** from IndexedDB cache
- **Automatic indexing** on tenant, branch, timestamps
- **Batch operations** for large datasets
- **Branch-aware queries** with automatic fallback

### **Cache-First Strategy**

```typescript
// Read hierarchy (fastest to slowest)
1. IndexedDB (local cache)     // <50ms
2. Server API (if cache miss)  // 100-500ms
3. Offline fallback           // Show cached + offline indicator

// Write strategy
1. Optimistic IndexedDB update  // Instant UI feedback
2. Queue server operation      // Background sync
3. Update with server response // Reconcile differences
4. Rollback on error          // Automatic error recovery
```

---

## Junction Table Registration

### **Two Approaches for Junction Tables**

#### **Method 1: Embedded Relationships (Recommended)**

Define relationships in your main entity schema:

```typescript
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ... main configuration

  relationships: {
    tags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this product',
      junction: {
        tableName: 'productTags',  // ✅ Auto-discovered as junction
        field: 'productId',
        relatedField: 'tagId'
      }
    },
    category: {
      type: 'many-to-one',
      relatedEntity: 'categories',
      foreignKey: 'categoryId',
      description: 'Product category'
    }
  }
};
```

#### **Method 2: Standalone Junction Schema**

For complex junctions with additional fields:

```typescript
// src/features/products/products.schema.ts

export const PRODUCT_TAG_SCHEMA = {
  databaseKey: 'productTags',
  modelName: 'ProductTag',
  actionPrefix: 'productTags',
  
  fields: [
    { key: 'id', autoValue: { source: 'auto.uuid', required: true } },
    { key: 'productId', required: true },
    { key: 'tagId', required: true },
    { key: 'order', type: 'number', defaultValue: 0 },
    { key: 'isActive', type: 'switch', defaultValue: true }
  ],
  
  indexedDBKey: (record) => `${record.productId}:${record.tagId}`,
  
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      productId: 'string',
      tagId: 'string'
    },
    defaults: {
      order: 0,
      isActive: true
    }
  }
};

// Register separately in resource-registry.ts
const STANDALONE_JUNCTION_SCHEMAS = [
  PROCESS_RULE_SCHEMA,
  RULE_IGNORE_SCHEMA,
  NODE_PROCESS_SCHEMA,
  PRODUCT_TAG_SCHEMA  // Add your junction schema
];
```

### **Junction Auto-Creation**

Junctions are automatically created when entities are created with navigation context:

```typescript
// User creates product from category page
<AutoForm 
  schema={PRODUCT_SCHEMA}
  mode="create"
  navigationContext={{ categoryId: 'category-123' }}  // Context from page
/>

// System automatically:
// 1. Creates product
// 2. Detects categoryId in navigation context
// 3. Creates productCategories junction (if configured)
// 4. Links product to category
```

---

## Cache Invalidation Strategy

### **Resource Family Approach**

The system uses the industry-standard **Resource Family** cache invalidation strategy:

#### **Add Your Resource to Cache Families**

```typescript
// src/hooks/query/cache-invalidation.ts

const RESOURCE_FAMILIES: Record<string, string[]> = {
  // Existing families
  rule: ['rule', 'process', 'processRules', 'ruleIgnores', 'node'],
  process: ['process', 'rule', 'processRules', 'nodeProcesses', 'node'],
  
  // ✅ ADD YOUR RESOURCE FAMILY
  // Simple entity (no complex relationships)
  product: ['product'],
  
  // Complex entity (with relationships)
  product: ['product', 'category', 'productTags', 'productCategories', 'tag'],
  
  // Junction table (always invalidate parents)
  productTags: ['product', 'tag', 'productTags'],
  productCategories: ['product', 'category', 'productCategories']
};
```

#### **How Cache Invalidation Works**

```typescript
// When any product changes, entire product family gets invalidated
// This ensures 100% reliability - no missed cache updates

// Example: Product updated
await updateProduct.mutateAsync({ id: 'prod-123', name: 'New Name' });

// System automatically invalidates:
// - All product queries
// - All category queries (if in family)
// - All junction table queries (if in family)
// - Related tag queries (if in family)
```

#### **Why This Approach**

- ✅ **100% Reliable** - Never misses cache invalidations
- ✅ **Battle-tested** - Used by Stripe, Shopify, Linear
- ✅ **Simple** - Easy to understand and maintain
- ✅ **Fast** - TanStack Query handles debouncing efficiently

---

## Server Integration

### **Prisma Model Integration**

Add your Prisma model to support server-side persistence:

```typescript
// prisma/schema.prisma

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  categoryId  String?
  
  // Standard branching fields
  tenantId    String
  branchId    String
  originalProductId String?  // Link to original if branched
  
  // Standard audit fields
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  updatedBy   String
  version     Int      @default(1)
  
  // Relationships
  category    Category? @relation(fields: [categoryId], references: [id])
  tags        ProductTag[]
  
  @@map("products")  // Table name matches databaseKey
  @@index([tenantId])
  @@index([branchId])
  @@index([originalProductId])
  @@index([name])
}
```

### **Run Database Migration**

```bash
# Generate Prisma client
npx prisma generate

# Create migration (if adding new model)
npx prisma migrate dev --name add-products

# Apply migration to production
npx prisma migrate deploy
```

### **Server Action Router Integration**

The server automatically handles your schema through the unified action router:

```typescript
// src/lib/server/action-system/core/action-router-core.ts

// 1. Parse action: 'products.create' → { resourceType: 'products', operation: 'create' }
const parsedAction = parseAction('products.create');

// 2. Get schema from registry
const schema = getResourceSchema('products');  // Returns PRODUCT_SCHEMA

// 3. Route to handler
const handler = handlerFactory.getHandler('create', 'products');

// 4. Execute with Prisma
const result = await handler.execute(data, context);
```

---

## Testing & Validation

### **Step 6: Create Test Page**

Create a test page to validate your schema registration:

```typescript
// src/app/products/test/page.tsx
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

export default function ProductsTestPage() {
  const handleSubmit = async (data: any) => {
    console.log('Product created:', data);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Products Test</h1>
      
      {/* Test AutoTable */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Products Table</h2>
        <AutoTable resourceKey="products" />
      </section>
      
      {/* Test AutoForm */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Create Product Form</h2>
        <AutoForm
          schema={PRODUCT_SCHEMA}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => console.log('Cancelled')}
        />
      </section>
    </div>
  );
}
```

### **Validation Checklist**

- [ ] **Schema Registration**: Product shows up in resource registry
- [ ] **IndexedDB Store**: Product store created in browser dev tools
- [ ] **Background Bootstrap**: Products loaded on app initialization
- [ ] **AutoTable**: Shows products in table with proper columns
- [ ] **AutoForm**: Creates products with validation
- [ ] **Action Hooks**: `useResourceList('products')` works
- [ ] **Cache Invalidation**: Updates refresh table automatically
- [ ] **Mobile Responsive**: Works on mobile devices
- [ ] **Offline Support**: Works without network connection
- [ ] **Branch Awareness**: Works when switching branches

### **Debug Tools**

#### **Check Schema Registration**
```typescript
// Browser console
import { RESOURCE_REGISTRY } from '@/lib/resource-system/resource-registry';
console.log('Available resources:', RESOURCE_REGISTRY.map(s => s.actionPrefix));
console.log('Product schema:', RESOURCE_REGISTRY.find(s => s.actionPrefix === 'products'));
```

#### **Check Action Mappings**
```typescript
// Browser console  
import { getActionMappings } from '@/lib/resource-system/resource-registry';
const actions = getActionMappings();
console.log('Product actions:', Object.keys(actions).filter(key => key.startsWith('products.')));
```

#### **Check IndexedDB**
```typescript
// Browser dev tools → Application → IndexedDB
// Look for 'ActionClientDB' database
// Should contain 'products' store
```

#### **Check Background Bootstrap**
```typescript
// Browser console - look for bootstrap logs
// "✅ [BackgroundBootstrap] Starting bootstrap"
// "✅ [Bootstrap] products loaded"
```

---

## Troubleshooting

### **Common Registration Issues**

#### **Issue: "Store not found" Error**

```typescript
// ❌ Problem: Schema not registered
Error: Store products not found

// ✅ Solution: Check registration steps
// 1. Schema imported in resource-registry.ts?
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// 2. Schema added to SCHEMA_RESOURCES array?
const SCHEMA_RESOURCES: ResourceSchema[] = [
  PRODUCT_SCHEMA,  // ✅ Must be here
];

// 3. indexedDBKey function defined?
indexedDBKey: (record: any) => record.id  // ✅ Required
```

#### **Issue: Actions Not Working**

```typescript
// ❌ Problem: Actions not enabled
Error: Action products.create not found

// ✅ Solution: Check actions configuration
actions: {
  create: true,  // ✅ Must be enabled
  update: true,
  delete: true,
  list: true,
  read: true
}
```

#### **Issue: Form Fields Not Showing**

```typescript
// ❌ Problem: Form configuration missing
// Field shows in schema but not in AutoForm

// ✅ Solution: Add form configuration
{
  key: 'name',
  form: {
    row: 1,
    width: 'full',
    order: 1,
    showInForm: true  // ✅ Required to show in form
  }
}
```

#### **Issue: Table Columns Missing**

```typescript
// ❌ Problem: Display configuration missing  
// Field shows in schema but not in AutoTable

// ✅ Solution: Add mobile/desktop configuration
{
  key: 'name',
  mobile: {
    priority: 'high',
    showInTable: true  // ✅ Required for mobile
  },
  desktop: {
    showInTable: true  // ✅ Required for desktop
  }
}
```

#### **Issue: Background Bootstrap Not Loading**

```bash
# Check browser console for bootstrap logs
# Should see: "✅ [BackgroundBootstrap] Starting bootstrap"

# If not loading, check:
# 1. Is user authenticated?
# 2. Is tenantId available in session?
# 3. Are you on an auth page (bootstrap skipped)?
# 4. Check for JavaScript errors blocking bootstrap
```

#### **Issue: Cache Not Invalidating**

```typescript
// ❌ Problem: Resource not in cache family
// Updates don't refresh other queries

// ✅ Solution: Add to cache invalidation families
// src/hooks/query/cache-invalidation.ts
const RESOURCE_FAMILIES: Record<string, string[]> = {
  product: ['product', 'category'],  // ✅ Add your resource
};
```

### **Debug Components**

Use these temporary components to debug registration issues:

```typescript
// Temporary debug component
function RegistrationDebug() {
  const stores = getIndexedDBStoreConfigs();
  const productStore = stores.find(s => s.name === 'products');
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Registration Debug</h3>
      <p>Product store found: {productStore ? '✅ Yes' : '❌ No'}</p>
      <p>Total stores: {stores.length}</p>
      <details>
        <summary>All registered stores</summary>
        <ul className="list-disc ml-4">
          {stores.map(store => (
            <li key={store.name}>{store.name}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
```

### **Performance Debugging**

```typescript
// Check background bootstrap performance
// Browser dev tools → Network → Disable cache
// Look for /api/workspaces/current/actions requests
// Should be <500ms per resource

// Check IndexedDB performance  
// Browser dev tools → Console
// Look for "[ActionClient] IndexedDB read" logs
// Should be <50ms per query
```

---

## Complete Registration Checklist

### **Pre-Registration**
- [ ] Feature directory created (`src/features/yourFeature/`)
- [ ] Schema file created with ResourceSchema interface
- [ ] BULLETPROOF 3-FIELD DESIGN implemented
- [ ] System fields included (id, tenantId, branchId, audit fields)
- [ ] All business fields have form/table configuration
- [ ] Validation rules defined where needed
- [ ] indexedDBKey function implemented
- [ ] TypeScript types exported

### **Registration**
- [ ] Schema imported in `resource-registry.ts`
- [ ] Schema added to `SCHEMA_RESOURCES` array  
- [ ] Junction relationships defined (if applicable)
- [ ] Cache invalidation family configured
- [ ] Index file created for clean exports

### **Server Integration**
- [ ] Prisma model created with branching fields
- [ ] Database migration created and applied
- [ ] `npx prisma generate` executed

### **Testing**
- [ ] Test page created with AutoTable and AutoForm
- [ ] Schema registration verified (debug tools)
- [ ] IndexedDB store created successfully
- [ ] Background Bootstrap loads resource
- [ ] Action hooks work (`useResourceList`, `useResourceCreate`)
- [ ] CRUD operations work end-to-end
- [ ] Mobile responsiveness verified
- [ ] Offline functionality tested
- [ ] Branch switching tested (if applicable)
- [ ] Junction relationships tested (if applicable)

### **Production Readiness**
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Form validation working
- [ ] Performance optimized
- [ ] Security considerations reviewed
- [ ] Documentation updated

---

**Next**: Learn about [Auto-Generated Components](./03-auto-generated-integration.md) to use AutoForm, AutoTable, AutoModal, and AutoTree with your registered schemas.