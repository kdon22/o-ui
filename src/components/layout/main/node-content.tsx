'use client'

import React from 'react'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBranchContext } from '@/lib/session'
import { Zap, Users, FileText } from 'lucide-react'
import { TabBar } from '@/components/ui/tab-bar'
import { AutoTable } from '@/components/auto-generated/table/auto-table'
import { createAutoTableHeaderActions } from '@/components/auto-generated/table/header-actions'
import { useNodeTabs } from '@/hooks/layout'
import { useActionQuery } from '@/hooks/use-action-api'
import { useNodeInheritance } from '@/lib/inheritance/service' // ✅ FIXED - using performance-optimized inheritance service
import { useInstantActionQuery } from '@/hooks/use-instant-tabs' // ✅ INSTANT TAB SWITCHING
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PROCESS_TYPE_LABELS, PROCESS_TYPE_OPTIONS } from '@/features/processes/constants'
import { RULE_SCHEMA } from '@/features/rules/rules.schema'

interface NodeContentProps {
  nodeId: string
  currentBranch: string
  activeTopLevelTab: string
}

// ============================================================================
// TAB CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================
interface TabConfig {
  displayResource: string;      // What data to show in table
  createResource: string;       // What form to show when adding  
  customTitle?: string;
  customSearchPlaceholder?: string;
  filteringConfig?: any;        // Tab-specific filtering
  enhancedDataProvider?: () => any[];  // Custom data source
  addButtonLabel: string;
}

