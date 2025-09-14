/**
 * 🎯 UNIFIED TYPE SYSTEM - Master Type Definitions
 * 
 * Single source of truth for ALL type operations across the editor.
 * Replaces fragmented type systems with consistent business-friendly types.
 */

// =============================================================================
// CORE UNIFIED TYPES (Business-Friendly Names)
// =============================================================================

/**
 * Primitive data types - business-friendly names that users understand
 */
export type UnifiedPrimitiveType =
  | 'string'      // Text data
  | 'number'      // Whole numbers
  | 'boolean'     // True/false values
  | 'float'       // Decimal numbers (separate from number)
  | 'date'        // Date/time values
  | 'dictionary'  // Key-value objects
  | 'array'       // Arrays/collections
  | 'undefined'   // Undefined values
  | 'null'        // Null values
  | 'unknown'     // Unknown types
  | 'object'      // Generic objects

  // Legacy support (for migration)
  | 'str'         // Legacy: use 'string'
  | 'int'         // Legacy: use 'number'
  | 'bool'        // Legacy: use 'boolean'
  | 'dict'        // Legacy: use 'dictionary'
  | 'list'        // Legacy: use 'array'
  | 'queryresult' // SQL query results with rows and columns

/**
 * User-defined business class names (dynamic)
 * Examples: 'Passenger', 'Booking', 'Customer'
 */
export type BusinessObjectType = string

/**
 * Collection syntax for business objects
 * Examples: '<Passenger>', '<str>', '<int>'
 */
export interface UnifiedCollectionType {
  type: 'collection'
  elementType: UnifiedType
  syntax: string  // e.g. '<Passenger>'
}

/**
 * Enum types for business choices
 */
export interface UnifiedEnumType {
  type: 'enum'
  name: string
  values: string[]
}

/**
 * Master unified type - ALL types flow through this
 */
export type UnifiedType = 
  | UnifiedPrimitiveType
  | BusinessObjectType  
  | UnifiedCollectionType
  | UnifiedEnumType
  | 'unknown'

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

/**
 * Check if type is a primitive
 */
export function isUnifiedPrimitive(type: UnifiedType): type is UnifiedPrimitiveType {
  return typeof type === 'string' && [
    'str', 'int', 'bool', 'float', 'date', 'dict', 'list', 'queryresult'
  ].includes(type)
}

/**
 * Check if type is a user-defined business object
 */
export function isBusinessObject(type: UnifiedType): type is BusinessObjectType {
  return typeof type === 'string' && 
         !isUnifiedPrimitive(type) && 
         type !== 'unknown' &&
         typeof type === 'string'
}

/**
 * Check if type is a collection
 */
export function isCollection(type: UnifiedType): type is UnifiedCollectionType {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'collection'
}

/**
 * Check if type is an enum
 */
export function isEnum(type: UnifiedType): type is UnifiedEnumType {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'enum'
}

// =============================================================================
// TYPE CONVERSION UTILITIES
// =============================================================================



/**
 * Convert unified type to display name for UI
 */
export function getDisplayName(type: UnifiedType): string {
  if (typeof type === 'string') {
    const displayMap: Record<string, string> = {
      // New direct types
      'string': 'Text',
      'number': 'Number',
      'boolean': 'True/False',
      'float': 'Decimal',
      'date': 'Date',
      'dictionary': 'Dictionary',
      'array': 'Array',
      'object': 'Object',
      'undefined': 'Undefined',
      'null': 'Null',
      'unknown': 'Unknown',
      'queryresult': 'Query Results',

      // Legacy support
      'str': 'Text',
      'int': 'Number',
      'bool': 'True/False',
      'dict': 'Dictionary',
      'list': 'Array'
    }
    return displayMap[type] || type
  }
  
  if (isCollection(type)) {
    return `List of ${getDisplayName(type.elementType)}`
  }
  
  if (isEnum(type)) {
    return `Choice (${type.values.join('|')})`
  }
  
  return 'Unknown'
}

/**
 * Get JavaScript-compatible type for code generation
 */
export function toJavaScriptType(type: UnifiedType): string {
  if (typeof type === 'string') {
    const jsMap: Record<string, string> = {
      // New direct types
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'float': 'number',
      'date': 'Date',
      'dictionary': 'object',
      'array': 'Array',
      'object': 'object',
      'undefined': 'undefined',
      'null': 'null',
      'unknown': 'any',
      'queryresult': 'QueryResult',

      // Legacy support
      'str': 'string',
      'int': 'number',
      'bool': 'boolean',
      'dict': 'object',
      'list': 'Array'
    }
    return jsMap[type] || type
  }

  if (isCollection(type)) {
    return `Array<${toJavaScriptType(type.elementType)}>`
  }

  return 'any'
} 