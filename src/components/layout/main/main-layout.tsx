'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { MainHeader } from '@/components/header'
import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
import { TreeNavigation } from './tree-navigation'
import { NodeContent } from './node-content'
import { EmptyState } from './empty-state'
import { TablesPage } from '../tables'
import MarketplacePage from '@/app/(main)/marketplace/page'

export interface MainLayoutProps {
  initialSelectedNodeId?: string | null
}

export default function MainLayout({ initialSelectedNodeId }: MainLayoutProps) {
  const { session, isAuthenticated, isLoading: sessionLoading, branchContext, tenantId } = useEnterpriseSession()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || null)
  const [topLevelTab, setTopLevelTab] = useState<string>('processes')
  const [nodesData, setNodesData] = useState<any[]>([]) // ✅ NEW: Store nodes data
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  
  // ✅ DEBUG: Track MainLayout mount/unmount
  React.useEffect(() => {
    console.log('🔥 [MainLayout] COMPONENT MOUNTED');
    return () => {
      console.log('🔥 [MainLayout] COMPONENT UNMOUNTED');
    };
  }, []);
  
  // Track when we've initially loaded to prevent unmounting during branch operations
  React.useEffect(() => {
    console.log('🔍 [MainLayout] Session state changed:', { 
      hasSession: !!session, 
      isAuthenticated, 
      sessionLoading, 
      hasInitiallyLoaded,
      willShowLoading: (sessionLoading || !isAuthenticated) && !hasInitiallyLoaded
    });
    
    if (session && isAuthenticated && !sessionLoading) {
      console.log('✅ [MainLayout] Setting hasInitiallyLoaded = true');
      setHasInitiallyLoaded(true)
    }
  }, [session, isAuthenticated, sessionLoading, hasInitiallyLoaded])
  
  // ============================================================================
  // ENTERPRISE SSR HANDLING - PROGRESSIVE LOADING
  // ============================================================================
  
  // Only show loading state on INITIAL load, not during branch operations
  if ((sessionLoading || !isAuthenticated) && !hasInitiallyLoaded) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
          </div>
        </div>
      </div>
    )
  }
  
  const userRootNodeId = session?.user?.rootNodeId || '1'
  const currentTenant = session?.user?.currentTenant

  // Update selected node when initialSelectedNodeId changes
  useEffect(() => {
    if (initialSelectedNodeId !== undefined) {
      setSelectedNodeId(initialSelectedNodeId)
    }
  }, [initialSelectedNodeId])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  const handleBranchSwitch = useCallback((branchId: string) => {
    // TODO: Implement branch switching via session update or API call
    
  }, [])

  const handleHeaderSearch = useCallback((query: string) => {
    // TODO: Implement universal search across all resources
    
  }, [])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    // TODO: Implement tenant switching via session update or API call
    
  }, [])

  const handleTopLevelTabChange = useCallback((tabKey: string) => {
    setTopLevelTab(tabKey)
    // Handle navigation to different sections
    
  }, [])

  // ✅ NEW: Handler to receive nodes data from AutoTree
  const handleNodesDataChange = useCallback((data: any[]) => {
    setNodesData(data)
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tree Navigation (hidden on Tables and Marketplace tabs) */}
        {topLevelTab !== 'tables' && topLevelTab !== 'marketplace' && (
          <TreeNavigation
            userRootNodeId={userRootNodeId}
            currentBranch={branchContext?.currentBranch}
            availableBranches={branchContext?.availableBranches}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onBranchSwitch={handleBranchSwitch}
            nodesData={nodesData}
            onNodesDataChange={handleNodesDataChange}
          />
        )}
        
        {/* Right Side - Header + Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Header - Only spans the main content area */}
          <MainHeader 
            selectedNodeId={selectedNodeId} 
            currentTenant={currentTenant}
            currentBranch={branchContext?.currentBranch}
            onSearch={handleHeaderSearch}
            onTenantSwitch={handleTenantSwitch}
            showTopLevelTabs={true}
            activeTopLevelTab={topLevelTab}
            onTopLevelTabChange={handleTopLevelTabChange}
          />
          
          {/* Portal container for inline forms - renders just below the header/tabs */}
          <div id="inline-form-portal" />
          
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {topLevelTab === 'tables' ? (
              <TablesPage />
            ) : topLevelTab === 'marketplace' ? (
              <MarketplacePage />
            ) : selectedNodeId ? (
              <NodeContent 
                nodeId={selectedNodeId} 
                currentBranch={branchContext?.currentBranch?.id || 'main'}
                activeTopLevelTab={topLevelTab}
              />
            ) : (
              <EmptyState 
                currentTenant={currentTenant}
                activeTopLevelTab={topLevelTab}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}