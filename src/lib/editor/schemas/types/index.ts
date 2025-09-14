/**
 * 🎯 UNIFIED TYPE SYSTEM - Clean Exports
 * 
 * Single entry point for the bulletproof unified type system.
 * Import everything you need from here.
 */

// =============================================================================
// CORE TYPE EXPORTS
// =============================================================================

// Main type definitions
export type {
  UnifiedType,
  UnifiedPrimitiveType,
  BusinessObjectType,
  UnifiedCollectionType,
  UnifiedEnumType
} from './unified-types'

// Type utilities and guards
export {
  isUnifiedPrimitive,
  isBusinessObject,
  isCollection,
  isEnum,
  getDisplayName
} from './unified-types'

// =============================================================================
// TYPE INFERENCE EXPORTS  
// =============================================================================

// Type detection and inference
export type { TypeInference } from './primitive-types'
export {
  PRIMITIVE_DETECTION_PATTERNS,
  inferPrimitiveType,
  inferTypeWithConfidence
} from './primitive-types'

// =============================================================================
// METHOD CATEGORY EXPORTS
// =============================================================================

// Method categories and lookups  
export type { MethodCategory } from './method-categories'
export {
  getMethodCategoriesForType,
  typeHasMethodCategory,
  getAllMethodCategories,
  debugTypeMapping,
  debugAllTypeMappings
} from './method-categories'

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

// Import needed types for debug function
import type { UnifiedType } from './unified-types'
import { getMethodCategoriesForType } from './method-categories'

/**
 * Debug helper to show what's happening with type resolution
 */
export function debugUnifiedTypeSystem(inputType: string): {
  inputType: string
  unifiedType: UnifiedType
  categories: string[]
  isValid: boolean
} {
  // 🎯 NO LEGACY! Direct unified type usage
  const unifiedType = inputType as UnifiedType
  const categories = getMethodCategoriesForType(unifiedType)
  
  return {
    inputType,
    unifiedType,
    categories,
    isValid: unifiedType === inputType
  }
} 