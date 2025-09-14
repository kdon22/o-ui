/**
 * 🎯 OFFLINE TYPESCRIPT PARSER - Main exports
 * 
 * Solid, offline-capable TypeScript interface parser
 * No TypeScript compiler dependency - works in browser and offline
 * Integrates with existing schema patterns (HTTP_RESPONSE_OBJECT format)
 */

// =============================================================================
// CORE PARSER EXPORTS
// =============================================================================

export {
  parseInterfacesStatic,
  sortInterfacesByDependencies,
  validateParsedInterfaces
} from './static-interface-parser'

export type {
  ParsedInterface,
  ParsedProperty,
  ReturnObject,
  ParseResult
} from './static-interface-parser'

// =============================================================================
// UTILITY SCHEMA ENHANCEMENT
// =============================================================================

export {
  enhanceUtilitySchema,
  enhanceMultipleUtilitySchemas,
  extractInterfaceSourceFromCode,
  needsEnhancement,
  createMonacoCompletionItems,
  validateEnhancedSchema
} from './utility-schema-enhancer'

export type {
  EnhancedUtilitySchema,
  EnhancementResult
} from './utility-schema-enhancer'

// =============================================================================
// DEMO AND TESTING
// =============================================================================

export {
  demoInterfaceParsing,
  demoSchemaEnhancement,
  demoMonacoCompletion,
  demoCompleteWorkflow,
  testDifferentPatterns
} from './demo-test'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Parse interfaces and enhance utility schema in one call
 */
export function parseAndEnhanceUtility(
  utilitySchema: any,
  utilityCode: string
): {
  success: boolean
  enhancedSchema: any | null
  completionItems: any[]
  errors: string[]
} {
  try {
    // Extract interface source
    const interfaceSource = extractInterfaceSourceFromCode(utilityCode)
    
    if (!interfaceSource) {
      return {
        success: false,
        enhancedSchema: null,
        completionItems: [],
        errors: ['No interfaces found in utility code']
      }
    }
    
    // Enhance schema
    const enhancementResult = enhanceUtilitySchema(utilitySchema, interfaceSource)
    
    if (!enhancementResult.success) {
      return {
        success: false,
        enhancedSchema: null,
        completionItems: [],
        errors: enhancementResult.errors
      }
    }
    
    // Generate completion items
    const completionItems = createMonacoCompletionItems(
      enhancementResult.returnObjects,
      'result'
    )
    
    return {
      success: true,
      enhancedSchema: enhancementResult.enhancedSchema,
      completionItems,
      errors: []
    }
    
  } catch (error) {
    return {
      success: false,
      enhancedSchema: null,
      completionItems: [],
      errors: [`Parse and enhance failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Quick test to verify parser works
 */
export function quickParserTest(): boolean {
  try {
    const testCode = `
interface TestResult {
  value: string;
  count: number;
}
`
    
    const result = parseInterfacesStatic(testCode)
    return result.interfaces.length > 0 && result.errors.length === 0
    
  } catch (error) {
    return false
  }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Check if the parser is ready to use
 */
export function isParserReady(): boolean {
  return quickParserTest()
}

/**
 * Get parser capabilities
 */
export function getParserCapabilities(): {
  offline: boolean
  browserCompatible: boolean
  dependencyFree: boolean
  features: string[]
} {
  return {
    offline: true,
    browserCompatible: true,
    dependencyFree: true,
    features: [
      'Interface parsing',
      'Property extraction',
      'Dependency resolution',
      'Return object generation',
      'Schema enhancement',
      'Monaco completion generation'
    ]
  }
}
