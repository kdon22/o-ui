/**
 * 🎯 UTR PARSER - Specialized parser for UTR schema
 * 
 * Handles UTR-specific parsing and schema generation
 * Provides convenient wrapper for UTR schema processing
 * Small, focused file for UTR integration
 */

import { parseTypeScriptInterfaces } from '../core/ast-parser'
import { generateBusinessObjectSchemas } from '../core/schema-generator'
import { createCompletionSchemas } from '../generators/completion-generator'
import { registerGlobalVariables, getUTRGlobalMappings } from '../generators/global-variable-generator'
import { 
  TypeScriptParseResult, 
  SchemaGenerationOptions, 
  SchemaGenerationResult 
} from '../core/types'

// =============================================================================
// UTR-SPECIFIC PARSING
// =============================================================================

/**
 * Parse UTR schema file and generate complete business object system
 */
export async function parseUTRSchema(
  utrSchemaSource: string,
  options: Partial<SchemaGenerationOptions> = {}
): Promise<UTRParseResult> {
  try {
    // Set up UTR-specific options
    const utrOptions: SchemaGenerationOptions = {
      globalVariables: getUTRGlobalMappings(),
      includePrivateProperties: false,
      generateMethods: true,
      includeDocumentation: true,
      cacheResults: true,
      ...options
    }

    // Parse TypeScript interfaces
    const parseResult = parseTypeScriptInterfaces(utrSchemaSource, 'utr-schema.ts')
    
    if (parseResult.errors.length > 0) {
      return {
        success: false,
        errors: parseResult.errors,
        parseResult,
        schemaResult: null,
        completionSchemas: [],
        globalVariables: {}
      }
    }

    // Generate business object schemas
    const schemaResult = generateBusinessObjectSchemas(parseResult.interfaces, utrOptions)
    
    // Generate completion schemas
    const completionSchemas = createCompletionSchemas(schemaResult.businessObjects)
    
    // Register global variables
    const globalVariables = registerGlobalVariables(
      schemaResult.businessObjects,
      utrOptions.globalVariables || {}
    )

    return {
      success: true,
      errors: [],
      parseResult,
      schemaResult,
      completionSchemas,
      globalVariables,
      stats: generateUTRStats(schemaResult, globalVariables)
    }

  } catch (error) {
    return {
      success: false,
      errors: [{
        message: `UTR parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { line: 1, column: 1, fileName: 'utr-parser' },
        severity: 'error'
      }],
      parseResult: null,
      schemaResult: null,
      completionSchemas: [],
      globalVariables: {}
    }
  }
}

/**
 * Quick parse UTR schema for development/testing
 */
export function parseUTRSchemaSync(utrSchemaSource: string): UTRParseResult {
  // Synchronous version for development use
  // In production, prefer the async version
  try {
    const parseResult = parseTypeScriptInterfaces(utrSchemaSource, 'utr-schema.ts')
    const schemaResult = generateBusinessObjectSchemas(parseResult.interfaces, {
      globalVariables: getUTRGlobalMappings()
    })
    
    return {
      success: true,
      errors: [],
      parseResult,
      schemaResult,
      completionSchemas: [],
      globalVariables: {}
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        message: `Sync UTR parsing failed: ${error}`,
        location: { line: 1, column: 1, fileName: 'utr-parser' },
        severity: 'error'
      }],
      parseResult: null,
      schemaResult: null,
      completionSchemas: [],
      globalVariables: {}
    }
  }
}

// =============================================================================
// UTR-SPECIFIC UTILITIES
// =============================================================================

/**
 * Get UTR interface names that should be parsed
 */
export function getUTRInterfaceNames(): string[] {
  return [
    'UTR',
    'UTRHeader',
    'NormalizationMetadata',
    'Office',
    'Agent',
    'Passenger',
    'TravelSegment',
    'ServiceRequest',
    'Invoice',
    'InvoiceItem',
    'Remark',
    'AccountingEntry',
    'PaymentMethod',
    'Communication',
    'ProcessingEvent',
    'ContactInfo',
    'Document',
    'Seat',
    'CorporateInfo',
    'FareComponent',
    'Tax',
    'SourceAttribution',
    'CombinationStrategy',
    'TechnicalData',
    'PricingItem'
  ]
}

/**
 * Validate UTR schema completeness
 */
export function validateUTRSchema(result: UTRParseResult): {
  isComplete: boolean
  missingInterfaces: string[]
  recommendations: string[]
} {
  if (!result.success || !result.schemaResult) {
    return {
      isComplete: false,
      missingInterfaces: getUTRInterfaceNames(),
      recommendations: ['Fix parsing errors first']
    }
  }

  const expectedInterfaces = getUTRInterfaceNames()
  const foundInterfaces = result.schemaResult.businessObjects.map(schema => schema.name)
  const missingInterfaces = expectedInterfaces.filter(name => !foundInterfaces.includes(name))

  const recommendations: string[] = []
  if (missingInterfaces.length > 0) {
    recommendations.push(`Add missing interfaces: ${missingInterfaces.join(', ')}`)
  }
  if (foundInterfaces.length < 5) {
    recommendations.push('UTR schema seems incomplete - ensure all major interfaces are defined')
  }

  return {
    isComplete: missingInterfaces.length === 0,
    missingInterfaces,
    recommendations
  }
}

/**
 * Generate UTR-specific statistics
 */
function generateUTRStats(
  schemaResult: SchemaGenerationResult,
  globalVariables: Record<string, any>
): UTRStats {
  const businessObjects = schemaResult.businessObjects
  
  return {
    totalInterfaces: businessObjects.length,
    totalProperties: businessObjects.reduce((sum, schema) => 
      sum + Object.keys(schema.properties).length, 0
    ),
    globalVariables: Object.keys(globalVariables).length,
    largestInterface: businessObjects.reduce((largest, schema) => 
      Object.keys(schema.properties).length > Object.keys(largest.properties || {}).length 
        ? schema : largest
    , businessObjects[0] || { properties: {} }),
    interfacesBySize: businessObjects
      .map(schema => ({
        name: schema.name,
        propertyCount: Object.keys(schema.properties).length
      }))
      .sort((a, b) => b.propertyCount - a.propertyCount)
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Result of UTR schema parsing
 */
export interface UTRParseResult {
  success: boolean
  errors: any[]
  parseResult: TypeScriptParseResult | null
  schemaResult: SchemaGenerationResult | null
  completionSchemas: any[]
  globalVariables: Record<string, any>
  stats?: UTRStats
}

/**
 * UTR parsing statistics
 */
export interface UTRStats {
  totalInterfaces: number
  totalProperties: number
  globalVariables: number
  largestInterface: { name?: string; properties: Record<string, any> }
  interfacesBySize: Array<{ name: string; propertyCount: number }>
}

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Debug UTR parsing results
 */
export function debugUTRParseResult(result: UTRParseResult): void {
  console.group('🎯 UTR Parse Result Debug')
  
  console.log('Success:', result.success)
  console.log('Errors:', result.errors.length)
  
  if (result.stats) {
    console.log('Stats:', result.stats)
  }
  
  if (result.schemaResult) {
    console.log('Business Objects:', result.schemaResult.businessObjects.map(s => s.name))
    console.log('Global Variables:', Object.keys(result.globalVariables))
  }
  
  console.groupEnd()
}
