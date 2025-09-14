/**
 * 🎯 SCHEMA GENERATOR - Convert parsed interfaces to BusinessObjectSchema
 * 
 * Transforms parsed TypeScript interfaces into completion system schemas
 * Generates property definitions, method signatures, relationships
 * Small, focused file for schema transformation
 */

import { 
  ParsedInterface, 
  SchemaGenerationOptions, 
  SchemaGenerationResult 
} from './types'
import { 
  BusinessObjectSchema, 
  PropertyDefinition, 
  PropertyMap 
} from '../../business-objects/types'
import { getDisplayName } from '../../types/unified-types'

// =============================================================================
// MAIN SCHEMA GENERATION
// =============================================================================

/**
 * Generate BusinessObjectSchema[] from parsed interfaces
 */
export function generateBusinessObjectSchemas(
  interfaces: ParsedInterface[],
  options: SchemaGenerationOptions = {}
): SchemaGenerationResult {
  const businessObjects: BusinessObjectSchema[] = []
  const globalVariables: Record<string, BusinessObjectSchema> = {}
  const errors: any[] = []

  try {
    // Generate schema for each interface
    for (const parsedInterface of interfaces) {
      const schema = createBusinessObjectSchema(parsedInterface, options)
      if (schema) {
        businessObjects.push(schema)
      }
    }

    // Generate global variable mappings
    if (options.globalVariables) {
      for (const [variableName, interfaceName] of Object.entries(options.globalVariables)) {
        const schema = businessObjects.find(s => s.name === interfaceName)
        if (schema) {
          globalVariables[variableName] = schema
        }
      }
    }

    return {
      businessObjects,
      globalVariables,
      completionSchemas: [], // Will be filled by completion generator
      errors
    }

  } catch (error) {
    errors.push({
      message: `Schema generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      location: { line: 1, column: 1, fileName: 'schema-generator' },
      severity: 'error'
    })

    return {
      businessObjects: [],
      globalVariables: {},
      completionSchemas: [],
      errors
    }
  }
}

/**
 * Create BusinessObjectSchema from ParsedInterface
 */
function createBusinessObjectSchema(
  parsedInterface: ParsedInterface,
  options: SchemaGenerationOptions
): BusinessObjectSchema | null {
  try {
    const { name, properties, documentation } = parsedInterface

    // Generate property definitions
    const propertyMap = generatePropertyDefinitions(properties, options)

    // Create business object schema
    const schema: BusinessObjectSchema = {
      name,
      properties: propertyMap,
      description: documentation || `Business object: ${name}`,
      isUserDefined: true,
      sourceLocation: {
        line: parsedInterface.location.line,
        column: parsedInterface.location.column
      }
    }

    // Add methods if enabled
    if (options.generateMethods && parsedInterface.methods.length > 0) {
      schema.methods = generateMethodDefinitions(parsedInterface.methods, options)
    }

    return schema

  } catch (error) {
    console.warn(`Failed to create schema for ${parsedInterface.name}: ${error}`)
    return null
  }
}

// =============================================================================
// PROPERTY GENERATION
// =============================================================================

/**
 * Generate PropertyDefinition[] from interface properties
 */
function generatePropertyDefinitions(
  properties: any[],
  options: SchemaGenerationOptions
): PropertyMap {
  const propertyMap: PropertyMap = {}

  for (const prop of properties) {
    const propertyDef = createPropertyDefinition(prop, options)
    if (propertyDef) {
      propertyMap[prop.name] = propertyDef
    }
  }

  return propertyMap
}

/**
 * Create PropertyDefinition from interface property
 */
function createPropertyDefinition(
  property: any,
  options: SchemaGenerationOptions
): PropertyDefinition | null {
  try {
    const { name, unifiedType, optional, readonly, documentation } = property

    // Check if we should include private properties
    if (!options.includePrivateProperties && name.startsWith('_')) {
      return null
    }

    // Determine if this is a collection
    const isCollection = typeof unifiedType === 'object' && unifiedType.type === 'collection'
    const elementType = isCollection ? unifiedType.elementType : undefined

    const propertyDef: PropertyDefinition = {
      name,
      type: unifiedType,
      nullable: optional,
      description: documentation || `Property: ${name} (${getDisplayName(unifiedType)})`,
      readonly: readonly || false,
      isCollection,
      elementType
    }

    // Add examples based on type
    propertyDef.examples = generatePropertyExamples(name, unifiedType)

    return propertyDef

  } catch (error) {
    console.warn(`Failed to create property definition for ${property.name}: ${error}`)
    return null
  }
}

/**
 * Generate example values for property based on type
 */
function generatePropertyExamples(name: string, type: any): string[] {
  const examples: string[] = []

  if (typeof type === 'string') {
    switch (type) {
      case 'string':
        examples.push(`"${name.toLowerCase()}"`, `"example ${name}"`)
        break
      case 'number':
        examples.push('123', '0', '42')
        break
      case 'boolean':
        examples.push('true', 'false')
        break
      case 'date':
        examples.push('"2024-01-15"', '"2024-01-15T10:30:00Z"')
        break
      default:
        // Business object type
        examples.push(`${name}.property`)
        break
    }
  } else if (typeof type === 'object' && type.type === 'collection') {
    examples.push(`${name}[0]`, `${name}.length`, `${name}.filter()`)
  }

  return examples
}

// =============================================================================
// METHOD GENERATION (Future)
// =============================================================================

/**
 * Generate method definitions (placeholder for future use)
 */
function generateMethodDefinitions(
  methods: any[],
  options: SchemaGenerationOptions
): Record<string, any> {
  // Placeholder - can be implemented when method parsing is added
  return {}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate generated schema
 */
export function validateGeneratedSchema(schema: BusinessObjectSchema): boolean {
  try {
    // Basic validation
    if (!schema.name || typeof schema.name !== 'string') {
      return false
    }

    if (!schema.properties || typeof schema.properties !== 'object') {
      return false
    }

    // Validate each property
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      if (!propDef.name || !propDef.type) {
        return false
      }
    }

    return true

  } catch (error) {
    return false
  }
}

/**
 * Get schema statistics for debugging
 */
export function getSchemaStats(schemas: BusinessObjectSchema[]): {
  totalSchemas: number
  totalProperties: number
  averagePropertiesPerSchema: number
} {
  const totalSchemas = schemas.length
  const totalProperties = schemas.reduce((sum, schema) => 
    sum + Object.keys(schema.properties).length, 0
  )
  const averagePropertiesPerSchema = totalSchemas > 0 ? 
    Math.round(totalProperties / totalSchemas) : 0

  return {
    totalSchemas,
    totalProperties,
    averagePropertiesPerSchema
  }
}
