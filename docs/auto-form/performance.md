# Performance Optimization

The Auto-Form system is designed for high performance, but proper configuration and usage patterns can further enhance speed and user experience.

## 🎯 Performance Overview

Key performance considerations:
- **Minimal Re-renders** - Smart component optimization
- **Efficient API Calls** - Caching and debouncing
- **Fast Validation** - Optimized validation rules
- **Lazy Loading** - Load data when needed
- **Bundle Size** - Tree-shaking and code splitting

## ⚡ Form-Level Optimizations

### Schema Optimization
```typescript
// Good: Focused, minimal schema
export const SIMPLE_CONTACT_SCHEMA: ResourceSchema = {
  databaseKey: 'contacts',
  modelName: 'Contact', 
  actionPrefix: 'contacts',
  
  fields: [
    // Only include fields you actually need
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true },
    { key: 'phone', type: 'text' }
  ],
  
  // Minimal configuration
  search: { fields: ['name'], fuzzy: false },
  actions: { create: true, update: true, delete: false }
};

// Avoid: Over-configured schema with unused features
export const BLOATED_SCHEMA: ResourceSchema = {
  // ... same basic config
  
  fields: [
    // Don't include fields you don't use
    { key: 'unusedField1', type: 'text' },
    { key: 'unusedField2', type: 'select', options: { /* large options list */ } },
    // ... many unused fields
  ],
  
  // Don't over-configure if not needed
  search: { fields: ['name', 'email', 'phone', 'unusedField1'], fuzzy: true },
  filtering: { /* complex filtering not used */ },
  relationships: { /* unused relationships */ }
};
```

### Field Configuration
```typescript
// Good: Efficient field setup
{
  key: 'category',
  type: 'select' as const,
  options: {
    static: [
      { value: 'A', label: 'Category A' },
      { value: 'B', label: 'Category B' }
    ],
    searchable: false  // Disable search for short lists
  }
}

// Good: Lazy loading for large datasets
{
  key: 'userId',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'users',      // Only loads when field is focused
      valueField: 'id',
      labelField: 'name'
    }
    // searchable: true by default for dynamic options
  }
}
```

## 🔍 Select Field Optimizations

### Static vs Dynamic Options
```typescript
// Prefer static for small, fixed lists
{
  key: 'priority',
  options: {
    static: [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' }, 
      { value: 'HIGH', label: 'High' }
    ],
    searchable: false  // No search needed
  }
}

// Use dynamic only when necessary
{
  key: 'assigneeId',
  options: {
    dynamic: {
      resource: 'users',  // Could be 1000+ users
      valueField: 'id',
      labelField: 'name'
    }
    // searchable: true (needed for large lists)
  }
}
```

### Conditional Loading Optimization
```typescript
// Good: Efficient conditional loading
{
  key: 'cityId',
  options: {
    dynamic: { resource: 'cities', valueField: 'id', labelField: 'name' },
    conditional: [
      {
        watchField: 'countryId',  // Clear dependency
        apiFilters: { countryId: '{value}' }  // Simple filter
      }
    ]
  }
}

// Avoid: Over-complex conditional logic
{
  key: 'complexField',
  options: {
    conditional: [
      {
        watchField: 'field1',
        apiFilters: {
          // Complex function that runs on every change
          complex: (value) => {
            // Heavy computation here
            const result = performComplexCalculation(value);
            return { filter: result };
          }
        },
        localFilter: (option, watchedValue) => {
          // More heavy computation
          return performAnotherComplexCalculation(option, watchedValue);
        }
      }
    ]
  }
}
```

## 📡 API Performance

### Request Optimization
```typescript
// The system automatically optimizes API calls:

// 1. Caching: Same endpoint + params = cached response
GET /api/categories?tenantId=abc123  // First call: hits server
GET /api/categories?tenantId=abc123  // Second call: from cache

// 2. Debouncing: Rapid changes are debounced
// User types "a", "ab", "abc" quickly
// Only final "abc" triggers API call

// 3. Request deduplication: Multiple identical requests = single API call
// Multiple components requesting same data = one network request
```

### Backend Optimization Tips
```typescript
// Good: Optimized API endpoint
app.get('/api/categories', async (req, res) => {
  const { tenantId, isActive = 'true' } = req.query;
  
  // Use database indexes
  const categories = await Category.find({
    tenantId,
    isActive: isActive === 'true'
  })
  .select('id name isActive')  // Only return needed fields
  .limit(100)                  // Limit results
  .sort({ name: 1 })          // Sort in database
  .lean();                    // Faster queries
  
  // Cache response
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(categories);
});

// Avoid: Unoptimized endpoint
app.get('/api/categories', async (req, res) => {
  // No filtering, no limits, returns all fields
  const categories = await Category.find({})
    .populate('relatedData')  // Unnecessary population
    .populate('moreData');    // More unnecessary data
  
  // Heavy client-side processing
  const processed = categories.map(cat => ({
    ...cat,
    computed: performHeavyComputation(cat)  // Do this in database
  }));
  
  res.json(processed);
});
```

## 🎨 UI Performance

### Rendering Optimization
```typescript
// The Auto-Form system automatically optimizes rendering:

// 1. Smart re-renders: Only re-render changed fields
// When 'name' field changes, 'email' field doesn't re-render

// 2. Virtualization: Large forms with many fields
// Only visible fields are in DOM

// 3. Debounced validation: Validation doesn't run on every keystroke
// Validation runs onBlur and onChange (after initial blur)
```

