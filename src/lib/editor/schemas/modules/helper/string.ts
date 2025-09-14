// 🎯 String Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant string utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: String operation result interfaces
export interface StringEncryptResult {
  success: boolean
  encryptedData: string
  algorithm: string
  encoding: 'base64' | 'hex'
}

export interface StringHashResult {
  hash: string
  algorithm: string
  encoding: 'hex' | 'base64'
}

export interface StringNormalizeResult {
  normalized: string
  originalLength: number
  normalizedLength: number
  changes: string[]
}

export interface StringSanitizeResult {
  sanitized: string
  original: string
  removed: string[]
  replacements: Array<{ from: string; to: string }>
}

export interface StringFormatResult {
  formatted: string
  template: string
  variables: Record<string, any>
}

// 🎯 STRING HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const STRING_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future string helper functions will be added here
  // Examples: encrypt, decrypt, hash, normalize, sanitize, format, etc.
] 