/**
 * 🎯 COMPLETION GENERATOR - Create UnifiedSchema[] for completion
 * 
 * Generates completion schemas from business object schemas
 * Creates property access completions, method completions
 * Small, focused file for completion schema generation
 */

import { BusinessObjectSchema } from '../../business-objects/types'
import { UnifiedSchema } from '../../types'
import { getDisplayName } from '../../types/unified-types'

// =============================================================================
// MAIN COMPLETION GENERATION
// =============================================================================

/**
 * Create completion schemas from business object schemas
 */
export function createCompletionSchemas(
  businessObjects: BusinessObjectSchema[]
): UnifiedSchema[] {
  const completionSchemas: UnifiedSchema[] = []

  for (const businessObject of businessObjects) {
    // Generate property access completions
    const propertyCompletions = generatePropertyCompletions(businessObject)
    completionSchemas.push(...propertyCompletions)

    // Generate method completions (if any)
    if (businessObject.methods) {
      const methodCompletions = generateMethodCompletions(businessObject)
      completionSchemas.push(...methodCompletions)
    }
  }

  return completionSchemas
}

/**
 * Generate property access completions for a business object
 */
export function generatePropertyCompletions(
  schema: BusinessObjectSchema
): UnifiedSchema[] {
  const completions: UnifiedSchema[] = []

  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const completion: UnifiedSchema = {
      id: `${schema.name.toLowerCase()}-${propName}`,
      name: propName,
      type: 'property',
      category: 'business-object',
      returnType: getDisplayName(propDef.type),
      description: propDef.description,
      examples: propDef.examples || [`${schema.name.toLowerCase()}.${propName}`],
      
      // Property-specific metadata
      parentObject: schema.name,
      propertyType: propDef.type,
      isCollection: propDef.isCollection || false,
      nullable: propDef.nullable,
      readonly: propDef.readonly || false,

      // For completion filtering
      contextFilter: {
        requiresParent: schema.name,
        accessPattern: 'dot-notation'
      }
    }

    // Add collection-specific completions
    if (propDef.isCollection) {
      completion.collectionMethods = [
        'length', 'filter', 'map', 'find', 'forEach', 'slice'
      ]
      completion.examples?.push(
        `${schema.name.toLowerCase()}.${propName}[0]`,
        `${schema.name.toLowerCase()}.${propName}.length`
      )
    }

    completions.push(completion)
  }

  return completions
}

/**
 * Generate method completions for a business object
 */
export function generateMethodCompletions(
  schema: BusinessObjectSchema
): UnifiedSchema[] {
  const completions: UnifiedSchema[] = []

  if (!schema.methods) return completions

  for (const [methodName, methodDef] of Object.entries(schema.methods)) {
    const completion: UnifiedSchema = {
      id: `${schema.name.toLowerCase()}-${methodName}`,
      name: methodName,
      type: 'method',
      category: 'business-object',
      returnType: getDisplayName(methodDef.returnType),
      description: methodDef.description,
      examples: [`${schema.name.toLowerCase()}.${methodName}()`],
      
      // Method-specific metadata
      parentObject: schema.name,
      parameters: methodDef.parameters || [],
      hasParentheses: true,

      // For completion filtering
      contextFilter: {
        requiresParent: schema.name,
        accessPattern: 'method-call'
      }
    }

    completions.push(completion)
  }

  return completions
}

// =============================================================================
// GLOBAL VARIABLE COMPLETIONS
// =============================================================================

/**
 * Generate global variable completions
 */
export function generateGlobalVariableCompletions(
  globalVariables: Record<string, BusinessObjectSchema>
): UnifiedSchema[] {
  const completions: UnifiedSchema[] = []

  for (const [variableName, schema] of Object.entries(globalVariables)) {
    const completion: UnifiedSchema = {
      id: `global-${variableName}`,
      name: variableName,
      type: 'variable',
      category: 'global-variable',
      returnType: schema.name,
      description: `Global ${schema.name} variable: ${schema.description}`,
      examples: [
        variableName,
        `${variableName}.property`,
        `${variableName}.method()`
      ],
      
      // Global variable metadata
      globalVariable: true,
      businessObjectType: schema.name,
      
      // Available properties for chaining
      availableProperties: Object.keys(schema.properties),
      availableMethods: schema.methods ? Object.keys(schema.methods) : []
    }

    completions.push(completion)
  }

  return completions
}

