# Name Validation - Action Client Integration

## ✅ **Proper Action System Integration**

The name validation hook now correctly follows your project's `@action-client/` and `@action-system/` patterns.

### **Correct Imports** 
```typescript
// ✅ CORRECT - Using your modular hook system
import { useActionQuery } from '@/hooks/use-action-api';

// ❌ WRONG - Not using non-existent path  
import { useActionQuery } from '@/lib/action-client/hooks/use-action-api';
```

### **Action Client Pattern Compliance**

The validation system now follows your established patterns:

```typescript
// Uses your standardized action query pattern
const duplicateCheckQuery = useActionQuery(
  `${entityType}.query`,  // Action: 'workflow.query', 'rule.query', etc.
  {
    filters: {
      name: debouncedName.trim(),
      tenantId: branchContext?.tenantId,
      branchId: branchContext?.currentBranchId
    },
    options: {
      limit: 10 // Get a few to suggest alternatives
    }
  },
  {
    enabled: shouldCheckDuplicates,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000,
  }
);
```

### **Branch Context Integration**

Properly integrates with your branch system:

```typescript
// Uses your branch provider correctly
import { useBranchContext } from '@/lib/branching/branch-provider';

// Accesses branch data as per your patterns
const { branchContext } = useBranchContext();
const tenantId = branchContext?.tenantId;
const currentBranchId = branchContext?.currentBranchId;
```

### **Action System Flow**

```
ValidatedNameEditor
        ↓ 
useWorkflowNameValidation (factory hook)
        ↓
useActionQuery('@/hooks/use-action-api') 
        ↓
Your Modular Query System
        ↓
ActionClient (cache-first execution)
        ↓  
IndexedDB → Memory → Server API
```

### **Zero Configuration Required**

The validation system automatically works with:
- ✅ Your existing resource schemas  
- ✅ Your action routing system
- ✅ Your branch context provider
- ✅ Your IndexedDB caching
- ✅ Your TanStack Query setup

### **Usage Across All Entities**

```typescript
// Workflows ✅ (Working now)
useWorkflowNameValidation(name, workflowId)

// Rules ✅ (Ready to use)
useRuleNameValidation(name, ruleId) 

// Processes ✅ (Ready to use)
useProcessNameValidation(name, processId)

// Custom entities ✅ (Easy to create)
const useCustomValidation = createNameValidationHook({
  entityType: 'customEntity', // Must match your resource schema
  minLength: 3,
  maxLength: 50
});
```

All validation hooks automatically:
- Query the correct API endpoints (`customEntity.query`)
- Use proper branch context
- Cache results efficiently  
- Follow your performance patterns

No additional configuration needed! 🎉
