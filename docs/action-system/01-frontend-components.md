# Frontend Components - Action System Integration

## 🎯 **Overview**

This document covers all frontend components that integrate with the Unified Action System, including forms, hooks, and the ActionClient.

## 🔧 **AutoForm - Schema-Driven Forms with Junction Creation**

### **Location**: `o-ui/src/components/auto-generated/form/auto-form.tsx`

The AutoForm is the primary UI component for creating and editing entities with automatic junction creation.

### **Key Features**
- **Schema-Driven**: Automatically generates form fields from ResourceSchema
- **Junction Creation**: Detects navigation context and creates relationships automatically
- **Branch-Aware**: Supports workspace branching and copy-on-write
- **Validation**: Real-time validation using Zod schemas
- **Mobile-First**: Responsive design with touch optimization

### **Basic Usage**

```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';

function CreateProcessModal({ nodeId, onClose }) {
  const handleSubmit = async (data) => {
    console.log('Process created:', data);
    onClose();
  };

  return (
    <AutoForm
      schema={PROCESS_SCHEMA}
      mode="create"
      navigationContext={{ nodeId }}
      enableJunctionCreation={true}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}
```

### **Props Interface**

```typescript
interface AutoFormProps {
  schema: ResourceSchema;                    // Resource schema definition
  mode: 'create' | 'edit';                  // Form mode
  initialData?: Record<string, any>;        // Initial form data (edit mode)
  parentData?: Record<string, any>;         // Parent entity data
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;                      // External loading state
  className?: string;                       // CSS classes
  compact?: boolean;                        // Compact layout
  enableAnimations?: boolean;               // Form animations
  enableKeyboardShortcuts?: boolean;        // Keyboard shortcuts
  onError?: (error: Error) => void;         // Error handler
  
  // Junction Creation
  navigationContext?: NavigationContext;     // Current navigation context
  componentContext?: any;                   // Component-specific context
  enableJunctionCreation?: boolean;         // Enable automatic junction creation
}
```

### **Junction Creation Flow**

When `enableJunctionCreation` is true and `navigationContext` is provided:

1. **Context Detection**: Analyzes navigation context to detect source entity
2. **Junction Mapping**: Looks up junction relationship in mappings
3. **Entity Creation**: Creates the main entity using regular action system
4. **Junction Creation**: Creates junction record if relationship exists
5. **Success Handling**: Returns both entity and junction creation results

```typescript
// Example: Creating Process from Node page
<AutoForm
  schema={PROCESS_SCHEMA}
  mode="create"
  navigationContext={{ nodeId: "node-123" }}  // Detected from URL/context
  enableJunctionCreation={true}
  onSubmit={async (processData) => {
    // AutoForm will:
    // 1. Create Process entity
    // 2. Create NodeProcess junction automatically
    // 3. Call this onSubmit with the created process data
    console.log('Process created with junction:', processData);
  }}
/>
```

### **Navigation Context**

The navigation context tells AutoForm what entity context the user is currently in:

```typescript
interface NavigationContext {
  nodeId?: string;        // Current node context
  processId?: string;     // Current process context
  workflowId?: string;    // Current workflow context
  officeId?: string;      // Current office context
  parentId?: string;      // Generic parent context
  selectedId?: string;    // Currently selected entity
  [key: string]: string | undefined;
}
```

### **Context Detection Methods**

AutoForm can detect navigation context from multiple sources:

1. **URL Parameters**: Extracted from `usePathname()` and `useSearchParams()`
2. **Component Props**: Passed directly via `navigationContext` prop
3. **Parent Data**: Inferred from `parentData` prop
4. **Component Context**: From `componentContext` prop

## 🎣 **Action Hooks**

### **useActionQuery - Data Fetching**

**Location**: `o-ui/src/hooks/use-action-api.ts`

Hook for fetching data using the action system.

```typescript
import { useActionQuery } from '@/hooks/use-action-api';

function ProcessList({ nodeId }) {
  const { 
    data: processes, 
    isLoading, 
    error, 
    refetch 
  } = useActionQuery({
    action: 'process.list',
    data: { nodeId },
    options: { limit: 50 },
    queryKey: ['processes', nodeId],
    enabled: !!nodeId
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {processes?.map(process => (
        <div key={process.id}>{process.name}</div>
      ))}
    </div>
  );
}
```

### **useActionMutation - Data Mutations**

```typescript
import { useActionMutation } from '@/hooks/use-action-api';

function ProcessActions({ processId }) {
  const updateProcess = useActionMutation({
    action: 'process.update',
    onSuccess: (data) => {
      console.log('Process updated:', data);
    },
    onError: (error) => {
      console.error('Update failed:', error);
    }
  });

  const deleteProcess = useActionMutation({
    action: 'process.delete',
    onSuccess: () => {
      console.log('Process deleted');
    }
  });

  return (
    <div>
      <button 
        onClick={() => updateProcess.mutate({ 
          id: processId, 
          name: 'Updated Name' 
        })}
        disabled={updateProcess.isPending}
      >
        Update Process
      </button>
      
      <button 
        onClick={() => deleteProcess.mutate({ id: processId })}
        disabled={deleteProcess.isPending}
      >
        Delete Process
      </button>
    </div>
  );
}
```

