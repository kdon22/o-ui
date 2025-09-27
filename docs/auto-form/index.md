# Auto-Form Documentation Index

Complete documentation for the Auto-Form system - a powerful, schema-driven form generation system.

## 📚 Complete Documentation

### **[📖 Main README](./README.md)**
Overview, quick start, and navigation to all documentation

### **Core Concepts**
1. **[🚀 Getting Started](./getting-started.md)** - Your first form in 10 minutes
2. **[📋 Schema Definition](./schema-definition.md)** - Complete schema structure guide
3. **[🎛️ Field Types](./field-types.md)** - All available field types and configurations

### **Field Configuration**
4. **[🔍 Select Fields](./select-fields.md)** - Searchable selects, conditional filtering, API integration
5. **[📐 Form Layout](./form-layout.md)** - Rows, columns, responsive design
6. **[✅ Validation](./validation.md)** - Real-time validation, error handling

### **Integration & Advanced**
7. **[🔗 API Integration](./api-integration.md)** - Backend integration, dynamic data loading
8. **[📊 Examples](./examples.md)** - Complete real-world form examples
9. **[⚡ Performance](./performance.md)** - Optimization tips and best practices

### **Design & UX**
10. **[🎨 Design Guidelines](./design-guidelines.md)** - Creating beautiful, accessible forms

---

## 🎯 Quick Navigation

### **I want to...**

**Build my first form** → [Getting Started](./getting-started.md)

**Understand the schema structure** → [Schema Definition](./schema-definition.md)

**Create dropdown lists with filtering** → [Select Fields](./select-fields.md)

**Add validation rules** → [Validation](./validation.md)

**Connect to my API** → [API Integration](./api-integration.md)

**See complete examples** → [Examples](./examples.md)

**Optimize performance** → [Performance](./performance.md)

**Improve design and UX** → [Design Guidelines](./design-guidelines.md)

---

## 🏗️ System Overview

The Auto-Form system generates beautiful, responsive forms from simple schema definitions:

```typescript
// Define once
export const CONTACT_SCHEMA: ResourceSchema = {
  databaseKey: 'contacts',
  modelName: 'Contact',
  actionPrefix: 'contacts',
  display: { title: 'Contacts', icon: 'User' },
  fields: [
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true },
    { key: 'phone', type: 'text' }
  ],
  // ... configuration
};

// Use everywhere
<AutoForm schema={CONTACT_SCHEMA} mode="create" onSubmit={handleSubmit} />
```

**Result**: Complete form with validation, layout, mobile optimization, accessibility, and more.

---

*Start with [Getting Started](./getting-started.md) for a step-by-step tutorial, or jump to any section that interests you!*
