// 🎯 Array Methods - Interface-first approach for perfect IntelliSense
// Comprehensive array operations with clean type definitions

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: Array operation result interfaces for perfect IntelliSense
export interface ArrayLengthResult extends Number {
  // Number of items in array
}

export interface ArrayFirstResult {
  // First item in array (any type)
  [key: string]: any
}

export interface ArrayLastResult {
  // Last item in array (any type)
  [key: string]: any
}

export interface ArrayIsEmptyResult extends Boolean {
  // Boolean result for emptiness check
}

export interface ArrayContainsResult extends Boolean {
  // Boolean result for containment check
}

export interface ArrayIndexOfResult extends Number {
  // Index of item in array (-1 if not found)
}

export interface ArraySliceResult extends Array<any> {
  // Subset of array items
  readonly length: number
}

export interface ArrayMapResult extends Array<any> {
  // Array with transformed items
  readonly length: number
}

export interface ArrayFilterResult extends Array<any> {
  // Array with filtered items
  readonly length: number
}

export interface ArraySortResult extends Array<any> {
  // Sorted array
  readonly length: number
}

export interface ArrayJoinResult extends String {
  // Joined string from array items
}

export const ARRAY_METHOD_SCHEMAS: UnifiedSchema[] = [
  // === ARRAY PROPERTIES ===
  {
    id: 'array-length',
    module: 'methods',
    name: 'length',
    type: 'method',
    category: 'array',
    description: 'Gets the number of items in array',
    examples: ['passengers.length', 'items.length()'],
    noParensAllowed: true,
    snippetTemplate: 'length',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = len(${variable})`,
    pythonImports: []
  },

  // === ARRAY ACCESS ===
  {
    id: 'array-first',
    module: 'methods',
    name: 'first',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayFirstResult', // 🎯 Interface reference for perfect IntelliSense
    returnObject: {
      name: 'ArrayFirstResult',
      properties: {}
    },
    description: 'Gets the first item in the array',
    examples: ['passengers.first', 'segments.first()'],
    noParensAllowed: true,
    snippetTemplate: 'first',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable}[0] if ${variable} else None`,
    pythonImports: []
  },
  {
    id: 'array-last',
    module: 'methods',
    name: 'last',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayLastResult', // 🎯 Interface reference for perfect IntelliSense
    returnObject: {
      name: 'ArrayLastResult',
      properties: {}
    },
    description: 'Gets the last item in the array',
    examples: ['passengers.last', 'segments.last()'],
    noParensAllowed: true,
    snippetTemplate: 'last',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable}[-1] if ${variable} else None`,
    pythonImports: []
  },

  // === ARRAY VALIDATION ===
    {
    id: 'array-is-empty',
    name: 'isEmpty',
    type: 'method',
    category: 'array',
    returnType: 'boolean', // ✅ Primitive boolean return type
    description: 'Checks if array is empty',
    examples: ['passengers.isEmpty', 'items.isEmpty()'],
    noParensAllowed: true,
    snippetTemplate: 'isEmpty',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = len(${variable}) == 0`,
    pythonImports: []
  },
  {
    id: 'array-contains',
    name: 'contains',
    type: 'method',
    category: 'array',
    returnType: 'boolean', // ✅ Primitive boolean return type
    description: 'Checks if array contains the specified item',
    examples: ['passengers.contains(targetPassenger)', 'items.contains("specific_item")'],
    snippetTemplate: 'contains(${1:any})',
    parameters: [{ name: 'item', type: 'object', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) =>
      `${resultVar} = ${params?.arg1 || 'item'} in ${variable}`,
    pythonImports: []
  },

  // === ARRAY MANIPULATION ===
  {
    id: 'array-push',
    name: 'push',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayMapResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Adds item to the end of the array',
    examples: ['items.push(newItem)', 'passengers.push(passenger)'],
    snippetTemplate: 'push(${1:any})',
    parameters: [{ name: 'item', type: 'object', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      // Multi-line code needs proper formatting for assignments
      return `${variable}.append(${params?.arg1 || 'item'})
${resultVar} = ${variable}`
    },
    pythonImports: []
  },
  {
    id: 'array-pop',
    name: 'pop',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayLastResult', // 🎯 Interface reference for perfect IntelliSense
    returnObject: {
      name: 'ArrayLastResult',
      properties: {}
    },
    description: 'Removes and returns the last item from the array',
    examples: ['items.pop', 'passengers.pop()'],
    noParensAllowed: true,
    snippetTemplate: 'pop',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = ${variable}.pop() if ${variable} else None`,
    pythonImports: []
  },

  // === ARRAY FILTERING & TRANSFORMATION ===
  {
    id: 'array-filter',
    name: 'filter',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayFilterResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Filters array items by condition',
    examples: [
      'passengers.filter(lambda p: p.age > 18)',
      'items.filter(lambda x: x.status == "active")'
    ],
    snippetTemplate: 'filter(lambda ${1:any}: ${2:boolean})',
    parameters: [{ name: 'condition', type: 'string', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) =>
      `${resultVar} = [item for item in ${variable} if ${params?.condition || 'True'}]`,
    pythonImports: []
  },
  {
    id: 'array-find',
    name: 'find',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayFirstResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Finds first item matching condition',
    examples: [
      'passengers.find(lambda p: p.type == "ADT")',
      'items.find(lambda x: x.id == target_id)'
    ],
    snippetTemplate: 'find(lambda ${1:any}: ${2:boolean})',
    parameters: [{ name: 'condition', type: 'string', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) =>
      `${resultVar} = next((item for item in ${variable} if ${params?.condition || 'True'}), None)`,
    pythonImports: []
  },

  // === ARRAY AGGREGATION ===
  {
    id: 'array-count',
    name: 'count',
    type: 'method',
    category: 'array',
    returnType: 'number',
    description: 'Counts items matching optional condition',
    examples: [
      'passengers.count(lambda p: p.age < 18)',
      'items.count()',
      'statuses.count(lambda s: s == "active")'
    ],
    snippetTemplate: 'count(lambda ${1:any}: ${2:boolean})',
    parameters: [{ name: 'condition', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      if (params?.condition) {
        return `${resultVar} = sum(1 for item in ${variable} if ${params.condition})`
      } else {
        return `${resultVar} = len(${variable})`
      }
    },
    pythonImports: []
  },
  {
    id: 'array-sum',
    name: 'sum',
    type: 'method',
    category: 'array',
    returnType: 'number',
    description: 'Sums numeric values or specified field',
    examples: [
      'amounts.sum()',
      'bookings.sum("totalAmount")',
      'prices.sum("price")'
    ],
    snippetTemplate: 'sum("${1:string}")',
    parameters: [{ name: 'field', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      if (params?.field) {
        const field = params.field.replace(/"/g, '')
        return `${resultVar} = sum(getattr(item, '${field}', 0) for item in ${variable})`
      } else {
        return `${resultVar} = sum(${variable})`
      }
    },
    pythonImports: []
  },
  {
    id: 'array-average',
    name: 'average',
    type: 'method',
    category: 'array',
    returnType: 'number',
    description: 'Calculates average of numeric values or field',
    examples: [
      'scores.average()',
      'bookings.average("amount")',
      'ratings.average("score")'
    ],
    snippetTemplate: 'average("${1:string}")',
    parameters: [{ name: 'field', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      if (params?.field) {
        const field = params.field.replace(/"/g, '')
        return `
values = [getattr(item, '${field}', 0) for item in ${variable}]
${resultVar} = sum(values) / len(values) if values else 0`
      } else {
        return `${resultVar} = sum(${variable}) / len(${variable}) if ${variable} else 0`
      }
    },
    pythonImports: []
  },

  // === ARRAY UTILITIES ===
  {
    id: 'array-unique',
    name: 'unique',
    type: 'method',
    category: 'array',
    returnInterface: 'ArrayFilterResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Removes duplicate items from array',
    examples: ['values.unique', 'names.unique()'],
    noParensAllowed: true,
    snippetTemplate: 'unique',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = list(set(${variable}))`,
    pythonImports: []
  },
  {
    id: 'array-sort',
    name: 'sort',
    type: 'method',
    category: 'array',
    returnInterface: 'ArraySortResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Sorts array by field or naturally',
    examples: [
      'passengers.sort("age")',
      'names.sort()',
      'items.sort("created_date")'
    ],
    snippetTemplate: 'sort("${1:string}")',
    parameters: [{ name: 'field', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      if (params?.field) {
        const field = params.field.replace(/"/g, '')
        return `${resultVar} = sorted(${variable}, key=lambda x: getattr(x, '${field}', 0))`
      } else {
        return `${resultVar} = sorted(${variable})`
      }
    },
    pythonImports: []
  },
  {
    id: 'array-join',
    name: 'join',
    type: 'method',
    category: 'array',
    returnType: 'string',
    description: 'Joins array items into a string with separator',
    examples: [
      'names.join(", ")',
      'items.join(" | ")',
      'codes.join("-")'
    ],
    snippetTemplate: 'join("${1:string}")',
    parameters: [{ name: 'separator', type: 'string', required: false }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const separator = params?.separator || '", "'
      return `${resultVar} = ${separator}.join(str(item) for item in ${variable})`
    },
    pythonImports: []
  }
] 