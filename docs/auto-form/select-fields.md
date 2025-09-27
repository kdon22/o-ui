# Select Fields

The Auto-Form system features a unified select system that provides beautiful, searchable dropdowns with conditional filtering capabilities. All select fields use the same powerful component with optional search functionality.

## 🎯 Select Field Overview

Every select field in the Auto-Form system:
- **Beautiful UI** - Consistent, modern design
- **Optional Search** - Enable/disable search per field
- **Real-time Filtering** - Filter options as you type
- **API Integration** - Load options from your endpoints
- **Conditional Logic** - Filter based on other field values
- **Error Handling** - Graceful loading and error states
- **Accessibility** - Full keyboard navigation

## 🎨 Basic Select Fields

### Static Options (Simple Dropdown)

For fixed lists of options:

```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select' as const,
  required: true,
  options: {
    static: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'PENDING', label: 'Pending' }
    ],
    searchable: false  // Disable search for simple lists
  }
}
```

### Static Options (Searchable)

For longer static lists:

```typescript
{
  key: 'country',
  label: 'Country',
  type: 'select' as const,
  required: true,
  options: {
    static: [
      { value: 'US', label: 'United States', icon: '🇺🇸' },
      { value: 'CA', label: 'Canada', icon: '🇨🇦' },
      { value: 'UK', label: 'United Kingdom', icon: '🇬🇧' },
      { value: 'DE', label: 'Germany', icon: '🇩🇪' },
      // ... many more countries
    ]
    // searchable: true by default for long lists
  }
}
```

## 🔗 Dynamic Select Fields

### Basic API Integration

Load options from your API endpoints:

```typescript
{
  key: 'categoryId',
  label: 'Category',
  type: 'select' as const,
  required: true,
  options: {
    dynamic: {
      resource: 'categories',    // Calls /api/categories
      valueField: 'id',         // Field to use as option value
      labelField: 'name'        // Field to display as option label
    }
    // searchable: true by default
  }
}
```

### Advanced API Options

```typescript
{
  key: 'managerId',
  label: 'Manager',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'users',           // API endpoint
      valueField: 'id',           // Value field
      labelField: 'fullName',     // Primary display field  
      displayField: 'email',      // Secondary display field
      filter: (user: any) =>      // Client-side filtering
        user.role === 'MANAGER' && user.isActive
    }
  }
}
```

## 🎛️ Conditional Select Fields

### Single Field Dependency

Filter options based on another field:

```typescript
// Parent field
{
  key: 'region',
  label: 'Region',
  type: 'select' as const,
  options: {
    static: [
      { value: 'NORTH_AMERICA', label: 'North America' },
      { value: 'EUROPE', label: 'Europe' },
      { value: 'ASIA_PACIFIC', label: 'Asia Pacific' }
    ]
  }
},

// Child field (filtered by region)
{
  key: 'officeId', 
  label: 'Office',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'offices',
      valueField: 'id',
      labelField: 'name'
    },
    conditional: [
      {
        watchField: 'region',        // Watch the region field
        apiFilters: {
          region: '{value}'          // Add region filter to API call
        }
      }
    ]
  }
}
```

**API Call**: When user selects "EUROPE", the system calls:
```
GET /api/offices?tenantId=xxx&branchId=yyy&region=EUROPE
```

### Multiple Field Dependencies

Filter based on multiple fields:

```typescript
{
  key: 'officeId',
  label: 'Office', 
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'offices',
      valueField: 'id',
      labelField: 'name'
    },
    conditional: [
      {
        watchField: 'region',
        apiFilters: {
          region: '{value}'
        }
      },
      {
        watchField: 'type',
        apiFilters: {
          type: (value: string) => {
            return value === 'HEADQUARTERS' 
              ? { isHeadquarters: true }
              : { isHeadquarters: false };
          }
        }
      },
      {
        watchField: 'vendor',
        apiFilters: {
          vendor: '{value}'
        },
        localFilter: (option: any, watchedValue: any) => {
          // Additional client-side filtering after API response
          return option.metadata?.supportedVendors?.includes(watchedValue);
        }
      }
    ]
  }
}
```

