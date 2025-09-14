# Schema Registration & Integration Guide

**Complete guide for registering schemas and integrating with the action system, IndexedDB, and auto-generated components**

## Table of Contents

1. [Registration Process](#registration-process)
2. [Auto-Discovery System](#auto-discovery-system)
3. [Action System Integration](#action-system-integration)
4. [IndexedDB Integration](#indexeddb-integration)
5. [Server-Side Integration](#server-side-integration)
6. [Junction Table Registration](#junction-table-registration)
7. [Cache Invalidation Strategy](#cache-invalidation-strategy)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Registration Process

### **Step-by-Step Registration**

#### **Step 1: Create Schema File**

Create your schema file in the appropriate feature directory:

```typescript
// src/features/products/products.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PRODUCT_SCHEMA: ResourceSchema = {
  // ✅ REQUIRED: BULLETPROOF 3-FIELD DESIGN
  databaseKey: 'products',     // IndexedDB store + API endpoints
  modelName: 'Product',        // Prisma model access
  actionPrefix: 'products',    // Action naming (products.create, etc.)
  
  // ... rest of schema configuration
  
  // ✅ REQUIRED: IndexedDB key function
  indexedDBKey: (record: any) => record.id
};

// ✅ REQUIRED: Export TypeScript types
export type Product = {
  id: string;
  name: string;
  // ... other fields
};

export type CreateProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProduct = Partial<Omit<Product, 'id' | 'createdAt'>>;
```

#### **Step 2: Register in Resource Registry**

Add your schema to the central resource registry:

```typescript
// src/lib/resource-system/resource-registry.ts

// ✅ ADD IMPORT
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// ✅ ADD TO SCHEMA_RESOURCES ARRAY
const SCHEMA_RESOURCES: ResourceSchema[] = [
  // Core Entities
  BRANCH_SCHEMA,
  SESSION_SCHEMA,
  NODE_SCHEMA,
  PROCESS_SCHEMA,
  RULE_SCHEMA,
  OFFICE_SCHEMA,
  WORKFLOW_SCHEMA,
  PROMPT_SCHEMA,
  USER_SCHEMA,
  
  // Tag System Entities
  TAG_GROUP_SCHEMA,
  TAG_SCHEMA,
  CLASS_SCHEMA,
  
  // ✅ ADD YOUR SCHEMA HERE
  PRODUCT_SCHEMA,
];
```

#### **Step 3: Create Index File**

Create an index file for clean exports:

```typescript
// src/features/products/index.ts
export { PRODUCT_SCHEMA } from './products.schema';
export type { Product, CreateProduct, UpdateProduct } from './products.schema';
```

#### **Step 4: Add to Cache Invalidation Families**

Add your resource to the appropriate cache invalidation family:

```typescript
// src/hooks/query/cache-invalidation.ts

const RESOURCE_FAMILIES: Record<string, string[]> = {
  // ... existing families
  
  // ✅ ADD YOUR RESOURCE TO APPROPRIATE FAMILY
  // For simple, self-contained resources:
  product: ['product'],
  
  // For resources with complex relationships:
  product: ['product', 'category', 'productCategories', 'inventory'],
  
  // Or add to existing family if closely related:
  rule: ['rule', 'process', 'processRules', 'ruleIgnores', 'node', 'product'], // If products relate to rules
};
```

**Cache Invalidation Family Guidelines:**

- **Simple entities** (office, user): `[resourceName]` only
- **Complex entities** (rule, process, node): Include all related resources and junctions
- **Junction tables**: Include all parent resources they connect

#### **Step 5: Verify Registration**

The system will automatically generate:

- ✅ **IndexedDB Store**: `products` store with indexes
- ✅ **Action Mappings**: `products.create`, `products.update`, `products.delete`, `products.list`, `products.read`
- ✅ **API Endpoints**: `/api/workspaces/current/actions` handles all operations
- ✅ **React Hooks**: `useResourceCreate('products')`, `useResourceList('products')`, etc.

---

## Auto-Discovery System

The system uses **auto-discovery** to find and register all schemas automatically.

### **How Auto-Discovery Works**

```typescript
// 1. Import all schemas in resource-registry.ts
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// 2. Add to SCHEMA_RESOURCES array
const SCHEMA_RESOURCES: ResourceSchema[] = [
  PRODUCT_SCHEMA,  // Auto-discovered by system
];

// 3. System automatically generates everything else
export const RESOURCE_REGISTRY = SCHEMA_RESOURCES;
```

### **What Gets Auto-Generated**

From your schema registration, the system creates:

#### **Action Mappings**
```typescript
// Auto-generated action mappings
const actionMappings = {
  'products.create': {
    store: 'products',
    method: 'POST',
    endpoint: '/api/workspaces/current/actions',
    optimistic: true,
    schema: PRODUCT_SCHEMA
  },
  'products.update': {
    store: 'products', 
    method: 'PUT',
    endpoint: '/api/workspaces/current/actions',
    optimistic: true,
    schema: PRODUCT_SCHEMA
  },
  'products.delete': {
    store: 'products',
    method: 'DELETE', 
    endpoint: '/api/workspaces/current/actions',
    optimistic: true,
    schema: PRODUCT_SCHEMA
  },
  'products.list': {
    store: 'products',
    method: 'GET',
    endpoint: '/api/workspaces/current/actions',
    cached: true,
    schema: PRODUCT_SCHEMA
  },
  'products.read': {
    store: 'products',
    method: 'GET',
    endpoint: '/api/workspaces/current/actions', 
    cached: true,
    schema: PRODUCT_SCHEMA
  }
};
```

#### **IndexedDB Store Configuration**
```typescript
// Auto-generated IndexedDB store
const storeConfig = {
  name: 'products',           // From databaseKey
  keyPath: undefined,         // Uses compound keys
  autoIncrement: false,
  indexes: [
    { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
    { name: 'idx_branchId', keyPath: 'branchId', unique: false },
    { name: 'idx_createdAt', keyPath: 'createdAt', unique: false },
    { name: 'idx_updatedAt', keyPath: 'updatedAt', unique: false }
  ]
};
```

---

## Action System Integration

### **How Actions Are Generated**

The system automatically creates standard CRUD actions for every registered schema:

```typescript
// Auto-generated actions for PRODUCT_SCHEMA
const actions = ['create', 'update', 'delete', 'list', 'read'];

// Plus custom actions if defined in schema
if (schema.actions?.custom) {
  actions.push(...schema.actions.custom.map(action => action.id));
}
```

### **Action Configuration Options**

Control action behavior in your schema:

```typescript
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ... other config
  
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    read: true,
    
    // ✅ Control optimistic updates
    optimistic: true,  // Enable optimistic updates for CUD operations
    
    // ✅ Add custom actions
    custom: [
      {
        id: 'duplicate',
        label: 'Duplicate Product',
        handler: 'duplicateProduct',
        icon: 'copy'
      },
      {
        id: 'archive',
        label: 'Archive Product', 
        handler: 'archiveProduct',
        icon: 'archive'
      }
    ]
  }
};
```

### **Using Generated Actions**

Once registered, use the actions via hooks:

```typescript
// Auto-generated React hooks
import { useResourceCreate, useResourceList, useResourceUpdate } from '@/hooks/use-action-api';

function ProductManager() {
  // ✅ List products
  const { data: products, isLoading } = useResourceList('products');
  
  // ✅ Create product
  const createProduct = useResourceCreate('products');
  
  // ✅ Update product
  const updateProduct = useResourceUpdate('products');
  
  // ✅ Delete product
  const deleteProduct = useResourceDelete('products');
  
  const handleCreate = async (productData) => {
    await createProduct.mutateAsync(productData);
  };
  
  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## IndexedDB Integration

### **Store Creation Process**

When your schema is registered, the IndexedDB manager automatically:

1. **Creates Store**: Using `databaseKey` as store name
2. **Sets Up Indexes**: Standard indexes for tenant, branch, timestamps
3. **Configures Keys**: Uses compound keys or simple keys based on configuration
4. **Handles Upgrades**: Manages database version upgrades

### **IndexedDB Key Configuration**

Every schema **must** define an `indexedDBKey` function:

```typescript
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ... other config
  
  // ✅ REQUIRED: IndexedDB key function
  indexedDBKey: (record: any) => record.id,  // Simple key
  
  // OR for compound keys
  indexedDBKey: (record: any) => `${record.categoryId}:${record.id}`,
  
  // OR for junction tables
  indexedDBKey: (record: any) => `${record.productId}:${record.tagId}`,
};
```

### **Store Configuration Examples**

#### **Entity Store (Simple Key)**
```typescript
// Products store configuration
{
  name: 'products',
  keyPath: undefined,  // Uses compound keys
  autoIncrement: false,
  indexes: [
    { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
    { name: 'idx_branchId', keyPath: 'branchId', unique: false },
    { name: 'idx_createdAt', keyPath: 'createdAt', unique: false },
    { name: 'idx_updatedAt', keyPath: 'updatedAt', unique: false },
    { name: 'idx_name', keyPath: 'name', unique: false }  // Custom index
  ]
}
```

#### **Junction Store (Compound Key)**
```typescript
// ProductTags junction store configuration  
{
  name: 'productTags',
  keyPath: undefined,  // Uses compound keys
  autoIncrement: false,
  indexes: [
    { name: 'idx_productId', keyPath: 'productId', unique: false },
    { name: 'idx_tagId', keyPath: 'tagId', unique: false },
    { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
    { name: 'idx_branchId', keyPath: 'branchId', unique: false }
  ]
}
```

### **Performance Optimization**

The IndexedDB integration provides:

- ✅ **<50ms Reads**: Optimized compound keys and indexes
- ✅ **Batch Operations**: Efficient bulk inserts and updates
- ✅ **Branch Awareness**: Automatic branch context handling
- ✅ **Tenant Isolation**: Complete tenant data separation

---

## Server-Side Integration

### **API Endpoint Generation**

All registered schemas automatically work with the unified API endpoint:

```typescript
// Single endpoint handles all operations
POST /api/workspaces/current/actions
```

### **Action Router Integration**

The server-side action router automatically handles your schema:

```typescript
// src/lib/server/action-system/action-router.ts

// Auto-discovers your schema from resource registry
const schema = getResourceSchema(resourceType);  // Finds PRODUCT_SCHEMA

// Handles all CRUD operations
switch (operation) {
  case 'create':
    return await this.prismaService.create(resourceType, data, options);
  case 'update':
    return await this.prismaService.update(resourceType, data, options);
  case 'delete':
    return await this.prismaService.delete(resourceType, data.id, options);
  case 'list':
    return await this.prismaService.list(resourceType, options);
  case 'read':
    return await this.prismaService.read(resourceType, data.id, options);
}
```

### **Prisma Integration**

Your schema integrates with Prisma models:

```typescript
// Prisma schema (schema.prisma)
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  categoryId  String?
  tenantId    String
  branchId    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?
  
  // Relationships
  category    Category? @relation(fields: [categoryId], references: [id])
  tags        ProductTag[]
  
  @@map("products")  // Table name matches databaseKey
}
```

---

## Junction Table Registration

### **Two Registration Methods**

#### **Method 1: Embedded in Entity Schema (Recommended)**

Define junction relationships within your main entity schema:

```typescript
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ... main config
  
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
    }
  }
};
```

#### **Method 2: Standalone Junction Schema**

Create a separate junction schema:

```typescript
// src/features/products/products.schema.ts

// Junction schema for ProductTag relationship
export const PRODUCT_TAG_SCHEMA = {
  databaseKey: 'productTags',
  modelName: 'ProductTag',
  actionPrefix: 'productTags',
  schema: ProductTagZodSchema,
  relations: ['product', 'tag', 'branch'],
  primaryKey: ['id'],
  
  // ✅ Junction-specific configuration
  indexedDBKey: (record: ProductTag) => `${record.productId}:${record.tagId}`,
  
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      productId: 'string',  // If productId provided, create ProductTag
      tagId: 'string'       // If tagId provided, create ProductTag
    },
    defaults: {
      isActive: true
    }
  }
};

// Register in resource-registry.ts
const STANDALONE_JUNCTION_SCHEMAS = [
  PRODUCT_TAG_SCHEMA,  // ✅ Add to junction schemas
  // ... other junction schemas
];
```

### **Junction Auto-Discovery**

The system automatically discovers junction tables from:

1. **Relationship definitions** in entity schemas
2. **Standalone junction schemas** in the registry
3. **Pattern matching** on table names (e.g., `productTags`, `userRoles`)

---

## Cache Invalidation Strategy

### **Resource Family Approach**

The system uses a **Resource Family** cache invalidation strategy - the same approach used by companies like Stripe, Shopify, and Linear for 100% reliability.

#### **How It Works**

When any resource changes, the system invalidates all related resources in the same "family":

```typescript
// Example: When a rule is created/updated/deleted
// The entire rule family gets invalidated:
rule: ['rule', 'process', 'processRules', 'ruleIgnores', 'node']
```

#### **Family Categories**

**🔥 Complex Business Entities** (with junctions and relationships):
```typescript
rule: ['rule', 'process', 'processRules', 'ruleIgnores', 'node'],
process: ['process', 'rule', 'processRules', 'nodeProcesses', 'node'],
node: ['node', 'process', 'nodeProcesses', 'rule', 'workflow', 'nodeWorkflows'],
```

**✅ Simple Self-Contained Entities**:
```typescript
office: ['office'],
user: ['user', 'userGroups', 'userTenants'],
```

**🔗 Junction Tables** (always invalidate parents):
```typescript
processRules: ['rule', 'process', 'processRules', 'node'],
nodeProcesses: ['node', 'process', 'nodeProcesses', 'rule'],
```

#### **Smart Invalidation Logic**

The system automatically chooses the right strategy:

```typescript
// Complex operations (junction auto-creation, navigation context)
→ Nuclear invalidation (invalidate everything)

// Simple operations (basic CRUD)  
→ Family invalidation (invalidate resource family)
```

#### **Adding New Resources**

When adding a new resource, **always** add it to `RESOURCE_FAMILIES`:

```typescript
// src/hooks/query/cache-invalidation.ts
const RESOURCE_FAMILIES: Record<string, string[]> = {
  // ✅ ADD YOUR NEW RESOURCE
  yourNewResource: ['yourNewResource'], // Simple entity
  
  // OR include related resources for complex entities
  yourComplexResource: ['yourComplexResource', 'relatedResource', 'junctionTable'],
};
```

#### **Benefits of This Approach**

- ✅ **100% Reliable**: Never misses cache invalidations
- ✅ **Simple**: Easy to understand and debug  
- ✅ **Maintainable**: Just add resources to families
- ✅ **Battle-Tested**: Used by major companies
- ✅ **Performance**: TanStack Query handles debouncing efficiently

#### **When to Use Nuclear Invalidation**

The system automatically uses nuclear invalidation (invalidate everything) for:

- Junction auto-creation operations
- Operations with navigation context
- Custom complex operations

This ensures 100% reliability for complex scenarios while maintaining performance for simple operations.

---

## Troubleshooting

### **Common Registration Issues**

#### **Issue: "Store not found" Error**

```typescript
// ❌ Problem: Schema not registered
Error: Store products not found

// ✅ Solution: Check registration
// 1. Verify import in resource-registry.ts
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

// 2. Verify schema in SCHEMA_RESOURCES array
const SCHEMA_RESOURCES: ResourceSchema[] = [
  PRODUCT_SCHEMA,  // ✅ Must be here
];

// 3. Verify indexedDBKey function exists
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ...
  indexedDBKey: (record: any) => record.id  // ✅ Required
};
```

#### **Issue: Actions Not Working**

```typescript
// ❌ Problem: Action mapping not found
Error: Action products.create not found

// ✅ Solution: Check action configuration
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ...
  actions: {
    create: true,  // ✅ Must be enabled
    update: true,
    delete: true,
    list: true,
    read: true
  }
};
```

#### **Issue: TypeScript Errors**

```typescript
// ❌ Problem: Missing required properties
Property 'databaseKey' is missing in type

