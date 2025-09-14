/**
 * 🎯 BUSINESS OBJECTS - Main exports with dynamic support
 * 
 * Provides dynamic business object registry and TypeScript parser integration
 * Replaces hardcoded schemas with runtime-generated schemas
 */

// =============================================================================
// CORE TYPE EXPORTS
// =============================================================================

// Core types
export type {
  BusinessObjectSchema,
  PropertyDefinition,
  MethodDefinition,
  PropertyMap,
  MethodMap,
  RelationshipMap
} from './types'

// =============================================================================
// DYNAMIC REGISTRY EXPORTS
// =============================================================================

// Dynamic registry
export { 
  businessObjectRegistry,
  registerUTRSchemas,
  isRegistryReady,
  resetRegistry
} from './registry'

export type {
  RegistryEvent,
  RegistryListener,
  RegistryStats
} from './registry'

// =============================================================================
// TYPESCRIPT PARSER INTEGRATION
// =============================================================================

// TypeScript parser integration
export { 
  parseAndRegisterInterfaces,
  setupUTRCompletion,
  validateParsedSchema
} from '../typescript-parser/index'

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get all registered business objects
 */
export const getAllBusinessObjects = () => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.getAllSchemas()
}

/**
 * Get business object schema by name
 */
export const getBusinessObjectSchema = (name: string) => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.getSchema(name)
}

/**
 * Get global variable schema by name
 */
export const getGlobalVariableSchema = (name: string) => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.getGlobalVariable(name)
}

/**
 * Check if a variable name is a global business variable
 */
export const isGlobalBusinessVariable = (variableName: string) => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.hasGlobalVariable(variableName)
}

/**
 * Get all global business variables
 */
export const getAllGlobalVariables = () => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.getAllGlobalVariables()
}

/**
 * Get registry statistics
 */
export const getRegistryStats = () => {
  const { businessObjectRegistry } = require('./registry')
  return businessObjectRegistry.getStats()
}

// =============================================================================
// LEGACY COMPATIBILITY (Deprecated)
// =============================================================================

/**
 * @deprecated Use businessObjectRegistry.getAllSchemas() instead
 */
export const ALL_BUSINESS_OBJECT_SCHEMAS = []

/**
 * @deprecated Use businessObjectRegistry.getAllGlobalVariables() instead
 */
export const GLOBAL_BUSINESS_VARIABLES = {}