### Function-Based API Filters

For complex filtering logic:

```typescript
conditional: [
  {
    watchField: 'accessLevel',
    apiFilters: {
      permissions: (accessLevel: string) => {
        switch (accessLevel) {
          case 'ADMIN':
            return { includeAdminRoles: true };
          case 'MANAGER': 
            return { includeManagerRoles: true, excludeAdminRoles: true };
          case 'USER':
            return { userRolesOnly: true };
          default:
            return {};
        }
      }
    }
  }
]
```

## 🔍 Search Configuration

### Enable/Disable Search

```typescript
options: {
  static: [...],
  searchable: false    // Disable search
  // OR
  searchable: true     // Enable search (default)
}
```

### When to Use Search

**Enable Search For:**
- Long option lists (10+ items)
- API-driven options that could grow
- User-friendly searches (users, offices, products)
- Any list where typing is faster than scrolling

**Disable Search For:**
- Short lists (2-5 options)
- Status fields (Active/Inactive, Yes/No)
- Fixed enum values (Small/Medium/Large)
- Simple categorical choices

## 🎨 UI Behavior

### Loading States
```typescript
// Shows spinner while loading
options: {
  dynamic: {
    resource: 'categories',
    valueField: 'id', 
    labelField: 'name'
  }
}
```

### Error Handling
```typescript
// Shows error message if API call fails
options: {
  dynamic: {
    resource: 'invalid-endpoint',  // Will show error state
    valueField: 'id',
    labelField: 'name'
  }
}
```

### Empty States
```typescript
// Conditional select with no valid dependencies
{
  key: 'childField',
  options: {
    conditional: [
      {
        watchField: 'parentField',  // If parentField is empty,
        apiFilters: { parent: '{value}' }  // shows "No options available"
      }
    ]
  }
}
```

## 🔄 Real-World Examples

### E-commerce Category Selection
```typescript
// Category → Subcategory → Product Type
[
  {
    key: 'categoryId',
    label: 'Category',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'categories', valueField: 'id', labelField: 'name' }
    }
  },
  {
    key: 'subcategoryId',
    label: 'Subcategory', 
    type: 'select' as const,
    options: {
      dynamic: { resource: 'subcategories', valueField: 'id', labelField: 'name' },
      conditional: [
        { watchField: 'categoryId', apiFilters: { categoryId: '{value}' } }
      ]
    }
  },
  {
    key: 'productTypeId',
    label: 'Product Type',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'product-types', valueField: 'id', labelField: 'name' },
      conditional: [
        { watchField: 'subcategoryId', apiFilters: { subcategoryId: '{value}' } }
      ]
    }
  }
]
```

### Travel Booking
```typescript
// Region → Country → City → Hotel
[
  {
    key: 'region',
    label: 'Region',
    type: 'select' as const,
    options: {
      static: [
        { value: 'NORTH_AMERICA', label: 'North America' },
        { value: 'EUROPE', label: 'Europe' },
        { value: 'ASIA', label: 'Asia' }
      ],
      searchable: false
    }
  },
  {
    key: 'countryId',
    label: 'Country',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'countries', valueField: 'id', labelField: 'name' },
      conditional: [
        { watchField: 'region', apiFilters: { region: '{value}' } }
      ]
    }
  },
  {
    key: 'cityId',
    label: 'City',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'cities', valueField: 'id', labelField: 'name' },
      conditional: [
        { watchField: 'countryId', apiFilters: { countryId: '{value}' } }
      ]
    }
  },
  {
    key: 'hotelId',
    label: 'Hotel',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'hotels', valueField: 'id', labelField: 'name' },
      conditional: [
        { 
          watchField: 'cityId', 
          apiFilters: { cityId: '{value}' },
          localFilter: (option: any, watchedValue: any) => {
            return option.availability > 0;  // Only show available hotels
          }
        }
      ]
    }
  }
]
```

