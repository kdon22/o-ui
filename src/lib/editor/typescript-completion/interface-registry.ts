/**
 * 🎯 INTERFACE REGISTRY - Store parsed TypeScript interfaces for Monaco completion
 * 
 * Clean, standalone system for managing user-defined interface completions
 * No legacy integration - pure TypeScript interface → Monaco completion
 */

import { ReturnObject } from '../schemas/typescript-parser/offline/static-interface-parser'

// =============================================================================
// TYPES
// =============================================================================

export interface ParsedUtilityInterface {
  utilityName: string
  returnTypeName: string
  returnObject: ReturnObject
  allReturnObjects: ReturnObject[]  // Dependencies
  sourceCode: string
  parsedAt: number
}

export interface CompletionItem {
  label: string
  kind: 'Property' | 'Method' | 'Variable'
  insertText: string
  documentation: string
  detail: string
  sortText: string
}

// =============================================================================
// INTERFACE REGISTRY CLASS
// =============================================================================

class InterfaceRegistry {
  private interfaces = new Map<string, ParsedUtilityInterface>()
  private completionCache = new Map<string, CompletionItem[]>()

  /**
   * Register a parsed utility interface
   */
  registerUtilityInterface(utilityInterface: ParsedUtilityInterface): void {
    console.log(`[InterfaceRegistry] Registering utility: ${utilityInterface.utilityName}`)
    console.log(`[InterfaceRegistry] Return type: ${utilityInterface.returnTypeName}`)
    console.log(`[InterfaceRegistry] Return objects: ${utilityInterface.allReturnObjects.map(obj => obj.name)}`)
    
    this.interfaces.set(utilityInterface.utilityName, utilityInterface)
    
    // Clear completion cache for this utility
    this.completionCache.delete(utilityInterface.utilityName)
    
    console.log(`[InterfaceRegistry] Registered successfully. Total utilities: ${this.interfaces.size}`)
  }

  /**
   * Get completion items for a utility result variable
   */
  getCompletionItems(utilityName: string, variableName: string = 'result'): CompletionItem[] {
    const cacheKey = `${utilityName}:${variableName}`
    
    // Check cache first
    const cached = this.completionCache.get(cacheKey)
    if (cached) {
      console.log(`[InterfaceRegistry] Cache hit for ${cacheKey}: ${cached.length} items`)
      return cached
    }

    const utilityInterface = this.interfaces.get(utilityName)
    if (!utilityInterface) {
      console.log(`[InterfaceRegistry] No interface found for utility: ${utilityName}`)
      return []
    }

    console.log(`[InterfaceRegistry] Generating completions for ${utilityName} → ${variableName}`)
    
    // Generate completion items from all return objects
    const completionItems: CompletionItem[] = []
    
    for (const returnObject of utilityInterface.allReturnObjects) {
      for (const [propName, propType] of Object.entries(returnObject.properties)) {
        completionItems.push({
          label: `${variableName}.${propName}`,
          kind: 'Property',
          insertText: `${variableName}.${propName}`,
          documentation: `Property of ${returnObject.name}: ${propType}`,
          detail: `${propName}: ${propType}`,
          sortText: `0_${propName}` // High priority
        })
      }
    }

    console.log(`[InterfaceRegistry] Generated ${completionItems.length} completion items`)
    
    // Cache the results
    this.completionCache.set(cacheKey, completionItems)
    
    return completionItems
  }

  /**
   * Get all registered utility names
   */
  getUtilityNames(): string[] {
    return Array.from(this.interfaces.keys())
  }

  /**
   * Check if a utility is registered
   */
  hasUtility(utilityName: string): boolean {
    return this.interfaces.has(utilityName)
  }

  /**
   * Get utility interface details
   */
  getUtilityInterface(utilityName: string): ParsedUtilityInterface | undefined {
    return this.interfaces.get(utilityName)
  }

  /**
   * Clear all registered interfaces
   */
  clear(): void {
    console.log(`[InterfaceRegistry] Clearing ${this.interfaces.size} utilities`)
    this.interfaces.clear()
    this.completionCache.clear()
  }

  /**
   * Get registry stats
   */
  getStats(): {
    totalUtilities: number
    totalCompletionItems: number
    cacheSize: number
  } {
    let totalCompletionItems = 0
    for (const utilityInterface of this.interfaces.values()) {
      for (const returnObject of utilityInterface.allReturnObjects) {
        totalCompletionItems += Object.keys(returnObject.properties).length
      }
    }

    return {
      totalUtilities: this.interfaces.size,
      totalCompletionItems,
      cacheSize: this.completionCache.size
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const interfaceRegistry = new InterfaceRegistry()

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse utility code and register interfaces
 */
export function parseAndRegisterUtility(
  utilityName: string,
  utilityCode: string
): {
  success: boolean
  error?: string
  completionItems?: CompletionItem[]
} {
  try {
    // Import the parser
    const { parseAndEnhanceUtility } = require('../schemas/typescript-parser/offline')
    
    // Create a minimal utility schema
    const utilitySchema = {
      id: `utility-${utilityName}`,
      name: utilityName,
      type: 'function',
      category: 'user-utilities',
      returnType: 'object',
      description: `User utility: ${utilityName}`
    }

    // Parse and enhance
    const result = parseAndEnhanceUtility(utilitySchema, utilityCode)
    
    if (!result.success) {
      return {
        success: false,
        error: result.errors.join(', ')
      }
    }

    // Extract interface information
    const enhancedSchema = result.enhancedSchema
    if (!enhancedSchema || !enhancedSchema.returnObject || !enhancedSchema.returnObjects) {
      return {
        success: false,
        error: 'No return objects found in utility code'
      }
    }

    // Register the interface
    const utilityInterface: ParsedUtilityInterface = {
      utilityName,
      returnTypeName: enhancedSchema.returnType,
      returnObject: enhancedSchema.returnObject,
      allReturnObjects: enhancedSchema.returnObjects,
      sourceCode: utilityCode,
      parsedAt: Date.now()
    }

    interfaceRegistry.registerUtilityInterface(utilityInterface)

    // Get completion items
    const completionItems = interfaceRegistry.getCompletionItems(utilityName, 'result')

    return {
      success: true,
      completionItems
    }

  } catch (error) {
    return {
      success: false,
      error: `Parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
