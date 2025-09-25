/**
 * Node Inheritance Engine
 * 
 * Core computation engine for hierarchical process inheritance.
 * Handles complex inheritance chains with extreme performance.
 */

import type {
  NodeInheritanceData,
  InheritedProcess,
  InheritedRule,
  ProcessName,
  ProcessType,
  NodeEntity,
  ProcessEntity,
  RuleEntity,
  NodeProcessJunction,
  ProcessRuleJunction,
  RuleIgnoreJunction,
  BranchContext,
  InheritanceEngineOptions
} from './types'

export class NodeInheritanceEngine {
  private options: Required<InheritanceEngineOptions>

  constructor(options: InheritanceEngineOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 50,
      includeIgnored: options.includeIgnored ?? true,
      cacheTTL: options.cacheTTL ?? 5 * 60 * 1000 // 5 minutes
    }
  }

  // ============================================================================
  // MAIN COMPUTATION METHODS
  // ============================================================================

  /**
   * Computes complete inheritance data for a node
   */
  async computeInheritance(
    nodeId: string,
    rawData: {
      nodes: NodeEntity[]
      processes: ProcessEntity[]
      rules: RuleEntity[]
      nodeProcesses: NodeProcessJunction[]
      processRules: ProcessRuleJunction[]
      ruleIgnores: RuleIgnoreJunction[]
    },
    branchContext: BranchContext
  ): Promise<NodeInheritanceData> {
    console.log('🔥 [InheritanceEngine] Computing inheritance for:', nodeId)

    // Step 1: Build node hierarchy chain
    const currentNode = rawData.nodes.find(n => n.id === nodeId)
    if (!currentNode) {
      throw new Error(`Node not found: ${nodeId}. Available nodes: ${rawData.nodes?.map(n => n.id).join(', ') || 'none'}`)
    }

    const ancestorChain = this.buildAncestorChain(currentNode, rawData.nodes)
    console.log('📊 [InheritanceEngine] Ancestor chain:', ancestorChain)

    // Step 2: Collect all processes for the inheritance chain
    const availableProcesses = this.computeInheritedProcesses(
      ancestorChain,
      rawData.processes,
      rawData.nodeProcesses,
      rawData.processRules,
      rawData.nodes
    )
    console.log('📊 [InheritanceEngine] Available processes:', availableProcesses.length)

    // Step 3: Collect all rules for the inherited processes
    const availableRules = this.computeInheritedRules(
      availableProcesses,
      rawData.rules,
      rawData.processRules,
      rawData.ruleIgnores,
      nodeId
    )
    console.log('📊 [InheritanceEngine] Available rules:', availableRules.length)

    // Step 4: Build FilterTabBar data structures
    const processNames = this.buildProcessNames(availableProcesses)
    const processTypes = this.buildProcessTypes(availableProcesses)
    
    console.log('🔍 [InheritanceEngine] Process inheritance details:', {
      totalProcesses: availableProcesses.length,
      directProcesses: availableProcesses.filter(p => !p.isInherited).length,
      inheritedProcesses: availableProcesses.filter(p => p.isInherited).length,
      processNamesSummary: processNames.map(p => ({
        name: p.name,
        type: p.type,
        count: p.count,
        isInherited: p.isInherited,
        sourceNodeId: p.sourceNodeId,
        inheritanceLevel: p.inheritanceLevel
      }))
    })

    // Step 5: Create final inheritance data
    const inheritanceData: NodeInheritanceData = {
      nodeId,
      nodeName: currentNode.name,
      ancestorChain,
      availableProcesses,
      availableRules,
      processNames,
      processTypes,
      computedAt: Date.now(),
      cacheVersion: this.generateCacheVersion(rawData)
    }

    console.log('✅ [InheritanceEngine] Inheritance computed successfully:', {
      processCount: availableProcesses.length,
      ruleCount: availableRules.length,
      inheritedProcesses: availableProcesses.filter(p => p.isInherited).length,
      inheritedRules: availableRules.filter(r => r.isInherited).length
    })

    return inheritanceData
  }

  // ============================================================================
  // HIERARCHY BUILDING
  // ============================================================================

  /**
   * Builds complete ancestor chain for a node
   */
  private buildAncestorChain(currentNode: NodeEntity, allNodes: NodeEntity[]): string[] {
    console.log('🏗️ [InheritanceEngine] Building ancestor chain for:', {
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      parentId: currentNode.parentId,
      totalNodes: allNodes.length
    })
    
    const chain: string[] = [currentNode.id]
    const visited = new Set<string>([currentNode.id])
    
    let current = currentNode
    let depth = 0

    while (current.parentId && depth < this.options.maxDepth) {
      console.log(`🔗 [InheritanceEngine] Chain step ${depth + 1}:`, {
        currentNodeId: current.id,
        currentNodeName: current.name,
        lookingForParentId: current.parentId,
        chainSoFar: chain
      })

      if (visited.has(current.parentId)) {
        console.warn('🔄 [InheritanceEngine] Circular reference detected, breaking chain')
        break
      }

      const parent = allNodes.find(n => n.id === current.parentId)
      if (!parent) {
        console.warn('⚠️ [InheritanceEngine] Parent node not found:', {
          parentId: current.parentId,
          availableNodeIds: allNodes.map(n => `${n.id} (${n.name})`),
          totalNodes: allNodes.length
        })
        break
      }

      console.log('✅ [InheritanceEngine] Found parent:', {
        parentId: parent.id,
        parentName: parent.name,
        parentParentId: parent.parentId
      })

      chain.push(parent.id)
      visited.add(parent.id)
      current = parent
      depth++
    }

    console.log('🏁 [InheritanceEngine] Final ancestor chain:', {
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      chain: chain,
      chainLength: chain.length,
      maxDepthReached: depth >= this.options.maxDepth
    })

    return chain
  }

  // ============================================================================
  // PROCESS INHERITANCE
  // ============================================================================

  /**
   * Computes all processes available to a node through inheritance
   */
  private computeInheritedProcesses(
    ancestorChain: string[],
    processes: ProcessEntity[],
    nodeProcesses: NodeProcessJunction[],
    processRules: ProcessRuleJunction[],
    nodes: NodeEntity[]
  ): InheritedProcess[] {
    const inheritedProcesses = new Map<string, InheritedProcess>()

    console.log('🔍 [InheritanceEngine] Computing inherited processes for chain:', {
      ancestorChain,
      totalProcesses: processes.length,
      totalNodeProcessJunctions: nodeProcesses.length,
      nodeProcessJunctionsByNode: ancestorChain.map(nodeId => ({
        nodeId,
        junctionCount: nodeProcesses.filter(np => np.nodeId === nodeId || np.nodeId === nodeId.split(':branch:')[0]).length
      }))
    })

    // Process each level of the hierarchy (closest first wins)
    ancestorChain.forEach((nodeId, inheritanceLevel) => {
      const nodeBaseId = nodeId.split(':branch:')[0]
      const nodeName = nodes.find(n => n.id === nodeId)?.name || nodeId

      // Find processes directly connected to this node
      const directProcesses = nodeProcesses
        .filter(np => np.nodeId === nodeBaseId || np.nodeId === nodeId)
        .map(np => np.processId)

      console.log(`🔗 [InheritanceEngine] Node ${nodeName} (${nodeId}) at level ${inheritanceLevel}:`, {
        nodeBaseId,
        foundDirectProcesses: directProcesses.length,
        processIds: directProcesses,
        availableJunctions: nodeProcesses.filter(np => np.nodeId === nodeBaseId || np.nodeId === nodeId)
      })

      // Add each process if not already inherited from a closer ancestor
      directProcesses.forEach(processIdFromJunction => {
        if (!inheritedProcesses.has(processIdFromJunction)) {
          const processEntity = processes.find(p => this.entityIdMatchesBaseOrSelf(p, processIdFromJunction))

          if (processEntity) {
            const baseProcessId = this.getCanonicalBaseId(processEntity)
            const relatedIds = new Set<string>()
            relatedIds.add(baseProcessId)
            relatedIds.add(processEntity.id)
            processes.forEach(p => {
              const pOriginal = this.getOriginalAnyId(p)
              if (pOriginal && pOriginal === baseProcessId) {
                relatedIds.add(p.id)
              }
            })

            // Count rules across any related process ID (branch-aware)
            const ruleCount = processRules.filter(pr => relatedIds.has(pr.processId)).length

            inheritedProcesses.set(processIdFromJunction, {
              processId: processIdFromJunction,
              processName: processEntity.name,
              processType: processEntity.type,
              sourceNodeId: nodeId,
              sourceNodeName: nodeName,
              inheritanceLevel,
              isInherited: inheritanceLevel > 0,
              ruleCount,
              relatedProcessIds: Array.from(relatedIds)
            })
          }
        }
      })
    })

    return Array.from(inheritedProcesses.values())
  }

  // ============================================================================
  // RULE INHERITANCE
  // ============================================================================

  /**
   * Computes all rules available through inherited processes
   */
  private computeInheritedRules(
    availableProcesses: InheritedProcess[],
    rules: RuleEntity[],
    processRules: ProcessRuleJunction[],
    ruleIgnores: RuleIgnoreJunction[],
    currentNodeId: string
  ): InheritedRule[] {
    const inheritedRules: InheritedRule[] = []
    const ignoredRuleIds = new Set(
      ruleIgnores
        .filter(ri => ri.nodeId === currentNodeId.split(':branch:')[0] || ri.nodeId === currentNodeId)
        .map(ri => ri.ruleId)
    )

    // 🚨 AGGRESSIVE DEBUG: See what data we're working with
    console.log('🔥 [InheritanceEngine] RULE COMPUTATION DEBUG:', {
      currentNodeId,
      availableProcessesCount: availableProcesses.length,
      totalRulesCount: rules.length,
      processRulesJunctionsCount: processRules.length,
      ignoredRuleIdsCount: ignoredRuleIds.size,
      availableProcessesPreview: availableProcesses.slice(0, 3).map(p => ({
        processId: p.processId,
        processName: p.processName,
        isInherited: p.isInherited,
        sourceNodeId: p.sourceNodeId
      })),
      rulesPreview: rules.slice(0, 5).map(r => ({
        id: r.id,
        name: r.name,
        branchId: r.branchId || 'no-branch'
      })),
      processRulesPreview: processRules.slice(0, 5).map(pr => ({
        id: pr.id,
        processId: pr.processId,
        ruleId: pr.ruleId,
        branchId: pr.branchId || 'no-branch'
      })),
      timestamp: new Date().toISOString()
    });

    // Process each available process
    availableProcesses.forEach(inheritedProcess => {
      // Find rules connected to this process, including branched ids
      const identitySet = new Set<string>([
        inheritedProcess.processId,
        ...(inheritedProcess.relatedProcessIds || [])
      ])
      const processRuleConnections = processRules.filter(pr => identitySet.has(pr.processId))

      // 🚨 DEBUG: Log what we find for each process
      console.log(`🔍 [InheritanceEngine] Processing rules for process: ${inheritedProcess.processName}`, {
        processId: inheritedProcess.processId,
        identitySet: Array.from(identitySet),
        foundConnections: processRuleConnections.length,
        connectionsPreview: processRuleConnections.map(pr => ({
          id: pr.id,
          ruleId: pr.ruleId,
          branchId: pr.branchId || 'no-branch'
        }))
      });

      processRuleConnections.forEach(connection => {
        const rule = rules.find(r => this.entityIdMatchesBaseOrSelf(r, connection.ruleId))
        
        // 🚨 DEBUG: Log rule matching
        console.log(`🔍 [InheritanceEngine] Looking for rule: ${connection.ruleId}`, {
          found: !!rule,
          ruleName: rule?.name || 'NOT FOUND',
          ruleBranchId: rule?.branchId || 'no-branch',
          connectionBranchId: connection.branchId || 'no-branch'
        });

        if (rule) {
          const ruleBaseId = this.getCanonicalBaseId(rule)
          const isIgnored = ignoredRuleIds.has(ruleBaseId)

          inheritedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            processId: inheritedProcess.processId,
            processName: inheritedProcess.processName,
            processType: inheritedProcess.processType,
            sourceNodeId: inheritedProcess.sourceNodeId,
            sourceNodeName: inheritedProcess.sourceNodeName,
            inheritanceLevel: inheritedProcess.inheritanceLevel,
            isInherited: inheritedProcess.isInherited,
            isIgnored,
            order: connection.order,
            displayClass: isIgnored ? 'ignored' : (inheritedProcess.isInherited ? 'inherited' : 'direct'),
            textColor: isIgnored ? 'red' : (inheritedProcess.isInherited ? 'blue' : undefined)
          })
        }
      })
    })

    return inheritedRules
  }

  private getOriginalAnyId(entity: { [key: string]: any }): string | undefined {
    if (!entity || typeof entity !== 'object') return undefined
    if (typeof (entity as any).originalId === 'string') return (entity as any).originalId
    const originalKey = Object.keys(entity).find(k => k.startsWith('original') && k.endsWith('Id') && typeof (entity as any)[k] === 'string')
    return originalKey ? (entity as any)[originalKey] : undefined
  }

  private getCanonicalBaseId(entity: { id: string; [key: string]: any }): string {
    const original = this.getOriginalAnyId(entity)
    return original || entity.id
  }

  private entityIdMatchesBaseOrSelf(entity: { id: string; [key: string]: any }, targetId: string): boolean {
    if (!entity || !targetId) return false
    if (entity.id === targetId) return true
    const original = this.getOriginalAnyId(entity)
    return original === targetId
  }

  // ============================================================================
  // FILTER TAB BAR DATA BUILDERS
  // ============================================================================

  /**
   * Builds ProcessName array for FilterTabBar Level 2
   */
  private buildProcessNames(availableProcesses: InheritedProcess[]): ProcessName[] {
    return availableProcesses.map(process => ({
      id: process.processId,
      name: process.processName,
      count: process.ruleCount,
      type: process.processType,
      sourceNodeId: process.sourceNodeId,
      inheritanceLevel: process.inheritanceLevel,
      isInherited: process.isInherited
    }))
  }

  /**
   * Builds ProcessType array for FilterTabBar Level 1
   */
  private buildProcessTypes(availableProcesses: InheritedProcess[]): ProcessType[] {
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
  // CACHE UTILITIES
  // ============================================================================

  /**
   * Generates cache version for invalidation
   */
  private generateCacheVersion(rawData: {
    nodes: NodeEntity[]
    processes: ProcessEntity[]
    rules: RuleEntity[]
    nodeProcesses: NodeProcessJunction[]
    processRules: ProcessRuleJunction[]
    ruleIgnores: RuleIgnoreJunction[]
  }): string {
    // Simple hash of data lengths + timestamps
    const hash = [
      rawData.nodes.length,
      rawData.processes.length,
      rawData.rules.length,
      rawData.nodeProcesses.length,
      rawData.processRules.length,
      rawData.ruleIgnores.length,
      Date.now()
    ].join('-')

    return btoa(hash).slice(0, 16)
  }

  /**
   * Validates if cached data is still fresh
   */
  validateCacheIntegrity(
    cachedData: NodeInheritanceData,
    currentCacheVersion: string
  ): boolean {
    const age = Date.now() - cachedData.computedAt
    const isExpired = age > this.options.cacheTTL
    const isVersionMismatch = cachedData.cacheVersion !== currentCacheVersion

    return !isExpired && !isVersionMismatch
  }
}