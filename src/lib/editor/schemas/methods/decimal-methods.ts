// Decimal methods with precision-focused functionality
// Specialized methods for decimal numbers requiring high precision

import type { UnifiedSchema } from '../types'

export const DECIMAL_METHOD_SCHEMAS: UnifiedSchema[] = [
  // === PRECISION METHODS ===
  {
    id: 'float-to-precision',
    name: 'toPrecision',
    type: 'method',
    category: 'decimal',
    returnType: 'string',
    description: 'Format a float with total significant digits. Parameters: precision: number.',
    examples: ['price.toPrecision(precision: 4)', 'rate.toPrecision(precision: 6)'],
    snippetTemplate: 'toPrecision(precision: ${1:number})',
    parameters: [{ name: 'precision', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const precision = params?.precision || params?.arg1 || '4'
      return `${resultVar} = f"{${variable}:.${precision}g}"`
    },
    pythonImports: []
  },
  {
    id: 'float-to-exponential',
    name: 'toExponential',
    type: 'method',
    category: 'decimal',
    returnType: 'string',
    description: 'Format a float in exponential notation. Parameters: decimals?: number (default 6).',
    examples: ['largeNumber.toExponential(decimals: 2)', 'scientificValue.toExponential()'],
    snippetTemplate: 'toExponential(decimals: ${1:number})',
    parameters: [{ name: 'decimals', type: 'number', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const decimals = params?.decimals || params?.arg1 || '6'
      return `${resultVar} = f"{${variable}:.${decimals}e}"`
    },
    pythonImports: []
  },

  // === HIGH PRECISION ARITHMETIC ===
  {
    id: 'float-precise-add',
    name: 'preciseAdd',
    type: 'method',
    category: 'decimal',
    returnType: 'decimal',
    description: 'Add two values with decimal precision to avoid floating-point errors. Parameters: value: number.',
    examples: ['price.preciseAdd(tax)', 'amount.preciseAdd(0.01)'],
    snippetTemplate: 'preciseAdd(value: ${1:number})',
    parameters: [{ name: 'value', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const value = params?.value || params?.arg1 || '0'
      return `
from decimal import Decimal
${resultVar} = float(Decimal(str(${variable})) + Decimal(str(${value})))`
    },
    pythonImports: ['decimal']
  },
  {
    id: 'float-precise-subtract',
    name: 'preciseSubtract',
    type: 'method',
    category: 'decimal',
    returnType: 'decimal',
    description: 'Subtract with decimal precision to avoid floating-point errors. Parameters: value: number.',
    examples: ['total.preciseSubtract(discount)', 'balance.preciseSubtract(fee)'],
    snippetTemplate: 'preciseSubtract(value: ${1:number})',
    parameters: [{ name: 'value', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const value = params?.value || params?.arg1 || '0'
      return `
from decimal import Decimal
${resultVar} = float(Decimal(str(${variable})) - Decimal(str(${value})))`
    },
    pythonImports: ['decimal']
  },
  {
    id: 'float-precise-multiply',
    name: 'preciseMultiply',
    type: 'method',
    category: 'decimal',
    returnType: 'decimal',
    description: 'Multiply with decimal precision to avoid floating-point errors. Parameters: value: number.',
    examples: ['rate.preciseMultiply(amount)', 'percentage.preciseMultiply(0.01)'],
    snippetTemplate: 'preciseMultiply(value: ${1:number})',
    parameters: [{ name: 'value', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const value = params?.value || params?.arg1 || '1'
      return `
from decimal import Decimal
${resultVar} = float(Decimal(str(${variable})) * Decimal(str(${value})))`
    },
    pythonImports: ['decimal']
  },
  {
    id: 'float-precise-divide',
    name: 'preciseDivide',
    type: 'method',
    category: 'decimal',
    returnType: 'decimal',
    description: 'Divide with decimal precision to avoid floating-point errors. Parameters: divisor: number.',
    examples: ['total.preciseDivide(count)', 'amount.preciseDivide(exchangeRate)'],
    snippetTemplate: 'preciseDivide(divisor: ${1:number})',
    parameters: [{ name: 'divisor', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const divisor = params?.divisor || params?.arg1 || '1'
      return `
from decimal import Decimal
${resultVar} = float(Decimal(str(${variable})) / Decimal(str(${divisor})))`
    },
    pythonImports: ['decimal']
  },

  // === ROUNDING WITH PRECISION ===
  {
    id: 'float-round-to-places',
    name: 'roundToPlaces',
    type: 'method',
    category: 'decimal',
    returnType: 'decimal',
    description: 'Round to specified decimal places with proper rounding. Parameters: places: number.',
    examples: ['price.roundToPlaces(2)', 'rate.roundToPlaces(4)'],
    snippetTemplate: 'roundToPlaces(places: ${1:number})',
    parameters: [{ name: 'places', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const places = params?.places || params?.arg1 || '2'
      return `
from decimal import Decimal, ROUND_HALF_UP
${resultVar} = float(Decimal(str(${variable})).quantize(Decimal('0.' + '0' * (${places} - 1) + '1'), rounding=ROUND_HALF_UP))`
    },
    pythonImports: ['decimal']
  },

  // === VALIDATION ===
  {
    id: 'float-is-finite',
    name: 'isFinite',
    type: 'method',
    category: 'decimal',
    returnType: 'boolean',
    description: 'Check if a float is finite (not infinity or NaN). Parameters: (none).',
    examples: ['result.isFinite', 'calculation.isFinite()'],
    noParensAllowed: true,
    snippetTemplate: 'isFinite',
    pythonGenerator: (variable: string, resultVar: string = 'result') => {
      return `
import math
${resultVar} = math.isfinite(${variable})`
    },
    pythonImports: ['math']
  },
  {
    id: 'float-is-nan',
    name: 'isNaN',
    type: 'method',
    category: 'decimal',
    returnType: 'boolean',
    description: 'Check if a float is Not a Number (NaN). Parameters: (none).',
    examples: ['result.isNaN', 'calculation.isNaN()'],
    noParensAllowed: true,
    snippetTemplate: 'isNaN',
    pythonGenerator: (variable: string, resultVar: string = 'result') => {
      return `
import math
${resultVar} = math.isnan(${variable})`
    },
    pythonImports: ['math']
  },
  {
    id: 'float-is-infinite',
    name: 'isInfinite',
    type: 'method',
    category: 'decimal',
    returnType: 'boolean',
    description: 'Check if a float is infinite. Parameters: (none).',
    examples: ['result.isInfinite', 'division.isInfinite()'],
    noParensAllowed: true,
    snippetTemplate: 'isInfinite',
    pythonGenerator: (variable: string, resultVar: string = 'result') => {
      return `
import math
${resultVar} = math.isinf(${variable})`
    },
    pythonImports: ['math']
  },

  // === COMPARISON WITH TOLERANCE ===
  {
    id: 'float-equals-with-tolerance',
    name: 'equalsWithTolerance',
    type: 'method',
    category: 'decimal',
    returnType: 'boolean',
    description: 'Compare floats for equality with a tolerance. Parameters: target: number, tolerance: number.',
    examples: ['price.equalsWithTolerance(target: expected, tolerance: 0.01)', 'rate.equalsWithTolerance(target: expected, tolerance: 0.001)'],
    snippetTemplate: 'equalsWithTolerance(target: ${1:number}, tolerance: ${2:number})',
    parameters: [
      { name: 'target', type: 'number', required: true },
      { name: 'tolerance', type: 'number', required: true }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const target = params?.target || params?.arg1 || '0'
      const tolerance = params?.tolerance || params?.arg2 || '0.001'
      return `${resultVar} = abs(${variable} - ${target}) <= ${tolerance}`
    },
    pythonImports: []
  }
]