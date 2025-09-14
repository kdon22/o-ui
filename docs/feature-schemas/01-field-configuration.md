# Field Configuration Guide

**Complete reference for all field types, validation, auto-population, and UI configuration options**

## Table of Contents

1. [Field Types Overview](#field-types-overview)
2. [Core Field Properties](#core-field-properties)
3. [Auto-Value System](#auto-value-system)
4. [Form Configuration](#form-configuration)
5. [Table Configuration](#table-configuration)
6. [Validation System](#validation-system)
7. [Field Options (Dropdowns)](#field-options-dropdowns)
8. [Mobile & Desktop Config](#mobile--desktop-config)
9. [Advanced Features](#advanced-features)
10. [Field Examples](#field-examples)

---

## Field Types Overview

### **Available Field Types**

The system supports 25+ field types with automatic Input/Display components:

```typescript
// Text & Content Fields
'text'        // Single-line text input
'textarea'    // Multi-line text input  
'richText'    // Rich text editor with formatting
'email'       // Email input with validation
'url'         // URL input with validation
'tel'         // Phone number input
'password'    // Password input (hidden)
'code'        // Code editor with syntax highlighting

// Selection Fields
'select'      // Single dropdown selection
'multiSelect' // Multiple dropdown selection
'tags'        // Tag selection with creation
'switch'      // Boolean toggle switch
'checkbox'    // Boolean checkbox
'radio'       // Radio button group

// Number & Range Fields
'number'      // Number input with validation
'range'       // Slider input

// Date & Time Fields
'date'        // Date picker
'datetime'    // Date and time picker
'time'        // Time picker

// Media & Visual Fields
'color'       // Color picker
'icon'        // Icon selector (Lucide icons)
'avatar'      // Avatar/image upload
'image'       // Image upload
'file'        // File upload

// Data Fields
'json'        // JSON editor with validation
```

### **Field Type Mapping**

Each field type automatically maps to Input and Display components:

```typescript
export const FIELD_TYPES = {
  text: { input: 'TextInput', display: 'TextDisplay' },
  select: { input: 'SelectInput', display: 'BadgeDisplay' },
  switch: { input: 'SwitchInput', display: 'BadgeDisplay' },
  tags: { input: 'TagInput', display: 'TagDisplay' },
  // ... all other types
};
```

---

## Core Field Properties

### **Required Properties**

Every field must have these core properties:

```typescript
interface FieldSchema {
  key: string;           // Database field name (must match Prisma model)
  label: string;         // Human-readable label for UI
  type: FieldType;       // Field type (see above)
  required?: boolean;    // Whether field is required
}
```

### **Common Properties**

```typescript
interface FieldSchema {
  // Core properties
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  
  // UI Properties
  placeholder?: string;     // Input placeholder text
  description?: string;     // Help text shown below field
  tab?: string;            // Tab name for multi-tab forms
  
  // Data Handling
  defaultValue?: any;      // Static default value
  autoValue?: AutoValueConfig; // Dynamic auto-population
  
  // Behavior
  transient?: boolean;     // UI-only field, never persisted
  computed?: boolean;      // Server-computed, stripped on write
  stripOn?: {             // Fine-grained control per operation
    create?: boolean;
    update?: boolean;
  };
  
  // Interactive Features
  clickable?: boolean;     // Makes table column clickable
  clickAction?: {         // Action when clicked
    type: 'edit' | 'navigate';
    url?: string;         // URL pattern (e.g., "/rules/{idShort}")
    target?: '_self' | '_blank';
  };
  
  // Configuration Objects
  form?: FieldFormConfig;     // Form layout configuration
  table?: FieldTableConfig;   // Table display configuration
  validation?: ValidationRule[]; // Validation rules
  options?: FieldOptions;     // Dropdown options
  mobile?: MobileConfig;      // Mobile-specific settings
  desktop?: DesktopConfig;    // Desktop-specific settings
}
```

---

## Auto-Value System

The auto-value system provides dynamic field population from various sources:

### **Auto-Value Sources**

```typescript
export type AutoValueSource = 
  // UUID Generation
  | 'auto.uuid'                    // Generate UUID
  | 'auto.nodeShortId'            // Generate short node ID (N8K9L3)
  | 'auto.ruleShortId'            // Generate short rule ID (R7M2P4)
  | 'auto.processShortId'         // Generate short process ID (P5Q8N1)
  
  // Session Context
  | 'session.user.tenantId'       // Current user's tenant
  | 'session.user.branchContext.currentBranchId'  // Current branch
  | 'session.user.branchContext.defaultBranchId'  // Default branch
  | 'session.user.id'             // Current user ID
  
  // Navigation Context  
  | 'navigation.nodeId'           // Selected node from tree
  | 'navigation.processId'        // Selected process
  | 'navigation.parentId'         // Parent entity ID
  
  // Component Context
  | 'component.selectedNodeId'    // Node selected in component
  | 'component.parentEntityId'    // Parent entity from component
  
  // Default Values
  | 'default.true'               // Boolean true
  | 'default.false'              // Boolean false
  | 'default.emptyString'        // Empty string
  | 'default.emptyArray'         // Empty array []
  | 'default.zero';              // Number 0
```

### **Auto-Value Configuration**

```typescript
interface AutoValueConfig {
  source: AutoValueSource;
  required: boolean;           // Whether this auto-value is required
  fallback?: string | number | boolean; // Fallback if source unavailable
  condition?: string;          // Conditional logic
}
```

### **Auto-Value Examples**

```typescript
// UUID Generation
{
  key: 'id',
  autoValue: {
    source: 'auto.uuid',
    required: true
  }
}

// Session Context
{
  key: 'tenantId', 
  autoValue: {
    source: 'session.user.tenantId',
    required: true
  }
}

// Navigation Context with Fallback
{
  key: 'branchId',
  autoValue: {
    source: 'session.user.branchContext.currentBranchId',
    fallback: 'main',
    required: true
  }
}

// Default Values
{
  key: 'isActive',
  autoValue: {
    source: 'default.true',
    required: false
  }
}
```

---

## Form Configuration

### **Form Layout System**

Fields are organized in a responsive grid system:

```typescript
interface FieldFormConfig {
  row: number;                    // Row number (1, 2, 3, etc.)
  width: 'full' | 'half' | 'third' | 'quarter'; // Column width
  order: number;                  // Order within row
  showInForm: boolean;           // Whether to show in form
}
```

### **Form Layout Examples**

```typescript
// Row 1: Full width field
{
  key: 'name',
  form: {
    row: 1,
    width: 'full',
    order: 1,
    showInForm: true
  }
}

// Row 2: Two half-width fields
{
  key: 'type',
  form: { row: 2, width: 'half', order: 1, showInForm: true }
}
{
  key: 'status', 
  form: { row: 2, width: 'half', order: 2, showInForm: true }
}

// Row 3: Three third-width fields
{
  key: 'priority',
  form: { row: 3, width: 'third', order: 1, showInForm: true }
}
{
  key: 'category',
  form: { row: 3, width: 'third', order: 2, showInForm: true }
}
{
  key: 'owner',
  form: { row: 3, width: 'third', order: 3, showInForm: true }
}
```

### **Multi-Tab Forms**

Organize fields into tabs for better UX:

```typescript
// Tab 1: Basic Information
{
  key: 'name',
  tab: 'basic',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}

// Tab 2: Configuration
{
  key: 'settings',
  tab: 'config',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}

// Tab 3: Advanced Options
{
  key: 'metadata',
  tab: 'advanced',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}
```

---

## Table Configuration

### **Table Display Options**

```typescript
interface FieldTableConfig {
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  sortable?: boolean;
  filterable?: boolean;
  clickable?: boolean;    // Makes column clickable for editing
}
```

### **Clickable Columns**

Make table columns clickable for instant editing:

```typescript
{
  key: 'name',
  clickable: true,
  clickAction: {
    type: 'edit'  // Opens inline edit mode
  },
  table: {
    width: 'lg',
    sortable: true,
    filterable: true
  }
}

// Navigation on click
{
  key: 'idShort',
  clickable: true,
  clickAction: {
    type: 'navigate',
    url: '/rules/{idShort}',  // {idShort} gets replaced with actual value
    target: '_self'
  },
  table: {
    width: 'sm'
  }
}
```

---

## Validation System

### **Validation Rule Types**

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'url' | 'custom';
  message: string;
  value?: string | number;
  validator?: (value: any) => boolean | Promise<boolean>;
}
```

### **Built-in Validation Rules**

```typescript
// Required field
{ type: 'required', message: 'This field is required' }

// String length
{ type: 'minLength', value: 3, message: 'Must be at least 3 characters' }
{ type: 'maxLength', value: 100, message: 'Cannot exceed 100 characters' }

// Number range
{ type: 'min', value: 0, message: 'Must be at least 0' }
{ type: 'max', value: 999, message: 'Cannot exceed 999' }

// Pattern matching
{ 
  type: 'pattern', 
  value: '^[a-zA-Z0-9_]+$', 
  message: 'Only letters, numbers, and underscores allowed' 
}

// Email validation
{ type: 'email', message: 'Must be a valid email address' }

// URL validation  
{ type: 'url', message: 'Must be a valid URL' }

// Custom validation
{
  type: 'custom',
  message: 'Custom validation failed',
  validator: (value) => {
    return value && value.length > 0 && !value.includes('bad');
  }
}
```

### **Validation Examples**

```typescript
// Text field with multiple validations
{
  key: 'name',
  label: 'Rule Name',
  type: 'text',
  required: true,
  validation: [
    { type: 'required', message: 'Rule name is required' },
    { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' },
    { type: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' },
    { type: 'pattern', value: '^[a-zA-Z0-9\\s._-]+$', message: 'Only letters, numbers, spaces, dots, hyphens, and underscores allowed' }
  ]
}

// Email field
{
  key: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  validation: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Must be a valid email address' }
  ]
}

// Number field with range
{
  key: 'priority',
  label: 'Priority',
  type: 'number',
  validation: [
    { type: 'min', value: 1, message: 'Priority must be at least 1' },
    { type: 'max', value: 10, message: 'Priority cannot exceed 10' }
  ]
}
```

---

## Field Options (Dropdowns)

### **Static Options**

Define fixed dropdown options:

```typescript
interface FieldOptions {
  static?: Array<{
    label: string;
    value: string;
    icon?: string;  // Optional Lucide icon name
  }>;
}
```

### **Dynamic Options**

Load options from other resources:

```typescript
interface FieldOptions {
  dynamic?: {
    resource: string;        // Resource to load from (e.g., 'nodes')
    valueField: string;      // Field to use as value (e.g., 'id')
    labelField: string;      // Field to use as label (e.g., 'name')
    displayField?: string;   // Field to display in UI (optional)
    filter?: (item: any) => boolean; // Filter function
  };
}
```

### **Options Examples**

```typescript
// Static options
{
  key: 'type',
  label: 'Rule Type',
  type: 'select',
  options: {
    static: [
      { label: 'Business Rule', value: 'BUSINESS', icon: 'briefcase' },
      { label: 'Validation Rule', value: 'VALIDATION', icon: 'shield-check' },
      { label: 'Utility Function', value: 'UTILITY', icon: 'tool' }
    ]
  }
}

// Dynamic options from nodes
{
  key: 'nodeId',
  label: 'Node',
  type: 'select',
  options: {
    dynamic: {
      resource: 'nodes',
      valueField: 'id',
      labelField: 'name',
      displayField: 'fullPath',  // Show full path in dropdown
      filter: (node) => node.isActive === true  // Only active nodes
    }
  }
}

// Multi-select with tags
{
  key: 'tagIds',
  label: 'Tags',
  type: 'multiSelect',
  options: {
    dynamic: {
      resource: 'tags',
      valueField: 'id',
      labelField: 'name'
    }
  }
}
```

---

## Mobile & Desktop Config

### **Mobile Configuration**

```typescript
interface MobileConfig {
  priority?: 'high' | 'medium' | 'low';  // Display priority on mobile
  displayFormat?: string;                // Custom display format
  showInTable?: boolean;                 // Show in mobile table view
  tableWidth?: string | number;          // Column width on mobile
}
```

### **Desktop Configuration**

```typescript
interface DesktopConfig {
  showInTable?: boolean;        // Show in desktop table
  tableWidth?: string | number; // Column width on desktop
}
```

### **Responsive Examples**

```typescript
// High priority on mobile, always visible
{
  key: 'name',
  mobile: {
    priority: 'high',
    showInTable: true,
    tableWidth: 'auto'
  },
  desktop: {
    showInTable: true,
    tableWidth: 'lg'
  }
}

// Hidden on mobile, visible on desktop
{
  key: 'metadata',
  mobile: {
    priority: 'low',
    showInTable: false
  },
  desktop: {
    showInTable: true,
    tableWidth: 'md'
  }
}
```

---

## Advanced Features

### **Computed Fields**

Fields that are calculated server-side and read-only:

```typescript
{
  key: 'fullPath',
  label: 'Full Path',
  type: 'text',
  computed: true,  // Server-computed, never sent on create/update
  description: 'Auto-calculated full hierarchy path'
}
```

### **Transient Fields**

UI-only fields that are never persisted:

```typescript
{
  key: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password',
  transient: true,  // UI-only, never saved to database
  validation: [
    {
      type: 'custom',
      message: 'Passwords must match',
      validator: (value, formData) => value === formData.password
    }
  ]
}
```

### **Conditional Stripping**

Fine-grained control over when fields are included:

```typescript
{
  key: 'id',
  stripOn: {
    create: true,   // Strip on create (auto-generated)
    update: false   // Include on update
  }
}
```

---

## Field Examples

### **Complete Field Examples**

#### **Text Field with Full Configuration**

```typescript
{
  key: 'name',
  label: 'Rule Name',
  type: 'text',
  required: true,
  placeholder: 'Enter rule name...',
  description: 'A descriptive name for this business rule',
  
  // Form layout
  form: {
    row: 1,
    width: 'full',
    order: 1,
    showInForm: true
  },
  
  // Table configuration
  table: {
    width: 'lg',
    sortable: true,
    filterable: true
  },
  
  // Make clickable for editing
  clickable: true,
  clickAction: {
    type: 'edit'
  },
  
  // Validation
  validation: [
    { type: 'required', message: 'Rule name is required' },
    { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' },
    { type: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' }
  ],
  
  // Responsive configuration
  mobile: {
    priority: 'high',
    showInTable: true,
    tableWidth: 'auto'
  },
  desktop: {
    showInTable: true,
    tableWidth: 'lg'
  }
}
```

#### **Select Field with Dynamic Options**

```typescript
{
  key: 'nodeId',
  label: 'Node',
  type: 'select',
  required: true,
  placeholder: 'Select a node...',
  description: 'The node this rule belongs to',
  
  // Auto-populate from navigation
  autoValue: {
    source: 'navigation.nodeId',
    required: false
  },
  
  // Dynamic options from nodes resource
  options: {
    dynamic: {
      resource: 'nodes',
      valueField: 'id',
      labelField: 'name',
      displayField: 'fullPath',
      filter: (node) => node.isActive === true
    }
  },
  
  form: {
    row: 2,
    width: 'half',
    order: 1,
    showInForm: true
  },
  
  validation: [
    { type: 'required', message: 'Please select a node' }
  ]
}
```

#### **Switch Field with Default Value**

```typescript
{
  key: 'isActive',
  label: 'Active',
  type: 'switch',
  required: false,
  description: 'Whether this rule is currently active',
  
  // Default to true
  defaultValue: true,
  
  form: {
    row: 3,
    width: 'half',
    order: 1,
    showInForm: true
  },
  
  table: {
    width: 'sm',
    sortable: true
  },
  
  mobile: {
    priority: 'medium',
    showInTable: true
  }
}
```

#### **Rich Text Field**

```typescript
{
  key: 'sourceCode',
  label: 'Business Rules',
  type: 'richText',
  required: true,
  placeholder: 'Write your business rules here...',
  description: 'The business logic for this rule in natural language',
  tab: 'code',  // Show in 'code' tab
  
  form: {
    row: 1,
    width: 'full',
    order: 1,
    showInForm: true
  },
  
  validation: [
    { type: 'required', message: 'Business rules are required' },
    { type: 'maxLength', value: 10000, message: 'Rules cannot exceed 10,000 characters' }
  ],
  
  // Hide from mobile table (too large)
  mobile: {
    priority: 'low',
    showInTable: false
  },
  desktop: {
    showInTable: false  // Show in detail view only
  }
}
```

---

## Field Type Reference

### **Text Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `text` | TextInput | TextDisplay | Single-line text |
| `textarea` | TextareaInput | TextDisplay | Multi-line text |
| `richText` | RichTextInput | RichTextDisplay | Formatted text with editor |
| `email` | EmailInput | TextDisplay | Email addresses |
| `url` | UrlInput | LinkDisplay | URLs with link display |
| `tel` | TextInput | TextDisplay | Phone numbers |
| `password` | PasswordInput | TextDisplay | Password fields |
| `code` | CodeInput | CodeDisplay | Code with syntax highlighting |

### **Selection Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `select` | SelectInput | BadgeDisplay | Single selection dropdown |
| `multiSelect` | MultiSelectInput | BadgeListDisplay | Multiple selection dropdown |
| `tags` | TagInput | TagDisplay | Tag selection with creation |
| `switch` | SwitchInput | BadgeDisplay | Boolean toggle |
| `checkbox` | CheckboxInput | BadgeDisplay | Boolean checkbox |
| `radio` | RadioInput | BadgeDisplay | Radio button group |

### **Number Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `number` | NumberInput | TextDisplay | Numeric input |
| `range` | RangeInput | TextDisplay | Slider input |

### **Date/Time Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `date` | DateInput | DateDisplay | Date picker |
| `datetime` | DateTimeInput | DateDisplay | Date and time picker |
| `time` | TimeInput | TextDisplay | Time picker |

### **Media Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `color` | ColorInput | ColorDisplay | Color picker |
| `icon` | IconInput | IconDisplay | Icon selector |
| `avatar` | AvatarInput | AvatarDisplay | Avatar/profile image |
| `image` | ImageInput | ImageDisplay | Image upload |
| `file` | FileInput | FileDisplay | File upload |

### **Data Fields**

| Type | Input Component | Display Component | Use Case |
|------|----------------|-------------------|----------|
| `json` | JsonInput | JsonDisplay | JSON data editor |

---

**Next**: Read [Registration & Integration Guide](./02-registration-integration.md) to learn how to register schemas and integrate with the action system.
