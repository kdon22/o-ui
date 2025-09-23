'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Zap, Users, FileText, Settings, Code2, Table, ShoppingCart } from 'lucide-react'
import { HeaderBreadcrumb } from './header-breadcrumb'
import { SearchTrigger } from '@/components/search'
import { HeaderTenantSwitcher } from './header-tenant-switcher'
import { HeaderBranchSwitcher } from './header-branch-switcher'
import { BranchManagementPanel } from '@/components/branching/branch-management-panel'
import { TabBar } from '@/components/ui'
import { useSession } from 'next-auth/react'

import type { BranchInfo } from '@/lib/utils/branch-utils'
import { getBranchDisplayName } from '@/lib/utils/branch-utils'

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
  
  // ✅ BULLETPROOF: Persist branch panel state across component remounts
  const [showBranchManagement, setShowBranchManagement] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('branch-panel-open');
      return saved === 'true';
    }
    return false;
  });
  
  // ✅ DEBUG: Track component mount/unmount
  useEffect(() => {
    console.log('🔥 [MainHeader] COMPONENT MOUNTED');
    return () => {
      console.log('🔥 [MainHeader] COMPONENT UNMOUNTED - showBranchManagement was:', showBranchManagement);
    };
  }, []);
  
  // ✅ BULLETPROOF: Override setShowBranchManagement to add debugging + persistence
  const setShowBranchManagementWithDebug = (value: boolean) => {
    console.log('🔥 [MainHeader] setShowBranchManagement called:', { 
      value, 
      currentValue: showBranchManagement,
      stackTrace: new Error().stack?.split('\n').slice(1, 8)
    });
    setShowBranchManagement(value);
    
    // ✅ PERSIST: Save to localStorage to survive component remounts
    if (typeof window !== 'undefined') {
      localStorage.setItem('branch-panel-open', value.toString());
      console.log('💾 [MainHeader] Persisted branch panel state:', value);
    }
  };
  const [preventBranchPanelClose, setPreventBranchPanelClose] = useState(false);
  const branchOperationInProgress = useRef(false);

  // Debug effect to track session changes that might affect state
  useEffect(() => {
    console.log('🔍 [MainHeader] Session changed:', { 
      sessionExists: !!session,
      currentBranchId: session?.user?.currentBranchId,
      branchName: session?.user?.branchName,
      showBranchManagement,
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
  }, [session, showBranchManagement]);

  // Debug effect to track showBranchManagement changes
  useEffect(() => {
    console.log('🔍 [MainHeader] showBranchManagement changed:', { 
      showBranchManagement, 
      preventClose: preventBranchPanelClose, 
      refValue: branchOperationInProgress.current,
      stackTrace: new Error().stack?.split('\n').slice(1, 4)
    });
  }, [showBranchManagement]);

  // Debug effect to track prevention flag changes
  useEffect(() => {
    console.log('🔍 [MainHeader] Prevention flag changed:', { preventBranchPanelClose, refValue: branchOperationInProgress.current });
  }, [preventBranchPanelClose]);

  // Custom handler to prevent accidental closes during branch operations
  const handleBranchPanelOpenChange = (open: boolean) => {
    console.log('🔄 [MainHeader] handleBranchPanelOpenChange called:', { 
      open, 
      preventClose: preventBranchPanelClose,
      refValue: branchOperationInProgress.current,
      currentState: showBranchManagement,
      stackTrace: new Error().stack?.split('\n').slice(1, 5)
    });
    
    if (!open && (preventBranchPanelClose || branchOperationInProgress.current)) {
      console.log('🛡️ [MainHeader] Prevented branch panel close during operation');
      return;
    }
    
    console.log('🔄 [MainHeader] Allowing branch panel state change:', { open, preventClose: preventBranchPanelClose });
    setShowBranchManagementWithDebug(open);
  };
  
  const defaultTopLevelTabs = [
    { key: 'processes', label: 'Processes', icon: Zap },
    { key: 'rules', label: 'Rules', icon: Code2 },
    { key: 'offices', label: 'Offices', icon: Users },
    { key: 'workflows', label: 'Workflows', icon: FileText },
    { key: 'tables', label: 'Tables', icon: Table },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'queues', label: 'Queues', icon: ShoppingCart },
    { key: 'marketplace', label: 'Marketplace', icon: ShoppingCart }
  ]

  // Convert topLevelTabOptions to the format expected by TabBar
  const topLevelTabs = topLevelTabOptions 
    ? topLevelTabOptions.map(option => ({
        key: option.value,
        label: option.label,
        icon: option.value === 'processes' ? Zap :
              option.value === 'rules' ? Code2 :
              option.value === 'offices' ? Users :
              option.value === 'workflows' ? FileText :
              option.value === 'tables' ? Table :
              option.value === 'settings' ? Settings :
              option.value === 'queues' ? ShoppingCart :
              option.value === 'marketplace' ? ShoppingCart :
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
          <HeaderBranchSwitcher
            variant="compact"
            onManageBranches={() => {
              console.log('🚀 [MainHeader] onManageBranches triggered - setting showBranchManagement to true');
              setShowBranchManagementWithDebug(true);
            }}
          />
          
          <HeaderTenantSwitcher 
            currentTenant={currentTenant}
            onTenantSwitch={onTenantSwitch}
          />
        </div>
      </div>

      {/* Optional: Top Level Navigation */}
      {showTopLevelTabs && (
        <div className="h-12 flex items-center px-6 bg-slate-50/50 border-t border-slate-200/50">
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
            className="w-full"
          />
        </div>
      )}
      
      {/* Branch Management Panel */}
      <BranchManagementPanel
        open={showBranchManagement}
        onOpenChange={handleBranchPanelOpenChange}
        onBranchOperationStart={() => {
          console.log('🔒 [MainHeader] Branch operation started - setting prevention flag');
          branchOperationInProgress.current = true;
          setPreventBranchPanelClose(true);
        }}
        onBranchOperationEnd={() => {
          console.log('🔓 [MainHeader] Branch operation ended - clearing prevention flag');
          branchOperationInProgress.current = false;
          setPreventBranchPanelClose(false);
        }}
      />
    </div>
  )
} 