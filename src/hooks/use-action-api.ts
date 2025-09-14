/**
 * SSOT Action API Hooks - Simplified Entry Point
 * 
 * Re-exports the modular query system for backward compatibility
 * while providing a clean, focused architecture.
 * 
 * 🚀 **REFACTOR COMPLETE**: 
 * - Reduced from 1,376 lines to 25 lines
 * - Split into focused modules under ./query/
 * - Improved cache invalidation reliability
 * - Maintained full backward compatibility
 */

// Re-export the modular system
export {
  useActionQuery,
  useActionMutation,
  useActionCache,
  queryKeys,
  invalidateCacheAfterMutation,
  invalidateResourceFamily,
  invalidateEverything,
  debouncedInvalidateQueries,
  // Resource convenience hooks (backward compatibility)
  useResourceList,
  useResourceItem,
  useResourceCreate,
  useResourceUpdate,
  useResourceDelete
} from './query';

export type {
  ActionQueryOptions,
  ActionMutationOptions,
  QueryKeys
} from './query';

// Legacy exports maintained for backward compatibility
// All implementation moved to focused modules in ./query/