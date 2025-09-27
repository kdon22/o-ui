# Schema Definition

Resource schemas are the heart of the Auto-Form system. They define everything about your form: structure, behavior, validation, and appearance.

## 📋 Schema Structure

```typescript
export interface ResourceSchema {
  // REQUIRED: System Identifiers
  databaseKey: string;      // IndexedDB store + API endpoints
  modelName: string;        // Prisma model access
  actionPrefix: string;     // Action naming
  
  // Context Configuration
  notHasTenantContext?: boolean;  // Disable tenant filtering
  notHasBranchContext?: boolean;  // Disable branch filtering
  notHasAuditFields?: boolean;    // Disable audit fields
  
  // Server Configuration
  serverOnly?: boolean;           // Force server-only operations
  cacheStrategy?: 'indexeddb' | 'memory' | 'server-only';
  
  // REQUIRED: UI Display
  display: DisplayConfig;
  
  // REQUIRED: Field Definitions
  fields: FieldSchema[];
  
  // Form Configuration
  form?: FormConfig;
  
  // Search and Filtering
  search: SearchConfig;
  filtering?: FilteringConfig;
  
  // Actions Configuration
  actions: ActionsConfig;
  rowActions?: RowActionConfig[];
  
  // Layout Configuration
  mobile: MobileConfig;
  desktop: DesktopConfig;
  table?: TableConfig;
  
  // Relationships
  relationships?: Record<string, RelationshipConfig>;
  
  // Hooks
  hooks?: HooksConfig;
  
  // IndexedDB
  indexedDBKey?: ((record: any) => string) | null;
}
```

## 🎯 Required Sections

### System Identifiers
```typescript
{
  databaseKey: 'contacts',    // Used for API endpoints: /api/contacts
  modelName: 'Contact',       // Prisma model name
  actionPrefix: 'contacts'    // Action system prefix: contacts.create
}
```

### Display Configuration
```typescript
display: {
  title: 'Contacts',                    // Plural form for lists
  description: 'Customer contacts',     // Short description
  icon: 'User'                         // Lucide icon name
}
```

### Fields Array
```typescript
fields: [
  {
    key: 'name',              // Field identifier
    label: 'Full Name',       // Display label
    type: 'text' as const,    // Field type
    required: true,           // Validation
    form: {                   // Layout configuration
      row: 1,
      width: 'full',
      order: 1
    }
  }
  // ... more fields
]
```

### Search Configuration
```typescript
search: {
  fields: ['name', 'email'],         // Searchable fields
  placeholder: 'Search contacts...',  // Search input placeholder
  fuzzy: true                        // Enable fuzzy matching
}
```

### Actions Configuration
```typescript
actions: {
  create: true,      // Enable create action
  update: true,      // Enable update action
  delete: true,      // Enable delete action
  duplicate: false,  // Disable duplicate action
  bulk: false,       // Disable bulk actions
  optimistic: true   // Enable optimistic updates
}
```

### Mobile & Desktop Configuration
```typescript
mobile: {
  cardFormat: 'simple' as const,           // simple, detailed, compact
  primaryField: 'name',                    // Main field to display
  secondaryFields: ['email', 'category'],  // Additional fields
  showSearch: true,                        // Show search bar
  showFilters: false                       // Show filter options
},

desktop: {
  sortField: 'name',              // Default sort field
  sortOrder: 'asc' as const,      // Default sort direction
  editableField: 'name',          // Click-to-edit field
  rowActions: true,               // Show row actions
  bulkActions: false              // Show bulk actions
}
```

## 🔧 Optional Sections

### Form Configuration
```typescript
form: {
  width: 'md',              // Form container width
  layout: 'compact',        // Layout style
  showDescriptions: true,   // Show field descriptions
  submitButtonText: 'Save', // Custom submit text
  cancelButtonText: 'Cancel'
}
```

### Table Configuration
```typescript
table: {
  width: 'full',
  bulkSelect: true,        // Enable bulk selection
  columnFilter: true,      // Enable column filters
  sortableColumns: true,   // Enable column sorting
  bulkSelectOptions: [     // Bulk action options
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: 'Trash2',
      description: 'Delete selected items',
      handler: 'bulkDelete'
    }
  ]
}
```

### Row Actions
```typescript
rowActions: [
  {
    key: 'edit',
    label: 'Edit',
    icon: 'Edit',
    variant: 'default' as const,
    size: 'sm' as const,
    actionType: 'navigate' as const,
    url: '/contacts/{id}/edit',
    tooltip: 'Edit contact'
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: 'Trash2',
    variant: 'destructive' as const,
    actionType: 'mutation' as const,
    mutation: {
      action: 'contacts.delete',
      confirmMessage: 'Delete this contact?'
    }
  }
]
```

