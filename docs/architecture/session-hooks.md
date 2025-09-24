# Session System - Enterprise SSOT

**Single Source of Truth for all session-related state management.**

## 🎯 **Architecture**

### **Focused Domain Hooks**
- `useAuth()` - Authentication state only
- `useBranchContext()` - Branch switching only  
- `useNavigationContext()` - Navigation state only
- `useUserPreferences()` - User settings only
- `usePermissions()` - Access control only

### **Composed Convenience Hooks**
- `useActionClientContext()` - For ActionClient usage
- `useCRUDContext()` - For CRUD forms
- `useFormContext()` - For auto-forms

## 🚀 **Usage**

```typescript
import { useAuth, useBranchContext, useActionClientContext } from '@/lib/session';

// Authentication
const { isAuthenticated, userId, login, logout } = useAuth();

// Branch switching
const { currentBranchId, switchBranch, isFeatureBranch } = useBranchContext();

// Action system integration
const { tenantId, branchContext, isReady } = useActionClientContext();
```

## ✅ **Benefits**

- **Performance** - Only re-renders on relevant changes
- **Type Safety** - Full TypeScript coverage
- **Enterprise Grade** - Never throws during SSR
- **Clean APIs** - Single responsibility per hook
- **No Fallbacks** - Fails fast with clear errors instead of defaulting to 'main'

## 🔄 **Migration**

**Old → New:**
```typescript
// ✅ NEW - Single focused implementations
import { useAuth, useBranchContext, useActionClientContext } from '@/lib/session';
```