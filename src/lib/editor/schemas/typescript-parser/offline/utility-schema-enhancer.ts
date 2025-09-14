/**
 * 🎯 UTILITY SCHEMA ENHANCER - Enhance user utility schemas with parsed interfaces
 * 
 * Takes parsed TypeScript interfaces and enhances utility schemas
 * Integrates with existing user-utility-registry system
 * Updates returnType and adds returnObject in HTTP_RESPONSE_OBJECT format
 */

import { parseInterfacesStatic, ReturnObject, ParseResult } from './static-interface-parser'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Enhanced utility schema with parsed return types
 */
export interface EnhancedUtilitySchema {
  id: string
  name: string
  type: 'function'
  category: 'user-utilities'
  examples: string[]
  docstring: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  returnType: string  // Updated from 'object' to actual interface name
  returnObject?: ReturnObject  // Added return object definition
  returnObjects?: ReturnObject[]  // All related return objects for dependencies
  description: string
  
  // Original fields preserved
  originalReturnType?: string  // Backup of original return type
  interfaceSource?: string     // Source code of interfaces
  parsedInterfaces?: string[]  // Names of parsed interfaces
}

/**
 * Enhancement result
 */
export interface EnhancementResult {
  success: boolean
  enhancedSchema: EnhancedUtilitySchema | null
  returnObjects: ReturnObject[]
  errors: string[]
  warnings: string[]
}

// =============================================================================
// MAIN ENHANCEMENT FUNCTION
// =============================================================================

/**
 * Enhance utility schema with parsed TypeScript interfaces
 */
