/**
 * 🎯 TRANSFORMATION SYSTEM - Monaco-Style Architecture
 * 
 * Simplified system using Monaco-style indentation that mirrors how
 * Monaco Editor handles code generation and indentation.
 */

export { transformationFactory, TransformationPatternFactory } from './transformation-pattern-factory'
export { generateEnhancedSourceMap, findBusinessLineForPythonLine, findPythonLineForBusinessLine } from './enhanced-source-map-generator'
export { TransformationValidationFactory } from './factories/transformation-validation-factory'

// Simple indentation system (replaces complex factories)
export { SimpleIndentation } from '../indentation-create'
export type {
  TransformationPattern,
  TransformationResult,
  TransformationMetadata,
  SpecialMapping,
  TransformationContext,
  TransformationOptions,
  TransformationType,
  MappingType,
  EnhancedSourceMapping,
  EnhancedSourceMap,
  PatternRegistryConfig
} from './types'

// Pattern exports for future expansion
export { IfAnyPattern } from './patterns/if-any-pattern'