### **useContextualCreate - Smart Junction Creation**

**Location**: `o-ui/src/lib/junction-orchestration/use-contextual-create.ts`

Hook that automatically creates junction records based on navigation context.

```typescript
import { useContextualCreate } from '@/lib/junction-orchestration';

function SmartProcessCreator({ nodeId }) {
  const contextualCreate = useContextualCreate(
    'process',                    // Target entity type
    { nodeId },                   // Navigation context
    {
      onSuccess: (result) => {
        console.log('Entity created:', result.entity);
        console.log('Junction created:', result.junctionCreated);
        if (result.junction) {
          console.log('Junction data:', result.junction);
        }
      },
      onError: (error) => {
        console.error('Creation failed:', error);
      }
    }
  );

  const handleCreate = async () => {
    const result = await contextualCreate.mutateAsync({
      name: 'New Process',
      description: 'Process description'
    });
    
    // Result contains:
    // - entity: The created process
    // - junction: The created NodeProcess junction (if applicable)
    // - junctionCreated: boolean indicating if junction was created
  };

  return (
    <button 
      onClick={handleCreate}
      disabled={contextualCreate.isPending}
    >
      Create Process with Junction
    </button>
  );
}
```

## 🎯 **ActionClient - Core Data Orchestration**

### **Location**: `o-ui/src/lib/action-client/action-client-core.ts`

The ActionClient is the core frontend component that orchestrates all data operations.

### **Getting ActionClient Instance**

```typescript
import { getActionClient } from '@/lib/action-client/global-client';

// Get singleton instance
const actionClient = getActionClient();
```

### **Basic Operations**

```typescript
// CREATE
const newProcess = await actionClient.executeAction({
  action: 'process.create',
  data: {
    name: 'New Process',
    description: 'Process description',
    nodeId: 'node-123'  // Optional parent reference
  }
});

// READ
const process = await actionClient.executeAction({
  action: 'process.read',
  data: { id: 'process-123' }
});

// UPDATE
const updatedProcess = await actionClient.executeAction({
  action: 'process.update',
  data: {
    id: 'process-123',
    name: 'Updated Name'
  }
});

// DELETE
await actionClient.executeAction({
  action: 'process.delete',
  data: { id: 'process-123' }
});

// LIST
const processes = await actionClient.executeAction({
  action: 'process.list',
  options: {
    limit: 20,
    offset: 0,
    orderBy: 'name'
  }
});
```

### **Advanced Options**

```typescript
// With branch context
const result = await actionClient.executeAction({
  action: 'process.create',
  data: { name: 'New Process' },
  branchContext: {
    currentBranchId: 'feature-branch',
    defaultBranchId: 'main',
    tenantId: 'tenant-123'
  }
});

// With query options
const processes = await actionClient.executeAction({
  action: 'process.list',
  options: {
    limit: 50,
    offset: 0,
    orderBy: 'createdAt',
    direction: 'desc',
    filters: {
      isActive: true,
      nodeId: 'node-123'
    }
  }
});
```

### **Resource Methods**

ActionClient provides type-safe resource methods:

```typescript
// Access resource-specific methods
const processActions = actionClient.get('processes');

// Type-safe operations
const processes = await processActions.list({ nodeId: 'node-123' });
const process = await processActions.read('process-123');
const newProcess = await processActions.create({ name: 'New Process' });
```

## 🔄 **Data Flow Integration**

### **Form Submission Flow**

```typescript
// 1. User submits AutoForm
<AutoForm
  schema={PROCESS_SCHEMA}
  mode="create"
  navigationContext={{ nodeId }}
  enableJunctionCreation={true}
  onSubmit={async (formData) => {
    // 2. AutoForm processes submission
    // 3. Calls contextual create if junction creation enabled
    // 4. Returns to this onSubmit with final result
    console.log('Final result:', formData);
  }}
/>

// Internal AutoForm flow:
const onFormSubmit = async (data) => {
  if (mode === 'create' && enableJunctionCreation) {
    // Use contextual create mutation
    const result = await contextualCreateMutation.mutateAsync(data);
    await onSubmit(result.entity.data);
  } else {
    // Use regular form submission
    const submissionData = prepareSubmissionData(data, ...);
    await onSubmit(submissionData);
  }
};
```

### **Hook Integration Patterns**

