// TypeInferenceService (SSOT) - Small, focused, schema-driven type system
// NOW USES SINGLE MASTER TYPE DETECTION SYSTEM
// NOTE: UI/Monaco code should depend on this service, not internal parsers

import type * as monaco from 'monaco-editor'
import { ScopeTracker } from '@/lib/editor/type-system/scope-tracker'
import { createBusinessObjectRegistry } from '@/lib/editor/type-system/business-object-registry'
import { schemaBridge } from '@/lib/editor/type-system/schema-bridge'
import { GLOBAL_BUSINESS_VARIABLES } from '@/lib/editor/schemas/business-objects'
import { masterTypeDetector, detectVariableType, detectPropertyType } from '@/lib/editor/type-system/master-type-detector'

export interface VariableInfo {
  name: string
  type: string
  line: number
  source: 'literal'|'assignment'|'method'|'module'|'loop'|'unknown'
}

export interface ObjectPropertyInfo { name: string; type: string; description?: string }

class TypeInferenceService {
  private variables: VariableInfo[] = []
  private tracker: ScopeTracker = new ScopeTracker()
  private boRegistryTextHash: string | null = null
  private getPropertiesCache = new Map<string, ObjectPropertyInfo[]>()
  private lastModelText: string = ''

  refresh(model: monaco.editor.ITextModel): void {
    console.log(`[TypeInferenceService] Refreshing with model content...`)
    const modelText = model.getValue()
    this.lastModelText = modelText
    console.log(`[TypeInferenceService] Model text length:`, modelText.length)
    console.log(`[TypeInferenceService] Model text:`, modelText)

    // Rebuild symbol table from model content
    console.log(`[TypeInferenceService] Updating ScopeTracker...`)
    this.tracker.updateFromModel(model)

    console.log(`[TypeInferenceService] Getting variables from tracker...`)
    const trackerVariables = this.tracker.getVariables()
    console.log(`[TypeInferenceService] Tracker returned ${trackerVariables.length} variables:`, trackerVariables)

    this.variables = trackerVariables.map(v => ({
      name: v.name,
      type: String(v.type || 'unknown'),
      line: v.line,
      source: (v.source as any) || 'unknown'
    }))
    console.log(`[TypeInferenceService] Final variables array:`, this.variables)
    console.log(`[TypeInferenceService] Variables with HttpResponse type:`, this.variables.filter(v => v.type.includes('Http') || v.type.includes('http')))

    // Invalidate BO cache if text changed significantly
    const text = model.getValue()
    const hash = this.simpleHash(text)
    console.log(`[TypeInferenceService] Text hash:`, hash, 'Previous hash:', this.boRegistryTextHash)
    if (this.boRegistryTextHash !== hash) {
      console.log(`[TypeInferenceService] Text changed, clearing cache...`)
      this.getPropertiesCache.clear()
      this.boRegistryTextHash = hash
    }
  }

  getVariables(): VariableInfo[] {
    console.log(`[TypeInferenceService] getVariables() called, returning ${this.variables.length} variables:`, this.variables)
    
    // Add global business variables (like 'utr') to the variable list
    const globalVariables: VariableInfo[] = Object.entries(GLOBAL_BUSINESS_VARIABLES).map(([varName, schema]) => ({
      name: varName,
      type: (schema as any).name || 'unknown',
      line: 0, // Global variables are always available
      source: 'global' as any
    }))
    
    console.log(`[TypeInferenceService] Adding ${globalVariables.length} global variables:`, globalVariables)
    
    // Combine local variables with global variables
    const allVariables = [...this.variables, ...globalVariables]
    console.log(`[TypeInferenceService] Total variables (local + global): ${allVariables.length}`)
    
    return allVariables
  }

  getTypeOf(name: string): string {
    // Use master type detection system for consistent results
    const allText = this.lastModelText || ''
    const typeInfo = detectVariableType(name, allText)
    
    console.log(`[TypeInferenceService] getTypeOf("${name}") using master system: ${typeInfo.type}`)
    
    if (typeInfo.confidence > 0.5) {
      return typeInfo.type as string
    }
    
    // Fallback to local variables
    for (let i = this.variables.length - 1; i >= 0; i--) {
      if (this.variables[i].name === name) return this.variables[i].type
    }
    
    // Check global business variables
    const globalSchema = (GLOBAL_BUSINESS_VARIABLES as any)[name]
    if (globalSchema) {
      return globalSchema.name || 'unknown'
    }
    
    return 'unknown'
  }

  getObjectProperties(typeName: string, allText: string, baseChain?: string): ObjectPropertyInfo[] {
    // If we have a base chain, use ScopeTracker for better resolution
    if (baseChain) {
      // For property access like "obj.prop.", we need to resolve the type of the chain
      const parts = baseChain.split('.')
      if (parts.length > 1) {
        // Use master type detection for property resolution
        const { detectPropertyType } = require('@/lib/editor/type-system/master-type-detector')
        const propertyInfo = detectPropertyType(baseChain, allText)
        const resolvedType = propertyInfo.type
        if (resolvedType && resolvedType !== 'unknown') {
          return this.getObjectProperties(resolvedType, allText)
        }
      }
    }

    // Fallback to cache and registry for basic type lookup
    const key = `${typeName}`
    const cached = this.getPropertiesCache.get(key)
    if (cached) {
      console.log(`[TypeInferenceService] Cache hit for ${typeName}: ${cached.length} properties`)
      return cached
    }
    try {
      console.log(`[TypeInferenceService] Looking up properties for type: ${typeName}`)
      const reg = createBusinessObjectRegistry(allText)
      console.log(`[TypeInferenceService] Created registry, looking for type: ${typeName}`)
      const t = reg.getType(typeName)
      console.log(`[TypeInferenceService] Registry returned type object:`, t)
      const props = t?.properties || []
      console.log(`[TypeInferenceService] Found ${props.length} properties for ${typeName}:`, props.map(p => p.name))
      console.log(`[TypeInferenceService] Property details:`, props)
      this.getPropertiesCache.set(key, props)
      return props
    } catch (error) {
      console.log(`[TypeInferenceService] Error looking up properties for ${typeName}:`, error)
      return []
    }
  }

  // REMOVED: getPropertyCompletions - now handled by unified system in property-completion-handler.ts

  getModuleReturnType(moduleName: string, methodName: string): string {
    return schemaBridge.getModuleReturnType(moduleName, methodName)
  }

  getTypeMethodReturnType(baseType: string, methodName: string): string {
    return schemaBridge.getTypeMethodReturnType(baseType as any, methodName)
  }

  private simpleHash(str: string): string {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i)
      h |= 0
    }
    return h.toString(36)
  }
}

export const typeInferenceService = new TypeInferenceService()


