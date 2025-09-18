# AutoForm Component Documentation

This document is now split for maintainability. Start here, then drill into focused pages under `docs/auto-generated/form/`.

Updated docs:
- Overview: `docs/auto-generated/form/overview.md`
- API (Props & Utilities): `docs/auto-generated/form/api.md`
- Validation & Layout: `docs/auto-generated/form/validation-and-layout.md`
- Fields & Rendering: `docs/auto-generated/form/fields.md`
- Context & Defaults: `docs/auto-generated/form/context-and-defaults.md`
- Submission & Actions: `docs/auto-generated/form/submission-and-actions.md`
- Debugging: `docs/auto-generated/form/debugging.md`

— Legacy guide below —

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Schema Configuration](#schema-configuration)
- [Field Types](#field-types)
- [Form Layout System](#form-layout-system)
- [Context-Aware Auto-Population](#context-aware-auto-population)
- [Static vs Dynamic Options](#static-vs-dynamic-options)
- [Validation System](#validation-system)
- [Action System Integration](#action-system-integration)
- [Branch-Aware Operations](#branch-aware-operations)
- [Examples](#examples)
- [Advanced Features](#advanced-features)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

The AutoForm component is a powerful, schema-driven form generator that creates complete, production-ready forms from ResourceSchema definitions. It provides:

- **Zero-Code Forms**: Auto-generated from schema configuration
- **Action System Integration**: Optimistic updates with <50ms IndexedDB reads
- **Dynamic Data**: Real-time dropdown population from other resources
- **Flexible Layouts**: 1-3 fields per row with responsive design
- **Complete Validation**: React Hook Form with Zod validation
- **Branch-Aware**: Full support for workspace branching and Copy-on-Write
- **Context-Aware**: Auto-population from session, navigation, and component context
- **Mobile-First**: Responsive design optimized for all devices
- **Offline Support**: Works with IndexedDB caching and background sync

### Key Benefits

✅ **DRY Principle**: Single schema generates forms, tables, and modals  
✅ **Type Safety**: Full TypeScript support with generated types  
✅ **Real-time Updates**: Dynamic options stay synchronized with data  
✅ **Offline Support**: Works with IndexedDB caching and background sync  
✅ **Optimistic Updates**: Instant UI feedback with background sync  
✅ **Branch Isolation**: Complete workspace branching support  

---

## Quick Start

### Basic Example

```tsx
import { AutoForm } from '@/components/auto-generated/auto-form';
import { OFFICE_SCHEMA } from '@/features/offices/offices.schema';

function CreateOfficeForm() {
  const handleSubmit = async (data: Record<string, any>) => {
    console.log('Form data:', data);
    // Handle form submission
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AutoForm
      schema={OFFICE_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### With Initial Data (Edit Mode)

```tsx
function EditOfficeForm({ office }: { office: Office }) {
  const handleSubmit = async (data: Record<string, any>) => {
    // Update logic here
  };

  return (
    <AutoForm
      schema={OFFICE_SCHEMA}
      mode="edit"
      initialData={office}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
```

---

## Installation

### Prerequisites

The AutoForm component requires these dependencies:

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "@tanstack/react-query": "^5.x",
  "next": "^14.x"
}
```

### Component Dependencies

Ensure these UI components are available:

- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/text-area`
- `@/components/ui/switch`
- `@/components/ui/select`
- `@/components/ui/label`
- `@/components/ui/spinner`

---

## Basic Usage

### Component Props

```tsx
interface AutoFormProps {
  schema: ResourceSchema;           // Schema definition
  mode: 'create' | 'edit';         // Form mode
  initialData?: Record<string, any>; // Pre-populate data (edit mode)
  onSubmit: (data: Record<string, any>) => Promise<void>; // Submit handler
  onCancel: () => void;            // Cancel handler
  isLoading?: boolean;             // Loading state
  className?: string;              // Additional CSS classes
}
```

### Basic Implementation

```tsx
import { AutoForm } from '@/components/auto-generated/auto-form';
import { useResourceCreate } from '@/hooks/use-action-api';
import { MY_RESOURCE_SCHEMA } from './my-resource.schema';

function MyForm() {
  const createResource = useResourceCreate('myResource');

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await createResource.mutateAsync(data);
      router.push('/my-resources');
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <AutoForm
      schema={MY_RESOURCE_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      isLoading={createResource.isPending}
      className="max-w-4xl mx-auto p-6"
    />
  );
}
```

---

## Schema Configuration

### Resource Schema Structure

```typescript
export const MY_SCHEMA: ResourceSchema = {
  // Resource identity
  databaseKey: 'myResource',
  modelName: 'MyResource',
  actionPrefix: 'myResource',

  // UI configuration
  display: {
    title: 'My Resources',
    description: 'Manage your resources',
    icon: 'folder',
    color: 'blue'
  },

  // Form configuration
  form: {
    width: 'lg',           // Form width: 'sm', 'md', 'lg', 'xl', 'full'
    layout: 'compact',     // Layout style
    showDescriptions: true // Show field descriptions
  },

  // Field definitions
  fields: [
    // Field configurations here
  ]
};
```

### Field Schema Structure

```typescript
interface FieldSchema {
  key: string;                    // Database field name
  label: string;                  // Display label
  type: FieldType;               // Field type (see Field Types section)
  required?: boolean;            // Whether field is required
  placeholder?: string;          // Input placeholder
  description?: string;          // Help text
  validation?: ValidationRule[]; // Validation rules
  options?: FieldOptions;        // Options for select fields
  tab?: string;                  // Tab grouping
  form?: FieldFormConfig;            // Form layout configuration
  table?: FieldTableConfig;          // Table display configuration
}
```

### Form Configuration

```typescript
interface FormConfig {
  row: number;                    // Row number (1-based)
  width: 'full' | 'half' | 'third'; // Field width
  order?: number;                 // Order within row
  showInForm?: boolean;          // Show in forms (default: true)
}
```

---

## Field Types

The AutoForm component supports all standard field types:

### Text Fields

```typescript
{
  key: 'name',
  label: 'Name',
  type: 'text',
  required: true,
  placeholder: 'Enter name...',
  description: 'The display name for this resource',
  form: {
    row: 1,
    width: 'half'
  },
  validation: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Minimum 2 characters' },
    { type: 'maxLength', value: 100, message: 'Maximum 100 characters' }
  ]
}
```

### Email Fields

```typescript
{
  key: 'email',
  label: 'Email Address',
  type: 'email',
  placeholder: 'user@example.com',
  form: {
    row: 2,
    width: 'half'
  },
  validation: [
    { type: 'email', message: 'Please enter a valid email' }
  ]
}
```

### Number Fields

```typescript
{
  key: 'quantity',
  label: 'Quantity',
  type: 'number',
  placeholder: 'Enter quantity...',
  form: {
    row: 2,
    width: 'half'
  },
  validation: [
    { type: 'min', value: 1, message: 'Minimum quantity is 1' },
    { type: 'max', value: 1000, message: 'Maximum quantity is 1000' }
  ]
}
```

### Textarea Fields

```typescript
{
  key: 'description',
  label: 'Description',
  type: 'textarea',
  placeholder: 'Enter description...',
  description: 'Additional details about this resource',
  form: {
    row: 3,
    width: 'full'
  },
  validation: [
    { type: 'maxLength', value: 1000, message: 'Maximum 1000 characters' }
  ]
}
```

### Switch Fields

```typescript
{
  key: 'isActive',
  label: 'Active',
  type: 'switch',
  description: 'Whether this resource is currently active',
  form: {
    row: 4,
    width: 'half'
  }
}
```

### Select Fields

```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select',
  form: {
    row: 4,
    width: 'half'
  },
  options: {
    static: [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' }
    ]
  }
}
```

### Multi-Select Fields

```typescript
{
  key: 'tags',
  label: 'Tags',
  type: 'multiSelect',
  form: {
    row: 5,
    width: 'full'
  },
  options: {
    dynamic: {
      resource: 'tags',
      valueField: 'id',
      labelField: 'name',
      filter: (item) => item.isActive
    }
  }
}
```

### Date Fields

```typescript
{
  key: 'dueDate',
  label: 'Due Date',
  type: 'date',
  form: {
    row: 6,
    width: 'half'
  }
}
```

### URL Fields

```typescript
{
  key: 'website',
  label: 'Website',
  type: 'url',
  placeholder: 'https://example.com',
  form: {
    row: 6,
    width: 'half'
  },
  validation: [
    { type: 'url', message: 'Please enter a valid URL' }
  ]
}
```

### Rich Text Fields

```typescript
{
  key: 'content',
  label: 'Content',
  type: 'richText',
  form: {
    row: 7,
    width: 'full'
  },
  validation: [
    { type: 'required', message: 'Content is required' }
  ]
}
```

---

## Form Layout System

### Row-Based Layout

The AutoForm uses a flexible row-based layout system:

```typescript
// Example: 4-row office form layout
const fields = [
  // Row 1: Name + Office ID (50% each)
  {
    key: 'name',
    form: { row: 1, width: 'half', order: 1 }
  },
  {
    key: 'officeId', 
    form: { row: 1, width: 'half', order: 2 }
  },

  // Row 2: Description (100% width)
  {
    key: 'description',
    form: { row: 2, width: 'full' }
  },

  // Row 3: City + State + Country (33% each)
  {
    key: 'city',
    form: { row: 3, width: 'third', order: 1 }
  },
  {
    key: 'state',
    form: { row: 3, width: 'third', order: 2 }
  },
  {
    key: 'country',
    form: { row: 3, width: 'third', order: 3 }
  },

  // Row 4: Manager + Active (50% each)
  {
    key: 'managerId',
    form: { row: 4, width: 'half', order: 1 }
  },
  {
    key: 'isActive',
    form: { row: 4, width: 'half', order: 2 }
  }
];
```

### Width Options

- **`full`**: 100% width (entire row)
- **`half`**: 50% width (2 fields per row)
- **`third`**: 33% width (3 fields per row)

### Tab Organization

Group fields into tabs for better organization:

```typescript
{
  key: 'name',
  tab: 'General',
  form: { row: 1, width: 'half' }
},
{
  key: 'address',
  tab: 'Location',
  form: { row: 1, width: 'full' }
},
{
  key: 'settings',
  tab: 'Configuration',
  form: { row: 1, width: 'full' }
}
```

### Responsive Behavior

The layout automatically adapts to screen size:

- **Desktop**: Uses configured layout
- **Tablet**: Adjusts to 2 columns max
- **Mobile**: Stacks fields vertically

---

## Context-Aware Auto-Population

The AutoForm supports intelligent auto-population of fields from various context sources, eliminating the need for users to manually enter commonly known values like tenant IDs, branch IDs, or current selection contexts.

### Overview

Context-aware auto-population allows fields to be automatically filled from:
- **Session Data**: User ID, tenant ID, branch context
- **Navigation Context**: Current node, parent ID, selected items
- **Component Context**: Parent data, context IDs
- **Auto-Generated Values**: Timestamps, UUIDs

### Configuration

Add the `autoValue` property to any field schema:

```typescript
{
  key: 'tenantId',
  label: 'Tenant ID',
  type: 'text',
  required: true,
  autoValue: {
    source: 'session.user.tenantId',
    required: true
  },
  form: {
    showInForm: false // Hide from UI since it's auto-populated
  }
}
```

### Context Sources

#### Session Sources
Extract values from the current user session:

```typescript
// User's tenant ID
autoValue: {
  source: 'session.user.tenantId',
  required: true
}

// Current branch ID
autoValue: {
  source: 'session.user.branchContext.currentBranchId',
  fallback: 'main'
}

// Default branch ID
autoValue: {
  source: 'session.user.branchContext.defaultBranchId',
  fallback: 'main'
}

// Current user ID
autoValue: {
  source: 'session.user.id',
  required: true
}
```

#### Navigation Sources
Extract values from navigation context:

```typescript
// Current node ID (from tree navigation)
autoValue: {
  source: 'navigation.nodeId',
  required: true
}

// Parent node ID (for hierarchical creation)
autoValue: {
  source: 'navigation.parentId'
}

// Selected item ID
autoValue: {
  source: 'navigation.selectedId'
}
```

#### Component Sources
Extract values from component props:

```typescript
// Parent data object
autoValue: {
  source: 'component.parentData',
  transform: (parentData) => parentData?.id
}

// Context ID passed to component
autoValue: {
  source: 'component.contextId'
}
```

#### Auto-Generated Sources
Generate values automatically:

```typescript
// Current timestamp
autoValue: {
  source: 'auto.timestamp'
}

// UUID
autoValue: {
  source: 'auto.uuid'
}

// Node short ID (e.g., "N4B7X2")
autoValue: {
  source: 'auto.nodeShortId'
}

// Rule short ID (e.g., "R8K9L3")
autoValue: {
  source: 'auto.ruleShortId'
}
```

### Static Default Values

For fields that need static default values (not context-dependent), use the `defaultValue` property:

```typescript
{
  key: 'type',
  label: 'Type',
  type: 'select',
  required: true,
  defaultValue: 'NODE', // Static default
  form: { showInForm: false },
  options: {
    static: [
      { value: 'NODE', label: 'Node' },
      { value: 'CUSTOMER', label: 'Customer' }
    ]
  }
}
```

### Advanced Configuration

#### Fallback Values
Provide fallback values when context is unavailable:

```typescript
autoValue: {
  source: 'session.user.branchContext.currentBranchId',
  fallback: 'main',
  required: true
}
```

#### Value Transformation
Transform values before setting:

```typescript
autoValue: {
  source: 'session.user.id',
  transform: (userId) => `user_${userId}`,
  required: true
}
```

#### Conditional Requirements
Mark auto-values as required for validation:

```typescript
autoValue: {
  source: 'navigation.nodeId',
  required: true // Will cause validation error if missing
}
```

#### Conditional Auto-Population
For optional fields that should only be populated when context values are available:

```typescript
{
  key: 'nodeId',
  label: 'Node ID',
  type: 'text',
  required: false, // Optional field
  autoValue: {
    source: 'navigation.nodeId',
    onlyIfAvailable: true // Only populate if value exists and is not empty
  }
}
```

**Use Cases:**
- **Context tracking**: Track creation context without direct relationships
- **Hierarchical entities**: Parent ID only populated when creating from parent context
- **Audit fields**: Auto-populate based on available context

**Note:** For entities like Rules and Processes, relationships with Nodes are handled through junction tables (`RuleIgnore`, `ProcessRule`, `NodeProcess`) rather than direct foreign key fields.

#### Custom Conditions
Apply custom logic to determine when auto-population should occur:

```typescript
{
  key: 'processId',
  required: false,
  autoValue: {
    source: 'navigation.selectedId',
    condition: (value) => {
      // Only apply if the selectedId looks like a process ID
      return value && typeof value === 'string' && value.startsWith('process-');
    }
  }
}
```

### Complete Example

```typescript
// Office schema with context-aware auto-population
export const OFFICE_SCHEMA: ResourceSchema = {
  // ... other config
  fields: [
    // Auto-populated system fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.tenantId',
        required: true
      },
      form: { showInForm: false }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        fallback: 'main',
        required: true
      },
      form: { showInForm: false }
    },
    {
      key: 'nodeId',
      label: 'Associated Node',
      type: 'text',
      required: true,
      autoValue: {
        source: 'navigation.nodeId',
        required: true
      },
      form: { showInForm: false }
    },
    
    // User-visible fields
    {
      key: 'name',
      label: 'Office Name',
      type: 'text',
      required: true,
      form: { row: 1, width: 'half' }
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      autoValue: {
        source: 'session.user.id',
        required: true
      },
      form: { showInForm: false }
    }
  ]
};
```

### Component Integration

Pass context to the AutoForm component:

```typescript
function CreateOfficeForm() {
  const router = useRouter();
  const { nodeId } = router.query;
  
  return (
    <AutoForm
      schema={OFFICE_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      // Pass navigation context
      navigationContext={{
        nodeId: nodeId as string,
        selectedId: nodeId as string
      }}
      // Pass component context
      componentContext={{
        contextId: 'office-creation'
      }}
    />
  );
}
```

### Benefits

✅ **Reduces User Input**: Automatically fills system fields  
✅ **Prevents Errors**: Eliminates manual entry of complex IDs  
✅ **Context Awareness**: Maintains relationship integrity  
✅ **Flexible Sources**: Multiple context sources available  
✅ **Validation Ready**: Integrates with form validation  
✅ **Debug Friendly**: Clear logging of resolved values  

### Debugging

The system provides detailed logging of context resolution:

```typescript
// Console output when creating an office
🔧 [Context Resolver] session.user.tenantId → tenant_123
🔧 [Context Resolver] session.user.branchContext.currentBranchId → branch_456
🔧 [Context Resolver] navigation.nodeId → node_789
🔧 [Context Resolver] Resolved auto-values: {
  tenantId: 'tenant_123',
  branchId: 'branch_456',
  nodeId: 'node_789'
}
```

---

## Static vs Dynamic Options

### Static Options

Static options are hardcoded in the schema and render immediately:

```typescript
{
  key: 'priority',
  label: 'Priority',
  type: 'select',
  options: {
    static: [
      { value: 'low', label: 'Low Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'high', label: 'High Priority' },
      { value: 'urgent', label: 'Urgent' }
    ]
  }
}
```

**Pros**: Instant rendering, no API calls, simple configuration  
**Cons**: Static data, requires manual updates

### Dynamic Options

Dynamic options are fetched from other resources in real-time:

```typescript
{
  key: 'assigneeId',
  label: 'Assignee',
  type: 'select',
  options: {
    dynamic: {
      resource: 'users',              // Resource to fetch from
      valueField: 'id',               // Field to use as value
      labelField: 'displayName',      // Field to display as label
      displayField: 'email',          // Additional display info
      filter: (item) => {             // Filter function
        return item.isActive && 
               item.department === 'engineering';
      }
    }
  }
}
```

**Pros**: Real-time data, automatic updates, relationship management  
**Cons**: Requires API calls, loading states

### Dynamic Option Features

#### Basic Configuration

```typescript
dynamic: {
  resource: 'credentials',           // Target resource
  valueField: 'id',                 // Value field
  labelField: 'name'                // Display field
}
```

#### Enhanced Display

```typescript
dynamic: {
  resource: 'users',
  valueField: 'id',
  labelField: 'displayName',
  displayField: 'email'             // Shows "John Doe (john@example.com)"
}
```

#### Complex Filtering

```typescript
dynamic: {
  resource: 'projects',
  valueField: 'id',
  labelField: 'name',
  filter: (item) => {
    return item.isActive && 
           item.status === 'in_progress' &&
           item.team?.includes(currentUserId);
  }
}
```

#### Self-Referential

```typescript
dynamic: {
  resource: 'categories',
  valueField: 'id',
  labelField: 'name',
  filter: (item) => {
    return item.type === 'parent' && 
           item.id !== currentItem?.id;  // Exclude self
  }
}
```

### Branch-Aware Dynamic Options

Dynamic options automatically respect branch context:

```typescript
// Options are automatically filtered by current branch
dynamic: {
  resource: 'users',
  valueField: 'id',
  labelField: 'name'
  // Branch filtering applied automatically
}
```

---

## Validation System

### Built-in Validation Rules

```typescript
validation: [
  { type: 'required', message: 'This field is required' },
  { type: 'minLength', value: 3, message: 'Minimum 3 characters' },
  { type: 'maxLength', value: 100, message: 'Maximum 100 characters' },
  { type: 'pattern', value: '^[A-Z0-9]+$', message: 'Only uppercase letters and numbers' },
  { type: 'email', message: 'Please enter a valid email address' },
  { type: 'url', message: 'Please enter a valid URL' },
  { type: 'min', value: 0, message: 'Minimum value is 0' },
  { type: 'max', value: 999, message: 'Maximum value is 999' }
]
```

### Field-Specific Validation

```typescript
// Email field with validation
{
  key: 'email',
  type: 'email',
  validation: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Please enter a valid email address' }
  ]
}

// Password field with pattern
{
  key: 'password',
  type: 'text',
  validation: [
    { type: 'required', message: 'Password is required' },
    { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
    { type: 'pattern', value: '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])', message: 'Password must contain lowercase, uppercase, and number' }
  ]
}

// Numeric field with range
{
  key: 'quantity',
  type: 'number',
  validation: [
    { type: 'required', message: 'Quantity is required' },
    { type: 'min', value: 1, message: 'Quantity must be at least 1' },
    { type: 'max', value: 1000, message: 'Quantity cannot exceed 1000' }
  ]
}
```

### Real-time Validation

The AutoForm provides real-time validation:

- **On Change**: Validates fields as user types
- **Visual Feedback**: Red borders and error messages for invalid fields
- **Submit Prevention**: Disables submit button when form is invalid
- **Error Display**: Shows specific error messages below each field

---

## Action System Integration

### Automatic Integration

The AutoForm automatically integrates with your action system:

1. **Tenant Context**: Automatically passed to dynamic options
2. **Branch Context**: Branch-aware data fetching
3. **Caching**: Leverages IndexedDB and TanStack Query
4. **Background Sync**: Queues operations when offline
5. **Optimistic Updates**: Instant UI feedback

### Example Integration

```typescript
// In your component
import { useResourceCreate, useResourceUpdate } from '@/hooks/use-action-api';

function CreateResourceForm() {
  const createResource = useResourceCreate('myResource');
  
  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await createResource.mutateAsync(data);
      toast.success('Resource created successfully!');
      router.push('/my-resources');
    } catch (error) {
      toast.error('Failed to create resource');
      console.error('Create failed:', error);
    }
  };

  return (
    <AutoForm
      schema={MY_RESOURCE_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      isLoading={createResource.isPending}
    />
  );
}
```

### Dynamic Options with Action System

Dynamic options automatically use the action system:

```typescript
// Schema configuration
{
  key: 'categoryId',
  options: {
    dynamic: {
      resource: 'categories',  // Calls 'categories.list' action
      valueField: 'id',
      labelField: 'name'
    }
  }
}

// Internally, AutoForm uses:
const { data: categories } = useResourceList('categories', {
  isActive: true
});
```

---

## Branch-Aware Operations

### Automatic Branch Context

The AutoForm automatically handles branch context:

```typescript
// Branch context is automatically included
const handleSubmit = async (data: Record<string, any>) => {
  // Data automatically includes:
  // - tenantId: current tenant
  // - branchId: current branch
  // - originalId: for Copy-on-Write operations
  
  await createResource.mutateAsync(data);
};
```

### Copy-on-Write Support

When editing in a branch, the form automatically handles Copy-on-Write:

```typescript
// Edit mode automatically handles branching
<AutoForm
  schema={SCHEMA}
  mode="edit"
  initialData={resource}  // Original resource data
  onSubmit={handleSubmit} // Creates branch copy if needed
/>
```

### Branch-Aware Dynamic Options

Dynamic options respect branch context:

```typescript
{
  key: 'parentId',
  options: {
    dynamic: {
      resource: 'categories',
      valueField: 'id',
      labelField: 'name'
      // Automatically filtered by current branch
    }
  }
}
```

---

## Examples

### Complete Office Form Example

```typescript
// office.schema.ts
export const OFFICE_SCHEMA: ResourceSchema = {
  databaseKey: 'offices',
  modelName: 'Office',
  actionPrefix: 'office',
  
  display: {
    title: 'Offices',
    description: 'Manage office locations and configurations',
    icon: 'building',
    color: 'blue'
  },
  
  form: {
    width: 'lg',
    layout: 'compact',
    showDescriptions: true
  },
  
  fields: [
    // Row 1: Basic Information
    {
      key: 'name',
      label: 'Office Name',
      type: 'text',
      required: true,
      placeholder: 'Enter office name...',
      tab: 'General',
      form: { row: 1, width: 'half', order: 1 },
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'maxLength', value: 255, message: 'Name too long' }
      ]
    },
    {
      key: 'code',
      label: 'Office Code',
      type: 'text',
      required: true,
      placeholder: 'NYC, LON, SFO...',
      tab: 'General',
      form: { row: 1, width: 'half', order: 2 },
      validation: [
        { type: 'required', message: 'Code is required' },
        { type: 'pattern', value: '^[A-Z]{2,5}$', message: 'Use 2-5 uppercase letters' }
      ]
    },

    // Row 2: Location
    {
      key: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'City name...',
      tab: 'Location',
      form: { row: 1, width: 'third', order: 1 }
    },
    {
      key: 'state',
      label: 'State/Province',
      type: 'text',
      placeholder: 'State or province...',
      tab: 'Location',
      form: { row: 1, width: 'third', order: 2 }
    },
    {
      key: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Country name...',
      tab: 'Location',
      form: { row: 1, width: 'third', order: 3 }
    },

    // Row 3: Configuration
    {
      key: 'managerId',
      label: 'Office Manager',
      type: 'select',
      tab: 'Configuration',
      form: { row: 1, width: 'half', order: 1 },
      options: {
        dynamic: {
          resource: 'users',
          valueField: 'id',
          labelField: 'displayName',
          displayField: 'email',
          filter: (item) => item.roles?.includes('manager') && item.isActive
        }
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      description: 'Whether this office is currently active',
      tab: 'Configuration',
      form: { row: 1, width: 'half', order: 2 }
    }
  ]
};
```

### Usage Component

```typescript
// CreateOfficeForm.tsx
import { AutoForm } from '@/components/auto-generated/auto-form';
import { OFFICE_SCHEMA } from './office.schema';
import { useResourceCreate } from '@/hooks/use-action-api';

export function CreateOfficeForm() {
  const router = useRouter();
  const createOffice = useResourceCreate('office');

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await createOffice.mutateAsync(data);
      toast.success('Office created successfully!');
      router.push('/offices');
    } catch (error) {
      toast.error('Failed to create office');
      console.error('Create error:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Office</h1>
        <p className="text-muted-foreground">
          Add a new office location to your organization
        </p>
      </div>

      <AutoForm
        schema={OFFICE_SCHEMA}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={createOffice.isPending}
        className="bg-card p-6 rounded-lg border"
      />
    </div>
  );
}
```

### Edit Form Example

```typescript
// EditOfficeForm.tsx
export function EditOfficeForm({ officeId }: { officeId: string }) {
  const router = useRouter();
  const { data: office, isLoading } = useResourceItem('office', officeId);
  const updateOffice = useResourceUpdate('office');

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await updateOffice.mutateAsync({
        id: officeId,
        ...data
      });
      toast.success('Office updated successfully!');
      router.push('/offices');
    } catch (error) {
      toast.error('Failed to update office');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading office...</div>;
  }

  if (!office) {
    return <div className="p-8 text-center">Office not found</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Office</h1>
        <p className="text-muted-foreground">
          Update office information and settings
        </p>
      </div>

      <AutoForm
        schema={OFFICE_SCHEMA}
        mode="edit"
        initialData={office}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={updateOffice.isPending}
        className="bg-card p-6 rounded-lg border"
      />
    </div>
  );
}
```

---

## Advanced Features

### Conditional Fields

Show/hide fields based on other field values:

```typescript
function ConditionalForm() {
  const [formValues, setFormValues] = useState({});
  
  // Filter fields based on conditions
  const conditionalFields = useMemo(() => {
    return SCHEMA.fields.filter(field => {
      if (field.key === 'advancedSettings') {
        return formValues.enableAdvanced === true;
      }
      if (field.key === 'vendorConfig') {
        return formValues.vendor === 'SABRE';
      }
      return true;
    });
  }, [formValues]);

  // Create modified schema
  const modifiedSchema = {
    ...SCHEMA,
    fields: conditionalFields
  };

  return (
    <AutoForm
      schema={modifiedSchema}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      // Watch for form value changes
      onValuesChange={setFormValues}
    />
  );
}
```

### Multi-Step Forms

Break large forms into steps:

```typescript
function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    {
      title: 'Basic Information',
      fields: ['name', 'code', 'description']
    },
    {
      title: 'Location',
      fields: ['address', 'city', 'state', 'country']
    },
    {
      title: 'Configuration',
      fields: ['managerId', 'isActive', 'settings']
    }
  ];

  const currentStepConfig = steps[currentStep - 1];
  const stepSchema = {
    ...SCHEMA,
    fields: SCHEMA.fields.filter(field => 
      currentStepConfig.fields.includes(field.key)
    )
  };

  const handleStepSubmit = async (data: Record<string, any>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      await submitFinalData(updatedData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center space-x-2",
              index + 1 <= currentStep ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              index + 1 <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {index + 1}
            </div>
            <span className="text-sm font-medium">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Current step form */}
      <AutoForm
        schema={stepSchema}
        mode="create"
        initialData={formData}
        onSubmit={handleStepSubmit}
        onCancel={() => setCurrentStep(Math.max(1, currentStep - 1))}
      />
    </div>
  );
}
```

### Custom Data Processing

Transform data before submission:

```typescript
function CustomProcessingForm() {
  const handleSubmit = async (data: Record<string, any>) => {
    // Transform data before submission
    const processedData = {
      ...data,
      // Custom processing
      fullName: `${data.firstName} ${data.lastName}`,
      tags: data.tags?.split(',').map(tag => tag.trim()),
      coordinates: data.address ? await geocodeAddress(data.address) : null,
      // Add branch context
      branchId: getCurrentBranchId(),
      tenantId: getCurrentTenantId()
    };

    await submitData(processedData);
  };

  return (
    <AutoForm
      schema={SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

---

## Performance Optimization

### Caching Strategy

The AutoForm implements intelligent caching:

```typescript
// Dynamic options caching
const useDynamicOptions = (field: FieldSchema, tenantId: string, branchId?: string) => {
  const cacheKey = `${field.options?.dynamic?.resource}-${tenantId}-${branchId}`;
  
  return useQuery({
    queryKey: ['dynamic-options', cacheKey],
    queryFn: () => fetchDynamicOptions(field.options?.dynamic),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    enabled: !!field.options?.dynamic
  });
};
```

### Optimization Tips

1. **Minimize Dynamic Fields**: Use static options when data rarely changes
2. **Efficient Filters**: Keep filter functions simple and fast
3. **Batch API Calls**: Group related dynamic options into single requests
4. **Stable Dependencies**: Use useMemo and useCallback for expensive operations
5. **Lazy Loading**: Load dynamic options only when fields are visible

### Performance Monitoring

```typescript
// Performance wrapper component
function PerformantAutoForm(props: AutoFormProps) {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 100) {
      console.warn(`AutoForm render took ${renderTime}ms - consider optimization`);
    }
  });

  return <AutoForm {...props} />;
}
```

---

## Troubleshooting

### Common Issues

#### Dynamic Options Not Loading

**Problem**: Dropdown shows "Loading..." indefinitely

**Solutions**:
1. Check resource name matches schema actionPrefix exactly
2. Verify API endpoint exists and returns data
3. Check network requests in browser DevTools
4. Ensure tenant/branch context is correct
5. Verify permissions for the resource

```typescript
// Debug dynamic options
{
  key: 'debug',
  options: {
    dynamic: {
      resource: 'users', // Ensure this matches actionPrefix exactly
      valueField: 'id',  // Field must exist in response
      labelField: 'name' // Field must exist in response
    }
  }
}
```

#### Form Validation Errors

**Problem**: Form won't submit despite appearing valid

**Solutions**:
1. Check browser console for validation errors
2. Verify all required fields have values
3. Test validation rules individually
4. Check for hidden fields with validation
5. Ensure proper field types

```typescript
// Debug validation
const { formState: { errors } } = useForm();
console.log('Form errors:', errors);
```

#### Layout Issues

**Problem**: Fields not arranging correctly

**Solutions**:
1. Check form.row numbers are sequential
2. Verify width values ('full', 'half', 'third')
3. Ensure responsive classes are correct
4. Test on different screen sizes
5. Check for conflicting CSS

```typescript
// Debug layout
{
  key: 'test',
  form: {
    row: 1,        // Must be positive integer
    width: 'half', // Must be valid width
    order: 1       // Optional, for field ordering
  }
}
```

#### Branch Context Issues

**Problem**: Data not showing from correct branch

**Solutions**:
1. Verify branch context is set correctly
2. Check session data for branchId
3. Ensure branch-aware queries are working
4. Test with different branches

```typescript
// Debug branch context
const { data: session } = useSession();
console.log('Branch context:', session?.user?.branchContext);
```

### Debug Mode

Enable debug mode for detailed information:

```typescript
function DebugForm() {
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');

  return (
    <div>
      {debugMode && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3>Debug Information</h3>
          <pre>{JSON.stringify({ schema: SCHEMA.actionPrefix, mode: 'create' }, null, 2)}</pre>
        </div>
      )}
      
      <AutoForm
        schema={SCHEMA}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        className={debugMode ? 'debug-mode' : ''}
      />
    </div>
  );
}
```

### Error Handling

```typescript
function RobustForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setError(null);
      await submitData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Form submission error:', err);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <AutoForm
        schema={SCHEMA}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

---

## API Reference

For the up-to-date API and utilities, see `docs/auto-generated/form/api.md`.

### ResourceSchema Interface

```typescript
interface ResourceSchema {
  databaseKey: string;
  modelName: string;
  actionPrefix: string;
  display: {
    title: string;
    description: string;
    icon: string;
    color: string;
  };
  form?: {
    width: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    layout: 'compact' | 'spacious';
    showDescriptions: boolean;
  };
  fields: FieldSchema[];
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
  tab?: string;
  form?: FieldFormConfig;
  table?: FieldTableConfig;
  autoValue?: AutoValueConfig; // NEW: Context-aware auto-population
}
```

### FieldType Union

```typescript
type FieldType = 
  | 'text'
  | 'textarea' 
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'switch'
  | 'select'
  | 'multiSelect'
  | 'color'
  | 'icon'
  | 'avatar'
  | 'json'
  | 'richText';
```

### ValidationRule Interface

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}
```

### FieldOptions Interface

```typescript
interface FieldOptions {
  static?: StaticOption[];
  dynamic?: DynamicOption;
}

interface StaticOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface DynamicOption {
  resource: string;
  valueField: string;
  labelField: string;
  displayField?: string;
  filter?: (item: any) => boolean;
}
```

### AutoValueConfig Interface

```typescript
interface AutoValueConfig {
  source: ContextSource;
  fallback?: any;
  transform?: (value: any) => any;
  required?: boolean;
}

type ContextSource = 
  | 'session.user.tenantId'
  | 'session.user.branchContext.currentBranchId'
  | 'session.user.branchContext.defaultBranchId'
  | 'session.user.id'
  | 'navigation.nodeId'
  | 'navigation.parentId'
  | 'navigation.selectedId'
  | 'component.parentData'
  | 'component.contextId'
  | 'auto.timestamp'
  | 'auto.uuid';
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

---

## Best Practices

### Schema Design

1. **Keep it DRY**: Use the same schema for forms, tables, and modals
2. **Logical Grouping**: Group related fields in the same row
3. **Progressive Disclosure**: Use tabs to organize complex forms
4. **Clear Labels**: Use descriptive, user-friendly field labels
5. **Helpful Descriptions**: Add descriptions for complex fields

### Performance

1. **Minimize Dynamic Fields**: Use static options when data is stable
2. **Efficient Filters**: Keep filter functions simple and fast
3. **Cache Appropriately**: Leverage built-in caching
4. **Stable Dependencies**: Use useMemo/useCallback for expensive operations

### User Experience

1. **Logical Flow**: Arrange fields in a natural order
2. **Required Indicators**: Mark required fields clearly
3. **Helpful Placeholders**: Provide examples in placeholders
4. **Error Messages**: Write clear, actionable error messages
5. **Loading States**: Show progress for dynamic operations

### Security

1. **Input Validation**: Always validate on both client and server
2. **Sanitization**: Sanitize user input appropriately
3. **Permissions**: Check permissions before showing forms
4. **Branch Isolation**: Leverage branch-aware operations

### Accessibility

1. **Semantic HTML**: AutoForm generates semantic form elements
2. **Keyboard Navigation**: All fields are keyboard accessible
3. **Screen Readers**: Labels and descriptions are properly associated
4. **Focus Management**: Logical tab order maintained
5. **Error Announcements**: Validation errors are announced

---

## Migration Guide

### From Manual Forms

If migrating from manually created forms:

1. **Extract Field Definitions**: Convert form fields to schema format
2. **Map Validation**: Convert validation logic to schema rules
3. **Handle Dynamic Data**: Convert API calls to dynamic options
4. **Update Styling**: Leverage schema-driven styling
5. **Test Thoroughly**: Verify all functionality works correctly

### Schema Updates

When updating existing schemas:

1. **Add New Fields**: Simply add to the fields array
2. **Remove Fields**: Remove from array (data will be ignored)
3. **Change Validation**: Update validation rules as needed
4. **Reorder Fields**: Adjust row/order numbers for layout changes
5. **Add Tabs**: Group fields with tab property

---

This documentation covers the complete AutoForm system with all current features. The component provides a powerful, schema-driven approach to form generation with advanced features like action system integration, branch-aware operations, and comprehensive validation. For specific implementation questions, refer to the example schemas in the `/features/` directory. 