### Filtering Configuration
```typescript
filtering: {
  level1: {
    title: 'Category',
    filterField: 'category',
    tabs: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'customers', label: 'Customers', value: 'CUSTOMER', icon: 'User' },
      { id: 'suppliers', label: 'Suppliers', value: 'SUPPLIER', icon: 'Truck' }
    ],
    showAll: true,
    defaultTab: 'all'
  }
}
```

### Relationships
```typescript
relationships: {
  'orders': {
    type: 'one-to-many',
    relatedEntity: 'orders',
    accessor: 'orders',
    foreignKey: 'contactId',
    description: 'Customer orders'
  }
}
```

### Hooks
```typescript
hooks: {
  beforeCreate: 'validateContact',
  afterCreate: 'sendWelcomeEmail',
  beforeUpdate: 'checkPermissions',
  afterUpdate: 'notifyChanges'
}
```

## 🏗️ Schema Organization

### File Structure
```
src/features/contacts/
├── contact.schema.ts        # Main schema definition
├── types.ts                # TypeScript types
├── components/
│   ├── ContactForm.tsx     # Form component
│   └── ContactList.tsx     # List component
└── hooks/
    ├── useContacts.ts      # Data hooks
    └── useContactForm.ts   # Form hooks
```

### Schema File Template
```typescript
// src/features/contacts/contact.schema.ts
import { z } from 'zod';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// Zod Schema for Validation
export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  // ... other fields
});

export type Contact = z.infer<typeof ContactSchema>;

// Resource Schema for Auto-Form
export const CONTACT_SCHEMA: ResourceSchema = {
  databaseKey: 'contacts',
  modelName: 'Contact',
  actionPrefix: 'contacts',
  
  display: {
    title: 'Contacts',
    description: 'Manage customer contacts',
    icon: 'User'
  },
  
  fields: [
    // Field definitions...
  ],
  
  // Other configuration...
};
```

## 🎨 Schema Best Practices

### Naming Conventions
```typescript
// Good
databaseKey: 'contacts'      // Lowercase, plural
modelName: 'Contact'         // PascalCase, singular  
actionPrefix: 'contacts'     // Lowercase, plural

// Field keys
key: 'firstName'             // camelCase
key: 'email'                 // Descriptive
key: 'isActive'              // Boolean prefix
```

### Field Organization
```typescript
fields: [
  // 1. ID field first
  { key: 'id', type: 'text', autoValue: { source: 'auto.uuid' } },
  
  // 2. Main business fields
  { key: 'name', type: 'text', required: true },
  { key: 'email', type: 'email', required: true },
  
  // 3. Optional business fields
  { key: 'phone', type: 'text' },
  { key: 'notes', type: 'textarea' },
  
  // 4. System fields last
  { key: 'tenantId', autoValue: { source: 'session.user.tenantId' } },
  { key: 'createdAt', autoValue: { source: 'auto.timestamp' } }
]
```

### Progressive Enhancement
Start simple and add complexity:

```typescript
// Phase 1: Basic schema
export const CONTACT_SCHEMA: ResourceSchema = {
  databaseKey: 'contacts',
  modelName: 'Contact', 
  actionPrefix: 'contacts',
  display: { title: 'Contacts', icon: 'User' },
  fields: [
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true }
  ],
  search: { fields: ['name'], placeholder: 'Search...' },
  actions: { create: true, update: true, delete: true }
  // Minimal mobile/desktop config
};

// Phase 2: Add validation, layout, descriptions
// Phase 3: Add relationships, hooks, advanced features
```

## 🔍 Schema Validation

The system validates your schema at runtime:

```typescript
// This will show helpful error messages
const schema: ResourceSchema = {
  // Missing required fields will be caught
  databaseKey: 'contacts',
  // modelName: 'Contact', // ❌ Error: missing required field
  
  fields: [
    {
      key: 'name',
      // type: 'text', // ❌ Error: missing required field
      label: 'Name'
    }
  ]
};
```

## 💡 Tips

1. **Start Minimal**: Begin with required fields only, add features gradually
2. **Use TypeScript**: Leverage type checking for schema validation
3. **Consistent Patterns**: Follow the same patterns across all schemas
4. **Auto-Values**: Use auto-values for system fields (ID, timestamps, etc.)
5. **Mobile-First**: Design for mobile, desktop will adapt
6. **Descriptive Names**: Use clear, descriptive field keys and labels

---

*Next: [Field Types](./field-types.md) - Learn about all available field types*
