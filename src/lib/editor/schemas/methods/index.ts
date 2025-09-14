// Export all method schemas for Monaco IntelliSense
import { STRING_METHOD_SCHEMAS } from './string'
import { ARRAY_METHOD_SCHEMAS } from './array-methods'
import { NUMBER_METHOD_SCHEMAS } from './number-methods'
import { DECIMAL_METHOD_SCHEMAS } from './decimal-methods'
import { BOOLEAN_METHOD_SCHEMAS } from './boolean-methods'
import { OBJECT_METHOD_SCHEMAS } from './object-methods'
import { 
  HTTP_MODULE_SCHEMAS, 
  DATE_MODULE_SCHEMAS, 
  MATH_MODULE_SCHEMAS,
  VENDOR_MODULE_SCHEMAS,
  JSON_MODULE_SCHEMAS 
} from '../modules'

// 🚀 Complete method registry for Monaco IntelliSense
export const ALL_METHOD_SCHEMAS = [
  // Type-specific methods
  ...STRING_METHOD_SCHEMAS,    // ✅ String operations (.contains, .toBase64, etc.)
  ...ARRAY_METHOD_SCHEMAS,     // ✅ Array operations (.length, .filter, etc.)
  ...NUMBER_METHOD_SCHEMAS,    // ✅ Number operations (.round, .abs, etc.)
  ...DECIMAL_METHOD_SCHEMAS,   // ✅ Decimal operations (.toPrecision, .preciseAdd, etc.)
  ...BOOLEAN_METHOD_SCHEMAS,   // ✅ Boolean operations (.and, .or, .not, .ifTrue, etc.)
  ...OBJECT_METHOD_SCHEMAS,    // ✅ Object operations (.keys, .values, etc.)
  
  // Global module methods
  ...HTTP_MODULE_SCHEMAS,      // ✅ http.get, http.post, etc.
  ...DATE_MODULE_SCHEMAS,      // ✅ date.now, date.format, etc.
  ...MATH_MODULE_SCHEMAS,      // ✅ math.round, math.random, etc.
  ...VENDOR_MODULE_SCHEMAS,    // ✅ vendor.utrGet, vendor.segmentsCancel, etc.
  ...JSON_MODULE_SCHEMAS,      // ✅ json.parse, json.stringify, etc.
  
  // 📋 Future method categories:
  // ...BOOLEAN_METHOD_SCHEMAS, // Boolean operations
  // ...FILE_METHOD_SCHEMAS,    // File operations
  // ...CRYPTO_METHOD_SCHEMAS,  // Encryption/hashing
]

// Methods loaded - silent 