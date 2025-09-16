# Resource Schemas - ACTUAL Implementation Guide

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Actual Schema Structure](#actual-schema-structure)
3. [Real Schema Examples](#real-schema-examples)
4. [Field Configuration](#field-configuration)
5. [Auto-Value System](#auto-value-system)
6. [Relationship System](#relationship-system)
7. [Schema Registration](#schema-registration)
8. [Junction Tables](#junction-tables)
9. [Best Practices](#best-practices)
10. [File Reference](#file-reference)

---

## Schema Overview

**ResourceSchemas** are the single source of truth that drive every aspect of the system. Based on the actual implementation, one schema definition generates:

- **API endpoints** and server handlers
- **IndexedDB** stores and indexes  
- **UI components** (forms, tables, modals)
- **TypeScript types** and validation
- **Hook interfaces** and cache keys
- **Junction relationships** and queries
- **Auto-value processing** and context integration

### **Current Architecture**

```
ResourceSchema (src/lib/resource-system/schemas.ts)
       ↓
ResourceRegistry (src/lib/resource-system/resource-registry.ts)
       ↓
┌─────────────────────────────────┐
│     Auto-Generated System       │
├─────────────────────────────────┤
│ • 93 SCHEMA_RESOURCES           │
│ • Action mappings (40+ actions) │
│ • IndexedDB stores & indexes    │
│ • Auto-Forms & Tables           │
│ • Junction auto-creation        │
│ • Branch-aware operations       │
│ • Mobile-first layouts          │
│ • Auto-value processing         │
└─────────────────────────────────┘
```

**Actual Registry**: 93 schemas across 12 feature directories

---

## Actual Schema Structure

### **ResourceSchema Interface (ACTUAL)**
**File**: `src/lib/resource-system/schemas.ts` (lines 492-555)

```typescript
export interface ResourceSchema {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: string;      // IndexedDB store + API endpoints
  modelName: string;        // Prisma model access
  actionPrefix: string;     // Action naming
  
  // ============================================================================
  // CONTEXT CONFIGURATION
  // ============================================================================
  notHasTenantContext?: boolean; // Disable tenant filtering (for global resources)
  notHasBranchContext?: boolean; // Disable branch filtering (for non-versioned resources)
  notHasAuditFields?: boolean;   // Disable audit fields (for models without updatedBy/version)
  
  // Server-only configuration for large datasets
  serverOnly?: boolean;          // Forces all operations through API, bypasses IndexedDB
  cacheStrategy?: 'indexeddb' | 'memory' | 'server-only'; // Caching strategy
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  display: DisplayConfig;        // Title, description, icon, color
  fields: FieldSchema[];         // Complete field definitions
  
  // ============================================================================
  // FUNCTIONALITY
  // ============================================================================
  relationships?: Record<string, RelationshipConfig>; // Foreign key relationships
  tree?: TreeConfig;             // Tree configuration (for hierarchical data like nodes)
  search: SearchConfig;          // Search and filtering
  filtering?: FilteringConfig;   // Two-level filtering configuration
  actions: ActionsConfig;        // Actions configuration
  
  // ============================================================================
  // LAYOUT
  // ============================================================================
  mobile: MobileConfig;          // Mobile-first layout
  desktop: DesktopConfig;        // Desktop table configuration  
  table?: TableConfig;           // Table configuration
  form?: FormConfig;             // Form configuration
  
  // ============================================================================
  // ADVANCED
  // ============================================================================
  permissions?: PermissionsConfig; // Permissions
  hooks?: {                      // Hooks for custom logic
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  
  // IndexedDB key configuration (CRITICAL for junction tables)
  indexedDBKey?: ((record: any) => string) | null;
}
```

### **Core Identity Pattern**

Every schema follows the **bulletproof 3-field design**:

```typescript
const OFFICE_SCHEMA: ResourceSchema = {
  // 🔑 CRITICAL: These 3 fields must be consistent
  databaseKey: 'office',     // ✅ Singular, lowercase 
  modelName: 'Office',       // ✅ Singular, PascalCase (matches Prisma)
  actionPrefix: 'office',    // ✅ Singular, lowercase (office.create)
  
  // Rest of schema...
}
```

**Naming Convention (ACTUAL)**:
- `databaseKey`: `office` (singular, lowercase)
- `modelName`: `Office` (singular, PascalCase) 
- `actionPrefix`: `office` (singular, lowercase)

---

## Field Configuration

### **Field Schema Interface**

```typescript
export interface FieldSchema {
  // === IDENTITY ===
  key: string;                    // Database field name
  label: string;                  // UI display label
  type: FieldType;               // Input component type
  
  // === VALIDATION ===
  required?: boolean;             // Required field validation
  validation?: ValidationRule[];  // Custom validation rules
  
  // === UI BEHAVIOR ===
  placeholder?: string;           // Placeholder text
  helpText?: string;             // Help text for users
  defaultValue?: any;            // Default value
  
  // === OPTIONS (for select fields) ===
  options?: {
    static?: Array<{value: string, label: string}>;
    dynamic?: {
      resource: string;           // Resource to load options from
      valueField: string;         // Field to use as value
      labelField: string;         // Field to use as label
      filter?: (item: any) => boolean; // Optional filtering
    };
  };
  
  // === AUTO-VALUE SYSTEM ===
  autoValue?: {
    source: 'auto.uuid' | 'auto.slug' | 'context.nodeId' | 'session.userId';
    dependency?: string;          // Field to depend on for slug generation
  };
  
  // === MOBILE-FIRST DESIGN ===
  mobile: {
    priority: 'high' | 'medium' | 'low';
    displayFormat: 'text' | 'badge' | 'pill' | 'hidden';
    condensed?: boolean;
  };
  
  // === DESKTOP CONFIGURATION ===
  desktop: {
    showInTable: boolean;
    tableWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    sortable?: boolean;
    filterable?: boolean;
  };
}
```

### **Field Types**

```typescript
export type FieldType = 
  // === TEXT INPUTS ===
  | 'text'           // Standard text input
  | 'textarea'       // Multi-line text
  | 'richText'       // Rich text editor (Tiptap)
  | 'email'          // Email validation
  | 'url'            // URL validation  
  | 'tel'            // Phone number
  | 'password'       // Password input
  
  // === NUMBER INPUTS ===
  | 'number'         // Number input
  | 'range'          // Range slider
  
  // === SELECTION ===
  | 'select'         // Dropdown select
  | 'multiselect'    // Multiple selection
  | 'radio'          // Radio buttons
  | 'checkbox'       // Checkbox
  | 'switch'         // Toggle switch
  
  // === DATE/TIME ===
  | 'date'           // Date picker
  | 'datetime'       // Date and time
  | 'time'           // Time picker
  
  // === FILES ===
  | 'file'           // File upload
  | 'image'          // Image upload with preview
  
  // === ADVANCED ===
  | 'json'           // JSON editor
  | 'code'           // Code editor (Monaco)
  | 'color'          // Color picker
```

### **Auto-Value System**

Automatically populate fields based on context:

```typescript
// Example: Auto-generate ID and slug
{
  key: 'id',
  label: 'ID', 
  type: 'text',
  required: true,
  autoValue: {
    source: 'auto.uuid'    // Generates UUID automatically
  },
  mobile: { priority: 'low', displayFormat: 'hidden' },
  desktop: { showInTable: false, tableWidth: 'sm' }
},
{
  key: 'slug',
  label: 'URL Slug',
  type: 'text', 
  autoValue: {
    source: 'auto.slug',
    dependency: 'name'     // Generate slug from 'name' field
  }
},
{
  key: 'nodeId',
  label: 'Node',
  type: 'text',
  autoValue: {
    source: 'context.nodeId'  // Auto-populate from navigation context
  }
}
```

### **Mobile-First Field Configuration**

Every field must specify mobile behavior:

```typescript
// High priority - always show on mobile
mobile: {
  priority: 'high',
  displayFormat: 'text',
  condensed: false
}

// Medium priority - show in expanded view  
mobile: {
  priority: 'medium', 
  displayFormat: 'badge',
  condensed: true
}

// Low priority - hide on mobile
mobile: {
  priority: 'low',
  displayFormat: 'hidden'
}
```

---

## Display Configuration

### **Display Config Interface**

```typescript
export interface DisplayConfig {
  title: string;              // Plural display name ("Offices")
  singularTitle?: string;     // Singular display name ("Office")
  description?: string;       // Brief description
  icon: string;              // Icon name (from Lucide React)
  color: string;             // Theme color (blue, green, red, etc.)
  
  // Pluralization
  pluralRules?: {
    singular: string;         // "office"
    plural: string;          // "offices"
  };
}
```

### **Example Display Configuration**

```typescript
display: {
  title: 'Offices',
  singularTitle: 'Office',
  description: 'Office locations and configurations',
  icon: 'building',          // Lucide icon name
  color: 'blue',            // UI theme color
  pluralRules: {
    singular: 'office',
    plural: 'offices'
  }
}
```

---

## Action Configuration

### **Action Config Interface**

```typescript
export interface ActionConfig {
  // === STANDARD CRUD ===
  create?: boolean;           // Enable create operation
  update?: boolean;          // Enable update operation  
  delete?: boolean;          // Enable delete operation
  list?: boolean;            // Enable list operation (default: true)
  get?: boolean;             // Enable get single operation (default: true)
  
  // === BULK OPERATIONS ===
  bulkCreate?: boolean;      // Enable bulk create
  bulkUpdate?: boolean;      // Enable bulk update
  bulkDelete?: boolean;      // Enable bulk delete
  
  // === OPTIMISTIC UPDATES ===
  optimistic?: boolean;      // Enable optimistic updates (default: true for CUD)
  
  // === CUSTOM ACTIONS ===
  custom?: Array<{
    id: string;              // Action ID (office.testConnection)
    label: string;           // Display label
    description?: string;    // Action description
    icon?: string;           // Icon name
    handler: string;         // Server handler function name
    optimistic?: boolean;    // Whether action supports optimistic updates
  }>;
}
```

### **Example Action Configuration**

```typescript
actions: {
  create: true,
  update: true, 
  delete: true,
  list: true,
  get: true,
  
  // Bulk operations
  bulkCreate: true,
  bulkDelete: true,
  
  // Custom actions
  custom: [
    {
      id: 'testConnection',
      label: 'Test Connection',
      description: 'Test office network connection',
      icon: 'wifi',
      handler: 'testOfficeConnection',
      optimistic: false        // Server validation required
    },
    {
      id: 'syncData', 
      label: 'Sync Data',
      handler: 'syncOfficeData',
      optimistic: true
    }
  ]
}
```

---

## Relationships

### **Relationship Configuration**

```typescript
export interface RelationshipConfig {
  [relationName: string]: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    relatedEntity: string;     // Related resource key
    foreignKey?: string;       // Foreign key field name
    junctionTable?: string;    // For many-to-many relationships
    
    // UI display
    displayInForm?: boolean;   // Show in forms
    displayInTable?: boolean;  // Show in tables
    displayInDetail?: boolean; // Show in detail views
    
    // Cascading operations
    cascadeDelete?: boolean;   // Delete related items
    cascadeUpdate?: boolean;   // Update related items
  };
}
```

### **Example Relationships**

```typescript
relationships: {
  // One-to-one: Office has one credential
  credential: {
    type: 'one-to-one',
    relatedEntity: 'credentials',
    foreignKey: 'credentialId',
    displayInForm: true,
    displayInDetail: true
  },
  
  // One-to-many: Office has many processes
  processes: {
    type: 'one-to-many',
    relatedEntity: 'processes',
    foreignKey: 'officeId',      // Field on Process model
    displayInDetail: true,
    cascadeDelete: false         // Don't delete processes when office deleted
  },
  
  // Many-to-many: Offices connected to workflows
  workflows: {
    type: 'many-to-many',
    relatedEntity: 'workflows',
    junctionTable: 'office_workflows',
    displayInTable: false,       // Too complex for table display
    displayInDetail: true
  }
}
```

---

## Validation Rules

### **Validation Rule Interface**

```typescript
export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;             // Error message to display
  value?: any;                // Value for rule (e.g., minLength: 5)
  validator?: (value: any, data: any) => boolean; // Custom validator function
}
```

### **Example Validation Rules**

```typescript
// Name field with multiple validations
{
  key: 'name',
  label: 'Office Name',
  type: 'text',
  required: true,
  validation: [
    {
      type: 'required',
      message: 'Office name is required'
    },
    {
      type: 'minLength',
      value: 2,
      message: 'Name must be at least 2 characters'
    },
    {
      type: 'maxLength', 
      value: 100,
      message: 'Name cannot exceed 100 characters'
    },
    {
      type: 'pattern',
      value: /^[A-Za-z0-9\s-]+$/,
      message: 'Name can only contain letters, numbers, spaces, and hyphens'
    }
  ]
},

// Email field with built-in validation
{
  key: 'email',
  label: 'Contact Email',
  type: 'email',
  validation: [
    {
      type: 'email',
      message: 'Please enter a valid email address'
    }
  ]
},

// Custom validation
{
  key: 'budget',
  label: 'Annual Budget', 
  type: 'number',
  validation: [
    {
      type: 'custom',
      message: 'Budget must be between $10,000 and $10,000,000',
      validator: (value) => value >= 10000 && value <= 10000000
    }
  ]
}
```

---

## Real Schema Examples

### **Complete Office Schema**

```typescript
// src/features/offices/offices.schema.ts
export const OFFICE_SCHEMA: ResourceSchema = {
  // === CORE IDENTITY ===
  databaseKey: 'offices',
  modelName: 'Office',
  actionPrefix: 'office',
  
  // === DISPLAY ===
  display: {
    title: 'Offices',
    singularTitle: 'Office', 
    description: 'Office locations and vendor integrations',
    icon: 'building',
    color: 'blue',
    pluralRules: {
      singular: 'office',
      plural: 'offices'
    }
  },
  
  // === FIELDS ===
  fields: [
    // Auto-generated ID
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: { source: 'auto.uuid' },
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'sm' }
    },
    
    // Primary name field
    {
      key: 'name',
      label: 'Office Name',
      type: 'text',
      required: true,
      placeholder: 'Enter office name',
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'minLength', value: 2, message: 'Name too short' },
        { type: 'maxLength', value: 100, message: 'Name too long' }
      ],
      mobile: { priority: 'high', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'lg', sortable: true }
    },
    
    // URL slug (auto-generated)
    {
      key: 'slug',
      label: 'URL Slug',
      type: 'text',
      autoValue: { source: 'auto.slug', dependency: 'name' },
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'md' }
    },
    
    // Description
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe this office location...',
      mobile: { priority: 'medium', displayFormat: 'text', condensed: true },
      desktop: { showInTable: false, tableWidth: 'xl' }
    },
    
    // Address
    {
      key: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter full address',
      mobile: { priority: 'medium', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'lg' }
    },
    
    // Status with options
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: {
        static: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'maintenance', label: 'Under Maintenance' }
        ]
      },
      mobile: { priority: 'high', displayFormat: 'badge' },
      desktop: { showInTable: true, tableWidth: 'sm', filterable: true }
    },
    
    // Contact email
    {
      key: 'contactEmail',
      label: 'Contact Email',
      type: 'email',
      validation: [
        { type: 'email', message: 'Valid email required' }
      ],
      mobile: { priority: 'medium', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'md' }
    },
    
    // Phone number
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '+1 (555) 123-4567',
      mobile: { priority: 'medium', displayFormat: 'text' },
      desktop: { showInTable: false, tableWidth: 'md' }
    },
    
    // Timezone
    {
      key: 'timezone',
      label: 'Timezone',
      type: 'select',
      options: {
        static: [
          { value: 'America/New_York', label: 'Eastern Time' },
          { value: 'America/Chicago', label: 'Central Time' },
          { value: 'America/Denver', label: 'Mountain Time' },
          { value: 'America/Los_Angeles', label: 'Pacific Time' }
        ]
      },
      mobile: { priority: 'low', displayFormat: 'text' },
      desktop: { showInTable: false, tableWidth: 'md' }
    },
    
    // Configuration JSON
    {
      key: 'config',
      label: 'Configuration',
      type: 'json',
      helpText: 'Advanced office configuration in JSON format',
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'xl' }
    },
    
    // Active flag
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      mobile: { priority: 'medium', displayFormat: 'pill' },
      desktop: { showInTable: true, tableWidth: 'xs', filterable: true }
    }
  ],
  
  // === RELATIONSHIPS ===
  relationships: {
    credential: {
      type: 'one-to-one',
      relatedEntity: 'credentials',
      foreignKey: 'credentialId',
      displayInForm: true,
      displayInDetail: true
    },
    processes: {
      type: 'one-to-many', 
      relatedEntity: 'processes',
      foreignKey: 'officeId',
      displayInDetail: true
    }
  },
  
  // === ACTIONS ===
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    get: true,
    bulkDelete: true,
    custom: [
      {
        id: 'testConnection',
        label: 'Test Connection',
        description: 'Test connection to office systems',
        icon: 'wifi',
        handler: 'testOfficeConnection'
      }
    ]
  }
};
```

### **Node Schema (Hierarchical)**

```typescript
// src/features/nodes/nodes.schema.ts
export const NODE_SCHEMA: ResourceSchema = {
  databaseKey: 'nodes',
  modelName: 'Node', 
  actionPrefix: 'node',
  
  display: {
    title: 'Nodes',
    singularTitle: 'Node',
    description: 'Hierarchical business organization nodes',
    icon: 'folder',
    color: 'orange'
  },
  
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: { source: 'auto.uuid' },
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'sm' }
    },
    {
      key: 'name',
      label: 'Node Name',
      type: 'text',
      required: true,
      mobile: { priority: 'high', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'lg', sortable: true }
    },
    {
      key: 'parentId',
      label: 'Parent Node',
      type: 'select',
      autoValue: { source: 'context.parentId' }, // Auto-populate from navigation
      options: {
        dynamic: {
          resource: 'node',
          valueField: 'id',
          labelField: 'name',
          filter: (item) => item.id !== 'current-node-id' // Don't allow self-reference
        }
      },
      mobile: { priority: 'medium', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'md' }
    },
    {
      key: 'type',
      label: 'Node Type',
      type: 'select',
      required: true,
      defaultValue: 'NODE',
      options: {
        static: [
          { value: 'NODE', label: 'Standard Node' },
          { value: 'CUSTOMER', label: 'Customer Node' },
          { value: 'DEPARTMENT', label: 'Department Node' }
        ]
      },
      mobile: { priority: 'high', displayFormat: 'badge' },
      desktop: { showInTable: true, tableWidth: 'sm', filterable: true }
    },
    {
      key: 'level',
      label: 'Hierarchy Level',
      type: 'number',
      mobile: { priority: 'low', displayFormat: 'text' },
      desktop: { showInTable: true, tableWidth: 'xs' }
    },
    {
      key: 'path',
      label: 'Hierarchy Path',
      type: 'json',
      helpText: 'Auto-calculated hierarchy path',
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'xl' }
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      defaultValue: 0,
      mobile: { priority: 'low', displayFormat: 'hidden' },
      desktop: { showInTable: false, tableWidth: 'xs' }
    }
  ],
  
  relationships: {
    parent: {
      type: 'many-to-one',
      relatedEntity: 'nodes',
      foreignKey: 'parentId',
      displayInForm: true,
      displayInDetail: true
    },
    children: {
      type: 'one-to-many',
      relatedEntity: 'nodes', 
      foreignKey: 'parentId',
      displayInDetail: true
    },
    processes: {
      type: 'many-to-many',
      relatedEntity: 'processes',
      junctionTable: 'node_processes',
      displayInDetail: true
    }
  },
  
  actions: {
    create: true,
    update: true,
    delete: true,
    list: true,
    get: true,
    custom: [
      {
        id: 'duplicate',
        label: 'Duplicate Node',
        handler: 'duplicateNode'
      }
    ]
  }
};
```

---

## Schema Registration

### **Auto-Discovery System**

Schemas are automatically discovered and registered:

```typescript
// src/lib/resource-system/resource-registry.ts

// 1. Import all schemas
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { RULE_SCHEMA } from '@/features/rules/rules.schema';
import { OFFICE_SCHEMA } from '@/features/offices/offices.schema';
import { WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';

// 2. Register in schema array
const SCHEMA_RESOURCES: ResourceSchema[] = [
  NODE_SCHEMA,
  PROCESS_SCHEMA,
  RULE_SCHEMA,
  OFFICE_SCHEMA,
  WORKFLOW_SCHEMA
];

// 3. System auto-generates everything else
export const RESOURCE_REGISTRY = SCHEMA_RESOURCES;
```

### **Adding New Schema**

To add a new resource:

1. **Create schema file:** `src/features/customers/customers.schema.ts`
2. **Export schema constant:** `export const CUSTOMER_SCHEMA`  
3. **Import in registry:** `import { CUSTOMER_SCHEMA } from '@/features/customers/customers.schema'`
4. **Add to array:** `SCHEMA_RESOURCES.push(CUSTOMER_SCHEMA)`

That's it! The system automatically generates:
- ✅ API routes and handlers
- ✅ IndexedDB stores  
- ✅ TypeScript types
- ✅ React hooks
- ✅ UI components
- ✅ Validation rules

---

## Best Practices

### **1. Field Design**
```typescript
// ✅ Good: Complete field definition
{
  key: 'name',
  label: 'Customer Name',
  type: 'text',
  required: true,
  placeholder: 'Enter customer name',
  validation: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Name too short' }
  ],
  mobile: { priority: 'high', displayFormat: 'text' },
  desktop: { showInTable: true, tableWidth: 'lg', sortable: true }
}

// ❌ Bad: Incomplete field definition  
{
  key: 'name',
  type: 'text'
  // Missing: label, mobile config, desktop config, validation
}
```

### **2. Mobile-First Design**
```typescript
// ✅ Good: Mobile-optimized field priorities
{
  key: 'customerName',
  mobile: { priority: 'high', displayFormat: 'text' }      // Essential on mobile
},
{
  key: 'description', 
  mobile: { priority: 'medium', displayFormat: 'text', condensed: true } // Condensed display
},
{
  key: 'internalNotes',
  mobile: { priority: 'low', displayFormat: 'hidden' }     // Hidden on mobile
}

// ❌ Bad: Everything high priority (cluttered mobile UI)
{
  mobile: { priority: 'high', displayFormat: 'text' }  // All fields
}
```

### **3. Relationship Modeling**
```typescript
// ✅ Good: Clear relationship definitions
relationships: {
  office: {
    type: 'many-to-one',
    relatedEntity: 'offices',
    foreignKey: 'officeId',
    displayInForm: true,          // Show dropdown in forms
    displayInTable: true,         // Show in table columns  
    displayInDetail: true         // Show in detail views
  }
}

// ❌ Bad: Unclear relationships
relationships: {
  office: {
    type: 'one-to-one'          // Wrong relationship type
    // Missing: display configuration
  }
}
```

### **4. Validation Strategy**
```typescript
// ✅ Good: Comprehensive validation
validation: [
  { type: 'required', message: 'Email is required' },
  { type: 'email', message: 'Please enter a valid email address' },
  { type: 'custom', 
    message: 'Email must be from company domain',
    validator: (value) => value.endsWith('@company.com')
  }
]

// ❌ Bad: Generic validation messages
validation: [
  { type: 'required', message: 'Required' },    // Not helpful
  { type: 'email', message: 'Invalid' }         // Not specific
]
```

### **5. Action Configuration**
```typescript
// ✅ Good: Thoughtful action enablement
actions: {
  create: true,          // Users can create
  update: true,          // Users can edit
  delete: false,         // Prevent accidental deletion
  custom: [
    {
      id: 'archive',     // Alternative to delete
      label: 'Archive Customer',
      handler: 'archiveCustomer',
      optimistic: true
    }
  ]
}

// ❌ Bad: Enable everything without consideration
actions: {
  create: true,
  update: true, 
  delete: true,          // Dangerous for important data
  bulkDelete: true       // Very dangerous
}
```

### **6. Performance Considerations**
```typescript
// ✅ Good: Performance-optimized field configuration
{
  key: 'description',
  type: 'textarea',
  mobile: { priority: 'low', displayFormat: 'hidden' },      // Don't load on mobile
  desktop: { showInTable: false, tableWidth: 'xl' }          // Don't show in tables (too large)
},
{
  key: 'status', 
  desktop: { showInTable: true, tableWidth: 'xs', filterable: true } // Enable filtering
}

// ❌ Bad: Performance problems
{
  key: 'largeJsonData',
  type: 'json',
  mobile: { priority: 'high', displayFormat: 'text' },       // Large data on mobile
  desktop: { showInTable: true, tableWidth: 'xl' }           // Slows table rendering
}
```

---

## Next Steps

- **[Hooks & Data Fetching](./04-hooks-and-data-fetching.md)** - Learn how schemas drive React hooks
- **[Auto-Generated Components](./05-auto-generated-components.md)** - See how schemas generate UI
- **[Creating New Resources](./06-creating-new-resources.md)** - Step-by-step guide to adding features

Resource Schemas are the **foundation of the entire system**. Master schema design, and you master the platform. 