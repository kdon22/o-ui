// String utility methods for additional functionality
// 🎯 Enhanced with helper functions for perfect debug mapping

import type { UnifiedSchema, DebugContext } from '../../types'

// 🎯 INTERFACE-FIRST: String operation result interfaces for perfect IntelliSense
export interface StringSplitResult extends Array<string> {
  // Array of string parts from split operation
  readonly length: number
}

export const STRING_UTILITY_METHODS: UnifiedSchema[] = [
  // === HELPER FUNCTION METHODS (One-line Python generation) ===
  {
    id: 'string-maskData',
    name: 'maskData',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Mask sensitive data showing only specified characters from start/end',
    examples: [
      'customerSSN.maskData({showBeginCount: 3, showEndCount: 4})',
      'phoneNumber.maskData({showBeginCount: 3, showEndCount: 4, maskCharacter: "*"})'
    ],
    snippetTemplate: 'maskData({showBeginCount: ${1:3}, showEndCount: ${2:4}${3:, maskCharacter: "${4:*}"}})',
    
    // 🚀 ONE-LINE PYTHON using helper function
    debugInfo: {
      helperFunction: 'mask_string_data',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['showBeginCount', 'showEndCount', 'maskCharacter']
      }
    },
    parameters: [
      { 
        name: 'showBeginCount', 
        type: 'number', 
        required: true,
        description: 'Number of characters to show at start'
      },
      { 
        name: 'showEndCount', 
        type: 'number', 
        required: true,
        description: 'Number of characters to show at end'
      },
      { 
        name: 'maskCharacter', 
        type: 'string', 
        required: false,
        description: 'Character to use for masking (default: "*")'
      }
    ],
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const showBegin = params?.showBeginCount || 3
      const showEnd = params?.showEndCount || 4
      const maskChar = params?.maskCharacter || '*'
      
      return `${resultVar} = mask_string_data(${variable}, ${showBegin}, ${showEnd}, "${maskChar}")`
    },
    pythonImports: ['from helper_functions import mask_string_data']
  },

  {
    id: 'string-match',
    name: 'match',
    type: 'method',
    category: 'string',
    returnType: 'object',
    description: 'Tests string against a regex literal and exposes named groups within the block. If no named groups present, acts as boolean test only.',
    examples: [
      'if air.match(/(?<num1>\\d+)(?<word>[A-Z])+/)',
      '  if num1 = "9"\n    flagged = true',
      'if air.match(/AC\\d{3,4}/)\n  isAC = true'
    ],
    snippetTemplate: 'match(/${1:pattern}/${2:i})',
    parameters: [
      { name: 'regex', type: 'string', required: true }
    ],
    debugInfo: {
      helperFunction: 'regex_match',
      complexity: 'multi-line'
    },
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const raw = params?.regex || params?.arg1 || '/.*/'
      const match = String(raw).match(/^\/(.*)\/([gimsyu]*)$/)
      const pattern = match ? match[1] : String(raw)
      const flags = match ? match[2] : ''
      return `${resultVar} = regex_match(${variable}, r'${pattern}', '${flags}')`
    },
    pythonImports: ['from helper_functions import regex_match']
  },

  {
    id: 'string-truncate',
    name: 'truncate',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Truncate string from beginning and/or end',
    examples: [
      'longText.truncate({fromBegin: 5})',
      'longText.truncate({fromBegin: 5, fromEnd: 3})'
    ],
    snippetTemplate: 'truncate({fromBegin: ${1:0}${2:, fromEnd: ${3:0}}})',
    
    debugInfo: {
      helperFunction: 'truncate_string',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['fromBegin', 'fromEnd']
      }
    },
    parameters: [
      { 
        name: 'fromBegin', 
        type: 'number', 
        required: false,
        description: 'Number of characters to remove from start'
      },
      { 
        name: 'fromEnd', 
        type: 'number', 
        required: false,
        description: 'Number of characters to remove from end'
      }
    ],
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const fromBegin = params?.fromBegin || 0
      const fromEnd = params?.fromEnd || 0
      
      return `${resultVar} = truncate_string(${variable}, ${fromBegin}, ${fromEnd})`
    },
    pythonImports: ['from helper_functions import truncate_string']
  },

  {
    id: 'string-toCurrency',
    name: 'toCurrency',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Format number as currency with symbol and decimal places',
    examples: [
      'totalPrice.toCurrency()',
      'totalPrice.toCurrency({symbol: "€", decimals: 2})'
    ],
    snippetTemplate: 'toCurrency(${1:{symbol: "${2:$}", decimals: ${3:2\}}})',
    
    debugInfo: {
      helperFunction: 'format_currency',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['symbol', 'decimals']
      }
    },
    parameters: [
      { 
        name: 'symbol', 
        type: 'string', 
        required: false,
        description: 'Currency symbol (default: "$")'
      },
      { 
        name: 'decimals', 
        type: 'number', 
        required: false,
        description: 'Number of decimal places (default: 2)'
      }
    ],
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const symbol = params?.symbol || '$'
      const decimals = params?.decimals || 2
      
      return `${resultVar} = format_currency(${variable}, "${symbol}", ${decimals})`
    },
    pythonImports: ['from helper_functions import format_currency']
  },

  // === EXISTING METHODS (Updated with helper functions where applicable) ===
  // === ADDITIONAL USEFUL METHODS ===
  {
    id: 'string-to-int',
    name: 'toInt',
    type: 'method',
    category: 'string',
    returnType: 'number',
    description: 'Converts string to integer',
    examples: ['text.toInt()', 'ageText.toInt()'],
    snippetTemplate: 'toInt()',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = int(${variable})`,
    pythonImports: []
  },
  {
    id: 'string-length',
    name: 'length',
    type: 'method',
    category: 'string',
    returnType: 'number',
    description: 'Gets the length of the string',
    examples: ['text.length', 'name.length()'],
    noParensAllowed: true,
    snippetTemplate: 'length',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = len(${variable})`,
    pythonImports: []
  },
  {
    id: 'string-replace',
    name: 'replace',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Replaces all occurrences of a substring with another string',
    examples: ['text.replace("old", "new")', 'message.replace(searchTerm, replacement)'],
    snippetTemplate: 'replace("${1:string}", "${2:string}")',
    parameters: [
      { name: 'search', type: 'string', required: true },
      { name: 'replace', type: 'string', required: true }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const search = params?.search || params?.arg1 || '"search"'
      const replace = params?.replace || params?.arg2 || '"replace"'
      return `${resultVar} = ${variable}.replace(${search}, ${replace})`
    },
    pythonImports: []
  },
  {
    id: 'string-split',
    name: 'split',
    type: 'method',
    category: 'string',
    returnInterface: 'StringSplitResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Splits string into array by delimiter',
    examples: ['text.split(",")', 'csv.split(";")', 'words.split(" ")'],
    snippetTemplate: 'split("${1:string}")',
    parameters: [{ name: 'delimiter', type: 'string', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const delimiter = params?.delimiter || params?.arg1 || '","'
      return `${resultVar} = ${variable}.split(${delimiter})`
    },
    pythonImports: []
  }
]