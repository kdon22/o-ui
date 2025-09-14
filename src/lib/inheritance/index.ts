/**
 * Hybrid Inheritance System - Main Exports
 * 
 * Clean, ground-up hierarchical process inheritance system.
 * Provides extreme performance with bulletproof reliability.
 */

// Core engine and cache manager
export { NodeInheritanceEngine } from './engine'
export { HybridCacheManager } from './cache-manager'

// High-level service interface
export { 
  useNodeInheritance,
  nodeInheritanceService,
  createProcessChangeEvent,
  createRuleChangeEvent,
  createNodeStructureChangeEvent
} from './service'

// Type definitions
export type {
  // Core data structures
  NodeInheritanceData,
  InheritedProcess,
  InheritedRule,
  ProcessName,
  ProcessType,
  
  // Raw data interfaces
  NodeEntity,
  ProcessEntity,
  RuleEntity,
  NodeProcessJunction,
  ProcessRuleJunction,
  RuleIgnoreJunction,
  
  // Cache interfaces
  CacheEntry,
  CacheStats,
  
  // Service interfaces
  InheritanceEngineOptions,
  BranchContext,
  InvalidationEvent
} from './types'

// Version info for debugging
export const INHERITANCE_SYSTEM_VERSION = '1.0.0-hybrid'
export const INHERITANCE_SYSTEM_BUILD = Date.now()