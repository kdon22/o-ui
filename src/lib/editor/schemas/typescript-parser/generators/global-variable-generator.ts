/**
 * 🎯 GLOBAL VARIABLE GENERATOR - Register global business variables
 * 
 * Creates global variable mappings (utr → UTR type)
 * Integrates with existing business object registry
 * Small, focused file for global variable management
 */

import { BusinessObjectSchema } from '../../business-objects/types'

// =============================================================================
// GLOBAL VARIABLE REGISTRATION
// =============================================================================

/**
 * Register global variables with business object registry
 */
export function registerGlobalVariables(
  businessObjects: BusinessObjectSchema[],
  globalMappings: Record<string, string>
): Record<string, BusinessObjectSchema> {
  const registeredVariables: Record<string, BusinessObjectSchema> = {}

  for (const [variableName, interfaceName] of Object.entries(globalMappings)) {
    const schema = createGlobalVariableSchema(variableName, interfaceName, businessObjects)
    if (schema) {
      registeredVariables[variableName] = schema
    }
  }

  return registeredVariables
}

/**
 * Create global variable schema from interface name
 */
export function createGlobalVariableSchema(
  variableName: string,
  interfaceName: string,
  businessObjects: BusinessObjectSchema[]
): BusinessObjectSchema | null {
  // Find the business object schema by interface name
  const baseSchema = businessObjects.find(schema => schema.name === interfaceName)
  
  if (!baseSchema) {
    console.warn(`No business object found for interface: ${interfaceName}`)
    return null
  }

  // Create a global variable schema based on the interface schema
  const globalSchema: BusinessObjectSchema = {
    ...baseSchema,
    name: variableName, // Use variable name instead of interface name
    description: `Global ${interfaceName} variable: ${baseSchema.description}`,
    isUserDefined: true,
    
    // Add global variable metadata
    globalVariable: true,
    originalInterfaceName: interfaceName,
    
    // Enhance properties with global context
    properties: enhancePropertiesForGlobalAccess(baseSchema.properties, variableName)
  }

  return globalSchema
}

// =============================================================================
// PROPERTY ENHANCEMENT
// =============================================================================

/**
 * Enhance properties for global variable access
 */
function enhancePropertiesForGlobalAccess(
  properties: Record<string, any>,
  variableName: string
): Record<string, any> {
  const enhancedProperties: Record<string, any> = {}

  for (const [propName, propDef] of Object.entries(properties)) {
    enhancedProperties[propName] = {
      ...propDef,
      // Update examples to use global variable name
      examples: propDef.examples?.map((example: string) => 
        example.replace(/^\w+\./, `${variableName}.`)
      ) || [`${variableName}.${propName}`],
      
      // Add global access context
      globalAccess: true,
      globalVariableName: variableName
    }
  }

  return enhancedProperties
}

// =============================================================================
// PREDEFINED GLOBAL MAPPINGS
// =============================================================================

/**
 * Common global variable mappings for travel industry
 */
export const COMMON_GLOBAL_MAPPINGS = {
  // UTR (Universal Travel Record)
  'utr': 'UTR',
  
  // Common business objects (can be extended)
  'passenger': 'Passenger',
  'booking': 'Booking',
  'customer': 'Customer',
  'itinerary': 'Itinerary'
} as const

/**
 * Get default global mappings for UTR schema
 */
export function getUTRGlobalMappings(): Record<string, string> {
  return {
    'utr': 'UTR'
  }
}

// =============================================================================
// VALIDATION & UTILITIES
// =============================================================================

/**
 * Validate global variable mapping
 */
export function validateGlobalMapping(
  variableName: string,
  interfaceName: string,
  businessObjects: BusinessObjectSchema[]
): { valid: boolean; error?: string } {
  // Check variable name format
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
    return {
      valid: false,
      error: `Invalid variable name: ${variableName}. Must be a valid JavaScript identifier.`
    }
  }

  // Check if interface exists
  const interfaceExists = businessObjects.some(schema => schema.name === interfaceName)
  if (!interfaceExists) {
    return {
      valid: false,
      error: `Interface not found: ${interfaceName}`
    }
  }

  return { valid: true }
}

/**
 * Get global variable statistics
 */
export function getGlobalVariableStats(
  globalVariables: Record<string, BusinessObjectSchema>
): {
  totalVariables: number
  totalProperties: number
  variablesByType: Record<string, number>
} {
  const totalVariables = Object.keys(globalVariables).length
  const totalProperties = Object.values(globalVariables).reduce(
    (sum, schema) => sum + Object.keys(schema.properties).length,
    0
  )

  const variablesByType: Record<string, number> = {}
  for (const schema of Object.values(globalVariables)) {
    const typeName = schema.originalInterfaceName || schema.name
    variablesByType[typeName] = (variablesByType[typeName] || 0) + 1
  }

  return {
    totalVariables,
    totalProperties,
    variablesByType
  }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Create completion-ready global variable definitions
 */
export function createCompletionGlobalVariables(
  globalVariables: Record<string, BusinessObjectSchema>
): Array<{
  name: string
  type: string
  description: string
  properties: string[]
  examples: string[]
}> {
  return Object.entries(globalVariables).map(([variableName, schema]) => ({
    name: variableName,
    type: schema.originalInterfaceName || schema.name,
    description: schema.description || `Global ${schema.name} variable`,
    properties: Object.keys(schema.properties),
    examples: [
      variableName,
      `${variableName}.${Object.keys(schema.properties)[0] || 'property'}`,
      `${variableName}.${Object.keys(schema.properties)[1] || 'method'}()`
    ]
  }))
}

/**
 * Generate TypeScript declarations for global variables
 */
export function generateTypeScriptDeclarations(
  globalVariables: Record<string, BusinessObjectSchema>
): string {
  const declarations: string[] = []

  declarations.push('// Auto-generated global variable declarations')
  declarations.push('declare global {')

  for (const [variableName, schema] of Object.entries(globalVariables)) {
    const interfaceName = schema.originalInterfaceName || schema.name
    declarations.push(`  const ${variableName}: ${interfaceName}`)
  }

  declarations.push('}')
  declarations.push('')
  declarations.push('export {}')

  return declarations.join('\n')
}
