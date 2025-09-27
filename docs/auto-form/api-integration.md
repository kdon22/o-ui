# API Integration

The Auto-Form system seamlessly integrates with your backend APIs for dynamic data loading, form submission, and real-time updates.

## 🎯 Overview

API integration in Auto-Form includes:
- **Dynamic Options** - Load select options from API endpoints
- **Conditional Filtering** - Filter API results based on form fields
- **Form Submission** - POST/PUT form data to your backend
- **Real-time Updates** - Keep forms in sync with server state
- **Error Handling** - Graceful handling of API errors

## 🔗 Dynamic Options Integration

### Basic API Options
Load select field options from your API:

```typescript
{
  key: 'categoryId',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'categories',    // Calls GET /api/categories
      valueField: 'id',         // Use 'id' field as option value
      labelField: 'name'        // Use 'name' field as option label
    }
  }
}
```

**API Response Expected:**
```json
[
  { "id": "1", "name": "Electronics", "isActive": true },
  { "id": "2", "name": "Clothing", "isActive": true },
  { "id": "3", "name": "Books", "isActive": false }
]
```

### Advanced API Configuration
```typescript
{
  key: 'managerId',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'users',
      valueField: 'id',
      labelField: 'fullName',      // Primary display field
      displayField: 'email',       // Secondary display info
      filter: (user: any) =>       // Client-side filtering
        user.role === 'MANAGER' && user.isActive
    }
  }
}
```

## 🎛️ Conditional API Filtering

### Single Field Dependency
Filter API results based on another form field:

```typescript
// Parent field
{
  key: 'region',
  type: 'select' as const,
  options: {
    static: [
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
      { value: 'UK', label: 'United Kingdom' }
    ]
  }
},

// Child field (filtered by region)
{
  key: 'stateId',
  type: 'select' as const,
  options: {
    dynamic: {
      resource: 'states',
      valueField: 'id', 
      labelField: 'name'
    },
    conditional: [
      {
        watchField: 'region',
        apiFilters: {
          country: '{value}'    // region value becomes country filter
        }
      }
    ]
  }
}
```

**Generated API Call:**
```
GET /api/states?tenantId=abc123&branchId=xyz789&country=US
```

### Multiple Dependencies
Filter based on multiple form fields:

```typescript
{
  key: 'officeId',
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
        apiFilters: { region: '{value}' }
      },
      {
        watchField: 'division',
        apiFilters: { division: '{value}' }
      },
      {
        watchField: 'isHeadquarters',
        apiFilters: {
          headquarters: (value: boolean) => value ? { isHQ: true } : {}
        }
      }
    ]
  }
}
```

**Generated API Call:**
```
GET /api/offices?tenantId=abc&branchId=xyz&region=US&division=SALES&isHQ=true
```

### Function-Based Filters
For complex filtering logic:

```typescript
conditional: [
  {
    watchField: 'accessLevel',
    apiFilters: {
      permissions: (accessLevel: string) => {
        switch (accessLevel) {
          case 'ADMIN':
            return { includeAll: true, adminRoles: true };
          case 'MANAGER':
            return { includeAll: false, managerRoles: true };
          case 'USER':
            return { userRolesOnly: true };
          default:
            return { noAccess: true };
        }
      }
    }
  }
]
```

## 📤 Form Submission

### Basic Form Submission
The Auto-Form automatically handles form submission:

```typescript
const handleSubmit = async (formData: Record<string, any>) => {
  // Auto-Form has already:
  // 1. Validated all fields
  // 2. Populated auto-values (IDs, timestamps, etc.)
  // 3. Formatted data correctly
  
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Created:', result);
    
    // Handle success (redirect, show toast, etc.)
    
  } catch (error) {
    console.error('Submission failed:', error);
    // Handle error (show message, etc.)
  }
};

// Usage
<AutoForm
  schema={PRODUCT_SCHEMA}
  mode="create"
  onSubmit={handleSubmit}
  onCancel={() => router.back()}
/>
```

### Edit Mode Submission
For updating existing records:

```typescript
const handleUpdate = async (formData: Record<string, any>) => {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',                    // or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error('Update failed');
    }
    
    const result = await response.json();
    console.log('Updated:', result);
    
  } catch (error) {
    console.error('Update failed:', error);
  }
};

// Usage with initial data
<AutoForm
  schema={PRODUCT_SCHEMA}
  mode="edit"
  initialData={existingProduct}
  onSubmit={handleUpdate}
/>
```

## 🔄 Auto-Value Integration

### System Auto-Values
The system automatically populates certain fields:

```typescript
{
  key: 'id',
  type: 'text' as const,
  autoValue: { source: 'auto.uuid' as const }    // Generates UUID
},
{
  key: 'createdAt',
  type: 'text' as const,
  autoValue: { source: 'auto.timestamp' as const } // Current timestamp
},
{
  key: 'tenantId',
  type: 'text' as const,
  autoValue: { source: 'session.user.tenantId' as const } // From user session
},
{
  key: 'createdBy',
  type: 'text' as const,
  autoValue: { source: 'session.user.id' as const } // Current user ID
}
```

### Custom Auto-Values
You can extend auto-values with custom logic:

```typescript
{
  key: 'orderNumber',
  type: 'text' as const,
  autoValue: { 
    source: 'custom' as const,
    generator: () => `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
