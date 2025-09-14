# Best Practices & Development Guidelines

This document outlines best practices, patterns, and development guidelines for building with the Action System.

## Schema Design Principles

### 1. Single Source of Truth (SSOT)
Every resource must have one definitive schema that drives all functionality:

```typescript
// ✅ GOOD: Complete schema with all concerns
const USER_SCHEMA = {
  resource: 'USER',
  table: 'User',
  fields: {
    id: { type: 'id', required: true },
    email: { type: 'email', required: true, unique: true },
    name: { type: 'string', required: true, maxLength: 100 },
    role: { type: 'select', options: ['admin', 'user'], required: true },
    createdAt: { type: 'datetime', autoValue: 'now' }
  },
  display: {
    listView: ['name', 'email', 'role', 'createdAt'],
    detailView: ['name', 'email', 'role', 'createdAt'],
    searchFields: ['name', 'email']
  },
  actions: {
    create: { enabled: true, permissions: ['admin'] },
    update: { enabled: true, permissions: ['admin', 'self'] },
    delete: { enabled: true, permissions: ['admin'] },
    list: { enabled: true, permissions: ['all'] }
  },
  validation: {
    email: [{ rule: 'email' }, { rule: 'unique' }],
    name: [{ rule: 'required' }, { rule: 'maxLength', value: 100 }]
  }
};

// ❌ BAD: Incomplete schema missing key concerns
const INCOMPLETE_SCHEMA = {
  resource: 'USER',
  fields: {
    id: { type: 'id' },
    name: { type: 'string' }
  }
  // Missing: display, actions, validation, relationships
};
```

### 2. Field Configuration Standards

**Always specify field behavior explicitly:**

```typescript
// ✅ GOOD: Explicit configuration
fields: {
  id: {
    type: 'id',
    required: true,
    autoValue: 'uuid',
    display: { list: false, form: false }
  },
  email: {
    type: 'email',
    required: true,
    unique: true,
    validation: [{ rule: 'email' }],
    display: { list: true, form: true, width: '200px' }
  },
  createdAt: {
    type: 'datetime',
    required: true,
    autoValue: 'now',
    display: { list: true, form: false, format: 'relative' }
  }
}

// ❌ BAD: Implicit behavior
fields: {
  email: { type: 'email' }, // Unclear if required, unique, etc.
  createdAt: { type: 'datetime' } // No auto-value specified
}
```

### 3. Relationship Design Patterns

**Use explicit relationship configuration:**

```typescript
// ✅ GOOD: Clear relationship definition
const ORDER_SCHEMA = {
  relationships: {
    customer: {
      type: 'belongsTo',
      target: 'CUSTOMER',
      foreignKey: 'customerId',
      required: true,
      display: { 
        field: 'name',
        searchable: true,
        create: 'modal' // Open customer selection modal
      }
    },
    items: {
      type: 'hasMany',
      target: 'ORDER_ITEM',
      foreignKey: 'orderId',
      cascade: 'delete', // Delete items when order is deleted
      display: {
        inline: true, // Show items inline in order form
        sortBy: 'sequence'
      }
    }
  }
};

// ❌ BAD: Unclear relationships
const BAD_ORDER_SCHEMA = {
  relationships: {
    customer: { type: 'belongsTo' }, // Missing target, key, behavior
    items: { type: 'hasMany' } // No cascade or display rules
  }
};
```

## Performance Optimization Patterns

### 1. Cache-First Reading Strategy

**Always prioritize local cache:**

```typescript
// ✅ GOOD: Cache-first with smart fallback
const { data, isLoading } = useActionQuery({
  action: 'NODE_LIST',
  options: {
    cacheStrategy: 'cache-first', // Try cache first
    cacheTime: 5 * 60 * 1000, // 5 minute cache
    staleTime: 2 * 60 * 1000, // 2 minute stale time
    backgroundRefresh: true // Refresh in background
  }
});

// ❌ BAD: Always fetch from network
const { data } = useActionQuery({
  action: 'NODE_LIST',
  options: { cacheStrategy: 'network-only' } // Slow, no offline support
});
```

### 2. Selective Field Loading

**Only load fields you need:**

```typescript
// ✅ GOOD: Specific field selection
const { data } = useActionQuery({
  action: 'USER_LIST',
  payload: {
    select: ['id', 'name', 'email', 'role'], // Only needed fields
    limit: 50,
    offset: 0
  }
});

// ❌ BAD: Loading unnecessary data
const { data } = useActionQuery({
  action: 'USER_LIST'
  // Loads all fields including large ones like 'profileImage', 'settings'
});
```

