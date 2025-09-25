'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Zap, Users, FileText, Settings, Code2, Table, ShoppingCart, Rows3 } from 'lucide-react'
import { HeaderBreadcrumb } from './header-breadcrumb'
import { SearchTrigger } from '@/components/search/universal-search-provider'
import { HeaderTenantSwitcher } from './header-tenant-switcher'
// import { HeaderBranchSwitcher } from './header-branch-switcher'
import dynamic from 'next/dynamic'
import { TabBar } from '@/components/ui/tab-bar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { BranchInfo } from '@/lib/utils/branch-utils'

// Load heavy/complex client-only panels without SSR to avoid RSC/SSR eval issues (disabled for isolation)
// const BranchManagementPanel = dynamic(
//   () => import('@/components/branching/branch-management-panel').then(m => m.BranchManagementPanel),
//   { ssr: false }
// )

export interface MainHeaderProps {
  selectedNodeId: string | null
  currentTenant?: any
  currentBranch?: BranchInfo
  onSearch?: (query: string) => void
  onTenantSwitch?: (tenantId: string) => void
  // Optional: Add high-level navigation
  showTopLevelTabs?: boolean
  activeTopLevelTab?: string
  onTopLevelTabChange?: (tabKey: string) => void
  topLevelTabOptions?: { value: string; label: string }[]
}

export function MainHeader({ 
  selectedNodeId, 
  currentTenant, 
  currentBranch,
  onSearch,
  onTenantSwitch,
  showTopLevelTabs = false,
  activeTopLevelTab = 'processes',
  onTopLevelTabChange,
  topLevelTabOptions
}: MainHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // ✅ BULLETPROOF: Persist branch panel state across component remounts
  // const [showBranchManagement, setShowBranchManagement] = useState(false);
  
  // ✅ DEBUG: Track component mount/unmount
  useEffect(() => {
    console.log('🔥 [MainHeader] COMPONENT MOUNTED');
    return () => {
      console.log('🔥 [MainHeader] COMPONENT UNMOUNTED');
    };
  }, []);
  
  // ✅ BULLETPROOF: Override setShowBranchManagement to add debugging + persistence
  // const setShowBranchManagementWithDebug = (value: boolean) => {};
  // const [preventBranchPanelClose, setPreventBranchPanelClose] = useState(false);
  // const branchOperationInProgress = useRef(false);

  // Debug effect to track session changes that might affect state
  // useEffect(() => {}, [session]);

  // Debug effect to track showBranchManagement changes
  // useEffect(() => {}, []);

  // Debug effect to track prevention flag changes
  // useEffect(() => {}, []);

  // Custom handler to prevent accidental closes during branch operations
  // const handleBranchPanelOpenChange = (open: boolean) => {};
  
  const defaultTopLevelTabs = [
    { key: 'processes', label: 'Processes', icon: Zap },
    { key: 'rules', label: 'Rules', icon: Code2 },
    { key: 'offices', label: 'Offices', icon: Users },
    { key: 'tables', label: 'Tables', icon: Table },
    { key: 'queues', label: 'Queues', icon: Rows3 },
    { key: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { key: 'settings', label: 'Settings', icon: Settings }
  ]

  // Convert topLevelTabOptions to the format expected by TabBar
  const topLevelTabs = topLevelTabOptions 
    ? topLevelTabOptions.map(option => ({
        key: option.value,
        label: option.label,
        icon: option.value === 'processes' ? Zap :
              option.value === 'rules' ? Code2 :
              option.value === 'offices' ? Users :
              option.value === 'tables' ? Table :
              option.value === 'queues' ? Rows3 :
              option.value === 'marketplace' ? ShoppingCart :
              option.value === 'settings' ? Settings :
              FileText // Default icon
      }))
    : defaultTopLevelTabs

  return (
    <div className="border-b border-border bg-background">
      {/* Main Header Bar */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Left Section - Breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <HeaderBreadcrumb 
            selectedNodeId={selectedNodeId}
            currentTenant={currentTenant}
          />
        </div>
        
        {/* Center Section - Universal Search */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <SearchTrigger 
            placeholder="Search rules..."
            className="w-64"
          />
        </div>
        
        {/* Right Section - Branch Switcher, Tenant Switcher & Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/** HeaderBranchSwitcher disabled during isolation **/}
          
          <HeaderTenantSwitcher 
            currentTenant={currentTenant}
            onTenantSwitch={onTenantSwitch}
          />
        </div>
      </div>

      {/* Optional: Top Level Navigation */}
      {showTopLevelTabs && (
        <div className="h-12 flex items-center justify-between px-6 bg-slate-50/50 border-t border-slate-200/50">
          <TabBar
            tabs={topLevelTabs}
            activeTab={activeTopLevelTab}
            onTabChange={onTopLevelTabChange || (() => {})}
            variant="minimal"
            theme="red"
            size="sm"
            showIcons={true}
            showCounts={false}
            animate={true}
            className="flex-1"
          />
        </div>
      )}
      
      {/** Branch Management Panel disabled during isolation **/}
    </div>
  )
} 