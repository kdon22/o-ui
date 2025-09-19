// String case conversion and text manipulation methods
// 🎯 Enhanced with helper functions for perfect debug mapping

import type { UnifiedSchema, DebugContext } from '../../types'

export const STRING_CASE_CONVERSION_METHODS: UnifiedSchema[] = [
  // === CASE CONVERSION METHODS ===
  {
    id: 'string-to-proper-case',
    name: 'toProperCase',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Converts to proper case (Title Case)',
    examples: ['name.toProperCase', 'title.toProperCase()'],
    noParensAllowed: true,
    snippetTemplate: 'toProperCase',
    allowedIn: ['assignment', 'expression'],
    pythonGenerator: (variable: string, resultVar?: string) => {
      const code = `${variable}.title()`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: []
  },
  {
    id: 'string-to-lower-case',
    name: 'toLowerCase',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Converts string to lowercase',
    examples: ['name.toLowerCase', 'text.toLowerCase()'],
    noParensAllowed: true,
    snippetTemplate: 'toLowerCase',
    allowedIn: ['assignment', 'expression'],
    pythonGenerator: (variable: string, resultVar?: string) => {
      const code = `${variable}.lower()`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: []
  },
  {
    id: 'string-to-upper-case',
    name: 'toUpperCase',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Converts string to uppercase',
    examples: ['name.toUpperCase', 'text.toUpperCase()'],
    noParensAllowed: true,
    snippetTemplate: 'toUpperCase',
    allowedIn: ['assignment', 'expression'],
    pythonGenerator: (variable: string, resultVar?: string) => {
      const code = `${variable}.upper()`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: []
  },
  {
    id: 'string-contains',
    name: 'contains',
    type: 'method',
    category: 'string',
    returnType: 'boolean',
    description: 'Checks if string contains the specified substring or regex pattern',
    examples: [
      'text.contains("hello")', 
      'name.contains(searchTerm)',
      'input.contains(/\\d+/)',  // Regex pattern example
      'email.contains(/^[\\w.-]+@[\\w.-]+\\.\\w+$/)'
    ],
    snippetTemplate: 'contains("${1:string}")',
    parameters: [{ name: 'substring', type: 'string', required: true }],
    allowedIn: ['assignment', 'expression', 'condition'],
    isPredicate: true,
    pythonGenerator: (variable: string, resultVar?: string, params: any) => {
      const substring = params?.substring || params?.arg1 || params?.[0] || '"substring"'
      
      // 🚀 REGEX PATTERN DETECTION: Check if parameter is a regex pattern /pattern/
      const regexMatch = substring.match(/^\/(.+)\/([gimuy]*)$/)
      
      if (regexMatch) {
        // Extract regex pattern and flags
        const [, pattern, flags] = regexMatch
        const pythonPattern = `r'${pattern}'`  // Convert to Python raw string
        
        // Handle flags if present (Python uses different flag syntax)
        let flagsParam = ''
        if (flags) {
          const pythonFlags = []
          if (flags.includes('i')) pythonFlags.push('re.IGNORECASE')
          if (flags.includes('m')) pythonFlags.push('re.MULTILINE')
          if (flags.includes('s')) pythonFlags.push('re.DOTALL')
          if (pythonFlags.length > 0) {
            flagsParam = `, ${pythonFlags.join(' | ')}`
          }
        }
        
        // Generate Python regex code
        const regexCall = `re.search(${pythonPattern}, ${variable}${flagsParam})`
        
        if (resultVar === undefined) return `bool(${regexCall})`
        return `${resultVar} = bool(${regexCall})`
      } else {
        // Regular substring search
        const code = `${substring} in ${variable}`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
    },
    pythonImports: [] // Note: Dynamic import handling will be added in the translator
  },
  {
    id: 'string-trim-white-all',
    name: 'trimWhite',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Trims whitespace from both sides (default) or specified sides',
    examples: ['text.trimWhite', 'text.trimWhite("l")', 'text.trimWhite("r")'],
    noParensAllowed: true,
    snippetTemplate: 'trimWhite("${1:string}")',
    parameters: [
      { name: 'leftSide', type: 'string', required: false },
      { name: 'rightSide', type: 'string', required: false }
    ],
    allowedIn: ['assignment', 'expression'],
    pythonGenerator: (variable: string, resultVar?: string, params: any) => {
      const side1 = params?.arg1?.replace(/"/g, '')
      const code = !side1 ? `${variable}.strip()` : side1 === 'l' ? `${variable}.lstrip()` : side1 === 'r' ? `${variable}.rstrip()` : `${variable}.strip()`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: []
  }
]