### 3. Intelligent Prefetching

**Prefetch related data proactively:**

```typescript
// ✅ GOOD: Strategic prefetching
const NodeDetailView = ({ nodeId }) => {
  // Primary data
  const { data: node } = useActionQuery({
    action: 'NODE_GET',
    payload: { id: nodeId }
  });

  // Prefetch related data likely to be needed
  useActionQuery({
    action: 'PROCESS_LIST',
    payload: { nodeId },
    options: { enabled: !!node } // Only when node loads
  });

  useActionQuery({
    action: 'RULE_LIST', 
    payload: { nodeId },
    options: { enabled: !!node }
  });
};

// ❌ BAD: Sequential loading
const BadNodeDetailView = ({ nodeId }) => {
  const { data: node } = useActionQuery({
    action: 'NODE_GET',
    payload: { id: nodeId }
  });

  // Wait for node, then load processes
  const { data: processes } = useActionQuery({
    action: 'PROCESS_LIST',
    payload: { nodeId },
    options: { enabled: !!node }
  });

  // Wait for processes, then load rules (slow waterfall)
  const { data: rules } = useActionQuery({
    action: 'RULE_LIST',
    payload: { nodeId },
    options: { enabled: !!processes }
  });
};
```

## Component Patterns

### 1. Auto-Generated Component Usage

**Leverage schemas for consistent UIs:**

```typescript
// ✅ GOOD: Schema-driven components
const UserManagementPage = () => {
  return (
    <div className="space-y-6">
      <AutoTable
        schema={USER_SCHEMA}
        action="USER_LIST"
        features={['search', 'sort', 'pagination']}
        mobileOptimized={true}
      />
      
      <AutoModal
        schema={USER_SCHEMA}
        action="USER_CREATE"
        trigger={<Button>Add User</Button>}
        onSuccess={() => {
          // Refresh table
          queryClient.invalidateQueries(['USER_LIST']);
        }}
      />
    </div>
  );
};

// ❌ BAD: Manual implementation
const BadUserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Lots of manual state management, data fetching, form handling...
  // This duplicates logic that's already in AutoTable/AutoModal
};
```

### 2. Form Patterns with Validation

**Use schema-driven forms with proper validation:**

```typescript
// ✅ GOOD: Schema-driven form with validation
const CreateUserForm = () => {
  const { mutate, isLoading, error } = useActionAPI({
    action: 'USER_CREATE',
    onSuccess: (data) => {
      toast.success('User created successfully');
      router.push(`/users/${data.id}`);
    },
    onError: (error) => {
      if (error.type === 'validation') {
        // Form will automatically show field errors
      } else {
        toast.error('Failed to create user');
      }
    }
  });

  return (
    <AutoForm
      schema={USER_SCHEMA}
      onSubmit={(data) => mutate({ data })}
      loading={isLoading}
      error={error}
    />
  );
};

// ❌ BAD: Manual form with duplicate validation
const BadCreateUserForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const validate = (data) => {
    // This duplicates validation already in USER_SCHEMA
    const newErrors = {};
    if (!data.email) newErrors.email = 'Required';
    if (!data.name) newErrors.name = 'Required';
    // ... more manual validation
  };
  
  // Manual form handling, error display, etc.
};
```

### 3. Mobile-First Responsive Patterns

**Design for mobile, enhance for desktop:**

```typescript
// ✅ GOOD: Mobile-first with progressive enhancement
const ProductList = () => {
  const { data: products } = useActionQuery({
    action: 'PRODUCT_LIST'
  });

  return (
    <AutoTable
      schema={PRODUCT_SCHEMA}
      data={products}
      responsive={{
        mobile: {
          columns: ['name', 'price'], // Only essential columns on mobile
          cardView: true, // Stack as cards on mobile
          density: 'comfortable' // More spacing for touch
        },
        tablet: {
          columns: ['name', 'price', 'category', 'status'],
          cardView: false,
          density: 'normal'
        },
        desktop: {
          columns: ['name', 'price', 'category', 'status', 'createdAt', 'actions'],
          cardView: false,
          density: 'compact'
        }
      }}
    />
  );
};

// ❌ BAD: Desktop-first, poor mobile experience
const BadProductList = () => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Category</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      {/* This will be unusable on mobile - too many columns */}
    </table>
  );
};
```

## Data Flow Patterns

### 1. Optimistic Updates

**Update UI immediately, sync in background:**

