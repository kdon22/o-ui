/**
 * 🎯 PRIMITIVE TYPE OPERATIONS - Core Type Logic
 * 
 * Focused utilities for working with primitive types in the unified system.
 * Handles type detection, validation, and inference.
 */

import type { UnifiedPrimitiveType, UnifiedType } from './unified-types'
import { isUnifiedPrimitive } from './unified-types'
import { ALL_METHOD_SCHEMAS } from '../methods'

// =============================================================================
// TYPE DETECTION PATTERNS 
// =============================================================================

/**
 * Regex patterns for detecting primitive types from code
 * More precise patterns with proper anchoring to avoid false matches
 */
export const PRIMITIVE_DETECTION_PATTERNS = {
  // Only literal-based and structural detections here (schema-driven methods handled below)
  str: [
    /^([a-zA-Z_]\w*)\s*=\s*["'](.*)["']\s*$/
  ],

  int: [
    /^([a-zA-Z_]\w*)\s*=\s*(-?\d+)\s*$/
  ],

  float: [
    /^([a-zA-Z_]\w*)\s*=\s*(-?\d+\.\d+)\s*$/
  ],

  bool: [
    /^([a-zA-Z_]\w*)\s*=\s*(true|false|True|False|TRUE|FALSE)\s*$/i
  ],

  list: [
    /^([a-zA-Z_]\w*)\s*=\s*\[.*\]\s*$/
  ],

  dict: [
    /^([a-zA-Z_]\w*)\s*=\s*\{.*\}\s*$/
  ],

  date: [
    /^([a-zA-Z_]\w*)\s*=\s*(date|Date|DATE)\s*\(/,
    /^([a-zA-Z_]\w*)\s*=\s*(now|Now|NOW)\s*\(\s*\)\s*$/
  ],

  queryresult: [
    // Handle square bracket table names: SELECT * FROM [Table Name]
    /^([a-zA-Z_]\w*)\s*=\s*(SELECT|select|Select)\s+.*FROM\s+\[([^\]]+)\]/i,
    // Handle regular table names: SELECT * FROM table_name (supports underscores)
    /^([a-zA-Z_]\w*)\s*=\s*(SELECT|select|Select)\s+.*FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i,
    // Handle SELECT without FROM (generic query)
    /^([a-zA-Z_]\w*)\s*=\s*(SELECT|select|Select)\s+/i,
    // Handle query() function calls
    /^([a-zA-Z_]\w*)\s*=\s*(query|Query|QUERY)\(/,
    // Handle results variables (fallback)
    /^([a-zA-Z_]\w*)\s*=\s*(results|Results|RESULTS)/
  ]
} as const

// =============================================================================
// TYPE INFERENCE ENGINE
// =============================================================================

/**
 * Infer primitive type from variable assignment line
 */
export function inferPrimitiveType(variableName: string, codeLine: string): UnifiedPrimitiveType | 'unknown' {
  const trimmedLine = codeLine.trim()
  
  // Try each primitive type pattern
  for (const [type, patterns] of Object.entries(PRIMITIVE_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern)
      if (match && match[1] === variableName) {
        return type as UnifiedPrimitiveType
      }
    }
  }
  
  return 'unknown'
}

/**
 * Detect type with confidence scoring
 */
export interface TypeInference {
  type: UnifiedType
  confidence: number
  source: 'literal' | 'method_chain' | 'pattern_match' | 'sql_query'
  evidence: string
  tableSchema?: string  // 🎯 Table name for query results
}

/**
 * Advanced type inference with confidence scoring
 */
export function inferTypeWithConfidence(variableName: string, codeLine: string): TypeInference {
  const trimmedLine = codeLine.trim()
  
  // High confidence: Direct literal assignments
  const literalPatterns = {
    str: /^([a-zA-Z_]\w*)\s*=\s*["'](.*)["']\s*$/,
    int: /^([a-zA-Z_]\w*)\s*=\s*(-?\d+)\s*$/,
    float: /^([a-zA-Z_]\w*)\s*=\s*(-?\d+\.\d+)\s*$/,
    bool: /^([a-zA-Z_]\w*)\s*=\s*(true|false)\s*$/i,
    list: /^([a-zA-Z_]\w*)\s*=\s*\[.*\]\s*$/,
    dict: /^([a-zA-Z_]\w*)\s*=\s*\{.*\}\s*$/,
  }
  
  // Check literal patterns first (highest confidence)
  for (const [type, patterns] of Object.entries(PRIMITIVE_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern)
      if (match && match[1] === variableName) {
        // Handle SQL queries with special queryrow type
        if (type === 'queryresult') {
          // Extract table name - could be in match[3] or match[4] depending on pattern
          let rawTableName = match[3] || match[4] || ''

          // Validate and sanitize table name
          const tableName = validateAndSanitizeTableName(rawTableName)

          // SELECT returns a LIST of rows. Use queryrows:<table> for the variable's type.
          const queryRowType = `queryrows:${tableName}` as UnifiedType

          return {
            type: queryRowType,
            confidence: 0.95,
            source: 'sql_query',
            evidence: match[0],
            tableSchema: tableName
          }
        }

        // Handle regular types
        return {
          type: type as UnifiedPrimitiveType,
          confidence: 1.0,
          source: 'literal',
          evidence: match[0]
        }
      }
    }
  }
  
  // SQL query patterns are now handled above in PRIMITIVE_DETECTION_PATTERNS
  
  // Medium confidence: Method chain inference (no-paren allowed)
  const methodChainPattern = /^([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\.(\w+)/
  const methodMatch = trimmedLine.match(methodChainPattern)
  if (methodMatch && methodMatch[1] === variableName) {
    const moduleName = methodMatch[2]
    const methodName = methodMatch[3]
    
    // First try module method lookup (e.g., http.get)
    try {
      const { schemaBridge } = require('../../type-system/schema-bridge')
      const moduleReturnType = schemaBridge.getModuleReturnType(moduleName.toLowerCase(), methodName)
      const moduleReturnTypeRef = schemaBridge.getModuleReturnTypeRef(moduleName.toLowerCase(), methodName)

      if (moduleReturnType !== 'unknown') {
        // Convert module return types to unified types
        const primitiveTypeMap: Record<string, UnifiedPrimitiveType> = {
          'string': 'str',
          'number': 'int',
          'boolean': 'bool',
          'array': 'list',
          'object': 'dict',
          'date': 'date'
        }

        // Use returnTypeRef if available (e.g., 'HttpResponse'), otherwise use mapped primitive type
        const unifiedType = moduleReturnTypeRef || primitiveTypeMap[moduleReturnType] || moduleReturnType as UnifiedType

        console.log(`[inferTypeWithConfidence] Module method ${moduleName}.${methodName}: returnType=${moduleReturnType}, returnTypeRef=${moduleReturnTypeRef}, final=${unifiedType}`)

        return {
          type: unifiedType,
          confidence: 0.9, // Higher confidence for module methods
          source: 'method_chain',
          evidence: `Module method: ${moduleName}.${methodName} -> ${unifiedType}`
        }
      }
    } catch (error) {
      console.log(`[inferTypeWithConfidence] Module method lookup failed for ${moduleName}.${methodName}:`, error)
    }
    
    // Fallback to type method lookup
    const inferredType = inferTypeFromMethod(methodName)
    
    if (inferredType !== 'unknown') {
      return {
        type: inferredType,
        confidence: 0.8,
        source: 'method_chain', 
        evidence: `Method: ${methodName}`
      }
    }
  }
  
  // Low confidence: Pattern matching
  const basicType = inferPrimitiveType(variableName, codeLine)
  if (basicType !== 'unknown') {
    return {
      type: basicType,
      confidence: 0.6,
      source: 'pattern_match',
      evidence: trimmedLine
    }
  }
  
  return {
    type: 'unknown',
    confidence: 0.0,
    source: 'pattern_match',
    evidence: 'No pattern matched'
  }
}

// =============================================================================
// METHOD-BASED TYPE INFERENCE
// =============================================================================

/**
 * Infer return type from common method names
 */
function inferTypeFromMethod(methodName: string): UnifiedPrimitiveType | 'unknown' {
  // Look up from method schemas; return the unified primitive if possible
  const schema = (ALL_METHOD_SCHEMAS as any[]).find(s => s.name === methodName)
  if (!schema) return 'unknown'
  const ret = String(schema.returnType || 'unknown')
  // Normalize common JS names to unified primitives
  const map: Record<string, UnifiedPrimitiveType> = {
    string: 'str', number: 'int', boolean: 'bool', array: 'list', object: 'dict', date: 'date',
    str: 'str', int: 'int', bool: 'bool', float: 'float', list: 'list', dict: 'dict'
  }
  return (map[ret] as UnifiedPrimitiveType) || 'unknown'
}

// =============================================================================
// TYPE VALIDATION
// =============================================================================

/**
 * Validate if a value matches the expected primitive type
 */
export function validatePrimitiveValue(value: any, expectedType: UnifiedPrimitiveType): boolean {
  switch (expectedType) {
    case 'str':
      return typeof value === 'string'
    case 'int':
      return typeof value === 'number' && Number.isInteger(value)
    case 'float':
      return typeof value === 'number' && !Number.isInteger(value)
    case 'bool':
      return typeof value === 'boolean'
    case 'list':
      return Array.isArray(value)
    case 'dict':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'date':
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))
    default:
      return false
  }
}

// =============================================================================
// TABLE NAME VALIDATION
// =============================================================================

/**
 * Validate and sanitize table names extracted from SQL queries
 * Prevents malformed types like "queryrow:thanks for this"
 */
function validateAndSanitizeTableName(rawTableName: string): string {
  if (!rawTableName || typeof rawTableName !== 'string') {
    return 'unknown_table'
  }

  // Remove whitespace and newlines
  const sanitized = rawTableName.trim()

  // Check if it's a valid identifier (starts with letter/underscore, contains only alphanumeric/underscore)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
    console.warn(`[TableNameValidation] Invalid table name "${sanitized}", using fallback`)
    return 'unknown_table'
  }

  // Check for reasonable length (avoid extremely long names)
  if (sanitized.length > 100) {
    console.warn(`[TableNameValidation] Table name too long "${sanitized}", truncating`)
    return sanitized.substring(0, 50) + '_truncated'
  }

  return sanitized
}

