// Export all helper schemas for UI generation
import { REMARK_HELPER_SCHEMAS } from './remark-helpers'
import { CLASS_CREATION_HELPER_SCHEMAS } from './class-creation-helpers'

// Combine all helper schemas
export const ALL_HELPER_SCHEMAS = [
  ...REMARK_HELPER_SCHEMAS,
  ...CLASS_CREATION_HELPER_SCHEMAS
  // Add more helper categories here:
  // ...LOOP_HELPER_SCHEMAS,
  // ...PATTERN_HELPER_SCHEMAS,
  // ...CONDITION_HELPER_SCHEMAS,
] 