```typescript
// ✅ GOOD: Optimistic updates with rollback
const useToggleStatus = () => {
  const queryClient = useQueryClient();
  
  return useActionAPI({
    action: 'NODE_UPDATE',
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['NODE_LIST']);
      
      // Snapshot previous value
      const previousNodes = queryClient.getQueryData(['NODE_LIST']);
      
      // Optimistically update
      queryClient.setQueryData(['NODE_LIST'], (old) => 
        old.map(node => 
          node.id === id ? { ...node, status } : node
        )
      );
      
      // Return rollback function
      return { previousNodes };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNodes) {
        queryClient.setQueryData(['NODE_LIST'], context.previousNodes);
      }
    },
    onSettled: () => {
      // Refresh after mutation
      queryClient.invalidateQueries(['NODE_LIST']);
    }
  });
};

// ❌ BAD: No optimistic updates (slow UX)
const useBadToggleStatus = () => {
  return useActionAPI({
    action: 'NODE_UPDATE',
    onSuccess: () => {
      // Only update UI after server response (slow)
      queryClient.invalidateQueries(['NODE_LIST']);
    }
  });
};
```

### 2. Smart Cache Invalidation

**Invalidate related data when mutations occur:**

```typescript
// ✅ GOOD: Strategic invalidation
const useCreateOrder = () => {
  return useActionAPI({
    action: 'ORDER_CREATE',
    onSuccess: (newOrder) => {
      // Invalidate related queries
      queryClient.invalidateQueries(['ORDER_LIST']);
      queryClient.invalidateQueries(['CUSTOMER_ORDERS', newOrder.customerId]);
      queryClient.invalidateQueries(['PRODUCT_INVENTORY']);
      
      // Update specific caches if possible
      queryClient.setQueryData(['CUSTOMER_STATS', newOrder.customerId], old => ({
        ...old,
        totalOrders: (old?.totalOrders || 0) + 1
      }));
    }
  });
};

// ❌ BAD: Over-invalidation or under-invalidation
const useBadCreateOrder = () => {
  return useActionAPI({
    action: 'ORDER_CREATE',
    onSuccess: () => {
      // Over-invalidation: destroys all cached data
      queryClient.clear();
      
      // OR under-invalidation: stale data persists
      // queryClient.invalidateQueries(['ORDER_LIST']); // Missing related data
    }
  });
};
```

### 3. Branch Context Management

**Maintain branch context throughout the application:**

```typescript
// ✅ GOOD: Consistent branch context
const BranchProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState('main');
  
  return (
    <BranchContext.Provider value={{ currentBranch, setCurrentBranch }}>
      <QueryClient 
        defaultOptions={{
          queries: {
            meta: { branchName: currentBranch } // All queries use current branch
          },
          mutations: {
            meta: { branchName: currentBranch } // All mutations use current branch
          }
        }}
      >
        {children}
      </QueryClient>
    </BranchContext.Provider>
  );
};

// ❌ BAD: Inconsistent branch handling
const BadBranchHandling = () => {
  // Different components using different branches
  const nodes = useActionQuery({
    action: 'NODE_LIST',
    options: { meta: { branchName: 'feature-branch' } }
  });
  
  const processes = useActionQuery({
    action: 'PROCESS_LIST', 
    options: { meta: { branchName: 'main' } } // Different branch!
  });
};
```

## Error Handling Patterns

### 1. Graceful Error Recovery

**Handle errors gracefully with user-friendly messages:**

```typescript
// ✅ GOOD: Comprehensive error handling
const UserProfile = ({ userId }) => {
  const { data: user, error, isLoading, refetch } = useActionQuery({
    action: 'USER_GET',
    payload: { id: userId },
    options: {
      retry: (failureCount, error) => {
        // Only retry on network errors, not 404s
        return error.status >= 500 && failureCount < 3;
      }
    }
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    if (error.status === 404) {
      return (
        <div className="text-center py-8">
          <h3>User Not Found</h3>
          <p>The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <h3>Something went wrong</h3>
        <p>We couldn't load the user profile.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return <UserProfileContent user={user} />;
};

// ❌ BAD: Poor error handling
const BadUserProfile = ({ userId }) => {
  const { data: user } = useActionQuery({
    action: 'USER_GET',
    payload: { id: userId }
  });

  if (!user) {
    return <div>Loading...</div>; // No error differentiation
  }

  return <UserProfileContent user={user} />;
};
```

### 2. Form Error Patterns

**Display field-level and form-level errors appropriately:**