```typescript
// Pattern 1: Direct ActionClient usage
function useProcessData(nodeId: string) {
  return useQuery({
    queryKey: ['processes', nodeId],
    queryFn: async () => {
      const actionClient = getActionClient();
      return actionClient.executeAction({
        action: 'process.list',
        data: { nodeId }
      });
    },
    enabled: !!nodeId
  });
}

// Pattern 2: Action hook wrapper
function useProcessData(nodeId: string) {
  return useActionQuery({
    action: 'process.list',
    data: { nodeId },
    queryKey: ['processes', nodeId],
    enabled: !!nodeId
  });
}

// Pattern 3: Contextual creation
function useSmartProcessCreation(nodeId: string) {
  return useContextualCreate('process', { nodeId });
}
```

## 📱 **Mobile-First Considerations**

### **Touch Optimization**
- Large touch targets (minimum 44px)
- Swipe gestures for navigation
- Pull-to-refresh for data updates
- Optimistic UI updates for instant feedback

### **Performance Optimization**
- IndexedDB caching for offline access
- Background sync for seamless updates
- Lazy loading for large datasets
- Debounced search and filtering

### **Responsive Design**
- Mobile-first form layouts
- Collapsible sections for complex forms
- Bottom sheet modals on mobile
- Adaptive navigation patterns

## 🎯 **Best Practices**

### **1. Always Use Schema-Driven Components**
```typescript
// ✅ Good: Use AutoForm with schema
<AutoForm schema={PROCESS_SCHEMA} mode="create" />

// ❌ Bad: Manual form construction
<form>
  <input name="name" />
  <input name="description" />
</form>
```

### **2. Enable Junction Creation When Appropriate**
```typescript
// ✅ Good: Enable junction creation in context
<AutoForm
  schema={PROCESS_SCHEMA}
  navigationContext={{ nodeId }}
  enableJunctionCreation={true}
/>

// ❌ Bad: Manual junction creation
const process = await createProcess(data);
await createNodeProcess({ nodeId, processId: process.id });
```

### **3. Use Appropriate Hooks for Data Operations**
```typescript
// ✅ Good: Use action hooks
const { data, isLoading } = useActionQuery({ action: 'process.list' });

// ❌ Bad: Direct fetch calls
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/processes').then(res => res.json()).then(setData);
}, []);
```

### **4. Handle Loading and Error States**
```typescript
// ✅ Good: Comprehensive state handling
const { data, isLoading, error, refetch } = useActionQuery({
  action: 'process.list'
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState />;

return <ProcessList processes={data} />;
```

## 🔧 **Customization**

### **Custom Form Fields**
```typescript
// Extend AutoForm with custom field components
const CustomAutoForm = ({ schema, ...props }) => {
  const customFieldComponents = {
    richText: RichTextEditor,
    colorPicker: ColorPickerField,
    fileUpload: FileUploadField
  };

  return (
    <AutoForm
      schema={schema}
      fieldComponents={customFieldComponents}
      {...props}
    />
  );
};
```

### **Custom Action Hooks**
```typescript
// Create domain-specific hooks
function useProcessManagement(nodeId: string) {
  const listQuery = useActionQuery({
    action: 'process.list',
    data: { nodeId }
  });

  const createMutation = useActionMutation({
    action: 'process.create',
    onSuccess: () => listQuery.refetch()
  });

  const updateMutation = useActionMutation({
    action: 'process.update',
    onSuccess: () => listQuery.refetch()
  });

  return {
    processes: listQuery.data,
    isLoading: listQuery.isLoading,
    createProcess: createMutation.mutate,
    updateProcess: updateMutation.mutate,
    refetch: listQuery.refetch
  };
}
```

## 🐛 **Common Issues and Solutions**

### **Issue 1: Junction Not Created**
```typescript
// Problem: Navigation context not detected
<AutoForm schema={PROCESS_SCHEMA} enableJunctionCreation={true} />

// Solution: Provide navigation context
<AutoForm 
  schema={PROCESS_SCHEMA} 
  navigationContext={{ nodeId: currentNodeId }}
  enableJunctionCreation={true} 
/>
```

### **Issue 2: Form Validation Errors**
```typescript
// Problem: Schema validation failing
const data = { name: '', description: null };

// Solution: Ensure data matches schema requirements
const data = { 
  name: 'Required Name',
  description: 'Optional description' 
};
```

### **Issue 3: Stale Data After Mutations**
```typescript
// Problem: Data not refreshing after mutations
const createProcess = useActionMutation({ action: 'process.create' });

// Solution: Invalidate queries after mutations
const createProcess = useActionMutation({
  action: 'process.create',
  onSuccess: () => {
    queryClient.invalidateQueries(['processes']);
  }
});
```

## 🔗 **Related Documentation**

- **[Junction System](./03-junction-system.md)** - Automatic relationship creation
- **[Schema System](./06-schema-system.md)** - Resource schema definitions
- **[Developer Examples](./05-developer-examples.md)** - Practical usage patterns