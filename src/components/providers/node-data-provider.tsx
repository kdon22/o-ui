'use client';

/**
 * Node Data Provider - SIMPLE Tree Data Fetching
 * 
 * Clean, minimal approach:
 * - Single useActionQuery call
 * - No complex state management
 * - No competing systems
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useActionQuery } from '@/hooks/use-action-api';

// ============================================================================
// TYPES
// ============================================================================

export interface NodeData {
  id: string;
  idShort: string;
  name: string;
  description?: string;
  parentId?: string | null;
  level: number;
  path: string;
  sortOrder: number;
  childCount: number;
  isActive: boolean;
  type: 'NODE' | 'CUSTOMER' | string;
  branchId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  // Navigation properties
  ancestorIds?: string[];
  descendantIds?: string[];
  children?: NodeData[];
  hasChildren?: boolean;
  isRootNode?: boolean;
  isLeafNode?: boolean;
}

export interface NodeDataContextValue {
  // Data state
  nodes: NodeData[];
  nodesById: Map<string, NodeData>;
  nodesByParentId: Map<string, NodeData[]>;
  rootNodes: NodeData[];
  
  // Loading state
  isLoading: boolean;
  isInitialLoading: boolean;
  isFetching: boolean;
  error: string | null;
  
  // Branch context
  currentBranchId: string | null;
  isOnMainBranch: boolean;
  
  // Utilities
  getNodeById: (id: string) => NodeData | undefined;
  getNodesByParentId: (parentId: string | null) => NodeData[];
  getNodeChildren: (nodeId: string) => NodeData[];
  getNodeAncestors: (nodeId: string) => NodeData[];
  getRootNodes: () => NodeData[];
  
  // Stats
  totalNodes: number;
  visibleNodes: number;
  
  // Actions
  invalidateNodes: () => void;
  refetchNodes: () => void;
}

const NodeDataContext = createContext<NodeDataContextValue | null>(null);

// ============================================================================
// NODE DATA PROVIDER - GOLD STANDARD
// ============================================================================

interface NodeDataProviderProps {
  children: React.ReactNode;
}

export function NodeDataProvider({ children }: NodeDataProviderProps) {
  // 🚨 DEBUG: Hook count tracking to find React hook ordering issue
  let hookCount = 0
  const hookDebug = (name: string) => {
    hookCount++
  }
  
  hookDebug('useSession')
  const { data: session, status } = useSession();
  
  // ============================================================================
  // DEBUG SESSION STATE  
  // ============================================================================
  
  const sessionReady = !!(
    status === 'authenticated' &&
    session?.user?.tenantId &&
    session?.user?.branchContext?.currentBranchId
  );
  
  // 🚨 DEBUG: Enhanced session debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [NodeDataProvider] Session state check:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasTenantId: !!session?.user?.tenantId,
      tenantId: session?.user?.tenantId,
      hasBranchContext: !!session?.user?.branchContext,
      currentBranchId: session?.user?.branchContext?.currentBranchId,
      sessionReady,
      timestamp: new Date().toISOString()
    });
  }
  
  // ============================================================================
  // SIMPLE NODE QUERY - JUST USE WHAT WORKS
  // ============================================================================
  
  hookDebug('useActionQuery-nodeList')
  const nodeQuery = useActionQuery(
    'node.list',
    {
      filters: { isActive: true },
      options: {
        limit: 1000,
        include: ['children', 'parent'],
        sort: { field: 'sortOrder', direction: 'asc' }
      }
    },
    {
      enabled: sessionReady, // 🎯 Use bulletproof session check
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime in React Query v5)
      retry: 3, // Retry failed requests
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    }
  );
  
  // 🚨 DEBUG: Enhanced query debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [NodeDataProvider] Query state:', {
      isLoading: nodeQuery.isLoading,
      isFetching: nodeQuery.isFetching,
      isError: nodeQuery.isError,
      error: nodeQuery.error?.message,
      hasData: !!nodeQuery.data,
      dataLength: nodeQuery.data?.data?.length || 0,
      enabled: sessionReady,
      timestamp: new Date().toISOString()
    });
  }
  
  // ============================================================================
  // DATA PROCESSING & INDEXING
  // ============================================================================
  
  hookDebug('useMemo-processedData')
  const processedData = useMemo(() => {
    const rawNodes = nodeQuery.data?.data || [];
    
    if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
      return {
        nodes: [],
        nodesById: new Map(),
        nodesByParentId: new Map(),
        rootNodes: [],
        totalNodes: 0,
        visibleNodes: 0
      };
    }
    
    // Simple indexing
    const nodesById = new Map<string, NodeData>();
    const nodesByParentId = new Map<string, NodeData[]>();
    
    rawNodes.forEach((node: any) => {
      const processedNode: NodeData = {
        ...node,
        hasChildren: (node.childCount || 0) > 0,
        isRootNode: !node.parentId,
        isLeafNode: (node.childCount || 0) === 0
      };
      
      nodesById.set(node.id, processedNode);
      
      const parentId = node.parentId || 'ROOT';
      if (!nodesByParentId.has(parentId)) {
        nodesByParentId.set(parentId, []);
      }
      nodesByParentId.get(parentId)!.push(processedNode);
    });
    
    const rootNodes = nodesByParentId.get('ROOT') || [];
    
    return {
      nodes: rawNodes,
      nodesById,
      nodesByParentId,
      rootNodes,
      totalNodes: rawNodes.length,
      visibleNodes: rawNodes.length
    };
  }, [nodeQuery.data?.data]);
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const getNodeById = (id: string) => processedData.nodesById.get(id);
  const getNodesByParentId = (parentId: string | null) => processedData.nodesByParentId.get(parentId || 'ROOT') || [];
  const getNodeChildren = (nodeId: string) => processedData.nodesByParentId.get(nodeId) || [];
  const getRootNodes = () => processedData.rootNodes;
  
  const getNodeAncestors = (nodeId: string): NodeData[] => {
    const ancestors: NodeData[] = [];
    let currentNode = getNodeById(nodeId);
    
    while (currentNode?.parentId) {
      const parent = getNodeById(currentNode.parentId);
      if (parent) {
        ancestors.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }
    return ancestors;
  };
  
  const invalidateNodes = () => nodeQuery.refetch();
  const refetchNodes = () => nodeQuery.refetch();
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const contextValue: NodeDataContextValue = {
    // Data state
    nodes: processedData.nodes,
    nodesById: processedData.nodesById,
    nodesByParentId: processedData.nodesByParentId,
    rootNodes: processedData.rootNodes,
    
    // Loading state
    isLoading: nodeQuery.isLoading || false,
    isInitialLoading: nodeQuery.isLoading || false,
    isFetching: nodeQuery.isFetching || false,
    error: nodeQuery.error ? String(nodeQuery.error) : null,
    
    // Branch context
    currentBranchId: session?.user?.branchContext?.currentBranchId || null,
    isOnMainBranch: session?.user?.branchContext?.currentBranchId === session?.user?.branchContext?.defaultBranchId,
    
    // Utilities
    getNodeById,
    getNodesByParentId,
    getNodeChildren,
    getNodeAncestors,
    getRootNodes,
    
    // Stats
    totalNodes: processedData.totalNodes,
    visibleNodes: processedData.visibleNodes,
    
    // Actions
    invalidateNodes,
    refetchNodes
  };
  
  return (
    <NodeDataContext.Provider value={contextValue}>
      {children}
    </NodeDataContext.Provider>
  );
}

// ============================================================================
// CONSUMER HOOK
// ============================================================================

export function useNodeData(): NodeDataContextValue {
  const context = useContext(NodeDataContext);
  
  if (!context) {
    throw new Error('useNodeData must be used within a NodeDataProvider');
  }
  
  return context;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for getting specific node by ID
 */
export function useNode(nodeId: string | null): NodeData | null {
  const { getNodeById } = useNodeData();
  
  return useMemo(() => {
    if (!nodeId) return null;
    return getNodeById(nodeId) || null;
  }, [nodeId, getNodeById]);
}

/**
 * Hook for getting children of a specific node
 */
export function useNodeChildren(parentId: string | null): NodeData[] {
  const { getNodesByParentId } = useNodeData();
  
  return useMemo(() => {
    return getNodesByParentId(parentId);
  }, [parentId, getNodesByParentId]);
}

/**
 * Hook for getting root nodes only
 */
export function useRootNodes(): NodeData[] {
  const { getRootNodes } = useNodeData();
  
  return useMemo(() => {
    return getRootNodes();
  }, [getRootNodes]);
}