// =============================================================================
// NESTED OBJECT COMPLETIONS
// =============================================================================

/**
 * Generate completions for nested object access
 */
export function generateNestedCompletions(
  businessObjects: BusinessObjectSchema[],
  maxDepth: number = 3
): UnifiedSchema[] {
  const completions: UnifiedSchema[] = []

  // Generate nested property chains
  for (const schema of businessObjects) {
    const nestedCompletions = generateNestedPropertyChains(
      schema, 
      businessObjects, 
      maxDepth
    )
    completions.push(...nestedCompletions)
  }

  return completions
}

/**
 * Generate nested property chains for deep object access
 */
function generateNestedPropertyChains(
  schema: BusinessObjectSchema,
  allSchemas: BusinessObjectSchema[],
  maxDepth: number,
  currentDepth: number = 0,
  currentChain: string[] = []
): UnifiedSchema[] {
  const completions: UnifiedSchema[] = []

  if (currentDepth >= maxDepth) return completions

  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const newChain = [...currentChain, propName]
    
    // Check if property type is another business object
    if (typeof propDef.type === 'string') {
      const relatedSchema = allSchemas.find(s => s.name === propDef.type)
      
      if (relatedSchema) {
        // Generate completion for this nested access
        const completion: UnifiedSchema = {
          id: `nested-${schema.name.toLowerCase()}-${newChain.join('-')}`,
          name: newChain.join('.'),
          type: 'property',
          category: 'nested-property',
          returnType: propDef.type,
          description: `Nested access: ${newChain.join('.')} → ${propDef.type}`,
          examples: [`object.${newChain.join('.')}`],
          
          // Nested property metadata
          propertyChain: newChain,
          rootObject: schema.name,
          targetObject: propDef.type,
          depth: currentDepth + 1
        }

        completions.push(completion)

        // Recursively generate deeper chains
        const deeperCompletions = generateNestedPropertyChains(
          relatedSchema,
          allSchemas,
          maxDepth,
          currentDepth + 1,
          newChain
        )
        completions.push(...deeperCompletions)
      }
    }
  }

  return completions
}

// =============================================================================
// COMPLETION UTILITIES
// =============================================================================

/**
 * Filter completions by context
 */
export function filterCompletionsByContext(
  completions: UnifiedSchema[],
  context: {
    currentType?: string
    accessPattern?: 'dot-notation' | 'method-call' | 'array-access'
    parentObject?: string
  }
): UnifiedSchema[] {
  return completions.filter(completion => {
    // Filter by parent object
    if (context.parentObject && completion.parentObject !== context.parentObject) {
      return false
    }

    // Filter by access pattern
    if (context.accessPattern && completion.contextFilter?.accessPattern !== context.accessPattern) {
      return false
    }

    return true
  })
}

/**
 * Sort completions by relevance
 */
export function sortCompletionsByRelevance(
  completions: UnifiedSchema[],
  context: { query?: string; recentlyUsed?: string[] }
): UnifiedSchema[] {
  return completions.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // Boost recently used items
    if (context.recentlyUsed?.includes(a.name)) scoreA += 10
    if (context.recentlyUsed?.includes(b.name)) scoreB += 10

    // Boost exact query matches
    if (context.query) {
      if (a.name.toLowerCase().startsWith(context.query.toLowerCase())) scoreA += 5
      if (b.name.toLowerCase().startsWith(context.query.toLowerCase())) scoreB += 5
    }

    // Prefer properties over methods for basic access
    if (a.type === 'property') scoreA += 2
    if (b.type === 'property') scoreB += 2

    return scoreB - scoreA
  })
}
