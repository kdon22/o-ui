# Auto-Generated Components Integration Guide

**Complete guide for using AutoForm, AutoTable, AutoModal, and AutoTree with your registered schemas**

## Table of Contents

1. [Components Overview](#components-overview)
2. [AutoForm Integration](#autoform-integration)
3. [AutoTable Integration](#autotable-integration)
4. [AutoModal Integration](#automodal-integration)
5. [AutoTree Integration](#autotree-integration)
6. [React Hooks Integration](#react-hooks-integration)
7. [Advanced Integration Patterns](#advanced-integration-patterns)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Components Overview

Once you register a schema, you get instant access to four powerful auto-generated components:

### **Component Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Schema   │───▶│  Auto-Generated  │───▶│  React Hooks    │
│   Definition    │    │  Components      │    │  Integration    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Field Config   │    │  AutoForm        │    │  useResourceXXX │
│  Validation     │    │  AutoTable       │    │  Hooks          │
│  Options        │    │  AutoModal       │    │                 │
└─────────────────┘    │  AutoTree        │    └─────────────────┘
                       └──────────────────┘
```

### **Available Components**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **AutoForm** | Schema-driven forms | Multi-tab, validation, auto-population, responsive |
| **AutoTable** | Data tables with CRUD | Inline editing, bulk actions, filtering, sorting |
| **AutoModal** | Modal dialogs | Create/edit modals, context-aware, optimistic updates |
| **AutoTree** | Hierarchical navigation | Tree structures, drag-drop, search, context menus |

---

## AutoForm Integration

### **Basic Usage**

```tsx
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

function ProductCreateForm() {
  const handleSubmit = async (data: any) => {
    console.log('Product data:', data);
    // AutoForm handles the actual API call via action system
  };

  const handleCancel = () => {
    // Handle cancel action
  };

  return (
    <AutoForm
      schema={PRODUCT_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### **AutoForm Props Reference**

```typescript
interface AutoFormProps {
  // Required
  schema: ResourceSchema;           // Your registered schema
  mode: 'create' | 'edit';         // Form mode
  onSubmit: (data: any) => Promise<void>;  // Submit handler
  onCancel: () => void;            // Cancel handler
  
  // Optional
  initialData?: Record<string, any>;        // Pre-populate form data
  parentData?: Record<string, any>;         // Parent context data
  isLoading?: boolean;             // Loading state
  className?: string;              // Custom CSS classes
  compact?: boolean;               // Compact layout
  
  // Context & Auto-Population
  navigationContext?: {            // Auto-populate from navigation
    nodeId?: string;
    parentId?: string;
    selectedId?: string;
  };
  componentContext?: {             // Auto-populate from component
    parentData?: any;
    contextId?: string;
  };
  
  // Junction Creation
  enableJunctionCreation?: boolean; // Auto-create junction records
  
  // Advanced
  enableAnimations?: boolean;       // Form animations
  enableKeyboardShortcuts?: boolean; // Keyboard shortcuts
  onError?: (error: Error) => void; // Error handler
}
```

### **Multi-Tab Forms**

AutoForm automatically creates tabs based on your field configuration:

```typescript
// Schema with tabbed fields
export const PRODUCT_SCHEMA: ResourceSchema = {
  fields: [
    // Basic tab
    {
      key: 'name',
      tab: 'basic',  // ✅ Creates "Basic" tab
      // ...
    },
    
    // Pricing tab
    {
      key: 'price',
      tab: 'pricing',  // ✅ Creates "Pricing" tab
      // ...
    },
    
    // Advanced tab
    {
      key: 'metadata',
      tab: 'advanced',  // ✅ Creates "Advanced" tab
      // ...
    }
  ]
};
```

### **Context-Aware Auto-Population**

AutoForm automatically populates fields based on context:

```tsx
// Auto-populate from navigation context
<AutoForm
  schema={RULE_SCHEMA}
  mode="create"
  navigationContext={{ nodeId: selectedNodeId }}  // Auto-populates nodeId field
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// Auto-populate from parent data
<AutoForm
  schema={PRODUCT_SCHEMA}
  mode="create"
  parentData={{ categoryId: 'cat-123' }}  // Auto-populates categoryId field
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### **Junction Auto-Creation**

AutoForm can automatically create junction records:

```tsx
// Creating a rule with auto-junction creation
<AutoForm
  schema={RULE_SCHEMA}
  mode="create"
  navigationContext={{ nodeId: 'node-123' }}  // Creates NodeRule junction automatically
  enableJunctionCreation={true}  // Enable auto-junction creation
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

## AutoTable Integration

### **Basic Usage**

```tsx
import { AutoTable } from '@/components/auto-generated/table/auto-table';

function ProductsTable() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <AutoTable resourceKey="products" />
    </div>
  );
}
```

### **AutoTable Props Reference**

```typescript
interface AutoTableProps {
  // Required
  resourceKey: string;             // Schema actionPrefix (e.g., 'products')
  
  // Filtering
  filters?: Record<string, any>;   // Additional filters
  level1Filter?: string;           // Primary filter
  level2Filter?: string;           // Secondary filter
  onLevel1FilterChange?: (filter: string) => void;
  onLevel2FilterChange?: (filter: string) => void;
  filteringConfig?: FilteringConfig; // Custom filtering
  
  // Interaction
  onRowClick?: (row: any) => void; // Row click handler
  
  // Customization
  className?: string;              // Custom CSS classes
  customTitle?: string;            // Override default title
  customSearchPlaceholder?: string; // Override search placeholder
  
  // Context
  navigationContext?: NavigationContext; // Auto-filter by context
  
  // Data Enhancement
  enhancedData?: any;              // Additional data for display
  processTypes?: string[];         // For process-specific tables
  processNames?: string[];         // For process-specific tables
  
  // Header Actions
  headerActions?: React.ReactNode; // Custom header actions
}
```

### **Advanced Table Features**

#### **Inline Editing**

AutoTable supports inline editing for fields marked as `clickable`:

```typescript
// Schema configuration for clickable columns
{
  key: 'name',
  label: 'Product Name',
  type: 'text',
  clickable: true,  // ✅ Makes column clickable for editing
  clickAction: {
    type: 'edit'    // Opens inline edit mode
  }
}
```

#### **Context Menu Actions**

AutoTable automatically provides context menu actions:

```tsx
// Context menu actions are auto-generated based on schema actions
<AutoTable 
  resourceKey="products"
  // Right-click on rows shows: Edit, Delete, Duplicate (if configured)
/>
```

#### **Bulk Operations**

AutoTable supports bulk selection and operations:

```tsx
// Bulk actions are automatically available
<AutoTable 
  resourceKey="products"
  // Select multiple rows → floating action menu appears
  // Actions: Delete Selected, Export Selected, etc.
/>
```

#### **Filtering and Search**

```tsx
// Advanced filtering
<AutoTable 
  resourceKey="products"
  filters={{ isActive: true }}  // Additional filters
  level1Filter="active"         // Primary filter tab
  level2Filter="electronics"    // Secondary filter tab
  onLevel1FilterChange={(filter) => console.log('L1:', filter)}
  onLevel2FilterChange={(filter) => console.log('L2:', filter)}
/>
```

### **Junction Relationship Tables**

AutoTable automatically handles junction relationships:

```tsx
// Display products for a specific category
<AutoTable 
  resourceKey="products"
  navigationContext={{ categoryId: 'cat-123' }}  // Auto-filters by category
/>

// Display rules for a specific node
<AutoTable 
  resourceKey="rules"
  navigationContext={{ nodeId: 'node-456' }}  // Auto-filters by node
/>
```

---

## AutoModal Integration

### **Basic Usage**

```tsx
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';

function ProductManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSuccess = (data: any) => {
    console.log('Operation successful:', data);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button onClick={() => {
        setModalMode('create');
        setSelectedProduct(null);
        setIsModalOpen(true);
      }}>
        Create Product
      </Button>

      <AutoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schema={PRODUCT_SCHEMA}
        config={{
          resource: 'products',
          action: modalMode,
          title: modalMode === 'create' ? 'Create Product' : 'Edit Product'
        }}
        initialData={selectedProduct}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

### **AutoModal Props Reference**

```typescript
interface AutoModalProps {
  // Required
  isOpen: boolean;                 // Modal open state
  onClose: () => void;            // Close handler
  schema: ResourceSchema;          // Your registered schema
  config: {                       // Modal configuration
    resource: string;             // Schema actionPrefix
    action: 'create' | 'update';  // Modal mode
    title?: string;               // Modal title
    width?: 'sm' | 'md' | 'lg' | 'xl'; // Modal width
  };
  
  // Optional
  initialData?: Record<string, any>;  // Pre-populate data (for edit mode)
  parentData?: Record<string, any>;   // Parent context data
  navigationContext?: NavigationContext; // Auto-populate from navigation
  
  // Callbacks
  onSuccess?: (data: any) => void;    // Success handler
  onError?: (error: Error) => void;   // Error handler
  
  // Styling
  className?: string;              // Custom CSS classes
  overlayClassName?: string;       // Overlay CSS classes
}
```

### **Modal Patterns**

#### **Create Modal**

```tsx
// Create new product
<AutoModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  schema={PRODUCT_SCHEMA}
  config={{
    resource: 'products',
    action: 'create',
    title: 'Create New Product'
  }}
  navigationContext={{ categoryId: selectedCategoryId }}  // Auto-populate category
  onSuccess={(data) => {
    console.log('Product created:', data);
    setIsCreateModalOpen(false);
    // Refresh table data automatically handled by TanStack Query
  }}
/>
```

#### **Edit Modal**

```tsx
// Edit existing product
<AutoModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  schema={PRODUCT_SCHEMA}
  config={{
    resource: 'products',
    action: 'update',
    title: 'Edit Product'
  }}
  initialData={selectedProduct}  // Pre-populate with existing data
  onSuccess={(data) => {
    console.log('Product updated:', data);
    setIsEditModalOpen(false);
  }}
/>
```

#### **Context-Aware Modal**

```tsx
// Modal that auto-populates based on context
<AutoModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  schema={RULE_SCHEMA}
  config={{
    resource: 'rules',
    action: 'create',
    title: 'Create Rule for Node'
  }}
  navigationContext={{ 
    nodeId: selectedNodeId,     // Auto-populates nodeId field
    parentId: parentNodeId      // Auto-populates parentId field
  }}
  onSuccess={handleRuleCreated}
/>
```

---

## AutoTree Integration

### **Basic Usage**

```tsx
import { AutoTree } from '@/components/auto-generated/tree/auto-tree';

function NavigationTree() {
  return (
    <div className="w-64 border-r">
      <AutoTree 
        resourceKey="nodes"
        onNodeSelect={(node) => console.log('Selected:', node)}
      />
    </div>
  );
}
```

### **AutoTree Props Reference**

```typescript
interface AutoTreeProps {
  // Required
  resourceKey: string;             // Schema actionPrefix for tree data
  
  // Interaction
  onNodeSelect?: (node: any) => void;      // Node selection handler
  onNodeExpand?: (node: any) => void;      // Node expand handler
  onNodeCollapse?: (node: any) => void;    // Node collapse handler
  
  // Configuration
  expandedByDefault?: boolean;      // Expand all nodes initially
  showSearch?: boolean;            // Show search input
  enableDragDrop?: boolean;        // Enable drag and drop
  enableContextMenu?: boolean;     // Enable right-click menu
  
  // Filtering
  filters?: Record<string, any>;   // Filter tree nodes
  searchPlaceholder?: string;      // Search input placeholder
  
  // Styling
  className?: string;              // Custom CSS classes
  nodeClassName?: string;          // Custom node CSS classes
  
  // Advanced
  virtualScrolling?: boolean;      // Enable virtual scrolling for large trees
  maxDepth?: number;              // Maximum tree depth
}
```

### **Tree Features**

#### **Hierarchical Navigation**

AutoTree automatically handles hierarchical data:

```typescript
// Schema for hierarchical data
export const NODE_SCHEMA: ResourceSchema = {
  // ...
  
  // ✅ Tree configuration
  tree: {
    parentField: 'parentId',      // Field that references parent
    childrenField: 'children',    // Virtual field for children
    displayField: 'name',         // Field to display as node label
    iconField: 'icon',           // Field for node icon
    orderField: 'sortOrder',     // Field for node ordering
    expandable: true             // Allow expand/collapse
  },
  
  fields: [
    {
      key: 'parentId',
      label: 'Parent Node',
      type: 'select',
      // Dynamic options load other nodes
      options: {
        dynamic: {
          resource: 'nodes',
          valueField: 'id',
          labelField: 'name',
          filter: (node) => node.id !== 'current-node-id'  // Prevent self-reference
        }
      }
    }
    // ... other fields
  ]
};
```

#### **Search and Filtering**

```tsx
// Tree with search
<AutoTree 
  resourceKey="nodes"
  showSearch={true}
  searchPlaceholder="Search nodes..."
  filters={{ isActive: true }}  // Only show active nodes
  onNodeSelect={handleNodeSelect}
/>
```

#### **Context Menu Actions**

```tsx
// Tree with context menu
<AutoTree 
  resourceKey="nodes"
  enableContextMenu={true}
  // Right-click shows: Add Child, Edit, Delete, etc.
  onNodeSelect={handleNodeSelect}
/>
```

#### **Drag and Drop**

```tsx
// Tree with drag and drop reordering
<AutoTree 
  resourceKey="nodes"
  enableDragDrop={true}
  onNodeSelect={handleNodeSelect}
/>
```

---

## React Hooks Integration

### **Available Hooks**

The action system provides React hooks for direct integration:

```typescript
// Query hooks
useResourceList(resourceKey, options?)     // List all resources
useResourceRead(resourceKey, id, options?) // Read single resource
useActionQuery(action, data?, options?)    // Custom query

// Mutation hooks
useResourceCreate(resourceKey, options?)   // Create resource
useResourceUpdate(resourceKey, options?)   // Update resource
useResourceDelete(resourceKey, options?)   // Delete resource
useActionMutation(action, options?)        // Custom mutation
```

### **Hook Examples**

#### **Data Fetching**

```tsx
import { useResourceList, useResourceRead } from '@/hooks/use-action-api';

function ProductList() {
  // Fetch all products
  const { 
    data: products, 
    isLoading, 
    error 
  } = useResourceList('products', {
    filters: { isActive: true },
    sort: { field: 'name', direction: 'asc' }
  });

  // Fetch specific product
  const { 
    data: product 
  } = useResourceRead('products', selectedProductId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

#### **Mutations**

```tsx
import { useResourceCreate, useResourceUpdate, useResourceDelete } from '@/hooks/use-action-api';

function ProductActions() {
  const createProduct = useResourceCreate('products');
  const updateProduct = useResourceUpdate('products');
  const deleteProduct = useResourceDelete('products');

  const handleCreate = async () => {
    try {
      const newProduct = await createProduct.mutateAsync({
        name: 'New Product',
        price: 99.99,
        categoryId: 'cat-123'
      });
      console.log('Created:', newProduct);
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdate = async (productId: string) => {
    try {
      const updatedProduct = await updateProduct.mutateAsync({
        id: productId,
        name: 'Updated Product Name'
      });
      console.log('Updated:', updatedProduct);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct.mutateAsync({ id: productId });
      console.log('Deleted product:', productId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Product</button>
      <button onClick={() => handleUpdate('prod-123')}>Update Product</button>
      <button onClick={() => handleDelete('prod-123')}>Delete Product</button>
    </div>
  );
}
```

---

## Advanced Integration Patterns

### **Complete CRUD Page**

```tsx
import { useState } from 'react';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';
import { PRODUCT_SCHEMA } from '@/features/products/products.schema';
import { Button } from '@/components/ui';

function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRowClick = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Product
        </Button>
      </div>

      {/* Table */}
      <AutoTable 
        resourceKey="products"
        onRowClick={handleRowClick}
        className="mb-6"
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
        onSuccess={() => setIsCreateModalOpen(false)}
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
        onSuccess={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
```

### **Master-Detail Pattern**

```tsx
function ProductMasterDetail() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Master: Category Tree */}
      <div className="w-1/3 border-r">
        <AutoTree 
          resourceKey="categories"
          onNodeSelect={(category) => setSelectedCategoryId(category.id)}
        />
      </div>

      {/* Detail: Products in Selected Category */}
      <div className="flex-1 p-6">
        <AutoTable 
          resourceKey="products"
          navigationContext={{ categoryId: selectedCategoryId }}
          customTitle={`Products in Category`}
        />
      </div>
    </div>
  );
}
```

### **Embedded Forms Pattern**

```tsx
function ProductWithDetails() {
  const [selectedProductId, setSelectedProductId] = useState(null);

  return (
    <div className="grid grid-cols-2 gap-6 h-screen">
      {/* Left: Product List */}
      <div>
        <AutoTable 
          resourceKey="products"
          onRowClick={(product) => setSelectedProductId(product.id)}
        />
      </div>

      {/* Right: Product Details Form */}
      <div>
        {selectedProductId && (
          <AutoForm
            schema={PRODUCT_SCHEMA}
            mode="edit"
            initialData={{ id: selectedProductId }}
            onSubmit={async (data) => {
              console.log('Product updated:', data);
            }}
            onCancel={() => setSelectedProductId(null)}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Performance Optimization

### **Component-Level Optimizations**

#### **Memoization**

```tsx
import { memo } from 'react';

// Memoize auto-generated components
const MemoizedAutoTable = memo(AutoTable);
const MemoizedAutoForm = memo(AutoForm);

function OptimizedProductsPage() {
  return (
    <MemoizedAutoTable 
      resourceKey="products"
      // Props that rarely change
    />
  );
}
```

#### **Lazy Loading**

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const AutoTable = lazy(() => import('@/components/auto-generated/table/auto-table'));
const AutoModal = lazy(() => import('@/components/auto-generated/modal/auto-modal'));

function LazyProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AutoTable resourceKey="products" />
    </Suspense>
  );
}
```

### **Data Optimization**

#### **Pagination**

```tsx
// AutoTable with pagination
<AutoTable 
  resourceKey="products"
  // Pagination automatically handled based on schema configuration
/>
```

#### **Filtering**

```tsx
// Pre-filter data to reduce load
<AutoTable 
  resourceKey="products"
  filters={{ 
    isActive: true,
    categoryId: selectedCategoryId
  }}
  // Only loads filtered data
/>
```

### **Cache Optimization**

The system automatically optimizes caching:

- ✅ **IndexedDB**: <50ms reads from local cache
- ✅ **TanStack Query**: Intelligent cache invalidation
- ✅ **Optimistic Updates**: Instant UI feedback
- ✅ **Background Sync**: Automatic data synchronization

---

## Troubleshooting

### **Common Integration Issues**

#### **Component Not Rendering**

```typescript
// ❌ Problem: Schema not registered
<AutoTable resourceKey="products" />  // Error: Resource not found

// ✅ Solution: Verify schema registration
// 1. Check resource-registry.ts has PRODUCT_SCHEMA
// 2. Check actionPrefix matches resourceKey
export const PRODUCT_SCHEMA: ResourceSchema = {
  actionPrefix: 'products',  // ✅ Must match resourceKey
  // ...
};
```

#### **Form Fields Not Showing**

```typescript
// ❌ Problem: Fields not configured for forms
{
  key: 'name',
  // Missing form configuration
}

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

#### **Table Columns Missing**

```typescript
// ❌ Problem: Fields not configured for tables
{
  key: 'name',
  // Missing table/mobile/desktop configuration
}

// ✅ Solution: Add display configuration
{
  key: 'name',
  mobile: {
    priority: 'high',
    showInTable: true  // ✅ Required for mobile table
  },
  desktop: {
    showInTable: true  // ✅ Required for desktop table
  }
}
```

### **Performance Issues**

#### **Slow Loading**

```typescript
// ❌ Problem: Loading too much data
<AutoTable resourceKey="products" />  // Loads all products

// ✅ Solution: Add filters
<AutoTable 
  resourceKey="products"
  filters={{ isActive: true }}  // Only load active products
  navigationContext={{ categoryId: selectedCategoryId }}  // Filter by category
/>
```

#### **Memory Leaks**

```typescript
// ❌ Problem: Not cleaning up subscriptions
useEffect(() => {
  const subscription = someObservable.subscribe();
  // Missing cleanup
}, []);

// ✅ Solution: Always clean up
useEffect(() => {
  const subscription = someObservable.subscribe();
  return () => subscription.unsubscribe();  // ✅ Cleanup
}, []);
```

### **Debug Tools**

#### **Component Debug Props**

```tsx
// Enable debug mode for troubleshooting
<AutoForm
  schema={PRODUCT_SCHEMA}
  mode="create"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  // Add debug props
  enableDebug={process.env.NODE_ENV === 'development'}
/>
```

#### **Network Debug**

```typescript
// Check action mappings
import { ACTION_MAPPINGS } from '@/lib/resource-system/resource-registry';

console.log('Available actions:', Object.keys(ACTION_MAPPINGS));
console.log('Product actions:', Object.keys(ACTION_MAPPINGS).filter(key => key.startsWith('products.')));
```

#### **IndexedDB Debug**

```typescript
// Check IndexedDB stores
import { getIndexedDBStoreConfigs } from '@/lib/resource-system/resource-registry';

const stores = getIndexedDBStoreConfigs();
console.log('Available stores:', stores.map(s => s.name));
console.log('Product store:', stores.find(s => s.name === 'products'));
```

---

## Integration Checklist

### **Pre-Integration**
- [ ] Schema registered in resource registry
- [ ] Required fields configured with form/table display options
- [ ] Validation rules defined
- [ ] IndexedDB key function implemented

### **Component Integration**
- [ ] Import correct component from auto-generated
- [ ] Pass required props (schema, resourceKey, etc.)
- [ ] Handle success/error callbacks
- [ ] Add loading states and error boundaries

### **Testing**
- [ ] Create operations work
- [ ] Read/List operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Context-aware auto-population works
- [ ] Junction creation works (if applicable)
- [ ] Responsive design works on mobile

### **Performance**
- [ ] Components memoized where appropriate
- [ ] Lazy loading implemented for heavy components
- [ ] Proper filters applied to reduce data load
- [ ] Cache invalidation working correctly

---

**Next**: Read [Advanced Patterns & Examples](./04-advanced-patterns.md) to learn about complex relationships, junction tables, and advanced schema patterns.
