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
    allowedIn: ['assignment', 'expression', 'condition'],
    isPredicate: true,
    pythonGenerator: (variable: string, resultVar?: string, params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        const code = `validate_email(${variable})`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
      
      // 🔧 Inline mode: Generate multi-line code for standalone execution
      const code = `
import re
email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
bool(re.match(email_pattern, ${variable}))`
      if (resultVar === undefined) return code
      return `\n${code.replace(/^/gm, '')}`.replace(/^\n/, '').replace('bool(re.match', `${resultVar} = bool(re.match`)
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
    allowedIn: ['assignment', 'expression', 'condition'],
    isPredicate: true,
    pythonGenerator: (variable: string, resultVar?: string, params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        const code = `is_numeric_string(${variable})`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
      
      // 🔧 Inline mode: Generate direct Python code
      const code = `${variable}.isdigit()`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
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
    allowedIn: ['assignment', 'expression', 'condition'],
    isPredicate: true,
    pythonGenerator: (variable: string, resultVar?: string, params?: any, debugContext?: DebugContext) => {
      // 🚀 Debug mode: Use clean helper function for perfect line mapping
      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        const code = `is_empty_string(${variable})`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
      
      // 🔧 Inline mode: Generate direct Python code
      const code = `len(${variable}) == 0`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: []
  }
]