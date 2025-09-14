// Global Functions - Simple function calls in business rules that translate to backend helpers
// Example: debug("message") -> helper.debug("message")

import { DEBUG_FUNCTION_SCHEMA } from './debug'
// import { LOG_FUNCTION_SCHEMA } from './log'  // 🚨 TEMPORARILY REMOVED - has bugs
import { REGEX_FUNCTION_SCHEMA } from './regex'

// Export all global function schemas
export const GLOBAL_FUNCTION_SCHEMAS = [
  DEBUG_FUNCTION_SCHEMA,          // debug() -> helper.debug()
  // LOG_FUNCTION_SCHEMA,         // 🚨 TEMPORARILY REMOVED - has undefined variable bug
  REGEX_FUNCTION_SCHEMA           // regex() -> helper.regex()
  // Add more global functions here:
  // EMAIL_FUNCTION_SCHEMA,        // email() -> helper.email()
  // ENCRYPT_FUNCTION_SCHEMA,      // encrypt() -> helper.encrypt()
  // TRANSFORM_FUNCTION_SCHEMA,    // transform() -> helper.transform()
]

// Convenience function to get global functions for IntelliSense
export const getGlobalFunctions = () => {
  return GLOBAL_FUNCTION_SCHEMAS.map(schema => ({
    name: schema.name,
    description: schema.description,
    parameters: schema.parameters || [],
    returnType: schema.returnType || 'void'
  }))
} 