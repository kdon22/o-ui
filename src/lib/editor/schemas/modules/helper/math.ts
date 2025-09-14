// 🎯 Math Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant mathematical utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Math operation result interfaces
export interface MathCalculateResult {
  result: number
  operation: string
  operands: number[]
  precision?: number
}

export interface MathRoundResult {
  rounded: number
  original: number
  decimals: number
  method: 'standard' | 'bankers' | 'up' | 'down'
}

export interface MathFormatResult {
  formatted: string
  original: number
  format: string
  locale?: string
}

export interface MathPercentageResult {
  percentage: number
  part: number
  total: number
  formatted?: string
}

// 🎯 MATH HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const MATH_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future math helper functions will be added here
  // Examples: calculate, statistics, financial, conversions, etc.
] 