// ✅ Solution: Follow BULLETPROOF 3-FIELD DESIGN
export const PRODUCT_SCHEMA: ResourceSchema = {
  databaseKey: 'products',     // ✅ Required
  modelName: 'Product',        // ✅ Required  
  actionPrefix: 'products',    // ✅ Required
  // ...
  indexedDBKey: (record: any) => record.id  // ✅ Required
};
```

### **Debugging Registration**

Use the debug component to verify registration:

```typescript
// Temporary debug component
import { getIndexedDBStoreConfigs } from '@/lib/resource-system/resource-registry';

function DebugRegistration() {
  const stores = getIndexedDBStoreConfigs();
  const productStore = stores.find(s => s.name === 'products');
  
  return (
    <div>
      <h3>Registration Debug</h3>
      <p>Product store found: {productStore ? '✅ Yes' : '❌ No'}</p>
      <p>Total stores: {stores.length}</p>
      <ul>
        {stores.map(store => (
          <li key={store.name}>{store.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Best Practices

### **1. Follow Naming Conventions**

```typescript
// ✅ Good: Consistent naming
databaseKey: 'products',      // Plural, lowercase
modelName: 'Product',         // Singular, PascalCase
actionPrefix: 'products',     // Same as databaseKey

// ❌ Bad: Inconsistent naming
databaseKey: 'product',       // Inconsistent
modelName: 'product',         // Wrong case
actionPrefix: 'productActions' // Too verbose
```

### **2. Use Standard Field Patterns**

```typescript
// ✅ Standard system fields in every schema
fields: [
  // Core identity
  { key: 'id', autoValue: { source: 'auto.uuid', required: true } },
  
  // Tenant/branch context
  { key: 'tenantId', autoValue: { source: 'session.user.tenantId', required: true } },
  { key: 'branchId', autoValue: { source: 'session.user.branchContext.currentBranchId', required: true } },
  
  // Audit fields
  { key: 'createdAt', type: 'date', computed: true },
  { key: 'updatedAt', type: 'date', computed: true },
  { key: 'createdById', autoValue: { source: 'session.user.id' } },
  { key: 'updatedById', autoValue: { source: 'session.user.id' } },
  
  // Your custom fields...
]
```

### **3. Define Clear Relationships**

```typescript
// ✅ Clear relationship definitions
relationships: {
  category: {
    type: 'many-to-one',
    relatedEntity: 'categories',
    foreignKey: 'categoryId',
    displayInForm: true,
    displayInDetail: true
  },
  tags: {
    type: 'many-to-many',
    relatedEntity: 'tags',
    junction: {
      tableName: 'productTags',
      field: 'productId',
      relatedField: 'tagId'
    },
    displayInDetail: true
  }
}
```

### **4. Organize Schema Files**

```typescript
// ✅ Well-organized schema file structure
src/features/products/
├── products.schema.ts        # Main schema
├── types.ts                  # TypeScript types
├── index.ts                  # Public exports
├── components/               # Custom components
│   ├── product-modal.tsx
│   └── product-display.tsx
└── hooks/                    # Custom hooks
    └── use-product-actions.ts
```

### **5. Test Registration**

Always test your schema registration:

```typescript
// Test in your component
function TestProductSchema() {
  const { data: products } = useResourceList('products');
  const createProduct = useResourceCreate('products');
  
  // If this works, registration is successful
  const handleCreate = () => {
    createProduct.mutate({
      name: 'Test Product',
      price: 99.99
    });
  };
  
  return <button onClick={handleCreate}>Test Create</button>;
}
```

---

## Registration Checklist

### **Pre-Registration**
- [ ] Schema file created in correct feature directory
- [ ] BULLETPROOF 3-FIELD DESIGN implemented
- [ ] `indexedDBKey` function defined
- [ ] All required fields have proper configuration
- [ ] TypeScript types exported

### **Registration**
- [ ] Schema imported in `resource-registry.ts`
- [ ] Schema added to `SCHEMA_RESOURCES` array
- [ ] Junction schemas registered (if applicable)
- [ ] Index file created for clean exports

### **Post-Registration**
- [ ] No TypeScript compilation errors
- [ ] IndexedDB store created successfully
- [ ] Action hooks work correctly
- [ ] Auto-generated components function
- [ ] Junction relationships work (if applicable)

### **Testing**
- [ ] Create operation works
- [ ] Read/List operations work
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Offline functionality works
- [ ] Branch operations work

---

**Next**: Read [Auto-Generated Components Integration](./03-auto-generated-integration.md) to learn how to use AutoForm, AutoTable, and AutoModal with your registered schemas.