### GDS Queue Configuration
```typescript
[
  {
    key: 'type',
    label: 'Queue Type',
    type: 'select' as const,
    options: {
      static: [
        { value: 'GDS', label: 'GDS Queue' },
        { value: 'VIRTUAL', label: 'Virtual Queue' }
      ],
      searchable: false
    }
  },
  {
    key: 'vendor',
    label: 'GDS Vendor',
    type: 'select' as const,
    options: {
      static: [
        { value: 'SABRE', label: 'Sabre' },
        { value: 'AMADEUS', label: 'Amadeus' },
        { value: 'TRAVELPORT', label: 'Travelport' }
      ]
    }
  },
  {
    key: 'officeId',
    label: 'Office',
    type: 'select' as const,
    options: {
      dynamic: { resource: 'offices', valueField: 'id', labelField: 'name' },
      conditional: [
        {
          watchField: 'vendor',
          apiFilters: { vendor: '{value}' }
        },
        {
          watchField: 'type',
          apiFilters: {
            queueType: (value: string) => 
              value === 'GDS' ? { supportsGDS: true } : {}
          }
        }
      ]
    }
  }
]
```

## 🔧 API Endpoint Requirements

Your API endpoints should support the filtering parameters:

### Basic Endpoint
```typescript
// GET /api/categories?tenantId=xxx&branchId=yyy
[
  { id: '1', name: 'Electronics', isActive: true },
  { id: '2', name: 'Clothing', isActive: true },
  { id: '3', name: 'Books', isActive: false }
]
```

### Filtered Endpoint
```typescript
// GET /api/offices?tenantId=xxx&vendor=SABRE&supportsGDS=true
[
  { 
    id: '1', 
    name: 'Main Office', 
    vendor: 'SABRE',
    supportsGDS: true,
    isActive: true,
    metadata: { supportedVendors: ['SABRE', 'AMADEUS'] }
  }
]
```

## 💡 Best Practices

### Field Dependencies
```typescript
// Good: Clear dependency chain
region → country → city → hotel

// Avoid: Circular dependencies  
fieldA → fieldB → fieldA  // ❌ Don't do this
```

### API Design
```typescript
// Good: Consistent parameter names
GET /api/offices?region=EUROPE&vendor=SABRE

// Good: Boolean filters
GET /api/users?isActive=true&role=MANAGER

// Good: Include metadata for local filtering
{
  id: '1',
  name: 'Office',
  metadata: { capabilities: ['GDS', 'VIRTUAL'] }
}
```

### Search Configuration
```typescript
// Long lists: Enable search
options: { 
  dynamic: { resource: 'users' }  // searchable: true by default
}

// Short lists: Disable search  
options: {
  static: [
    { value: 'YES', label: 'Yes' },
    { value: 'NO', label: 'No' }
  ],
  searchable: false
}
```

### Error Handling
```typescript
// Provide helpful descriptions
description: 'Select office (filtered by vendor and region)'

// Handle empty states gracefully
conditional: [
  {
    watchField: 'region',
    apiFilters: { region: '{value}' }
    // Shows "No options available" when region is empty
  }
]
```

## 🚀 Advanced Patterns

### Cascading Updates
When a parent field changes, child fields automatically:
1. Clear their current value
2. Fetch new options based on parent value
3. Show loading state during fetch
4. Display new options or error state

### Performance Optimization
- Results are cached per API call
- Debounced search to avoid excessive API calls
- Loading states prevent multiple simultaneous requests
- Error states allow retry functionality

### Accessibility
- Full keyboard navigation (Arrow keys, Enter, Escape)
- Screen reader support
- Focus management
- ARIA labels and descriptions

---

*Next: [Form Layout](./form-layout.md) - Learn about rows, columns, and responsive design*
