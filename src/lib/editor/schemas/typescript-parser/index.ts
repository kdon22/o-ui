/**
 * 🎯 TYPESCRIPT PARSER - Main exports
 * 
 * Single entry point for all TypeScript interface parsing functionality
 * Provides clean API for converting TypeScript interfaces to completion schemas
 */

// =============================================================================
// CORE PARSING EXPORTS
// =============================================================================

// Main parsing functions
export { parseTypeScriptInterfaces } from './core/ast-parser'
export { mapTypeScriptType } from './core/type-mapper'
export { generateBusinessObjectSchemas } from './core/schema-generator'

// Type definitions
export type {
  ParsedInterface,
  InterfaceProperty,
  InterfaceMethod,
  TypeScriptParseResult,
  SchemaGenerationOptions,
  SchemaGenerationResult,
  TypeMappingContext,
  TypeMappingResult
} from './core/types'

// =============================================================================
// GENERATOR EXPORTS
// =============================================================================

// Completion generation
export { 
  createCompletionSchemas,
  generatePropertyCompletions,
  generateMethodCompletions,
  generateGlobalVariableCompletions,
  filterCompletionsByContext,
  sortCompletionsByRelevance
} from './generators/completion-generator'

// Global variable generation
export {
  registerGlobalVariables,
  createGlobalVariableSchema,
  getUTRGlobalMappings,
  validateGlobalMapping,
  createCompletionGlobalVariables,
  generateTypeScriptDeclarations,
  COMMON_GLOBAL_MAPPINGS
} from './generators/global-variable-generator'

// =============================================================================
// UTR-SPECIFIC EXPORTS
// =============================================================================

// UTR parsing utilities
export {
  parseUTRSchema,
  parseUTRSchemaSync,
  getUTRInterfaceNames,
  validateUTRSchema,
  debugUTRParseResult
} from './utils/utr-parser'

export type {
  UTRParseResult,
  UTRStats
} from './utils/utr-parser'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Parse any TypeScript interface file and generate complete schema system
 */
export async function parseAndRegisterInterfaces(
  sourceCode: string,
  options: {
    fileName?: string
    globalVariables?: Record<string, string>
    includePrivateProperties?: boolean
    generateMethods?: boolean
  } = {}
): Promise<{
  success: boolean
  businessObjects: any[]
  globalVariables: Record<string, any>
  completionSchemas: any[]
  errors: any[]
}> {
  try {
    // Parse interfaces
    const parseResult = parseTypeScriptInterfaces(
      sourceCode, 
      options.fileName || 'schema.ts'
    )

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        businessObjects: [],
        globalVariables: {},
        completionSchemas: [],
        errors: parseResult.errors
      }
    }

    // Generate schemas
    const schemaResult = generateBusinessObjectSchemas(parseResult.interfaces, {
      globalVariables: options.globalVariables,
      includePrivateProperties: options.includePrivateProperties,
      generateMethods: options.generateMethods
    })

    // Generate completions
    const completionSchemas = createCompletionSchemas(schemaResult.businessObjects)

    // Register global variables
    const globalVariables = registerGlobalVariables(
      schemaResult.businessObjects,
      options.globalVariables || {}
    )

    return {
      success: true,
      businessObjects: schemaResult.businessObjects,
      globalVariables,
      completionSchemas,
      errors: []
    }

  } catch (error) {
    return {
      success: false,
      businessObjects: [],
      globalVariables: {},
      completionSchemas: [],
      errors: [{
        message: `Interface parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { line: 1, column: 1, fileName: options.fileName || 'schema.ts' },
        severity: 'error'
      }]
    }
  }
}

/**
 * Quick setup for UTR schema parsing
 */
export async function setupUTRCompletion(utrSchemaSource: string) {
  return parseUTRSchema(utrSchemaSource, {
    globalVariables: getUTRGlobalMappings(),
    includePrivateProperties: false,
    generateMethods: true,
    includeDocumentation: true
  })
}

/**
 * Validate and debug parsed schema
 */
export function validateParsedSchema(result: any): {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
} {
  const warnings: string[] = []
  const recommendations: string[] = []

  if (!result.success) {
    warnings.push('Parsing failed')
    recommendations.push('Check TypeScript syntax and interface definitions')
    return { isValid: false, warnings, recommendations }
  }

  if (result.businessObjects.length === 0) {
    warnings.push('No business objects generated')
    recommendations.push('Ensure interfaces are properly defined and exported')
  }

  if (Object.keys(result.globalVariables).length === 0) {
    warnings.push('No global variables registered')
    recommendations.push('Add globalVariables mapping to options')
  }

  if (result.completionSchemas.length === 0) {
    warnings.push('No completion schemas generated')
    recommendations.push('Check business object properties and methods')
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations
  }
}
