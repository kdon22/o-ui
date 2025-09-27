# Field Types

The Auto-Form system supports a comprehensive set of field types, each optimized for specific data input patterns and user experiences.

## 📋 Complete Field Type Reference

### Text Input Fields

#### `text`
Basic text input for short strings.

```typescript
{
  key: 'firstName',
  label: 'First Name',
  type: 'text' as const,
  required: true,
  placeholder: 'Enter first name',
  validation: [
    { type: 'required', message: 'First name is required' },
    { type: 'minLength', value: 2, message: 'Too short' },
    { type: 'maxLength', value: 50, message: 'Too long' }
  ]
}
```

#### `textarea` 
Multi-line text input for longer content.

```typescript
{
  key: 'description',
  label: 'Description',
  type: 'textarea' as const,
  placeholder: 'Enter detailed description...',
  description: 'Provide a comprehensive description',
  validation: [
    { type: 'maxLength', value: 500, message: 'Description too long' }
  ]
}
```

#### `email`
Email input with built-in validation.

```typescript
{
  key: 'email',
  label: 'Email Address',
  type: 'email' as const,
  required: true,
  placeholder: 'name@example.com',
  validation: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Please enter a valid email' }
  ]
}
```

#### `url`
URL input with validation for web addresses.

```typescript
{
  key: 'website',
  label: 'Website',
  type: 'url' as const,
  placeholder: 'https://example.com',
  validation: [
    { type: 'url', message: 'Please enter a valid URL' }
  ]
}
```

### Numeric Fields

#### `number`
Numeric input for integers and decimals.

```typescript
{
  key: 'age',
  label: 'Age',
  type: 'number' as const,
  required: true,
  placeholder: 'Enter age',
  defaultValue: 0,
  validation: [
    { type: 'required', message: 'Age is required' },
    { type: 'min', value: 0, message: 'Age must be positive' },
    { type: 'max', value: 120, message: 'Age seems too high' }
  ]
}
```

#### `currency`
Specialized number input for monetary values.

```typescript
{
  key: 'price',
  label: 'Price',
  type: 'currency' as const,
  required: true,
  placeholder: '0.00',
  validation: [
    { type: 'required', message: 'Price is required' },
    { type: 'min', value: 0, message: 'Price must be positive' }
  ]
}
```

### Selection Fields

#### `select`
Dropdown selection with searchable options.

```typescript
{
  key: 'category',
  label: 'Category',
  type: 'select' as const,
  required: true,
  placeholder: 'Choose a category',
  options: {
    static: [
      { value: 'ELECTRONICS', label: 'Electronics' },
      { value: 'CLOTHING', label: 'Clothing' },
      { value: 'BOOKS', label: 'Books' }
    ],
    searchable: true // Enable/disable search (default: true)
  },
  validation: [
    { type: 'required', message: 'Please select a category' }
  ]
}
```

#### `switch`
Toggle switch for boolean values.

```typescript
{
  key: 'isActive',
  label: 'Active',
  type: 'switch' as const,
  defaultValue: true,
  description: 'Enable or disable this item'
}
```

#### `radio`
Radio button group for mutually exclusive options.

```typescript
// Vertical layout (default)
{
  key: 'priority',
  label: 'Priority',
  type: 'radio' as const,
  required: true,
  options: {
    static: [
      { value: 'LOW', label: 'Low Priority' },
      { value: 'MEDIUM', label: 'Medium Priority' },
      { value: 'HIGH', label: 'High Priority' }
    ],
    layout: 'vertical' // Default - stacked vertically
  },
  description: 'Select the priority level'
}

// Horizontal layout - good for 2-3 options
{
  key: 'type',
  label: 'Type',
  type: 'radio' as const,
  required: true,
  options: {
    static: [
      { value: 'GDS', label: 'GDS' },
      { value: 'VIRTUAL', label: 'Virtual' }
    ],
    layout: 'horizontal' // Side by side
  },
  description: 'Choose the queue type'
}
```

### Date & Time Fields

#### `date`
Date and time picker.

```typescript
{
  key: 'birthDate',
  label: 'Birth Date',
  type: 'date' as const,
  required: true,
  validation: [
    { type: 'required', message: 'Birth date is required' }
  ]
}
```

