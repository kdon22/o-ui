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
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any, debugContext?: any) => {
      // 🚀 Use helper function for perfect debug mapping
      if (debugContext?.useHelpers) {
        return `${resultVar} = string_helpers.encode_base64(${variable})`
      }
      // Fallback to inline code if helpers not available
      return `${resultVar} = base64.b64encode(${variable}.encode('utf-8')).decode('utf-8')`
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
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any, debugContext?: any) => {
      // 🚀 Use helper function for perfect debug mapping
      if (debugContext?.useHelpers) {
        return `${resultVar} = string_helpers.decode_base64(${variable})`
      }
      // Fallback to inline code if helpers not available
      return `${resultVar} = base64.b64decode(${variable}.encode('utf-8')).decode('utf-8')`
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
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = urllib.parse.quote(${variable})`,
    pythonImports: ['urllib.parse']
  }
]