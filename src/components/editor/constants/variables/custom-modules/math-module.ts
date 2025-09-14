// Math Module - Custom mathematical functions and constants
// Provides comprehensive math operations for business rules

import type { CustomModule, CustomMethod, Variable, ObjectProperty } from '../../../types/variable-types'

// Math constants
const MATH_VARIABLES: Variable[] = [
  {
    name: 'PI',
    type: 'number',
    value: 3.14159265359,
    description: 'Mathematical constant π',
    isBuiltIn: false,
    module: 'math'
  },
  {
    name: 'E',
    type: 'number', 
    value: 2.71828182846,
    description: 'Mathematical constant e',
    isBuiltIn: false,
    module: 'math'
  }
]

// Math methods
const MATH_METHODS: CustomMethod[] = [
  {
    name: 'round',
    returnType: 'number',
    parameters: [
      { name: 'number', type: 'number' },
      { name: 'decimals', type: 'number', optional: true, defaultValue: 0 }
    ],
    description: 'Round number to specified decimals',
    example: 'Math.round(3.14159, 2)',
    module: 'math',
    category: 'math'
  },
  {
    name: 'ceil',
    returnType: 'number',
    parameters: [
      { name: 'number', type: 'number' }
    ],
    description: 'Round up to nearest integer',
    example: 'Math.ceil(3.14)',
    module: 'math',
    category: 'math'
  },
  {
    name: 'floor',
    returnType: 'number',
    parameters: [
      { name: 'number', type: 'number' }
    ],
    description: 'Round down to nearest integer',
    example: 'Math.floor(3.99)',
    module: 'math',
    category: 'math'
  },
  {
    name: 'abs',
    returnType: 'number',
    parameters: [
      { name: 'number', type: 'number' }
    ],
    description: 'Absolute value',
    example: 'Math.abs(-5)',
    module: 'math',
    category: 'math'
  },
  {
    name: 'min',
    returnType: 'number',
    parameters: [
      { name: 'numbers', type: 'array' }
    ],
    description: 'Find minimum value in array',
    example: 'Math.min([1, 2, 3])',
    module: 'math',
    category: 'math'
  },
  {
    name: 'max',
    returnType: 'number',
    parameters: [
      { name: 'numbers', type: 'array' }
    ],
    description: 'Find maximum value in array',
    example: 'Math.max([1, 2, 3])',
    module: 'math',
    category: 'math'
  },
  {
    name: 'sum',
    returnType: 'number',
    parameters: [
      { name: 'numbers', type: 'array' }
    ],
    description: 'Sum all numbers in array',
    example: 'Math.sum([1, 2, 3, 4])',
    module: 'math',
    category: 'math'
  },
  {
    name: 'average',
    returnType: 'number',
    parameters: [
      { name: 'numbers', type: 'array' }
    ],
    description: 'Calculate average of numbers',
    example: 'Math.average([10, 20, 30])',
    module: 'math',
    category: 'math'
  },
  {
    name: 'percentage',
    returnType: 'number',
    parameters: [
      { name: 'part', type: 'number' },
      { name: 'total', type: 'number' }
    ],
    description: 'Calculate percentage',
    example: 'Math.percentage(25, 100)',
    module: 'math',
    category: 'math'
  },
  {
    name: 'random',
    returnType: 'number',
    parameters: [
      { name: 'min', type: 'number', optional: true, defaultValue: 0 },
      { name: 'max', type: 'number', optional: true, defaultValue: 1 }
    ],
    description: 'Generate random number between min and max',
    example: 'Math.random(1, 100)',
    module: 'math',
    category: 'math'
  }
]

// Math object properties (if needed)
const MATH_PROPERTIES: Record<string, ObjectProperty[]> = {}

// Complete Math module definition
export const MATH_MODULE: CustomModule = {
  name: 'math',
  description: 'Comprehensive mathematical operations and constants',
  variables: MATH_VARIABLES,
  methods: MATH_METHODS,
  properties: MATH_PROPERTIES,
  version: '1.0.0',
  author: 'Business Rules Engine'
} 