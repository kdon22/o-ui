// String encoding and transformation methods
// 🎯 Enhanced with helper functions for perfect debug mapping

import type { UnifiedSchema, DebugContext } from '../../types'

export const STRING_ENCODING_METHODS: UnifiedSchema[] = [
  // === ENCODING METHODS ===
  {
    id: 'string-to-base64',
    name: 'toBase64',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Encodes string to Base64',
    examples: ['data.toBase64', 'credentials.toBase64()'],
    noParensAllowed: true,
    snippetTemplate: 'toBase64',
    allowedIn: ['assignment', 'expression', 'condition'],
    pythonGenerator: (variable: string, resultVar?: string, params?: any, debugContext?: any) => {
      // 🚀 Use helper function for perfect debug mapping
      if (debugContext?.useHelpers) {
        const code = `string_helpers.encode_base64(${variable})`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
      // Fallback to inline code if helpers not available
      const code = `base64.b64encode(${variable}.encode('utf-8')).decode('utf-8')`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: ['base64'],
    debugInfo: {
      helperFunction: 'string_helpers.encode_base64',
      complexity: 'single-line'
    }
  },
  {
    id: 'string-from-base64',
    name: 'fromBase64',
    type: 'method',
    category: 'string',
    returnType: 'string',        
    description: 'Decodes string from Base64',
    examples: ['encoded.fromBase64', 'data.fromBase64()'],
    noParensAllowed: true,
    snippetTemplate: 'fromBase64',
    allowedIn: ['assignment', 'expression', 'condition'],
    pythonGenerator: (variable: string, resultVar?: string, params?: any, debugContext?: any) => {
      // 🚀 Use helper function for perfect debug mapping
      if (debugContext?.useHelpers) {
        const code = `string_helpers.decode_base64(${variable})`
        if (resultVar === undefined) return code
        return `${resultVar} = ${code}`
      }
      // Fallback to inline code if helpers not available
      const code = `base64.b64decode(${variable}.encode('utf-8')).decode('utf-8')`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: ['base64'],
    debugInfo: {
      helperFunction: 'string_helpers.decode_base64',
      complexity: 'single-line'
    }
  },
  {
    id: 'string-to-url-safe',
    name: 'toUrlSafe',
    type: 'method',
    category: 'string',
    returnType: 'string',
    description: 'Encodes string for safe use in URLs',
    examples: ['query.toUrlSafe', 'searchTerm.toUrlSafe()'],
    noParensAllowed: true,
    snippetTemplate: 'toUrlSafe',
    allowedIn: ['assignment', 'expression'],
    pythonGenerator: (variable: string, resultVar?: string) => {
      const code = `urllib.parse.quote(${variable})`
      if (resultVar === undefined) return code
      return `${resultVar} = ${code}`
    },
    pythonImports: ['urllib.parse']
  }
]