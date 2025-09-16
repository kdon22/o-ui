'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { MainHeader } from '@/components/header/main-header'
// import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
import { useUnifiedApp } from '@/components/providers/conditional-providers'
import type { BranchInfo } from '@/lib/utils/branch-utils'
import { TreeNavigation } from './tree-navigation'
import { NodeContent } from './node-content'
import { EmptyState } from './empty-state'
import { TablesPage } from '../tables'
import MarketplacePage from '@/app/(main)/marketplace/page'

export interface MainLayoutProps {
  initialSelectedNodeId?: string | null
}

export default function MainLayout({ initialSelectedNodeId }: MainLayoutProps) {
  console.log('🔴 [MainLayout] COMPONENT RENDER START', { 
    initialSelectedNodeId,
    timestamp: new Date().toISOString()
  })
  
  // 🚨 DEBUG: Hook count tracking to find React hook ordering issue
  let hookCount = 0
  const hookDebug = (name: string) => {
    hookCount++
    console.log(`🪝 [MainLayout] Hook #${hookCount}: ${name}`, { initialSelectedNodeId })
  }
  
  hookDebug('useUnifiedApp')
  const { 
    session, 
    isAuthenticated, 
    branchContext, 
    tenantId,
    isCacheReady,
    nodes: nodesFromProvider,
    refetchNodes 
  } = useUnifiedApp()
  
  const sessionLoading = !isAuthenticated
  
  // Create BranchInfo objects from unified provider data
  const currentBranch: BranchInfo | null = branchContext?.currentBranchId ? {
    id: branchContext.currentBranchId,
    name: branchContext.currentBranchId === 'main' ? 'Main' : branchContext.currentBranchId,
    isDefault: branchContext.currentBranchId === branchContext.defaultBranchId,
    lastModified: new Date().toISOString()
  } : null;
  
  hookDebug('useState-selectedNodeId')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || null)
  
  hookDebug('useState-topLevelTab')
  const [topLevelTab, setTopLevelTab] = useState<string>('processes')
  
  hookDebug('useState-nodesData')
  // Use nodes from unified provider instead of local state
  const nodesData = nodesFromProvider
  
  hookDebug('useState-hasInitiallyLoaded')
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  
  hookDebug('useEffect-componentMount')
  // ✅ DEBUG: Track MainLayout mount/unmount
  React.useEffect(() => {
    console.log('🔥 [MainLayout] COMPONENT MOUNTED');
    return () => {
      console.log('🔥 [MainLayout] COMPONENT UNMOUNTED');
    };
  }, []);
  
  hookDebug('useEffect-sessionState')
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

  hookDebug('useEffect-initialNodeId')
  // Update selected node when initialSelectedNodeId changes
  useEffect(() => {
    if (initialSelectedNodeId !== undefined) {
      setSelectedNodeId(initialSelectedNodeId)
    }
  }, [initialSelectedNodeId])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  hookDebug('useCallback-handleNodeSelect')
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  hookDebug('useCallback-handleBranchSwitch')
  const handleBranchSwitch = useCallback((branchId: string) => {
    // TODO: Implement branch switching via session update or API call
    
  }, [])

  hookDebug('useCallback-handleHeaderSearch')
  const handleHeaderSearch = useCallback((query: string) => {
    // TODO: Implement universal search across all resources
    
  }, [])

  hookDebug('useCallback-handleTenantSwitch')
  const handleTenantSwitch = useCallback((tenantId: string) => {
    // TODO: Implement tenant switching via session update or API call
    
  }, [])

  hookDebug('useCallback-handleTopLevelTabChange')
  const handleTopLevelTabChange = useCallback((tabKey: string) => {
    setTopLevelTab(tabKey)
    // Handle navigation to different sections
    
  }, [])

  // ✅ SIMPLIFIED: No longer need handleNodesDataChange - using unified provider

  console.log(`🪝 [MainLayout] TOTAL HOOK COUNT: ${hookCount}`, { initialSelectedNodeId })

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
            currentBranch={currentBranch || undefined}
            availableBranches={[]} // TODO: Get available branches from unified provider
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onBranchSwitch={handleBranchSwitch}
            nodesData={nodesData}
          />
        )}
        
        {/* Right Side - Header + Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Header - Only spans the main content area */}
          <MainHeader 
            selectedNodeId={selectedNodeId} 
            currentTenant={currentTenant}
            currentBranch={currentBranch || undefined}
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
                currentBranch={branchContext?.currentBranchId || 'main'}
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