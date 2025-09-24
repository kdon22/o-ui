/**
 * Session System - Single Source of Truth
 * 
 * Enterprise-grade session management with focused hooks
 * and clean barrel exports for consistent usage across the app.
 */

// ============================================================================
// CORE HOOKS - Single responsibility, focused domain hooks
// ============================================================================

export { useAuth } from './hooks/use-auth';
export { useBranchContext } from './hooks/use-branch-context';
export { useNavigationContext } from './hooks/use-navigation-context';
export { useUserPreferences } from './hooks/use-user-preferences';
export { usePermissions } from './hooks/use-permissions';

// ============================================================================
// COMPOSED HOOKS - Convenience combinations for common patterns
// ============================================================================

export { useActionClientContext } from './hooks/composed/use-action-client-context';
export { useCRUDContext } from './hooks/composed/use-crud-context';
export { useFormContext } from './hooks/composed/use-form-context';

// ============================================================================
// TYPES - All session-related types
// ============================================================================

export type {
  // Core types
  BranchContext,
  NavigationContext,
  UserPreferences,
  UserPermissions,
  AuthState,
  
  // Composed types
  ActionClientContext,
  CRUDContext,
  FormContext,
  
  // Hook return types
  AuthHookReturn,
  BranchContextHookReturn,
  NavigationContextHookReturn,
  UserPreferencesHookReturn,
  PermissionsHookReturn,
  
  // Supporting types
  WorkspaceStructure,
  WorkspaceNode,
  EditorSettings,
  TenantPermission,
} from './types';

// ============================================================================
// RE-EXPORTS - Common NextAuth exports for convenience
// ============================================================================

export { useSession, signIn, signOut, getSession } from 'next-auth/react';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example Basic authentication
 * ```typescript
 * import { useAuth } from '@/lib/session';
 * 
 * function MyComponent() {
 *   const { isAuthenticated, userId, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Login</button>;
 *   }
 *   
 *   return <button onClick={logout}>Logout {userId}</button>;
 * }
 * ```
 */

/**
 * @example Branch switching
 * ```typescript
 * import { useBranchContext } from '@/lib/session';
 * 
 * function BranchSwitcher() {
 *   const { currentBranchId, switchBranch, isFeatureBranch } = useBranchContext();
 *   
 *   return (
 *     <div>
 *       Current: {currentBranchId} {isFeatureBranch && '(feature)'}
 *       <button onClick={() => switchBranch('main')}>Switch to Main</button>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * @example Action system integration
 * ```typescript
 * import { useActionClientContext } from '@/lib/session';
 * import { getActionClient } from '@/lib/action-client';
 * 
 * function DataComponent() {
 *   const { tenantId, branchContext, isReady } = useActionClientContext();
 *   
 *   if (!isReady) return <LoadingSpinner />;
 *   
 *   const actionClient = getActionClient(tenantId, branchContext);
 *   // Use actionClient...
 * }
 * ```
 */

/**
 * @example CRUD form context
 * ```typescript
 * import { useCRUDContext } from '@/lib/session';
 * 
 * function CreateRuleForm() {
 *   const { tenantId, currentBranchId, parentNodeId } = useCRUDContext();
 *   
 *   const defaultData = {
 *     tenantId,
 *     branchId: currentBranchId,
 *     nodeId: parentNodeId, // Auto-populated from last selected node
 *   };
 * }
 * ```
 */