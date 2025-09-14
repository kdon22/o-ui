// Parameter validation utilities for enhanced IntelliSense
// Provides runtime validation and IntelliSense suggestions for complex parameter types

import type { DetailedTypeDefinition, ParameterSchema } from '../types'
import { validateHttpHeaders } from '../modules/http.module'

// Registry of validation functions
const VALIDATOR_REGISTRY: Record<string, (value: any) => boolean | string> = {
  validateHttpHeaders
}

/**
 * Validates a parameter value against its schema definition
 */
export function validateParameter(
  value: any, 
  schema: ParameterSchema
): { isValid: boolean; error?: string; suggestions?: string[] } {
  
  // Handle primitive types
  if (typeof schema.type === 'string') {
    return validatePrimitiveType(value, schema.type)
  }
  
  // Handle detailed type definitions
  const detailedType = schema.type as DetailedTypeDefinition
  
  // Run custom validator if provided
  if (detailedType.validation?.validator) {
    const validator = VALIDATOR_REGISTRY[detailedType.validation.validator]
    if (validator) {
      const result = validator(value)
      if (result !== true) {
        return { 
          isValid: false, 
          error: typeof result === 'string' ? result : detailedType.validation.errorMessage,
          suggestions: schema.suggestions 
        }
      }
    }
  }
  
  // Validate structure
  const structureResult = validateStructure(value, detailedType)
  if (!structureResult.isValid) {
    return { ...structureResult, suggestions: schema.suggestions }
  }
  
  return { isValid: true, suggestions: schema.suggestions }
}

/**
 * Validates primitive type values
 */
function validatePrimitiveType(value: any, type: string): { isValid: boolean; error?: string } {
  switch (type) {
    case 'string':
      return { isValid: typeof value === 'string' || value === undefined }
    case 'number':
      return { isValid: typeof value === 'number' || value === undefined }
    case 'boolean':
      return { isValid: typeof value === 'boolean' || value === undefined }
    case 'array':
      return { isValid: Array.isArray(value) || value === undefined }
    case 'object':
      return { isValid: (typeof value === 'object' && !Array.isArray(value)) || value === undefined }
    default:
      return { isValid: true }
  }
}

/**
 * Validates detailed type structure
 */
function validateStructure(
  value: any, 
  type: DetailedTypeDefinition
): { isValid: boolean; error?: string } {
  
  if (!value) return { isValid: true } // Handle optional/undefined values
  
  // Validate base type first
  const baseResult = validatePrimitiveType(value, type.baseType)
  if (!baseResult.isValid) {
    return baseResult
  }
  
  // Structure-specific validation
  switch (type.structure) {
    case 'key-value':
      return validateKeyValueStructure(value, type)
    case 'array-of-objects':
      return validateArrayOfObjectsStructure(value, type)
    case 'specific-keys':
      return validateSpecificKeysStructure(value, type)
    default:
      return { isValid: true }
  }
}

/**
 * Validates key-value pair structure (like HTTP headers)
 */
function validateKeyValueStructure(
  value: any, 
  type: DetailedTypeDefinition
): { isValid: boolean; error?: string } {
  
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { isValid: false, error: 'Must be an object with key-value pairs' }
  }
  
  for (const [key, val] of Object.entries(value)) {
    // Validate key type
    if (type.keyType && !validatePrimitiveType(key, type.keyType).isValid) {
      return { isValid: false, error: `Key "${key}" must be of type ${type.keyType}` }
    }
    
    // Validate value type
    if (type.valueType && !validatePrimitiveType(val, type.valueType).isValid) {
      return { isValid: false, error: `Value for key "${key}" must be of type ${type.valueType}` }
    }
    
    // Check allowed keys
    if (type.allowedKeys && !type.allowedKeys.includes(key)) {
      return { 
        isValid: false, 
        error: `"${key}" is not a recognized header. Suggested headers: ${type.allowedKeys.slice(0, 3).join(', ')}`
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Validates array of objects structure
 */
function validateArrayOfObjectsStructure(
  value: any, 
  type: DetailedTypeDefinition
): { isValid: boolean; error?: string } {
  
  if (!Array.isArray(value)) {
    return { isValid: false, error: 'Must be an array of objects' }
  }
  
  for (let i = 0; i < value.length; i++) {
    const item = value[i]
    if (typeof item !== 'object' || Array.isArray(item)) {
      return { isValid: false, error: `Item at index ${i} must be an object` }
    }
  }
  
  return { isValid: true }
}

/**
 * Validates objects with specific required keys
 */
function validateSpecificKeysStructure(
  value: any, 
  type: DetailedTypeDefinition
): { isValid: boolean; error?: string } {
  
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { isValid: false, error: 'Must be an object' }
  }
  
  if (type.allowedKeys) {
    const missingKeys = type.allowedKeys.filter(key => !(key in value))
    if (missingKeys.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required keys: ${missingKeys.join(', ')}` 
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Get IntelliSense suggestions for a parameter
 */
export function getParameterSuggestions(schema: ParameterSchema): string[] {
  const suggestions: string[] = []
  
  // Add explicit suggestions
  if (schema.suggestions) {
    suggestions.push(...schema.suggestions)
  }
  
  // Add examples from detailed type
  if (typeof schema.type === 'object' && schema.type.examples) {
    schema.type.examples.forEach(example => {
      suggestions.push(JSON.stringify(example, null, 2))
    })
  }
  
  // Add placeholder if available
  if (schema.placeholder) {
    suggestions.push(schema.placeholder)
  }
  
  return suggestions
}

/**
 * Get parameter completion items for Monaco
 */
export function getParameterCompletionItems(
  schema: ParameterSchema,
  position: { line: number; column: number }
) {
  const suggestions = getParameterSuggestions(schema)
  
  return suggestions.map((suggestion, index) => ({
    label: `${schema.name} suggestion ${index + 1}`,
    kind: 25, // Monaco CompletionItemKind.Snippet
    insertText: suggestion,
    documentation: schema.description,
    detail: typeof schema.type === 'string' ? schema.type : schema.type.baseType,
    sortText: `0${index}` // Ensure our suggestions appear first
  }))
}