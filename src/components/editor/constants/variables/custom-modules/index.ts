// Custom Module Registry - Central management for all custom modules
// Provides easy extensibility for adding new modules

import type { CustomModule, Variable, CustomMethod } from '../../../types/variable-types'
import { DATE_MODULE } from './date-module'
import { MATH_MODULE } from './math-module'

// Registry of all available modules
const MODULE_REGISTRY = new Map<string, CustomModule>()

// Register core modules
MODULE_REGISTRY.set('date', DATE_MODULE)
MODULE_REGISTRY.set('math', MATH_MODULE)

// Module Registry API
export class ModuleRegistry {
  /**
   * Register a new custom module
   */
  static registerModule(module: CustomModule): void {
    console.log(`📦 [ModuleRegistry] Registering module: ${module.name} v${module.version}`)
    MODULE_REGISTRY.set(module.name, module)
  }

  /**
   * Get a specific module by name
   */
  static getModule(name: string): CustomModule | undefined {
    return MODULE_REGISTRY.get(name)
  }

  /**
   * Get all registered modules
   */
  static getAllModules(): CustomModule[] {
    return Array.from(MODULE_REGISTRY.values())
  }

  /**
   * Get all variables from enabled modules
   */
  static getModuleVariables(enabledModules: string[] = ['date', 'math']): Variable[] {
    const variables: Variable[] = []
    
    for (const moduleName of enabledModules) {
      const module = MODULE_REGISTRY.get(moduleName)
      if (module) {
        variables.push(...module.variables)
      }
    }
    
    console.log(`📦 [ModuleRegistry] Loaded ${variables.length} variables from ${enabledModules.length} modules`)
    return variables
  }

  /**
   * Get all methods from enabled modules
   */
  static getModuleMethods(enabledModules: string[] = ['date', 'math']): CustomMethod[] {
    const methods: CustomMethod[] = []
    
    for (const moduleName of enabledModules) {
      const module = MODULE_REGISTRY.get(moduleName)
      if (module) {
        methods.push(...module.methods)
      }
    }
    
    console.log(`📦 [ModuleRegistry] Loaded ${methods.length} methods from ${enabledModules.length} modules`)
    return methods
  }

  /**
   * Get methods for a specific module (used for module.method access)
   */
  static getMethodsForModule(moduleName: string): CustomMethod[] {
    const module = MODULE_REGISTRY.get(moduleName)
    return module ? module.methods : []
  }

  /**
   * Check if a module is available
   */
  static hasModule(name: string): boolean {
    return MODULE_REGISTRY.has(name)
  }

  /**
   * Get module names (for IntelliSense)
   */
  static getModuleNames(): string[] {
    return Array.from(MODULE_REGISTRY.keys())
  }

  /**
   * Unregister a module (for testing/development)
   */
  static unregisterModule(name: string): boolean {
    return MODULE_REGISTRY.delete(name)
  }
}

// Convenience exports
export { DATE_MODULE } from './date-module'
export { MATH_MODULE } from './math-module'

// Main exports
export { MODULE_REGISTRY }

// Default enabled modules
export const DEFAULT_ENABLED_MODULES = ['date', 'math'] 