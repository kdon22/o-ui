'use client'

import React from 'react'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { useReadyBranchContext } from '@/lib/context/branch-context'
import { Zap, Users, FileText } from 'lucide-react'
import { TabBar } from '@/components/ui/tab-bar'
import { AutoTable } from '@/components/auto-generated/table/auto-table'
import { createAutoTableHeaderActions } from '@/components/auto-generated/table/header-actions'
import { useNodeTabs } from '@/hooks/layout'
import { useActionQuery } from '@/hooks/use-action-api'
// import { useNodeRuleHierarchy } from '@/hooks/node-rule-hierarchy' // DISABLED - causing React hook errors
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PROCESS_TYPE_LABELS, PROCESS_TYPE_OPTIONS } from '@/features/processes/constants'
import { RULE_SCHEMA } from '@/features/rules/rules.schema'
import { ProcessType } from '@prisma/client'

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
  
  hookDebug('useReadyBranchContext')
  // 🎯 SSOT: Get branch context from the single source of truth
  // This will throw an error if branch context is not ready - NO FALLBACKS!
  const branchContext = useReadyBranchContext()
  
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

  // 🚨 COMPLETE HOOK REMOVAL: Inheritance system disabled to fix React hook errors
  // The useNodeRuleHierarchy hook was calling conditional hooks internally causing 
  // "Rendered more hooks than during the previous render" errors
  // TODO: Re-enable with proper filtering after tree is working and ancestorIds are fixed
  const ruleHierarchy = {
    processNames: [],
    rules: [],
    processTypes: [],
    isLoading: false,
    error: null
  }
  
  // 🚫 COMPLETELY DISABLED: This hook and all its internal hooks are causing React errors
  // const ruleHierarchy = useNodeRuleHierarchy({
  //   nodeId,
  //   branchId: branchContext.currentBranchId,
  //   includeInherited: true,
  //   includeIgnored: false
  // })

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
    },
    workflows: {
      displayResource: 'workflow',
      createResource: 'workflow',
      filteringConfig: null, // No process-specific filtering for workflows
      addButtonLabel: 'Add Workflow'
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

  hookDebug('useActionQuery-processes')
  // ✅ FIXED: Call all hooks on every render to maintain consistent hook order
  // Only the `enabled` option controls whether data is fetched
  const { data: processesData } = useActionQuery('process.list', {}, {
    enabled: activeTopLevelTab === 'processes'
  })
  
  hookDebug('useActionQuery-offices')
  const { data: officesData } = useActionQuery('office.list', {}, {
    enabled: activeTopLevelTab === 'offices'
  })
  
  hookDebug('useActionQuery-workflows')
  const { data: workflowsData } = useActionQuery('workflow.list', {}, {
    enabled: activeTopLevelTab === 'workflows'
  })

  hookDebug('useActionQuery-rules')
  // ✅ NEW: Add Rules and Classes data fetching (filtered by tenant/branch only, no nodeId)
  const { data: rulesData } = useActionQuery('rule.list', {}, {
    enabled: activeTopLevelTab === 'rules'
  })
  
  hookDebug('useActionQuery-classes')
  const { data: classesData } = useActionQuery('class.list', {}, {
    enabled: activeTopLevelTab === 'classes'
  })

  hookDebug('useCallback-handleRowClick')
  const handleRowClick = useCallback((entity: any) => {
    // Handle row click
  }, [])

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
        timestamp: new Date().toISOString()
      });
      return enhanced;
    }
    
    console.log('❌ [NodeContent] No enhanced data provider - using API data', {
      activeTopLevelTab,
      timestamp: new Date().toISOString()
    });
    return undefined;
  }, [currentConfig, ruleHierarchy.rules, activeTopLevelTab])

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
      case 'workflows':
        return workflowsData?.data || []
      default:
        return []
    }
  }, [activeTopLevelTab, rulesData?.data, classesData?.data, officesData?.data, workflowsData?.data])

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