// Number methods with comprehensive business functionality
// Includes snippet placeholders for tab navigation: ${1:placeholder}

import type { UnifiedSchema } from '../types'

export const NUMBER_METHOD_SCHEMAS: UnifiedSchema[] = [
  // === CONVERSION METHODS ===
  {
    id: 'number-to-string',
    name: 'toString',
    type: 'method',
    category: 'number',
    returnType: 'string',
    description: 'Convert a number to a string for display or concatenation. Parameters: (none).',
    examples: ['amount.toString', 'count.toString()'],
    noParensAllowed: true,
    snippetTemplate: 'toString',
    pythonGenerator: (variable: string, resultVar: string = 'result') => {
      if (resultVar === undefined) {
        return `str(${variable})`
      }
      return `${resultVar} = str(${variable})`
    },
    pythonImports: []
  },
  {
    id: 'number-to-fixed',
    name: 'toFixed',
    type: 'method',
    category: 'number',
    returnType: 'string',
    description: 'Format a number with a fixed number of decimal places. Parameters: decimals: number.',
    examples: ['price.toFixed(decimals: 2)', 'amount.toFixed(decimals: 0)'],
    snippetTemplate: 'toFixed(decimals: ${1:number})',
    parameters: [{ name: 'decimals', type: 'number', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const decimals = params?.decimals || params?.arg1 || '2'
      return `${resultVar} = f"{${variable}:.${decimals}f}"`
    },
    pythonImports: []
  },

  // === ROUNDING METHODS ===
  {
    id: 'number-round',
    name: 'round',
    type: 'method',
    category: 'number',
    returnType: 'number',
    description: 'Round a number to the specified decimal places. Parameters: decimals?: number (default 0).',
    examples: ['price.round(decimals: 2)', 'amount.round()'],
    snippetTemplate: 'round(decimals: ${1:number})',
    parameters: [{ name: 'decimals', type: 'number', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const decimals = params?.decimals || params?.arg1 || '0'
      if (decimals === '0') {
        return `${resultVar} = round(${variable})`
      } else {
        return `${resultVar} = round(${variable}, ${decimals})`
      }
    },
    pythonImports: []
  },
  {
    id: 'number-floor',
    name: 'floor',
    type: 'method',
    category: 'number',
    returnType: 'number',
    description: 'Round down to the nearest integer. Parameters: (none).',
    examples: ['amount.floor', 'value.floor()'],
    noParensAllowed: true,
    snippetTemplate: 'floor',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `import math\n${resultVar} = math.floor(${variable})`,
    pythonImports: ['math']
  },
  {
    id: 'number-ceil',
    name: 'ceil',
    type: 'method',
    category: 'number',
    returnType: 'number',
    description: 'Round up to the nearest integer. Parameters: (none).',
    examples: ['quantity.ceil', 'amount.ceil()'],
    noParensAllowed: true,
    snippetTemplate: 'ceil',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `import math\n${resultVar} = math.ceil(${variable})`,
    pythonImports: ['math']
  },
  {
    id: 'number-abs',
    name: 'abs',
    type: 'method',
    category: 'number',
    returnType: 'number',
    description: 'Get the absolute value of a number. Parameters: (none).',
    examples: ['difference.abs', 'balance.abs()'],
    noParensAllowed: true,
    snippetTemplate: 'abs',
    pythonGenerator: (variable: string, resultVar: string = 'result') => {
      if (resultVar === undefined) {
        return `abs(${variable})`
      }
      return `${resultVar} = abs(${variable})`
    },
    pythonImports: []
  },

  // === BUSINESS FORMATTING ===
  {
    id: 'number-to-percent',
    name: 'toPercent',
    type: 'method',
    category: 'number',
    returnType: 'string',
    description: 'Convert a number to a percentage string. Parameters: decimals?: number (default 1).',
    examples: ['ratio.toPercent(decimals: 1)', 'rate.toPercent(decimals: 2)'],
    snippetTemplate: 'toPercent(decimals: ${1:number})',
    parameters: [{ name: 'decimals', type: 'number', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const decimals = params?.decimals || params?.arg1 || '1'
      return `${resultVar} = f"{${variable} * 100:.${decimals}f}%"`
    },
    pythonImports: []
  },
  {
    id: 'number-to-currency',
    name: 'toCurrency',
    type: 'method',
    category: 'number',
    returnType: 'string',
    description: 'Format a number as currency with symbol. Parameters: curCode?: string (e.g., "USD", "EUR").',
    examples: [
      'amount.toCurrency(curCode: "USD")',
      'price.toCurrency(curCode: "EUR")'
    ],
    snippetTemplate: 'toCurrency(curCode: "${1:string}")',
    parameters: [{ name: 'curCode', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any, debugContext?: any) => {
      const curCodeExpr = params?.curCode || params?.arg1 || '"USD"'
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        // string helper handles currency formatting
        return `${resultVar} = string_helpers.format_currency(str(${variable}), ${curCodeExpr})`
      }
      return `
currency_symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "CAD": "C$", "AUD": "A$"}
symbol = currency_symbols.get(${curCodeExpr}, f"{${curCodeExpr}} ")
${resultVar} = f"{symbol}{${variable}:,.2f}"`
    },
    pythonImports: []
  },

  // === VALIDATION METHODS ===
  {
    id: 'number-is-positive',
    name: 'isPositive',
    type: 'method',
    category: 'number',
    returnType: 'boolean',
    description: 'Check if a number is greater than zero. Parameters: (none).',
    examples: ['balance.isPositive', 'amount.isPositive()'],
    noParensAllowed: true,
    snippetTemplate: 'isPositive',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable} > 0`,
    pythonImports: []
  },
  {
    id: 'number-is-negative',
    name: 'isNegative',
    type: 'method',
    category: 'number',
    returnType: 'boolean',
    description: 'Check if a number is less than zero. Parameters: (none).',
    examples: ['balance.isNegative', 'difference.isNegative()'],
    noParensAllowed: true,
    snippetTemplate: 'isNegative',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable} < 0`,
    pythonImports: []
  },
  {
    id: 'number-is-zero',
    name: 'isZero',
    type: 'method',
    category: 'number',
    returnType: 'boolean',
    description: 'Check if a number equals zero. Parameters: (none).',
    examples: ['balance.isZero', 'count.isZero()'],
    noParensAllowed: true,
    snippetTemplate: 'isZero',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable} == 0`,
    pythonImports: []
  },
  {
    id: 'number-between',
    name: 'between',
    type: 'method',
    category: 'number',
    returnType: 'boolean',
    description: 'Check if a number is between two values (inclusive). Parameters: min: number, max: number. Example: num2.between(min: minimum, max: maximum).',
    examples: ['age.between(min: 18, max: 65)', 'score.between(min: 0, max: 100)'],
    snippetTemplate: 'between(min: ${1:number}, max: ${2:number})',
    parameters: [
      { name: 'min', type: 'number', required: true },
      { name: 'max', type: 'number', required: true }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const min = params?.min || params?.arg1 || '0'
      const max = params?.max || params?.arg2 || '100'
      return `${resultVar} = ${min} <= ${variable} <= ${max}`
    },
    pythonImports: []
  }
] 