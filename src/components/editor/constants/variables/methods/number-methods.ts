// Number Methods - Methods available on number variables  
// Usage: price.round(2), count.toString(), etc.

import type { CustomMethod } from '../../../types/variable-types'

export const NUMBER_METHODS: CustomMethod[] = [
  {
    name: 'toString',
    returnType: 'string',
    description: 'Converts number to string',
    example: 'price.toString()',
    category: 'number'
  },
  {
    name: 'round',
    returnType: 'number',
    parameters: [
      { name: 'decimals', type: 'number', optional: true, defaultValue: 0 }
    ],
    description: 'Rounds to specified decimal places',
    example: 'price.round(2)',
    category: 'number'
  },
  {
    name: 'floor',
    returnType: 'number',
    description: 'Rounds down to nearest integer',
    example: 'amount.floor()',
    category: 'number'
  },
  {
    name: 'ceil',
    returnType: 'number', 
    description: 'Rounds up to nearest integer',
    example: 'quantity.ceil()',
    category: 'number'
  },
  {
    name: 'abs',
    returnType: 'number',
    description: 'Returns absolute value',
    example: 'difference.abs()',
    category: 'number'
  },
  {
    name: 'toFixed',
    returnType: 'string',
    parameters: [
      { name: 'decimals', type: 'number' }
    ],
    description: 'Formats number with fixed decimal places',
    example: 'price.toFixed(2)',
    category: 'number'
  },
  {
    name: 'toPercent',
    returnType: 'string',
    parameters: [
      { name: 'decimals', type: 'number', optional: true, defaultValue: 1 }
    ],
    description: 'Converts to percentage string',
    example: 'ratio.toPercent(1)',
    category: 'number'
  },
  {
    name: 'toCurrency',
    returnType: 'string',
    parameters: [
      { name: 'currency', type: 'string', optional: true, defaultValue: 'USD' }
    ],
    description: 'Formats as currency',
    example: 'amount.toCurrency("EUR")',
    category: 'number'
  },
  {
    name: 'isPositive',
    returnType: 'boolean',
    description: 'Checks if number is positive',
    example: 'balance.isPositive()',
    category: 'number'
  },
  {
    name: 'isNegative',
    returnType: 'boolean',
    description: 'Checks if number is negative',
    example: 'balance.isNegative()',
    category: 'number'
  },
  {
    name: 'isZero',
    returnType: 'boolean',
    description: 'Checks if number is zero',
    example: 'balance.isZero()',
    category: 'number'
  },
  {
    name: 'between',
    returnType: 'boolean',
    parameters: [
      { name: 'min', type: 'number' },
      { name: 'max', type: 'number' }
    ],
    description: 'Checks if number is between min and max',
    example: 'age.between(18, 65)',
    category: 'number'
  }
] 