'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useMemo, useState } from 'react'
import { AutoTree } from '@/components/auto-generated/tree/auto-tree'
import { TreeFooter } from '@/components/auto-generated/tree/tree-footer'
import { TreeSearchEnhanced } from '@/components/auto-generated/tree/tree-search-enhanced'
import { MainHeader } from '@/components/header'
import type { TreeNodeData } from '@/components/auto-generated/tree/auto-tree'
import type { SearchResult } from '@/components/auto-generated/tree/tree-search'
import type { TreeStats } from '@/components/auto-generated/tree/tree-footer'
import { extractBranchInfo, type BranchInfo } from '@/lib/utils/branch-utils'
import { useNodeData } from '@/components/providers/node-data-provider'
import { cn } from '@/lib/utils/generalUtils'

export function MainLayout() {
  const { data: session } = useSession()
  
  // ============================================================================
  // DATA FETCHING - Single Source of Truth via NodeDataProvider
  // ============================================================================
  // Get all nodes from centralized provider for search functionality
  const { nodes: allNodes, totalNodes, visibleNodes } = useNodeData();
  
  // ============================================================================
  // STATE
  // ============================================================================
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [treeStats, setTreeStats] = useState<TreeStats>({
    totalNodes: 8,
    visibleNodes: 8,
    expandedNodes: 3,
    selectedNodeId: null
  })
  
  // ============================================================================
  // SEARCH FUNCTIONALITY
  // ============================================================================
  // Convert node data to searchable format
  const searchableNodes = useMemo(() => {
    if (!allNodes || allNodes.length === 0) return []
    
    return allNodes.map((node) => ({
      id: node.id,
      name: node.name,
      path: node.path,
      type: node.type,
      level: node.level,
      description: node.description || '',
      parentId: node.parentId
    }))
  }, [allNodes])
  
  // Search function that filters nodes based on query
  const searchNodes = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return searchableNodes.filter((node: { name: string; description: string; path: string }) => 
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.path.toLowerCase().includes(lowerQuery)
    ).slice(0, 10) // Limit to 10 results
  }, [searchableNodes])
  
  // Update tree stats when data changes
  useMemo(() => {
    if (allNodes.length > 0) {
      setTreeStats(prev => ({
        ...prev,
        totalNodes,
        visibleNodes
      }))
    }
  }, [allNodes.length, totalNodes, visibleNodes])

  // ============================================================================
  // SESSION DATA EXTRACTION
  // ============================================================================
  const branchContext = useMemo(() => {
    const { currentBranch, availableBranches } = extractBranchInfo(session)
    return currentBranch ? { currentBranch, availableBranches } : null
  }, [session])

  const userRootNodeId = session?.user?.rootNodeId || '1'
  const currentTenant = session?.user?.currentTenant

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleNodeSelect = useCallback((node: TreeNodeData) => {
    setSelectedNodeId(node.id)
    setTreeStats(prev => ({
      ...prev,
      selectedNodeId: node.id
    }))
  }, [])

  const handleNodeExpand = useCallback((node: TreeNodeData) => {
    setTreeStats(prev => ({
      ...prev,
      expandedNodes: prev.expandedNodes + 1
    }))
  }, [])

  const handleNodeCollapse = useCallback((node: TreeNodeData) => {
    setTreeStats(prev => ({
      ...prev,
      expandedNodes: Math.max(0, prev.expandedNodes - 1)
    }))
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    
    // Perform real search using searchNodes function
    const results = searchNodes(query)
    setSearchResults(results)
    setIsSearching(false)
    

  }, [searchNodes])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }, [])

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setSelectedNodeId(result.id)
    setTreeStats(prev => ({
      ...prev,
      selectedNodeId: result.id
    }))

    // TODO: Implement navigation to node page (window.location.href = `/nodes/${result.id}`)
  }, [])

  const handleBranchSwitch = useCallback((branchId: string) => {
    // TODO: Implement branch switching via session update or API call

  }, [])

  const handleAddNode = useCallback(() => {
    // TODO: Implement node creation modal or action

  }, [])

  const handleRefreshTree = useCallback(async () => {
    // TODO: Implement tree refresh via ActionClient

    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }, [])

  const handleTreeSettings = useCallback(() => {
    // TODO: Implement tree settings modal

  }, [])

  const handleContextMenu = useCallback((node: TreeNodeData, action: string) => {

    // TODO: Implement context menu actions (add child, delete, etc.)
  }, [])

  const handleHeaderSearch = useCallback((query: string) => {
    // TODO: Implement universal search across all resources

  }, [])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    // TODO: Implement tenant switching via session update or API call

  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="h-screen flex flex-col">
      {/* Main Header */}
      <MainHeader 
        selectedNodeId={selectedNodeId} 
        currentTenant={currentTenant}
        currentBranch={branchContext?.currentBranch}
        onSearch={handleHeaderSearch}
        onTenantSwitch={handleTenantSwitch}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Enhanced Tree Navigation */}
        <div className="w-80 border-r border-border bg-muted/10 flex flex-col">
          {/* Search Section */}
          <div className="p-3 border-b border-border">
            <TreeSearchEnhanced 
              onSearch={handleSearch}
              onClear={handleSearchClear}
              onSelectResult={handleSearchResultSelect}
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
              onNodeSelect={handleNodeSelect}
              onNodeExpand={handleNodeExpand}
              onNodeCollapse={handleNodeCollapse}
              onContextMenu={handleContextMenu}
              className="h-full"
            />
          </div>
          
          {/* Tree Footer */}
          <TreeFooter 
            stats={treeStats}
            currentBranch={branchContext?.currentBranch}
            availableBranches={branchContext?.availableBranches}
            onBranchSwitch={handleBranchSwitch}
            onAddNode={handleAddNode}
            onRefresh={handleRefreshTree}
            onSettings={handleTreeSettings}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedNodeId ? (
            <NodeContent 
              nodeId={selectedNodeId} 
              currentBranch={branchContext?.currentBranch}
            />
          ) : (
            <EmptyState currentTenant={currentTenant} />
          )}
        </div>
      </div>
      
      {/* Debug tools for development - Removed IndexedDBInspector */}
    </div>
  )
}



