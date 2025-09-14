// String validation methods with comprehensive business-focused functionality
// 🎯 Enhanced with helper functions for perfect debug mapping

import type { UnifiedSchema, DebugContext } from '../../types'

export const STRING_VALIDATION_METHODS: UnifiedSchema[] = [
  // === VALIDATION METHODS ===
  {
    id: 'string-is-email',
    name: 'isEmail',
    type: 'method',
    category: 'string',
    returnType: 'boolean',
    description: 'Checks if string is a valid email address',
    examples: ['email.isEmail', 'userInput.isEmail()'],
    noParensAllowed: true,
    snippetTemplate: 'isEmail',
    // 🎯 Debug mapping for email validation
    debugInfo: {
      helperFunction: 'validate_email',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: []
      }
    },
    pythonGenerator: (variable: string, resultVar: string = 'result', params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        return `${resultVar} = validate_email(${variable})`
      }
      
      // 🔧 Inline mode: Generate multi-line code for standalone execution
      return `
import re
email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
${resultVar} = bool(re.match(email_pattern, ${variable}))`
    },
    pythonImports: ['re']
  },
  {
    id: 'string-is-numeric',
    name: 'isNumeric',
    type: 'method',
    category: 'string',
    returnType: 'boolean',
    description: 'Checks if string contains only numeric characters',
    examples: ['age.isNumeric', 'phoneNumber.isNumeric()'],
    noParensAllowed: true,
    snippetTemplate: 'isNumeric',
    // 🎯 Debug mapping for numeric validation
    debugInfo: {
      helperFunction: 'is_numeric_string',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: []
      }
    },
    pythonGenerator: (variable: string, resultVar: string = 'result', params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        return `${resultVar} = is_numeric_string(${variable})`
      }
      
      // 🔧 Inline mode: Generate direct Python code
      return `${resultVar} = ${variable}.isdigit()`
    },
    pythonImports: []
  },
  {
    id: 'string-is-empty',
    name: 'isEmpty',
    type: 'method',
    category: 'string',
    returnType: 'boolean',
    description: 'Checks if string is empty',
    examples: ['input.isEmpty', 'name.isEmpty()'],
    noParensAllowed: true,
    snippetTemplate: 'isEmpty',
    // 🎯 Debug mapping for empty check
    debugInfo: {
      helperFunction: 'is_empty_string',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: []
      }
    },
    pythonGenerator: (variable: string, resultVar: string = 'result', params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        return `${resultVar} = is_empty_string(${variable})`
      }
      
      // 🔧 Inline mode: Generate direct Python code
      return `${resultVar} = len(${variable}) == 0`
    },
    pythonImports: []
  }
]