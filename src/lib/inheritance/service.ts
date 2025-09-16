/**
 * Simple Node Inheritance Service
 * 
 * Clean, single-query approach following action-system patterns.
 * No complex caching - relies on action-client IndexedDB + TanStack Query.
 */

import { useActionQuery } from '@/hooks/use-action-api'
import { useMemo } from 'react'
import type { BranchContext } from '@/lib/action-client/types'

// ============================================================================
// SIMPLIFIED TYPES
// ============================================================================

interface InheritedProcess {
  processId: string
  processName: string
  processType: string
  sourceNodeId: string
  sourceNodeName: string
  inheritanceLevel: number
  isInherited: boolean
  ruleCount: number
}

interface InheritedRule {
  ruleId: string
  ruleName: string
  ruleType: string
  processId: string
  processName: string
  processType: string
  sourceNodeId: string
  sourceNodeName: string
  inheritanceLevel: number
  isInherited: boolean
  isIgnored: boolean
  order?: number
  displayClass: 'direct' | 'inherited' | 'ignored'
  textColor?: 'red' | 'blue'
}

interface NodeInheritanceData {
  nodeId: string
  nodeName: string
  ancestorChain: string[]
  availableProcesses: InheritedProcess[]
  availableRules: InheritedRule[]
  processNames: ProcessName[]
  processTypes: ProcessType[]
}

interface ProcessName {
  id: string
  name: string
  count: number
  type: string
  sourceNodeId: string
  inheritanceLevel: number
  isInherited: boolean
}

interface ProcessType {
  id: string
  name: string
  processIds: string[]
  count: number
}

// ============================================================================
// SIMPLIFIED INHERITANCE HOOK
// ============================================================================

/**
 * 🚀 PERFORMANCE-OPTIMIZED: Ancestor-scoped queries using action-system
 * No more downloading entire database - only fetches relevant lineage data
 */
