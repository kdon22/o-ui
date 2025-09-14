/**
 * Tree Navigation Component
 * 
 * Main component that provides the complete tree navigation experience.
 * Always rendered in the left sidebar with three sections:
 * - Top: Search for instant navigation to nested nodes
 * - Middle: Schema-driven tree rendering with expand/collapse
 * - Bottom: Footer with branching access and tree actions
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { TreeSearch } from './tree-search';
import { TreeRenderer } from './tree-renderer';
import { TreeFooter } from './tree-footer';
import { TreeMultiSelect } from './tree-multi-select';
import type {
  TreeNavigationProps,
  TreeNode,
  TreeStructure,
  TreeState,
  TreeConfig,
  TreeDisplayOptions,
  TreeEventHandlers,
  TreeSearchResult,
  TreeAction,
  TreeLoadingState
} from './tree-types';
import { TreeMode } from './tree-types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getNodePath(node: TreeNode, flatMap: Map<string, TreeNode>): TreeNode[] {
  const path: TreeNode[] = [];
  let current = node;
  
  while (current) {
    path.unshift(current);
    if (current.parentId) {
      current = flatMap.get(current.parentId)!;
    } else {
      break;
    }
  }
  
  return path;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: TreeConfig = {
  schema: NODE_SCHEMA,
  search: {
    enabled: true,
    placeholder: 'Search nodes...',
    fields: ['name', 'description'],
    fuzzySearch: true,
    minQueryLength: 1,
    maxResults: 50,
    highlightMatches: true,
    autoExpand: true
  },
  multiSelect: {
    enabled: true,
    max: 100,
    showCount: true,
    showActions: true
  },
  virtualization: {
    enabled: true,
    itemHeight: 32,
    overscan: 10
  },
  performance: {
    lazyLoad: true,
    chunkSize: 100,
    cacheSize: 1000
  },
  mobile: {
    swipeActions: true,
    touchFeedback: true,
    collapsible: true
  }
};

const DEFAULT_DISPLAY_OPTIONS: TreeDisplayOptions = {
  showIcons: true,
  showBadges: true,
  showTooltips: true,
  showLines: true,
  showRoot: true,
  compactMode: false,
  indentSize: 20,
  lineHeight: 32
};

// ============================================================================
// TREE NAVIGATION COMPONENT
// ============================================================================

export function TreeNavigation({
  className,
  config: configOverride,
  displayOptions: displayOverride,
  eventHandlers: eventHandlersOverride,
  initialExpandedNodes = [],
  initialSelectedNodes = [],
  mode: initialMode = TreeMode.NAVIGATION,
  multiSelectEnabled = true,
  searchEnabled = true,
  footerEnabled = true,
  height = '100vh',
  width = '300px'
}: TreeNavigationProps) {
  
  // ============================================================================
  // CONFIGURATION AND OPTIONS
  // ============================================================================
  
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...configOverride
  }), [configOverride]);

  const displayOptions = useMemo(() => ({
    ...DEFAULT_DISPLAY_OPTIONS,
    ...displayOverride
  }), [displayOverride]);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [treeState, setTreeState] = useState<TreeState>({
    expandedNodes: new Set(initialExpandedNodes),
    selectedNodes: new Set(initialSelectedNodes),
    loadingNodes: new Set(),
    searchQuery: '',
    searchResults: [],
    focusedNodeId: null,
    mode: initialMode,
    multiSelectEnabled
  });

  const [loadingState, setLoadingState] = useState<TreeLoadingState>({
    isLoading: true,
    loadingNodes: new Set(),
    error: null,
    lastUpdated: null
  });

  const [treeStructure, setTreeStructure] = useState<TreeStructure>({
    nodes: [],
    rootNodes: [],
    flatMap: new Map(),
    hierarchy: new Map(),
    maxLevel: 0,
    totalCount: 0
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchTreeData = useCallback(async () => {
    try {
      setLoadingState((prev: TreeLoadingState) => ({ ...prev, isLoading: true, error: null }));
      
      // TODO: Replace with actual data fetching using the new action client
      // This will use the IndexedDB-first strategy for <50ms performance
      // const actionClient = new ActionClient();
      // const nodes = await actionClient.query('nodes', {
      //   include: ['children', 'parent'],
      //   orderBy: { sortOrder: 'asc' }
      // });
      
      // Mock data for now - will be replaced with real data
      const mockNodes: TreeNode[] = [
        {
          id: '1',
          name: 'Root Node',
          parentId: null,
          level: 0,
          path: '/root',
          sortOrder: 0,
          childCount: 2,
          isActive: true,
          type: 'NODE',
          icon: 'folder',
          color: 'blue',
          description: 'Main root node',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        },
        {
          id: '2',
          name: 'Child Node 1',
          parentId: '1',
          level: 1,
          path: '/root/child1',
          sortOrder: 0,
          childCount: 0,
          isActive: true,
          type: 'NODE',
          icon: 'file',
          color: 'green',
          description: 'First child node',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        },
        {
          id: '3',
          name: 'Child Node 2',
          parentId: '1',
          level: 1,
          path: '/root/child2',
          sortOrder: 1,
          childCount: 0,
          isActive: true,
          type: 'NODE',
          icon: 'file',
          color: 'green',
          description: 'Second child node',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        }
      ];

      // Build tree structure
      const flatMap = new Map<string, TreeNode>();
      const hierarchy = new Map<string, TreeNode[]>();
      const rootNodes: TreeNode[] = [];
      let maxLevel = 0;

      // Build flat map and hierarchy
      mockNodes.forEach(node => {
        flatMap.set(node.id, node);
        maxLevel = Math.max(maxLevel, node.level);
        
        if (node.parentId) {
          if (!hierarchy.has(node.parentId)) {
            hierarchy.set(node.parentId, []);
          }
          hierarchy.get(node.parentId)?.push(node);
        } else {
          rootNodes.push(node);
        }
      });

      // Populate children
      mockNodes.forEach(node => {
        const children = hierarchy.get(node.id) || [];
        node.children = children.sort((a, b) => a.sortOrder - b.sortOrder);
      });

      setTreeStructure({
        nodes: mockNodes,
        rootNodes: rootNodes.sort((a, b) => a.sortOrder - b.sortOrder),
        flatMap,
        hierarchy,
        maxLevel,
        totalCount: mockNodes.length
      });

      setLoadingState((prev: TreeLoadingState) => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date()
      }));

    } catch (error) {
      setLoadingState((prev: TreeLoadingState) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load tree data'
      }));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNodeClick = useCallback((node: TreeNode, event: MouseEvent) => {
    if (treeState.mode === TreeMode.MULTI_SELECT) {
      // Handle multi-select
      const newSelectedNodes = new Set(treeState.selectedNodes);
      if (newSelectedNodes.has(node.id)) {
        newSelectedNodes.delete(node.id);
      } else {
        newSelectedNodes.add(node.id);
      }
      setTreeState((prev: TreeState) => ({ ...prev, selectedNodes: newSelectedNodes }));
    } else {
      // Handle navigation
      setTreeState((prev: TreeState) => ({ ...prev, focusedNodeId: node.id }));
    }
    
    eventHandlersOverride?.onNodeClick?.(node, event);
  }, [treeState.mode, treeState.selectedNodes, eventHandlersOverride]);

  const handleNodeExpand = useCallback((node: TreeNode) => {
    const newExpandedNodes = new Set(treeState.expandedNodes);
    newExpandedNodes.add(node.id);
    setTreeState(prev => ({ ...prev, expandedNodes: newExpandedNodes }));
    eventHandlersOverride?.onNodeExpand?.(node);
  }, [treeState.expandedNodes, eventHandlersOverride]);

  const handleNodeCollapse = useCallback((node: TreeNode) => {
    const newExpandedNodes = new Set(treeState.expandedNodes);
    newExpandedNodes.delete(node.id);
    setTreeState(prev => ({ ...prev, expandedNodes: newExpandedNodes }));
    eventHandlersOverride?.onNodeCollapse?.(node);
  }, [treeState.expandedNodes, eventHandlersOverride]);

  const handleSearch = useCallback((query: string) => {
    setTreeState(prev => ({ ...prev, searchQuery: query }));
    
    if (query.trim()) {
      // Perform search
      const results = treeStructure.nodes.filter(node => {
        return config.search.fields.some(field => {
          const value = node[field as keyof TreeNode];
          return typeof value === 'string' && 
                 value.toLowerCase().includes(query.toLowerCase());
        });
      });

      const searchResults: TreeSearchResult[] = results.map(node => ({
        node,
        matches: [],
        score: 1,
        path: getNodePath(node, treeStructure.flatMap)
      }));

      setTreeState(prev => ({ 
        ...prev, 
        searchResults,
        mode: TreeMode.SEARCH 
      }));
    } else {
      setTreeState(prev => ({ 
        ...prev, 
        searchResults: [],
        mode: initialMode 
      }));
    }
    
    eventHandlersOverride?.onSearch?.(query);
  }, [config.search.fields, treeStructure, initialMode, eventHandlersOverride]);

  const handleModeChange = useCallback((newMode: TreeMode) => {
    setTreeState(prev => ({ ...prev, mode: newMode }));
    eventHandlersOverride?.onModeChange?.(newMode);
  }, [eventHandlersOverride]);

  const handleSearchResultClick = useCallback((result: TreeSearchResult) => {
    // Expand path to result
    const pathIds = result.path.map(node => node.id);
    const newExpandedNodes = new Set(treeState.expandedNodes);
    pathIds.forEach(id => newExpandedNodes.add(id));
    
    setTreeState(prev => ({
      ...prev,
      expandedNodes: newExpandedNodes,
      focusedNodeId: result.node.id,
      mode: TreeMode.NAVIGATION,
      searchQuery: '',
      searchResults: []
    }));
  }, [treeState.expandedNodes]);

  const eventHandlers: TreeEventHandlers = useMemo(() => ({
    onNodeClick: handleNodeClick,
    onNodeExpand: handleNodeExpand,
    onNodeCollapse: handleNodeCollapse,
    onSearch: handleSearch,
    onModeChange: handleModeChange,
    ...eventHandlersOverride
  }), [
    handleNodeClick,
    handleNodeExpand, 
    handleNodeCollapse,
    handleSearch,
    handleModeChange,
    eventHandlersOverride
  ]);

  // ============================================================================
  // TREE ACTIONS
  // ============================================================================

  const treeActions: TreeAction[] = useMemo(() => [
    {
      id: 'add-root',
      label: 'Add Root Node',
      icon: 'plus',
      handler: 'addRoot',
      color: 'primary'
    },
    {
      id: 'expand-all',
      label: 'Expand All',
      icon: 'expand',
      handler: 'expandAll'
    },
    {
      id: 'collapse-all',
      label: 'Collapse All',
      icon: 'collapse',
      handler: 'collapseAll'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: 'refresh',
      handler: 'refresh'
    }
  ], []);

  const handleActionClick = useCallback((action: TreeAction) => {
    switch (action.handler) {
      case 'addRoot':
        eventHandlers.onNodeCreate?.(null, { name: 'New Root Node' });
        break;
      case 'expandAll':
        const allNodeIds = new Set(treeStructure.nodes.map(n => n.id));
        setTreeState(prev => ({ ...prev, expandedNodes: allNodeIds }));
        break;
      case 'collapseAll':
        setTreeState(prev => ({ ...prev, expandedNodes: new Set() }));
        break;
      case 'refresh':
        fetchTreeData();
        break;
    }
  }, [eventHandlers, treeStructure.nodes, fetchTreeData]);

  // ============================================================================
  // MULTI-SELECT HANDLING
  // ============================================================================

  const selectedNodes = useMemo(() => {
    return Array.from(treeState.selectedNodes)
      .map(id => treeStructure.flatMap.get(id))
      .filter(Boolean) as TreeNode[];
  }, [treeState.selectedNodes, treeStructure.flatMap]);

  const handleSelectionChange = useCallback((nodes: TreeNode[]) => {
    const newSelectedNodes = new Set(nodes.map(n => n.id));
    setTreeState(prev => ({ ...prev, selectedNodes: newSelectedNodes }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setTreeState(prev => ({ ...prev, selectedNodes: new Set() }));
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      className={cn(
        'flex flex-col bg-background border-r border-border',
        'h-full min-h-0', // Ensure proper flex behavior
        className
      )}
      style={{ height, width }}
    >
      {/* Top Section - Search */}
      {searchEnabled && (
        <div className="flex-shrink-0 p-2 border-b border-border">
          <TreeSearch
            config={config.search}
            query={treeState.searchQuery}
            results={treeState.searchResults}
            loading={loadingState.isLoading}
            onSearch={handleSearch}
            onResultClick={handleSearchResultClick}
            onClear={() => handleSearch('')}
          />
        </div>
      )}

      {/* Middle Section - Tree Renderer */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {treeState.mode === TreeMode.MULTI_SELECT && selectedNodes.length > 0 && (
          <div className="flex-shrink-0 p-2 border-b border-border bg-muted/50">
            <TreeMultiSelect
              selectedNodes={selectedNodes}
              maxSelections={config.multiSelect.max}
              showCount={config.multiSelect.showCount}
              showActions={config.multiSelect.showActions}
              actions={treeActions}
              onSelectionChange={handleSelectionChange}
              onActionClick={handleActionClick}
              onClear={handleClearSelection}
            />
          </div>
        )}

        <TreeRenderer
          nodes={treeStructure.nodes}
          structure={treeStructure}
          state={treeState}
          config={config}
          displayOptions={displayOptions}
          eventHandlers={eventHandlers}
          className="h-full"
        />
      </div>

      {/* Bottom Section - Footer */}
      {footerEnabled && (
        <div className="flex-shrink-0 border-t border-border">
          <TreeFooter
            selectedCount={treeState.selectedNodes.size}
            totalCount={treeStructure.totalCount}
            mode={treeState.mode}
            actions={treeActions}
            onModeChange={handleModeChange}
            onActionClick={handleActionClick}
          />
        </div>
      )}
    </div>
  );
} 