/**
 * 🎯 METHOD CATEGORIES - Unified Type to Method Mapping
 * 
 * Single source of truth for mapping unified types to available methods.
 * Fixes the fragmented system causing dict/array method failures.
 */

import type { UnifiedPrimitiveType, UnifiedType } from './unified-types'
import { isUnifiedPrimitive, isBusinessObject, isCollection } from './unified-types'

// =============================================================================
// METHOD CATEGORY DEFINITIONS
// =============================================================================

/**
 * Available method categories in the system
 * These correspond to the categories used in method schema files
 */
export type MethodCategory = 
  | 'string'      // String manipulation methods
  | 'validation'  // Validation methods (mostly string-based)
  | 'formatting'  // Text formatting methods
  | 'encoding'    // Encoding/decoding methods
  | 'property'    // Property access methods
  | 'conversion'  // Type conversion methods
  | 'number'      // Number manipulation methods
  | 'math'        // Mathematical operations
  | 'array'       // Array/list methods
  | 'object'      // Object/dictionary methods
  | 'date'        // Date/time methods
  | 'boolean'     // Boolean operations
  | 'utility'     // General utility methods

// =============================================================================
// UNIFIED TYPE TO METHOD CATEGORIES MAPPING
// =============================================================================

/**
 * BULLETPROOF MAPPING: Unified Type → Method Categories
 * This is the single source of truth that fixes all method lookup issues
 */
export const UNIFIED_TYPE_METHOD_MAPPING: Record<string, MethodCategory[]> = {
  // Direct TypeScript types (new primary mapping)
  'string': [
    'string',      // Core string methods (toUpper, toLower, etc.)
    'validation',  // String validation (isEmail, isNumeric, etc.)
    'formatting',  // String formatting (padLeft, trim, etc.)
    'encoding',    // Encoding methods (toBase64, fromBase64, etc.)
    'property',    // Property access (length, charAt, etc.)
    'conversion'   // String conversion methods
  ],

  'number': [
    'number',      // Core number methods
    'math',        // Mathematical operations
    'conversion'   // Number conversion methods
  ],

  'boolean': [
    'boolean',     // Boolean operations
    'conversion'   // Boolean conversion methods
  ],

  'float': [
    'number',      // Float gets same as number (precision methods)
    'math',        // Mathematical operations
    'conversion'   // Number conversion methods
  ],

  'array': [
    'array',       // Array manipulation methods (filter, map, etc.)
    'utility',     // General utility methods
    'conversion'   // Array conversion methods
  ],

  'dictionary': [
    'object',      // Dictionary methods (keys, values, etc.)
    'utility',     // General utility methods
    'conversion'   // Dictionary conversion methods
  ],

  'object': [
    'object',      // Generic object methods
    'utility',     // General utility methods
    'conversion'   // Object conversion methods
  ],

  'date': [
    'date',        // Date/time methods
    'formatting',  // Date formatting
    'conversion'   // Date conversion methods
  ],

  'undefined': [], // No methods for undefined
  'null': [],      // No methods for null
  'unknown': [],   // No methods for unknown

  // Query result type gets array and object methods
  'queryresult': [
    'array',       // Query results are array-like (rows)
    'object',      // Each row is object-like (columns)
    'property',    // Access to length, columns, etc.
    'utility',     // General utility methods
    'conversion'   // Query result conversion methods
  ],

  // Legacy support (for migration)
  'str': [
    'string', 'validation', 'formatting', 'encoding', 'property', 'conversion'
  ],

  'int': [
    'number', 'math', 'conversion'
  ],

  'bool': [
    'boolean', 'conversion'
  ],

  'list': [
    'array', 'utility', 'conversion'
  ],

  'dict': [
    'object', 'utility', 'conversion'
  ]
}

// =============================================================================
// METHOD LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get method categories for a unified type
 * This is the MAIN function that fixes method lookup issues
 */
export function getMethodCategoriesForType(type: UnifiedType): MethodCategory[] {
  // Handle string types (includes both primitives and business objects)
  if (typeof type === 'string') {
    return UNIFIED_TYPE_METHOD_MAPPING[type] || []
  }

  // Handle collections (arrays of specific types)
  if (isCollection(type)) {
    // Collections always get array methods
    return ['array', 'utility', 'conversion']
  }

  // Handle business objects (user-defined classes)
  if (isBusinessObject(type)) {
    // Business objects are dict-like
    return ['object', 'utility', 'conversion']
  }

  // Unknown types get no methods
  return []
}

/**
 * Check if a type has methods in a specific category
 */
export function typeHasMethodCategory(type: UnifiedType, category: MethodCategory): boolean {
  const categories = getMethodCategoriesForType(type)
  return categories.includes(category)
}

/**
 * Get all available method categories for debugging
 */
export function getAllMethodCategories(): MethodCategory[] {
  return [
    'string', 'validation', 'formatting', 'encoding', 'property', 'conversion',
    'number', 'math', 'array', 'object', 'date', 'boolean', 'utility'
  ]
}

// =============================================================================
// LEGACY TYPE SUPPORT  
// =============================================================================

/**
 * Handle legacy type names for backward compatibility
 * Maps old fragmented type names to unified categories
 */
export function getMethodCategoriesForLegacyType(legacyType: string): MethodCategory[] {
  const legacyMapping: Record<string, MethodCategory[]> = {
    // From old completion-generator.ts
    'str': ['string', 'validation', 'formatting', 'encoding', 'property', 'conversion'],
    'int': ['number', 'math', 'conversion'],
    'float': ['number', 'math', 'conversion'],
    'bool': ['boolean', 'conversion'],
    'array': ['array', 'utility', 'conversion'],
    'object': ['object', 'utility', 'conversion'],
    
    // From old type-detection-factory.ts
    'string': ['string', 'validation', 'formatting', 'encoding', 'property', 'conversion'],
    'number': ['number', 'math', 'conversion'],
    'boolean': ['boolean', 'conversion'],
    'dict': ['object', 'utility', 'conversion'],
    'dictionary': ['object', 'utility', 'conversion'],
    
    // From method schema categories (direct mapping)
    'validation': ['validation'],
    'formatting': ['formatting'],
    'encoding': ['encoding'],
    'property': ['property'],
    'math': ['math'],
    'numeric': ['number', 'math'],
    'collection': ['array'],
    'list': ['array'],
    'utility': ['utility']
  }
  
  return legacyMapping[legacyType] || []
}

// =============================================================================
// DEBUGGING UTILITIES
// =============================================================================

/**
 * Debug function to show type mapping for troubleshooting
 */
export function debugTypeMapping(type: UnifiedType): {
  type: UnifiedType
  categories: MethodCategory[]
  isPrimitive: boolean
  isCollection: boolean
  isBusinessObject: boolean
} {
  return {
    type,
    categories: getMethodCategoriesForType(type),
    isPrimitive: isUnifiedPrimitive(type),
    isCollection: isCollection(type),
    isBusinessObject: isBusinessObject(type)
  }
}

/**
 * Show complete mapping for all primitive types (debugging)
 */
export function debugAllTypeMappings(): Record<string, MethodCategory[]> {
  return UNIFIED_TYPE_METHOD_MAPPING
} 