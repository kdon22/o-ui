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
 * ✅ CLEAN PATTERN: Single inheritance query using action-system
 * No complex caching - relies on action-client's IndexedDB + TanStack Query
 */
export function useNodeInheritance(nodeId: string, branchContext: BranchContext | null) {
  console.log('🚀 [useNodeInheritance] Simple pattern:', { nodeId })
  
  // Fetch all required data with individual action queries
  // This leverages the existing action system with branch overlay
  const nodeQuery = useActionQuery('node.read', { id: nodeId }, {
    enabled: !!(nodeId && branchContext)
  })
  
  const processesQuery = useActionQuery('process.list', {}, {
    enabled: !!branchContext
  })
  
  const rulesQuery = useActionQuery('rule.list', {}, {
    enabled: !!branchContext
  })
  
  const nodeProcessesQuery = useActionQuery('nodeProcesses.list', {}, {
    enabled: !!branchContext
  })
  
  const processRulesQuery = useActionQuery('processRules.list', {}, {
    enabled: !!branchContext
  })
  
  const ruleIgnoresQuery = useActionQuery('ruleIgnores.list', {}, {
    enabled: !!branchContext
  })

  // Compute inheritance data from all queries
  const inheritanceData = useMemo(() => {
    // Wait for all queries to complete
    if (!nodeQuery.data?.data || 
        !processesQuery.data?.data || 
        !rulesQuery.data?.data ||
        !nodeProcessesQuery.data?.data ||
        !processRulesQuery.data?.data ||
        !ruleIgnoresQuery.data?.data) {
      return null
    }
    
    console.log('📊 [useNodeInheritance] Computing inheritance from action data:', {
      nodeId,
      processCount: processesQuery.data.data.length || 0,
      ruleCount: rulesQuery.data.data.length || 0,
      nodeProcessCount: nodeProcessesQuery.data.data.length || 0,
      processRulesCount: processRulesQuery.data.data.length || 0
    })
    
    // Build ancestor chain using node.ancestorIds; fallback to parentId walk when missing
    const currentNode = nodeQuery.data.data
    const ancestorIdsFromNode = Array.isArray((currentNode as any).ancestorIds)
      ? [...(currentNode as any).ancestorIds]
      : []
    let ancestorChain: string[]
    if (ancestorIdsFromNode.length > 0) {
      // ancestorIds are typically stored root->parent; reverse so parent is first
      const orderedAncestors = ancestorIdsFromNode.reverse()
      ancestorChain = [currentNode.id, ...orderedAncestors]
    } else {
      ancestorChain = [currentNode.id]
    }
    console.log('🪜 [useNodeInheritance] Ancestor chain computed:', {
      nodeId,
      ancestorChain,
      chainLength: ancestorChain.length
    })
    
    const serverData = {
      node: currentNode,
      ancestorChain,
      processes: processesQuery.data.data,
      rules: rulesQuery.data.data,
      nodeProcesses: nodeProcessesQuery.data.data,
      processRules: processRulesQuery.data.data,
      ruleIgnores: ruleIgnoresQuery.data.data
    }
    
    return computeInheritanceFromServerData(nodeId, serverData)
  }, [
    nodeId, 
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

  // Process each level of hierarchy (closest first wins)
  ancestorChain.forEach((nodeId, inheritanceLevel) => {
    const directProcesses = nodeProcesses
      .filter(np => np.nodeId === nodeId)
      .map(np => np.processId)

    directProcesses.forEach(processId => {
      if (!inheritedProcesses.has(processId)) {
        const processEntity = processes.find(p => p.id === processId)
        if (processEntity) {
          const ruleCount = processRules.filter(pr => pr.processId === processId).length
          
          inheritedProcesses.set(processId, {
            processId,
            processName: processEntity.name,
            processType: processEntity.type,
            sourceNodeId: nodeId,
            sourceNodeName: processEntity.name, // TODO: Get actual node name
            inheritanceLevel,
            isInherited: inheritanceLevel > 0,
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

  availableProcesses.forEach(process => {
    // Nearest-wins lookup for node-scoped rule attachments
    let processRuleConnections: any[] = []
    for (let i = 0; i < ancestorChain.length; i++) {
      const nodeIdAtLevel = ancestorChain[i]
      const matchesAtLevel = processRules.filter(pr => pr.processId === process.processId && pr.nodeId === nodeIdAtLevel)
      if (matchesAtLevel.length > 0) {
        processRuleConnections = matchesAtLevel
        break
      }
    }
    
    processRuleConnections.forEach(connection => {
      const rule = rules.find(r => r.id === connection.ruleId)
      if (rule) {
        const isIgnored = ignoredRuleIds.has(rule.id)
        const ruleIsInherited = connection.nodeId !== currentNodeId
        
        inheritedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          processId: process.processId,
          processName: process.processName,
          processType: process.processType,
          sourceNodeId: connection.nodeId || process.sourceNodeId,
          sourceNodeName: process.sourceNodeName,
          inheritanceLevel: process.inheritanceLevel,
          isInherited: ruleIsInherited,
          isIgnored,
          order: connection.order || 0,
          displayClass: isIgnored ? 'ignored' : (ruleIsInherited ? 'inherited' : 'direct'),
          textColor: isIgnored ? 'red' : (ruleIsInherited ? 'blue' : undefined)
        })
      }
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