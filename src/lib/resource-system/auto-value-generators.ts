/**
 * AutoValue Generators
 * 
 * Individual generator functions for each autoValue source type.
 * Schema-driven, context-aware, and easily extensible.
 */

import type { 
  AutoValueGenerator, 
  AutoValueGeneratorRegistry,
  AutoValueContext,
  NodeHierarchyData,
  ShortIdOptions
} from './auto-value-types'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a short ID (like "ABC123" or "NZGJTX8")
 */
function generateShortId(options: ShortIdOptions = {}): string {
  const {
    length = 7,
    charset = 'alphanumeric',
    prefix = '',
    ensureUnique = false
  } = options

  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric: '0123456789'
  }

  const chars = charsets[charset]
  let result = prefix

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // TODO: If ensureUnique is true, check against existing values
  // This would require a database lookup which we can implement later
  
  return result
}

/**
 * Generate a Python-friendly name from a display name
 */
function generatePythonName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .replace(/^_+|_+$/g, '')     // Remove leading/trailing underscores
    .replace(/_+/g, '_')         // Collapse multiple underscores
}

/**
 * Calculate node hierarchy data
 */
function calculateNodeHierarchy(
  context: AutoValueContext,
  inputData: any
): NodeHierarchyData {
  const { computeContext } = context
  const nodeHierarchy = computeContext?.nodeHierarchy || {}

  // Calculate level (parent level + 1, or 0 for root)
  const level = nodeHierarchy.parentLevel !== undefined 
    ? nodeHierarchy.parentLevel + 1 
    : 0

  // Calculate path (parent path + current name, or just name for root)
  const nodeName = inputData.name || 'Unnamed'
  const path = nodeHierarchy.parentPath 
    ? `${nodeHierarchy.parentPath}/${nodeName}`
    : `/${nodeName}`

  // Calculate ancestor IDs (parent's ancestors + parent ID)
  const ancestorIds = nodeHierarchy.parentId
    ? [...(nodeHierarchy.parentAncestorIds || []), nodeHierarchy.parentId]
    : []

  // Calculate sort order (based on sibling count)
  const sortOrder = nodeHierarchy.siblingCount || 0

  // Calculate other properties
  const childCount = 0 // New nodes start with no children
  const isLeaf = true   // New nodes are initially leaves

  return {
    id: inputData.id || '', // Will be set by UUID generator
    parentId: nodeHierarchy.parentId || null,
    level,
    path,
    ancestorIds,
    sortOrder,
    childCount,
    isLeaf
  }
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================

/**
 * Generate UUID using crypto.randomUUID()
 */
const generateUUID: AutoValueGenerator<string> = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate short ID
 */
const generateShortIdValue: AutoValueGenerator<string> = (context, inputData, params) => {
  return generateShortId(params as ShortIdOptions)
}

/**
 * Generate node-specific short ID (like N4B7X2)
 */
const generateNodeShortId: AutoValueGenerator<string> = () => {
  return generateShortId({
    length: 6,
    charset: 'alphanumeric',
    prefix: 'N'
  })
}

/**
 * Generate current timestamp
 */
const generateTimestamp: AutoValueGenerator<string> = () => {
  return new Date().toISOString()
}

/**
 * Get tenant ID from context
 */
const getContextTenantId: AutoValueGenerator<string> = (context) => {
  return context.tenantId
}

/**
 * Get current branch ID from context
 */
const getContextBranchId: AutoValueGenerator<string> = (context) => {
  return (context.branchContext as any)?.currentBranchId
}

/**
 * Get default branch ID from context
 */
const getContextDefaultBranchId: AutoValueGenerator<string> = (context) => {
  return (context.branchContext as any)?.defaultBranchId
}

/**
 * Get tenant ID from session context (legacy session.user.tenantId)
 */
const getSessionTenantId: AutoValueGenerator<string> = (context) => {
  return context.tenantId
}

/**
 * Get current branch ID from session context (legacy session.user.branchContext.currentBranchId)
 */
const getSessionBranchId: AutoValueGenerator<string> = (context) => {
  return (context.branchContext as any)?.currentBranchId
}

/**
 * Get user ID from context
 */
const getContextUserId: AutoValueGenerator<string> = (context) => {
  return context.userId
}

/**
 * Compute node level based on parent hierarchy
 */
const computeNodeLevel: AutoValueGenerator<number> = (context, inputData) => {
  const hierarchy = calculateNodeHierarchy(context, inputData)
  return hierarchy.level
}

/**
 * Compute node path based on parent hierarchy
 * Returns array of path segments for Prisma String[] field
 */
const computeNodePath: AutoValueGenerator<string[]> = (context, inputData) => {
  const hierarchy = calculateNodeHierarchy(context, inputData)
  // Convert "/Finance/Accounting" to ["Finance", "Accounting"]
  return hierarchy.path.split('/').filter(segment => segment.length > 0)
}

/**
 * Compute ancestor IDs array based on parent hierarchy
 */
const computeAncestorIds: AutoValueGenerator<string[]> = (context, inputData) => {
  const hierarchy = calculateNodeHierarchy(context, inputData)
  return hierarchy.ancestorIds
}

/**
 * Compute sort order based on siblings
 */
const computeSortOrder: AutoValueGenerator<number> = (context, inputData) => {
  const hierarchy = calculateNodeHierarchy(context, inputData)
  return hierarchy.sortOrder
}

/**
 * Compute child count (starts at 0 for new nodes)
 */
const computeChildCount: AutoValueGenerator<number> = () => {
  return 0
}

/**
 * Compute isLeaf flag (new nodes are initially leaves)
 */
const computeIsLeaf: AutoValueGenerator<boolean> = () => {
  return true
}

/**
 * Compute run order for rules/processes
 */
const computeRunOrder: AutoValueGenerator<number> = (context, inputData) => {
  const { ordering } = context.computeContext || {}
  
  if (ordering?.insertPosition === 'start') {
    return 0
  } else if (ordering?.insertPosition === 'end') {
    return (ordering.existingItems?.length || 0)
  } else if (typeof ordering?.insertPosition === 'number') {
    return ordering.insertPosition
  }
  
  // Default: append to end
  return (ordering?.existingItems?.length || 0)
}

/**
 * Compute execution mode based on run order
 */
const computeExecutionMode: AutoValueGenerator<string> = (context, inputData) => {
  const runOrder = inputData.runOrder || 0
  return runOrder === 0 ? 'SYNC' : 'ASYNC'
}

/**
 * Generate Python name from display name
 */
const computePythonName: AutoValueGenerator<string> = (context, inputData) => {
  const displayName = inputData.name || inputData.title || 'unnamed'
  return generatePythonName(displayName)
}

/**
 * Generate tableName from name field using snake_case conversion
 */
const computeTableName: AutoValueGenerator<string> = (context, inputData) => {
  // During updates, if name is not provided, don't regenerate tableName
  // This prevents overwriting existing tableName with 'unnamed_table'
  if (context.mode === 'update' && !inputData.name) {
    return undefined; // Return undefined to indicate no value should be set
  }

  // If name is missing but tableName exists (update scenario), preserve existing tableName
  if (!inputData.name && inputData.tableName) {
    return inputData.tableName
  }

  const displayName = inputData.name || 'unnamed_table'
  return generatePythonName(displayName)
}

/**
 * Default boolean value
 */
const defaultBoolean: AutoValueGenerator<boolean> = (context, inputData, params) => {
  return params?.defaultValue ?? false
}

/**
 * Default number value
 */
const defaultNumber: AutoValueGenerator<number> = (context, inputData, params) => {
  return params?.defaultValue ?? 0
}

/**
 * Default string value
 */
const defaultString: AutoValueGenerator<string> = (context, inputData, params) => {
  return params?.defaultValue ?? ''
}

/**
 * Default array value
 */
const defaultArray: AutoValueGenerator<any[]> = (context, inputData, params) => {
  return params?.defaultValue ?? []
}

// ============================================================================
// NAVIGATION CONTEXT GENERATORS
// ============================================================================

/**
 * Get parentId from navigation context
 */
const getNavigationParentId: AutoValueGenerator<string | null> = (context) => {
  console.log('🔍 [AutoValue] getNavigationParentId called:', {
    hasNavigationContext: !!context.navigationContext,
    navigationContext: context.navigationContext,
    parentId: context.navigationContext?.parentId,
    timestamp: new Date().toISOString()
  });
  return context.navigationContext?.parentId || null
}

/**
 * Get nodeId from navigation context
 */
const getNavigationNodeId: AutoValueGenerator<string | null> = (context) => {
  return context.navigationContext?.nodeId || null
}

/**
 * Get selectedId from navigation context
 */
const getNavigationSelectedId: AutoValueGenerator<string | null> = (context) => {
  return context.navigationContext?.selectedId || null
}

// ============================================================================
// GENERATOR REGISTRY
// ============================================================================

/**
 * Registry of all autoValue generators
 * Maps autoValue sources to their generator functions
 */
export const autoValueGenerators: AutoValueGeneratorRegistry = {
  // UUID Generation
  'auto.uuid': generateUUID,
  
  // Short ID Generation
  'auto.shortId': generateShortIdValue,
  'auto.nodeShortId': generateNodeShortId,
  
  // Timestamp Generation
  'auto.timestamp': generateTimestamp,
  
  // Context Values
  'context.tenantId': getContextTenantId,
  'context.branchId': getContextBranchId,
  'context.defaultBranchId': getContextDefaultBranchId,
  'context.userId': getContextUserId,
  
  // Session-based values (legacy support)
  'session.user.tenantId': getSessionTenantId,
  'session.user.id': getContextUserId,
  'session.user.branchContext.currentBranchId': getSessionBranchId,
  
  // Navigation Context Values
  'navigation.parentId': getNavigationParentId,
  'navigation.nodeId': getNavigationNodeId,
  'navigation.selectedId': getNavigationSelectedId,
  
  // Computed Node Hierarchy Values
  'computed.nodeLevel': computeNodeLevel,
  'computed.nodePath': computeNodePath,
  'computed.ancestorIds': computeAncestorIds,
  'computed.sortOrder': computeSortOrder,
  'computed.childCount': computeChildCount,
  'computed.isLeaf': computeIsLeaf,
  
  // Auto Hierarchy Values (aliases for schema compatibility)
  'auto.hierarchyPath': computeNodePath,
  'auto.hierarchyAncestors': computeAncestorIds,
  
  // Computed Process/Rule Values
  'computed.runOrder': computeRunOrder,
  'computed.executionMode': computeExecutionMode,
  'computed.pythonName': computePythonName,
  'computed.tableNameFromName': computeTableName,
  // Auto aliases for business rules
  'auto.executionMode': computeExecutionMode,
  
  // Default Values
  'default.boolean': defaultBoolean,
  'default.number': defaultNumber,
  'default.string': defaultString,
  'default.array': defaultArray,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a generator exists for a given source
 */
export function hasGenerator(source: string): boolean {
  return source in autoValueGenerators
}

/**
 * Get a generator function by source
 */
export function getGenerator(source: string): AutoValueGenerator | undefined {
  return autoValueGenerators[source]
}

/**
 * Register a new generator (for extensibility)
 */
export function registerGenerator(source: string, generator: AutoValueGenerator): void {
  autoValueGenerators[source] = generator
}

/**
 * Get all available generator sources
 */
export function getAvailableSources(): string[] {
  return Object.keys(autoValueGenerators)
}