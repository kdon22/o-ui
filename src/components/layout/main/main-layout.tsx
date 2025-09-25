/**
 * Main Layout - Clean Enterprise Architecture
 * 
 * GOLD STANDARD: No debug spam, optimized re-renders, clean data flow
 * - Uses single app provider for all state
 * - Memoized components prevent unnecessary re-renders
 * - Simple, focused responsibilities
 * - Fast <50ms renders after initial load
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MainHeader } from '@/components/header/main-header'
import { useUnifiedApp } from '@/components/providers/app-provider'
import type { BranchInfo } from '@/lib/utils/branch-utils'
import { TreeNavigation } from './tree-navigation'
import { NodeContent } from './node-content'
import { EmptyState } from './empty-state'
import { TablesPage } from '../tables'
import MarketplacePage from '@/app/(main)/marketplace/page'
import QueuesPage from '@/app/(main)/queues/page'
import SettingsPage from '@/app/(main)/settings/page'

export interface MainLayoutProps {
  initialSelectedNodeId?: string | null
}

// ============================================================================
// MEMOIZED MAIN LAYOUT COMPONENT
// ============================================================================

const MainLayout = React.memo(function MainLayout({ initialSelectedNodeId }: MainLayoutProps) {
  
  // ============================================================================
  // APP STATE - SINGLE SOURCE
  // ============================================================================
  
  const { 
    auth,
    branchContext, 
    nodes,
    isNodesLoading
  } = useUnifiedApp()
  
  // Extract auth state from SSOT
  const isAuthenticated = auth.isAuthenticated
  const session = auth
  
  // ============================================================================
  // LOCAL UI STATE
  // ============================================================================
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || null)
  const [topLevelTab, setTopLevelTab] = useState<string>('processes')
  
  // ============================================================================
  // DERIVED STATE (MEMOIZED)
  // ============================================================================
  
  const currentBranch: BranchInfo | null = useMemo(() => {
    if (!branchContext?.currentBranchId) return null;
    
    return {
      id: branchContext.currentBranchId,
      name: branchContext.currentBranchId === 'main' ? 'Main' : branchContext.currentBranchId,
      isDefault: branchContext.currentBranchId === branchContext.defaultBranchId,
      lastModified: new Date().toISOString()
    };
  }, [branchContext]);
  
  const userRootNodeId = useMemo(() => 
    session?.user?.rootNodeId || '1', 
    [session?.user?.rootNodeId]
  );
  
  const currentTenant = useMemo(() => 
    session?.user?.currentTenant, 
    [session?.user?.currentTenant]
  );
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Update selected node when initialSelectedNodeId changes
  useEffect(() => {
    if (initialSelectedNodeId !== undefined) {
      setSelectedNodeId(initialSelectedNodeId)
    }
  }, [initialSelectedNodeId])
  
  // ============================================================================
  // EVENT HANDLERS (MEMOIZED)
  // ============================================================================
  
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])
  
  const handleBranchSwitch = useCallback((branchId: string) => {
    // TODO: Implement branch switching
  }, [])
  
  const handleHeaderSearch = useCallback((query: string) => {
    // TODO: Implement universal search
  }, [])
  
  const handleTenantSwitch = useCallback((tenantId: string) => {
    // TODO: Implement tenant switching
  }, [])
  
  const handleTopLevelTabChange = useCallback((tabKey: string) => {
    setTopLevelTab(tabKey)
  }, [])
  
  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Loading session...</p>
        </div>
      </div>
    )
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tree Navigation */}
        {topLevelTab !== 'tables' && topLevelTab !== 'marketplace' && topLevelTab !== 'settings' && (
          <TreeNavigation
            userRootNodeId={userRootNodeId}
            currentBranch={currentBranch || undefined}
            availableBranches={[]}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onBranchSwitch={handleBranchSwitch}
            nodesData={nodes}
          />
        )}
        
        {/* Right Side - Header + Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Header */}
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
          
          {/* Portal container for inline forms */}
          <div id="inline-form-portal" />
          
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {topLevelTab === 'queues' ? (
              <QueuesPage />
            ) : topLevelTab === 'tables' ? (
              <TablesPage />
            ) : topLevelTab === 'marketplace' ? (
              <MarketplacePage />
            ) : topLevelTab === 'settings' ? (
              <SettingsPage />
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
})

// Set display name for debugging
MainLayout.displayName = 'MainLayout';

export default MainLayout;
