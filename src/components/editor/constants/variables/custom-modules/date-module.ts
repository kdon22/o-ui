// Date Module - Custom date functions and variables
// Provides comprehensive date handling for business rules

import type { CustomModule, CustomMethod, Variable, ObjectProperty } from '../../../types/variable-types'

// Date-related variables
const DATE_VARIABLES: Variable[] = [
  {
    name: 'today',
    type: 'date',
    value: null, // Will be resolved at runtime
    description: 'Current date',
    isBuiltIn: false,
    module: 'date'
  },
  {
    name: 'tomorrow',
    type: 'date', 
    value: null,
    description: 'Tomorrow\'s date',
    isBuiltIn: false,
    module: 'date'
  },
  {
    name: 'yesterday',
    type: 'date',
    value: null,
    description: 'Yesterday\'s date', 
    isBuiltIn: false,
    module: 'date'
  }
]

// Date methods
const DATE_METHODS: CustomMethod[] = [
  {
    name: 'format',
    returnType: 'string',
    parameters: [
      { name: 'date', type: 'date' },
      { name: 'format', type: 'string', optional: false }
    ],
    description: 'Format a date using pattern',
    example: 'Date.format(today, "YYYY-MM-DD")',
    module: 'date',
    category: 'date'
  },
  {
    name: 'parse',
    returnType: 'date',
    parameters: [
      { name: 'dateString', type: 'string' },
      { name: 'format', type: 'string', optional: true }
    ],
    description: 'Parse string to date',
    example: 'Date.parse("2024-12-25", "YYYY-MM-DD")',
    module: 'date',
    category: 'date'
  },
  {
    name: 'addDays',
    returnType: 'date',
    parameters: [
      { name: 'date', type: 'date' },
      { name: 'days', type: 'number' }
    ],
    description: 'Add days to a date',
    example: 'Date.addDays(today, 30)',
    module: 'date',
    category: 'date'
  },
  {
    name: 'addMonths', 
    returnType: 'date',
    parameters: [
      { name: 'date', type: 'date' },
      { name: 'months', type: 'number' }
    ],
    description: 'Add months to a date',
    example: 'Date.addMonths(today, 3)',
    module: 'date',
    category: 'date'
  },
  {
    name: 'diff',
    returnType: 'number',
    parameters: [
      { name: 'startDate', type: 'date' },
      { name: 'endDate', type: 'date' },
      { name: 'unit', type: 'string', optional: true, defaultValue: 'days' }
    ],
    description: 'Calculate difference between dates',
    example: 'Date.diff(startDate, endDate, "days")',
    module: 'date',
    category: 'date'
  },
  {
    name: 'isWeekend',
    returnType: 'boolean',
    parameters: [
      { name: 'date', type: 'date' }
    ],
    description: 'Check if date is weekend',
    example: 'Date.isWeekend(today)',
    module: 'date',
    category: 'date'
  },
  {
    name: 'isBusinessDay',
    returnType: 'boolean',
    parameters: [
      { name: 'date', type: 'date' }
    ],
    description: 'Check if date is business day',
    example: 'Date.isBusinessDay(today)',
    module: 'date',
    category: 'date'
  }
]

// Date object properties
const DATE_PROPERTIES: Record<string, ObjectProperty[]> = {
  Date: [
    { name: 'year', type: 'number', description: 'Full year (e.g., 2024)', module: 'date' },
    { name: 'month', type: 'number', description: 'Month (1-12)', module: 'date' },
    { name: 'day', type: 'number', description: 'Day of month (1-31)', module: 'date' },
    { name: 'dayOfWeek', type: 'number', description: 'Day of week (0=Sunday)', module: 'date' },
    { name: 'hour', type: 'number', description: 'Hour (0-23)', module: 'date' },
    { name: 'minute', type: 'number', description: 'Minute (0-59)', module: 'date' },
    { name: 'second', type: 'number', description: 'Second (0-59)', module: 'date' },
    { name: 'timestamp', type: 'number', description: 'Unix timestamp', module: 'date' }
  ]
}

// Complete Date module definition
export const DATE_MODULE: CustomModule = {
  name: 'date',
  description: 'Comprehensive date handling and manipulation functions',
  variables: DATE_VARIABLES,
  methods: DATE_METHODS,
  properties: DATE_PROPERTIES,
  version: '1.0.0',
  author: 'Business Rules Engine'
} 