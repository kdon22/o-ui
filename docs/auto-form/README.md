# Auto-Form System Documentation

The Auto-Form system is a powerful, schema-driven form generation system that creates beautiful, responsive forms with minimal configuration.

## 🚀 Quick Start

```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { QUEUE_SCHEMA } from '@/features/queues/queues.schema';

function QueueForm() {
  return (
    <AutoForm
      schema={QUEUE_SCHEMA}
      mode="create"
      onSubmit={async (data) => {
        console.log('Form data:', data);
      }}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## 📚 Documentation Structure

### Core Concepts
- **[Getting Started](./getting-started.md)** - Basic setup and your first form
- **[Schema Definition](./schema-definition.md)** - How to define form schemas
- **[Field Types](./field-types.md)** - All available field types and their configurations

### Field Configuration
- **[Field Options](./field-options.md)** - Static, dynamic, and conditional options
- **[Select Fields](./select-fields.md)** - Searchable selects, conditional filtering, API integration
- **[Form Layout](./form-layout.md)** - Rows, columns, tabs, responsive design
- **[Validation](./validation.md)** - Field validation rules and error handling

### Advanced Features
- **[Auto-Values](./auto-values.md)** - Automatic field population from context
- **[Context Integration](./context-integration.md)** - Session, navigation, and parent data
- **[API Integration](./api-integration.md)** - Dynamic options, conditional filtering
- **[Custom Fields](./custom-fields.md)** - Creating custom field types

### Best Practices
- **[Design Guidelines](./design-guidelines.md)** - UI/UX best practices
- **[Performance](./performance.md)** - Optimization tips
- **[Examples](./examples.md)** - Real-world examples and patterns

## ✨ Key Features

- **🎯 Schema-Driven**: Define forms with simple schema objects
- **📱 Mobile-First**: Responsive design that works on all devices  
- **🔍 Smart Selects**: Searchable dropdowns with conditional filtering
- **⚡ Auto-Population**: Automatic field values from session/context
- **🎨 Beautiful UI**: Consistent, modern design out of the box
- **🔄 Real-time Validation**: Instant feedback as users type
- **🚀 Performance**: Optimized for speed with minimal re-renders

## 🏗️ Architecture Overview

```
Auto-Form System
├── AutoForm Component        # Main form container
├── FormField Component      # Individual field renderer
├── Field Types             # Text, Select, Switch, etc.
├── Select System           # Unified searchable selects
├── Validation System       # Real-time validation
└── Schema System          # Type-safe schema definitions
```

## 🎯 Philosophy

The Auto-Form system follows these principles:

1. **Configuration over Code** - Define forms with data, not components
2. **Mobile-First** - Every form works beautifully on mobile
3. **Developer Experience** - TypeScript support, clear APIs, helpful errors
4. **User Experience** - Fast, intuitive, accessible forms
5. **Consistency** - All forms look and behave the same way

## 🔧 Installation & Setup

The Auto-Form system is already integrated into your project. To use it:

1. **Import the schema type**:
   ```typescript
   import type { ResourceSchema } from '@/lib/resource-system/schemas';
   ```

2. **Define your schema**:
   ```typescript
   export const MY_SCHEMA: ResourceSchema = {
     databaseKey: 'myEntity',
     modelName: 'MyEntity',
     actionPrefix: 'myEntity',
     display: { title: 'My Entity', icon: 'Plus' },
     fields: [/* field definitions */],
     // ... other config
   };
   ```

3. **Use in your component**:
   ```typescript
   import { AutoForm } from '@/components/auto-generated/form/auto-form';
   
   <AutoForm schema={MY_SCHEMA} mode="create" onSubmit={handleSubmit} />
   ```

## 🚀 Next Steps

1. **Start with [Getting Started](./getting-started.md)** for a step-by-step tutorial
2. **Review [Examples](./examples.md)** for common patterns
3. **Explore [Field Types](./field-types.md)** to understand all available options
4. **Check [Select Fields](./select-fields.md)** for advanced dropdown functionality

---

*This documentation covers the complete Auto-Form system. Each page builds on the previous, so we recommend reading in order for the best learning experience.*
