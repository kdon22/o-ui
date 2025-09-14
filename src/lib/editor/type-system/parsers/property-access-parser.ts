// Property Access Parser: Handles property access and type resolution with deep chaining
import type * as monaco from 'monaco-editor'
import { schemaBridge } from '../schema-bridge'
import { ClassIndexer } from '../class-indexer'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'

type VarType = string

export class PropertyAccessParser {
  resolvePropertyType(expression: string, known: Record<string, VarType>, model: monaco.editor.ITextModel): VarType {
    console.log(`[PropertyAccessParser] resolvePropertyType called with expression: "${expression}", known:`, known)
    // Parse the full property chain: obj.prop1.prop2.prop3.method()
    const parts = expression.split('.')
    if (parts.length < 2) return 'unknown'

    const baseVar = parts[0]
    let currentType = known[baseVar]

    console.log(`[PropertyAccessParser] baseVar: "${baseVar}", initial currentType: "${currentType}"`)
    
    // 🚀 CRITICAL FIX: If baseVar not found in known, it should already be there from ScopeTracker
    // But add extra safety check for global business variables
    if (!currentType) {
      console.log(`[PropertyAccessParser] Base variable "${baseVar}" not found in known variables`)
      console.log(`[PropertyAccessParser] This should not happen if ScopeTracker is working correctly`)
      console.log(`[PropertyAccessParser] Known variables:`, Object.keys(known))
      return 'unknown'
    }

    // Get class definitions from the current code
    const classes = ClassIndexer.index(model.getValue())
    console.log(`[PropertyAccessParser] available classes:`, Object.keys(classes))

    // Resolve each property in the chain
    for (let i = 1; i < parts.length; i++) {
      const prop = parts[i]
      console.log(`[PropertyAccessParser] resolving property ${i}: "${prop}" on type "${currentType}"`)

      // Handle method calls: prop(arg1, arg2)
      const methodMatch = prop.match(/^([a-zA-Z_][\w]*)\s*\(/)
      if (methodMatch) {
        const methodName = methodMatch[1]
        console.log(`[PropertyAccessParser] method call detected: ${methodName}`)

        // For now, return the current type - method return type resolution needs more work
        return currentType
      } else {
        // Regular property access - try class-based resolution first
        if (classes[currentType]) {
          const classDef = classes[currentType]
          console.log(`[PropertyAccessParser] found class definition for ${currentType}:`, classDef.properties)

          // Look for the property in the class definition
          const classProp = classDef.properties.find(p => p.name === prop)
          if (classProp && classProp.type) {
            console.log(`[PropertyAccessParser] found class property ${prop} with type: ${classProp.type}`)
            currentType = classProp.type
            continue
          }
        }

        // Fallback to schema bridge
        try {
          const propType = schemaBridge.getBusinessObjectPropertyType?.(currentType as any, prop, model.getValue())
          console.log(`[PropertyAccessParser] schema bridge result for ${prop} on ${currentType}: ${propType}`)
          if (propType && propType !== 'unknown') {
            currentType = propType
          } else {
            console.log(`[PropertyAccessParser] no type found for ${prop} on ${currentType}`)
            return 'unknown'
          }
        } catch (error) {
          console.log(`[PropertyAccessParser] error with schema bridge:`, error)
          return 'unknown'
        }
      }
    }

    console.log(`[PropertyAccessParser] final resolved type: "${currentType}"`)
    return currentType
  }

  // Enhanced property completion for deep chains
  getPropertyCompletions(baseChain: string, known: Record<string, VarType>, model: monaco.editor.ITextModel): Array<{ label: string; type: string; schema?: any }> {
    console.log(`[PropertyAccessParser] getPropertyCompletions called with baseChain: "${baseChain}", known:`, known)
    const parts = baseChain.split('.')
    if (parts.length === 0) return []

    const baseVar = parts[0]
    let currentType = known[baseVar]

    console.log(`[PropertyAccessParser] baseVar: "${baseVar}", currentType: "${currentType}"`)
    if (!currentType) {
      console.log(`[PropertyAccessParser] Base variable "${baseVar}" not found in known variables`)
      console.log(`[PropertyAccessParser] Available variables:`, Object.keys(known))
      console.log(`[PropertyAccessParser] This should not happen if ScopeTracker is working correctly`)
      return []
    }

    // Get class definitions from the current code
    const classes = ClassIndexer.index(model.getValue())
    console.log(`[PropertyAccessParser] available classes for completions:`, Object.keys(classes))

    // Navigate to the type of the object being accessed
    for (let i = 1; i < parts.length; i++) {
      const prop = parts[i]
      console.log(`[PropertyAccessParser] navigating to property ${i}: "${prop}" on type "${currentType}"`)

      // Try class-based resolution first
      if (classes[currentType]) {
        const classDef = classes[currentType]
        const classProp = classDef.properties.find(p => p.name === prop)
        if (classProp && classProp.type) {
          console.log(`[PropertyAccessParser] found class property ${prop} with type: ${classProp.type}`)
          currentType = classProp.type
          continue
        }
      }

      // Fallback to schema bridge
      try {
        const propType = schemaBridge.getBusinessObjectPropertyType?.(currentType as any, prop, model.getValue())
        console.log(`[PropertyAccessParser] schema bridge result for ${prop} on ${currentType}: ${propType}`)
        if (propType && propType !== 'unknown') {
          currentType = propType
        } else {
          console.log(`[PropertyAccessParser] no type found for ${prop} on ${currentType}, stopping navigation`)
          return []
        }
      } catch (error) {
        console.log(`[PropertyAccessParser] error navigating to ${prop}:`, error)
        return []
      }
    }

    // Get properties of the final type
    console.log(`[PropertyAccessParser] looking for completions of final type: "${currentType}"`)

    // First try to get type-specific completions (like number methods, string methods)
    const typeSpecificCompletions = this.getTypeSpecificCompletions(currentType)
    if (typeSpecificCompletions.length > 0) {
      console.log(`[PropertyAccessParser] returning ${typeSpecificCompletions.length} type-specific completions:`, typeSpecificCompletions)
      return typeSpecificCompletions
    }

    // Then try class-based completions
    if (classes[currentType]) {
      const classDef = classes[currentType]
      const classCompletions = [
        ...classDef.properties.map(p => ({ label: p.name, type: p.type || 'unknown' })),
        ...classDef.actions.map(a => ({ label: a.name + '()', type: a.returnType || 'unknown' }))
      ]
      console.log(`[PropertyAccessParser] returning ${classCompletions.length} class-based completions:`, classCompletions)
      return classCompletions
    }

    // Fallback to business object registry
    try {
      const { createBusinessObjectRegistry } = require('../business-object-registry')
      const reg = createBusinessObjectRegistry(model.getValue())
      const typeInfo = reg.getType(currentType)

      console.log(`[PropertyAccessParser] business object registry typeInfo for "${currentType}":`, typeInfo)

      if (typeInfo) {
        const result = [
          ...typeInfo.properties.map((p: { name: string; type: string }) => ({ label: p.name, type: p.type })),
          ...typeInfo.methods.map((m: { name: string; returnType: string }) => ({ label: m.name + '()', type: m.returnType }))
        ]
        console.log(`[PropertyAccessParser] returning ${result.length} registry-based completions:`, result)
        return result
      } else {
        console.log(`[PropertyAccessParser] no typeInfo found for "${currentType}" in registry`)
      }
    } catch (error) {
      console.log(`[PropertyAccessParser] error getting typeInfo for "${currentType}":`, error)
    }

    console.log(`[PropertyAccessParser] no completions found for type "${currentType}"`)
    return []
  }

  private getTypeSpecificCompletions(typeName: string): Array<{ label: string; type: string; schema?: any }> {
    console.log(`[PropertyAccessParser] getting schema-driven completions for: "${typeName}"`)

    // Map unified types to schema categories (same as in provider.ts)
    const typeToCategoryMap: Record<string, string> = {
      'int': 'number',
      'float': 'decimal',
      'str': 'string',
      'bool': 'boolean',
      'list': 'array',
      'dict': 'object',
      'number': 'number',
      'decimal': 'decimal',
      'string': 'string',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object'
    }

    const schemaCategory = typeToCategoryMap[typeName.toLowerCase()] || typeName.toLowerCase()

    // Filter methods by category from the single source of truth
    const categoryMethods = ALL_METHOD_SCHEMAS.filter((schema: any) =>
      schema.category === schemaCategory
    )

    console.log(`[PropertyAccessParser] found ${categoryMethods.length} schema-driven completions for category "${schemaCategory}"`)

    return categoryMethods.map((schema: any) => ({
      label: schema.name + (schema.noParensAllowed ? '' : '()'),
      type: schema.returnType || 'any',
      schema: schema // Include full schema for rich metadata access
    }))
  }
}