### Advanced Fields

#### `tags`
Multi-value tag input.

```typescript
{
  key: 'skills',
  label: 'Skills',
  type: 'tags' as const,
  placeholder: 'Add skills...',
  description: 'Press Enter to add each skill',
  validation: [
    { type: 'maxLength', value: 10, message: 'Maximum 10 skills' }
  ]
}
```

#### `json`
JSON object editor for complex data structures.

```typescript
{
  key: 'metadata',
  label: 'Metadata',
  type: 'json' as const,
  placeholder: '{"key": "value"}',
  description: 'JSON configuration object'
}
```

#### `component-selector`
Select from available system components.

```typescript
{
  key: 'selectedComponents',
  label: 'Components',
  type: 'component-selector' as const,
  options: {
    componentType: 'rules',    // rules, classes, tables, workflows
    multiSelect: true          // Allow multiple selections
  }
}
```

#### `matrix`
Permission or configuration matrix input.

```typescript
{
  key: 'permissions',
  label: 'Permissions',
  type: 'matrix' as const,
  template: 'permission-matrix',
  config: {
    sections: [
      {
        name: 'Users',
        permissions: ['create', 'read', 'update', 'delete']
      },
      {
        name: 'Reports', 
        permissions: ['view', 'export']
      }
    ]
  }
}
```

## 🎨 Field Configuration

### Common Properties

All fields support these common properties:

```typescript
{
  // Required
  key: string,           // Unique field identifier
  label: string,         // Display label
  type: FieldType,       // Field type

  // Optional
  required?: boolean,    // Validation requirement
  placeholder?: string,  // Placeholder text
  description?: string,  // Help text below field
  defaultValue?: any,    // Default value
  
  // Auto-population
  autoValue?: {
    source: 'auto.uuid' | 'session.user.id' | 'auto.timestamp'
  },
  
  // Form layout
  form?: {
    row: number,         // Grid row (1, 2, 3...)
    width: FieldWidth,   // Field width
    order: number        // Order within row
  },
  
  // Validation rules
  validation?: ValidationRule[],
  
  // UI behavior  
  clickable?: boolean,
  clickAction?: {
    type: 'edit' | 'navigate',
    url?: string
  }
}
```

### Field Width Options

```typescript
type FieldWidth = 
  | 'xs'        // Extra small (2 cols)
  | 'sm'        // Small (3 cols) 
  | 'md'        // Medium (4 cols)
  | 'lg'        // Large (6 cols)
  | 'xl'        // Extra large (8 cols)
  | 'full'      // Full width (12 cols)
  | 'half'      // Half width (6 cols)
  | 'third'     // One third (4 cols)  
  | 'quarter'   // One quarter (3 cols)
  | '3quarters' // Three quarters (9 cols)
```

### Validation Rules

```typescript
validation: [
  { type: 'required', message: 'This field is required' },
  { type: 'minLength', value: 3, message: 'Minimum 3 characters' },
  { type: 'maxLength', value: 100, message: 'Maximum 100 characters' },
  { type: 'min', value: 0, message: 'Must be positive' },
  { type: 'max', value: 999, message: 'Must be under 1000' },
  { type: 'email', message: 'Invalid email format' },
  { type: 'url', message: 'Invalid URL format' },
  { type: 'pattern', value: /^[A-Z]+$/, message: 'Uppercase only' }
]
```

## 🔧 Field Options

### Static Options
For predetermined lists:

```typescript
options: {
  static: [
    { value: 'SMALL', label: 'Small', icon: 'Circle' },
    { value: 'MEDIUM', label: 'Medium', icon: 'Circle' },
    { value: 'LARGE', label: 'Large', icon: 'Circle', disabled: true }
  ],
  searchable: false  // Disable search for short lists
}
```

### Dynamic Options
For API-driven lists:

```typescript
options: {
  dynamic: {
    resource: 'categories',     // API endpoint: /api/categories
    valueField: 'id',          // Field to use as value
    labelField: 'name',        // Field to display as label
    displayField: 'description' // Additional field for UI
  },
  searchable: true             // Enable search (default)
}
```

