/**
 * Node Prefetch Utilities
 * 
 * Specialized utilities for prefetching node feature data.
 */

import { QueryClient } from '@tanstack/react-query';
import { PerformanceTracker } from '../core/PerformanceTracker';
import { queryKeys } from '@/hooks/use-action-api';

/**
 * Prefetch options for node data
 */
export interface NodePrefetchOptions {
  tenantId: string;
  resources?: any[];
  prioritized?: boolean;
}

/**
 * Query keys by resource type
 */
// export const resourceQueryKeys = {
//   process: (nodeId: string, tenantId: string) => 
//     queryKeys.process.nodeProcess(nodeId, tenantId),
//   workflow: (nodeId: string, tenantId: string) => 
//     queryKeys.workflow.nodeWorkflow(nodeId, tenantId),
//   rule: (nodeId: string, tenantId: string) => 
//     queryKeys.rule.nodeRules(nodeId, tenantId),
//   office: (nodeId: string, tenantId: string) => 
//     queryKeys.office.nodeOffices(nodeId, tenantId)
// };

/**
 * Prefetch data for a specific node tab
 * 
 * @param tabId Tab ID to prefetch
 * @param nodeId Node ID
 * @param tenantId Tenant ID
 * @param queryClient Query client
 */
export function prefetchNodeTab(
  tabId: string,
  nodeId: string,
  tenantId: string | null,
  queryClient: QueryClient
): void {
  if (!nodeId || !tenantId) {
    console.warn(`[prefetchNodeTab] Missing nodeId or tenantId for ${tabId}`);
    return;
  }
  
  // Skip if tab data is already in cache
  const queryKey = getQueryKeyForTab(tabId, nodeId, tenantId);
  if (queryKey && queryClient.getQueryData(queryKey)) {
    return;
  }
  
  const perfId = PerformanceTracker.startTracking('data-fetch', undefined, {
    tab: tabId,
    nodeId,
    operation: 'prefetch'
  });
  
  // Just prefetch the specific resource type matching the tab ID
  const resource = tabId === 'process' ? 'process' :
                   tabId === 'workflow' ? 'workflow' :
                   tabId === 'office' ? 'office' :
                   null;
  
  if (resource) {
    // Placeholder for the removed DataPrefetcher
    console.warn(`[prefetchNodeTab] DataPrefetcher usage removed, ${tabId} prefetching logic not implemented`);
    PerformanceTracker.endTracking(perfId);
  } else {
    console.warn(`[prefetchNodeTab] Unknown tab type: ${tabId}`);
    PerformanceTracker.endTracking(perfId);
  }
}

/**
 * Get query key for a specific tab
 * 
 * @param tabId Tab ID
 * @param nodeId Node ID
 * @param tenantId Tenant ID
 * @returns Query key for the tab or null
 */
export function getQueryKeyForTab(
  tabId: string,
  nodeId: string,
  tenantId: string
): readonly unknown[] | null {
  // Use the correct queryKeys structure from action-api
  switch (tabId) {
    case 'process': 
    case 'processes': 
      return queryKeys.resourceList('processes', { nodeId, tenantId });
    case 'workflow': 
    case 'workflows': 
      return queryKeys.resourceList('workflows', { nodeId, tenantId });
    case 'office': 
    case 'offices': 
      return queryKeys.resourceList('offices', { nodeId, tenantId });
    case 'rules': 
      return queryKeys.resourceList('rules', { nodeId, tenantId });
    default:
      return null;
  }
}

/**
 * Prefetch all node resources for a specific node
 * 
 * @param nodeId Node ID
 * @param options Prefetch options
 */
export async function prefetchNodeResources(
  nodeId: string,
  options: NodePrefetchOptions
): Promise<void> {
  const queryClient = new QueryClient();
  
  const perfId = PerformanceTracker.startTracking('data-fetch', undefined, {
    nodeId,
    operation: 'prefetch-all'
  });
  
  try {
    // Placeholder for the removed DataPrefetcher
    console.warn(`[prefetchNodeResources] DataPrefetcher usage removed, prefetching logic not implemented`);
    
    PerformanceTracker.endTracking(perfId);
    
  } catch (error) {
    console.error(`[prefetchNodeResources] Error prefetching resources for node ${nodeId}:`, error);
    PerformanceTracker.endTracking(perfId);
  }
} 