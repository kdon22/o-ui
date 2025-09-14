/**
 * Navigation Context Helper
 * 
 * Auto-generates navigation context for context menu actions
 * Uses the same autovalue system as the schemas
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useNodeIdResolver } from '@/lib/utils/entity-id-resolver';

export interface NavigationContextData {
  nodeId?: string | null;
  parentId?: string | null;
  selectedId?: string | null;
  processId?: string | null;
  workflowId?: string | null;
  branchId?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  [key: string]: any;
}

/**
 * Hook to auto-generate navigation context from current session and navigation state
 * This leverages the same context sources as the autovalue system
 */
export const useNavigationContext = (overrides?: Partial<NavigationContextData>): NavigationContextData => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  return useMemo(() => {
    const context: NavigationContextData = {
      // Session context
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      branchId: session?.user?.branchContext?.currentBranchId,
      
      // Navigation context from URL params
      nodeId: searchParams.get('nodeId') ?? undefined,
      parentId: searchParams.get('parentId') ?? undefined,
      selectedId: searchParams.get('selectedId') ?? undefined,
      processId: searchParams.get('processId') ?? undefined,
      workflowId: searchParams.get('workflowId') ?? undefined,
      
      // Override with any provided values
      ...overrides
    };

    // Filter out undefined values
    return Object.fromEntries(
      Object.entries(context).filter(([_, value]) => value !== undefined)
    );
  }, [session, searchParams, overrides]);
};

/**
 * Auto-populate navigation context from current page context
 * This is especially useful for pages that are already in a node context
 * 
 * IMPORTANT: This resolves nodeIdShort to full nodeId to ensure consistency
 */
export const useAutoNavigationContext = (): NavigationContextData => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // Extract nodeIdShort from current URL path or search params
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const nodeIdShortFromPath = currentPath.match(/\/nodes\/([^\/]+)/)?.[1];
  const nodeIdFromParams = searchParams.get('nodeId');
  const processIdFromParams = searchParams.get('processId');
  const workflowIdFromParams = searchParams.get('workflowId');
  const selectedIdFromParams = searchParams.get('selectedId');
  
  // Determine what we need to resolve
  const nodeIdToResolve = nodeIdShortFromPath || nodeIdFromParams || null;
  
  // Use the resolver to get the full nodeId
  const { fullNodeId, isResolving, error } = useNodeIdResolver(nodeIdToResolve);
  
  return useMemo(() => {
    const context: NavigationContextData = {
      // Session context
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      branchId: session?.user?.branchContext?.currentBranchId,
      
      // Navigation context - only provide nodeId if it's fully resolved
      nodeId: fullNodeId || undefined,
      parentId: searchParams.get('parentId') || undefined,
      selectedId: selectedIdFromParams || undefined,
      processId: processIdFromParams || undefined,
      workflowId: workflowIdFromParams || undefined,
    };

    // Debug: Log navigation context extraction (reduced noise)
    if (process.env.NODE_ENV === 'development' && (nodeIdToResolve || fullNodeId)) {
      console.log('🔍 [useAutoNavigationContext] Navigation context extracted:', {
        currentPath,
        nodeIdShortFromPath,
        nodeIdToResolve,
        fullNodeId,
        isResolving,
        error: error?.message,
        finalNodeId: context.nodeId
      });
    }

    // Filter out undefined values
    return Object.fromEntries(
      Object.entries(context).filter(([_, value]) => value !== undefined)
    );
  }, [session, searchParams, fullNodeId, isResolving, error, nodeIdShortFromPath, nodeIdFromParams, nodeIdToResolve, currentPath, processIdFromParams, workflowIdFromParams, selectedIdFromParams]);
};

/**
 * Get navigation context from autovalue source paths
 * This mirrors the autovalue system in the schemas
 */
export const getNavigationContextFromAutoValue = (
  sourcePath: string,
  session: any,
  searchParams: URLSearchParams
): any => {
  switch (sourcePath) {
    case 'session.user.tenantId':
      return session?.user?.tenantId;
    case 'session.user.branchContext.currentBranchId':
      return session?.user?.branchContext?.currentBranchId;
    case 'session.user.branchContext.defaultBranchId':
      return session?.user?.branchContext?.defaultBranchId;
    case 'session.user.id':
      return session?.user?.id;
    case 'navigation.nodeId':
      return searchParams.get('nodeId');
    case 'navigation.parentId':
      return searchParams.get('parentId');
    case 'navigation.selectedId':
      return searchParams.get('selectedId');
    default:
      return undefined;
  }
}; 