### Conditional Options
For filtered lists based on other fields:

```typescript
options: {
  dynamic: {
    resource: 'offices',
    valueField: 'id',
    labelField: 'name'
  },
  conditional: [
    {
      watchField: 'region',           // Watch this field
      apiFilters: {
        region: '{value}'             // Add filter to API call
      }
    },
    {
      watchField: 'type',
      apiFilters: {
        type: (value: string) =>      // Function-based filter
          value === 'MAIN' ? { isHeadquarters: true } : {}
      },
      localFilter: (option, watchedValue) => {
        // Additional client-side filtering
        return option.metadata.isActive === true;
      }
    }
  ]
}
```

## 📱 Mobile & Desktop Configuration

### Mobile Display Options
```typescript
mobile: {
  priority: 'high',           // high, medium, low
  displayFormat: 'text',      // text, badge, hidden
  tableWidth: 'lg'            // Column width in mobile tables
}
```

### Desktop Display Options
```typescript
desktop: {
  tableWidth: 'md'            // Column width in desktop tables
}
```

### Table Configuration
```typescript
table: {
  width: 'lg',                // Column width
  filterable: true,           // Enable column filtering
  sortable: true              // Enable column sorting
}
```

## 🎯 Field Selection Guide

### Choose by Data Type

| Data Type | Recommended Field | Example |
|-----------|------------------|---------|
| Short text | `text` | Name, title, code |
| Long text | `textarea` | Description, notes |
| Email | `email` | Contact email |
| URL | `url` | Website, social links |
| Numbers | `number` | Age, quantity, score |
| Money | `currency` | Price, salary, budget |
| True/false | `switch` | Active, enabled, public |
| Pick one | `select` | Category, status, type |
| Pick one (small list) | `radio` | Priority, type (2-5 options) |
| Pick many | `tags` | Skills, interests, tags |
| Date/time | `date` | Birthday, deadline, created |
| Complex data | `json` | Settings, metadata |
| System data | Auto-values | ID, timestamps, user info |

### Choose by Use Case

| Use Case | Field Type | Configuration |
|----------|------------|---------------|
| User registration | `text`, `email`, `switch` | Required validation |
| Product catalog | `text`, `currency`, `select`, `textarea` | Categories, pricing |
| Settings form | `switch`, `select`, `radio`, `number` | User preferences |
| Content creation | `text`, `textarea`, `tags`, `date` | Articles, posts |
| Data import | `json`, `tags` | Configuration, mapping |

## 💡 Best Practices

### Field Naming
```typescript
// Good
key: 'firstName'      // camelCase, descriptive
key: 'isActive'       // Boolean prefix
key: 'birthDate'      // Clear purpose

// Avoid
key: 'field1'         // Non-descriptive
key: 'user_name'      // snake_case
key: 'data'           // Too generic
```

### Required Fields
```typescript
// Mark truly required fields
required: true,
validation: [
  { type: 'required', message: 'Name is required' }
]

// Use helpful error messages
validation: [
  { type: 'required', message: 'Please enter your email address' }
  // Not: { type: 'required', message: 'Required' }
]
```

### Placeholder Text
```typescript
// Good - shows expected format
placeholder: 'name@example.com'
placeholder: '(555) 123-4567'
placeholder: 'Enter product name'

// Avoid - not helpful
placeholder: 'Enter value'
placeholder: 'Required field'
```

### Progressive Enhancement
Start simple, add features as needed:

```typescript
// Phase 1: Basic field
{ key: 'name', type: 'text', required: true }

// Phase 2: Add validation
{ 
  key: 'name', 
  type: 'text', 
  required: true,
  validation: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Too short' }
  ]
}

// Phase 3: Add layout and description
{
  key: 'name',
  type: 'text',
  required: true,
  placeholder: 'Enter full name',
  description: 'First and last name',
  form: { row: 1, width: 'full', order: 1 },
  validation: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Name too short' },
    { type: 'maxLength', value: 100, message: 'Name too long' }
  ]
}
```

---

*Next: [Select Fields](./select-fields.md) - Master dropdown functionality*
