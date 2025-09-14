// 🎯 Object Methods - Interface-first approach for perfect IntelliSense
// Methods that appear when user types: obj = {}; obj.

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: Object operation result interfaces for perfect IntelliSense
export interface ObjectKeysResult extends Array<string> {
  // Array of property names with length property
  readonly length: number
}

export interface ObjectValuesResult extends Array<any> {
  // Array of property values with length property
  readonly length: number
}

export interface ObjectHasKeyResult extends Boolean {
  // Boolean result for key existence check
}

export interface ObjectGetResult {
  // Value retrieved from object (any type)
  [key: string]: any
}

export interface ObjectSetResult {
  // Modified object returned after setting value
  [key: string]: any
}

export interface ObjectIsEmptyResult extends Boolean {
  // Boolean result for emptiness check
}

export interface ObjectSizeResult extends Number {
  // Number of properties in object
}

// 🎯 OBJECT METHOD SCHEMAS - Interface-first for perfect IntelliSense
export const OBJECT_METHOD_SCHEMAS: UnifiedSchema[] = [
  // === OBJECT PROPERTIES ===
  {
    id: 'object-keys',
    module: 'methods',
    name: 'keys',
    type: 'method',
    category: 'object',
    returnInterface: 'ObjectKeysResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Gets array of object property names',
    examples: ['data.keys', 'config.keys()'],
    noParensAllowed: true,
    snippetTemplate: 'keys',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = list(${variable}.keys())`,
    pythonImports: []
  },
  {
    id: 'object-values',
    module: 'methods',
    name: 'values',
    type: 'method',
    category: 'object',
    returnInterface: 'ObjectValuesResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Gets array of object property values',
    examples: ['data.values', 'config.values()'],
    noParensAllowed: true,
    snippetTemplate: 'values',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = list(${variable}.values())`,
    pythonImports: []
  },
  {
    id: 'object-has-key',
    module: 'methods',
    name: 'hasKey',
    type: 'method',
    category: 'object',
    returnType: 'boolean', // ✅ Primitive boolean return type
    description: 'Checks if object has specified property key (returns boolean)',
    examples: ['data.hasKey("name")', 'config.hasKey(keyName)'],
    snippetTemplate: 'hasKey("${1:key}")',
    parameters: [{ name: 'key', type: 'string', required: true }],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) =>
      `${resultVar} = "${params?.arg1 || 'key'}" in ${variable}`,
    pythonImports: []
  },
  {
    id: 'object-get',
    name: 'get',
    type: 'method',
    category: 'object',
    returnInterface: 'ObjectGetResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Gets property value with optional default',
    examples: ['data.get("name")', 'config.get("timeout", 30)'],
    snippetTemplate: 'get("${1:string}", ${2:any})',
    parameters: [
      { name: 'key', type: 'string', required: true },
      { name: 'default', type: 'object', required: false }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) =>
      `${resultVar} = ${variable}.get("${params?.arg1 || 'key'}", ${params?.arg2 || 'None'})`,
    pythonImports: []
  },
  {
    id: 'object-set',
    name: 'set',
    type: 'method',
    category: 'object',
    returnInterface: 'ObjectSetResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Sets property value and returns the object',
    examples: ['data.set("name", value)', 'config.set(key, newValue)'],
    snippetTemplate: 'set("${1:string}", ${2:any})',
    parameters: [
      { name: 'key', type: 'string', required: true },
      { name: 'value', type: 'object', required: true }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      return `${variable}["${params?.arg1 || 'key'}"] = ${params?.arg2 || 'value'}
${resultVar} = ${variable}`
    },
    pythonImports: []
  },
  {
    id: 'object-is-empty',
    name: 'isEmpty',
    type: 'method',
    category: 'object',
    returnType: 'boolean', // ✅ Primitive boolean return type
    description: 'Checks if object has no properties',
    examples: ['data.isEmpty', 'config.isEmpty()'],
    noParensAllowed: true,
    snippetTemplate: 'isEmpty',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = len(${variable}) == 0`,
    pythonImports: []
  },
  {
    id: 'object-size',
    name: 'size',
    type: 'method',
    category: 'object',
    returnType: 'number', // ✅ Primitive number return type
    description: 'Gets number of properties in object',
    examples: ['data.size', 'config.size()'],
    noParensAllowed: true,
    snippetTemplate: 'size',
    pythonGenerator: (variable: string, resultVar: string = 'result') => `${resultVar} = len(${variable})`,
    pythonImports: []
  }
] 