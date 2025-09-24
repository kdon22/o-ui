/**
 * Hooks Index - Clean Organization by Concern
 * 
 * All application hooks organized by their primary concern:
 * - Action System: Core action execution
 * - Resources: Resource-specific operations
 * - Loading: Loading strategies and bootstrap
 * - Layout: Layout-specific functionality
 * - Forms: Form validation and management
 */

// ============================================================================
// HOOKS INDEX
// ============================================================================

// Re-export all hooks from their respective modules
export { 
  useActionQuery, 
  useActionMutation, 
  useActionCache,
  useDataAvailability,
  queryKeys
} from './use-action-api';

// Resource hooks have been replaced by useActionQuery from use-action-api.ts

// Layout hooks
export { useSearch, useNodeTabs } from './layout';

// Node Rule Hierarchy - Hybrid Inheritance System
export { 
  useNodeRuleHierarchy, 
  useNodeRuleHierarchyOptimized, 
  useRefreshNodeRuleHierarchy 
} from './node-rule-hierarchy';



// Form validation
export { useFormValidation } from './use-form-validation';

// Types
export type { 
  ActionQueryOptions, 
  ActionMutationOptions
} from './use-action-api';

// ResourceListOptions type removed - use ActionQueryOptions instead



export type { 
  SearchState,
  SearchActions,
  UseSearchReturn,
  TabType,
  TabConfig,
  NodeTabsState,
  NodeTabsActions,
  UseNodeTabsReturn
} from './layout';

 