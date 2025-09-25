/**
 * Hybrid Inheritance System Types
 * 
 * Clean, ground-up TypeScript definitions for hierarchical process inheritance.
 * No legacy compatibility - designed for extreme performance and clarity.
 */

// ============================================================================
// CORE INHERITANCE DATA STRUCTURES
// ============================================================================

export interface InheritedProcess {
  /** Process entity ID (simple UUID) */
  processId: string
  /** Process name for display */
  processName: string
  /** Process type for Level 1 filtering */
  processType: string
  /** Which node originally defined this process */
  sourceNodeId: string
  /** Display name of source node */
  sourceNodeName: string
  /** Inheritance depth: 0=direct, 1=parent, 2=grandparent, etc. */
  inheritanceLevel: number
  /** Is this an inherited process (vs directly defined) */
  isInherited: boolean
  /** Number of rules connected to this process */
  ruleCount: number
  /**
   * Branch-aware identity set for this process.
   * Contains the canonical base ID (originalId if present, else id)
   * and all branched IDs whose originalId equals the base ID.
   * Used to match `processRules.processId` across branches.
   */
  relatedProcessIds?: string[]
}

export interface InheritedRule {
  /** Rule entity ID */
  ruleId: string
  /** Rule name */
  ruleName: string
  /** Rule type */
  ruleType: string
  /** Process this rule belongs to */
  processId: string
  /** Process name for display */
  processName: string
  /** Process type for filtering */
  processType: string
  /** Which node originally defined the process */
  sourceNodeId: string
  /** Source node name for tooltips */
  sourceNodeName: string
  /** Inheritance depth */
  inheritanceLevel: number
  /** Is this rule inherited via process inheritance */
  isInherited: boolean
  /** Is this rule ignored at current node */
  isIgnored: boolean
  /** Rule execution order */
  order?: number
  /** Visual styling class */
  displayClass: 'direct' | 'inherited' | 'ignored'
  /** Text color for display */
  textColor?: 'red' | 'blue' | undefined
}

export interface NodeInheritanceData {
  /** Target node ID */
  nodeId: string
  /** Node name for display */
  nodeName: string
  /** Complete node ancestry chain [nodeId, parentId, grandparentId, ...] */
  ancestorChain: string[]
  /** All processes available to this node (direct + inherited) */
  availableProcesses: InheritedProcess[]
  /** All rules available to this node (direct + inherited) */
  availableRules: InheritedRule[]
  /** Process names for FilterTabBar Level 2 */
  processNames: ProcessName[]
  /** Process types for FilterTabBar Level 1 */
  processTypes: ProcessType[]
  /** When this data was computed */
  computedAt: number
  /** Cache version for invalidation */
  cacheVersion: string
}

export interface ProcessName {
  /** Process ID for filtering */
  id: string
  /** Process name for display */
  name: string
  /** Rule count for badges */
  count: number
  /** Process type */
  type: string
  /** Inheritance info */
  sourceNodeId: string
  inheritanceLevel: number
  isInherited: boolean
}

export interface ProcessType {
  /** Process type ID */
  id: string
  /** Process type name */
  name: string
  /** Process IDs of this type */
  processIds: string[]
  /** Total count for badges */
  count: number
}

// ============================================================================
// RAW DATA INTERFACES (from queries)
// ============================================================================

export interface NodeEntity {
  id: string
  name: string
  parentId?: string
  ancestorIds?: string[]
  tenantId: string
  branchId: string
  originalId?: string
}

export interface ProcessEntity {
  id: string
  name: string
  type: string
  tenantId: string
  branchId: string
  originalId?: string
}

export interface RuleEntity {
  id: string
  name: string
  type: string
  tenantId: string
  branchId: string
  originalId?: string
}

export interface NodeProcessJunction {
  nodeId: string
  processId: string
  branchId: string
  tenantId: string
  sequence?: number
  isActive?: boolean
}

export interface ProcessRuleJunction {
  processId: string
  ruleId: string
  branchId: string
  tenantId: string
  order?: number
  isActive?: boolean
}

export interface RuleIgnoreJunction {
  nodeId: string
  ruleId: string
  branchId: string
  tenantId: string
  reason?: string
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

export interface CacheEntry {
  nodeId: string
  data: NodeInheritanceData
  lastAccessed: number
  hitCount: number
}

export interface CacheStats {
  memoryHits: number
  indexedDBHits: number
  computationMisses: number
  totalRequests: number
  averageResponseTime: number
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface InheritanceEngineOptions {
  /** Maximum inheritance depth to traverse */
  maxDepth?: number
  /** Whether to include ignored rules */
  includeIgnored?: boolean
  /** Cache TTL in milliseconds */
  cacheTTL?: number
}

export type BranchContext = import('@/lib/action-client/types').BranchContext

export interface InvalidationEvent {
  type: 'process_change' | 'node_structure_change' | 'rule_change'
  affectedNodeId: string
  processId?: string
  ruleId?: string
  timestamp: number
}