```typescript
// ✅ GOOD: Detailed error handling
const CreateUserForm = () => {
  const { mutate, isLoading, error } = useActionAPI({
    action: 'USER_CREATE'
  });

  return (
    <AutoForm
      schema={USER_SCHEMA}
      onSubmit={(data) => mutate({ data })}
      loading={isLoading}
      error={error}
      errorDisplay={{
        fieldErrors: true, // Show errors next to fields
        globalError: true, // Show general error at top
        toast: false // Don't show toast for validation errors
      }}
    />
  );
};

// For manual forms:
const ManualForm = () => {
  const { mutate, error } = useActionAPI({
    action: 'USER_CREATE'
  });

  // Parse structured errors
  const fieldErrors = error?.type === 'validation' ? error.fieldErrors : {};
  const globalError = error?.type !== 'validation' ? error.message : null;

  return (
    <form>
      {globalError && (
        <Alert variant="destructive">{globalError}</Alert>
      )}
      
      <Input
        name="email"
        error={fieldErrors.email}
        helperText="We'll never share your email"
      />
      
      <Input
        name="name"
        error={fieldErrors.name}
      />
    </form>
  );
};
```

## Testing Patterns

### 1. Schema Testing

**Test schemas comprehensively:**

```typescript
// ✅ GOOD: Comprehensive schema tests
describe('USER_SCHEMA', () => {
  it('should validate required fields', () => {
    const result = validateSchema(USER_SCHEMA, {});
    
    expect(result.errors).toContain('email is required');
    expect(result.errors).toContain('name is required');
  });

  it('should validate email format', () => {
    const result = validateSchema(USER_SCHEMA, {
      email: 'invalid-email',
      name: 'Test User'
    });
    
    expect(result.errors).toContain('email must be valid');
  });

  it('should generate correct actions', () => {
    const actions = generateActions(USER_SCHEMA);
    
    expect(actions).toContain('USER_CREATE');
    expect(actions).toContain('USER_UPDATE');
    expect(actions).toContain('USER_DELETE');
    expect(actions).toContain('USER_LIST');
  });
});
```

### 2. Component Integration Testing

**Test auto-generated components with real schemas:**

```typescript
// ✅ GOOD: Integration testing with real schemas
describe('AutoTable', () => {
  it('should render USER_SCHEMA correctly', () => {
    const mockData = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' }
    ];

    render(
      <AutoTable
        schema={USER_SCHEMA}
        data={mockData}
        loading={false}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should handle mobile responsive view', () => {
    global.innerWidth = 375; // Mobile width
    global.dispatchEvent(new Event('resize'));

    render(
      <AutoTable
        schema={USER_SCHEMA}
        data={mockData}
        mobileOptimized={true}
      />
    );

    // Should show card view on mobile
    expect(screen.getByTestId('table-card-view')).toBeInTheDocument();
  });
});
```

### 3. Action Testing

**Test actions with proper mocking:**

```typescript
// ✅ GOOD: Action testing with proper setup
describe('useActionAPI', () => {
  beforeEach(() => {
    // Setup action client mock
    mockActionClient.execute.mockClear();
  });

  it('should create user successfully', async () => {
    mockActionClient.execute.mockResolvedValue({
      data: { id: '1', name: 'John Doe', email: 'john@example.com' }
    });

    const { result } = renderHook(() =>
      useActionAPI({ action: 'USER_CREATE' })
    );

    await act(async () => {
      result.current.mutate({
        data: { name: 'John Doe', email: 'john@example.com' }
      });
    });

    expect(mockActionClient.execute).toHaveBeenCalledWith(
      'USER_CREATE',
      { data: { name: 'John Doe', email: 'john@example.com' } },
      { branchName: 'main' }
    );
  });
});
```

## Code Organization Principles

### 1. Feature-Based Structure

**Organize code by feature, not by type:**

```
✅ GOOD: Feature-based organization
src/
  features/
    users/
      schema.ts          # USER_SCHEMA definition
      components/        # User-specific components
      hooks/            # User-specific hooks
      types.ts          # User types
      index.ts          # Feature exports
    orders/
      schema.ts          # ORDER_SCHEMA definition
      components/
      hooks/
      types.ts
      index.ts
    
❌ BAD: Type-based organization
src/
  schemas/             # All schemas mixed together
  components/          # All components mixed together
  hooks/              # All hooks mixed together
```

### 2. Clean Import Patterns

**Use clean, predictable import patterns:**

```typescript
// ✅ GOOD: Clean imports
import { USER_SCHEMA, UserTypes } from '@/features/users';
import { ORDER_SCHEMA, OrderTypes } from '@/features/orders';
import { AutoTable, AutoForm } from '@/components/auto-generated';
import { useActionQuery, useActionAPI } from '@/hooks/action-system';

// ❌ BAD: Deep imports
import { USER_SCHEMA } from '@/features/users/schema';
import { UserTypes } from '@/features/users/types';
import AutoTable from '@/components/auto-generated/table/auto-table';
import AutoForm from '@/components/auto-generated/form/auto-form';
```

