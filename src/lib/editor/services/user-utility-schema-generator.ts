// User Utility Schema Generator - Convert UTILITY rules to UnifiedSchema format
// Enables perfect IntelliSense for user-defined functions alongside built-in modules

import type { UnifiedSchema, PrimitiveType, ReturnType } from '../schemas/types'
import type { Rule } from '@/features/rules/types'
import type { UtilityParameter } from './utility-service'

export class UserUtilitySchemaGenerator {
  /**
   * Generate complete UnifiedSchema from user utility rule
   * This schema will be stored in Rule.schema field for IntelliSense
   */
  generateSchema(rule: Rule, parameters: UtilityParameter[], returnType: string): UnifiedSchema {
    return {
      // Core identification
      id: `utility-${this.toKebabCase(rule.name)}`,
      name: this.toCamelCase(rule.name),
      type: 'function', // 🎯 NEW: User functions are type 'function'
      category: 'user-utilities',
      
      // No Python generation needed - user functions are direct calls
      // pythonGenerator: undefined (optional for user functions)
      // pythonImports: undefined (optional for user functions)
      
      // Function details
      returnType: this.mapReturnType(returnType),
      description: rule.description || `User-defined utility: ${rule.name}`,
      
      // Convert parameters to schema format
      parameters: parameters.map(param => ({
        name: param.name,
        type: this.mapParameterType(param.type),
        required: param.required,
        description: param.description || `${param.name} parameter`
      })),
      
      // Generate usage examples
      examples: this.generateExamples(rule.name, parameters),
      
      // Documentation
      docstring: this.generateDocstring(rule, parameters, returnType)
    }
  }

  /**
   * Convert utility rule name to camelCase function name
   * "Calculate Discount" → "calculateDiscount"
   */
  private toCamelCase(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join('')
  }

  /**
   * Convert name to kebab-case for unique IDs
   * "Calculate Discount" → "calculate-discount"
   */
  private toKebabCase(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  /**
   * Map UI return types to schema return types
   * Supports both primitive types and custom business object types
   */
  private mapReturnType(returnType: string): ReturnType {
    const typeMap: Record<string, PrimitiveType> = {
      'string': 'string',
      'number': 'number',
      'float': 'float', // 🎯 PRESERVE: Keep float distinct for precise IntelliSense
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array',
      'dict': 'dict',
      'dictionary': 'dict' // Alternative naming
    }
    
    // Return mapped primitive type if it exists, otherwise preserve custom type name
    // This allows custom business object types like 'Customer', 'Booking', 'Passenger'
    return typeMap[returnType.toLowerCase()] || returnType
  }

  /**
   * Map UI parameter types to schema primitive types
   * For parameters, we map custom types to 'object' since the schema expects PrimitiveType
   */
  private mapParameterType(type: string): PrimitiveType {
    const typeMap: Record<string, PrimitiveType> = {
      'string': 'string',
      'number': 'number',
      'float': 'float', // 🎯 PRESERVE: Keep float distinct for precise IntelliSense
      'boolean': 'boolean', 
      'object': 'object',
      'array': 'array',
      'dict': 'object', // Maps to object for parameter compatibility  
      'dictionary': 'object' // Alternative naming
    }
    
    return typeMap[type.toLowerCase()] || 'object' // Default to object for custom class names
  }

  /**
   * Generate usage examples for the function
   */
  private generateExamples(ruleName: string, parameters: UtilityParameter[]): string[] {
    const functionName = this.toCamelCase(ruleName)
    const examples: string[] = []
    
    if (parameters.length === 0) {
      examples.push(`${functionName}()`)
    } else {
      // Basic example with parameter names
      const paramNames = parameters.map(p => p.name).join(', ')
      examples.push(`${functionName}(${paramNames})`)
      
      // Example with sample values based on types
      const sampleValues = parameters.map(p => this.getSampleValue(p.type)).join(', ')
      examples.push(`${functionName}(${sampleValues})`)
    }
    
    return examples
  }

  /**
   * Get sample values for different parameter types
   * 🎯 DYNAMIC: No hardcoded business objects - infers from type name
   */
  private getSampleValue(type: string): string {
    const primitiveTypes: Record<string, string> = {
      'string': '"sample text"',
      'number': '100',
      'float': '3.14',
      'boolean': 'true',
      'date': 'today',
      'object': 'data',
      'array': 'items',
      'dict': 'dataMap'
    }
    
    // Return primitive sample or dynamically convert type name to camelCase variable
    return primitiveTypes[type.toLowerCase()] || this.toCamelCase(type)
  }

  /**
   * Generate rich docstring for hover documentation
   */
  private generateDocstring(rule: Rule, parameters: UtilityParameter[], returnType: string): string {
    const functionName = this.toCamelCase(rule.name)
    const description = rule.description || `User-defined utility function: ${rule.name}`
    
    let docstring = `**${functionName}** - ${description}\n\n`
    
    // Parameters section
    if (parameters.length > 0) {
      docstring += '**Parameters:**\n'
      parameters.forEach(param => {
        const required = param.required ? ' (required)' : ' (optional)'
        const desc = param.description || `${param.name} parameter`
        docstring += `• **${param.name}**: ${param.type}${required} - ${desc}\n`
      })
      docstring += '\n'
    }
    
    // Return type section
    docstring += `**Returns:** ${returnType}\n\n`
    
    // Usage examples
    const examples = this.generateExamples(rule.name, parameters)
    if (examples.length > 0) {
      docstring += '**Usage:**\n```\n'
      examples.forEach(example => {
        docstring += `${example}\n`
      })
      docstring += '```'
    }
    
    return docstring
  }

  /**
   * Validate that a schema is properly formed
   */
  validateSchema(schema: UnifiedSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!schema.id) errors.push('Schema must have an id')
    if (!schema.name) errors.push('Schema must have a name')
    if (schema.type !== 'function') errors.push('User utility schemas must have type: "function"')
    if (!schema.description) errors.push('Schema must have a description')
    
    // Validate parameters
    if (schema.parameters) {
      schema.parameters.forEach((param, index) => {
        if (!param.name) errors.push(`Parameter ${index} must have a name`)
        if (!param.type) errors.push(`Parameter ${index} must have a type`)
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const userUtilitySchemaGenerator = new UserUtilitySchemaGenerator()