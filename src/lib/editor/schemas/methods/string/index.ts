// String methods - Complete collection combining all focused modules
// Maintains backward compatibility by exporting STRING_METHOD_SCHEMAS

import { STRING_VALIDATION_METHODS } from './validation'
import { STRING_CASE_CONVERSION_METHODS } from './case-conversion'
import { STRING_ENCODING_METHODS } from './encoding'
import { STRING_UTILITY_METHODS } from './utilities'

// 🚀 Combine all string method categories
export const STRING_METHOD_SCHEMAS = [
  ...STRING_VALIDATION_METHODS,
  ...STRING_CASE_CONVERSION_METHODS,
  ...STRING_ENCODING_METHODS,
  ...STRING_UTILITY_METHODS
]

// Export individual categories for granular imports if needed
export {
  STRING_VALIDATION_METHODS,
  STRING_CASE_CONVERSION_METHODS,
  STRING_ENCODING_METHODS,
  STRING_UTILITY_METHODS
}