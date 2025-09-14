// String-specific methods for variables
// Example: myString.toUpper(), myString.toInt(), myString.length

import type { CustomMethod } from '../../../types/variable-types'

export const STRING_METHODS: CustomMethod[] = [
  {
    name: 'toUpper',
    returnType: 'string',
    description: 'Converts string to uppercase',
    example: 'name.toUpper()',
    category: 'string',
    // PYTHON TRANSLATION - Simple template
    pythonCode: '{variable}.upper()',
    pythonImports: [] // No imports needed
  },
  {
    name: 'toLower', 
    returnType: 'string',
    description: 'Converts string to lowercase',
    example: 'name.toLower()',
    category: 'string',
    pythonCode: '{variable}.lower()',
    pythonImports: []
  },
  {
    name: 'toInt',
    returnType: 'number', 
    description: 'Converts string to integer',
    example: 'ageString.toInt()',
    category: 'conversion',
    pythonCode: 'int({variable})',
    pythonImports: []
  },
  {
    name: 'toFloat',
    returnType: 'number',
    description: 'Converts string to floating point number',
    example: 'priceString.toFloat()', 
    category: 'conversion',
    pythonCode: 'float({variable})',
    pythonImports: []
  },
  {
    name: 'length',
    returnType: 'number',
    description: 'Gets the length of the string',
    example: 'message.length',
    category: 'property',
    pythonCode: 'len({variable})',
    pythonImports: []
  },
  {
    name: 'contains',
    returnType: 'boolean',
    description: 'Checks if string contains substring',
    example: 'text.contains("hello")',
    category: 'string',
    pythonCode: '{arg1} in {variable}',
    pythonImports: [],
    parameters: [{ name: 'substring', type: 'string', required: true }]
  },
  {
    name: 'startsWith',
    returnType: 'boolean', 
    description: 'Checks if string starts with substring',
    example: 'text.startsWith("Hello")',
    category: 'string',
    pythonCode: '{variable}.startswith({arg1})',
    pythonImports: [],
    parameters: [{ name: 'prefix', type: 'string', required: true }]
  },
  {
    name: 'endsWith',
    returnType: 'boolean',
    description: 'Checks if string ends with substring', 
    example: 'filename.endsWith(".txt")',
    category: 'string',
    pythonCode: '{variable}.endswith({arg1})',
    pythonImports: [],
    parameters: [{ name: 'suffix', type: 'string', required: true }]
  },
  {
    name: 'trim',
    returnType: 'string',
    description: 'Removes whitespace from both ends',
    example: 'input.trim()',
    category: 'string',
    pythonCode: '{variable}.strip()',
    pythonImports: []
  },
  {
    name: 'replace',
    returnType: 'string',
    description: 'Replaces all occurrences of a substring',
    example: 'text.replace("old", "new")',
    category: 'string', 
    pythonCode: '{variable}.replace({arg1}, {arg2})',
    pythonImports: [],
    parameters: [
      { name: 'search', type: 'string', required: true },
      { name: 'replacement', type: 'string', required: true }
    ]
  },
  {
    name: 'split',
    returnType: 'array',
    description: 'Splits string into array by delimiter',
    example: 'csv.split(",")',
    category: 'conversion',
    pythonCode: '{variable}.split({arg1})',
    pythonImports: [],
    parameters: [{ name: 'delimiter', type: 'string', required: true }]
  },
  {
    name: 'substring',
    returnType: 'string',
    description: 'Extracts substring from start to end index',
    example: 'text.substring(0, 5)',
    category: 'string',
    pythonCode: '{variable}[{arg1}:{arg2}]',
    pythonImports: [],
    parameters: [
      { name: 'start', type: 'number', required: true },
      { name: 'end', type: 'number', required: false }
    ]
  },
  {
    name: 'isEmpty',
    returnType: 'boolean',
    description: 'Checks if string is empty',
    example: 'input.isEmpty()',
    category: 'validation',
    pythonCode: 'len({variable}) == 0',
    pythonImports: []
  },
  {
    name: 'isNotEmpty',
    returnType: 'boolean',
    description: 'Checks if string is not empty',
    example: 'input.isNotEmpty()',
    category: 'validation', 
    pythonCode: 'len({variable}) > 0',
    pythonImports: []
  },
  {
    name: 'toBase64',
    returnType: 'string',
    description: 'Encodes string to Base64',
    example: 'data.toBase64()',
    category: 'encoding',
    // COMPLEX PYTHON TRANSLATION - Multi-line with imports
    pythonGenerator: (variable: string, resultVar: string = 'result') => `
import base64
encoded_bytes = base64.b64encode(${variable}.encode('utf-8'))
${resultVar} = encoded_bytes.decode('utf-8')`,
    pythonImports: ['base64']
  },
  {
    name: 'fromBase64',
    returnType: 'string', 
    description: 'Decodes Base64 string',
    example: 'encoded.fromBase64()',
    category: 'encoding',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `
import base64
decoded_bytes = base64.b64decode(${variable}.encode('utf-8'))
${resultVar} = decoded_bytes.decode('utf-8')`,
    pythonImports: ['base64']
  },
  {
    name: 'md5Hash',
    returnType: 'string',
    description: 'Generates MD5 hash of string',
    example: 'password.md5Hash()',
    category: 'encoding',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `
import hashlib
${resultVar} = hashlib.md5(${variable}.encode('utf-8')).hexdigest()`,
    pythonImports: ['hashlib']
  },
  {
    name: 'slugify',
    returnType: 'string',
    description: 'Converts to URL-friendly slug',
    example: 'title.slugify()',
    category: 'string',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `
import re
${resultVar} = re.sub(r'[^a-zA-Z0-9]+', '-', ${variable}.strip().lower()).strip('-')`,
    pythonImports: ['re']
  }
]

export default STRING_METHODS 