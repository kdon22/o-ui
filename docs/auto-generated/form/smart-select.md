# SmartSelect - The Incredible Approach 🚀

The **most incredible** select field system ever built. Makes dynamic, conditional options ridiculously simple with declarative syntax that reads like English.

## Quick Start

### Basic Dynamic Select
```typescript
{
  key: 'officeId',
  label: 'Office',
  type: 'select',
  options: {
    source: 'offices.list'  // Just works! Auto-infers id/name fields
  }
}
```

### With Conditional Filtering
```typescript
{
  key: 'officeId', 
  label: 'Office',
  type: 'select',
  options: {
    source: 'offices.list',
    when: {
      vendor: '=${vendor}'  // Filter by selected vendor
    }
  }
}
```

## Core Features

### 1. Declarative Dependencies (`when`)

#### Simple Filtering
```typescript
options: {
  source: 'offices.list',
  when: {
    vendor: '=${vendor}',     // Filter: { vendor: selectedVendor }
    region: '=${region}'      // Filter: { region: selectedRegion }
  }
}
```

#### Complex Conditional Logic
```typescript
options: {
  source: 'offices.list', 
  when: {
    type: {                               // Based on queue type
      'GDS': { supportedTypes: 'GDS' },   // If GDS, filter supportedTypes
      'VIRTUAL': { supportedTypes: 'VIRTUAL' },
      '*': { isActive: true }             // Default for all other values
    }
  }
}
```

#### Multi-Field Dependencies
```typescript
options: {
  source: 'flights.search',
  when: {
    origin: '=${departureCity}',
    destination: '=${arrivalCity}',
    date: '=${travelDate}',
    passengers: (count) => ({ adults: count, children: 0 })  // Function transforms
  }
}
```

### 2. Smart Defaults & Auto-Inference

```typescript
// Minimal config - everything else is automatic!
options: {
  source: 'users.list'
  // ✅ Auto-infers valueField: 'id' 
  // ✅ Auto-infers labelField: 'name'
  // ✅ Auto-enables search for 10+ items
  // ✅ Auto-generates placeholder: "Select user..."
  // ✅ Auto-caches for 30 seconds
}
```

### 3. Performance Features

#### Smart Caching
```typescript
options: {
  source: 'workflows.list',
  cache: '5m'              // Cache for 5 minutes
  // or: cache: 300        // Cache for 300 seconds
}
```

#### Debounced Dependencies  
```typescript
options: {
  source: 'search.autocomplete',
  when: { query: '=${searchTerm}' },
  debounce: 300           // Wait 300ms after typing stops
}
```

### 4. Custom Transformations

```typescript
options: {
  source: 'workflows.list',
  transform: (workflow) => ({
    value: workflow.id,
    label: `${workflow.name} (${workflow.type})`,   // Enhanced display
    disabled: !workflow.isActive,                   // Dynamic disable
    metadata: { priority: workflow.priority }       // Extra data
  })
}
```

### 5. Advanced Control

```typescript
options: {
  source: 'offices.list',
  searchable: true,         // Force enable search
  placeholder: 'Pick your office...',  // Custom placeholder
  cache: '2m',             // Custom cache duration
  when: {
    vendor: '=${vendor}',
    type: {
      'GDS': { supportedTypes: 'GDS', isActive: true },
      'VIRTUAL': { supportedTypes: 'VIRTUAL', isActive: true }
    }
  }
}
```

## Real-World Examples

### 1. Hierarchical Selection (Parent → Child)
```typescript
// Parent Queue selector
{
  key: 'parentQueueId',
  label: 'Parent Queue', 
  type: 'select',
  options: {
    source: 'queues.list',
    when: { isContainer: true }  // Only show Named Queues
  }
}
```

### 2. Multi-Dependent Filtering
```typescript
// Office filtered by vendor AND type
{
  key: 'officeId',
  label: 'Office',
  type: 'select', 
  options: {
    source: 'offices.list',
    when: {
      vendor: '=${vendor}',
      type: {
        'GDS': { supportedTypes: 'GDS' },
        'VIRTUAL': { supportedTypes: 'VIRTUAL' },
        '*': { isActive: true }
      }
    },
    cache: '2m'
  }
}
```

### 3. Searchable with Custom Display
```typescript
// Workflow with enhanced labeling
{
  key: 'workflowId',
  label: 'Workflow',
  type: 'select',
  options: {
    source: 'workflows.list',
    searchable: true,
    cache: '5m',
    transform: (workflow) => ({
      value: workflow.id,
      label: `${workflow.name} (${workflow.type})`,
      disabled: !workflow.isActive
    })
  }
}
```

### 4. Travel Industry Example
```typescript
// Flight search with multiple dependencies
{
  key: 'flightId',
  label: 'Flight',
  type: 'select',
  options: {
    source: 'flights.search',
    when: {
      origin: '=${departureCity}',
      destination: '=${arrivalCity}', 
      date: '=${travelDate}',
      passengers: (count) => ({ adults: count, children: 0 })
    },
    transform: (flight) => ({
      value: flight.id,
      label: `${flight.airline} ${flight.number} - $${flight.price}`,
      metadata: { duration: flight.duration, stops: flight.stops }
    }),
    cache: '2m'
  }
}
```

## Migration from Legacy System

### Before (Complex & Verbose)
```typescript
options: {
  dynamic: {
    resource: 'offices',
    valueField: 'id', 
    labelField: 'name'
  },
  conditional: [
    {
      watchField: 'vendor',
      apiFilters: { vendor: '{value}' }
    },
    {
      watchField: 'type',
      apiFilters: {
        type: (value: string) => value === 'GDS' ? { supportedTypes: 'GDS' } : {}
      }
    }
  ]
}
```

### After (Clean & Readable) 
```typescript
options: {
  source: 'offices.list',
  when: {
    vendor: '=${vendor}',
    type: { 'GDS': { supportedTypes: 'GDS' } }
  }
}
```

## Technical Benefits

### 🚀 Performance
- **Smart Caching**: Configurable cache durations (`'5m'`, `300`, etc.)
- **Request Deduplication**: Multiple components requesting same data = 1 API call
- **Background Refresh**: Cache stays fresh without blocking UI
- **Debounced Dependencies**: Prevents excessive API calls during typing

### 🛡️ Type Safety
- **Full TypeScript Inference**: Auto-completes based on action response types
- **Runtime Validation**: Validates data shapes and handles errors gracefully
- **Consistent Error Handling**: Standardized error messages and retry logic

### 🎯 Developer Experience  
- **90% Less Code**: Most conditional selects become 1-3 lines
- **Reads Like English**: `when: { vendor: '=${vendor}' }`
- **Zero Boilerplate**: No useEffect, useState, loading state management
- **Debugging**: Built-in logging and error reporting

### ⚡ Action System Integration
- **Native Integration**: Uses `{entity}.list` actions directly
- **Branch Awareness**: Automatically includes `branchId` in requests  
- **Offline Support**: Works with IndexedDB caching and background sync
- **Optimistic Updates**: Instant UI feedback with background validation

## Under the Hood

The SmartSelect system:

1. **Parses `when` conditions** into action parameters
2. **Watches form fields** for dependency changes
3. **Calls action system** (`offices.list`, `workflows.list`, etc.)
4. **Caches results** with configurable TTL
5. **Transforms data** for display
6. **Handles loading/error states** automatically

All with **zero boilerplate** from the developer! 🎉

---

*This is the future of dynamic select fields. Simple, powerful, and incredibly elegant.*
