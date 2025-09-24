'use client'

import React from 'react'
import { MainHeader } from '@/components/header/main-header'
import { useUnifiedApp } from '@/components/providers/conditional-providers'
import type { BranchInfo } from '@/lib/utils/branch-utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { 
    session, 
    isAuthenticated, 
    branchContext,
    isCacheReady
  } = useUnifiedApp()
  
  const sessionLoading = !isAuthenticated
  
  // Create BranchInfo object from unified provider data
  const currentBranch: BranchInfo | null = branchContext?.currentBranchId ? {
    id: branchContext.currentBranchId,
    name: branchContext.currentBranchId === 'main' ? 'Main' : branchContext.currentBranchId,
    isDefault: branchContext.currentBranchId === branchContext.defaultBranchId,
    lastModified: new Date().toISOString()
  } : null;
  
  // Show loading state during initial load
  if (sessionLoading || !isAuthenticated) {
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
  
  const currentTenant = session?.user?.currentTenant

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader 
        selectedNodeId={null}
        currentTenant={currentTenant}
        currentBranch={currentBranch || undefined}
        onSearch={() => {}}
        onTenantSwitch={() => {}}
        showTopLevelTabs={false}
        activeTopLevelTab=""
        onTopLevelTabChange={() => {}}
      />
      
      {/* Portal container for inline forms */}
      <div id="inline-form-portal" />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