### 3. Type Safety

**Maintain strict type safety throughout:**

```typescript
// ✅ GOOD: Type-safe action usage
const CreateUserForm = () => {
  const { mutate } = useActionAPI<UserCreatePayload, User>({
    action: 'USER_CREATE',
    onSuccess: (user: User) => {
      // TypeScript knows `user` is of type `User`
      console.log(user.id, user.name);
    }
  });

  const handleSubmit = (data: UserCreatePayload) => {
    mutate({ data }); // TypeScript validates payload structure
  };
};

// ❌ BAD: No type safety
const BadCreateUserForm = () => {
  const { mutate } = useActionAPI({
    action: 'USER_CREATE',
    onSuccess: (user: any) => { // No type safety
      console.log(user.id, user.name); // Could fail at runtime
    }
  });

  const handleSubmit = (data: any) => { // No validation
    mutate({ data });
  };
};
```

## Security Best Practices

### 1. Permission Validation

**Always validate permissions in schemas:**

```typescript
// ✅ GOOD: Explicit permission rules
const USER_SCHEMA = {
  actions: {
    create: { 
      enabled: true, 
      permissions: ['admin'] // Only admins can create users
    },
    update: { 
      enabled: true, 
      permissions: ['admin', 'self'] // Admin or self can update
    },
    delete: { 
      enabled: true, 
      permissions: ['admin'] // Only admins can delete
    },
    list: { 
      enabled: true, 
      permissions: ['authenticated'] // Any authenticated user
    }
  }
};

// ❌ BAD: No permission rules
const BAD_USER_SCHEMA = {
  actions: {
    create: { enabled: true }, // Anyone can create users!
    update: { enabled: true }, // Anyone can update any user!
    delete: { enabled: true }  // Anyone can delete users!
  }
};
```

### 2. Input Sanitization

**Sanitize and validate all input:**

```typescript
// ✅ GOOD: Comprehensive validation
const USER_SCHEMA = {
  fields: {
    name: {
      type: 'string',
      required: true,
      maxLength: 100,
      sanitize: 'trim', // Remove whitespace
      validation: [
        { rule: 'required' },
        { rule: 'maxLength', value: 100 },
        { rule: 'pattern', value: /^[a-zA-Z\s]+$/, message: 'Only letters and spaces allowed' }
      ]
    },
    email: {
      type: 'email',
      required: true,
      sanitize: ['trim', 'lowercase'],
      validation: [
        { rule: 'required' },
        { rule: 'email' },
        { rule: 'unique' }
      ]
    }
  }
};

// ❌ BAD: No validation or sanitization
const BAD_USER_SCHEMA = {
  fields: {
    name: { type: 'string' }, // No length limits, no sanitization
    email: { type: 'string' } // No email validation, no uniqueness
  }
};
```

## Deployment & Monitoring

### 1. Environment Configuration

**Use environment-specific configurations:**

```typescript
// ✅ GOOD: Environment-aware configuration
const getActionClientConfig = () => {
  const base = {
    endpoint: '/api/workspaces/current/actions',
    retryAttempts: 3,
    timeout: 30000
  };

  if (process.env.NODE_ENV === 'development') {
    return {
      ...base,
      debug: true,
      logLevel: 'verbose',
      cacheTime: 60 * 1000 // 1 minute in dev
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      ...base,
      debug: false,
      logLevel: 'error',
      cacheTime: 5 * 60 * 1000 // 5 minutes in production
    };
  }

  return base;
};
```

### 2. Performance Monitoring

**Monitor performance metrics:**

```typescript
// ✅ GOOD: Performance monitoring
const ActionPerformanceMonitor = () => {
  useEffect(() => {
    // Monitor cache hit rates
    const cacheStats = ActionClient.getCacheStats();
    analytics.track('cache_performance', {
      hitRate: cacheStats.hitRate,
      missCount: cacheStats.missCount,
      totalRequests: cacheStats.totalRequests
    });

    // Monitor slow queries
    ActionClient.on('slow_query', (event) => {
      if (event.duration > 2000) { // > 2 seconds
        analytics.track('slow_query', {
          action: event.action,
          duration: event.duration,
          branch: event.context.branchName
        });
      }
    });
  }, []);
};
```

These best practices ensure maintainable, performant, and secure applications built with the Action System. Following these patterns will result in consistent, reliable code that scales well across teams and projects. 