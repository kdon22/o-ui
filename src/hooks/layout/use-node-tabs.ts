import { useState, useEffect, useMemo } from 'react'
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema'
import { RULE_SCHEMA } from '@/features/rules/rules.schema'
import { useBranchContext } from '@/lib/session'

export type TabType = 'processes' | 'offices'

export interface TabConfig {
  resourceKey: string
  filters: Record<string, any>
  filteringConfig?: any
}

export interface NodeTabsState {
  activeTab: TabType
  level1Filter: string
  level2Filter: string
}

export interface NodeTabsActions {
  setActiveTab: (tab: TabType) => void
  setLevel1Filter: (filter: string) => void
  setLevel2Filter: (filter: string) => void
}

export interface UseNodeTabsReturn extends NodeTabsState, NodeTabsActions {
  currentTabConfig: TabConfig
}

export function useNodeTabs(nodeId: string): UseNodeTabsReturn {
  const [activeTab, setActiveTab] = useState<TabType>('processes')
  const [level1Filter, setLevel1Filter] = useState<string>('all')
  const [level2Filter, setLevel2Filter] = useState<string>('all')
  const branchContext = useBranchContext()
  
  // Guard: Early return if branch context isn't ready
  if (!branchContext.isReady) {
    return {
      // State
      activeTab: 'processes' as TabType,
      level1Filter: 'all',
      level2Filter: 'all',
      
      // Config
      tabConfigs: {
        processes: { 
          resourceKey: 'processes',
          filters: {},
          filteringConfig: {}
        },
        offices: { 
          resourceKey: 'offices',
          filters: {},
          filteringConfig: {}
        }
      },
      
      // Actions
      setActiveTab: () => {},
      setLevel1Filter: () => {},
      setLevel2Filter: () => {},
      reset: () => {}
    }
  }

  // Reset filters when tab changes
  useEffect(() => {
    setLevel1Filter('all')
    setLevel2Filter('all')
  }, [activeTab])

  // ✅ GOLD STANDARD: Reset filters when node OR branch changes to avoid stale data
  useEffect(() => {
    setLevel1Filter('all')
    setLevel2Filter('all')
  }, [nodeId, branchContext.currentBranchId])

  // Get current tab configuration
  const currentTabConfig = useMemo((): TabConfig => {
    switch (activeTab) {
      case 'processes':
        return {
          resourceKey: 'rule', // Show rules table for processes tab
          filters: { nodeId },
          filteringConfig: RULE_SCHEMA.filtering // Use rules filtering for rules table
        }
      case 'offices':
        return {
          resourceKey: 'office',
          filters: { nodeId }
        }
      default:
        return {
          resourceKey: 'rule', // Show rules table by default
          filters: { nodeId }
        }
    }
  }, [activeTab, nodeId])

  return {
    activeTab,
    level1Filter,
    level2Filter,
    currentTabConfig,
    setActiveTab,
    setLevel1Filter,
    setLevel2Filter
  }
} 