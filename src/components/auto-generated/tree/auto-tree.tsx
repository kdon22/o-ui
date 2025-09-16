/**
 * Auto-Tree Component - Schema-driven hierarchical navigation
 * 
 * Features:
 * - <50ms performance with IndexedDB-first ActionClient
 * - Branch-aware operations with Copy-on-Write
 * - Context menu actions (Add Node/Process/Office, Delete)
 * - Icon system (red house root, yellow folders, page icons)
 * - Dotted parent-child connection lines
 * - Mobile-first responsive design
 * - URL routing integration with Next.js
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils/generalUtils'
import { useNodeData } from '@/components/providers/node-data-provider'
import { useNodeIdResolver } from '@/lib/utils/entity-id-resolver'
import { useNavigationContext } from '@/lib/context/navigation-context'
import { TreeNode } from './tree-node'
import { TreeContextMenu } from './tree-context-menu'
import { useTreeActions, getActionHandler } from './tree-actions'
import { AutoModal } from '@/components/auto-generated/modal/auto-modal'
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema'
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema'
import './auto-tree.css'

// ============================================================================
// TYPES
// ============================================================================

export interface TreeNodeData {
  id: string;
  idShort: string;
  name: string;
  parentId?: string | null;
  level: number;
  path: string;
  sortOrder: number;
  childCount: number;
  isActive: boolean;
  type: 'NODE' | 'CUSTOMER' | string;
  // Tree-specific states
  isExpanded?: boolean;
  isLoading?: boolean;
  children?: TreeNodeData[];
  description?: string;
  icon?: React.ReactNode;
  hasChildren?: boolean;
  isRootNode?: boolean;
  isLeafNode?: boolean;
  metadata?: Record<string, any>;
}

export interface AutoTreeProps {
  rootNodeId: string
  userRootNodeId?: string
  onNodeSelect?: (node: TreeNodeData) => void
  onNodeExpand?: (node: TreeNodeData) => void
  onNodeCollapse?: (node: TreeNodeData) => void
  onContextMenu?: (node: TreeNodeData, action: string) => void
  onTreeStatsChange?: (stats: { totalNodes: number, visibleNodes: number }) => void
  onNodesDataChange?: (data: any[]) => void // ✅ NEW: Pass nodes data to parent
  className?: string
  maxHeight?: number;
}

export interface ContextMenuData {
  node: TreeNodeData;
  position: { x: number; y: number };
  visible: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AutoTree({
  rootNodeId,
  userRootNodeId,
  onNodeSelect,
  onNodeExpand,
  onNodeCollapse,
  onContextMenu,
  onTreeStatsChange,
  onNodesDataChange,
  className,
  maxHeight = 600,
}: AutoTreeProps) {
  // ============================================================================
  // STATE
  // ============================================================================
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [contextMenuNode, setContextMenuNode] = useState<TreeNodeData | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // ============================================================================
  // BRANCH AWARENESS & QUERY CLIENT
  // ============================================================================
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const currentBranchId = session?.user?.branchContext?.currentBranchId
  const [lastBranchId, setLastBranchId] = useState<string | undefined>(currentBranchId)

  // ✅ CRITICAL: Clear tree state when branch changes to prevent stale references
  useEffect(() => {
    if (currentBranchId && currentBranchId !== lastBranchId) {
      console.log('🔄 [AutoTree] Branch changed - clearing tree state:', {
        oldBranchId: lastBranchId,
        newBranchId: currentBranchId,
        timestamp: new Date().toISOString()
      })
      
      // Clear all tree state that might contain old branch node references
      setExpandedNodes(new Set())
      setSelectedNodeId(null)
      setHoveredNodeId(null)
      setContextMenuNode(null)
      setContextMenuPosition(null)
      
      setLastBranchId(currentBranchId)
    }
  }, [currentBranchId, lastBranchId])

  // ============================================================================
  // ROUTING INTEGRATION
  // ============================================================================
  const router = useRouter();
  const pathname = usePathname();
  
  // Ref to track programmatic navigation to prevent circular updates
  const isProgrammaticNavigation = useRef(false);
  
  // Tree actions hook
  const treeActions = useTreeActions();

  // ============================================================================
  // NAVIGATION CONTEXT INTEGRATION
  // ============================================================================
  const { navigateFromProcess, navigateFromNode } = useNavigationContext();

  // ============================================================================
  // DATA FETCHING - Single Source of Truth via NodeDataProvider
  // ============================================================================
  // Get all nodes from centralized provider - eliminates competing queries
  const {
    nodes,
    isLoading: nodesLoading,
    isInitialLoading,
    error: nodeError,
    currentBranchId: contextBranchId,
    totalNodes,
    visibleNodes
  } = useNodeData();

  // ✅ OPTIMISTIC LOADING: Enhanced loading state management
  const hasData = nodes.length > 0;
  const isActuallyLoading = nodesLoading && !hasData;
  const showLoadingState = isActuallyLoading && !hasData;

  // ✅ ERROR HANDLING: Standardized error state
  const error = nodeError;
  
  // ✅ DEBUG: Track data reception from NodeDataProvider
  useEffect(() => {
    console.log('🔍 [AutoTree] Received data from NodeDataProvider:', {
      hasData,
      dataCount: nodes.length,
      error,
      branchId: contextBranchId,
      currentBranchId,
      isLoading: nodesLoading,
      isInitialLoading,
      timestamp: new Date().toISOString()
    });
  }, [nodes.length, error, contextBranchId, nodesLoading, isInitialLoading]);

  // ============================================================================
  // TREE STATS CALCULATION
  // ============================================================================
  useEffect(() => {
    if (hasData && onTreeStatsChange) {
      onTreeStatsChange({ totalNodes, visibleNodes });
    }
  }, [hasData, totalNodes, visibleNodes, onTreeStatsChange]);

  // ============================================================================
  // DATA PROCESSING - Convert NodeData to TreeNodeData format
  // ============================================================================
  // Transform nodes from NodeDataProvider into tree-specific format
  const processedTreeData = useMemo(() => {
    // ✅ DEBUG: Log the data from NodeDataProvider
    console.log('🌲 [AUTO-TREE DEBUG] Raw nodesData:', {
      hasData,
      isArray: Array.isArray(nodes),
      length: nodes.length,
      data: nodes
    });
    
    // ✅ EARLY RETURN: Handle empty data
    if (!hasData || !Array.isArray(nodes) || nodes.length === 0) {
      return [];
    }
    
    const startTime = performance.now();
    
    // Convert NodeData to TreeNodeData format (adding tree-specific properties)
    const treeNodes: TreeNodeData[] = nodes.map((node) => ({
      id: node.id,
      idShort: node.idShort,
      name: node.name,
      description: node.description,
      parentId: node.parentId,
      level: node.level,
      path: node.path,
      sortOrder: node.sortOrder,
      childCount: node.childCount,
      isActive: node.isActive,
      type: node.type,
      // Tree-specific properties
      isExpanded: false,
      isLoading: false,
      hasChildren: node.hasChildren,
      isRootNode: node.isRootNode,
      isLeafNode: node.isLeafNode
    }));
    
    // ✅ DEBUG: Log the processed tree data
    console.log('🌲 [AUTO-TREE DEBUG] Processed tree nodes:', {
      totalNodes: treeNodes.length,
      rootNodes: treeNodes.filter(n => !n.parentId),
      childNodes: treeNodes.filter(n => n.parentId),
      nodes: treeNodes.map(n => ({
        id: n.id,
        name: n.name,
        parentId: n.parentId,
        level: n.level,
        childCount: n.childCount
      }))
    });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // ✅ PERFORMANCE DEBUG: Only log in development
    if (process.env.NODE_ENV === 'development' && loadTime > 5) {
      console.log('🌲 [AUTO-TREE PERF] Tree data processing took:', loadTime, 'ms');
    }
    
    return treeNodes;
  }, [nodes, hasData]);

  // ============================================================================
  // NODES DATA SHARING
  // ============================================================================
  // Pass processed tree data to parent component to eliminate duplicate queries
  useEffect(() => {
    if (processedTreeData.length > 0 && onNodesDataChange) {
      onNodesDataChange(processedTreeData);
    }
  }, [processedTreeData, onNodesDataChange]);

  // ============================================================================
  // AUTO-EXPAND ROOT NODES
  // ============================================================================
  // Auto-expand root nodes for better UX - SIMPLIFIED to prevent hook order issues
  useEffect(() => {
    if (processedTreeData.length > 0 && expandedNodes.size === 0) {
      const rootNodes = processedTreeData.filter(node => !node.parentId);
      if (rootNodes.length > 0) {
        const rootIds = rootNodes.map(node => node.id);
        setExpandedNodes(new Set(rootIds));
      }
    }
  }, [processedTreeData.length]); // SIMPLIFIED dependency to prevent circular issues

  // ============================================================================
  // TREE STRUCTURE - SIMPLIFIED MEMOIZATION
  // ============================================================================
  const treeStructure = useMemo(() => {
    if (!processedTreeData || processedTreeData.length === 0) {
      return { nodes: [], nodeMap: new Map<string, TreeNodeData>() };
    }

    const nodeMap = new Map<string, TreeNodeData>();
    
    // Build node map first
    processedTreeData.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build hierarchy
    const rootNodes: TreeNodeData[] = [];
    
    nodeMap.forEach(node => {
      if (!node.parentId) {
        rootNodes.push(node);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        }
      }
    });

    // Sort nodes
    const sortNodes = (nodes: TreeNodeData[]) => {
      nodes.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
      
      nodes.forEach(node => {
        if (node.children) {
          sortNodes(node.children);
        }
      });
    };
    
    sortNodes(rootNodes);
    
    return { nodes: rootNodes, nodeMap };
  }, [processedTreeData]); // SIMPLIFIED dependency

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleNodeClick = useCallback((node: TreeNodeData) => {
    // Prevent unnecessary navigation and state updates
    if (selectedNodeId === node.id) {
      return;
    }
    
    // Mark as programmatic navigation to prevent circular updates
    isProgrammaticNavigation.current = true;
    
    // Update NavigationContext with the selected node for downstream forms/pages
    try {
      navigateFromNode(node.id, node.name);
    } catch (err) {
      // Keep navigation resilient even if context is not available for some reason
      console.warn('[AutoTree] navigateFromNode failed (non-fatal):', err);
    }

    setSelectedNodeId(node.id);
    
    // Navigate to node URL using idShort for clean URLs
    const targetUrl = `/nodes/${node.idShort}`;
    router.push(targetUrl);
    
    // Reset flag after navigation
    setTimeout(() => {
      isProgrammaticNavigation.current = false;
    }, 100);
    
    // Call parent callback if provided
    onNodeSelect?.(node);
  }, [onNodeSelect, router, selectedNodeId, navigateFromNode]);

  const handleNodeExpand = useCallback((node: TreeNodeData) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
        onNodeCollapse?.(node);
      } else {
        newSet.add(node.id);
        onNodeExpand?.(node);
      }
      return newSet;
    });
  }, [onNodeExpand, onNodeCollapse]);

  const handleContextMenu = useCallback((node: TreeNodeData, event: React.MouseEvent) => {
    console.log('🔥 [AutoTree] handleContextMenu called', {
      node,
      nodeId: node.id,
      nodeName: node.name,
      hasId: !!node.id,
      timestamp: new Date().toISOString()
    });
    
    event.preventDefault();
    setContextMenuNode(node);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleContextMenuAction = useCallback((action: string) => {
    console.log('🔥 [AutoTree] handleContextMenuAction called', {
      action,
      contextMenuNode,
      hasContextMenuNode: !!contextMenuNode,
      contextMenuNodeId: contextMenuNode?.id,
      contextMenuNodeName: contextMenuNode?.name,
      timestamp: new Date().toISOString()
    });
    
    if (contextMenuNode) {
      // Use tree actions handler
      const handler = getActionHandler(action, contextMenuNode, treeActions);
      console.log('🔥 [AutoTree] Got handler from getActionHandler', {
        action,
        hasHandler: !!handler,
        timestamp: new Date().toISOString()
      });
      
      if (handler) {
        console.log('🔥 [AutoTree] Calling handler', {
          action,
          timestamp: new Date().toISOString()
        });
        handler();
      }
      
      // Also call the parent callback if provided
      onContextMenu?.(contextMenuNode, action);
      setContextMenuNode(null);
      setContextMenuPosition(null);
    }
  }, [contextMenuNode, onContextMenu, treeActions]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenuNode(null);
    setContextMenuPosition(null);
  }, []);

  // ============================================================================
  // URL SYNC EFFECTS - SIMPLIFIED TO PREVENT HOOK ORDER ISSUES
  // ============================================================================
  
  // Extract node idShort from URL path - STABLE MEMOIZATION
  const nodeIdShortFromUrl = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (pathSegments.length >= 2 && pathSegments[0] === 'nodes') {
      const nodeIdShort = pathSegments[1];
      if (/^[a-zA-Z0-9]+$/.test(nodeIdShort)) {
        return nodeIdShort;
      }
    }
    return null;
  }, [pathname]);

  // Use existing entity resolver - STABLE HOOK CALL
  const { fullId: resolvedNodeId, isResolving, error: resolveError } = useNodeIdResolver(nodeIdShortFromUrl);

  // Sync URL with resolved node ID - SIMPLIFIED EFFECT
  useEffect(() => {
    if (isProgrammaticNavigation.current || isResolving) {
      return;
    }
    
    if (resolvedNodeId && resolvedNodeId !== selectedNodeId) {
      setSelectedNodeId(resolvedNodeId);
    } else if (resolveError) {
      console.warn('🔗 Node resolution failed:', nodeIdShortFromUrl, resolveError.message);
    }
  }, [resolvedNodeId, selectedNodeId, isResolving, resolveError, nodeIdShortFromUrl]);

  // Auto-expand path to selected node - STABLE EFFECT  
  useEffect(() => {
    if (!selectedNodeId || !treeStructure.nodeMap.has(selectedNodeId) || isProgrammaticNavigation.current) {
      return;
    }

    const expandPath = (nodeId: string, visited = new Set<string>()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = treeStructure.nodeMap.get(nodeId);
      if (node?.parentId) {
        setExpandedNodes(prev => {
          if (prev.has(node.parentId!)) {
            return prev;
          }
          return new Set([...prev, node.parentId!]);
        });
        expandPath(node.parentId, visited);
      }
    };
    
    expandPath(selectedNodeId);
  }, [selectedNodeId, treeStructure.nodeMap]);

  // ============================================================================
  // RENDERING - SIMPLIFIED TO PREVENT HOOK ORDER ISSUES
  // ============================================================================
  const renderNode = useCallback((node: TreeNodeData, level: number = 0) => {
    const isRoot = node.id === userRootNodeId;
    const hasChildren = (node.children?.length || 0) > 0;
    const isSelected = selectedNodeId === node.id;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="tree-node-container">
        <TreeNode
          node={node}
          level={level}
          isRoot={isRoot}
          hasChildren={hasChildren}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onClick={handleNodeClick}
          onExpand={handleNodeExpand}
          onContextMenu={handleContextMenu}
        />
        
        {/* Render children if expanded */}
        {isExpanded && node.children && (
          <div className="tree-children">
            {node.children.map(child => (
              <React.Fragment key={child.id}>
                {renderNode(child, level + 1)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }, [
    selectedNodeId,
    expandedNodes,
    userRootNodeId,
    handleNodeClick,
    handleNodeExpand,
    handleContextMenu
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (showLoadingState) {
    return (
      <div className={cn("auto-tree", className)}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading tree...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("auto-tree", className)}>
        <div className="flex items-center justify-center p-4 text-red-600">
          <span className="text-sm">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("auto-tree", className)}>
      <div 
        className="tree-container"
        style={{ maxHeight }}
      >
        {treeStructure.nodes.length > 0 ? (
          <div className="tree-nodes">
            {treeStructure.nodes.map(node => (
              <React.Fragment key={node.id}>
                {renderNode(node)}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-gray-500">
            <span className="text-sm">No nodes found</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenuNode && contextMenuPosition && ( // Changed from 'contextMenu' to 'contextMenuNode' and 'contextMenuPosition'
        <TreeContextMenu
          node={contextMenuNode}
          position={contextMenuPosition}
          visible={!!contextMenuNode} // Simplified visibility check
          onAction={handleContextMenuAction}
          onClose={handleContextMenuClose}
          showInheritedSettings={treeActions.showInheritedSettings}
          showIgnoredSettings={treeActions.showIgnoredSettings}
        />
      )}
      
      {/* Add Node Modal */}
      <AutoModal
        isOpen={treeActions.isAddNodeModalOpen}
        onClose={treeActions.closeAddNodeModal}
        config={{
          resource: 'node',
          action: 'create',
          width: 'lg'
        }}
        schema={NODE_SCHEMA}
        navigationContext={{
          parentId: treeActions.selectedParentNode?.id,
          nodeId: treeActions.selectedParentNode?.id,
          selectedId: treeActions.selectedParentNode?.id
        }}
        onSuccess={async (data) => {
          console.log('🔥 [AutoTree] Node created via AutoModal', {
            data,
            parentNodeId: treeActions.selectedParentNode?.id,
            timestamp: new Date().toISOString()
          });
          
          // Node created - no inheritance cache invalidation needed for nodes
          treeActions.closeAddNodeModal();
        }}
        onError={(error) => {
          console.error('❌ Node creation error:', error);
        }}
      />

      {/* Add Process Modal */}
      <AutoModal
        isOpen={treeActions.isAddProcessModalOpen}
        onClose={treeActions.closeAddProcessModal}
        config={{
          resource: 'process',
          action: 'create',
          width: 'lg'
        }}
        schema={PROCESS_SCHEMA}
        navigationContext={{
          parentId: treeActions.selectedParentNode?.id,
          nodeId: treeActions.selectedParentNode?.id,
          selectedId: treeActions.selectedParentNode?.id
        }}
        onSuccess={async (data) => {
          console.log('🔥 [AutoTree] Process created via AutoModal', {
            data,
            parentNodeId: treeActions.selectedParentNode?.id,
            timestamp: new Date().toISOString()
          });
          
          // Invalidate inheritance cache for the parent node  
          if (treeActions.selectedParentNode?.id && data?.data?.id) {
            try {
              // Note: TanStack Query + action-system now handles inheritance cache automatically
              // Just invalidate the React Query cache for immediate UI updates
              
              console.log('🔥 [AutoTree] Inheritance cache invalidated', {
                processId: data.data.id,
                nodeId: treeActions.selectedParentNode.id,
                timestamp: new Date().toISOString()
              });
              
              // CRITICAL: Also invalidate React Query cache for inheritance data AND process data
              // This is what actually triggers the UI to update
              
              // Invalidate inheritance queries for this node
              await queryClient.invalidateQueries({
                predicate: (query) => {
                  const [queryType, queryNodeId] = query.queryKey;
                  return queryType === 'nodeInheritance' && queryNodeId === treeActions.selectedParentNode?.id;
                }
              });
              
              // Invalidate process queries for filter tabs (action-api queries)
              console.log('🔥 [AutoTree] About to invalidate process queries...');
              
              // First, let's see what queries exist in the cache
              const allQueries = queryClient.getQueryCache().getAll();
              console.log('🔥 [AutoTree] All cached queries:', {
                totalQueries: allQueries.length,
                queryKeys: allQueries.map(q => q.queryKey),
                processQueries: allQueries.filter(q => 
                  q.queryKey.some(key => typeof key === 'string' && key.includes('process'))
                ).map(q => q.queryKey)
              });
              
              await queryClient.invalidateQueries({
                predicate: (query) => {
                  const queryKey = query.queryKey;
                  const isProcessQuery = (
                    queryKey[0] === 'action-api' && 
                    queryKey[2] === 'process.list'
                  );
                  
                  if (isProcessQuery) {
                    console.log('🔥 [AutoTree] Found process query to invalidate:', queryKey);
                  }
                  
                  return isProcessQuery;
                }
              });
              
              console.log('🔥 [AutoTree] Process query invalidation complete');
              
              // Force a small delay to allow queries to refetch, then check cache again
              setTimeout(() => {
                const queriesAfter = queryClient.getQueryCache().getAll();
                console.log('🔥 [AutoTree] Queries after invalidation (500ms later):', {
                  totalQueries: queriesAfter.length,
                  processQueries: queriesAfter.filter(q => 
                    q.queryKey.some(key => typeof key === 'string' && key.includes('process'))
                  ).map(q => ({
                    queryKey: q.queryKey,
                    state: q.state.status,
                    dataUpdatedAt: q.state.dataUpdatedAt,
                    hasData: !!q.state.data
                  }))
                });
              }, 500);
              
              console.log('🔥 [AutoTree] React Query cache invalidated', {
                nodeId: treeActions.selectedParentNode.id,
                branchId: currentBranchId,
                tenantId: session?.user?.tenantId,
                invalidationMethod: 'predicate-based',
                timestamp: new Date().toISOString()
              });
              
            } catch (error) {
              console.error('🔥 [AutoTree] Failed to invalidate inheritance cache:', error);
            }
          }
          
          // Process created
          treeActions.closeAddProcessModal();
        }}
        onError={(error) => {
          console.error('❌ Process creation error:', error);
        }}
      />
    </div>
  );
};