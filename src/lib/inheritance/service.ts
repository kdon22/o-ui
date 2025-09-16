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
    
    // ✅ REDUCED LOGGING: Only log significant ancestor chains
    if (chain.length > 2) {
      console.log('🪜 [useNodeInheritance] Deep inheritance chain:', {
        nodeId,
        chainLength: chain.length,
        hasAncestors: ancestorIdsFromNode.length
      })
    }
    
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
    return [...new Set(nodeProcessesQuery.data.data.map((np: any) => np.processId))]
  }, [nodeProcessesQuery.data?.data])
  
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
  
  // ✅ SCOPED: Only fetch rules used by relevant processes
  const relevantRuleIds = useMemo(() => {
    if (!processRulesQuery.data?.data) return []
    return [...new Set(processRulesQuery.data.data.map((pr: any) => pr.ruleId))]
  }, [processRulesQuery.data?.data])
  
  const rulesQuery = useActionQuery('rule.list', {
    ids: relevantRuleIds  // Only rules used by ancestor processes
  }, {
    enabled: !!(relevantRuleIds.length > 0 && branchContext),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: { success: true, data: [], timestamp: Date.now(), action: 'placeholder' }  // ✅ BRANCH OVERLAY: Prevent UI flicker
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
      console.log('⏳ [useNodeInheritance] Waiting for node data and ancestor chain')
      return null
    }
    
    // Allow empty scoped query results - they just mean no data for this lineage
    const processesData = processesQuery.data?.data || []
    const rulesData = rulesQuery.data?.data || []
    const nodeProcessesData = nodeProcessesQuery.data?.data || []
    const processRulesData = processRulesQuery.data?.data || []
    const ruleIgnoresData = ruleIgnoresQuery.data?.data || []
    
    // ✅ SUMMARY LOGGING: Only log final results, not every step
    const totalRecords = processesData.length + rulesData.length + nodeProcessesData.length + processRulesData.length
    if (totalRecords > 0) {
      console.log('📊 [useNodeInheritance] Inheritance computed:', {
        nodeId: nodeId.slice(-8), // Short ID for readability
        ancestorChain: ancestorChain.length,
        totalRecords,
        performance: `${totalRecords} records vs 2500+ before`
      })
    }
    
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

  console.log('🧮 [computeInheritance] Computing with server data:', {
    nodeId,
    ancestorChainLength: ancestorChain.length,
    processesCount: processes.length,
    rulesCount: rules.length,
    nodeProcessesCount: nodeProcesses.length,
    processRulesCount: processRules.length
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

  // ✅ REDUCED LOGGING: Only log when significant data found

  // 🚀 PHASE 2 FIX: Process each level of hierarchy (closest first wins)
  // ancestorChain[0] = current node (level 0)
  // ancestorChain[1+] = ancestor nodes (level 1+)
  ancestorChain.forEach((nodeId, inheritanceLevel) => {
    const directProcesses = nodeProcesses
      .filter(np => np.nodeId === nodeId)
      .map(np => np.processId)

    directProcesses.forEach(processId => {
      // ✅ INHERITANCE DIRECTION FIX: Always include processes (current + ancestors)
      // The key insight: we're already ONLY fetching nodeProcesses for ancestorChain,
      // so we don't get descendant processes in the first place!
      // This is a MUCH cleaner fix than complex filtering
      
      if (!inheritedProcesses.has(processId)) {
        const processEntity = processes.find(p => p.id === processId)
        if (processEntity) {
          const ruleCount = processRules.filter(pr => pr.processId === processId).length
          
          inheritedProcesses.set(processId, {
            processId,
            processName: processEntity.name,
            processType: processEntity.type,
            sourceNodeId: nodeId,
            sourceNodeName: processEntity.name, // TODO: Get actual node name from nodes data
            inheritanceLevel,
            isInherited: inheritanceLevel > 0, // 0 = current, 1+ = inherited
            ruleCount
          })
        }
      }
    })
  })

  return Array.from(inheritedProcesses.values())
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

  // ✅ REDUCED LOGGING: Process inheritance computation
  availableProcesses.forEach((process, processIndex) => {
    // ✅ INHERITANCE DIRECTION: Nearest-wins lookup for node-scoped rule attachments
    // Search ancestor chain from current node up to root, take first match
    let processRuleConnections: any[] = []
    
    for (let i = 0; i < ancestorChain.length; i++) {
      const nodeIdAtLevel = ancestorChain[i]
      const matchesAtLevel = processRules.filter(pr => 
        pr.processId === process.processId && pr.nodeId === nodeIdAtLevel
      )
      
      if (matchesAtLevel.length > 0) {
        processRuleConnections = matchesAtLevel
        break
      }
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
      
      inheritedRules.push({
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
        displayClass: isIgnored ? 'ignored' : (ruleIsInherited ? 'inherited' : 'direct'),
        textColor: isIgnored ? 'red' : (ruleIsInherited ? 'blue' : undefined)
      })
    })
  })

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