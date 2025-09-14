// Main schema exports - Single source of truth for the entire system
// This is the ONLY place that should be imported from for schemas

export * from './types'
export { SchemaFactory } from './factory'

// =============================================================================
// TYPE SYSTEM EXPORTS  
// =============================================================================

export type {
  UnifiedType,
  UnifiedPrimitiveType,
  BusinessObjectType,
  UnifiedCollectionType,
  UnifiedEnumType
} from './types/unified-types'

// Fix exports by importing from correct locations
export {
  isUnifiedPrimitive,
  isBusinessObject,
  isCollection,
  isEnum,
  getDisplayName
} from './types/unified-types'

export {
  debugUnifiedTypeSystem
} from './types/index'

// 🎯 NEW: Export unified type detection factory
export { unifiedTypeDetectionFactory } from '../type-system/type-detection-factory'

// Import all schemas
import { ALL_METHOD_SCHEMAS } from './methods'
import { ALL_HELPER_SCHEMAS } from './helpers'
import { ALL_MODULE_SCHEMAS } from './modules'

// Export combined schemas for easy access
export { ALL_METHOD_SCHEMAS, ALL_HELPER_SCHEMAS, ALL_MODULE_SCHEMAS }

// Export unified schema collections
export const ALL_SCHEMAS = [
  ...ALL_METHOD_SCHEMAS,
  ...ALL_HELPER_SCHEMAS,
  ...ALL_MODULE_SCHEMAS
]

// 🎯 INTERFACE-FIRST: Export all return interfaces for perfect IntelliSense
// Method interfaces
export type {
  ArrayFirstResult, ArrayLastResult, ArrayIsEmptyResult, ArrayContainsResult,
  ArrayIndexOfResult, ArraySliceResult, ArrayMapResult, ArrayFilterResult,
  ArraySortResult, ArrayJoinResult, ArrayLengthResult
} from './methods/array-methods'

export type {
  ObjectKeysResult, ObjectValuesResult, ObjectHasKeyResult, ObjectGetResult,
  ObjectSetResult, ObjectIsEmptyResult, ObjectSizeResult
} from './methods/object-methods'

// Module interfaces
export type {
  HttpResponse
} from './modules/http.module'

export type {
  DateFormatResult, DateParseResult, DateAddResult, DateDiffResult
} from './modules/date.module'

export type {
  JsonParseResult, JsonMergeResult, JsonExtractResult
} from './modules/json.module'

export type {
  VendorUtrResult, VendorRedisplayResult, VendorCancelResult, VendorEmailResult
} from './modules/vendor.module'

// String interfaces
export type {
  StringSplitResult
} from './methods/string/utilities'

// Global function interfaces
export type {
  RegexMatchResult
} from './global-functions/regex'

// Helper module interfaces
export type {
  RegexCaptureGroupsResult
} from './modules/helper/regex'

// Convenience functions
export const getMethodSchemas = () => ALL_METHOD_SCHEMAS
export const getHelperSchemas = () => ALL_HELPER_SCHEMAS
export const getSchemaById = (id: string) => ALL_SCHEMAS.find(schema => schema.id === id)
export const getSchemasByType = (type: 'method' | 'helper') => 
  ALL_SCHEMAS.filter(schema => schema.type === type)
export const getSchemasByCategory = (category: string) =>
  ALL_SCHEMAS.filter(schema => schema.category === category) 