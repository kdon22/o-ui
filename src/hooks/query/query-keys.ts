/**
 * Query Key Factory - Centralized query key management
 * 
 * Provides consistent query keys for TanStack Query caching
 */

export const queryKeys = {
  all: ['action-api'] as const,
  actions: (action: string) => [...queryKeys.all, 'actions', action] as const,
  actionData: (action: string, data?: any, branchId?: string) => [...queryKeys.actions(action), data, branchId] as const,
  actionFilters: (action: string, filters?: Record<string, any>) => [...queryKeys.actions(action), 'filters', filters] as const,
  resource: (resource: string) => [...queryKeys.all, 'resource', resource] as const,
  resourceList: (resource: string, filters?: Record<string, any>) => [...queryKeys.resource(resource), 'list', filters] as const,
  resourceItem: (resource: string, id: string) => [...queryKeys.resource(resource), 'item', id] as const,
};

export type QueryKeys = typeof queryKeys;
