// 🎯 Data Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant data processing utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Data operation result interfaces
export interface DataTransformResult {
  transformed: any
  original: any
  transformation: string
  appliedAt: string
  metadata: Record<string, any>
}

export interface DataValidateResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data: any
  validationSchema?: string
}

export interface DataSanitizeResult {
  sanitized: any
  original: any
  changes: Array<{
    path: string
    originalValue: any
    sanitizedValue: any
    reason: string
  }>
}

export interface DataParseResult {
  parsed: any
  format: string
  confidence: number
  errors: string[]
}

export interface DataConvertResult {
  converted: any
  fromFormat: string
  toFormat: string
  original: any
  conversionPath: string[]
}

// 🎯 DATA HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const DATA_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future data helper functions will be added here
  // Examples: transform, validate, sanitize, parse, convert, etc.
] 