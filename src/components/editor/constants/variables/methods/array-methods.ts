// Array Methods - Methods available on array variables
// Usage: items.length, passengers.filter(), segments.map(), etc.

import type { CustomMethod } from '../../../types/variable-types'

export const ARRAY_METHODS: CustomMethod[] = [
  {
    name: 'length',
    returnType: 'number',
    description: 'Gets the number of items in array',
    example: 'passengers.length',
    category: 'array'
  },
  {
    name: 'push',
    returnType: 'array',
    parameters: [
      { name: 'item', type: 'unknown' }
    ],
    description: 'Adds item to end of array',
    example: 'items.push(newItem)',
    category: 'array'
  },
  {
    name: 'pop',
    returnType: 'unknown',
    description: 'Removes and returns last item',
    example: 'items.pop()',
    category: 'array'
  },
  {
    name: 'first',
    returnType: 'unknown',
    description: 'Gets the first item',
    example: 'passengers.first()',
    category: 'array'
  },
  {
    name: 'last',
    returnType: 'unknown',
    description: 'Gets the last item',
    example: 'segments.last()',
    category: 'array'
  },
  {
    name: 'isEmpty',
    returnType: 'boolean',
    description: 'Checks if array is empty',
    example: 'passengers.isEmpty()',
    category: 'array'
  },
  {
    name: 'contains',
    returnType: 'boolean',
    parameters: [
      { name: 'item', type: 'unknown' }
    ],
    description: 'Checks if array contains item',
    example: 'passengers.contains(passenger)',
    category: 'array'
  },
  {
    name: 'filter',
    returnType: 'array',
    parameters: [
      { name: 'condition', type: 'function' }
    ],
    description: 'Filters array by condition',
    example: 'passengers.filter(p => p.age > 18)',
    category: 'array'
  },
  {
    name: 'map',
    returnType: 'array',
    parameters: [
      { name: 'transform', type: 'function' }
    ],
    description: 'Transforms each item in array',
    example: 'passengers.map(p => p.name)',
    category: 'array'
  },
  {
    name: 'find',
    returnType: 'unknown',
    parameters: [
      { name: 'condition', type: 'function' }
    ],
    description: 'Finds first item matching condition',
    example: 'passengers.find(p => p.type == "ADT")',
    category: 'array'
  },
  {
    name: 'count',
    returnType: 'number',
    parameters: [
      { name: 'condition', type: 'function', optional: true }
    ],
    description: 'Counts items matching condition',
    example: 'passengers.count(p => p.age < 18)',
    category: 'array'
  },
  {
    name: 'unique',
    returnType: 'array',
    description: 'Removes duplicate items',
    example: 'values.unique()',
    category: 'array'
  },
  {
    name: 'sort',
    returnType: 'array',
    parameters: [
      { name: 'field', type: 'string', optional: true }
    ],
    description: 'Sorts array by field or naturally',
    example: 'passengers.sort("age")',
    category: 'array'
  },
  {
    name: 'join',
    returnType: 'string',
    parameters: [
      { name: 'separator', type: 'string', optional: true, defaultValue: ',' }
    ],
    description: 'Joins array items into string',
    example: 'names.join(", ")',
    category: 'array'
  },
  {
    name: 'sum',
    returnType: 'number',
    parameters: [
      { name: 'field', type: 'string', optional: true }
    ],
    description: 'Sums numeric values or field',
    example: 'amounts.sum() or bookings.sum("totalAmount")',
    category: 'array'
  },
  {
    name: 'average',
    returnType: 'number',
    parameters: [
      { name: 'field', type: 'string', optional: true }
    ],
    description: 'Calculates average of numeric values',
    example: 'scores.average() or bookings.average("amount")',
    category: 'array'
  }
] 