export function NodeContent({ nodeId, currentBranch, activeTopLevelTab }: NodeContentProps) {
  console.log('🔴 [NodeContent] COMPONENT RENDER START', { 
    nodeId, 
    currentBranch, 
    activeTopLevelTab,
    timestamp: new Date().toISOString()
  })
  
  // 🚨 DEBUG: Hook count tracking to find React hook ordering issue
  let hookCount = 0
  const hookDebug = (name: string) => {
    hookCount++
    console.log(`🪝 [NodeContent] Hook #${hookCount}: ${name}`, { nodeId, activeTopLevelTab })
  }
  
  hookDebug('useRouter')
  const router = useRouter()
  
  hookDebug('useBranchContext')
  // 🎯 SSOT: Get branch context from the single source of truth
  // NO FALLBACKS - fails fast with loading state if not ready
  const branchContext = useBranchContext()
  
  // Guard: Return loading if branch context isn't ready
  if (!branchContext.isReady) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }
  
  hookDebug('useNodeTabs')
  const {
    activeTab,
    level1Filter,
    level2Filter,
    currentTabConfig,
    setActiveTab,
    setLevel1Filter,
    setLevel2Filter
  } = useNodeTabs(nodeId)

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 [NodeContent] Component render:', {
      nodeId,
      currentBranch, // Legacy prop (ignored)
      actualBranchId: branchContext.currentBranchId, // ✅ SSOT
      defaultBranchId: branchContext.defaultBranchId,
      tenantId: branchContext.tenantId,
      activeTopLevelTab,
      level1Filter,
      level2Filter,
      timestamp: new Date().toISOString()
    })
  }

  // 🚀 PERFORMANCE-OPTIMIZED: Using fixed inheritance service with scoped queries
  // This replaces the problematic useNodeRuleHierarchy that was downloading entire database
  console.log('🔥 [NodeContent] Initializing inheritance hook for nodeId:', nodeId, 'branchContext:', branchContext)
  
  // 🚀 INSTANT TAB SWITCHING: Initialize instant loading system
  console.log('🚀 [NodeContent] Initializing instant tab switching (0ms loading)...')
  
  // ✅ PREFETCH TRIGGER: Preload all tab data when node is selected
  useEffect(() => {
    if (nodeId && branchContext.isReady) {
      console.log('🚀 [NodeContent] Node selected - prefetching all tab data for instant switching:', {
        nodeId: nodeId.slice(-8),
        branchId: branchContext.currentBranchId,
        timestamp: new Date().toISOString()
      });
      
      // The useInstantActionQuery hooks will handle the actual prefetching
      // This effect just logs when prefetching should happen
    }
  }, [nodeId, branchContext.currentBranchId, branchContext.isReady]);
  
  const inheritanceResult = useNodeInheritance(nodeId, branchContext)
  
  // 🎭 FLASH PREVENTION: Track navigation state to prevent data flashing during transitions
  const [isNavigating, setIsNavigating] = useState(false)
  const [lastStableNodeId, setLastStableNodeId] = useState(nodeId)
  
  // 🎭 NAVIGATION GUARD: Clear data flash when nodeId changes
  useEffect(() => {
    if (lastStableNodeId !== nodeId) {
      setIsNavigating(true)
      
      // Brief buffer to allow inheritance computation + prevent flash
      const transitionTimer = setTimeout(() => {
        setLastStableNodeId(nodeId)
        setIsNavigating(false)
      }, 100) // 100ms buffer - just enough to prevent flash
      
      return () => clearTimeout(transitionTimer)
    }
  }, [nodeId, lastStableNodeId])
  
  // Adapt the hook result to match the component's expected interface
  const ruleHierarchy = {
    processNames: inheritanceResult.data?.processNames || [],
    rules: inheritanceResult.data?.availableRules || [],
    processTypes: inheritanceResult.data?.processTypes || [],
    isLoading: inheritanceResult.isLoading,
    error: inheritanceResult.error
  }
  
  console.log('🎯 [NodeContent] Inheritance hook result:', {
    nodeId,
    hasData: !!inheritanceResult.data,
    isLoading: inheritanceResult.isLoading,
    error: inheritanceResult.error,
    processNamesCount: ruleHierarchy.processNames.length,
    rulesCount: ruleHierarchy.rules.length,
    processTypesCount: ruleHierarchy.processTypes.length,
    rulesSample: ruleHierarchy.rules.slice(0, 3).map((rule: any) => ({
      ruleId: rule.ruleId?.slice(-8),
      ruleName: rule.ruleName,
      processId: rule.processId?.slice(-8),
      processName: rule.processName,
      isInherited: rule.isInherited,
      displayClass: rule.displayClass
    })),
    timestamp: new Date().toISOString()
  })

  // ============================================================================
  // TAB CONFIGURATIONS - DEFINE ALL TAB BEHAVIOR
  // ============================================================================
  hookDebug('useMemo-TAB_CONFIGURATIONS')
  const TAB_CONFIGURATIONS: Record<string, TabConfig> = useMemo(() => ({
    processes: {
      displayResource: 'rule',           // Show rules hierarchy in table
      createResource: 'process',         // But create processes with inline form
      customTitle: 'Processes',
      customSearchPlaceholder: 'Search processes...',
      // Lean: use Rule schema's filtering for Process Types and Process Names
      filteringConfig: {
        level1: RULE_SCHEMA.filtering?.level1,
        level2: {
          title: RULE_SCHEMA.filtering?.level2?.title || 'Process Names',
          filterField: 'processName',
          groupBy: 'processId',
          showAll: true
        }
      },
      enhancedDataProvider: () => ruleHierarchy.rules,  // Use rule hierarchy data
      addButtonLabel: 'Add Process'
    },
    rules: {
      displayResource: 'rule',
      createResource: 'rule',
      // Use default resource query (rule.list) so branch overlay shows
      // main + current-branch rules, including unassigned branch-only rules
      filteringConfig: {
        level2: {
          title: 'Rule Type',
          filterField: 'type',
          groupBy: 'type',
          showAll: true,
          emptyStateMessage: 'No rules found for this type'
        }
      },
      addButtonLabel: 'Add Rule'
    },
    classes: {
      displayResource: 'class', 
      createResource: 'class',
      filteringConfig: null, // No process-specific filtering for classes
      addButtonLabel: 'Add Class'
    },
    offices: {
      displayResource: 'office',
      createResource: 'office',
      filteringConfig: null, // No process-specific filtering for offices
      addButtonLabel: 'Add Office'
    }
  }), [ruleHierarchy.rules])

  // Get current tab configuration
  const currentConfig = TAB_CONFIGURATIONS[activeTopLevelTab] || TAB_CONFIGURATIONS.rules

  console.log('[RULE-DEBUG] NodeContent component render:', {
    nodeId,
    activeTopLevelTab,
    ruleHierarchyStatus: {
      isLoading: ruleHierarchy.isLoading,
      hasError: !!ruleHierarchy.error,
      error: ruleHierarchy.error,
      rulesCount: ruleHierarchy.rules.length,
      processNamesCount: ruleHierarchy.processNames.length,
    },
    timestamp: new Date().toISOString()
  })

  hookDebug('useInstantActionQuery-processes')
  // 🚀 INSTANT TAB SWITCHING: Show cached data immediately, no loading spinners
  const { data: processesData } = useInstantActionQuery('process.list', {}, {
    enabled: activeTopLevelTab === 'processes',
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  })
  
  hookDebug('useInstantActionQuery-offices')
  const { data: officesData } = useInstantActionQuery('office.list', {}, {
    enabled: activeTopLevelTab === 'offices',
    staleTime: 60 * 1000, // Offices change less frequently
  })
  

  hookDebug('useInstantActionQuery-rules')
  // ✅ 0ms LOADING: Rules appear instantly from cache when switching tabs
  const { data: rulesData } = useInstantActionQuery('rule.list', {}, {
    enabled: activeTopLevelTab === 'rules',
    staleTime: 30 * 1000,
  })
  
  hookDebug('useInstantActionQuery-classes')
  const { data: classesData } = useInstantActionQuery('class.list', {}, {
    enabled: activeTopLevelTab === 'classes',
    staleTime: 60 * 1000, // Classes change less frequently
  })

  hookDebug('useCallback-handleRowClick')
  const handleRowClick = useCallback((entity: any) => {
    // Handle entity row clicks
    console.log('Row clicked:', entity)
  }, [activeTopLevelTab, router])

  hookDebug('useCallback-handleAttachClick')
  const handleAttachClick = useCallback(() => {
    // Handle attach click
  }, [])

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 [NodeContent] Rule hierarchy result:', {
      rulesCount: ruleHierarchy.rules.length,
      processTypesCount: ruleHierarchy.processTypes.length,
      processNamesCount: ruleHierarchy.processNames.length,
      isLoading: ruleHierarchy.isLoading,
      hasError: !!ruleHierarchy.error
    })
    
    // Log data separation for debugging duplicate keys
    console.log('🔥 [NodeContent] Data source separation:', {
      activeTopLevelTab,
      processesTabRulesCount: activeTopLevelTab === 'processes' ? ruleHierarchy.rules.length : 'N/A',
      rulesTabRulesCount: activeTopLevelTab === 'rules' ? (rulesData?.data?.length || 0) : 'N/A',
      classesTabCount: activeTopLevelTab === 'classes' ? (classesData?.data?.length || 0) : 'N/A'
    })
  }

  hookDebug('useMemo-enhancedData')
  // Get enhanced data based on current configuration
  const enhancedData = useMemo(() => {
    // 🎭 FLASH PREVENTION: Return empty array during navigation to prevent rule flashing
    if (isNavigating) {
      console.log('🎭 [NodeContent] Navigation in progress - suppressing enhanced data to prevent flash', {
        activeTopLevelTab,
        nodeId: nodeId.slice(-8),
        timestamp: new Date().toISOString()
      });
      return [];
    }
    
    console.log('🔍 [NodeContent] Enhanced data decision:', {
      activeTopLevelTab,
      hasEnhancedDataProvider: !!currentConfig.enhancedDataProvider,
      ruleHierarchyRulesCount: ruleHierarchy.rules.length,
      timestamp: new Date().toISOString()
    });
    
    if (currentConfig.enhancedDataProvider) {
      const enhanced = currentConfig.enhancedDataProvider();
      console.log('✅ [NodeContent] Using enhanced data:', {
        activeTopLevelTab,
        enhancedDataLength: enhanced?.length || 0,
        enhancedDataSample: enhanced?.slice(0, 3).map((item: any) => ({
          ruleId: item.ruleId?.slice(-8),
          ruleName: item.ruleName,
          processId: item.processId?.slice(-8),
          processName: item.processName,
          isInherited: item.isInherited,
          displayClass: item.displayClass
        })),
        timestamp: new Date().toISOString()
      });
      return enhanced;
    }
    
    console.log('❌ [NodeContent] No enhanced data provider - using API data', {
      activeTopLevelTab,
      timestamp: new Date().toISOString()
    });
    return undefined;
  }, [currentConfig, ruleHierarchy.rules, activeTopLevelTab, isNavigating])

  hookDebug('useMemo-standardData')
  // Get standard data for non-enhanced tabs
  const standardData = useMemo(() => {
    switch (activeTopLevelTab) {
      case 'rules':
        return rulesData?.data || []
      case 'classes':
        return classesData?.data || []
      case 'offices':
        return officesData?.data || []
      default:
        return []
    }
  }, [activeTopLevelTab, rulesData?.data, classesData?.data, officesData?.data])

  hookDebug('useEffect-componentLifecycle')
  useEffect(() => {
    console.log('🟢 [NodeContent] COMPONENT MOUNTED', { 
      nodeId, 
      activeTopLevelTab, 
      timestamp: new Date().toISOString() 
    })
    
    return () => {
      console.log('🔴 [NodeContent] COMPONENT UNMOUNTING', { 
        nodeId, 
        activeTopLevelTab, 
        timestamp: new Date().toISOString() 
      })
    }
  }, [nodeId, activeTopLevelTab])

  console.log(`🪝 [NodeContent] TOTAL HOOK COUNT: ${hookCount}`, { nodeId, activeTopLevelTab })

  // Header actions are now handled by the AutoTable component

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Level 2 Tab Bar is handled by AutoTable internally */}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          key={`${activeTopLevelTab}-${currentConfig.displayResource}`}
          resourceKey={currentConfig.displayResource}
          filters={{
            level1Filter,
            level2Filter,
            // Only include nodeId for node-specific tabs (not rules/classes which are tenant/branch only)
            ...(activeTopLevelTab !== 'rules' && activeTopLevelTab !== 'classes' && { nodeId })
          }}
          onRowClick={handleRowClick}
          className="h-full"
          level1Filter={level1Filter}
          level2Filter={level2Filter}
          onLevel1FilterChange={setLevel1Filter}
          onLevel2FilterChange={setLevel2Filter}
          filteringConfig={currentConfig.filteringConfig}
          enhancedData={enhancedData}
          processTypes={activeTopLevelTab === 'processes' ? ruleHierarchy.processTypes?.map((pt: any) => ({ id: pt.id, name: pt.name, count: pt.processIds.length })) : undefined}
          processNames={(activeTopLevelTab === 'processes' || activeTopLevelTab === 'rules') ? ruleHierarchy.processNames : undefined}
          customTitle={currentConfig.customTitle}
          customSearchPlaceholder={currentConfig.customSearchPlaceholder}
          navigationContext={(() => {
            // Provide processId to the table actions when a specific process is selected
            if (activeTopLevelTab === 'processes' && level2Filter && level2Filter !== 'all') {
              return { processId: level2Filter, nodeId } as any
            }
            return undefined
          })()}
          headerActions={(handleAdd) => {
            // Special handling for processes tab - show dual split buttons
            if (activeTopLevelTab === 'processes') {
              const { AttachAndSplitAddActions } = createAutoTableHeaderActions(handleAdd);
              const isAllProcesses = level2Filter === 'all';
              
              return (
                <AttachAndSplitAddActions
                  onAttachProcess={() => {
                    console.log('🔥 [NodeContent] Attach Process clicked');
                    handleAttachClick();
                  }}
                  onAttachRule={() => {
                    console.log('🔥 [NodeContent] Attach Rule clicked', { 
                      selectedProcess: level2Filter,
                      nodeId 
                    });
                    // TODO: Implement rule attach with process context
                    handleAttachClick();
                  }}
                  onAddProcess={() => {
                    console.log('🔥 [NodeContent] Add Process clicked');
                    // TODO: Implement custom process inline form trigger
                    handleAdd(); // For now, use default
                  }}
                  onAddRule={() => {
                    console.log('🔥 [NodeContent] Add Rule clicked', { 
                      selectedProcess: level2Filter,
                      nodeId 
                    });
                    // TODO: Implement rule creation with process context
                    handleAdd(); // For now, use default
                  }}
                  ruleDisabled={isAllProcesses} // Disable when no specific process selected
                />
              );
            }
            
            // Default behavior for other tabs
            const { AttachAndAddActions } = createAutoTableHeaderActions(
              currentConfig.displayResource !== currentConfig.createResource
                ? () => {
                    // Custom create logic for mixed display/create scenarios
                    console.log(`Creating ${currentConfig.createResource} while displaying ${currentConfig.displayResource}`);
                    // TODO: Implement custom inline form trigger for different resource
                    handleAdd(); // For now, use default
                  }
                : handleAdd
            );
            return (
              <AttachAndAddActions
                onAttach={handleAttachClick}
                addLabel={currentConfig.addButtonLabel}
              />
            );
          }}
        />
      </div>
    </div>
  )
}