// 🎯 JSON Module - Interface-first approach for perfect IntelliSense
// All return types defined as TypeScript interfaces for maximum completion accuracy

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: JSON Operation Interfaces for perfect IntelliSense
export interface JsonParseResult {
  [key: string]: any; // Generic object for parsed JSON
}

export interface JsonMergeResult {
  [key: string]: any; // Merged object result
}

export interface JsonExtractResult {
  [key: string]: any; // Extracted data result
}

// 🎯 JSON Module Schemas - Interface-first for perfect IntelliSense
export const JSON_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'json-parse',
    module: 'json',
    name: 'parse',
    type: 'method',
    category: 'json',
    returnInterface: 'JsonParseResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Parse JSON string into object with any structure',
    examples: [
      'json.parse(jsonString)',
      'json.parse(\'{"name": "John", "age": 30}\')'
    ],
    parameters: [
      {
        name: 'jsonString',
        type: 'string',
        required: true,
        description: 'JSON string to parse'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'parsed_data', params: any) => {
      const jsonString = params?.jsonString || params?.arg1 || '"{}"'

      return `# Parse JSON string
try:
    ${resultVar} = json.loads(${jsonString})
except json.JSONDecodeError as e:
    logger.error(f"Failed to parse JSON: {e}")
    ${resultVar} = {}`
    },
    pythonImports: ['import json', 'import logging as logger']
  },

  {
    id: 'json-stringify',
    module: 'json',
    name: 'stringify',
    type: 'method',
    category: 'json',
    description: 'Convert object to JSON string (returns string)',
    examples: [
      'json.stringify(dataObject)',
      'json.stringify(dataObject, 2)',  // with indentation
    ],
    parameters: [
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Object to convert to JSON'
      },
      {
        name: 'indent',
        type: 'number',
        required: false,
        description: 'Indentation spaces (default: no formatting)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'json_string', params: any) => {
      const data = params?.data || params?.arg1 || '{}'
      const indent = params?.indent || params?.arg2

      const indentArg = indent ? `, indent=${indent}` : ''

      return `# Convert object to JSON string
try:
    ${resultVar} = json.dumps(${data}${indentArg})
except TypeError as e:
    logger.error(f"Failed to stringify object: {e}")
    ${resultVar} = "{}"`
    },
    pythonImports: ['import json', 'import logging as logger']
  },

  {
    id: 'json-merge',
    module: 'json',
    name: 'merge',
    type: 'method',
    category: 'json',
    returnInterface: 'JsonMergeResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Deep merge multiple objects into a single merged object',
    examples: [
      'json.merge(obj1, obj2)',
      'json.merge(obj1, obj2, obj3)'
    ],
    parameters: [
      {
        name: 'objects',
        type: 'array',
        required: true,
        description: 'Objects to merge (first object takes precedence)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'merged_data', params: any) => {
      const objects = params?.objects || '[{}, {}]'

      return `# Deep merge objects
def deep_merge(dict1, dict2):
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

${resultVar} = {}
for obj in ${objects}:
    ${resultVar} = deep_merge(${resultVar}, obj)`
    },
    pythonImports: ['import copy']
  },

  {
    id: 'json-extract',
    module: 'json',
    name: 'extract',
    type: 'method',
    category: 'json',
    returnInterface: 'JsonExtractResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Extract specific paths from JSON object into structured result',
    examples: [
      'json.extract(data, "user.name")',
      'json.extract(data, ["user.name", "user.email"])'
    ],
    parameters: [
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Source object to extract from'
      },
      {
        name: 'paths',
        type: 'string|array',
        required: true,
        description: 'JSON path(s) to extract'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'extracted_data', params: any) => {
      const data = params?.data || params?.arg1 || '{}'
      const paths = params?.paths || params?.arg2 || '"path"'

      return `# Extract data using JSON paths
def get_nested_value(obj, path):
    keys = path.split('.')
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return None
    return obj

if isinstance(${paths}, list):
    ${resultVar} = {path: get_nested_value(${data}, path) for path in ${paths}}
else:
    ${resultVar} = get_nested_value(${data}, ${paths})`
    },
    pythonImports: []
  }
]