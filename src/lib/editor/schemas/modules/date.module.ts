// 🎯 Date Module - Interface-first approach for perfect IntelliSense
// All date operations with clean type definitions for maximum completion accuracy

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: Date operation result interfaces for perfect IntelliSense
export interface DateFormatResult extends String {} // Formatted date string
export interface DateParseResult {
  // Parsed date object with datetime properties
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
  timestamp: number
}
export interface DateAddResult extends DateParseResult {} // Date arithmetic result
export interface DateDiffResult extends Number {} // Difference in specified units

// 🎯 DATE MODULE SCHEMAS - Interface-first for perfect IntelliSense
export const DATE_MODULE_SCHEMAS: UnifiedSchema[] = [
  // === DATE FORMATTING ===
  {
    id: 'date-format',
    module: 'date',
    name: 'format',
    type: 'method',
    category: 'date',
    description: 'Format a date using a pattern string (returns formatted date string)',
    examples: [
      'date.format(today, "YYYY-MM-DD")',
      'date.format(booking_date, "DD/MM/YYYY")',
      'date.format(departure_time, "YYYY-MM-DD HH:mm:ss")'
    ],
    parameters: [
      {
        name: 'date',
        type: 'object',
        required: true,
        description: 'The date object to format'
      },
      {
        name: 'pattern',
        type: 'string',
        required: true,
        description: 'Format pattern (YYYY-MM-DD, DD/MM/YYYY, etc.)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'formatted_date', params: any) => {
      const dateVar = params?.date || params?.arg1 || 'date_obj'
      const pattern = params?.pattern || params?.arg2 || '"YYYY-MM-DD"'

      // Convert common patterns to Python strftime format
      const pythonPattern = pattern
        .replace(/"/g, '')
        .replace(/YYYY/g, '%Y')
        .replace(/MM/g, '%m')
        .replace(/DD/g, '%d')
        .replace(/HH/g, '%H')
        .replace(/mm/g, '%M')
        .replace(/ss/g, '%S')

      return `
from datetime import datetime
${resultVar} = ${dateVar}.strftime("${pythonPattern}")`
    },
    pythonImports: ['from datetime import datetime']
  },

  {
    id: 'date-parse',
    module: 'date',
    name: 'parse',
    type: 'method',
    category: 'date',
    returnInterface: 'DateParseResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Parse a date string into a structured date object with year, month, day, hour, minute, second, timestamp properties',
    examples: [
      'date.parse("2024-12-25")',
      'date.parse("25/12/2024", "DD/MM/YYYY")',
      'date.parse("2024-12-25 14:30:00", "YYYY-MM-DD HH:mm:ss")'
    ],
    parameters: [
      {
        name: 'dateString',
        type: 'string',
        required: true,
        description: 'The date string to parse'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Expected format pattern (auto-detected if not provided)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'parsed_date', params: any) => {
      const dateString = params?.dateString || params?.arg1 || '"2024-01-01"'
      const format = params?.format || params?.arg2

      if (format) {
        // Convert pattern to Python strftime format
        const pythonFormat = format
          .replace(/"/g, '')
          .replace(/YYYY/g, '%Y')
          .replace(/MM/g, '%m')
          .replace(/DD/g, '%d')
          .replace(/HH/g, '%H')
          .replace(/mm/g, '%M')
          .replace(/ss/g, '%S')

        return `
from datetime import datetime
${resultVar} = datetime.strptime(${dateString}, "${pythonFormat}")`
      } else {
        return `
from dateutil import parser
${resultVar} = parser.parse(${dateString})`
      }
    },
    pythonImports: ['from datetime import datetime', 'from dateutil import parser']
  },

  // === DATE ARITHMETIC ===
  {
    id: 'date-add-days',
    module: 'date',
    name: 'addDays',
    type: 'method',
    category: 'date',
    returnInterface: 'DateAddResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Add days to a date and return new date object with year, month, day, hour, minute, second, timestamp properties',
    examples: [
      'date.addDays(today, 30)',
      'date.addDays(departure_date, 7)',
      'date.addDays(booking_date, -5)'
    ],
    parameters: [
      {
        name: 'date',
        type: 'object',
        required: true,
        description: 'The base date'
      },
      {
        name: 'days',
        type: 'number',
        required: true,
        description: 'Number of days to add (negative to subtract)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'new_date', params: any) => {
      const dateVar = params?.date || params?.arg1 || 'date_obj'
      const days = params?.days || params?.arg2 || '1'

      return `
from datetime import timedelta
${resultVar} = ${dateVar} + timedelta(days=${days})`
    },
    pythonImports: ['from datetime import timedelta']
  },

  {
    id: 'date-add-months',
    module: 'date',
    name: 'addMonths',
    type: 'method',
    category: 'date',
    returnInterface: 'DateAddResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Add months to a date and return new date object with year, month, day, hour, minute, second, timestamp properties',
    examples: [
      'date.addMonths(today, 3)',
      'date.addMonths(expiry_date, 12)',
      'date.addMonths(start_date, -6)'
    ],
    parameters: [
      {
        name: 'date',
        type: 'object',
        required: true,
        description: 'The base date'
      },
      {
        name: 'months',
        type: 'number',
        required: true,
        description: 'Number of months to add (negative to subtract)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'new_date', params: any) => {
      const dateVar = params?.date || params?.arg1 || 'date_obj'
      const months = params?.months || params?.arg2 || '1'

      return `
from dateutil.relativedelta import relativedelta
${resultVar} = ${dateVar} + relativedelta(months=${months})`
    },
    pythonImports: ['from dateutil.relativedelta import relativedelta']
  },

  {
    id: 'date-diff',
    module: 'date',
    name: 'diff',
    type: 'method',
    category: 'date',
    description: 'Calculate difference between two dates (returns number in specified units)',
    examples: [
      'date.diff(end_date, start_date, "days")',
      'date.diff(expiry, today, "months")',
      'date.diff(checkout, checkin, "hours")'
    ],
    parameters: [
      {
        name: 'date1',
        type: 'object',
        required: true,
        description: 'First date (end date)'
      },
      { 
        name: 'date2', 
        type: 'object', 
        required: true,
        description: 'Second date (start date)'
      },
      { 
        name: 'unit', 
        type: 'string', 
        required: false,
        description: 'Unit of measurement: days, hours, minutes, seconds'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'date_diff', params: any) => {
      const date1 = params?.date1 || params?.arg1 || 'end_date'
      const date2 = params?.date2 || params?.arg2 || 'start_date'
      const unit = params?.unit?.replace(/"/g, '') || params?.arg3?.replace(/"/g, '') || 'days'
      
      let conversion = ''
      switch (unit) {
        case 'hours':
          conversion = ' / 3600'
          break
        case 'minutes':
          conversion = ' / 60'
          break
        case 'seconds':
          conversion = ''
          break
        default: // days
          conversion = ' / 86400'
      }
      
      return `
diff_seconds = (${date1} - ${date2}).total_seconds()
${resultVar} = int(diff_seconds${conversion})`
    },
    pythonImports: []
  },

  // === DATE VALIDATION ===
  {
    id: 'date-is-weekend',
    name: 'isWeekend',
    type: 'method',
    category: 'date',
    returnType: 'boolean',
    description: 'Check if a date falls on a weekend',
    examples: [
      'date.isWeekend(today)',
      'date.isWeekend(departure_date)',
      'date.isWeekend(booking_date)'
    ],
    parameters: [
      { 
        name: 'date', 
        type: 'object', 
        required: true,
        description: 'The date to check'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'is_weekend', params: any) => {
      const dateVar = params?.date || params?.arg1 || 'date_obj'
      
      return `
# Check if date is weekend (Saturday=5, Sunday=6)
${resultVar} = ${dateVar}.weekday() >= 5`
    },
    pythonImports: []
  },

  {
    id: 'date-is-business-day',
    name: 'isBusinessDay',
    type: 'method',
    category: 'date',
    returnType: 'boolean',
    description: 'Check if a date is a business day (Monday-Friday)',
    examples: [
      'date.isBusinessDay(today)',
      'date.isBusinessDay(meeting_date)',
      'date.isBusinessDay(deadline)'
    ],
    parameters: [
      { 
        name: 'date', 
        type: 'object', 
        required: true,
        description: 'The date to check'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'is_business_day', params: any) => {
      const dateVar = params?.date || params?.arg1 || 'date_obj'
      
      return `
# Check if date is business day (Monday=0 to Friday=4)
${resultVar} = ${dateVar}.weekday() < 5`
    },
    pythonImports: []
  },

  // === DATE CONSTANTS/VARIABLES ===
  {
    id: 'date-today',
    name: 'today',
    type: 'helper',
    category: 'date',
    returnInterface: 'DateParseResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Get current date',
    examples: [
      'date.today',
      'if booking_date > date.today'
    ],
    pythonGenerator: (variable: string, resultVar: string = 'today') => `
from datetime import datetime
${resultVar} = datetime.now().date()`,
    pythonImports: ['from datetime import datetime']
  },

  {
    id: 'date-tomorrow',
    name: 'tomorrow',
    type: 'helper',
    category: 'date',
    returnInterface: 'DateParseResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Get tomorrow\'s date',
    examples: [
      'date.tomorrow',
      'if departure_date == date.tomorrow'
    ],
    pythonGenerator: (variable: string, resultVar: string = 'tomorrow') => `
from datetime import datetime, timedelta
${resultVar} = (datetime.now() + timedelta(days=1)).date()`,
    pythonImports: ['from datetime import datetime, timedelta']
  },

  {
    id: 'date-yesterday',
    name: 'yesterday',
    type: 'helper',
    category: 'date',
    returnInterface: 'DateParseResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Get yesterday\'s date',
    examples: [
      'date.yesterday',
      'if created_date >= date.yesterday'
    ],
    pythonGenerator: (variable: string, resultVar: string = 'yesterday') => `
from datetime import datetime, timedelta
${resultVar} = (datetime.now() - timedelta(days=1)).date()`,
    pythonImports: ['from datetime import datetime, timedelta']
  }
] 