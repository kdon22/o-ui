/**
 * Node Inheritance Service
 * 
 * High-level service interface for the hybrid inheritance system.
 * Provides clean API for components and hooks.
 */

import { HybridCacheManager } from './cache-manager'
import { useActionQuery } from '@/hooks/use-action-api'
import { useQuery } from '@tanstack/react-query'
import type {
  NodeInheritanceData,
  BranchContext,
  InvalidationEvent
} from './types'

// Import schemas for factory-driven approach
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema'
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema'  
import { RULE_SCHEMA } from '@/features/rules/rules.schema'
import { WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema'

// Factory-driven inheritance configuration
const INHERITANCE_SCHEMAS = {
  nodes: NODE_SCHEMA,
  processes: PROCESS_SCHEMA, 
  rules: RULE_SCHEMA,
  workflows: WORKFLOW_SCHEMA
} as const

// Factory function to get junction table names from schemas
function getJunctionTableName(schema: any, relationshipName: string): string {
  const relationships = schema.relationships
  if (relationships && relationships[relationshipName]) {
    return relationships[relationshipName].junction?.tableName
  }
  return relationshipName // fallback to relationship name
}

class NodeInheritanceService {
  private cacheManager: HybridCacheManager
  private static instance: NodeInheritanceService

  private constructor() {
    this.cacheManager = new HybridCacheManager()
  }

  static getInstance(): NodeInheritanceService {
    if (!NodeInheritanceService.instance) {
      NodeInheritanceService.instance = new NodeInheritanceService()
    }
    return NodeInheritanceService.instance
  }

  // ============================================================================
  // MAIN SERVICE METHODS
  // ============================================================================

  /**
   * Gets complete inheritance data for a node
   */
  async getNodeInheritance(
    nodeId: string,
    branchContext: BranchContext
  ): Promise<NodeInheritanceData> {
    console.log('🎯 [NodeInheritanceService] Getting inheritance for:', { 
      nodeId, 
      branchContext: {
        currentBranchId: branchContext.currentBranchId,
        tenantId: branchContext.tenantId,
        userId: branchContext.userId
      }
    })

    // TEMPORARY: Clear cache to test new ancestor chain logic
    console.log('🧹 [NodeInheritanceService] Clearing cache for fresh computation')
    await this.cacheManager.clearAllCaches()

    const rawDataFetcher = () => this.fetchRawInheritanceData(nodeId, branchContext)
    
    const result = await this.cacheManager.getInheritance(
      nodeId,
      rawDataFetcher,
      branchContext
    )

    console.log('✅ [NodeInheritanceService] Inheritance result:', {
      nodeId,
      processCount: result.availableProcesses?.length || 0,
      ruleCount: result.availableRules?.length || 0,
      ancestorChainLength: result.ancestorChain?.length || 0,
      ancestorChain: result.ancestorChain,
      computedAt: result.computedAt,
      cacheVersion: result.cacheVersion,
      timestamp: new Date().toISOString()
    })

    return result
  }

  /**
   * Invalidates inheritance cache when data changes
   */
  async invalidateNodeInheritance(event: InvalidationEvent): Promise<void> {
    const getDescendantNodes = async (nodeId: string) => {
      // TODO: Implement descendant node fetching
      // For now, return empty array - will be enhanced in integration phase
      return []
    }

    await this.cacheManager.invalidateInheritanceChain(event, getDescendantNodes)
  }

  /**
   * Warms cache for multiple nodes
   */
  async warmInheritanceCache(
    nodeIds: string[],
    branchContext: BranchContext
  ): Promise<void> {
    const rawDataFetcher = () => this.fetchRawInheritanceData('', branchContext)
    await this.cacheManager.warmCache(nodeIds, rawDataFetcher, branchContext)
  }

  /**
   * Gets cache performance statistics
   */
  getCacheStats() {
    return this.cacheManager.getCacheStats()
  }

  /**
   * Clears all caches (for testing/debugging)
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clearAllCaches()
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches raw data needed for inheritance computation
   */
  private async fetchRawInheritanceData(
    nodeId: string,
    branchContext: BranchContext
  ) {
    console.log('📡 [InheritanceService] Fetching raw data from IndexedDB for:', nodeId)

    try {
      // Get action client instance (reads from IndexedDB <50ms)
      const { getActionClient } = await import('@/lib/action-client/global-client')
      const actionClient = getActionClient(branchContext.tenantId as string)
      
      // Set branch context for all operations
      actionClient.setBranchContext({
        currentBranchId: branchContext.currentBranchId as string,
        defaultBranchId: branchContext.defaultBranchId as string,
        tenantId: branchContext.tenantId as string,
        userId: (branchContext as any).userId as string,
      })

      // Fetch all required data in parallel from IndexedDB
      // Factory-driven data fetching using schemas
      const [
        nodeDetails,
        processesData,
        rulesData,
        processesWithJunctions,
        rulesWithJunctions,
        // Explicit junction reads (branch-aware, IndexedDB-first)
        nodeProcessesList,
        processRulesList,
        // Direct ruleIgnores junctions (deep ignore resolution later in engine)
        ruleIgnoresList
      ] = await Promise.all([
        // Get node details including hierarchy
        actionClient.executeAction({
          action: `${INHERITANCE_SCHEMAS.nodes.actionPrefix}.read`,
          data: { id: nodeId },
          branchContext
        }),
        
        // Get all processes for the tenant/branch  
        actionClient.executeAction({
          action: `${INHERITANCE_SCHEMAS.processes.actionPrefix}.list`,
          data: { },
          branchContext
        }),
        
        // Get all rules for the tenant/branch
        actionClient.executeAction({
          action: `${INHERITANCE_SCHEMAS.rules.actionPrefix}.list`,
          data: { },
          branchContext
        }),
        
        // Get processes with their node relationships included
        actionClient.executeAction({
          action: `${INHERITANCE_SCHEMAS.processes.actionPrefix}.list`,
          data: { 
            // Branch filtering handled by server via branchContext
            options: {
              include: [getJunctionTableName(INHERITANCE_SCHEMAS.processes, 'nodes')] // Include junction relationships
            }
          },
          branchContext
        }),
        
        // Get rules with their process relationships included  
        actionClient.executeAction({
          action: `${INHERITANCE_SCHEMAS.rules.actionPrefix}.list`,
          data: { 
            // Branch filtering handled by server via branchContext
            options: {
              include: [getJunctionTableName(INHERITANCE_SCHEMAS.rules, 'processes')] // Include junction relationships
            }
          },
          branchContext
        }),
        
        // Direct nodeProcesses junctions
        actionClient.executeAction({
          action: `${getJunctionTableName(INHERITANCE_SCHEMAS.processes, 'nodes')}.list`,
          data: { },
          branchContext
        }),
        // Direct processRules junctions
        actionClient.executeAction({
          action: `${getJunctionTableName(INHERITANCE_SCHEMAS.rules, 'processes')}.list`,
          data: { },
          branchContext
        }),
        
        // Direct nodeProcesses junctions
        actionClient.executeAction({
          action: `${getJunctionTableName(INHERITANCE_SCHEMAS.processes, 'nodes')}.list`,
          data: { },
          branchContext
        }),
        // Direct processRules junctions
        actionClient.executeAction({
          action: `${getJunctionTableName(INHERITANCE_SCHEMAS.rules, 'processes')}.list`,
          data: { },
          branchContext
        }),
        // Direct ruleIgnores junctions (from Rule schema)
        actionClient.executeAction({
          action: `ruleIgnores.list`,
          data: { },
          branchContext
        })
      ])

      // ActionClient returns data directly (no need to parse JSON)

      // Build complete node hierarchy
      console.log('🔍 [InheritanceService] Node details response:', {
        success: nodeDetails.success,
        hasData: !!nodeDetails.data,
        nodeId: nodeId,
        data: nodeDetails.data,
        error: nodeDetails.error,
        timestamp: new Date().toISOString()
      })
      
      const currentNode = nodeDetails.success ? nodeDetails.data : null
      
      // Build complete ancestor chain by traversing parent relationships
      console.log('🔗 [InheritanceService] Building complete ancestor chain for:', {
        nodeId,
        nodeName: currentNode?.name,
        parentId: currentNode?.parentId
      })
      
      let allNodes = currentNode ? [currentNode] : []
      const allNodeIds = [nodeId]
      
      // Traverse the complete parent chain
      let currentParentId = currentNode?.parentId
      const visited = new Set([nodeId]) // Prevent infinite loops
      const maxDepth = 10 // Safety limit
      let depth = 0
      
      while (currentParentId && !visited.has(currentParentId) && depth < maxDepth) {
        console.log(`🔍 [InheritanceService] Fetching ancestor ${depth + 1}:`, currentParentId)
        
        const parentResult = await actionClient.executeAction({
          action: 'node.read',
          data: { id: currentParentId },
          branchContext
        })
        
        if (parentResult.success && parentResult.data) {
          allNodes.push(parentResult.data)
          allNodeIds.push(currentParentId)
          visited.add(currentParentId)
          
          console.log(`✅ [InheritanceService] Found ancestor:`, {
            id: parentResult.data.id,
            name: parentResult.data.name,
            parentId: parentResult.data.parentId
          })
          
          currentParentId = parentResult.data.parentId
          depth++
        } else {
          console.log(`❌ [InheritanceService] Failed to fetch ancestor:`, currentParentId)
          break
        }
      }
      
      if (depth >= maxDepth) {
        console.warn('⚠️ [InheritanceService] Max depth reached, stopping ancestor traversal')
      }
      
      console.log('🏁 [InheritanceService] Complete ancestor chain built:', {
        totalNodes: allNodes.length,
        nodeIds: allNodeIds,
        nodeNames: allNodes.map(n => n.name)
      })

      // Extract data from responses
      console.log('🔍 [InheritanceService] Final rawData preparation:', {
        allNodesCount: allNodes.length,
        allNodes: allNodes.map(n => ({ id: n?.id, idShort: n?.idShort, name: n?.name })),
        nodeId: nodeId,
        timestamp: new Date().toISOString()
      })
      
      // Extract junction data from included relationships
      const extractJunctionData = (entities: any[], junctionField: string) => {
        const junctions: any[] = []
        if (entities && Array.isArray(entities)) {
          entities.forEach(entity => {
            if (entity[junctionField] && Array.isArray(entity[junctionField])) {
              junctions.push(...entity[junctionField])
            }
          })
        }
        return junctions
      }
      
      const processesArray = processesWithJunctions.success ? processesWithJunctions.data : []
      const rulesArray = rulesWithJunctions.success ? rulesWithJunctions.data : []
      
      // Schema-driven junction data extraction
      const nodeProcessesTableName = getJunctionTableName(INHERITANCE_SCHEMAS.processes, 'nodes')
      const processRulesTableName = getJunctionTableName(INHERITANCE_SCHEMAS.rules, 'processes')
      
      // ✅ FIXED: Trust the IndexedDB branch overlay system - it already handles this correctly
      // Don't do manual overlay merging - let the proven IndexedDB system handle it

      // Build base raw data
      const baseNodeProcesses = (nodeProcessesList as any)?.success
        ? (nodeProcessesList as any).data
        : extractJunctionData(processesArray, nodeProcessesTableName);
      const baseProcessRules = (processRulesList as any)?.success
        ? (processRulesList as any).data
        : extractJunctionData(rulesArray, processRulesTableName);

      // ✅ Use the IndexedDB branch overlay data
      const nodeProcessesMerged = baseNodeProcesses;
      const processRulesMerged = baseProcessRules;

      // 🎯 Overlay refinement for nodeProcesses:
      // If a process has a current-branch attachment to ANY node, drop the default-branch attachment(s)
      // This prevents the same process (and its rules) from also appearing under the root/default node.
      const currentBranchId = branchContext.currentBranchId as string;
      const defaultBranchId = branchContext.defaultBranchId as string;
      let nodeProcessesEffective = nodeProcessesMerged || [];
      if (currentBranchId && defaultBranchId && currentBranchId !== defaultBranchId) {
        const currentProcessIds = new Set(
          (nodeProcessesMerged || [])
            .filter((jp: any) => jp?.branchId === currentBranchId)
            .map((jp: any) => jp.processId)
        );
        nodeProcessesEffective = (nodeProcessesMerged || []).filter((jp: any) => {
          const isDefault = jp?.branchId === defaultBranchId;
          const isShadowedByCurrent = currentProcessIds.has(jp?.processId);
          return !(isDefault && isShadowedByCurrent);
        });
      }

      // 🚨 AGGRESSIVE DEBUG: See what junction data we have
      console.log('🔥 [InheritanceService] JUNCTION DEBUG:', {
        nodeProcessesCount: nodeProcessesMerged?.length || 0,
        nodeProcessesEffectiveCount: nodeProcessesEffective?.length || 0,
        processRulesCount: processRulesMerged?.length || 0,
        nodeProcessesPreview: nodeProcessesMerged?.slice(0, 3).map((np: any) => ({
          id: np?.id,
          nodeId: np?.nodeId,
          processId: np?.processId,
          branchId: np?.branchId
        })),
        nodeProcessesEffectivePreview: nodeProcessesEffective?.slice(0, 3).map((np: any) => ({
          id: np?.id,
          nodeId: np?.nodeId,
          processId: np?.processId,
          branchId: np?.branchId
        })),
        processRulesPreview: processRulesMerged?.slice(0, 3).map((pr: any) => ({
          id: pr?.id,
          processId: pr?.processId,
          ruleId: pr?.ruleId,
          branchId: pr?.branchId
        })),
        timestamp: new Date().toISOString()
      });

      const rawData = {
        nodes: allNodes,
        processes: processesData.success ? processesData.data : [],
        rules: rulesData.success ? rulesData.data : [],
        nodeProcesses: nodeProcessesEffective,
        processRules: processRulesMerged,
        ruleIgnores: (ruleIgnoresList as any)?.success
          ? (ruleIgnoresList as any).data
          : []
      }

      console.log('📡 [InheritanceService] Raw data fetched successfully from IndexedDB:', {
        nodes: rawData.nodes.length,
        processes: rawData.processes.length,
        rules: rawData.rules.length,
        nodeProcesses: rawData.nodeProcesses.length,
        processRules: rawData.processRules.length,
        ruleIgnores: rawData.ruleIgnores.length,
        nodeHierarchy: allNodeIds.length
      })

      return rawData

    } catch (error) {
      console.error('❌ [InheritanceService] Error fetching raw data from IndexedDB:', error)
      
      // Return empty data structure on error
      return {
        nodes: [],
        processes: [],
        rules: [],
        nodeProcesses: [],
        processRules: [],
        ruleIgnores: []
      }
    }
  }
}

// ============================================================================
// REACT HOOK INTERFACE
// ============================================================================

/**
 * React hook for accessing node inheritance data
 */
export function useNodeInheritance(nodeId: string, branchContext: BranchContext | null) {
  const service = NodeInheritanceService.getInstance()
  
  const isEnabled = typeof window !== 'undefined' && !!nodeId && !!branchContext && !!branchContext.tenantId && branchContext.tenantId !== 'default'
  
  console.log('🔍 [useNodeInheritance] Query setup:', {
    nodeId,
    branchContext: branchContext ? {
      currentBranchId: branchContext.currentBranchId,
      tenantId: branchContext.tenantId,
      userId: branchContext.userId
    } : null,
    isEnabled,
    enabledReasons: {
      hasWindow: typeof window !== 'undefined',
      hasNodeId: !!nodeId,
      hasBranchContext: !!branchContext,
      hasTenantId: !!branchContext?.tenantId,
      tenantIdNotDefault: branchContext?.tenantId !== 'default'
    },
    timestamp: new Date().toISOString()
  })
  
  return useQuery({
    queryKey: ['nodeInheritance', nodeId, branchContext?.currentBranchId, branchContext?.tenantId],
    queryFn: () => {
      console.log('🚀 [useNodeInheritance] Executing query for:', nodeId)
      return service.getNodeInheritance(nodeId, branchContext!)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    enabled: isEnabled,
    // Keep previous data visible while new node is loading to avoid UI flash/disappear
    placeholderData: (prev) => prev as any,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates invalidation event for process changes
 */
export function createProcessChangeEvent(
  processId: string,
  affectedNodeId: string
): InvalidationEvent {
  return {
    type: 'process_change',
    affectedNodeId,
    processId,
    timestamp: Date.now()
  }
}

/**
 * Creates invalidation event for rule changes
 */
export function createRuleChangeEvent(
  ruleId: string,
  affectedNodeId: string
): InvalidationEvent {
  return {
    type: 'rule_change',
    affectedNodeId,
    ruleId,
    timestamp: Date.now()
  }
}

/**
 * Creates invalidation event for node structure changes
 */
export function createNodeStructureChangeEvent(
  affectedNodeId: string
): InvalidationEvent {
  return {
    type: 'node_structure_change',
    affectedNodeId,
    timestamp: Date.now()
  }
}

// Export singleton instance
export const nodeInheritanceService = NodeInheritanceService.getInstance()
export default nodeInheritanceService