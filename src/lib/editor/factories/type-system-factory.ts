/**
 * 🏭 TYPE SYSTEM FACTORY - Gold Standard Schema-Driven Completion
 * 
 * ZERO hardcoding - everything discovered from schemas:
 * - Type detection from schemas
 * - Method discovery from schemas  
 * - Icon mapping from configuration
 * - Property discovery from business objects
 */

import type * as monaco from 'monaco-editor'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'
import { ALL_BUSINESS_OBJECT_SCHEMAS } from '@/lib/editor/schemas/business-objects'
import { PRIMITIVE_TYPE_SCHEMAS } from '@/lib/editor/schemas/types/primitive-types'

// =============================================================================
// TYPE CONFIGURATION REGISTRY - Single Source of Truth
// =============================================================================

interface TypeConfiguration {
  icon: keyof typeof monaco.languages.CompletionItemKind
  color?: string
  description?: string
  category: 'primitive' | 'business-object' | 'collection' | 'special'
}

const TYPE_CONFIGURATIONS: Record<string, TypeConfiguration> = {
  // 🎯 PRIMITIVE TYPES
  'string': { icon: 'Text', color: '#4CAF50', category: 'primitive' },
  'number': { icon: 'Value', color: '#2196F3', category: 'primitive' },
  'float': { icon: 'Value', color: '#2196F3', category: 'primitive' },
  'decimal': { icon: 'Value', color: '#2196F3', category: 'primitive' },
  'integer': { icon: 'Value', color: '#2196F3', category: 'primitive' },
  'boolean': { icon: 'Value', color: '#FF9800', category: 'primitive' },
  'date': { icon: 'Event', color: '#E91E63', category: 'primitive' },
  
  // 🎯 COLLECTION TYPES
  'array': { icon: 'Array', color: '#9C27B0', category: 'collection' },
  'list': { icon: 'Array', color: '#9C27B0', category: 'collection' },
  'object': { icon: 'Object', color: '#607D8B', category: 'primitive' },
  'dict': { icon: 'Object', color: '#607D8B', category: 'primitive' },
  
  // 🎯 SPECIAL TYPES
  'queryresult': { icon: 'Database', color: '#795548', category: 'special' },
  'queryResults': { icon: 'Database', color: '#795548', category: 'special' },
  'unknown': { icon: 'Field', color: '#757575', category: 'special' },
  
  // 🎯 DEFAULT FALLBACK
  'default': { icon: 'Field', color: '#757575', category: 'special' }
}

// =============================================================================
// TYPE SYSTEM FACTORY - Schema-Driven Discovery Engine
// =============================================================================

export class TypeSystemFactory {
  private static instance: TypeSystemFactory | null = null
  
  static getInstance(): TypeSystemFactory {
    if (!this.instance) {
      this.instance = new TypeSystemFactory()
    }
    return this.instance
  }
  
  /**
   * 🎯 DISCOVER: Get all registered types from schemas
   */
  getRegisteredTypes(): string[] {
    const types = new Set<string>()
    
    // Add primitive types
    Object.keys(TYPE_CONFIGURATIONS).forEach(type => types.add(type))
    
    // Add business object types from schemas
    ALL_BUSINESS_OBJECT_SCHEMAS.forEach(schema => {
      types.add(schema.name.toLowerCase())
    })
    
    // Add method return types
    ALL_METHOD_SCHEMAS.forEach(method => {
      if (method.returnType) {
        types.add(method.returnType.toLowerCase())
      }
    })
    
    return Array.from(types).filter(type => type !== 'default')
  }
  
  /**
   * 🎯 DISCOVER: Get all methods applicable to a type from schemas
   */
  getMethodsForType(type: string): typeof ALL_METHOD_SCHEMAS {
    const normalizedType = type.toLowerCase()
    
    return ALL_METHOD_SCHEMAS.filter(method => {
      // Method explicitly lists this type as applicable
      if (method.applicableTypes?.includes(normalizedType)) {
        return true
      }
      
      // Method has examples that start with this type
      if (method.examples?.some(ex => ex.toLowerCase().startsWith(`${normalizedType}.`))) {
        return true
      }
      
      // Method category matches type (e.g., string methods for string type)
      if (method.category?.toLowerCase() === normalizedType) {
        return true
      }
      
      return false
    })
  }
  
  /**
   * 🎯 DISCOVER: Get properties for business object types from schemas
   */
  getPropertiesForType(type: string): Array<{name: string, type: string, description?: string}> {
    const normalizedType = type.toLowerCase()
    
    const businessObject = ALL_BUSINESS_OBJECT_SCHEMAS.find(
      schema => schema.name.toLowerCase() === normalizedType
    )
    
    if (!businessObject) return []
    
    return businessObject.properties || []
  }
  
