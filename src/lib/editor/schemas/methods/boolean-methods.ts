// Boolean methods for business rules
// Only essential method for string conversion/concatenation

import type { UnifiedSchema } from '../types'

export const BOOLEAN_METHOD_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'boolean-to-string',
    name: 'toString',
    type: 'method',
    category: 'boolean',
    returnType: 'string',
    description: 'Convert boolean to string for concatenation or output.',
    examples: ['isActive.toString', 'flag.toString()'],
    noParensAllowed: true,
    snippetTemplate: 'toString',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = str(${variable}).lower()`,
    pythonImports: []
  }
]
