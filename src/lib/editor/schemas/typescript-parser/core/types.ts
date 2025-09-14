/**
 * 🎯 TYPESCRIPT PARSER TYPES - Core type definitions
 * 
 * Defines all types used by the TypeScript interface parser system
 * Small, focused type definitions for parsing workflow
 */

import * as ts from 'typescript'
import { UnifiedType } from '../../types/unified-types'
import { BusinessObjectSchema } from '../../business-objects/types'

// =============================================================================
// PARSED INTERFACE TYPES
// =============================================================================

/**
 * Parsed TypeScript interface representation
 */
export interface ParsedInterface {
  name: string
  properties: InterfaceProperty[]
  methods: InterfaceMethod[]
  extends: string[]
  location: SourceLocation
  documentation?: string
}

/**
 * Parsed interface property
 */
export interface InterfaceProperty {
  name: string
  type: ts.TypeNode
  unifiedType: UnifiedType
  optional: boolean
  readonly: boolean
  documentation?: string
  location: SourceLocation
}

/**
 * Parsed interface method
 */
export interface InterfaceMethod {
  name: string
  parameters: MethodParameter[]
  returnType: ts.TypeNode
  unifiedReturnType: UnifiedType
  documentation?: string
  location: SourceLocation
}

/**
 * Method parameter definition
 */
export interface MethodParameter {
  name: string
  type: ts.TypeNode
  unifiedType: UnifiedType
  optional: boolean
  defaultValue?: string
}

/**
 * Source location information
 */
export interface SourceLocation {
  line: number
  column: number
  fileName: string
}

// =============================================================================
// PARSE RESULT TYPES
// =============================================================================

/**
 * Result of parsing TypeScript interfaces
 */
export interface TypeScriptParseResult {
  interfaces: ParsedInterface[]
  errors: ParseError[]
  warnings: ParseWarning[]
  sourceFile: ts.SourceFile
  typeChecker: ts.TypeChecker
}

/**
 * Parse error information
 */
export interface ParseError {
  message: string
  location: SourceLocation
  severity: 'error' | 'warning'
  code?: string
}

/**
 * Parse warning information
 */
export interface ParseWarning {
  message: string
  location: SourceLocation
  suggestion?: string
}

// =============================================================================
// SCHEMA GENERATION TYPES
// =============================================================================

/**
 * Options for schema generation
 */
export interface SchemaGenerationOptions {
  globalVariables?: Record<string, string>  // variableName → interfaceName
  includePrivateProperties?: boolean
  generateMethods?: boolean
  includeDocumentation?: boolean
  cacheResults?: boolean
}

/**
 * Result of schema generation
 */
export interface SchemaGenerationResult {
  businessObjects: BusinessObjectSchema[]
  globalVariables: Record<string, BusinessObjectSchema>
  completionSchemas: any[]  // UnifiedSchema[] - avoiding circular import
  errors: ParseError[]
}

// =============================================================================
// TYPE MAPPING TYPES
// =============================================================================

/**
 * Type mapping context for complex type resolution
 */
export interface TypeMappingContext {
  typeChecker: ts.TypeChecker
  sourceFile: ts.SourceFile
  currentInterface?: string
  visitedTypes: Set<string>
}

/**
 * Type mapping result
 */
export interface TypeMappingResult {
  unifiedType: UnifiedType
  dependencies: string[]  // Other interfaces this type depends on
  isComplex: boolean      // Whether this is a complex nested type
}

// =============================================================================
// CACHE TYPES
// =============================================================================

/**
 * Cache entry for parsed interfaces
 */
export interface ParseCacheEntry {
  sourceHash: string
  timestamp: number
  result: TypeScriptParseResult
  schemas: BusinessObjectSchema[]
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean
  maxAge: number      // milliseconds
  maxEntries: number
}
