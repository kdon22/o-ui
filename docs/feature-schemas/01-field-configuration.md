# Field Configuration Guide - Current Implementation

**Complete reference for all field types, validation, auto-population, and UI configuration in the actual system**

## Table of Contents

1. [Field Types Overview](#field-types-overview)
2. [FieldSchema Interface](#fieldschema-interface)
3. [Auto-Value System](#auto-value-system)
4. [Form Configuration](#form-configuration)
5. [Table Configuration](#table-configuration)
6. [Validation System](#validation-system)
7. [Field Options](#field-options)
8. [Mobile & Desktop Config](#mobile--desktop-config)
9. [Advanced Field Features](#advanced-field-features)
10. [Complete Field Examples](#complete-field-examples)

---

## Field Types Overview

### **Available Field Types** (From `src/lib/resource-system/schemas.ts`)

```typescript
export const FIELD_TYPES = {
  // Text & Content Fields
  text: { input: 'TextInput', display: 'TextDisplay' },
  textarea: { input: 'TextareaInput', display: 'TextDisplay' },
  richText: { input: 'RichTextInput', display: 'RichTextDisplay' },
  email: { input: 'EmailInput', display: 'TextDisplay' },
  url: { input: 'UrlInput', display: 'LinkDisplay' },
  tel: { input: 'TextInput', display: 'TextDisplay' },
  password: { input: 'PasswordInput', display: 'TextDisplay' },
  code: { input: 'CodeInput', display: 'CodeDisplay' },

  // Selection Fields
  select: { input: 'SelectInput', display: 'BadgeDisplay' },
  multiSelect: { input: 'MultiSelectInput', display: 'BadgeListDisplay' },
  multiselect: { input: 'MultiSelectInput', display: 'BadgeListDisplay' }, // Alias
  tags: { input: 'TagInput', display: 'TagDisplay' },
  switch: { input: 'SwitchInput', display: 'BadgeDisplay' },
  checkbox: { input: 'CheckboxInput', display: 'BadgeDisplay' },

  // Number & Range Fields
  number: { input: 'NumberInput', display: 'TextDisplay' },
  range: { input: 'RangeInput', display: 'TextDisplay' },
  currency: { input: 'CurrencyInput', display: 'CurrencyDisplay' },

  // Date & Time Fields
  date: { input: 'DateInput', display: 'DateDisplay' },
  datetime: { input: 'DateTimeInput', display: 'DateDisplay' },
  time: { input: 'TimeInput', display: 'TextDisplay' },

  // Media & Visual Fields
  color: { input: 'ColorInput', display: 'ColorDisplay' },
  icon: { input: 'IconInput', display: 'IconDisplay' },
  avatar: { input: 'AvatarInput', display: 'AvatarDisplay' },
  image: { input: 'ImageInput', display: 'ImageDisplay' },
  file: { input: 'FileInput', display: 'FileDisplay' },

  // Data Fields
  json: { input: 'JsonInput', display: 'JsonDisplay' },
  
  // Marketplace-specific
  'component-selector': { input: 'ComponentSelectorInput', display: 'ComponentSelectorDisplay' },
} as const;
```

### **Field Type Usage**

Each field type automatically maps to:
- **Input Component** - Used in forms (AutoForm)
- **Display Component** - Used in tables (AutoTable) and read-only views

---

## FieldSchema Interface

### **Complete FieldSchema** (Current Implementation)

```typescript
export interface FieldSchema {
  // ✅ REQUIRED: Core Properties
  key: string;           // Database field name (must match Prisma model)
  label: string;         // Human-readable label for UI
  type: FieldType;       // Field type from FIELD_TYPES
  required?: boolean;    // Whether field is required

  // ✅ Data Handling
  transient?: boolean;   // UI-only field, never persisted
  computed?: boolean;    // Server-computed, always stripped on write
  stripOn?: {           // Fine-grained control per operation
    create?: boolean;
    update?: boolean;
  };

  // ✅ Auto-Population System
  autoValue?: AutoValueConfig;  // Dynamic auto-population from context
  defaultValue?: any;          // Static default value

  // ✅ UI Properties
  placeholder?: string;    // Input placeholder text
  description?: string;    // Help text shown below field
  tab?: string;           // Tab name for multi-tab forms

  // ✅ Interactive Features
  clickable?: boolean;     // Makes table column clickable
  clickAction?: {         // Action when clicked
    type: 'edit' | 'navigate';
    url?: string;         // URL pattern (e.g., "/rules/{idShort}")
    target?: '_self' | '_blank';
  };

  // ✅ Layout Configuration
  form?: FieldFormConfig;     // Form layout configuration
  table?: FieldTableConfig;   // Table display configuration

  // ✅ Validation & Options
  validation?: ValidationRule[]; // Validation rules
  options?: FieldOptions;       // Dropdown options

  // ✅ Responsive Design
  mobile?: {              // Mobile-specific settings
    priority?: 'high' | 'medium' | 'low';
    displayFormat?: string;
    showInTable?: boolean;
    tableWidth?: string | number;
  };
  desktop?: {             // Desktop-specific settings
    showInTable?: boolean;
    tableWidth?: string | number;
  };
}
```

### **Key Field Properties**

#### **Data Handling Flags**
```typescript
// UI-only field (never saved to database)
transient: true

// Server-computed field (stripped on all writes)
computed: true

// Fine-grained control
stripOn: { 
  create: true,   // Strip on create operations
  update: false   // Include on update operations
}
```

#### **Interactive Features**
```typescript
// Make column clickable for editing
clickable: true,
clickAction: { type: 'edit' }

// Make column clickable for navigation
clickable: true,
clickAction: { 
  type: 'navigate',
  url: '/rules/{idShort}',  // {idShort} replaced with actual value
  target: '_self'
}
```

---

## Auto-Value System

### **Context Sources** (Current Implementation)

```typescript
export type ContextSource = 
  // Session Context
  | 'session.user.tenantId'
  | 'session.user.branchContext.currentBranchId'
  | 'session.user.branchContext.defaultBranchId'
  | 'session.user.id'
  | 'session.context.originalId'
  
  // Navigation Context
  | 'navigation.nodeId'
  | 'navigation.parentId'
  | 'navigation.selectedId'
  
  // Component Context
  | 'component.parentData'
  | 'component.contextId'
  
  // Auto-Generation
  | 'auto.timestamp'
  | 'auto.uuid'
  | 'auto.nodeShortId'
  | 'auto.ruleShortId'
  | 'auto.hierarchyPath'
  | 'auto.hierarchyAncestors'
  | 'self.id';
```

### **AutoValueConfig Interface**

```typescript
export interface AutoValueConfig {
  source: ContextSource;
  fallback?: any;
  transform?: (value: any) => any;
  required?: boolean;
  
  // 🔥 NEW: Conditional auto-population
  onlyIfAvailable?: boolean; // Only apply if context value exists and is not empty
  condition?: (value: any) => boolean; // Custom condition for applying auto-value
}
```

### **Auto-Value Examples**

#### **Standard System Fields**
```typescript
// UUID Generation
{
  key: 'id',
  autoValue: {
    source: 'auto.uuid',
    required: true
  }
}

// Tenant Context
{
  key: 'tenantId',
  autoValue: {
    source: 'session.user.tenantId',
    required: true
  }
}

// Branch Context
{
  key: 'branchId',
  autoValue: {
    source: 'session.user.branchContext.currentBranchId',
    fallback: 'main',
    required: true
  }
}

// User Context
{
  key: 'createdById',
  autoValue: {
    source: 'session.user.id',
    required: true
  }
}
```

#### **Navigation Context**
```typescript
// Auto-populate from selected node
{
  key: 'nodeId',
  autoValue: {
    source: 'navigation.nodeId',
    onlyIfAvailable: true, // Only set if nodeId is available
    required: false
  }
}

// Auto-populate from component context
{
  key: 'parentId',
  autoValue: {
    source: 'component.parentData',
    transform: (parentData) => parentData?.id,
    condition: (value) => value && typeof value === 'string'
  }
}
```

#### **Static Default Values**
```typescript
// Static default (prefer this over autoValue for static values)
{
  key: 'isActive',
  label: 'Active',
  type: 'switch',
  defaultValue: true // Simple static default
}
```

---

## Form Configuration

### **FieldFormConfig Interface**

```typescript
export interface FieldFormConfig {
  row: number;
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'half' | 'third' | 'quarter';
  order?: number;
  showInForm?: boolean;
  mobile?: {
    row?: number;
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'half' | 'third' | 'quarter' | 'hidden';
  };
}
```

### **Form Layout Examples**

#### **Basic Form Layout**
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

#### **Responsive Form Configuration**
```typescript
{
  key: 'description',
  form: {
    row: 4,
    width: 'full',
    showInForm: true,
    mobile: {
      row: 5,          // Different row on mobile
      width: 'full'    // Full width on mobile
    }
  }
}
```

### **Multi-Tab Forms**

Organize fields into tabs using the `tab` property:

```typescript
// Basic Information Tab
{
  key: 'name',
  tab: 'basic',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}

// Configuration Tab
{
  key: 'settings',
  tab: 'config',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}

// Advanced Tab
{
  key: 'metadata',
  tab: 'advanced',
  form: { row: 1, width: 'full', order: 1, showInForm: true }
}
```

---

## Table Configuration

### **FieldTableConfig Interface**

```typescript
export interface FieldTableConfig {
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  showInTable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  mobile?: {
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'hidden';
  };
}
```

### **Table Configuration Examples**

#### **Basic Table Configuration**
```typescript
{
  key: 'name',
  table: {
    width: 'lg',
    showInTable: true,
    sortable: true,
    filterable: true
  }
}
```

#### **Responsive Table Configuration**
```typescript
{
  key: 'description',
  table: {
    width: 'xl',
    showInTable: true,
    mobile: {
      width: 'hidden' // Hide on mobile
    }
  }
}
```

#### **Clickable Column Configuration**
```typescript
{
  key: 'name',
  clickable: true,
  clickAction: {
    type: 'edit' // Opens inline edit mode
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
    url: '/rules/{idShort}',
    target: '_self'
  },
  table: {
    width: 'sm'
  }
}
```

---

## Validation System

### **ValidationRule Interface**

```typescript
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean | Promise<boolean>;
}
```

### **Built-in Validation Rules**

#### **Required Validation**
```typescript
{ type: 'required', message: 'This field is required' }
```

#### **String Length Validation**
```typescript
{ type: 'minLength', value: 3, message: 'Must be at least 3 characters' }
{ type: 'maxLength', value: 100, message: 'Cannot exceed 100 characters' }
```

#### **Number Range Validation**
```typescript
{ type: 'min', value: 0, message: 'Must be at least 0' }
{ type: 'max', value: 999, message: 'Cannot exceed 999' }
```

#### **Pattern Validation**
```typescript
{
  type: 'pattern',
  value: '^[a-zA-Z0-9_]+$',
  message: 'Only letters, numbers, and underscores allowed'
}
```

#### **Email & URL Validation**
```typescript
{ type: 'email', message: 'Must be a valid email address' }
{ type: 'url', message: 'Must be a valid URL' }
```

#### **Custom Validation**
```typescript
{
  type: 'custom',
  message: 'Custom validation failed',
  validator: (value) => {
    return value && value.length > 0 && !value.includes('forbidden');
  }
}
```

### **Complete Validation Example**

```typescript
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
```

---

## Field Options

### **FieldOptions Interface**

```typescript
export interface FieldOptions {
  static?: Array<{label: string; value: string; icon?: string}>;
  dynamic?: {
    resource: string;
    valueField: string;
    labelField: string;
    displayField?: string;
    filter?: (item: any) => boolean;
  };
  // Component selector options
  componentType?: 'rules' | 'classes' | 'tables' | 'workflows';
  multiSelect?: boolean;
  showPreview?: boolean;
}
```

### **Static Options**

```typescript
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
```

### **Dynamic Options**

```typescript
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
```

### **Multi-Select Options**

```typescript
{
  key: 'tagIds',
  label: 'Tags',
  type: 'multiSelect',
  options: {
    dynamic: {
      resource: 'tags',
      valueField: 'id',
      labelField: 'name'
    },
    multiSelect: true
  }
}
```

### **Component Selector Options**

```typescript
{
  key: 'selectedRules',
  label: 'Rules',
  type: 'component-selector',
  options: {
    componentType: 'rules',
    multiSelect: true,
    showPreview: true
  }
}
```

---

## Mobile & Desktop Config

### **Mobile Configuration**

```typescript
mobile?: {
  priority?: 'high' | 'medium' | 'low';  // Display priority on mobile
  displayFormat?: string;                // Custom display format
  showInTable?: boolean;                 // Show in mobile table view
  tableWidth?: string | number;          // Column width on mobile
}
```

### **Desktop Configuration**

```typescript
desktop?: {
  showInTable?: boolean;        // Show in desktop table
  tableWidth?: string | number; // Column width on desktop
}
```

### **Responsive Examples**

#### **High Priority Mobile Field**
```typescript
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
```

#### **Desktop-Only Field**
```typescript
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

## Advanced Field Features

### **Computed Fields**

Fields calculated server-side and read-only:

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

UI-only fields never persisted to database:

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

### **Context-Aware Auto-Population**

```typescript
{
  key: 'nodeId',
  autoValue: {
    source: 'navigation.nodeId',
    onlyIfAvailable: true, // Only set if navigation context has nodeId
    condition: (value) => value && typeof value === 'string'
  }
}
```

---

## Complete Field Examples

### **Text Field with Full Configuration**

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

### **Select Field with Dynamic Options**

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
    onlyIfAvailable: true
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

### **Switch Field with Default Value**

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

### **Rich Text Field**

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

### **System Fields Template**

Every schema should include these standard system fields:

```typescript
fields: [
  // Core Identity
  {
    key: 'id',
    label: 'ID',
    type: 'text',
    autoValue: { source: 'auto.uuid', required: true },
    stripOn: { create: true, update: false },
    form: { showInForm: false },
    computed: true
  },

  // Tenant Context
  {
    key: 'tenantId',
    label: 'Tenant ID',
    type: 'text',
    autoValue: { source: 'session.user.tenantId', required: true },
    form: { showInForm: false },
    computed: true
  },

  // Branch Context
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

  // Audit Fields
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
  },

  {
    key: 'createdById',
    label: 'Created By',
    type: 'text',
    autoValue: { source: 'session.user.id', required: true },
    form: { showInForm: false },
    computed: true
  },

  {
    key: 'updatedById',
    label: 'Updated By', 
    type: 'text',
    autoValue: { source: 'session.user.id', required: true },
    form: { showInForm: false },
    computed: true
  },

  // Your custom fields here...
]
```

---

## Field Type Quick Reference

| Type | Use Case | Input Component | Display Component |
|------|----------|----------------|-------------------|
| `text` | Single-line text | TextInput | TextDisplay |
| `textarea` | Multi-line text | TextareaInput | TextDisplay |
| `richText` | Formatted text | RichTextInput | RichTextDisplay |
| `email` | Email addresses | EmailInput | TextDisplay |
| `url` | URLs | UrlInput | LinkDisplay |
| `tel` | Phone numbers | TextInput | TextDisplay |
| `password` | Passwords | PasswordInput | TextDisplay |
| `code` | Code/syntax | CodeInput | CodeDisplay |
| `select` | Single selection | SelectInput | BadgeDisplay |
| `multiSelect` | Multiple selection | MultiSelectInput | BadgeListDisplay |
| `tags` | Tag selection | TagInput | TagDisplay |
| `switch` | Boolean toggle | SwitchInput | BadgeDisplay |
| `checkbox` | Boolean checkbox | CheckboxInput | BadgeDisplay |
| `number` | Numbers | NumberInput | TextDisplay |
| `range` | Slider | RangeInput | TextDisplay |
| `currency` | Money amounts | CurrencyInput | CurrencyDisplay |
| `date` | Dates | DateInput | DateDisplay |
| `datetime` | Date + time | DateTimeInput | DateDisplay |
| `time` | Time only | TimeInput | TextDisplay |
| `color` | Color picker | ColorInput | ColorDisplay |
| `icon` | Icon selector | IconInput | IconDisplay |
| `avatar` | Avatar/image | AvatarInput | AvatarDisplay |
| `image` | Image upload | ImageInput | ImageDisplay |
| `file` | File upload | FileInput | FileDisplay |
| `json` | JSON data | JsonInput | JsonDisplay |
| `component-selector` | Component picker | ComponentSelectorInput | ComponentSelectorDisplay |

---

**Next**: Learn about [Registration & Integration](./02-registration-integration.md) to register your schema and integrate with the action system.