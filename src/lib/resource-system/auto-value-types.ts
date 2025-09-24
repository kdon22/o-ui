/**
 * AutoValue System Types
 * 
 * Comprehensive type definitions for the schema-driven autoValue system.
 * Supports all autoValue sources found in @features/ schemas.
 */

import type { BranchContext } from '@/lib/session'

// ============================================================================
// CORE CONTEXT TYPES
// ============================================================================

export interface AutoValueContext {
  /** Current tenant ID from session */
  tenantId: string
  
  /** Branch context with currentBranchId, defaultBranchId, userId */
  branchContext: BranchContext
  
  /** User ID from session (convenience accessor) */
  userId: string
  
  /** Parent entity data for computed values (e.g., parent node for level calculation) */
  parentData?: any
  
  /** Operation mode - affects which fields get auto-generated */
  mode: 'create' | 'update'
  
  /** Navigation context for junction creation and parent relationships */
  navigationContext?: {
    parentId?: string
    nodeId?: string
    selectedId?: string
  }
  
  /** Additional context data for specific computations */
  computeContext?: {
    /** For node hierarchy calculations */
    nodeHierarchy?: {
      parentId?: string
      parentLevel?: number
      parentPath?: string
      parentAncestorIds?: string[]
      siblingCount?: number
    }
    
    /** For process/rule ordering */
    ordering?: {
      existingItems?: any[]
      insertPosition?: 'start' | 'end' | number
    }
  }
}

// ============================================================================
// AUTO-VALUE SOURCE TYPES  
// ============================================================================

/**
 * All supported autoValue sources from schemas
 */
export type AutoValueSource = 
  // UUID Generation
  | 'auto.uuid'
  
  // Short ID Generation  
  | 'auto.shortId'
  | 'auto.nodeShortId'
  
  // Timestamp Generation
  | 'auto.timestamp'
  
  // Context Values (from session/branch)
  | 'context.tenantId'
  | 'context.branchId' 
  | 'context.userId'
  | 'context.defaultBranchId'
  
  // Session-based values (legacy support)
  | 'session.user.tenantId'
  | 'session.user.id'
  | 'session.user.branchContext.currentBranchId'
  
  // Navigation Context Values
  | 'navigation.parentId'
  | 'navigation.nodeId'
  | 'navigation.selectedId'
  
  // Computed Node Hierarchy Values
  | 'computed.nodeLevel'
  | 'computed.nodePath'
  | 'computed.ancestorIds'
  | 'computed.sortOrder'
  | 'computed.childCount'
  | 'computed.isLeaf'
  
  // Computed Process/Rule Values
  | 'computed.runOrder'
  | 'computed.executionMode'
  | 'computed.pythonName'
  // Auto aliases
  | 'auto.executionMode'
  
  // Default Values
  | 'default.boolean'
  | 'default.number'
  | 'default.string'
  | 'default.array'

// ============================================================================
// FIELD CONFIGURATION TYPES
// ============================================================================

export interface AutoValueField {
  /** Field name in the schema */
  key: string
  
  /** AutoValue source configuration */
  autoValue: {
    source: AutoValueSource
    /** Optional parameters for the generator */
    params?: Record<string, any>
    /** Only apply in specific modes */
    modes?: ('create' | 'update')[]
    /** Condition function to determine if autoValue should be applied */
    condition?: (context: AutoValueContext, inputData: any) => boolean
  }
}

// ============================================================================
// GENERATOR FUNCTION TYPES
// ============================================================================

export type AutoValueGenerator<T = any> = (
  context: AutoValueContext,
  inputData: any,
  params?: Record<string, any>
) => T | Promise<T>

export interface AutoValueGeneratorRegistry {
  [key: string]: AutoValueGenerator
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface AutoValueResult {
  /** Success flag */
  success: boolean
  
  /** Complete data object with auto-generated values */
  data?: any
  
  /** Error details if generation failed */
  error?: {
    message: string
    field?: string
    source?: AutoValueSource
    originalError?: Error
  }
  
  /** Metadata about what was generated */
  metadata?: {
    /** Fields that were auto-generated */
    generatedFields: string[]
    /** Fields that were skipped (already provided) */
    skippedFields: string[]
    /** Time taken for generation */
    generationTime?: number
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract autoValue fields from a schema
 */
export type ExtractAutoValueFields<T> = {
  [K in keyof T]: T[K] extends { autoValue: infer A } ? A : never
}

/**
 * Node hierarchy computation data
 */
export interface NodeHierarchyData {
  id: string
  parentId: string | null
  level: number
  path: string
  ancestorIds: string[]
  sortOrder: number
  childCount: number
  isLeaf: boolean
}

/**
 * Short ID generation options
 */
export interface ShortIdOptions {
  /** Length of the generated ID */
  length?: number
  /** Character set to use */
  charset?: 'alphanumeric' | 'alphabetic' | 'numeric'
  /** Prefix for the ID */
  prefix?: string
  /** Ensure uniqueness by checking existing values */
  ensureUnique?: boolean
}