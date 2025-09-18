# Examples & Recipes Guide

**Real-world examples and proven patterns for feature schema development**

## Table of Contents

1. [Complete Feature Examples](#complete-feature-examples)
2. [Common Schema Patterns](#common-schema-patterns)
3. [Junction Table Recipes](#junction-table-recipes)
4. [Advanced Relationship Patterns](#advanced-relationship-patterns)
5. [Validation Recipes](#validation-recipes)
6. [UI Pattern Recipes](#ui-pattern-recipes)
7. [Performance Patterns](#performance-patterns)
8. [Migration Patterns](#migration-patterns)

---

## Complete Feature Examples

### **Example 1: E-commerce Product System**

Complete implementation of a product catalog with categories, tags, and inventory:

#### **Schema Definition**

```typescript
// src/features/products/products.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PRODUCT_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY
  // ============================================================================
  databaseKey: 'products',
  modelName: 'Product',
  actionPrefix: 'products',

  // ============================================================================
  // UI DISPLAY
  // ============================================================================
  display: {
    title: 'Products',
    description: 'Product catalog management with categories and inventory',
    icon: 'package',
    color: 'green'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'xl',
    layout: 'compact',
    showDescriptions: true
  },

  // ============================================================================
  // FIELDS
  // ============================================================================
  fields: [
    // System Fields
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: { source: 'auto.uuid', required: true }
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: { source: 'session.user.tenantId', required: true }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      autoValue: { 
        source: 'session.user.branchContext.currentBranchId', 
        required: true 
      }
    },

    // Basic Information Tab
    {
      key: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name...',
      description: 'The display name for this product',
      tab: 'basic',
      form: { row: 1, width: 'full', order: 1, showInForm: true },
      table: { width: 'lg', sortable: true, filterable: true },
      clickable: true,
      clickAction: { type: 'edit' },
      validation: [
        { type: 'required', message: 'Product name is required' },
        { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
        { type: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' }
      ],
      mobile: { priority: 'high', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'lg' }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Product description...',
      description: 'Detailed description of the product',
      tab: 'basic',
      form: { row: 2, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ],
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: false }
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      required: true,
      placeholder: 'PROD-001',
      description: 'Unique product identifier',
      tab: 'basic',
      form: { row: 3, width: 'half', order: 1, showInForm: true },
      table: { width: 'sm', sortable: true },
      validation: [
        { type: 'required', message: 'SKU is required' },
        { type: 'pattern', value: '^[A-Z0-9-]+$', message: 'SKU must contain only uppercase letters, numbers, and hyphens' }
      ],
      mobile: { priority: 'medium', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'sm' }
    },
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      required: true,
      placeholder: 'Select category...',
      description: 'Product category',
      tab: 'basic',
      form: { row: 3, width: 'half', order: 2, showInForm: true },
      table: { width: 'md' },
      options: {
        dynamic: {
          resource: 'categories',
          valueField: 'id',
          labelField: 'name',
          filter: (category) => category.isActive === true
        }
      },
      validation: [
        { type: 'required', message: 'Please select a category' }
      ],
      mobile: { priority: 'medium', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'md' }
    },

    // Pricing Tab
    {
      key: 'price',
      label: 'Price',
      type: 'number',
      required: true,
      placeholder: '0.00',
      description: 'Product price in USD',
      tab: 'pricing',
      form: { row: 1, width: 'half', order: 1, showInForm: true },
      table: { width: 'sm', sortable: true },
      validation: [
        { type: 'required', message: 'Price is required' },
        { type: 'min', value: 0, message: 'Price must be positive' }
      ],
      mobile: { priority: 'high', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'sm' }
    },
    {
      key: 'costPrice',
      label: 'Cost Price',
      type: 'number',
      placeholder: '0.00',
      description: 'Internal cost price',
      tab: 'pricing',
      form: { row: 1, width: 'half', order: 2, showInForm: true },
      validation: [
        { type: 'min', value: 0, message: 'Cost price must be positive' }
      ],
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: false }
    },

    // Inventory Tab
    {
      key: 'stockQuantity',
      label: 'Stock Quantity',
      type: 'number',
      defaultValue: 0,
      placeholder: '0',
      description: 'Current stock quantity',
      tab: 'inventory',
      form: { row: 1, width: 'half', order: 1, showInForm: true },
      table: { width: 'sm', sortable: true },
      validation: [
        { type: 'min', value: 0, message: 'Stock quantity cannot be negative' }
      ],
      mobile: { priority: 'medium', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'sm' }
    },
    {
      key: 'lowStockThreshold',
      label: 'Low Stock Threshold',
      type: 'number',
      defaultValue: 10,
      placeholder: '10',
      description: 'Alert when stock falls below this level',
      tab: 'inventory',
      form: { row: 1, width: 'half', order: 2, showInForm: true },
      validation: [
        { type: 'min', value: 0, message: 'Threshold must be positive' }
      ],
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: false }
    },

    // Status and Tags
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      description: 'Whether this product is active',
      tab: 'basic',
      form: { row: 4, width: 'half', order: 1, showInForm: true },
      table: { width: 'xs' },
      mobile: { priority: 'medium', showInTable: true },
      desktop: { showInTable: true, tableWidth: 'xs' }
    },
    {
      key: 'tagIds',
      label: 'Tags',
      type: 'multiSelect',
      placeholder: 'Select tags...',
      description: 'Product tags for organization',
      tab: 'basic',
      form: { row: 5, width: 'full', order: 1, showInForm: true },
      options: {
        dynamic: {
          resource: 'tags',
          valueField: 'id',
          labelField: 'name'
        }
      },
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: false }
    },

    // Audit Fields
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      computed: true,
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: true, tableWidth: 'sm' }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      computed: true,
      mobile: { priority: 'low', showInTable: false },
      desktop: { showInTable: true, tableWidth: 'sm' }
    }
  ],

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================
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
  },

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================
  search: {
    enabled: true,
    fields: ['name', 'description', 'sku'],
    placeholder: 'Search products...',
    debounceMs: 300
  },

  filtering: {
    level1: {
      field: 'isActive',
      options: [
        { label: 'All Products', value: 'all' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    },
    level2: {
      field: 'categoryId',
      options: {
        dynamic: {
          resource: 'categories',
          valueField: 'id',
          labelField: 'name'
        }
      }
    }
  },

  // ============================================================================
  // ACTIONS
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    read: true,
    optimistic: true,
    custom: [
      {
        id: 'duplicate',
        label: 'Duplicate Product',
        handler: 'duplicateProduct',
        icon: 'copy'
      },
      {
        id: 'updateStock',
        label: 'Update Stock',
        handler: 'updateStock',
        icon: 'package'
      }
    ]
  },

  // ============================================================================
  // MOBILE & DESKTOP CONFIG
  // ============================================================================
  mobile: {
    showInList: true,
    priority: 'high',
    cardLayout: {
      title: 'name',
      subtitle: 'sku',
      description: 'description',
      badge: 'price'
    }
  },

  desktop: {
    showInTable: true,
    defaultSort: { field: 'name', direction: 'asc' },
    bulkActions: ['delete', 'updateStock']
  },

  // ============================================================================
  // REQUIRED: INDEXEDDB KEY
  // ============================================================================
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Product = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  tagIds: string[];
  tenantId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
};

export type CreateProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProduct = Partial<Omit<Product, 'id' | 'createdAt' | 'tenantId'>>;
```

#### **Usage Examples**

```tsx
// Complete Products Page
import { useState } from 'react';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';
import { Button } from '@/components/ui';

export default function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Product
        </Button>
      </div>

      {/* Auto-generated table with all features */}
      <AutoTable 
        resourceKey="products"
        onRowClick={(product) => {
          setSelectedProduct(product);
          setIsEditModalOpen(true);
        }}
        level1Filter="all"
        level2Filter="all"
        headerActions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Import</Button>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        }
      />

      {/* Create Modal */}
      <AutoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        schema={PRODUCT_SCHEMA}
        config={{
          resource: 'products',
          action: 'create',
          title: 'Create New Product'
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Table automatically refreshes via TanStack Query
        }}
      />

      {/* Edit Modal */}
      <AutoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        schema={PRODUCT_SCHEMA}
        config={{
          resource: 'products',
          action: 'update',
          title: 'Edit Product'
        }}
        initialData={selectedProduct}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
```

---

## Common Schema Patterns

### **Pattern 1: Hierarchical Data (Tree Structure)**

```typescript
export const CATEGORY_SCHEMA: ResourceSchema = {
  databaseKey: 'categories',
  modelName: 'Category',
  actionPrefix: 'categories',

  // Tree configuration
  tree: {
    parentField: 'parentId',
    childrenField: 'children',
    displayField: 'name',
    iconField: 'icon',
    orderField: 'sortOrder',
    expandable: true,
    maxDepth: 5
  },

  fields: [
    // ... standard fields
    {
      key: 'parentId',
      label: 'Parent Category',
      type: 'select',
      placeholder: 'Select parent category...',
      options: {
        dynamic: {
          resource: 'categories',
          valueField: 'id',
          labelField: 'name',
          filter: (category) => category.id !== 'current-category-id'
        }
      }
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      defaultValue: 0,
      description: 'Order within parent category'
    }
  ],

  indexedDBKey: (record: any) => record.id
};
```

### **Pattern 2: Status Workflow**

```typescript
export const ORDER_SCHEMA: ResourceSchema = {
  databaseKey: 'orders',
  modelName: 'Order',
  actionPrefix: 'orders',

  fields: [
    // ... other fields
    {
      key: 'status',
      label: 'Order Status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: {
        static: [
          { label: 'Pending', value: 'pending', icon: 'clock' },
          { label: 'Processing', value: 'processing', icon: 'loader' },
          { label: 'Shipped', value: 'shipped', icon: 'truck' },
          { label: 'Delivered', value: 'delivered', icon: 'check-circle' },
          { label: 'Cancelled', value: 'cancelled', icon: 'x-circle' }
        ]
      },
      validation: [
        {
          type: 'custom',
          message: 'Invalid status transition',
          validator: (value, formData) => {
            const validTransitions = {
              pending: ['processing', 'cancelled'],
              processing: ['shipped', 'cancelled'],
              shipped: ['delivered'],
              delivered: [],
              cancelled: []
            };
            const currentStatus = formData.currentStatus || 'pending';
            return validTransitions[currentStatus]?.includes(value) ?? false;
          }
        }
      ]
    }
  ],

  indexedDBKey: (record: any) => record.id
};
```

### **Pattern 3: Multi-Tenant with Branch Isolation**

```typescript
export const DOCUMENT_SCHEMA: ResourceSchema = {
  databaseKey: 'documents',
  modelName: 'Document',
  actionPrefix: 'documents',

  fields: [
    // Standard system fields
    {
      key: 'id',
      autoValue: { source: 'auto.uuid', required: true }
    },
    {
      key: 'tenantId',
      autoValue: { source: 'session.user.tenantId', required: true }
    },
    {
      key: 'branchId',
      autoValue: { 
        source: 'session.user.branchContext.currentBranchId', 
        fallback: 'main',
        required: true 
      }
    },
    {
      key: 'originalDocumentId',
      label: 'Original Document ID',
      type: 'text',
      description: 'Reference to original document for branching'
    },

    // Business fields
    {
      key: 'title',
      label: 'Document Title',
      type: 'text',
      required: true,
      form: { row: 1, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Title is required' }
      ]
    }
  ],

  // Branch-aware configuration
  notHasTenantContext: false,  // Enable tenant filtering
  notHasBranchContext: false,  // Enable branch filtering

  indexedDBKey: (record: any) => record.id
};
```

---

## Junction Table Recipes

### **Recipe 1: Simple Many-to-Many (Product-Tags)**

```typescript
// Method 1: Embedded in main schema (Recommended)
export const PRODUCT_SCHEMA: ResourceSchema = {
  // ... main config

  relationships: {
    tags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this product',
      junction: {
        tableName: 'productTags',
        field: 'productId',
        relatedField: 'tagId'
      }
    }
  }
};

// Method 2: Standalone junction schema
export const PRODUCT_TAG_SCHEMA = {
  databaseKey: 'productTags',
  modelName: 'ProductTag',
  actionPrefix: 'productTags',
  schema: ProductTagZodSchema,
  relations: ['product', 'tag', 'branch'],
  primaryKey: ['id'],
  
  indexedDBKey: (record: ProductTag) => `${record.productId}:${record.tagId}`,
  
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      productId: 'string',
      tagId: 'string'
    },
    defaults: {
      isActive: true
    }
  }
};
```

### **Recipe 2: Junction with Additional Fields (User-Role-Permissions)**

```typescript
export const USER_ROLE_SCHEMA = {
  databaseKey: 'userRoles',
  modelName: 'UserRole',
  actionPrefix: 'userRoles',
  
  fields: [
    // Junction keys
    {
      key: 'userId',
      label: 'User',
      type: 'select',
      required: true,
      options: {
        dynamic: {
          resource: 'users',
          valueField: 'id',
          labelField: 'name'
        }
      }
    },
    {
      key: 'roleId',
      label: 'Role',
      type: 'select',
      required: true,
      options: {
        dynamic: {
          resource: 'roles',
          valueField: 'id',
          labelField: 'name'
        }
      }
    },
    
    // Additional junction fields
    {
      key: 'assignedAt',
      label: 'Assigned Date',
      type: 'date',
      defaultValue: new Date(),
      form: { row: 2, width: 'half', order: 1, showInForm: true }
    },
    {
      key: 'expiresAt',
      label: 'Expires Date',
      type: 'date',
      placeholder: 'Select expiry date...',
      form: { row: 2, width: 'half', order: 2, showInForm: true }
    },
    {
      key: 'permissions',
      label: 'Additional Permissions',
      type: 'multiSelect',
      options: {
        static: [
          { label: 'Read Only', value: 'read' },
          { label: 'Write Access', value: 'write' },
          { label: 'Admin Access', value: 'admin' }
        ]
      },
      form: { row: 3, width: 'full', order: 1, showInForm: true }
    }
  ],

  indexedDBKey: (record: any) => `${record.userId}:${record.roleId}`,
  
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      userId: 'string',
      roleId: 'string'
    },
    defaults: {
      assignedAt: () => new Date(),
      permissions: ['read']
    }
  }
};
```

### **Recipe 3: Hierarchical Junction (Process-Rule Ordering)**

```typescript
export const PROCESS_RULE_SCHEMA = {
  databaseKey: 'processRules',
  modelName: 'ProcessRule',
  actionPrefix: 'processRules',
  
  fields: [
    // Junction keys
    {
      key: 'processId',
      label: 'Process',
      type: 'select',
      required: true,
      options: {
        dynamic: {
          resource: 'processes',
          valueField: 'id',
          labelField: 'name'
        }
      }
    },
    {
      key: 'ruleId',
      label: 'Rule',
      type: 'select',
      required: true,
      options: {
        dynamic: {
          resource: 'rules',
          valueField: 'id',
          labelField: 'name'
        }
      }
    },
    
    // Ordering and configuration
    {
      key: 'order',
      label: 'Execution Order',
      type: 'number',
      required: true,
      defaultValue: 0,
      description: 'Order in which rules are executed',
      form: { row: 2, width: 'half', order: 1, showInForm: true },
      validation: [
        { type: 'min', value: 0, message: 'Order must be positive' }
      ]
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      description: 'Whether this rule is active in the process',
      form: { row: 2, width: 'half', order: 2, showInForm: true }
    },
    {
      key: 'conditions',
      label: 'Execution Conditions',
      type: 'textarea',
      placeholder: 'Enter conditions for rule execution...',
      description: 'Optional conditions that must be met',
      form: { row: 3, width: 'full', order: 1, showInForm: true }
    }
  ],

  indexedDBKey: (record: any) => `${record.processId}:${record.ruleId}`,
  
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      processId: 'string',
      ruleId: 'string'
    },
    defaults: {
      order: 0,
      isActive: true
    }
  }
};
```

---

## Advanced Relationship Patterns

### **Pattern 1: Self-Referencing Hierarchy**

```typescript
export const NODE_SCHEMA: ResourceSchema = {
  databaseKey: 'nodes',
  modelName: 'Node',
  actionPrefix: 'nodes',

  fields: [
    // ... other fields
    {
      key: 'parentId',
      label: 'Parent Node',
      type: 'select',
      placeholder: 'Select parent node...',
      description: 'Parent node in hierarchy',
      options: {
        dynamic: {
          resource: 'nodes',
          valueField: 'id',
          labelField: 'name',
          displayField: 'fullPath',
          filter: (node, currentData) => {
            // Prevent self-reference and circular references
            return node.id !== currentData?.id && 
                   !node.path?.includes(currentData?.id);
          }
        }
      },
      form: { row: 2, width: 'full', order: 1, showInForm: true }
    },
    {
      key: 'fullPath',
      label: 'Full Path',
      type: 'text',
      computed: true,  // Server-computed field
      description: 'Auto-calculated full hierarchy path'
    }
  ],

  tree: {
    parentField: 'parentId',
    childrenField: 'children',
    displayField: 'name',
    pathField: 'fullPath',
    orderField: 'sortOrder'
  },

  indexedDBKey: (record: any) => record.id
};
```

### **Pattern 2: Polymorphic Relationships**

```typescript
export const COMMENT_SCHEMA: ResourceSchema = {
  databaseKey: 'comments',
  modelName: 'Comment',
  actionPrefix: 'comments',

  fields: [
    // ... standard fields
    {
      key: 'commentableType',
      label: 'Comment Type',
      type: 'select',
      required: true,
      options: {
        static: [
          { label: 'Product Comment', value: 'product' },
          { label: 'Order Comment', value: 'order' },
          { label: 'User Comment', value: 'user' }
        ]
      },
      form: { row: 1, width: 'half', order: 1, showInForm: true }
    },
    {
      key: 'commentableId',
      label: 'Related Item',
      type: 'select',
      required: true,
      description: 'The item this comment is attached to',
      options: {
        dynamic: {
          resource: (formData) => formData.commentableType + 's', // products, orders, users
          valueField: 'id',
          labelField: 'name'
        }
      },
      form: { row: 1, width: 'half', order: 2, showInForm: true }
    },
    {
      key: 'content',
      label: 'Comment',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your comment...',
      form: { row: 2, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Comment is required' },
        { type: 'maxLength', value: 1000, message: 'Comment cannot exceed 1000 characters' }
      ]
    }
  ],

  indexedDBKey: (record: any) => record.id
};
```

### **Pattern 3: Conditional Fields Based on Type**

```typescript
export const NOTIFICATION_SCHEMA: ResourceSchema = {
  databaseKey: 'notifications',
  modelName: 'Notification',
  actionPrefix: 'notifications',

  fields: [
    {
      key: 'type',
      label: 'Notification Type',
      type: 'select',
      required: true,
      options: {
        static: [
          { label: 'Email', value: 'email', icon: 'mail' },
          { label: 'SMS', value: 'sms', icon: 'phone' },
          { label: 'Push', value: 'push', icon: 'bell' },
          { label: 'In-App', value: 'in-app', icon: 'message-circle' }
        ]
      },
      form: { row: 1, width: 'half', order: 1, showInForm: true }
    },
    
    // Email-specific fields
    {
      key: 'emailSubject',
      label: 'Email Subject',
      type: 'text',
      placeholder: 'Enter email subject...',
      form: { row: 2, width: 'full', order: 1, showInForm: true },
      // Show only when type is email
      conditionalDisplay: {
        field: 'type',
        value: 'email'
      },
      validation: [
        {
          type: 'custom',
          message: 'Subject is required for email notifications',
          validator: (value, formData) => {
            return formData.type !== 'email' || (value && value.length > 0);
          }
        }
      ]
    },
    {
      key: 'emailTemplate',
      label: 'Email Template',
      type: 'select',
      options: {
        dynamic: {
          resource: 'emailTemplates',
          valueField: 'id',
          labelField: 'name'
        }
      },
      form: { row: 3, width: 'full', order: 1, showInForm: true },
      conditionalDisplay: {
        field: 'type',
        value: 'email'
      }
    },
    
    // SMS-specific fields
    {
      key: 'smsMessage',
      label: 'SMS Message',
      type: 'textarea',
      placeholder: 'Enter SMS message (max 160 characters)...',
      form: { row: 2, width: 'full', order: 1, showInForm: true },
      conditionalDisplay: {
        field: 'type',
        value: 'sms'
      },
      validation: [
        { type: 'maxLength', value: 160, message: 'SMS message cannot exceed 160 characters' }
      ]
    }
  ],

  indexedDBKey: (record: any) => record.id
};
```

---

## Validation Recipes

### **Recipe 1: Cross-Field Validation**

```typescript
export const EVENT_SCHEMA: ResourceSchema = {
  fields: [
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'datetime',
      required: true,
      form: { row: 1, width: 'half', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Start date is required' }
      ]
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'datetime',
      required: true,
      form: { row: 1, width: 'half', order: 2, showInForm: true },
      validation: [
        { type: 'required', message: 'End date is required' },
        {
          type: 'custom',
          message: 'End date must be after start date',
          validator: (value, formData) => {
            if (!value || !formData.startDate) return true;
            return new Date(value) > new Date(formData.startDate);
          }
        }
      ]
    },
    {
      key: 'maxAttendees',
      label: 'Maximum Attendees',
      type: 'number',
      form: { row: 2, width: 'half', order: 1, showInForm: true },
      validation: [
        { type: 'min', value: 1, message: 'Must allow at least 1 attendee' },
        { type: 'max', value: 1000, message: 'Cannot exceed 1000 attendees' }
      ]
    },
    {
      key: 'currentAttendees',
      label: 'Current Attendees',
      type: 'number',
      computed: true,
      validation: [
        {
          type: 'custom',
          message: 'Current attendees cannot exceed maximum',
          validator: (value, formData) => {
            if (!value || !formData.maxAttendees) return true;
            return value <= formData.maxAttendees;
          }
        }
      ]
    }
  ]
};
```

### **Recipe 2: Async Validation (Unique Constraints)**

```typescript
export const USER_SCHEMA: ResourceSchema = {
  fields: [
    {
      key: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'user@example.com',
      form: { row: 1, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Must be a valid email address' },
        {
          type: 'custom',
          message: 'Email address is already in use',
          validator: async (value, formData) => {
            if (!value) return true;
            
            // Skip validation if editing same user
            if (formData.id) {
              const currentUser = await fetchUser(formData.id);
              if (currentUser.email === value) return true;
            }
            
            // Check if email exists
            const existingUser = await checkEmailExists(value);
            return !existingUser;
          }
        }
      ]
    },
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      placeholder: 'Enter username...',
      form: { row: 2, width: 'full', order: 1, showInForm: true },
      validation: [
        { type: 'required', message: 'Username is required' },
        { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
        { type: 'pattern', value: '^[a-zA-Z0-9_]+$', message: 'Username can only contain letters, numbers, and underscores' },
        {
          type: 'custom',
          message: 'Username is already taken',
          validator: async (value, formData) => {
            if (!value) return true;
            
            // Skip validation if editing same user
            if (formData.id) {
              const currentUser = await fetchUser(formData.id);
              if (currentUser.username === value) return true;
            }
            
            const existingUser = await checkUsernameExists(value);
            return !existingUser;
          }
        }
      ]
    }
  ]
};
```

### **Recipe 3: Business Rule Validation**

```typescript
export const ORDER_SCHEMA: ResourceSchema = {
  fields: [
    {
      key: 'customerId',
      label: 'Customer',
      type: 'select',
      required: true,
      options: {
        dynamic: {
          resource: 'customers',
          valueField: 'id',
          labelField: 'name'
        }
      },
      validation: [
        { type: 'required', message: 'Customer is required' },
        {
          type: 'custom',
          message: 'Customer account is suspended',
          validator: async (value) => {
            if (!value) return true;
            const customer = await fetchCustomer(value);
            return customer.status !== 'suspended';
          }
        }
      ]
    },
    {
      key: 'items',
      label: 'Order Items',
      type: 'json',
      required: true,
      validation: [
        { type: 'required', message: 'Order must have at least one item' },
        {
          type: 'custom',
          message: 'Order total cannot exceed customer credit limit',
          validator: async (items, formData) => {
            if (!items || !formData.customerId) return true;
            
            const customer = await fetchCustomer(formData.customerId);
            const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            return orderTotal <= customer.creditLimit;
          }
        },
        {
          type: 'custom',
          message: 'Some items are out of stock',
          validator: async (items) => {
            if (!items) return true;
            
            for (const item of items) {
              const product = await fetchProduct(item.productId);
              if (product.stockQuantity < item.quantity) {
                return false;
              }
            }
            return true;
          }
        }
      ]
    }
  ]
};
```

---

## UI Pattern Recipes

### **Recipe 1: Master-Detail Layout**

```tsx
// Master-Detail with AutoTree and AutoTable
function ProductCatalogPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Master: Category Tree */}
      <div className="w-1/4 border-r bg-gray-50 p-4">
        <h2 className="font-semibold mb-4">Categories</h2>
        <AutoTree 
          resourceKey="categories"
          onNodeSelect={(category) => {
            setSelectedCategoryId(category.id);
            setSelectedProductId(null);
          }}
          showSearch={true}
          enableContextMenu={true}
        />
      </div>

      {/* Detail: Products in Category */}
      <div className="flex-1 flex flex-col">
        {/* Products Table */}
        <div className="flex-1 p-6">
          <AutoTable 
            resourceKey="products"
            navigationContext={{ categoryId: selectedCategoryId }}
            customTitle={`Products${selectedCategoryId ? ' in Category' : ''}`}
            onRowClick={(product) => setSelectedProductId(product.id)}
            headerActions={
              <Button 
                onClick={() => {/* Open create modal */}}
                disabled={!selectedCategoryId}
              >
                Add Product
              </Button>
            }
          />
        </div>

        {/* Product Details Panel */}
        {selectedProductId && (
          <div className="border-t bg-gray-50 p-6 h-1/3">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <AutoForm
              schema={PRODUCT_SCHEMA}
              mode="edit"
              initialData={{ id: selectedProductId }}
              onSubmit={async (data) => {
                console.log('Product updated:', data);
              }}
              onCancel={() => setSelectedProductId(null)}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### **Recipe 2: Wizard/Multi-Step Forms**

```tsx
// Multi-step product creation wizard
function ProductCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    { id: 1, title: 'Basic Information', tab: 'basic' },
    { id: 2, title: 'Pricing & Inventory', tab: 'pricing' },
    { id: 3, title: 'Categories & Tags', tab: 'categorization' },
    { id: 4, title: 'Review & Submit', tab: 'review' }
  ];

  const handleStepSubmit = (stepData) => {
    setFormData({ ...formData, ...stepData });
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      submitProduct({ ...formData, ...stepData });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id < currentStep ? 'text-green-600' : 
                step.id === currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.id < currentStep ? 'bg-green-600 border-green-600 text-white' :
                  step.id === currentStep ? 'border-blue-600' : 'border-gray-300'
                }`}
              >
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <span className="ml-2 font-medium">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep < steps.length ? (
          <AutoForm
            schema={{
              ...PRODUCT_SCHEMA,
              fields: PRODUCT_SCHEMA.fields.filter(
                field => field.tab === steps[currentStep - 1].tab
              )
            }}
            mode="create"
            initialData={formData}
            onSubmit={handleStepSubmit}
            onCancel={() => setCurrentStep(Math.max(1, currentStep - 1))}
            compact={true}
          />
        ) : (
          // Review step
          <div>
            <h3 className="text-lg font-semibold mb-4">Review Your Product</h3>
            <div className="space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
              <Button onClick={() => handleStepSubmit({})}>
                Create Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### **Recipe 3: Dashboard with Multiple Auto-Components**

```tsx
// Executive dashboard with multiple auto-generated components
function ExecutiveDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Executive Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="outline">Export Report</Button>
          <Button>Refresh Data</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Products" value="1,234" change="+12%" />
        <MetricCard title="Active Orders" value="56" change="+8%" />
        <MetricCard title="Revenue" value="$45,678" change="+15%" />
        <MetricCard title="Customers" value="789" change="+5%" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoTable 
                resourceKey="orders"
                filters={{ 
                  createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }}
                className="max-h-96 overflow-auto"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AutoModal
                trigger={<Button className="w-full">Create Product</Button>}
                schema={PRODUCT_SCHEMA}
                config={{
                  resource: 'products',
                  action: 'create',
                  title: 'Quick Create Product'
                }}
              />
              <AutoModal
                trigger={<Button variant="outline" className="w-full">Add Customer</Button>}
                schema={CUSTOMER_SCHEMA}
                config={{
                  resource: 'customers',
                  action: 'create',
                  title: 'Add New Customer'
                }}
              />
              <Button variant="outline" className="w-full">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <AutoTable 
              resourceKey="categories"
              enhancedData={{
                includeProductCount: true,
                includeRevenue: true
              }}
              customColumns={[
                { key: 'productCount', label: 'Products', type: 'number' },
                { key: 'revenue', label: 'Revenue', type: 'currency' }
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <AutoTable 
              resourceKey="products"
              filters={{ 
                stockQuantity: { lte: 10 }
              }}
              customTitle="Products Running Low"
              className="max-h-96 overflow-auto"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Performance Patterns

### **Pattern 1: Lazy Loading and Code Splitting**

```tsx
// Lazy load heavy auto-generated components
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AutoTable = lazy(() => import('@/components/auto-generated/table/auto-table'));
const AutoModal = lazy(() => import('@/components/auto-generated/modal/auto-modal'));

function OptimizedProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      
      <Suspense fallback={<TableSkeleton />}>
        <AutoTable resourceKey="products" />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

### **Pattern 2: Optimized Filtering and Pagination**

```tsx
// Efficient data loading with filters and pagination
function OptimizedProductList() {
  const [filters, setFilters] = useState({
    isActive: true,
    categoryId: null,
    priceRange: { min: 0, max: 1000 }
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });

  return (
    <AutoTable 
      resourceKey="products"
      filters={filters}
      pagination={pagination}
      onFiltersChange={setFilters}
      onPaginationChange={setPagination}
      // Enable virtual scrolling for large datasets
      virtualScrolling={true}
      // Debounce filter changes
      filterDebounceMs={300}
    />
  );
}
```

### **Pattern 3: Memoization and React.memo**

```tsx
// Memoized components for better performance
import { memo, useMemo } from 'react';

const MemoizedAutoTable = memo(AutoTable, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.resourceKey === nextProps.resourceKey &&
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.navigationContext?.categoryId === nextProps.navigationContext?.categoryId
  );
});

function PerformantProductsPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    isActive: true,
    ...(selectedCategoryId && { categoryId: selectedCategoryId })
  }), [selectedCategoryId]);

  return (
    <div className="flex">
      <CategorySidebar onCategorySelect={setSelectedCategoryId} />
      <MemoizedAutoTable 
        resourceKey="products"
        filters={filters}
        navigationContext={{ categoryId: selectedCategoryId }}
      />
    </div>
  );
}
```

---

## Migration Patterns

### **Pattern 1: Gradual Migration from Legacy Components**

```tsx
// Gradual migration strategy
function ProductsPageMigration() {
  const [useLegacyTable, setUseLegacyTable] = useState(false);
  
  // Feature flag for gradual rollout
  const useAutoTable = useFeatureFlag('auto-table-products');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        
        {/* Debug toggle for development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseLegacyTable(!useLegacyTable)}
          >
            {useLegacyTable ? 'Use Auto Table' : 'Use Legacy Table'}
          </Button>
        )}
      </div>

      {/* Conditional rendering based on feature flag */}
      {useAutoTable && !useLegacyTable ? (
        <AutoTable resourceKey="products" />
      ) : (
        <LegacyProductTable />
      )}
    </div>
  );
}
```

### **Pattern 2: Data Migration and Schema Evolution**

```typescript
// Schema versioning for data migration
export const PRODUCT_SCHEMA_V2: ResourceSchema = {
  databaseKey: 'products',
  modelName: 'Product',
  actionPrefix: 'products',
  
  // Schema version for migration tracking
  version: 2,
  
  fields: [
    // ... existing fields
    
    // New field added in v2
    {
      key: 'barcode',
      label: 'Barcode',
      type: 'text',
      placeholder: 'Enter barcode...',
      description: 'Product barcode (added in v2)',
      // Migration default value
      defaultValue: '',
      form: { row: 4, width: 'half', order: 1, showInForm: true }
    }
  ],

  // Migration hooks
  hooks: {
    beforeCreate: 'migrateProductDataV2',
    beforeUpdate: 'migrateProductDataV2'
  },

  indexedDBKey: (record: any) => record.id
};

// Migration function
export function migrateProductDataV2(data: any) {
  // Add default barcode if missing
  if (!data.barcode && data.sku) {
    data.barcode = `BAR-${data.sku}`;
  }
  
  // Migrate old price format
  if (typeof data.price === 'string') {
    data.price = parseFloat(data.price);
  }
  
  return data;
}
```

### **Pattern 3: Backward Compatibility**

```typescript
// Backward compatibility wrapper
export function createBackwardCompatibleSchema(
  newSchema: ResourceSchema,
  legacyFieldMappings: Record<string, string>
): ResourceSchema {
  return {
    ...newSchema,
    
    // Add legacy field mappings
    fields: [
      ...newSchema.fields,
      
      // Add legacy fields as computed/transient
      ...Object.entries(legacyFieldMappings).map(([legacyKey, newKey]) => ({
        key: legacyKey,
        label: `Legacy ${legacyKey}`,
        type: 'text' as const,
        computed: true,
        transient: true,
        description: `Legacy field mapped to ${newKey}`
      }))
    ],
    
    // Custom data transformer
    hooks: {
      beforeCreate: (data: any) => {
        // Transform legacy field names to new names
        Object.entries(legacyFieldMappings).forEach(([legacyKey, newKey]) => {
          if (data[legacyKey] && !data[newKey]) {
            data[newKey] = data[legacyKey];
            delete data[legacyKey];
          }
        });
        return data;
      },
      
      afterRead: (data: any) => {
        // Add legacy fields for backward compatibility
        Object.entries(legacyFieldMappings).forEach(([legacyKey, newKey]) => {
          if (data[newKey]) {
            data[legacyKey] = data[newKey];
          }
        });
        return data;
      }
    }
  };
}

// Usage
export const PRODUCT_SCHEMA_COMPAT = createBackwardCompatibleSchema(
  PRODUCT_SCHEMA_V2,
  {
    'product_name': 'name',      // Legacy snake_case to camelCase
    'product_price': 'price',
    'category_id': 'categoryId'
  }
);
```

---

This completes the comprehensive feature schema developer guide! The documentation now provides:

✅ **System Overview** - Architecture and core concepts  
✅ **Field Configuration** - Complete field types and options reference  
✅ **Registration & Integration** - How to register schemas and integrate with systems  
✅ **Auto-Generated Components** - Using AutoForm, AutoTable, AutoModal, AutoTree  
✅ **Examples & Recipes** - Real-world patterns and proven solutions  

The guide covers everything from basic schema creation to advanced patterns like junction tables, polymorphic relationships, performance optimization, and migration strategies. Developers now have a complete reference for building schema-driven applications with the auto-generated component system.

---

## Schema Tips (Quick Reference)

- ContextSource for auto-values: use sources defined in `schemas.ts` (e.g., `session.user.tenantId`, `session.user.branchContext.currentBranchId`, `navigation.nodeId`, `auto.uuid`). Avoid custom string constants.
- Defaults: prefer `defaultValue` on `FieldSchema` for static defaults (e.g., `isActive: true`).
- serverOnly: for large datasets (like `tableData`), set `serverOnly: true` and `cacheStrategy: 'server-only'` to bypass IndexedDB.
- indexedDBKey: entities typically return `record.id`; junctions use compound keys (e.g., `${record.processId}:${record.ruleId}`) and include additional keys (like `nodeId`) when scope requires it.
- actionPrefix/resourceKey: ensure `resourceKey` used by Auto* components equals the schema `actionPrefix`.
- relationships: define M2M junctions under `relationships` with `junction.tableName` for auto-discovery; add standalone junction schemas only when necessary.