```

## 🚨 Error Handling

### API Error Handling
Handle various API error scenarios:

```typescript
const handleSubmit = async (formData: Record<string, any>) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    // Handle different HTTP status codes
    if (response.status === 400) {
      const errorData = await response.json();
      console.error('Validation errors:', errorData.errors);
      // Show field-specific errors
      return;
    }
    
    if (response.status === 401) {
      console.error('Unauthorized - redirect to login');
      // Redirect to login
      return;
    }
    
    if (response.status === 403) {
      console.error('Forbidden - insufficient permissions');
      // Show permission error
      return;
    }
    
    if (response.status >= 500) {
      console.error('Server error - try again later');
      // Show server error message
      return;
    }
    
    if (!response.ok) {
      throw new Error(`Unexpected error: ${response.status}`);
    }
    
    // Success
    const result = await response.json();
    console.log('Success:', result);
    
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Network error:', error);
      // Show network error message
    } else {
      console.error('Unknown error:', error);
      // Show generic error message
    }
  }
};
```

### Select Options Error Handling
The system automatically handles errors when loading select options:

```typescript
// This configuration:
{
  key: 'categoryId',
  options: {
    dynamic: {
      resource: 'categories',  // If this endpoint fails...
      valueField: 'id',
      labelField: 'name'
    }
  }
}

// Results in:
// - Loading spinner while fetching
// - Error message in dropdown if API fails
// - Retry functionality (user can try again)
// - Graceful fallback (empty options list)
```

## 📊 Backend API Requirements

### Standard Endpoint Pattern
Your API endpoints should follow these patterns:

```typescript
// GET /api/{resource}?tenantId=xxx&branchId=yyy&...filters
// Returns array of objects

// Examples:
GET /api/categories?tenantId=abc123
GET /api/offices?tenantId=abc123&region=US&division=SALES
GET /api/users?tenantId=abc123&role=MANAGER&isActive=true
```

### Expected Response Format
```typescript
// Success Response (200)
[
  {
    id: "1",
    name: "Category Name",
    // ... other fields
    isActive: true,
    metadata: {
      // Optional metadata for local filtering
      capabilities: ["FEATURE_A", "FEATURE_B"]
    }
  }
]

// Error Response (4xx/5xx)
{
  success: false,
  error: "Error message",
  details: "Additional error details"
}
```

### Form Submission Endpoints
```typescript
// Create: POST /api/{resource}
{
  // Request body: form data
  name: "Product Name",
  price: 99.99,
  categoryId: "1",
  // ... all form fields
}

// Response (201)
{
  success: true,
  data: {
    id: "new-id",
    name: "Product Name",
    // ... created object
  }
}

// Update: PUT /api/{resource}/{id}  
{
  // Request body: form data (full object)
  id: "existing-id",
  name: "Updated Product Name", 
  // ... all form fields
}

// Response (200)
{
  success: true,
  data: {
    id: "existing-id", 
    name: "Updated Product Name",
    // ... updated object
  }
}
```

## 🔧 Advanced Integration Patterns

### Caching Strategy
```typescript
// The system automatically caches API responses
// Cache keys are based on endpoint + parameters

// Examples:
// Cache key: "categories?tenantId=abc123"
// Cache key: "offices?tenantId=abc123&region=US&division=SALES"

// Cache is invalidated when:
// 1. Page refresh
// 2. Dependencies change (watched fields)
// 3. Manual cache clear
```

### Optimistic Updates
Enable optimistic updates for better UX:

```typescript
actions: {
  create: true,
  update: true,
  delete: true,
  optimistic: true  // Enable optimistic updates
}

// Behavior:
// 1. Update UI immediately when user submits
// 2. Send API request in background  
// 3. Revert changes if API request fails
// 4. Show success/error feedback
```

### Real-time Updates
For forms that need real-time data sync:

```typescript
// Use WebSocket or Server-Sent Events
// to update form data in real-time

const handleRealtimeUpdate = (data: any) => {
  // Update form with new data from server
  setFormData(data);
};

useEffect(() => {
  // Connect to real-time updates
  const ws = new WebSocket('/api/realtime');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleRealtimeUpdate(data);
  };
  
  return () => ws.close();
}, []);
```

## 💡 Best Practices

### API Design
1. **Consistent Patterns**: Use the same URL structure and response format
2. **Proper HTTP Status Codes**: Return appropriate status codes for different scenarios
3. **Filtering Support**: Support tenant/branch filtering and conditional filters
4. **Error Messages**: Return helpful error messages for debugging

### Performance
1. **Pagination**: Implement pagination for large datasets
2. **Caching**: Use appropriate cache headers
3. **Debouncing**: Debounce API calls for search/filter operations
4. **Compression**: Use gzip compression for large responses

### Security
1. **Authentication**: Validate auth tokens on every request
2. **Authorization**: Check user permissions for each operation
3. **Input Validation**: Validate and sanitize all input data
4. **Rate Limiting**: Implement rate limiting to prevent abuse

### Error Handling
1. **Graceful Degradation**: Forms should work even if some APIs fail
2. **User Feedback**: Provide clear error messages to users
3. **Retry Logic**: Implement retry logic for transient failures
4. **Logging**: Log errors for debugging and monitoring

---

*Next: [Performance](./performance.md) - Learn about optimizing form performance*