function NodeContent({ 
  nodeId, 
  currentBranch 
}: { 
  nodeId: string
  currentBranch?: BranchInfo
}) {
  return (
    <div className="flex-1 p-6">
      <div className="h-full bg-background rounded-lg border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Node: {nodeId}</h1>
            {currentBranch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Branch:</span>
                <span className="font-medium">{currentBranch.name}</span>
              </div>
            )}
          </div>
          
          <p className="text-muted-foreground mb-4">
            Lightning-fast tab content powered by IndexedDB and ActionClient:
          </p>
          
          <div className="flex gap-2 mb-6">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-sm text-sm">
              Processes
            </div>
            <div className="px-3 py-1 bg-muted text-muted-foreground rounded-sm text-sm">
              Offices
            </div>
            <div className="px-3 py-1 bg-muted text-muted-foreground rounded-sm text-sm">
              Workflows
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="mb-2">📊 Performance: &lt;50ms IndexedDB reads</div>
            <div className="mb-2">🌿 Branching: Copy-on-Write operations</div>
            <div className="mb-2">📱 Mobile: Touch-optimized interface</div>
            <div className="mb-2">🔍 Search: Real-time filtering with ⌘K</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ currentTenant }: { currentTenant?: any }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Welcome to O-UI</h3>
        <p className="text-muted-foreground mb-4">
          Select a node from the navigation tree to view its content
        </p>
        {currentTenant && (
          <div className="text-sm text-muted-foreground">
            <span>Workspace: </span>
            <span className="font-medium">{currentTenant.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}