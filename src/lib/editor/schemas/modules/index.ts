// 🚀 Best-in-Class Module System - Schema-Driven Only
// Fast completions + One-line Python generation using helper functions

import { HTTP_MODULE_SCHEMAS } from './http.module'
import { DATE_MODULE_SCHEMAS } from './date.module'
import { MATH_MODULE_SCHEMAS } from './math.module'
import { VENDOR_MODULE_SCHEMAS } from './vendor.module'
import { JSON_MODULE_SCHEMAS } from './json.module'

// 🚀 ALL METHOD SCHEMAS for detailed Python generation
export const ALL_MODULE_SCHEMAS = [
  ...HTTP_MODULE_SCHEMAS,      // ✅ Network operations
  ...DATE_MODULE_SCHEMAS,      // ✅ Date/time utilities
  ...MATH_MODULE_SCHEMAS,      // ✅ Mathematical operations
  ...VENDOR_MODULE_SCHEMAS,    // ✅ GDS operations (utrGet, segmentsCancel, etc.)
  ...JSON_MODULE_SCHEMAS,      // ✅ JSON manipulation
  // 📋 Future modules:
  // ...FILE_MODULE_SCHEMAS,   // File operations
  // ...CRYPTO_MODULE_SCHEMAS, // Encryption/hashing
  // ...EMAIL_MODULE_SCHEMAS,  // Email templates
]

// 🎯 Module Categories for Organized IntelliSense
export const MODULE_CATEGORIES = {
  network: ['http'],
  data: ['json', 'math'],
  temporal: ['date'],
  gds: ['vendor'],
  // Future categories:
  // security: ['crypto'],
  // io: ['file', 'email'],
} as const

// 🚀 Schema-Driven Module Discovery (replaces MODULE_REGISTRY)
export const getModuleNames = (): string[] => {
  const modules = new Set<string>()
  
  // Extract unique module names from schema categories
  ALL_MODULE_SCHEMAS.forEach(schema => {
    // Use the category as the module name (e.g., 'http', 'math', 'date')
    if (schema.category) {
      modules.add(schema.category)
    }
  })
  
  return Array.from(modules).sort()
}

export const getModuleMethods = (moduleName: string): string[] => {
  return ALL_MODULE_SCHEMAS
    .filter(schema => schema.category === moduleName)
    .map(schema => schema.name)
}

export const getModuleInfo = (moduleName: string) => {
  const methods = getModuleMethods(moduleName)
  if (methods.length === 0) return null
  
  // Create module info from schema data
  const firstSchema = ALL_MODULE_SCHEMAS.find(schema => schema.category === moduleName)
  return {
    name: moduleName,
    description: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} operations`,
    category: firstSchema?.category || 'utility',
    methods,
    pythonImports: firstSchema?.pythonImports || []
  }
}

// Helper functions for module discovery
export const getModuleByName = (name: string) => 
  ALL_MODULE_SCHEMAS.filter(schema => schema.category === name)

export const getMethodsForModule = (moduleName: string) => {
  return ALL_MODULE_SCHEMAS.filter(schema => schema.category === moduleName)
}

// Get all available modules (for IntelliSense) - alias for backward compatibility
export const getAvailableModules = getModuleNames

// Export specific module collections for easy access
export { 
  HTTP_MODULE_SCHEMAS, 
  DATE_MODULE_SCHEMAS, 
  MATH_MODULE_SCHEMAS,
  VENDOR_MODULE_SCHEMAS,
  JSON_MODULE_SCHEMAS 
} 