export function useNodeInheritance(nodeId: string, branchContext: BranchContext | null) {
  // STEP 1: Get the current node first to build ancestor chain  
  const nodeQuery = useActionQuery('node.read', { id: nodeId }, {
    enabled: !!(nodeId && branchContext),
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce re-fetching
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache longer
    placeholderData: undefined  // ✅ BRANCH OVERLAY: Prevent UI flicker during branch switching
  })
  
  // STEP 2: Build ancestor chain from node's ancestorIds
  const ancestorChain = useMemo(() => {
    if (!nodeQuery.data?.data) return []
    
    const currentNode = nodeQuery.data.data
    const ancestorIdsFromNode = Array.isArray((currentNode as any).ancestorIds)
      ? [...(currentNode as any).ancestorIds]
      : []
    
    let chain: string[]
    if (ancestorIdsFromNode.length > 0) {
      // ✅ FIXED: ancestorIds are root->parent, we want current + ancestors 
      chain = [currentNode.id, ...ancestorIdsFromNode]
    } else {
      // Root node only
      chain = [currentNode.id]
    }
    
    // 🐛 INHERITANCE DEBUG: Log ancestor chain for debugging inheritance issues
    console.log('🪜 [Inheritance] Building ancestor chain:', {
      nodeId: nodeId.slice(-8),
      nodeData: currentNode,
      ancestorIdsFromNode,
      finalChain: chain,
      chainLength: chain.length
    })
    
    return chain
  }, [nodeId, nodeQuery.data?.data])
  
  // STEP 3: 🚀 PERFORMANCE FIX - Scoped queries using ancestor chain
  // Only fetch data relevant to this node's lineage, not entire database!
  
  // ✅ SCOPED: Only fetch junction records for ancestor nodes
  const nodeProcessesQuery = useActionQuery('nodeProcesses.list', { 
    nodeIds: ancestorChain  // Filter by ancestor nodes only
  }, {
    enabled: !!(ancestorChain.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
  })
  
  // ✅ SCOPED: Only fetch processes used by ancestor nodes  
  const ancestorProcessIds = useMemo(() => {
    if (!nodeProcessesQuery.data?.data) return []
    const processIds = [...new Set(nodeProcessesQuery.data.data.map((np: any) => np.processId))]
    
    // 🐛 INHERITANCE DEBUG: Log process IDs for rule queries
    console.log('🎯 [Inheritance] Ancestor Process IDs for rules:', {
      nodeId: nodeId.slice(-8),
      processIds: processIds.map(id => id?.slice(-8)),
      nodeProcessesCount: nodeProcessesQuery.data.data.length
    })
    
    return processIds
  }, [nodeId, nodeProcessesQuery.data?.data])
  
  const processesQuery = useActionQuery('process.list', { 
    ids: ancestorProcessIds  // Only processes used in ancestor chain
  }, {
    enabled: !!(ancestorProcessIds.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
  })
  
  // ✅ SCOPED: Only fetch process-rule junctions for relevant processes
  const processRulesQuery = useActionQuery('processRules.list', {
    processIds: ancestorProcessIds  // Filter by relevant processes only
  }, {
    enabled: !!(ancestorProcessIds.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
  })
  
  // 🐛 INHERITANCE DEBUG: Log processRules query parameters
  console.log('🔍 [Inheritance] processRules query params:', {
    nodeId: nodeId.slice(-8),
    queryEnabled: !!(ancestorProcessIds.length > 0 && branchContext),
    ancestorProcessIds: ancestorProcessIds.map(id => id?.slice(-8)),
    queryData: processRulesQuery.data,
    queryLoading: processRulesQuery.isLoading,
    queryError: processRulesQuery.error
  })
  
  // ✅ SCOPED: Only fetch rules used by relevant processes
  const relevantRuleIds = useMemo(() => {
    if (!processRulesQuery.data?.data) return []
    const ruleIds = [...new Set(processRulesQuery.data.data.map((pr: any) => pr.ruleId))]
    
    // 🐛 INHERITANCE DEBUG: Log rule IDs from processRules
    console.log('🎯 [Inheritance] Process Rules data for rule queries:', {
      nodeId: nodeId.slice(-8),
      processRulesCount: processRulesQuery.data.data.length,
      processRulesSample: processRulesQuery.data.data.slice(0, 3).map((pr: any) => ({
        processId: pr.processId?.slice(-8),
        ruleId: pr.ruleId?.slice(-8),
        nodeId: pr.nodeId?.slice(-8)
      })),
      ruleIds: ruleIds.map(id => id?.slice(-8))
    })
    
    return ruleIds
  }, [nodeId, processRulesQuery.data?.data])
  
  const rulesQuery = useActionQuery('rule.list', {
    ids: relevantRuleIds  // Only rules used by ancestor processes
  }, {
    enabled: !!(relevantRuleIds.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
  })
  
  // 🐛 INHERITANCE DEBUG: Log rules query parameters
  console.log('🔍 [Inheritance] rules query params:', {
    nodeId: nodeId.slice(-8),
    queryEnabled: !!(relevantRuleIds.length > 0 && branchContext),
    relevantRuleIds: relevantRuleIds.map(id => id?.slice(-8)),
    queryData: rulesQuery.data,
    queryLoading: rulesQuery.isLoading,
    queryError: rulesQuery.error
  })
  
  // ✅ SCOPED: Only fetch rule ignores for ancestor chain
  const ruleIgnoresQuery = useActionQuery('ruleIgnores.list', {
    nodeIds: ancestorChain  // Filter by ancestor nodes only
  }, {
    enabled: !!(ancestorChain.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
  })

  // Compute inheritance data from scoped queries
  const inheritanceData = useMemo(() => {
    // Wait for essential queries to complete (empty arrays are OK for scoped queries)
    if (!nodeQuery.data?.data || !ancestorChain.length) {
      return null
    }
    
    // Allow empty scoped query results - they just mean no data for this lineage
    const processesData = processesQuery.data?.data || []
    const rulesData = rulesQuery.data?.data || []
    const nodeProcessesData = nodeProcessesQuery.data?.data || []
    const processRulesData = processRulesQuery.data?.data || []
    const ruleIgnoresData = ruleIgnoresQuery.data?.data || []
    
    const serverData = {
      node: nodeQuery.data.data,
      ancestorChain,
      processes: processesData,
      rules: rulesData,
      nodeProcesses: nodeProcessesData,
      processRules: processRulesData,
      ruleIgnores: ruleIgnoresData
    }
    
    return computeInheritanceFromServerData(nodeId, serverData)
  }, [
    nodeId,
    ancestorChain,
    nodeQuery.data?.data,
    processesQuery.data?.data,
    rulesQuery.data?.data,
    nodeProcessesQuery.data?.data,
    processRulesQuery.data?.data,
    ruleIgnoresQuery.data?.data
  ])

  // Combine loading states
  const isLoading = nodeQuery.isLoading || 
                   processesQuery.isLoading || 
                   rulesQuery.isLoading ||
                   nodeProcessesQuery.isLoading ||
                   processRulesQuery.isLoading ||
                   ruleIgnoresQuery.isLoading

  const error = nodeQuery.error || 
               processesQuery.error || 
               rulesQuery.error ||
               nodeProcessesQuery.error ||
               processRulesQuery.error ||
               ruleIgnoresQuery.error

  return {
    data: inheritanceData,
    isLoading,
    error,
    isSuccess: !!inheritanceData,
    refetch: () => {
      nodeQuery.refetch()
      processesQuery.refetch()
      rulesQuery.refetch()
      nodeProcessesQuery.refetch()
      processRulesQuery.refetch()
      ruleIgnoresQuery.refetch()
    }
  }
}

// ============================================================================
// SIMPLE COMPUTATION LOGIC
// ============================================================================

/**
 * Simple client-side computation from server data
 * Much cleaner than complex engine system
 */
function computeInheritanceFromServerData(nodeId: string, serverData: any): NodeInheritanceData {
  const {
    node,
    ancestorChain = [nodeId],
    processes = [],
    rules = [],
    nodeProcesses = [],
    processRules = [],
    ruleIgnores = []
  } = serverData

  // 🐛 INHERITANCE DEBUG: Log data for debugging inheritance issues
  console.log('🧮 [Inheritance] Computing for node:', nodeId.slice(-8), {
    ancestorChain: ancestorChain.map((id: string) => id.slice(-8)),
    dataAvailable: {
      processes: processes.length,
      nodeProcesses: nodeProcesses.length,
      processRules: processRules.length,
      rules: rules.length
    }
  })
  
  // 🔍 NAVIGATION DEBUG: Track which nodes are being considered for inheritance
  console.log('🔍 [Inheritance] Inheritance scope:', {
    currentNode: nodeId.slice(-8),
    ancestorChain: ancestorChain.map((id: string) => id.slice(-8)),
    nodeProcessesAvailable: nodeProcesses.map((np: any) => ({
      nodeId: np.nodeId?.slice(-8),
      processId: np.processId?.slice(-8)
    })),
    processRulesAvailable: processRules.map((pr: any) => ({
      processId: pr.processId?.slice(-8), 
      ruleId: pr.ruleId?.slice(-8),
      nodeId: pr.nodeId?.slice(-8)
    }))
  })

  // Build available processes with inheritance info
  const availableProcesses = buildAvailableProcesses(
    ancestorChain,
    processes,
    nodeProcesses,
    processRules
  )

  // Build available rules with inheritance info  
  const availableRules = buildAvailableRules(
    availableProcesses,
    rules,
    processRules,
    ruleIgnores,
    nodeId,
    ancestorChain
  )

  // Build filter data structures
  const processNames = availableProcesses.map(p => ({
    id: p.processId,
    name: p.processName,
    count: p.ruleCount,
    type: p.processType,
    sourceNodeId: p.sourceNodeId,
    inheritanceLevel: p.inheritanceLevel,
    isInherited: p.isInherited
  }))

  const processTypes = buildProcessTypes(availableProcesses)

  return {
    nodeId,
    nodeName: node?.name || 'Unknown Node',
    ancestorChain,
    availableProcesses,
    availableRules,
    processNames,
    processTypes
  }
}

// ============================================================================
// SIMPLE HELPER FUNCTIONS
// ============================================================================

function buildAncestorChain(currentNode: any, allNodes: any[]): string[] {
  const chain: string[] = [currentNode.id]
  const visited = new Set<string>([currentNode.id])
  
  let current = currentNode
  let depth = 0
  const maxDepth = 10 // Prevent infinite loops

  while (current.parentId && depth < maxDepth) {
    if (visited.has(current.parentId)) {
      console.warn('🔄 [buildAncestorChain] Circular reference detected')
      break
    }

    const parent = allNodes.find(n => n.id === current.parentId)
    if (!parent) {
      console.warn('⚠️ [buildAncestorChain] Parent not found:', current.parentId)
      break
    }

    chain.push(parent.id)
    visited.add(parent.id)
    current = parent
    depth++
  }

  return chain
}

function buildAvailableProcesses(
  ancestorChain: string[],
  processes: any[],
  nodeProcesses: any[],
  processRules: any[]
): InheritedProcess[] {
  const inheritedProcesses = new Map<string, InheritedProcess>()

  // 🐛 INHERITANCE DEBUG: Log nodeProcesses data structure
  console.log('🔍 [Inheritance] buildAvailableProcesses:', {
    ancestorChain: ancestorChain.map((id: string) => id.slice(-8)),
    nodeProcessesCount: nodeProcesses.length,
    nodeProcessesSample: nodeProcesses.slice(0, 3).map(np => ({
      nodeId: np.nodeId?.slice(-8),
      processId: np.processId?.slice(-8)
    })),
    processCount: processes.length
  })

  // Process each level of hierarchy (closest first wins)
  // ancestorChain[0] = current node (level 0)
  // ancestorChain[1+] = ancestor nodes (level 1+)
  ancestorChain.forEach((nodeId, inheritanceLevel) => {
    const directProcesses = nodeProcesses
      .filter(np => np.nodeId === nodeId)
      .map(np => np.processId)

    // 🐛 INHERITANCE DEBUG: Log each level's processes
    console.log(`📋 [Inheritance] Level ${inheritanceLevel} (${nodeId.slice(-8)}):`, {
      foundProcesses: directProcesses.length,
      processIds: directProcesses.map((id: string) => id?.slice(-8))
    })

    directProcesses.forEach(processId => {
      if (!inheritedProcesses.has(processId)) {
        const processEntity = processes.find(p => p.id === processId)
        if (processEntity) {
          const ruleCount = processRules.filter(pr => pr.processId === processId).length
          
          const inheritedProcess = {
            processId,
            processName: processEntity.name,
            processType: processEntity.type,
            sourceNodeId: nodeId,
            sourceNodeName: processEntity.name, // TODO: Get actual node name from nodes data
            inheritanceLevel,
            isInherited: inheritanceLevel > 0, // 0 = current, 1+ = inherited
            ruleCount
          }
          
          inheritedProcesses.set(processId, inheritedProcess)
          
          // 🐛 INHERITANCE DEBUG: Log process addition
          if (inheritanceLevel > 0) {
            console.log(`✅ [Inheritance] Added inherited process:`, {
              processName: processEntity.name,
              fromLevel: inheritanceLevel,
              sourceNode: nodeId.slice(-8)
            })
          }
        }
      }
    })
  })

  const result = Array.from(inheritedProcesses.values())
  
  // 🐛 INHERITANCE DEBUG: Log final result
  console.log('📊 [Inheritance] Final available processes:', {
    totalProcesses: result.length,
    inheritedCount: result.filter(p => p.isInherited).length,
    directCount: result.filter(p => !p.isInherited).length
  })

  return result
}

function buildAvailableRules(
  availableProcesses: InheritedProcess[],
  rules: any[],
  processRules: any[],
  ruleIgnores: any[],
  currentNodeId: string,
  ancestorChain: string[]
): InheritedRule[] {
  const inheritedRules: InheritedRule[] = []
  const ignoredRuleIds = new Set(
    ruleIgnores
      .filter(ri => ri.nodeId === currentNodeId)
      .map(ri => ri.ruleId)
  )

  // 🐛 INHERITANCE DEBUG: Log input data to buildAvailableRules
  console.log('🎯 [Inheritance] buildAvailableRules input data:', {
    currentNodeId: currentNodeId.slice(-8),
    availableProcessesCount: availableProcesses.length,
    rulesCount: rules.length,
    processRulesCount: processRules.length,
    ruleIgnoresCount: ruleIgnores.length,
    ignoredRuleIdsCount: ignoredRuleIds.size,
    availableProcessesSample: availableProcesses.slice(0, 3).map(p => ({
      processId: p.processId?.slice(-8),
      processName: p.processName,
      inheritanceLevel: p.inheritanceLevel
    })),
    processRulesSample: processRules.slice(0, 3).map((pr: any) => ({
      processId: pr.processId?.slice(-8),
      ruleId: pr.ruleId?.slice(-8),
      nodeId: pr.nodeId?.slice(-8)
    }))
  })

  // Check if we have data to work with
  if (availableProcesses.length === 0) {
    console.log('🚨 [Inheritance] No available processes - returning empty rules')
    return [] // No processes = no rules
  }

  // ProcessRules should now have correct nodeId from junction schema fix (rules.schema.ts)

  availableProcesses.forEach((process, processIndex) => {
    // 🔧 INHERITANCE FIX: Collect rules from ALL levels in ancestor chain  
    // Search ancestor chain from current node up to root, collect ALL matches
    let processRuleConnections: any[] = []
    
    for (let i = 0; i < ancestorChain.length; i++) {
      const nodeIdAtLevel = ancestorChain[i]
      const matchesAtLevel = processRules.filter(pr => 
        pr.processId === process.processId && pr.nodeId === nodeIdAtLevel
      )
      
      // Add all matches from this level (don't break - collect from all levels)
      processRuleConnections.push(...matchesAtLevel)
    }
    
    if (processRuleConnections.length === 0) {
      return
    }
    
    processRuleConnections.forEach((connection, connectionIndex) => {
      const rule = rules.find(r => r.id === connection.ruleId)
      if (!rule) {
        return
      }

      const isIgnored = ignoredRuleIds.has(rule.id)
      const ruleIsInherited = connection.nodeId !== currentNodeId
      const ruleInheritanceLevel = ancestorChain.indexOf(connection.nodeId)
      
      const displayClass: 'direct' | 'inherited' | 'ignored' = isIgnored ? 'ignored' : (ruleIsInherited ? 'inherited' : 'direct')
      
      const inheritedRule: InheritedRule = {
        // ✅ CRITICAL: Copy ALL original rule fields for AutoTable compatibility
        ...rule,  // Spreads id, name, type, branchId, tenantId, isActive, etc.
        
        // ✅ INHERITANCE: Override with enhanced fields for inheritance display
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        processId: process.processId,
        processName: process.processName,
        processType: process.processType,
        sourceNodeId: connection.nodeId || process.sourceNodeId,
        sourceNodeName: process.sourceNodeName,
        inheritanceLevel: ruleInheritanceLevel >= 0 ? ruleInheritanceLevel : process.inheritanceLevel,
        isInherited: ruleIsInherited,
        isIgnored,
        order: connection.order || 0,
        displayClass,
        textColor: isIgnored ? 'red' : (ruleIsInherited ? 'blue' : undefined)
      }
      
      inheritedRules.push(inheritedRule)
    })
  })

  // 🐛 INHERITANCE DEBUG: Log final rules result
  console.log('🎯 [Inheritance] buildAvailableRules result:', {
    currentNodeId: currentNodeId.slice(-8),
    inheritedRulesCount: inheritedRules.length,
    inheritedRulesSample: inheritedRules.slice(0, 5).map(rule => ({
      ruleId: rule.ruleId?.slice(-8),
      ruleName: rule.ruleName,
      processId: rule.processId?.slice(-8),
      processName: rule.processName,
      isInherited: rule.isInherited,
      inheritanceLevel: rule.inheritanceLevel,
      displayClass: rule.displayClass
    }))
  })

  // Return assembled rules to UI
  return inheritedRules
}

function buildProcessTypes(availableProcesses: InheritedProcess[]): ProcessType[] {
  const processTypeMap = new Map<string, ProcessType>()

  availableProcesses.forEach(process => {
    const existing = processTypeMap.get(process.processType)
    if (existing) {
      existing.processIds.push(process.processId)
      existing.count++
    } else {
      processTypeMap.set(process.processType, {
        id: process.processType,
        name: process.processType,
        processIds: [process.processId],
        count: 1
      })
    }
  })

  return Array.from(processTypeMap.values())
}

// ============================================================================
// EXPORT
// ============================================================================

// Simple utility functions for invalidation events
export function createProcessChangeEvent(processId: string, affectedNodeId: string) {
  return { type: 'process_change', processId, affectedNodeId, timestamp: Date.now() }
}

export function createRuleChangeEvent(ruleId: string, affectedNodeId: string) {
  return { type: 'rule_change', ruleId, affectedNodeId, timestamp: Date.now() }
}

export function createNodeStructureChangeEvent(affectedNodeId: string) {
  return { type: 'node_structure_change', affectedNodeId, timestamp: Date.now() }
}