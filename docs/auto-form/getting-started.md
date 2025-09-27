# Getting Started with Auto-Form

This guide will walk you through creating your first form using the Auto-Form system.

## 🎯 Overview

The Auto-Form system generates complete, beautiful forms from simple schema definitions. Instead of building forms manually, you define the structure and behavior in a schema object, and the system handles the rest.

## 📋 Your First Form

Let's create a simple contact form step by step.

### Step 1: Create the Schema

Create a new file `src/features/contact/contact.schema.ts`:

```typescript
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const CONTACT_SCHEMA: ResourceSchema = {
  // Required: System identifiers
  databaseKey: 'contacts',
  modelName: 'Contact',
  actionPrefix: 'contacts',
  
  // UI Configuration
  display: {
    title: 'Contact',
    description: 'Contact information',
    icon: 'User'
  },
  
  // Form Configuration
  form: {
    width: 'md',           // sm, md, lg, xl, full
    layout: 'compact',     // compact, spacious
    showDescriptions: true
  },
  
  // Field Definitions
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      form: { row: 1, width: 'full', order: 1 }
    },
    {
      key: 'name',
      label: 'Full Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter full name',
      form: { row: 2, width: 'full', order: 1 },
      validation: [
        { type: 'required' as const, message: 'Name is required' },
        { type: 'minLength' as const, value: 2, message: 'Name too short' }
      ]
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'name@example.com',
      form: { row: 3, width: 'half', order: 1 },
      validation: [
        { type: 'required' as const, message: 'Email is required' },
        { type: 'email' as const, message: 'Invalid email format' }
      ]
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'text' as const,
      placeholder: '(555) 123-4567',
      form: { row: 3, width: 'half', order: 2 }
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      required: true,
      form: { row: 4, width: 'half', order: 1 },
      options: {
        static: [
          { value: 'CUSTOMER', label: 'Customer' },
          { value: 'SUPPLIER', label: 'Supplier' },
          { value: 'PARTNER', label: 'Partner' }
        ],
        searchable: false // Simple list doesn't need search
      }
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Additional notes...',
      form: { row: 5, width: 'full', order: 1 }
    },
    // System fields (auto-populated)
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const }
    }
  ],
  
  // Search Configuration
  search: {
    fields: ['name', 'email'],
    placeholder: 'Search contacts...',
    fuzzy: true
  },
  
  // Actions Configuration
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: false,
    optimistic: true
  },
  
  // Mobile Configuration
  mobile: {
    cardFormat: 'simple' as const,
    primaryField: 'name',
    secondaryFields: ['email', 'category'],
    showSearch: true,
    showFilters: false
  },
  
  // Desktop Configuration
  desktop: {
    sortField: 'name',
    sortOrder: 'asc' as const,
    editableField: 'name',
    rowActions: true,
    bulkActions: false
  },
  
  // IndexedDB Configuration
  indexedDBKey: (record: any) => record.id
};
```

### Step 2: Create the Component

Create `src/features/contact/components/ContactForm.tsx`:

```typescript
import React from 'react';
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { CONTACT_SCHEMA } from '../contact.schema';

interface ContactFormProps {
  mode: 'create' | 'edit';
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  return (
    <AutoForm
      schema={CONTACT_SCHEMA}
      mode={mode}
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      compact={false}
      enableAnimations={true}
      enableKeyboardShortcuts={true}
    />
  );
};
```

### Step 3: Use in Your Page

Use the form in a page component:

```typescript
import React, { useState } from 'react';
import { ContactForm } from '@/features/contact/components/ContactForm';

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      // Submit to your API
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create contact');
      }
      
      console.log('Contact created:', data);
    } catch (error) {
      console.error('Error:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    // Navigate away or close modal
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Contact</h1>
      
      <ContactForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
```

## 🎯 What Just Happened?

Let's break down what the Auto-Form system did for you:

### 1. **Generated the UI**
- Created a responsive form layout
- Added proper labels, placeholders, and descriptions
- Styled everything consistently
- Made it mobile-friendly automatically

### 2. **Added Validation**
- Real-time validation as users type
- Error messages for invalid fields
- Required field indicators
- Email format validation

### 3. **Handled State**
- Form state management
- Loading states
- Error handling
- Data submission

### 4. **Enhanced UX**
- Keyboard shortcuts (Ctrl+Enter to submit)
- Animations and transitions
- Focus management
- Accessibility features

## 🎨 Form Layout

The form layout system uses a grid approach:

```typescript
form: {
  row: 3,        // Which row (1, 2, 3, etc.)
  width: 'half', // How wide (xs, sm, md, lg, xl, full, half, third, quarter)
  order: 1       // Order within the row (1, 2, 3, etc.)
}
```

**Examples:**
```typescript
// Full width field
form: { row: 1, width: 'full', order: 1 }

// Two fields side by side
form: { row: 2, width: 'half', order: 1 }  // Left side
form: { row: 2, width: 'half', order: 2 }  // Right side

// Three fields in one row
form: { row: 3, width: 'third', order: 1 }
form: { row: 3, width: 'third', order: 2 }
form: { row: 3, width: 'third', order: 3 }
```

## 🔧 Common Configuration

### Auto-Values
Auto-populate fields from session or context:

```typescript
{
  key: 'userId',
  autoValue: { source: 'session.user.id' as const }
},
{
  key: 'createdAt',
  autoValue: { source: 'auto.timestamp' as const }
},
{
  key: 'id',
  autoValue: { source: 'auto.uuid' as const }
}
```

### Validation Rules
```typescript
validation: [
  { type: 'required', message: 'This field is required' },
  { type: 'minLength', value: 3, message: 'Too short' },
  { type: 'maxLength', value: 100, message: 'Too long' },
  { type: 'email', message: 'Invalid email' },
  { type: 'min', value: 0, message: 'Must be positive' },
  { type: 'max', value: 999, message: 'Too large' }
]
```

### Field Types
```typescript
type: 'text'           // Text input
type: 'textarea'       // Multi-line text
type: 'email'          // Email input with validation
type: 'number'         // Number input
type: 'select'         // Dropdown select
type: 'switch'         // Toggle switch
type: 'date'           // Date picker
type: 'tags'           // Tag input
```

## 🚀 Next Steps

Now that you've created your first form, explore these topics:

1. **[Field Types](./field-types.md)** - Learn about all available field types
2. **[Select Fields](./select-fields.md)** - Master dropdown functionality
3. **[Validation](./validation.md)** - Advanced validation techniques
4. **[Examples](./examples.md)** - See more complex real-world examples

## 💡 Tips

- **Start Simple**: Begin with basic fields and add complexity gradually
- **Use Auto-Values**: Let the system populate common fields automatically
- **Mobile-First**: Design for mobile, desktop will follow
- **Consistent Naming**: Use clear, descriptive field keys and labels
- **Validation Early**: Add validation rules as you define fields

---

*Next: [Schema Definition](./schema-definition.md) - Deep dive into schema structure*
