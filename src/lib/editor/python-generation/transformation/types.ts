/**
 * 🏭 TRANSFORMATION PATTERN FACTORY - Core Types
 * 
 * Factory-driven system for handling multi-line business rule constructs
 * that transform into multiple Python lines with complex source mappings.
 */

export interface TransformationPattern {
  id: string
  name: string
  description: string
  
  // Pattern detection
  detector: (line: string, allLines: string[], currentIndex: number) => boolean
  
  // Transformation logic
  transformer: (line: string, allLines: string[], currentIndex: number) => TransformationResult
  
  // Source mapping metadata generation
  generateMappings: (result: TransformationResult, context: TransformationContext) => SpecialMapping[]
}

export interface TransformationResult {
  pythonLines: string[]           // Generated Python code lines
  consumedLines: number           // How many business rule lines were consumed
  metadata: TransformationMetadata // For source mapping and debugging
}

export interface TransformationMetadata {
  type: TransformationType
  businessLineRange: [number, number]  // [start, end] in business rules (1-based)
  pythonLineRange: [number, number]    // [start, end] in Python (1-based, filled by caller)
  specialMappings: SpecialMapping[]    // For break statements, else clauses, etc.
  context: Record<string, any>         // Pattern-specific context data
}

export interface SpecialMapping {
  businessLine: number    // 1-based line number in business rules
  pythonLine: number     // 1-based line number in Python (relative to start)
  type: MappingType
  confidence: number     // 0.0 - 1.0 (1.0 = direct mapping, <1.0 = generated/inserted)
  description?: string   // Human-readable description for debugging
}

export interface TransformationContext {
  businessLines: string[]
  currentPythonLineOffset: number  // Where to start numbering Python lines
  indentLevel: number
  options: TransformationOptions
}

export interface TransformationOptions {
  generateComments?: boolean
  strictMode?: boolean
  debugMode?: boolean
}

// =============================================================================
// TYPE ENUMS - Extensible for future patterns
// =============================================================================

export type TransformationType = 
  | 'if-any'
  | 'for-loop' 
  | 'try-catch'
  | 'switch-case'
  | 'while-loop'
  | 'async-await'
  | 'pattern-match'

export type MappingType =
  | 'direct'           // 1:1 business rule line to Python line
  | 'break-statement'  // Generated break statement
  | 'else-clause'      // Else clause mapping
  | 'loop-header'      // For/while loop header
  | 'condition'        // If condition
  | 'exception-handler' // Catch/except block
  | 'generated'        // Any other generated code

// =============================================================================
// ENHANCED SOURCE MAP TYPES
// =============================================================================

export interface EnhancedSourceMapping {
  businessLine: number
  pythonLine: number
  confidence: number
  type: MappingType
  transformationType?: TransformationType
  description?: string
}

export interface EnhancedSourceMap {
  version: number
  mappings: EnhancedSourceMapping[]
  transformations: TransformationMetadata[]
  businessLines: string[]
  pythonLines: string[]
}

// =============================================================================
// PATTERN REGISTRY TYPES
// =============================================================================

export interface PatternRegistryConfig {
  enabledPatterns: string[]  // Pattern IDs to enable
  debugMode: boolean
  strictMode: boolean
}
