// 🎯 Date Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant date/time utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Date operation result interfaces
export interface DateFormatResult {
  formatted: string
  original: string | Date
  pattern: string
  timezone?: string
}

export interface DateParseResult {
  parsed: Date
  original: string
  format?: string
  timezone?: string
  isValid: boolean
}

export interface DateValidateResult {
  isValid: boolean
  date: string | Date
  errors: string[]
  warnings: string[]
}

export interface DateCompareResult {
  comparison: 'before' | 'after' | 'equal'
  difference: {
    milliseconds: number
    seconds: number
    minutes: number
    hours: number
    days: number
  }
  date1: Date
  date2: Date
}

export interface DateCalculateResult {
  result: Date
  operation: string
  original: Date
  amount: number
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
}

// 🎯 DATE HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const DATE_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future date helper functions will be added here
  // Examples: format, parse, calculate, timezone, business_days, etc.
] 