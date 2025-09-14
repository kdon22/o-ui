'use client'

import { useEffect } from 'react'
import { AutoTree, TreeFooter, TreeSearchEnhanced } from '@/components/auto-generated/tree'
import type { TreeNodeData } from '@/components/auto-generated/tree'
import type { TreeStats } from '@/components/auto-generated/tree/tree-footer'
import { useSearch } from '@/hooks/layout'
import { useTreeActions } from '@/components/auto-generated/tree/tree-actions'
import type { BranchInfo } from '@/lib/utils/branch-utils'

export interface TreeNavigationProps {
  userRootNodeId: string
  currentBranch?: BranchInfo
  availableBranches?: BranchInfo[]
  selectedNodeId?: string | null
  onNodeSelect: (nodeId: string) => void
  onBranchSwitch: (branchId: string) => void
  nodesData?: any[] // ✅ NEW: Pass nodes data to avoid duplicate queries
  onNodesDataChange?: (data: any[]) => void // ✅ NEW: Handler to receive nodes data from AutoTree
}

export function TreeNavigation({
  userRootNodeId,
  currentBranch,
  availableBranches,
  selectedNodeId,
  onNodeSelect,
  onBranchSwitch,
  nodesData,
  onNodesDataChange
}: TreeNavigationProps) {
  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    handleSearchClear,
    handleSearchResultSelect
  } = useSearch(nodesData) // ✅ Pass nodes data to search hook

  const treeActions = useTreeActions();

  // Handle node selection from tree
  const handleTreeNodeSelectWithCallback = (node: TreeNodeData) => {
    onNodeSelect(node.id)
  }

  // Handle search result selection
  const handleSearchResultSelectWithCallback = (result: any) => {
    handleSearchResultSelect(result)
    onNodeSelect(result.id)
  }

  // Handle context menu actions - AutoTree handles this internally
  const handleContextMenu = (node: TreeNodeData, action: string) => {

  }

  // Handle node expand/collapse - AutoTree handles this internally
  const handleNodeExpand = (node: TreeNodeData) => {

  }

  const handleNodeCollapse = (node: TreeNodeData) => {

  }

  // Create tree stats from nodes data
  const treeStats: TreeStats = {
    totalNodes: nodesData?.length || 0,
    visibleNodes: nodesData?.length || 0,
    expandedNodes: 0, // This would be calculated by AutoTree
    selectedNodeId: selectedNodeId
  }

  // Handle add node action with default root node
  const handleAddNode = () => {
    const rootNode: TreeNodeData = {
      id: userRootNodeId,
      idShort: userRootNodeId.substring(0, 8),
      name: 'Root Node',
      level: 0,
      path: '',
      sortOrder: 0,
      childCount: 0,
      isActive: true,
      type: 'NODE'
    }
    treeActions.handleAddNode(rootNode)
  }

  return (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-56px)]">
      {/* Search Section */}
      <div className="p-3 border-b border-gray-200">
        <TreeSearchEnhanced 
          onSearch={handleSearch}
          onClear={handleSearchClear}
          onSelectResult={handleSearchResultSelectWithCallback}
          searchResults={searchResults}
          isLoading={isSearching}
          placeholder="Search nodes..."
        />
      </div>
      
      {/* Tree Navigation */}
      <div className="flex-1 overflow-auto">
        <AutoTree 
          rootNodeId={userRootNodeId}
          userRootNodeId={userRootNodeId}
          onNodeSelect={handleTreeNodeSelectWithCallback}
          onNodeExpand={handleNodeExpand}
          onNodeCollapse={handleNodeCollapse}
          onContextMenu={handleContextMenu}
          onNodesDataChange={onNodesDataChange} // ✅ NEW: Pass callback to share data
          className="h-full"
        />
      </div>
      
      {/* Tree Footer */}
      <TreeFooter 
        stats={treeStats}
        currentBranch={currentBranch}
        availableBranches={availableBranches}
        onBranchSwitch={onBranchSwitch}
        onAddNode={handleAddNode}
        onRefresh={treeActions.handleRefreshTree}
        onSettings={() => {}}
      />
    </div>
  )
}