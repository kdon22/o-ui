// Variable Methods Registry - Central management for type-specific methods
// Provides methods for string.toUpper(), number.round(), array.length, etc.

import type { CustomMethod, VariableType } from '../../../types/variable-types'
import { STRING_METHODS } from './string-methods'
import { NUMBER_METHODS } from './number-methods'
import { ARRAY_METHODS } from './array-methods'

// Type-specific method registry
const TYPE_METHODS_REGISTRY = new Map<VariableType, CustomMethod[]>()

// Register all type-specific methods
TYPE_METHODS_REGISTRY.set('string', STRING_METHODS)
TYPE_METHODS_REGISTRY.set('number', NUMBER_METHODS)
TYPE_METHODS_REGISTRY.set('array', ARRAY_METHODS)

// Boolean methods (simple)
const BOOLEAN_METHODS: CustomMethod[] = [
  {
    name: 'toString',
    returnType: 'string',
    description: 'Converts boolean to string',
    example: 'isValid.toString()',
    category: 'boolean'
  },
  {
    name: 'not',
    returnType: 'boolean',
    description: 'Returns opposite boolean value',
    example: 'isActive.not()',
    category: 'boolean'
  }
]

TYPE_METHODS_REGISTRY.set('boolean', BOOLEAN_METHODS)

// Object methods (basic - can be extended)
const OBJECT_METHODS: CustomMethod[] = [
  {
    name: 'hasProperty',
    returnType: 'boolean',
    parameters: [
      { name: 'propertyName', type: 'string' }
    ],
    description: 'Checks if object has property',
    example: 'booking.hasProperty("totalAmount")',
    category: 'object'
  },
  {
    name: 'keys',
    returnType: 'array',
    description: 'Gets all property names',
    example: 'booking.keys()',
    category: 'object'
  }
]

TYPE_METHODS_REGISTRY.set('object', OBJECT_METHODS)

/**
 * Variable Methods Registry API
 */
export class VariableMethodsRegistry {
  /**
   * Get all methods available for a specific variable type
   */
  static getMethodsForType(variableType: VariableType): CustomMethod[] {
    const methods = TYPE_METHODS_REGISTRY.get(variableType)
    console.log(`🔧 [VariableMethodsRegistry] Found ${methods?.length || 0} methods for type: ${variableType}`)
    return methods || []
  }

  /**
   * Get methods for a variable based on its inferred type
   */
  static getMethodsForVariable(variableName: string, variableType: VariableType): CustomMethod[] {
    return this.getMethodsForType(variableType)
  }

  /**
   * Check if a method exists for a variable type
   */
  static hasMethodForType(variableType: VariableType, methodName: string): boolean {
    const methods = this.getMethodsForType(variableType)
    return methods.some(method => method.name === methodName)
  }

  /**
   * Get all available variable types with methods
   */
  static getAvailableTypes(): VariableType[] {
    return Array.from(TYPE_METHODS_REGISTRY.keys())
  }

  /**
   * Register additional methods for a type (for extensibility)
   */
  static registerMethodsForType(variableType: VariableType, methods: CustomMethod[]): void {
    const existing = TYPE_METHODS_REGISTRY.get(variableType) || []
    TYPE_METHODS_REGISTRY.set(variableType, [...existing, ...methods])
    console.log(`🔧 [VariableMethodsRegistry] Registered ${methods.length} additional methods for ${variableType}`)
  }

  /**
   * Get all methods across all types (for debugging)
   */
  static getAllMethods(): Record<string, CustomMethod[]> {
    const result: Record<string, CustomMethod[]> = {}
    for (const [type, methods] of TYPE_METHODS_REGISTRY) {
      result[type as string] = methods
    }
    return result
  }
}

// Convenience exports
export { STRING_METHODS } from './string-methods'
export { NUMBER_METHODS } from './number-methods' 
export { ARRAY_METHODS } from './array-methods'

// VariableMethodsRegistry is already exported above 