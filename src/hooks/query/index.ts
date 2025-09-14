/**
 * Query System - Modular TanStack Query Integration
 * 
 * Clean, focused modules for action-based queries and mutations
 */

// Core hooks
export { useActionQuery } from './use-action-query';
export { useActionMutation } from './use-action-mutation';
export { useActionCache } from './use-action-cache';

// Resource convenience hooks (backward compatibility)
export {
  useResourceList,
  useResourceItem,
  useResourceCreate,
  useResourceUpdate,
  useResourceDelete
} from './resource-hooks';

// Utilities
export { queryKeys } from './query-keys';
export { 
  invalidateCacheAfterMutation,
  invalidateResourceFamily,
  invalidateEverything,
  debouncedInvalidateQueries
} from './cache-invalidation';

// Types
export type { ActionQueryOptions } from './use-action-query';
export type { ActionMutationOptions } from './use-action-mutation';
export type { QueryKeys } from './query-keys';