  /**
   * 🎯 SINGLE SOURCE: Get Monaco completion item kind for any type
   */
  getTypeIcon(type: string, monacoInstance: typeof monaco): monaco.languages.CompletionItemKind {
    const normalizedType = type.toLowerCase()
    const config = TYPE_CONFIGURATIONS[normalizedType] || TYPE_CONFIGURATIONS.default
    
    // Use the icon from configuration
    return monacoInstance.languages.CompletionItemKind[config.icon] || 
           monacoInstance.languages.CompletionItemKind.Field
  }
  
  /**
   * 🎯 DISCOVER: Get type configuration
   */
  getTypeConfiguration(type: string): TypeConfiguration {
    const normalizedType = type.toLowerCase()
    return TYPE_CONFIGURATIONS[normalizedType] || TYPE_CONFIGURATIONS.default
  }
  
  /**
   * 🎯 DISCOVER: Check if type exists in any schema
   */
  isValidType(type: string): boolean {
    const normalizedType = type.toLowerCase()
    
    // Check if it's a configured type
    if (TYPE_CONFIGURATIONS[normalizedType]) return true
    
    // Check if it's a business object
    return ALL_BUSINESS_OBJECT_SCHEMAS.some(
      schema => schema.name.toLowerCase() === normalizedType
    )
  }
  
  /**
   * 🎯 DISCOVER: Get all types by category
   */
  getTypesByCategory(category: TypeConfiguration['category']): string[] {
    return Object.entries(TYPE_CONFIGURATIONS)
      .filter(([_, config]) => config.category === category)
      .map(([type, _]) => type)
      .filter(type => type !== 'default')
  }
  
  /**
   * 🎯 FACTORY: Create completion items for type methods
   */
  createMethodCompletions(
    type: string, 
    monacoInstance: typeof monaco
  ): monaco.languages.CompletionItem[] {
    const methods = this.getMethodsForType(type)
    
    return methods.map(method => ({
      label: method.name,
      kind: monacoInstance.languages.CompletionItemKind.Method,
      insertText: this.buildMethodInsertText(method),
      insertTextRules: this.hasParameters(method) 
        ? monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet 
        : undefined,
      detail: `${method.returnType || 'unknown'} ${method.name}${this.getParameterSignature(method)}`,
      documentation: this.buildMethodDocumentation(method),
      sortText: `1_${method.name}`,
      range: {} as any // Monaco will provide the range
    }))
  }
  
  /**
   * 🎯 FACTORY: Create completion items for type properties
   */
  createPropertyCompletions(
    type: string,
    monacoInstance: typeof monaco
  ): monaco.languages.CompletionItem[] {
    const properties = this.getPropertiesForType(type)
    
    return properties.map(property => ({
      label: property.name,
      kind: this.getTypeIcon(property.type, monacoInstance),
      insertText: property.name,
      detail: `${property.type} ${property.name}`,
      documentation: property.description || `Property of ${type}`,
      sortText: `0_${property.name}`, // Properties before methods
      range: {} as any
    }))
  }
  
  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================
  
  private hasParameters(method: any): boolean {
    return Array.isArray(method.parameters) && method.parameters.length > 0
  }
  
  private buildMethodInsertText(method: any): string {
    if ((method as any).snippetTemplate) {
      return (method as any).snippetTemplate
    }
    
    if (this.hasParameters(method)) {
      const params = method.parameters.map((p: any, i: number) => 
        `\${${i + 1}:${p.name}}`
      ).join(', ')
      return `${method.name}(${params})`
    }
    
    return method.name
  }
  
  private getParameterSignature(method: any): string {
    if (!this.hasParameters(method)) return ''
    
    const params = method.parameters.map((p: any) => 
      `${p.name}: ${p.type || 'any'}`
    ).join(', ')
    
    return `(${params})`
  }
  
  private buildMethodDocumentation(method: any): string {
    let doc = method.description || ''
    
    if (method.examples?.length) {
      doc += `\n\n**Example:**\n\`\`\`\n${method.examples[0]}\n\`\`\``
    }
    
    if (method.parameters?.length) {
      doc += '\n\n**Parameters:**\n'
      method.parameters.forEach((p: any) => {
        doc += `- \`${p.name}\` (${p.type || 'any'}): ${p.description || ''}\n`
      })
    }
    
    return doc
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const typeSystemFactory = TypeSystemFactory.getInstance()
export { TYPE_CONFIGURATIONS }