export function enhanceUtilitySchema(
  originalSchema: any,
  interfaceSource: string
): EnhancementResult {
  try {
    // Parse interfaces from source
    const parseResult = parseInterfacesStatic(interfaceSource)
    
    if (parseResult.errors.length > 0) {
      return {
        success: false,
        enhancedSchema: null,
        returnObjects: [],
        errors: parseResult.errors,
        warnings: []
      }
    }
    
    // Determine the main return type
    const mainReturnType = determineMainReturnType(parseResult, originalSchema)
    
    if (!mainReturnType) {
      return {
        success: false,
        enhancedSchema: null,
        returnObjects: [],
        errors: ['Could not determine main return type from interfaces'],
        warnings: []
      }
    }
    
    // Find the main return object
    const mainReturnObject = parseResult.returnObjects.find(obj => obj.name === mainReturnType)
    
    if (!mainReturnObject) {
      return {
        success: false,
        enhancedSchema: null,
        returnObjects: [],
        errors: [`Return object not found for type: ${mainReturnType}`],
        warnings: []
      }
    }
    
    // Create enhanced schema
    const enhancedSchema: EnhancedUtilitySchema = {
      ...originalSchema,
      returnType: mainReturnType,
      returnObject: mainReturnObject,
      returnObjects: parseResult.returnObjects,
      originalReturnType: originalSchema.returnType,
      interfaceSource,
      parsedInterfaces: parseResult.interfaces.map(i => i.name)
    }
    
    // Update examples and docstring if needed
    updateSchemaDocumentation(enhancedSchema, mainReturnType)
    
    return {
      success: true,
      enhancedSchema,
      returnObjects: parseResult.returnObjects,
      errors: [],
      warnings: []
    }
    
  } catch (error) {
    return {
      success: false,
      enhancedSchema: null,
      returnObjects: [],
      errors: [`Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    }
  }
}

// =============================================================================
// RETURN TYPE DETERMINATION
// =============================================================================

/**
 * Determine the main return type from parsed interfaces
 */
function determineMainReturnType(parseResult: ParseResult, originalSchema: any): string | null {
  const { interfaces } = parseResult
  
  if (interfaces.length === 0) {
    return null
  }
  
  // Strategy 1: Look for interface matching function name
  const functionName = originalSchema.name
  const matchingInterface = interfaces.find(i => 
    i.name.toLowerCase() === functionName.toLowerCase() ||
    i.name.toLowerCase() === `${functionName}result`.toLowerCase() ||
    i.name.toLowerCase() === `${functionName}response`.toLowerCase()
  )
  
  if (matchingInterface) {
    return matchingInterface.name
  }
  
  // Strategy 2: Look for common return type names
  const commonReturnNames = ['Result', 'Response', 'Output', 'Return']
  for (const commonName of commonReturnNames) {
    const found = interfaces.find(i => i.name === commonName)
    if (found) {
      return found.name
    }
  }
  
  // Strategy 3: Use the last interface (often the main one)
  if (interfaces.length > 0) {
    return interfaces[interfaces.length - 1].name
  }
  
  return null
}

// =============================================================================
// DOCUMENTATION UPDATES
// =============================================================================

/**
 * Update schema documentation with return type information
 */
function updateSchemaDocumentation(schema: EnhancedUtilitySchema, returnType: string): void {
  // Update docstring to mention return type
  if (schema.docstring && !schema.docstring.includes(`**Returns:** ${returnType}`)) {
    // Replace generic "**Returns:** object" with specific type
    schema.docstring = schema.docstring.replace(
      /\*\*Returns:\*\* object/g,
      `**Returns:** ${returnType}`
    )
    
    // If no returns section, add it
    if (!schema.docstring.includes('**Returns:**')) {
      schema.docstring += `\n\n**Returns:** ${returnType}`
    }
  }
  
  // Update examples if they use generic object access
  if (schema.examples) {
    schema.examples = schema.examples.map(example => {
      // If example shows result access, make it more specific
      if (example.includes('result.') && schema.returnObject) {
        const properties = Object.keys(schema.returnObject.properties)
        if (properties.length > 0) {
          // Replace generic property access with actual property
          return example.replace(/result\.\w+/, `result.${properties[0]}`)
        }
      }
      return example
    })
  }
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Enhance multiple utility schemas at once
 */
export function enhanceMultipleUtilitySchemas(
  schemas: any[],
  interfaceSources: Record<string, string>  // schemaId -> interface source
): Record<string, EnhancementResult> {
  const results: Record<string, EnhancementResult> = {}
  
  for (const schema of schemas) {
    const interfaceSource = interfaceSources[schema.id]
    if (interfaceSource) {
      results[schema.id] = enhanceUtilitySchema(schema, interfaceSource)
    } else {
      results[schema.id] = {
        success: false,
        enhancedSchema: null,
        returnObjects: [],
        errors: [`No interface source provided for schema: ${schema.id}`],
        warnings: []
      }
    }
  }
  
  return results
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Extract interface source from utility function code
 */
export function extractInterfaceSourceFromCode(utilityCode: string): string {
  // Look for interface declarations in the utility code
  const interfaceRegex = /(?:export\s+)?interface\s+\w+.*?\{[^}]*\}/gs
  const matches = utilityCode.match(interfaceRegex)
  
  return matches ? matches.join('\n\n') : ''
}

/**
 * Check if utility schema needs enhancement
 */
export function needsEnhancement(schema: any): boolean {
  return (
    schema.returnType === 'object' &&
    !schema.returnObject &&
    schema.category === 'user-utilities'
  )
}

/**
 * Create Monaco completion items from return objects
 */
export function createMonacoCompletionItems(
  returnObjects: ReturnObject[],
  variableName: string = 'result'
): Array<{
  label: string
  kind: string
  insertText: string
  documentation: string
  detail: string
}> {
  const completionItems: Array<{
    label: string
    kind: string
    insertText: string
    documentation: string
    detail: string
  }> = []
  
  for (const returnObject of returnObjects) {
    for (const [propName, propType] of Object.entries(returnObject.properties)) {
      completionItems.push({
        label: `${variableName}.${propName}`,
        kind: 'Property',
        insertText: `${variableName}.${propName}`,
        documentation: `Property of ${returnObject.name}`,
        detail: `${propName}: ${propType}`
      })
    }
  }
  
  return completionItems
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate enhanced schema
 */
export function validateEnhancedSchema(schema: EnhancedUtilitySchema): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required fields
  if (!schema.returnType || schema.returnType === 'object') {
    errors.push('Enhanced schema must have specific returnType')
  }
  
  if (!schema.returnObject) {
    errors.push('Enhanced schema must have returnObject')
  }
  
  // Check return object consistency
  if (schema.returnObject && schema.returnType !== schema.returnObject.name) {
    errors.push('returnType must match returnObject.name')
  }
  
  // Check for empty return objects
  if (schema.returnObject && Object.keys(schema.returnObject.properties).length === 0) {
    warnings.push('Return object has no properties')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
