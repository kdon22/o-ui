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
      nodeId,
      rawData.nodes
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
    currentNodeId: string,
    nodes: NodeEntity[]
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
        sourceNodeId: p.sourceNodeId,
        inheritanceLevel: p.inheritanceLevel
      })),
      rulesPreview: rules.slice(0, 5).map(r => ({
        id: r.id,
        name: r.name,
        branchId: r.branchId || 'no-branch'
      })),
      processRulesPreview: processRules.slice(0, 5).map(pr => ({
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
      
      // 🎯 ENTERPRISE FIX: Filter ProcessRule junctions by hierarchy scope
      // Only include rules that should be visible from current node context
      let processRuleConnections = processRules.filter(pr => identitySet.has(pr.processId))
      
      // 🎯 CRITICAL FIX: Filter out rules that shouldn't appear on current node
      // Problem: Rules connected by descendant nodes appear on parent nodes
      // Solution: Only include rules that are appropriate for current node context
      
      // Build ancestor chain for current node to determine hierarchy context
      const currentNodeAncestors = this.getNodeAncestors(currentNodeId, nodes)
      
      processRuleConnections = processRuleConnections.filter(connection => {
        const rule = rules.find(r => this.entityIdMatchesBaseOrSelf(r, connection.ruleId))
        if (!rule) return false
        
        // 🔑 KEY LOGIC: Rule should only appear if:
        // 1. Process is direct to current node (inheritanceLevel = 0), OR  
        // 2. Process is inherited AND rule was connected at current/ancestor level
        
        if (inheritedProcess.inheritanceLevel === 0) {
          // Process is direct to current node - include all its rules
          return true
        } else {
          // Process is inherited - be more selective about which rules to include
          // For now, we'll use a heuristic: don't show rules on parent nodes
          // if the process owner is higher in hierarchy than current node
          const processOwnerLevel = currentNodeAncestors.indexOf(inheritedProcess.sourceNodeId)
          
          // If process owner is not in our ancestor chain, exclude its rules  
          return processOwnerLevel === -1 || processOwnerLevel > 0
        }
      })

      // 🚨 DEBUG: Log what we find for each process
      console.log(`🔍 [InheritanceEngine] Processing rules for process: ${inheritedProcess.processName}`, {
        processId: inheritedProcess.processId,
        identitySet: Array.from(identitySet),
        foundConnections: processRuleConnections.length,
        connectionsPreview: processRuleConnections.map(pr => ({
          ruleId: pr.ruleId,
          processId: pr.processId,
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
          const ruleIsInherited = this.isRuleInherited(rule, inheritedProcess, currentNodeId)

          inheritedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            processId: inheritedProcess.processId,
            processName: inheritedProcess.processName,
            processType: inheritedProcess.processType,
            sourceNodeId: this.getRuleOriginalNodeId(rule, inheritedProcess, currentNodeId),
            sourceNodeName: this.getRuleOriginalNodeName(rule, inheritedProcess, nodes, currentNodeId),
            inheritanceLevel: this.getRuleInheritanceLevel(rule, inheritedProcess, currentNodeId),
            isInherited: ruleIsInherited,
            isIgnored,
            order: connection.order,
            displayClass: isIgnored ? 'ignored' : (ruleIsInherited ? 'inherited' : 'direct'),
            textColor: isIgnored ? 'red' : (ruleIsInherited ? 'blue' : undefined)
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

  /**
   * Get ancestor chain for a node (including the node itself)
   */
  private getNodeAncestors(nodeId: string, nodes: NodeEntity[]): string[] {
    const ancestors: string[] = []
    let currentId = nodeId
    
    while (currentId) {
      ancestors.push(currentId)
      const currentNode = nodes.find(n => n.id === currentId)
      currentId = currentNode?.parentId || ''
    }
    
    return ancestors
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

  // ============================================================================
  // RULE INHERITANCE LOGIC
  // ============================================================================

  /**
   * Get the original node ID where the rule was created
   * Rules should track their creation node, not the process inheritance
   */
  private getRuleOriginalNodeId(rule: RuleEntity, inheritedProcess: InheritedProcess, currentNodeId: string): string {
    // 🎯 ENTERPRISE FIX: Need to determine if this rule should appear on current node
    console.log(`🔍 [getRuleOriginalNodeId] Rule: ${rule.name}`, {
      ruleId: rule.id,
      processName: inheritedProcess.processName,
      processSourceNodeId: inheritedProcess.sourceNodeId,
      processInheritanceLevel: inheritedProcess.inheritanceLevel,
      processIsInherited: inheritedProcess.isInherited,
      currentNodeId
    });
    
    return inheritedProcess.sourceNodeId || currentNodeId;
  }

  /**
   * Get the original node name where the rule was created
   */
  private getRuleOriginalNodeName(rule: RuleEntity, inheritedProcess: InheritedProcess, nodes: NodeEntity[], currentNodeId: string): string {
    const sourceNodeId = this.getRuleOriginalNodeId(rule, inheritedProcess, currentNodeId);
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    return sourceNode?.name || 'Unknown Node';
  }

  /**
   * Get the rule's inheritance level relative to current node
   */
  private getRuleInheritanceLevel(rule: RuleEntity, inheritedProcess: InheritedProcess, currentNodeId: string): number {
    const ruleSourceNodeId = this.getRuleOriginalNodeId(rule, inheritedProcess, currentNodeId);
    return ruleSourceNodeId === currentNodeId ? 0 : inheritedProcess.inheritanceLevel;
  }

  /**
   * Determine if a rule is inherited relative to the current node
   */
  private isRuleInherited(rule: RuleEntity, inheritedProcess: InheritedProcess, currentNodeId: string): boolean {
    const ruleSourceNodeId = this.getRuleOriginalNodeId(rule, inheritedProcess, currentNodeId);
    return ruleSourceNodeId !== currentNodeId; // Rule is inherited if it came from a different node
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