# Auto-Table Component Documentation

**Complete schema-driven table system with inline forms and advanced table features**

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Schema Configuration](#schema-configuration)
- [Field Configuration](#field-configuration)
- [Context Menu System](#context-menu-system)
- [Table Features](#table-features)
- [Inline Forms](#inline-forms)
- [Junction Relationships](#junction-relationships)
- [Action System Integration](#action-system-integration)
- [Examples](#examples)
- [Advanced Features](#advanced-features)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

The Auto-Table component is a powerful, schema-driven table system that automatically generates complete CRUD interfaces from ResourceSchema definitions. It provides:

- **Schema-Driven**: Complete table generated from ResourceSchema
- **Clickable Columns**: Click on fields with `clickable: true` to enter edit mode instantly
- **Context Menu System**: Powerful right-click and dropdown menu actions
- **Inline Forms**: Add/edit forms slide down into the table
- **Advanced Table Features**: Bulk select, column filtering, sorting
- **Junction Relationships**: Automatic parent-child relationship management
- **Action System Integration**: Optimistic updates with <50ms IndexedDB reads
- **Mobile-First**: Responsive design with touch-optimized interactions
- **Branch-Aware**: Full support for workspace branching and Copy-on-Write

### Key Features

✅ **Clickable Columns**: Click on fields marked `clickable: true` to enter edit mode instantly  
✅ **Context Menu**: Right-click or click "..." button for powerful action menu  
✅ **Bulk Operations**: Select multiple rows with floating action menu  
✅ **Column Filtering**: Auto-focus filter inputs with real-time filtering  
✅ **Sortable Columns**: Click headers to sort with visual indicators  
✅ **Inline Editing**: Forms slide down instead of modal overlays  
✅ **Junction Tables**: Automatic parent-child relationship creation  
✅ **Optimistic Updates**: Instant UI feedback with background sync  
✅ **Offline Support**: Works with IndexedDB caching  

---

## Quick Start

### Basic Example

```tsx
import { AutoTable } from '@/components/auto-generated/auto-table';

function OfficesPage() {
  return (
    <AutoTable
      resourceKey="office"
      onRowClick={(office) => {
        router.push(`/offices/${office.id}`);
      }}
    />
  );
}
```

### With Parent Context (Junction Relationships)

```tsx
function NodeProcessesPage({ nodeId }: { nodeId: string }) {
  return (
    <AutoTable
      resourceKey="process"
      filters={{ nodeId }}  // Creates junction relationships automatically
      onRowClick={(process) => {
        router.push(`/processes/${process.id}`);
      }}
    />
  );
}
```

---

## Installation

### Prerequisites

```json
{
  "@tanstack/react-query": "^5.x",
  "react-hook-form": "^7.x",
  "next": "^14.x",
  "lucide-react": "^0.x"
}
```

### Component Dependencies

Ensure these UI components are available:

- `@/components/ui/table`
- `@/components/ui/button`
- `@/components/ui/checkbox`
- `@/components/ui/drop-down-menu`
- `@/components/ui/search-field`
- `@/components/ui/spinner`

---

## Basic Usage

### Component Props

```tsx
interface AutoTableProps {
  resourceKey: string;                    // Schema actionPrefix (e.g., 'office')
  filters?: Record<string, any>;         // Query filters (enables junction relationships)
  onRowClick?: (entity: any) => void;    // Handle row clicks
  className?: string;                    // Additional CSS classes
}
```

### Simple Implementation

```tsx
import { AutoTable } from '@/components/auto-generated/auto-table';

export function ResourceTable() {
  return (
    <div className="p-6">
      <AutoTable
        resourceKey="office"
        onRowClick={(office) => {
          console.log('Clicked office:', office);
        }}
        className="max-w-full"
      />
    </div>
  );
}
```

---

## Schema Configuration

### Complete Schema Example

```typescript
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const OFFICE_SCHEMA: ResourceSchema = {
  // Resource identity
  databaseKey: 'offices',
  modelName: 'Office',
  actionPrefix: 'office',

  // UI configuration
  display: {
    title: 'Offices',
    description: 'Office configurations and vendor integration settings',
    icon: 'building',
    color: 'blue'
  },

  // Field definitions with new structure
  fields: [
    {
      key: 'name',
      label: 'Office Name',
      type: 'text',
      required: true,
      // NEW: Simplified form/table structure
      form: {
        row: 1,
        width: 'half'
      },
      table: {
        width: 'lg'
      }
    },
    {
      key: 'vendor',
      label: 'Vendor',
      type: 'select',
      options: {
        static: [
          { value: 'SABRE', label: 'Sabre' },
          { value: 'AMADEUS', label: 'Amadeus' }
        ]
      },
      form: {
        row: 1,
        width: 'half'
      },
      table: {
        width: 'sm'
      }
    }
  ],

  // NEW: Table configuration
  table: {
    width: 'full',
    bulkSelect: true,
    columnFilter: true,
    sortableColumns: true,
    bulkSelectOptions: [
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: 'trash',
        handler: 'bulkDeleteOffices',
        className: 'text-red-600',
        confirmMessage: 'Are you sure you want to delete the selected offices?'
      },
      {
        id: 'activate',
        label: 'Activate Selected',
        icon: 'check',
        handler: 'bulkActivateOffices'
      }
    ]
  }
};
```

---

## Field Configuration

### New Field Structure

The field configuration has been simplified from the old mobile/desktop structure:

```typescript
// OLD (verbose and confusing)
{
  key: 'name',
  mobile: {
    priority: 'high',
    displayFormat: 'text',
    showInTable: true
  },
  desktop: {
    showInTable: true,
    tableWidth: 'lg',
    sortable: true
  }
}

// NEW (clean and intuitive)
{
  key: 'name',
  clickable: true,    // NEW: Makes this column clickable to enter edit mode
  form: {
    row: 1,
    width: 'half'
  },
  table: {
    width: 'lg'
  }
}
```

### Field Configuration Options

```typescript
interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: ValidationRule[];
  clickable?: boolean;                    // NEW: Makes this column clickable to enter edit mode
  
  // Form configuration
  form?: {
    row: number;                          // Row number (1-based)
    width: 'full' | 'half' | 'third';   // Width in row
    order?: number;                       // Order within row
    showInForm?: boolean;                 // Show in forms (default: true)
  };
  
  // Table configuration
  table?: {
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showInTable?: boolean;                // Show in tables (default: true)
    sortable?: boolean;                   // Enable sorting (default: true)
    filterable?: boolean;                 // Enable filtering (default: true)
    mobile?: {
      width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'hidden';
    };
  };
}
```

### Field Examples

#### Basic Text Field

```typescript
{
  key: 'name',
  label: 'Office Name',
  type: 'text',
  required: true,
  placeholder: 'Enter office name...',
  form: {
    row: 1,
    width: 'half'
  },
  table: {
    width: 'lg'
  }
}
```

#### Select Field with Options

```typescript
{
  key: 'vendor',
  label: 'Vendor',
  type: 'select',
  required: true,
  options: {
    static: [
      { value: 'SABRE', label: 'Sabre' },
      { value: 'AMADEUS', label: 'Amadeus' }
    ]
  },
  form: {
    row: 1,
    width: 'half'
  },
  table: {
    width: 'sm'
  }
}
```

#### Hidden Field

```typescript
{
  key: 'tenantId',
  label: 'Tenant ID',
  type: 'text',
  required: true,
  form: {
    row: 1,
    width: 'full',
    showInForm: false    // Hidden from forms
  },
  table: {
    width: 'sm',
    showInTable: false   // Hidden from tables
  }
}
```

---

## Context Menu System

### Context Menu Configuration

The table now supports a powerful context menu system that replaces individual action buttons:

```typescript
table: {
  contextMenu: [
    {
      id: 'edit',
      label: 'Edit Office',
      icon: 'edit',
      action: 'edit'
    },
    {
      id: 'duplicate',
      label: 'Duplicate Office',
      icon: 'copy',
      action: 'duplicate'
    },
    {
      id: 'separator1',
      label: '',
      action: '',
      separator: true
    },
    {
      id: 'delete',
      label: 'Delete Office',
      icon: 'trash',
      action: 'delete',
      className: 'text-red-600',
      confirmMessage: 'Are you sure you want to delete this office?'
    }
  ]
}
```

### Context Menu Interface

```typescript
interface ContextMenuItem {
  id: string;                    // Unique identifier
  label: string;                 // Display text
  icon?: string;                 // Icon name (edit, trash, copy, etc.)
  action: string;                // Action to execute
  className?: string;            // CSS classes for styling
  confirmMessage?: string;       // Confirmation dialog message
  separator?: boolean;           // Renders as separator line
}
```

### Available Actions

- **Core Actions**: `edit`, `delete`, `duplicate`
- **Office Actions**: `testConnection`, `viewCustomers`, `viewActivity`
- **Branching Actions**: `branchFrom`, `mergeTo`, `viewHistory`, `compareBranches`, `switchBranch`
- **Custom Actions**: Define your own action handlers

### Usage

1. **Dropdown Menu**: Click the "..." button in the Actions column
2. **Right-click**: Right-click anywhere on a table row (logs to console for now)
3. **Clickable Columns**: Click on fields with `clickable: true` to enter edit mode instantly

---

## Table Features

### Bulk Select

Enable bulk selection with floating action menu:

```typescript
table: {
  bulkSelect: true,
  bulkSelectOptions: [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: 'trash',
      handler: 'bulkDeleteOffices',
      className: 'text-red-600',
      confirmMessage: 'Are you sure you want to delete the selected offices?'
    },
    {
      id: 'activate',
      label: 'Activate Selected',
      icon: 'check',
      handler: 'bulkActivateOffices'
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: 'download',
      handler: 'bulkExportOffices'
    }
  ]
}
```

**Features:**
- Checkbox column for multi-select
- Select all/none functionality
- Floating action bar slides in at bottom center
- Smooth animations and transitions
- Configurable bulk actions with icons and confirmation

### Column Filtering

Enable real-time column filtering:

```typescript
table: {
  columnFilter: true
}
```

**Features:**
- Filter icon in each column header
- Auto-focus filter input when clicked
- Real-time filtering as user types
- Visual indicator when filter is active
- Dropdown interface for better UX

### Sortable Columns

Enable column sorting:

```typescript
table: {
  sortableColumns: true
}
```

**Features:**
- Click column headers to sort
- Visual arrows for sort direction
- Toggles between asc/desc/none
- Remembers sort state
- Can be disabled per field

### Table Width Configuration

```typescript
table: {
  width: 'full'  // Options: 'sm', 'md', 'lg', 'xl', 'full'
}
```

---

## Inline Forms

### Form Integration

Forms slide down into the table instead of opening modals:

```typescript
// Automatically integrated - no additional configuration needed
// Forms use the same schema field definitions
```

### Form Features

- **Slide Animation**: Forms slide down smoothly
- **Same Schema**: Uses identical field definitions
- **Validation**: Real-time validation with error messages
- **Optimistic Updates**: Instant UI feedback
- **Cancel/Save**: Clear actions with loading states

### Form Layout

The form layout uses the same `form` configuration from fields:

```typescript
{
  key: 'name',
  form: {
    row: 1,          // First row
    width: 'half',   // Takes 50% of row
    order: 1         // First field in row
  }
}
```

---

## Junction Relationships

### Automatic Discovery

When you provide filters with an ID ending in 'Id', junction relationships are automatically discovered:

```tsx
// This automatically creates node-process junction relationships
<AutoTable
  resourceKey="process"
  filters={{ nodeId: 'node-123' }}
/>
```

### Supported Junction Types

The system automatically detects and creates these relationships:

- **Node ↔ Process**: `node_processes` junction table
- **Process ↔ Rule**: `process_rules` junction table
- **Node ↔ Workflow**: `node_workflows` junction table
- **Workflow ↔ Process**: `workflow_processes` junction table

### How It Works

1. **Detection**: Filter with `nodeId` detected → parent = node, child = process
2. **Schema Lookup**: Finds junction schema in `/junctions/` folder
3. **Relationship Creation**: When new entity created, junction record auto-created
4. **Cache Management**: Junction hook handles cache invalidation

### Example Junction Flow

```tsx
// 1. User navigates to /nodes/123/processes
<AutoTable
  resourceKey="process"
  filters={{ nodeId: 'node-123' }}
/>

// 2. User clicks "Add Process" and fills form
// 3. Process created successfully with ID 'process-456'
// 4. Junction relationship auto-created:
//    { nodeId: 'node-123', processId: 'process-456', sequence: 0 }
// 5. Cache invalidated for both processes and node-processes
```

---

## Action System Integration

### Automatic Integration

The Auto-Table automatically integrates with the action system:

```typescript
// These actions are automatically available:
// - {resourceKey}.list (for data fetching)
// - {resourceKey}.create (for form submission)
// - {resourceKey}.update (for editing)
// - {resourceKey}.delete (for deletion)
```

### Data Fetching

```typescript
// Automatic data fetching with caching
const { data, isLoading, error } = useResourceList(resourceKey, filters, {
  staleTime: 300000,        // 5 minutes
  fallbackToCache: true     // Use IndexedDB if offline
});
```

### Optimistic Updates

All mutations use optimistic updates:

```typescript
// Create operation
const createMutation = useActionMutation(`${resourceKey}.create`, {
  onSuccess: (data) => {
    // Cache automatically updated
    // Form automatically closed
  }
});

// Update operation
const updateMutation = useActionMutation(`${resourceKey}.update`, {
  onSuccess: (data) => {
    // Cache automatically updated
    // Form automatically closed
  }
});
```

### Cache Management

- **Automatic Invalidation**: Cache updated after mutations
- **Optimistic Updates**: UI updates immediately
- **Background Sync**: Server sync happens in background
- **Offline Support**: Works with IndexedDB when offline

---

## Examples

### Basic Office Table

```tsx
import { AutoTable } from '@/components/auto-generated/auto-table';

export function OfficesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Offices</h1>
        <p className="text-muted-foreground">
          Manage office locations and configurations
        </p>
      </div>

      <AutoTable
        resourceKey="office"
        onRowClick={(office) => {
          router.push(`/offices/${office.id}`);
        }}
        className="rounded-lg border"
      />
    </div>
  );
}
```

### Node Processes with Junction

```tsx
export function NodeProcessesPage({ nodeId }: { nodeId: string }) {
  const { data: node } = useResourceItem('node', nodeId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {node?.name} - Processes
        </h1>
        <p className="text-muted-foreground">
          Manage processes for this node
        </p>
      </div>

      <AutoTable
        resourceKey="process"
        filters={{ nodeId }}  // Enables junction relationships
        onRowClick={(process) => {
          router.push(`/processes/${process.id}`);
        }}
      />
    </div>
  );
}
```

### Custom Filtered Table

```tsx
export function FilteredOfficesTable() {
  const [vendor, setVendor] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const filters = useMemo(() => ({
    ...(vendor && { vendor }),
    ...(isActive !== undefined && { isActive })
  }), [vendor, isActive]);

  return (
    <div className="space-y-4">
      {/* Custom filters */}
      <div className="flex gap-4">
        <select
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Vendors</option>
          <option value="SABRE">Sabre</option>
          <option value="AMADEUS">Amadeus</option>
        </select>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active Only
        </label>
      </div>

      <AutoTable
        resourceKey="office"
        filters={filters}
        onRowClick={(office) => {
          router.push(`/offices/${office.id}`);
        }}
      />
    </div>
  );
}
```

---

## Advanced Features

### Dynamic Loading States

```tsx
function LoadingAwareTable() {
  return (
    <AutoTable
      resourceKey="office"
      onRowClick={(office) => {
        // Show loading indicator
        setLoading(true);
        router.push(`/offices/${office.id}`);
      }}
    />
  );
}
```

### Error Handling

```tsx
function RobustTable() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong with the table</div>}
    >
      <AutoTable
        resourceKey="office"
        onRowClick={(office) => {
          router.push(`/offices/${office.id}`);
        }}
      />
    </ErrorBoundary>
  );
}
```

### Custom Row Actions

Row actions are automatically generated from the schema, but you can customize them:

```typescript
// In your schema
actions: {
  create: true,
  update: true,
  delete: true,
  custom: [
    {
      id: 'testConnection',
      label: 'Test Connection',
      icon: 'wifi',
      handler: 'testOfficeConnection'
    }
  ]
}
```

---

## Performance Optimization

### Caching Strategy

The Auto-Table implements intelligent caching:

- **IndexedDB First**: <50ms reads from local cache
- **Background Sync**: Server updates happen in background
- **Optimistic Updates**: UI updates immediately
- **Smart Invalidation**: Only relevant caches are cleared

### Performance Tips

1. **Limit Dynamic Fields**: Use static options when possible
2. **Efficient Filters**: Keep filter objects stable
3. **Pagination**: Consider implementing pagination for large datasets
4. **Debounced Search**: Built-in search debouncing
5. **Lazy Loading**: Components load only when needed

### Memory Management

- Automatic cleanup of event listeners
- Efficient re-rendering with React.memo
- Optimized field rendering
- Junction hook cleanup

---

## Troubleshooting

### Common Issues

#### Table Not Loading Data

**Problem**: Table shows loading state indefinitely

**Solutions**:
1. Check resourceKey matches schema actionPrefix
2. Verify API endpoint exists
3. Check network requests in DevTools
4. Ensure proper authentication

```tsx
// Debug data loading
const { data, isLoading, error } = useResourceList('office', {});
console.log('Table data:', { data, isLoading, error });
```

#### Bulk Actions Not Working

**Problem**: Bulk actions don't trigger

**Solutions**:
1. Check bulkSelectOptions configuration
2. Verify handler functions exist
3. Check permissions
4. Test with single selection first

```typescript
// Debug bulk actions
table: {
  bulkSelect: true,
  bulkSelectOptions: [
    {
      id: 'delete',
      label: 'Delete Selected',
      handler: 'bulkDeleteOffices',  // Ensure this handler exists
      confirmMessage: 'Are you sure?' // Optional confirmation
    }
  ]
}
```

#### Junction Relationships Not Created

**Problem**: Parent-child relationships not auto-created

**Solutions**:
1. Check filter format (must end with 'Id')
2. Verify junction schema exists
3. Check console for junction errors
4. Ensure proper permissions

```tsx
// Debug junction relationships
<AutoTable
  resourceKey="process"
  filters={{ nodeId: 'node-123' }}  // Must end with 'Id'
/>
```

#### Forms Not Submitting

**Problem**: Inline forms won't submit

**Solutions**:
1. Check form validation errors
2. Verify required fields are filled
3. Check network connectivity
4. Review action system integration

### Debug Mode

Enable debug logging:

```tsx
// Add to component
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('AutoTable debug:', {
      resourceKey,
      filters,
      data,
      isLoading,
      error
    });
  }
}, [resourceKey, filters, data, isLoading, error]);
```

---

## API Reference

### AutoTable Component

```typescript
interface AutoTableProps {
  resourceKey: string;                    // Schema actionPrefix
  filters?: Record<string, any>;         // Query filters
  onRowClick?: (entity: any) => void;    // Row click handler
  className?: string;                    // CSS classes
}
```

### ResourceSchema Interface

```typescript
interface ResourceSchema {
  databaseKey: string;                   // Database/IndexedDB key
  modelName: string;                     // Model name
  actionPrefix: string;                  // Action prefix
  display: DisplayConfig;                // UI display settings
  fields: FieldSchema[];                 // Field definitions
  table?: TableConfig;                   // Table configuration
  actions?: ActionConfig;                // Action configuration
}
```

### TableConfig Interface

```typescript
interface TableConfig {
  width: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  bulkSelect?: boolean;
  columnFilter?: boolean;
  sortableColumns?: boolean;
  bulkSelectOptions?: BulkSelectOption[];
}
```

### BulkSelectOption Interface

```typescript
interface BulkSelectOption {
  id: string;
  label: string;
  icon?: string;
  handler: string;
  className?: string;
  confirmMessage?: string;
}
```

### FieldSchema Interface

```typescript
interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: ValidationRule[];
  options?: FieldOptions;
  form?: FieldFormConfig;
  table?: FieldTableConfig;
}
```

### FieldFormConfig Interface

```typescript
interface FieldFormConfig {
  row: number;
  width: 'full' | 'half' | 'third';
  order?: number;
  showInForm?: boolean;
}
```

### FieldTableConfig Interface

```typescript
interface FieldTableConfig {
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showInTable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  mobile?: {
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'hidden';
  };
}
```

---

## Best Practices

### Schema Design

1. **Clear Field Names**: Use descriptive field keys and labels
2. **Logical Grouping**: Group related fields in same rows
3. **Appropriate Widths**: Use full width for long text, half for pairs
4. **Required Fields**: Mark required fields appropriately
5. **Validation**: Add proper validation rules

### Performance

1. **Stable Filters**: Keep filter objects stable to avoid re-renders
2. **Efficient Queries**: Use specific filters to reduce data load
3. **Caching**: Leverage built-in caching for better performance
4. **Lazy Loading**: Load components only when needed

### User Experience

1. **Loading States**: Built-in loading states for better UX
2. **Error Handling**: Proper error boundaries and messages
3. **Bulk Actions**: Provide useful bulk operations
4. **Search/Filter**: Enable search and filtering for large datasets
5. **Mobile Support**: Responsive design works on all devices

### Security

1. **Permissions**: Implement proper permission checks
2. **Validation**: Use both client and server validation
3. **Sanitization**: Sanitize user input appropriately
4. **Branch Isolation**: Leverage branch-aware operations

---

## Migration Guide

### From EntityTable

To migrate from existing EntityTable components:

1. **Create Schema**: Define ResourceSchema for your entity
2. **Field Mapping**: Convert field definitions to new format
3. **Replace Component**: Replace EntityTable with AutoTable
4. **Update Props**: Use new prop structure
5. **Test Functionality**: Verify all features work correctly

### Field Structure Migration

```typescript
// OLD: EntityTable field
{
  key: 'name',
  header: 'Name',
  width: 'lg',
  sortable: true,
  filterable: true
}

// NEW: AutoTable field
{
  key: 'name',
  label: 'Name',
  type: 'text',
  form: {
    row: 1,
    width: 'half'
  },
  table: {
    width: 'lg'
  }
}
```

---

This documentation covers the complete Auto-Table system with all current features. The component provides a powerful, schema-driven approach to table management with advanced features like bulk operations, filtering, sorting, and automatic junction relationship handling. 