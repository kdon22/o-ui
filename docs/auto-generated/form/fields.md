### Field Rendering

Supported types (`form-field.tsx`):
- `text`, `email`, `url` → `Input` with type
- `textarea` → `TextArea`
- `number` → `Input` numeric with empty-string→undefined conversion
- `switch` → `Switch`
- `select` → **SmartSelect** with incredible conditional options 🚀
- `date` → `Input` type `datetime-local`
- `tags` → `TagsField` (array of strings)
- `component-selector` → `ComponentSelector` (supports `multiSelect`, previews)
- `currency` → `CurrencyField` with min/max from validation

Labels, descriptions, errors:
- Required asterisk and checkmark when completed
- Error message shown beneath field

### SmartSelect System (`use-smart-select.ts`)

The **most incredible** select field system that makes dynamic options ridiculously simple:

#### Simple Dynamic Select
```typescript
options: {
  source: 'offices.list'  // Just works! Auto-infers id/name fields
}
```

#### Conditional Dependencies  
```typescript
options: {
  source: 'offices.list',
  when: {
    vendor: '=${vendor}',        // Filter by selected vendor
    type: {                      // Complex logic made simple  
      'GDS': { supportedTypes: 'GDS' },
      'VIRTUAL': { supportedTypes: 'VIRTUAL' },
      '*': { isActive: true }    // Default for all other values
    }
  }
}
```

#### Advanced Features
```typescript
options: {
  source: 'workflows.list',
  searchable: true,              // Force enable search
  cache: '5m',                  // Cache for 5 minutes
  transform: (item) => ({       // Custom display logic
    value: item.id,
    label: `${item.name} (${item.type})`,
    disabled: !item.isActive
  })
}
```

**Benefits:**
- ✅ **90% Less Code** - Most fields become 1-2 lines  
- ✅ **Zero Boilerplate** - No useEffect, useState, loading states
- ✅ **Action System Native** - Uses `{entity}.list` with filters
- ✅ **Type Safe** - Full TypeScript inference
- ✅ **Performance First** - Smart caching, deduplication, debouncing
- ✅ **Reads Like English** - `when: { vendor: '=${vendor}' }`


