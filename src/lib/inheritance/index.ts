/**
 * Simple Inheritance System - Main Exports
 * 
 * Clean, simplified hierarchical process inheritance system.
 * Uses action-system patterns with no complex caching.
 */

// Main hook and utility functions
export { 
  useNodeInheritance,
  createProcessChangeEvent,
  createRuleChangeEvent,
  createNodeStructureChangeEvent
} from './service'

// Version info for debugging
export const INHERITANCE_SYSTEM_VERSION = '2.0.0-simplified'
export const INHERITANCE_SYSTEM_BUILD = Date.now()