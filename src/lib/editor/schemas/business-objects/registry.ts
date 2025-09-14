/**
 * 🎯 DYNAMIC BUSINESS OBJECT REGISTRY - Runtime schema management
 * 
 * Manages dynamically generated business object schemas
 * Replaces hardcoded schema definitions with runtime registration
 * Small, focused file for schema registry management
 */

import { BusinessObjectSchema } from './types'

// =============================================================================
// BUSINESS OBJECT REGISTRY CLASS
// =============================================================================

/**
 * Dynamic registry for business object schemas
 */
class BusinessObjectRegistry {
  private schemas = new Map<string, BusinessObjectSchema>()
  private globalVariables = new Map<string, BusinessObjectSchema>()
  private listeners = new Set<RegistryListener>()

  // =============================================================================
  // SCHEMA MANAGEMENT
  // =============================================================================

  /**
   * Register a business object schema
   */
  registerSchema(schema: BusinessObjectSchema): void {
    this.schemas.set(schema.name, schema)
    this.notifyListeners('schema-added', schema.name, schema)
  }

  /**
   * Register multiple schemas at once
   */
  registerSchemas(schemas: BusinessObjectSchema[]): void {
    for (const schema of schemas) {
      this.schemas.set(schema.name, schema)
    }
    this.notifyListeners('schemas-batch-added', 'multiple', schemas)
  }

  /**
   * Get schema by name
   */
  getSchema(name: string): BusinessObjectSchema | undefined {
    return this.schemas.get(name)
  }

  /**
   * Check if schema exists
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name)
  }

  /**
   * Get all registered schemas
   */
  getAllSchemas(): BusinessObjectSchema[] {
    return Array.from(this.schemas.values())
  }

  /**
   * Get schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys())
  }

  /**
   * Remove schema
   */
  removeSchema(name: string): boolean {
    const existed = this.schemas.delete(name)
    if (existed) {
      this.notifyListeners('schema-removed', name, null)
    }
    return existed
  }

  /**
   * Clear all schemas
   */
  clearSchemas(): void {
    this.schemas.clear()
    this.notifyListeners('schemas-cleared', 'all', null)
  }

  // =============================================================================
  // GLOBAL VARIABLE MANAGEMENT
  // =============================================================================

  /**
   * Register a global variable
   */
  registerGlobalVariable(name: string, schema: BusinessObjectSchema): void {
    this.globalVariables.set(name, schema)
    this.notifyListeners('global-variable-added', name, schema)
  }

  /**
   * Register multiple global variables
   */
  registerGlobalVariables(variables: Record<string, BusinessObjectSchema>): void {
    for (const [name, schema] of Object.entries(variables)) {
      this.globalVariables.set(name, schema)
    }
    this.notifyListeners('global-variables-batch-added', 'multiple', variables)
  }

  /**
   * Get global variable schema
   */
  getGlobalVariable(name: string): BusinessObjectSchema | undefined {
    return this.globalVariables.get(name)
  }

  /**
   * Check if global variable exists
   */
  hasGlobalVariable(name: string): boolean {
    return this.globalVariables.has(name)
  }

  /**
   * Get all global variables
   */
  getAllGlobalVariables(): Record<string, BusinessObjectSchema> {
    return Object.fromEntries(this.globalVariables.entries())
  }

  /**
   * Get global variable names
   */
  getGlobalVariableNames(): string[] {
    return Array.from(this.globalVariables.keys())
  }

  /**
   * Remove global variable
   */
  removeGlobalVariable(name: string): boolean {
    const existed = this.globalVariables.delete(name)
    if (existed) {
      this.notifyListeners('global-variable-removed', name, null)
    }
    return existed
  }

  // =============================================================================
  // QUERY METHODS
  // =============================================================================

  /**
   * Find schemas by property name
   */
  findSchemasByProperty(propertyName: string): BusinessObjectSchema[] {
    return this.getAllSchemas().filter(schema => 
      schema.properties && propertyName in schema.properties
    )
  }

