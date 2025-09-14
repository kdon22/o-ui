// 🎯 Math Module - Interface-first approach for perfect IntelliSense
// All mathematical operations with clean type definitions

import type { UnifiedSchema } from '../types'

// Math operations return numbers, so no additional interfaces needed
// Using TypeScript's built-in number type for perfect IntelliSense

// 🎯 MATH MODULE SCHEMAS - Interface-first for perfect IntelliSense
export const MATH_MODULE_SCHEMAS: UnifiedSchema[] = [
  // === MATH CONSTANTS ===
  {
    id: 'math-pi',
    module: 'math',
    name: 'PI',
    type: 'helper',
    category: 'math',
    description: 'Mathematical constant π (pi) - approximately 3.14159',
    docstring: `The mathematical constant π (pi), representing the ratio of a circle's circumference to its diameter.

**Value:** 3.14159265359...

**Common Applications:**
• Circle calculations (area, circumference)
• Trigonometry and wave functions
• Statistical distributions
• Engineering calculations
• Physics formulas

**Example Calculations:**
\`\`\`
area = math.PI * radius * radius
circumference = 2 * math.PI * radius
sine_wave = amplitude * sin(2 * math.PI * frequency * time)
\`\`\`

**High Precision:** Uses Python's math.pi for maximum accuracy.`,
    examples: [
      'math.PI',
      'circumference = 2 * math.PI * radius'
    ],
    pythonGenerator: (variable: string, resultVar: string = 'PI') => `
import math
${resultVar} = math.pi`,
    pythonImports: ['import math']
  },

  {
    id: 'math-e',
    module: 'math',
    name: 'E',
    type: 'helper',
    category: 'math',
    description: 'Mathematical constant e (Euler\'s number) - approximately 2.71828',
    examples: [
      'math.E',
      'exponential_growth = base * math.E ** rate'
    ],
    pythonGenerator: (variable: string, resultVar: string = 'E') => `
import math
${resultVar} = math.e`,
    pythonImports: ['import math']
  },

  // === ROUNDING OPERATIONS ===
  {
    id: 'math-round',
    module: 'math',
    name: 'round',
    type: 'method',
    category: 'math',
    description: 'Round a number to the specified decimal places',
    examples: [
      'math.round(number: 3.14159, decimals: 2)',
      'math.round(number: price, decimals: 2)',
      'math.round(average_score)'
    ],
    snippetTemplate: 'round(number: ${1:number}, decimals: ${2:number})',
    parameters: [
      {
        name: 'number',
        type: 'number',
        required: true,
        description: 'The number to round'
      },
      {
        name: 'decimals',
        type: 'number',
        required: false,
        description: 'Number of decimal places (default: 0)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'rounded_value', params: any) => {
      const number = params?.number || params?.arg1 || '0'
      const decimals = params?.decimals || params?.arg2 || '0'

      if (decimals === '0' || !decimals) {
        return `${resultVar} = round(${number})`
      } else {
        return `${resultVar} = round(${number}, ${decimals})`
      }
    },
    pythonImports: []
  },

  {
    id: 'math-ceil',
    module: 'math',
    name: 'ceil',
    type: 'method',
    category: 'math',
    description: 'Round up to the nearest integer',
    examples: [
      'math.ceil(number: 3.14)',
      'math.ceil(number: passenger_count / seats_per_row)',
      'math.ceil(number: total_pages)'
    ],
    snippetTemplate: 'ceil(number: ${1:number})',
    parameters: [
      {
        name: 'number',
        type: 'number',
        required: true,
        description: 'The number to round up'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'ceiling_value', params: any) => {
      const number = params?.number || params?.arg1 || '0'
      return `
import math
${resultVar} = math.ceil(${number})`
    },
    pythonImports: ['import math']
  },

  {
    id: 'math-floor',
    module: 'math',
    name: 'floor',
    type: 'method',
    category: 'math',
    description: 'Round down to the nearest integer',
    examples: [
      'math.floor(number: 3.99)',
      'math.floor(number: discount_percentage)',
      'math.floor(number: available_seats)'
    ],
    snippetTemplate: 'floor(number: ${1:number})',
    parameters: [
      {
        name: 'number',
        type: 'number',
        required: true,
        description: 'The number to round down'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'floor_value', params: any) => {
      const number = params?.number || params?.arg1 || '0'
      return `
import math
${resultVar} = math.floor(${number})`
    },
    pythonImports: ['import math']
  },

  {
    id: 'math-abs',
    module: 'math',
    name: 'abs',
    type: 'method',
    category: 'math',
    description: 'Get the absolute value of a number',
    examples: [
      'math.abs(number: -5)',
      'math.abs(number: price_difference)',
      'math.abs(number: temperature_change)'
    ],
    snippetTemplate: 'abs(number: ${1:number})',
    parameters: [
      {
        name: 'number',
        type: 'number',
        required: true,
        description: 'The number to get absolute value of'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'absolute_value', params: any) => {
      const number = params?.number || params?.arg1 || '0'

      return `${resultVar} = abs(${number})`
    },
    pythonImports: []
  },

  // === ARRAY OPERATIONS ===
  {
    id: 'math-min',
    module: 'math',
    name: 'min',
    type: 'method',
    category: 'math',
    description: 'Find the minimum value in an array of numbers',
    examples: [
      'math.min(numbers: [1, 2, 3, 4, 5])',
      'math.min(numbers: prices)',
      'math.min(numbers: scores)'
    ],
    snippetTemplate: 'min(numbers: ${1:array<number>})',
    parameters: [
      {
        name: 'numbers',
        type: 'array',
        required: true,
        description: 'Array of numbers to find minimum from'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'minimum_value', params: any) => {
      const numbers = params?.numbers || params?.arg1 || '[0]'

      return `${resultVar} = min(${numbers})`
    },
    pythonImports: []
  },

  {
    id: 'math-max',
    module: 'math',
    name: 'max',
    type: 'method',
    category: 'math',
    description: 'Find the maximum value in an array of numbers',
    examples: [
      'math.max(numbers: [1, 2, 3, 4, 5])',
      'math.max(numbers: prices)',
      'math.max(numbers: scores)'
    ],
    snippetTemplate: 'max(numbers: ${1:array<number>})',
    parameters: [
      {
        name: 'numbers',
        type: 'array',
        required: true,
        description: 'Array of numbers to find maximum from'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'maximum_value', params: any) => {
      const numbers = params?.numbers || params?.arg1 || '[0]'

      return `${resultVar} = max(${numbers})`
    },
    pythonImports: []
  },

  {
    id: 'math-sum',
    name: 'sum',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Calculate the sum of all numbers in an array',
    examples: [
      'math.sum(numbers: [1, 2, 3, 4, 5])',
      'math.sum(numbers: invoice_amounts)',
      'math.sum(numbers: passenger_ages)'
    ],
    // 🎯 Add missing snippetTemplate for consistency
    snippetTemplate: 'sum(numbers: ${1:array<number>})',
    parameters: [
      { 
        name: 'numbers', 
        type: 'array', 
        required: true,
        description: 'Array of numbers to sum'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'total_sum', params: any) => {
      const numbers = params?.numbers || params?.arg1 || '[0]'
      
      return `${resultVar} = sum(${numbers})`
    },
    pythonImports: []
  },

  {
    id: 'math-average',
    name: 'average',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Calculate the average (mean) of numbers in an array',
    examples: [
      'math.average(numbers: [10, 20, 30])',
      'math.average(numbers: test_scores)',
      'math.average(numbers: monthly_revenues)'
    ],
    // 🎯 CRITICAL FIX: Add missing snippetTemplate for parameter completion
    snippetTemplate: 'average(numbers: ${1:array<number>})',
    parameters: [
      { 
        name: 'numbers', 
        type: 'array', 
        required: true,
        description: 'Array of numbers to calculate average from'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'average_value', params: any) => {
      const numbers = params?.numbers || params?.arg1 || '[0]'
      
      return `
total = sum(${numbers})
count = len(${numbers})
${resultVar} = total / count if count > 0 else 0`
    },
    pythonImports: []
  },

  // === BUSINESS CALCULATIONS ===
  {
    id: 'math-percentage',
    name: 'percentage',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Calculate what percentage one number is of another',
    examples: [
      'math.percentage(part: 25, total: 100)',
      'math.percentage(part: completed_tasks, total: total_tasks)',
      'math.percentage(part: discount_amount, total: original_price)'
    ],
    // 🎯 Rich snippet completion with tab navigation and named parameters
    snippetTemplate: 'percentage(part: ${1:part_var}, total: ${2:total_var})',
    parameters: [
      { 
        name: 'part', 
        type: 'number', 
        required: true,
        description: 'The part value (numerator)'
      },
      { 
        name: 'total', 
        type: 'number', 
        required: true,
        description: 'The total value (denominator)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'percentage_value', params: any) => {
      const part = params?.part || params?.arg1 || '0'
      const total = params?.total || params?.arg2 || '1'
      
      return `${resultVar} = (${part} / ${total}) * 100 if ${total} != 0 else 0`
    },
    pythonImports: []
  },

  {
    id: 'math-power',
    name: 'power',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Calculate base raised to the power of exponent',
    examples: [
      'math.power(2, 3)',
      'math.power(interest_rate, years)',
      'math.power(base_value, growth_factor)'
    ],
    parameters: [
      { 
        name: 'base', 
        type: 'number', 
        required: true,
        description: 'The base number'
      },
      { 
        name: 'exponent', 
        type: 'number', 
        required: true,
        description: 'The exponent (power)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'power_result', params: any) => {
      const base = params?.base || params?.arg1 || '1'
      const exponent = params?.exponent || params?.arg2 || '1'
      
      return `${resultVar} = ${base} ** ${exponent}`
    },
    pythonImports: []
  },

  {
    id: 'math-sqrt',
    name: 'sqrt',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Calculate the square root of a number',
    examples: [
      'math.sqrt(16)',
      'math.sqrt(area)',
      'math.sqrt(variance)'
    ],
    parameters: [
      { 
        name: 'number', 
        type: 'number', 
        required: true,
        description: 'The number to calculate square root of'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'sqrt_result', params: any) => {
      const number = params?.number || params?.arg1 || '0'
      return `
import math
${resultVar} = math.sqrt(${number})`
    },
    pythonImports: ['import math']
  },

  // === RANDOM NUMBER GENERATION ===
  {
    id: 'math-random',
    name: 'random',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Generate a random number between min and max',
    examples: [
      'math.random(1, 100)',
      'math.random(0, 1)',
      'math.random(min_price, max_price)'
    ],
    parameters: [
      { 
        name: 'min', 
        type: 'number', 
        required: false,
        description: 'Minimum value (default: 0)'
      },
      { 
        name: 'max', 
        type: 'number', 
        required: false,
        description: 'Maximum value (default: 1)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'random_value', params: any) => {
      const min = params?.min || params?.arg1 || '0'
      const max = params?.max || params?.arg2 || '1'
      return `
import random
${resultVar} = random.uniform(${min}, ${max})`
    },
    pythonImports: ['import random']
  },

  {
    id: 'math-random-int',
    name: 'randomInt',
    type: 'method',
    category: 'math',
    returnType: 'number',
    description: 'Generate a random integer between min and max (inclusive)',
    examples: [
      'math.randomInt(1, 6)',
      'math.randomInt(10, 99)',
      'math.randomInt(min_id, max_id)'
    ],
    parameters: [
      { 
        name: 'min', 
        type: 'number', 
        required: true,
        description: 'Minimum integer value (inclusive)'
      },
      { 
        name: 'max', 
        type: 'number', 
        required: true,
        description: 'Maximum integer value (inclusive)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'random_int', params: any) => {
      const min = params?.min || params?.arg1 || '0'
      const max = params?.max || params?.arg2 || '1'
      return `
import random
${resultVar} = random.randint(${min}, ${max})`
    },
    pythonImports: ['import random']
  }
] 