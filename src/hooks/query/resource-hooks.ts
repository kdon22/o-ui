/**
 * Resource Convenience Hooks - Backward Compatibility
 * 
 * Provides convenient resource-specific hooks that wrap the core
 * useActionQuery and useActionMutation hooks.
 */

import { useActionQuery } from './use-action-query';
import { useActionMutation } from './use-action-mutation';
import type { ActionQueryOptions } from './use-action-query';
import type { ActionMutationOptions } from './use-action-mutation';

// ============================================================================
// RESOURCE QUERY HOOKS
// ============================================================================

/**
 * Hook for fetching a list of resources
 */
export function useResourceList<TData = any>(
  resource: string,
  filters?: Record<string, any>,
  options?: ActionQueryOptions<TData>
) {
  return useActionQuery<TData>(`${resource}.list`, filters, options);
}

/**
 * Hook for fetching a single resource by ID
 */
export function useResourceItem<TData = any>(
  resource: string,
  id: string,
  options?: ActionQueryOptions<TData>
) {
  return useActionQuery<TData>(`${resource}.read`, { id }, options);
}

// ============================================================================
// RESOURCE MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating a new resource
 */
export function useResourceCreate<TData = any, TVariables = any>(
  resource: string,
  options?: ActionMutationOptions<TData, TVariables>
) {
  return useActionMutation<TData, TVariables>(`${resource}.create`, options);
}

/**
 * Hook for updating an existing resource
 */
export function useResourceUpdate<TData = any, TVariables = any>(
  resource: string,
  options?: ActionMutationOptions<TData, TVariables>
) {
  return useActionMutation<TData, TVariables>(`${resource}.update`, options);
}

/**
 * Hook for deleting a resource
 */
export function useResourceDelete<TData = any, TVariables = any>(
  resource: string,
  options?: ActionMutationOptions<TData, TVariables>
) {
  return useActionMutation<TData, TVariables>(`${resource}.delete`, options);
}