  /**
   * Find schemas by method name
   */
  findSchemasByMethod(methodName: string): BusinessObjectSchema[] {
    return this.getAllSchemas().filter(schema => 
      schema.methods && methodName in schema.methods
    )
  }

  /**
   * Search schemas by name pattern
   */
  searchSchemas(pattern: string): BusinessObjectSchema[] {
    const regex = new RegExp(pattern, 'i')
    return this.getAllSchemas().filter(schema => 
      regex.test(schema.name) || regex.test(schema.description || '')
    )
  }

  // =============================================================================
  // LISTENER MANAGEMENT
  // =============================================================================

  /**
   * Add registry change listener
   */
  addListener(listener: RegistryListener): void {
    this.listeners.add(listener)
  }

  /**
   * Remove registry change listener
   */
  removeListener(listener: RegistryListener): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(
    event: RegistryEvent, 
    name: string, 
    data: any
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(event, name, data)
      } catch (error) {
        console.warn('Registry listener error:', error)
      }
    }
  }

  // =============================================================================
  // STATISTICS & DEBUG
  // =============================================================================

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const schemas = this.getAllSchemas()
    const totalProperties = schemas.reduce((sum, schema) => 
      sum + Object.keys(schema.properties).length, 0
    )
    const totalMethods = schemas.reduce((sum, schema) => 
      sum + Object.keys(schema.methods || {}).length, 0
    )

    return {
      totalSchemas: schemas.length,
      totalGlobalVariables: this.globalVariables.size,
      totalProperties,
      totalMethods,
      averagePropertiesPerSchema: schemas.length > 0 ? 
        Math.round(totalProperties / schemas.length) : 0,
      schemasByType: this.getSchemasByType()
    }
  }

  /**
   * Get schemas grouped by type
   */
  private getSchemasByType(): Record<string, number> {
    const byType: Record<string, number> = {}
    
    for (const schema of this.getAllSchemas()) {
      const type = schema.isUserDefined ? 'user-defined' : 'built-in'
      byType[type] = (byType[type] || 0) + 1
    }

    return byType
  }

  /**
   * Debug registry contents
   */
  debug(): void {
    console.group('🎯 Business Object Registry Debug')
    console.log('Stats:', this.getStats())
    console.log('Schemas:', this.getSchemaNames())
    console.log('Global Variables:', this.getGlobalVariableNames())
    console.groupEnd()
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Registry event types
 */
export type RegistryEvent = 
  | 'schema-added'
  | 'schema-removed'
  | 'schemas-batch-added'
  | 'schemas-cleared'
  | 'global-variable-added'
  | 'global-variable-removed'
  | 'global-variables-batch-added'

/**
 * Registry change listener
 */
export type RegistryListener = (
  event: RegistryEvent,
  name: string,
  data: any
) => void

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalSchemas: number
  totalGlobalVariables: number
  totalProperties: number
  totalMethods: number
  averagePropertiesPerSchema: number
  schemasByType: Record<string, number>
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global business object registry instance
 */
export const businessObjectRegistry = new BusinessObjectRegistry()

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick registration of UTR schemas
 */
export function registerUTRSchemas(schemas: BusinessObjectSchema[]): void {
  businessObjectRegistry.registerSchemas(schemas)
  
  // Auto-register 'utr' global variable if UTR schema exists
  const utrSchema = schemas.find(schema => schema.name === 'UTR')
  if (utrSchema) {
    businessObjectRegistry.registerGlobalVariable('utr', utrSchema)
  }
}

/**
 * Check if registry is ready for completion
 */
export function isRegistryReady(): boolean {
  const stats = businessObjectRegistry.getStats()
  return stats.totalSchemas > 0 && stats.totalGlobalVariables > 0
}

/**
 * Reset registry to empty state
 */
export function resetRegistry(): void {
  businessObjectRegistry.clearSchemas()
  // Global variables are cleared implicitly since they reference schemas
}
