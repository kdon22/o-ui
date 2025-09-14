# Feature Schema System Documentation

**Complete developer guide for schema-driven development with auto-generated components**

## 🎯 Overview

The Feature Schema System is the **Single Source of Truth (SSOT)** for all data structures, UI components, and business logic in the application. Define a schema once, get complete CRUD systems automatically.

### **What You Get**

From a single schema definition, the system automatically generates:

- ✅ **React Components**: AutoForm, AutoTable, AutoModal, AutoTree
- ✅ **API Endpoints**: RESTful endpoints with validation
- ✅ **IndexedDB Stores**: Optimized with <50ms read performance
- ✅ **TypeScript Types**: Complete type definitions
- ✅ **Action System**: CRUD operations with optimistic updates
- ✅ **Validation**: Zod schemas with custom rules
- ✅ **Mobile-First UI**: Responsive components out of the box

### **Zero-Code Example**

```typescript
// 1. Define Schema
export const PRODUCT_SCHEMA: ResourceSchema = {
  databaseKey: 'products',
  modelName: 'Product',
  actionPrefix: 'products',
  fields: [/* field definitions */],
  indexedDBKey: (record: any) => record.id
};

// 2. Register Schema
// Add to resource-registry.ts

// 3. Use Auto-Generated Components
<AutoTable resourceKey="products" />
<AutoForm schema={PRODUCT_SCHEMA} mode="create" />
<AutoModal schema={PRODUCT_SCHEMA} config={{ resource: 'products', action: 'create' }} />
```

**Result**: Complete CRUD interface with forms, tables, modals, validation, offline support, and mobile-responsive design!

---

## 📚 Documentation Structure

### **Core Guides** (Read in Order)

| Guide | Description | When to Read |
|-------|-------------|--------------|
| **[00-system-overview.md](./00-system-overview.md)** | Architecture, concepts, quick start | **Start here** - Essential foundation |
| **[01-field-configuration.md](./01-field-configuration.md)** | Complete field types and options reference | When defining schema fields |
| **[02-registration-integration.md](./02-registration-integration.md)** | How to register and integrate schemas | When adding new features |
| **[03-auto-generated-integration.md](./03-auto-generated-integration.md)** | Using AutoForm, AutoTable, AutoModal, AutoTree | When building UI components |
| **[04-examples-recipes.md](./04-examples-recipes.md)** | Real-world patterns and solutions | When solving complex scenarios |

### **Reference Documentation**

| Document | Description |
|----------|-------------|
| **[AutoForm Documentation](../auto-generated/auto-form.md)** | Complete form system reference |
| **[AutoTable Documentation](../auto-generated/auto-table.md)** | Complete table system reference |
| **[Action System Guide](../action-system/)** | Backend integration and API |
| **[Architecture Guides](../architecture/)** | System design and patterns |

---

## 🚀 Quick Start Paths

### **Path 1: I'm New to the System**