### Layout Performance
```typescript
// Good: Efficient layout
fields: [
  // Logical grouping reduces layout shifts
  { key: 'name', form: { row: 1, width: 'full' } },
  { key: 'email', form: { row: 2, width: 'half' } },
  { key: 'phone', form: { row: 2, width: 'half' } }
]

// Avoid: Layout that causes shifts
fields: [
  { key: 'name', form: { row: 1, width: 'full' } },
  { key: 'conditionalField', form: { row: 2, width: 'full' } }, // Shows/hides
  { key: 'email', form: { row: 3, width: 'half' } }  // Moves up/down
]
```

## 🏎️ Advanced Performance Patterns

### Progressive Loading
```typescript
// Load critical fields first, others later
const PROGRESSIVE_SCHEMA: ResourceSchema = {
  // Core fields load immediately
  fields: [
    { key: 'name', type: 'text', required: true },
    { key: 'email', type: 'email', required: true }
  ],
  
  // Advanced fields can be in a separate tab/section
  advancedFields: [
    { 
      key: 'advancedConfig', 
      type: 'json',
      tab: 'advanced'  // Loads only when tab is accessed
    }
  ]
};
```

### Conditional Field Loading
```typescript
// Only load expensive fields when needed
{
  key: 'expensiveData',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'expensive-data',
      valueField: 'id',
      labelField: 'name'
    },
    conditional: [
      {
        watchField: 'enableAdvanced',
        // Only loads when enableAdvanced = true
        apiFilters: (enabled: boolean) => enabled ? {} : { skip: true }
      }
    ]
  }
}
```

### Memory Management
```typescript
// Auto-Form automatically manages memory:

// 1. Component cleanup: Removes event listeners on unmount
// 2. Cache cleanup: Clears unused API response cache
// 3. Observer cleanup: Removes form field observers
// 4. Timer cleanup: Clears debounce timers

// You don't need to do anything special, but be aware:
useEffect(() => {
  // If you add custom side effects, clean them up
  const subscription = someService.subscribe(handleUpdate);
  
  return () => {
    subscription.unsubscribe();  // Clean up
  };
}, []);
```

## 📊 Performance Monitoring

### Core Web Vitals
```typescript
// The Auto-Form system is optimized for Core Web Vitals:

// LCP (Largest Contentful Paint)
// - Form renders quickly with minimal layout shifts
// - Critical CSS is inlined
// - Fonts are preloaded

// FID (First Input Delay)  
// - Event handlers are efficiently bound
// - Heavy computations are debounced
// - Non-blocking validation

// CLS (Cumulative Layout Shift)
// - Stable form layout
// - Reserved space for dynamic content
// - Smooth transitions
```

### Performance Monitoring
```typescript
// Monitor form performance
const handleSubmit = async (data: Record<string, any>) => {
  const startTime = performance.now();
  
  try {
    await submitData(data);
    
    const endTime = performance.now();
    console.log(`Form submission took ${endTime - startTime} milliseconds`);
    
    // Track metrics
    analytics.track('form_submit_success', {
      form: 'product_form',
      duration: endTime - startTime,
      fields: Object.keys(data).length
    });
    
  } catch (error) {
    analytics.track('form_submit_error', {
      form: 'product_form', 
      error: error.message
    });
  }
};
```

## 🔧 Performance Checklist

### Schema Design
- [ ] Only include fields you actually need
- [ ] Use static options for small lists (< 10 items)
- [ ] Disable search for simple select fields
- [ ] Group related fields in the same row
- [ ] Use appropriate field widths

### API Optimization  
- [ ] Implement proper caching headers
- [ ] Return only necessary fields
- [ ] Use database indexes for filters
- [ ] Implement request rate limiting
- [ ] Use pagination for large datasets

### Form Configuration
- [ ] Set `searchable: false` for short option lists
- [ ] Use tabs for complex forms (15+ fields)
- [ ] Implement progressive disclosure
- [ ] Avoid deep conditional dependencies
- [ ] Use auto-values for system fields

### Monitoring
- [ ] Monitor form submission times
- [ ] Track validation error rates
- [ ] Monitor API response times
- [ ] Check Core Web Vitals scores
- [ ] Test on mobile devices

## 💡 Performance Best Practices

### Do's
1. **Start Simple**: Begin with basic forms and add complexity gradually
2. **Measure First**: Profile before optimizing
3. **Cache Strategically**: Cache API responses and computed values
4. **Lazy Load**: Load data only when needed
5. **Progressive Enhancement**: Core functionality first, nice-to-haves later

### Don'ts
1. **Don't Over-Engineer**: Avoid complex schemas for simple use cases  
2. **Don't Block UI**: Keep heavy operations async
3. **Don't Ignore Mobile**: Test performance on slower devices
4. **Don't Skip Validation**: Client-side optimization shouldn't compromise security
5. **Don't Premature Optimize**: Focus on UX first, micro-optimizations later

### Common Pitfalls
```typescript
// Pitfall 1: Too many conditional dependencies
conditional: [
  { watchField: 'field1' },
  { watchField: 'field2' },
  { watchField: 'field3' },  // Each change triggers API calls
  { watchField: 'field4' }   // Consider combining logic
]

// Pitfall 2: Heavy validation functions
validation: [
  {
    type: 'custom',
    validator: (value) => {
      // Runs on every keystroke after initial blur
      return performExpensiveValidation(value);  // Too slow
    }
  }
]

// Pitfall 3: Large static option lists
options: {
  static: [
    // 500+ options make the dropdown slow
    ...largeStaticList
  ],
  searchable: false  // User can't find anything
}
```

Remember: The Auto-Form system is already highly optimized. Focus on proper schema design and API optimization rather than micro-optimizations.

---

*Next: [Design Guidelines](./design-guidelines.md) - Learn about creating beautiful, usable forms*
