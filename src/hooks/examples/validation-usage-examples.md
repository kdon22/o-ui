# Name Validation Hook Factory - Usage Examples

This document shows how to use the reusable name validation system across different entities.

## 🏭 Factory Pattern Usage

### 1. Using Pre-configured Hooks

```tsx
import { 
  useWorkflowNameValidation,
  useRuleNameValidation, 
  useProcessNameValidation,
  useNodeNameValidation 
} from '@/hooks/use-name-validation';

// In WorkflowEditor.tsx
function WorkflowEditor({ workflowId }) {
  const validation = useWorkflowNameValidation(workflowName, workflowId);
  
  return (
    <ValidatedNameEditor
      name={workflowName}
      useValidation={useWorkflowNameValidation}
      currentEntityId={workflowId}
      // ... other props
    />
  );
}

// In RuleEditor.tsx
function RuleEditor({ ruleId }) {
  const validation = useRuleNameValidation(ruleName, ruleId);
  // Same pattern...
}
```

### 2. Creating Custom Hooks

```tsx
import { createNameValidationHook } from '@/hooks/use-name-validation';

// Custom hook for a new entity type
const useCustomerNameValidation = createNameValidationHook({
  entityType: 'customer',
  minLength: 2,
  maxLength: 50,
  customValidator: (name) => {
    if (name.includes('@')) {
      return 'Customer name cannot contain email addresses';
    }
    return null;
  },
  debounceMs: 500 // Slower debounce for complex validation
});

// Use in component
function CustomerForm() {
  const validation = useCustomerNameValidation(customerName, customerId);
  
  return (
    <ValidatedNameEditor
      useValidation={useCustomerNameValidation}
      // ... props
    />
  );
}
```

### 3. Advanced Custom Validation

```tsx
const useProjectNameValidation = createNameValidationHook({
  entityType: 'project',
  minLength: 3,
  maxLength: 60,
  customValidator: (name) => {
    // Must start with letter
    if (!/^[a-zA-Z]/.test(name)) {
      return 'Project name must start with a letter';
    }
    
    // No special characters except dash and underscore
    if (!/^[a-zA-Z0-9_-\s]+$/.test(name)) {
      return 'Only letters, numbers, spaces, dashes, and underscores allowed';
    }
    
    // Reserved words
    const reserved = ['admin', 'api', 'www', 'system'];
    if (reserved.includes(name.toLowerCase())) {
      return 'This name is reserved';
    }
    
    return null;
  }
});
```

## 🎯 Real-World Integration Examples

### Example 1: Workflow Builder (Current Implementation)

```tsx
// o-ui/src/features/workflows/components/workflow-builder/index.tsx
import { ValidatedNameEditor } from '@/components/ui/validated-name-editor';
import { useWorkflowNameValidation } from '@/hooks/use-name-validation';

export function WorkflowBuilder({ workflow }) {
  return (
    <ValidatedNameEditor
      name={workflowName}
      isEditing={isEditingName}
      onSave={handleNameSave}
      onCancel={() => setIsEditingName(false)}
      onStartEdit={() => setIsEditingName(true)}
      useValidation={useWorkflowNameValidation}
      currentEntityId={workflow?.id}
      placeholder="Enter workflow name..."
      showSuggestions={true}
    />
  );
}
```

### Example 2: Rule Editor Integration

```tsx
// o-ui/src/features/rules/components/rule-editor/index.tsx
import { ValidatedNameEditor } from '@/components/ui/validated-name-editor';
import { useRuleNameValidation } from '@/hooks/use-name-validation';

export function RuleEditor({ rule }) {
  return (
    <div className="rule-header">
      <ValidatedNameEditor
        name={rule?.name || 'New Rule'}
        isEditing={isEditingName}
        onSave={handleNameSave}
        onCancel={() => setIsEditingName(false)}
        onStartEdit={() => setIsEditingName(true)}
        useValidation={useRuleNameValidation}
        currentEntityId={rule?.id}
        placeholder="Enter rule name..."
        showSuggestions={true}
      />
    </div>
  );
}
```

### Example 3: Process Creation Form

```tsx
// o-ui/src/features/processes/components/create-process-form.tsx
import { ValidatedNameEditor } from '@/components/ui/validated-name-editor';
import { useProcessNameValidation } from '@/hooks/use-name-validation';

export function CreateProcessForm() {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  return (
    <form onSubmit={handleSubmit}>
      <ValidatedNameEditor
        name={name}
        isEditing={true} // Always editing in create form
        onSave={(validatedName) => setName(validatedName)}
        onCancel={() => setName('')}
        onStartEdit={() => {}} // No-op for create forms
        useValidation={useProcessNameValidation}
        // No currentEntityId for new entities
        placeholder="Enter process name..."
        showSuggestions={true}
      />
      
      {/* Other form fields... */}
      
      <button 
        type="submit" 
        disabled={!useProcessNameValidation(name).isValid}
      >
        Create Process
      </button>
    </form>
  );
}
```

## 🚀 Benefits of This Pattern

### 1. **Consistent UX Across App**
- Same validation behavior everywhere
- Same error messages and suggestions
- Same loading states and visual feedback

### 2. **DRY Principle** 
- One validation system for all entities
- Reusable configuration patterns
- No duplicate validation logic

### 3. **Type Safety**
- Full TypeScript support
- Proper error handling
- Clear API contracts

### 4. **Performance**
- Debounced API calls
- Cached validation results
- Optimistic validation

### 5. **Extensibility**
- Easy to add new entity types
- Configurable validation rules
- Custom validation functions

## 🔧 Advanced Usage Patterns

### Conditional Validation

```tsx
const useConditionalValidation = createNameValidationHook({
  entityType: 'workflow',
  minLength: 3,
  maxLength: 50,
  customValidator: (name) => {
    // Get context from React context or props
    const isProduction = useEnvironment() === 'production';
    
    if (isProduction && name.includes('test')) {
      return 'Test workflows not allowed in production';
    }
    
    return null;
  }
});
```

### Integration with Form Libraries

```tsx
// With react-hook-form
function WorkflowForm() {
  const { register, formState: { errors } } = useForm();
  const validation = useWorkflowNameValidation(watchedName);
  
  return (
    <div>
      <ValidatedNameEditor
        {...register('name', {
          validate: (value) => validation.isValid || validation.error
        })}
        useValidation={useWorkflowNameValidation}
      />
      {errors.name && <span>{errors.name.message}</span>}
    </div>
  );
}
```

This factory pattern ensures consistent, reliable name validation across your entire application! 🎉