1. **[System Overview](./00-system-overview.md)** - Understand the architecture
2. **[Field Configuration](./01-field-configuration.md)** - Learn field types and options
3. **[Registration Guide](./02-registration-integration.md)** - Register your first schema
4. **[AutoForm Integration](./03-auto-generated-integration.md#autoform-integration)** - Build your first form

### **Path 2: I Need to Add a New Feature**

1. **[Registration Guide](./02-registration-integration.md)** - Registration process
2. **[Field Configuration](./01-field-configuration.md)** - Configure your fields
3. **[Examples & Recipes](./04-examples-recipes.md#complete-feature-examples)** - Follow proven patterns

### **Path 3: I'm Building Complex UI**

1. **[AutoTable Integration](./03-auto-generated-integration.md#autotable-integration)** - Data tables
2. **[AutoModal Integration](./03-auto-generated-integration.md#automodal-integration)** - Modal dialogs
3. **[Advanced Patterns](./04-examples-recipes.md#ui-pattern-recipes)** - Complex UI patterns

### **Path 4: I'm Working with Relationships**

1. **[Junction Table Recipes](./04-examples-recipes.md#junction-table-recipes)** - Many-to-many relationships
2. **[Advanced Relationships](./04-examples-recipes.md#advanced-relationship-patterns)** - Complex relationships
3. **[Registration Guide](./02-registration-integration.md#junction-table-registration)** - Junction registration

---

## 🛠️ Common Tasks

### **Create a New Feature**

```bash
# 1. Create schema file
mkdir src/features/products
touch src/features/products/products.schema.ts

# 2. Define schema (see examples in guides)
# 3. Register in resource-registry.ts
# 4. Use auto-generated components
```

**Guides**: [Registration Guide](./02-registration-integration.md) → [Examples](./04-examples-recipes.md#complete-feature-examples)

### **Add New Field Types**

**Guide**: [Field Configuration](./01-field-configuration.md#field-types-overview)

### **Create Custom Validation**

**Guide**: [Validation Recipes](./04-examples-recipes.md#validation-recipes)

### **Build Master-Detail UI**

**Guide**: [UI Pattern Recipes](./04-examples-recipes.md#ui-pattern-recipes)

### **Handle Junction Tables**

**Guide**: [Junction Table Recipes](./04-examples-recipes.md#junction-table-recipes)

### **Optimize Performance**

**Guide**: [Performance Patterns](./04-examples-recipes.md#performance-patterns)

### **Migrate Existing Code**

**Guide**: [Migration Patterns](./04-examples-recipes.md#migration-patterns)

---

## 🔧 Troubleshooting

### **Common Issues**

| Issue | Solution | Guide |
|-------|----------|-------|
| "Store not found" error | Check schema registration | [Registration Guide](./02-registration-integration.md#troubleshooting) |
| Form fields not showing | Add form configuration | [Field Configuration](./01-field-configuration.md#form-configuration) |
| Table columns missing | Add display configuration | [Field Configuration](./01-field-configuration.md#table-configuration) |
| Validation not working | Check validation rules | [Validation Recipes](./04-examples-recipes.md#validation-recipes) |
| Junction tables not working | Verify junction registration | [Registration Guide](./02-registration-integration.md#junction-table-registration) |

### **Debug Tools**

```tsx
// Enable debug mode
<AutoForm
  schema={YOUR_SCHEMA}
  enableDebug={process.env.NODE_ENV === 'development'}
  // ... other props
/>

// Check registration
import { getIndexedDBStoreConfigs } from '@/lib/resource-system/resource-registry';
console.log('Available stores:', getIndexedDBStoreConfigs().map(s => s.name));
```

---

## 📋 Checklists

### **New Schema Checklist**

- [ ] Schema file created with BULLETPROOF 3-FIELD DESIGN
- [ ] All required fields have form/table configuration
- [ ] `indexedDBKey` function implemented
- [ ] Schema registered in resource-registry.ts
- [ ] TypeScript types exported
- [ ] Validation rules defined
- [ ] Tested with AutoForm and AutoTable

### **Production Readiness Checklist**

- [ ] All CRUD operations working
- [ ] Mobile responsive design tested
- [ ] Offline functionality verified
- [ ] Performance optimized (memoization, lazy loading)
- [ ] Error handling implemented
- [ ] Junction relationships working (if applicable)
- [ ] Branch operations tested (if applicable)

---

## 🎯 Best Practices

### **Schema Design**

1. **Follow Naming Conventions**
   ```typescript
   databaseKey: 'products',    // Plural, lowercase
   modelName: 'Product',       // Singular, PascalCase
   actionPrefix: 'products',   // Same as databaseKey
   ```

2. **Use Standard System Fields**
   ```typescript
   fields: [
     { key: 'id', autoValue: { source: 'auto.uuid', required: true } },
     { key: 'tenantId', autoValue: { source: 'session.user.tenantId', required: true } },
     { key: 'branchId', autoValue: { source: 'session.user.branchContext.currentBranchId', required: true } },
     // ... your custom fields
   ]
   ```

3. **Configure Display Options**
   ```typescript
   {
     key: 'name',
     form: { row: 1, width: 'full', order: 1, showInForm: true },
     mobile: { priority: 'high', showInTable: true },
     desktop: { showInTable: true, tableWidth: 'lg' }
   }
   ```

### **Performance**

1. **Use Memoization**
   ```tsx
   const MemoizedAutoTable = memo(AutoTable);
   ```

2. **Add Filters**
   ```tsx
   <AutoTable 
     resourceKey="products"
     filters={{ isActive: true }}  // Reduce data load
   />
   ```

3. **Lazy Load Components**
   ```tsx
   const AutoTable = lazy(() => import('@/components/auto-generated/table/auto-table'));
   ```

### **Error Handling**

1. **Add Error Boundaries**
   ```tsx
   <ErrorBoundary>
     <AutoForm schema={YOUR_SCHEMA} />
   </ErrorBoundary>
   ```

2. **Handle Loading States**
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <AutoTable resourceKey="products" />
   </Suspense>
   ```

---

## 🔗 Related Systems

### **Action System**
- **Purpose**: Backend API integration and data synchronization
- **Guide**: [Action System Documentation](../action-system/)
- **Key Features**: Optimistic updates, offline support, branch awareness

### **Resource System**
- **Purpose**: Schema management and auto-discovery
- **Files**: `src/lib/resource-system/`
- **Key Features**: Type safety, validation, relationship management

### **Auto-Generated Components**
- **Purpose**: UI components generated from schemas
- **Files**: `src/components/auto-generated/`
- **Key Features**: Mobile-first, responsive, accessible

### **IndexedDB Integration**
- **Purpose**: Local data storage and caching
- **Performance**: <50ms reads, offline support
- **Features**: Branch awareness, compound keys, automatic indexes

---

## 🆕 What's New

### **Recent Updates**

- ✅ **Junction Auto-Discovery**: Automatic junction table registration
- ✅ **Context-Aware Auto-Population**: Smart field pre-filling
- ✅ **Mobile-First Design**: Optimized for touch interfaces
- ✅ **Branch-Aware Operations**: Complete workspace isolation
- ✅ **Performance Optimizations**: <50ms IndexedDB reads

### **Coming Soon**

- 🔄 **Real-time Collaboration**: Multi-user editing support
- 🔄 **Advanced Validation**: Server-side validation rules
- 🔄 **Bulk Operations**: Enhanced bulk editing capabilities
- 🔄 **Export/Import**: Data export and import functionality

---

## 💡 Tips & Tricks

### **Development**

- Use the debug component to verify schema registration
- Enable development mode for additional debugging features
- Test with different screen sizes for responsive design
- Use browser dev tools to inspect IndexedDB stores

### **Debugging**

- Check browser console for action system logs
- Verify schema registration with debug tools
- Test offline functionality by disabling network
- Use React DevTools to inspect component state

### **Performance**

- Use filters to reduce data load
- Implement lazy loading for heavy components
- Memoize components that don't change frequently
- Monitor IndexedDB performance in dev tools

---

## 🤝 Contributing

### **Adding New Features**

1. Follow the patterns in existing schemas
2. Add comprehensive documentation
3. Include examples and recipes
4. Test with auto-generated components
5. Update this documentation

### **Improving Documentation**

1. Keep examples practical and complete
2. Include troubleshooting steps
3. Add cross-references between guides
4. Test all code examples

---

## 📞 Support

### **Getting Help**

1. **Check Documentation**: Start with the relevant guide above
2. **Search Examples**: Look for similar patterns in [Examples & Recipes](./04-examples-recipes.md)
3. **Debug Tools**: Use the debug components and console logs
4. **Code Review**: Compare with working examples in the codebase

### **Common Questions**

**Q: How do I add a new field type?**
A: See [Field Configuration Guide](./01-field-configuration.md#field-types-overview)

**Q: Why aren't my fields showing in forms?**
A: Check the form configuration in [Field Configuration](./01-field-configuration.md#form-configuration)

**Q: How do I create junction tables?**
A: Follow [Junction Table Recipes](./04-examples-recipes.md#junction-table-recipes)

**Q: How do I optimize performance?**
A: See [Performance Patterns](./04-examples-recipes.md#performance-patterns)

---

**Start your schema-driven development journey**: Begin with [System Overview](./00-system-overview.md) 🚀
