// 🌐 HTTP Module - Interface-first approach for perfect IntelliSense
// All return types defined as TypeScript interfaces for maximum completion accuracy

import type { UnifiedSchema, DetailedTypeDefinition } from '../types'

// HTTP header validation function
export function validateHttpHeaders(value: any): boolean | string {
  if (!value) return true // Optional parameter

  if (typeof value !== 'object' || Array.isArray(value)) {
    return 'Headers must be an object with key-value pairs'
  }

  for (const [key, val] of Object.entries(value)) {
    if (typeof key !== 'string') {
      return 'Header keys must be strings'
    }
    if (typeof val !== 'string') {
      return `Header value for "${key}" must be a string`
    }
    if (key.trim() === '') {
      return 'Header keys cannot be empty'
    }
  }

  return true
}

// Enhanced HTTP header type definition for parameter validation
const HTTP_HEADERS_TYPE: DetailedTypeDefinition = {
  baseType: 'object',
  structure: 'key-value',
  keyType: 'string',
  valueType: 'string',
  examples: [
    { "Authorization": "Bearer token" },
    { "Content-Type": "application/json" },
    { "Accept": "application/json", "Authorization": "Bearer token" }
  ],
  allowedKeys: [
    'Authorization', 'Content-Type', 'Accept', 'User-Agent',
    'Cache-Control', 'Accept-Language', 'Accept-Encoding',
    'If-Modified-Since', 'If-None-Match', 'Origin', 'Referer'
  ],
  validation: {
    validator: 'validateHttpHeaders',
    errorMessage: 'Headers must be an object with string keys and string values'
  }
}

// 🎯 INTERFACE-FIRST: HTTP Response Interface for perfect IntelliSense
export interface HttpResponse {
  statusCode: number
  error: string | null
  response: Record<string, any>
}

// 🎯 HTTP Module Schemas - Interface-first for perfect IntelliSense
export const HTTP_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'http-get',
    module: 'http',
    name: 'get',
    type: 'method',
    category: 'http',
    returnInterface: 'HttpResponse', // 🎯 Interface reference for perfect IntelliSense
    returnObject: {
      name: 'HttpResponse'
    },
    description: 'Perform HTTP GET request to retrieve data from APIs or web services',
    examples: [
      'http.get(url: "https://api.example.com/users")',
      'http.get(url: "https://api.example.com/users", headers: { "Authorization": "Bearer token" })'
    ],
    snippetTemplate: 'get(url: ${1:"url"}${2:, headers: ${3:{ "Authorization": "Bearer token" \}}})',

    debugInfo: {
      helperFunction: 'http_get_request',
      complexity: 'single-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['url', 'headers']
      }
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the GET request to'
      },
      {
        name: 'headers',
        type: HTTP_HEADERS_TYPE,
        required: false,
        description: 'Optional HTTP headers as key-value pairs',
        placeholder: '{ "Authorization": "Bearer token" }',
        suggestions: [
          '{ "Authorization": "Bearer YOUR_TOKEN" }',
          '{ "Content-Type": "application/json" }',
          '{ "Accept": "application/json" }'
        ]
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'response', params: any, debugContext?: any) => {
      const url = params?.url || params?.arg1 || '"https://example.com"'
      const headers = params?.headers || params?.arg2

      // Always use helpers to maintain HttpResponse interface consistency
      if (headers) {
        return `${resultVar} = http_get_request(${url}, headers=${JSON.stringify(headers)})`
      } else {
        return `${resultVar} = http_get_request(${url})`
      }
    },
    pythonImports: ['from helper_functions.http_helpers import http_get_request']
  },

  {
    id: 'http-post',
    module: 'http',
    name: 'post',
    type: 'method',
    category: 'http',
    returnInterface: 'HttpResponse',
    returnObject: {
      name: 'HttpResponse'
    },
    description: 'Perform HTTP POST request to send data to APIs or create new resources',
    examples: [
      'http.post(url: "https://api.example.com/users", data: userData)',
      'http.post(url: "https://api.example.com/users", data: userData, headers: { "Content-Type": "application/json" })'
    ],
    snippetTemplate: 'post(url: ${1:"url"}, data: ${2:data}${3:, headers: ${4:{ "Content-Type": "application/json" \}}})',
    debugInfo: {
      helperFunction: 'http_post_request',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['url', 'data', 'headers']
      }
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the POST request to'
      },
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Data to send in the request body'
      },
      {
        name: 'headers',
        type: HTTP_HEADERS_TYPE,
        required: false,
        description: 'Optional HTTP headers as key-value pairs',
        placeholder: '{ "Content-Type": "application/json" }',
        suggestions: [
          '{ "Content-Type": "application/json" }',
          '{ "Authorization": "Bearer YOUR_TOKEN" }',
          '{ "Accept": "application/json" }'
        ]
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'response', params: any, debugContext?: any) => {
      const url = params?.url || params?.arg1 || '"https://example.com"'
      const data = params?.data || params?.arg2 || '{}'
      const headers = params?.headers || params?.arg3

      // Always use helpers to maintain HttpResponse interface consistency
      if (headers) {
        return `${resultVar} = http_post_request(url=${url}, data=${data}, headers=${JSON.stringify(headers)})`
      } else {
        return `${resultVar} = http_post_request(url=${url}, data=${data})`
      }
    },
    pythonImports: ['from helper_functions.http_helpers import http_post_request']
  },

  {
    id: 'http-put',
    module: 'http',
    name: 'put',
    type: 'method',
    category: 'http',
    returnInterface: 'HttpResponse',
    returnObject: {
      name: 'HttpResponse'
    },
    description: 'Perform HTTP PUT request to update data in APIs',
    examples: [
      'http.put(url: "https://api.example.com/users/123", data: updatedUser)',
      'http.put(url: "https://api.example.com/users/123", data: updatedUser, headers: { "Authorization": "Bearer token" })'
    ],
    snippetTemplate: 'put(url: ${1:"url"}, data: ${2:data}${3:, headers: ${4:{ "Authorization": "Bearer token" \}}})',
    debugInfo: {
      helperFunction: 'http_put_request',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['url', 'data', 'headers']
      }
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the PUT request to'
      },
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Data to send in the request body'
      },
      {
        name: 'headers',
        type: HTTP_HEADERS_TYPE,
        required: false,
        description: 'Optional HTTP headers as key-value pairs',
        placeholder: '{ "Content-Type": "application/json" }',
        suggestions: [
          '{ "Content-Type": "application/json" }',
          '{ "Authorization": "Bearer YOUR_TOKEN" }',
          '{ "Accept": "application/json" }'
        ]
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'response', params: any, debugContext?: any) => {
      const url = params?.url || params?.arg1 || '"https://example.com"'
      const data = params?.data || params?.arg2 || '{}'
      const headers = params?.headers || params?.arg3

      // Always use helpers to maintain HttpResponse interface consistency
      if (headers) {
        return `${resultVar} = http_put_request(url=${url}, data=${data}, headers=${JSON.stringify(headers)})`
      } else {
        return `${resultVar} = http_put_request(url=${url}, data=${data})`
      }
    },
    pythonImports: ['from helper_functions.http_helpers import http_put_request']
  },

  {
    id: 'http-delete',
    module: 'http',
    name: 'delete',
    type: 'method',
    category: 'http',
    returnInterface: 'HttpResponse',
    returnObject: {
      name: 'HttpResponse'
    },
    description: 'Perform HTTP DELETE request to remove data from APIs',
    examples: [
      'http.delete(url: "https://api.example.com/users/123")',
      'http.delete(url: "https://api.example.com/users/123", headers: { "Authorization": "Bearer token" })'
    ],
    snippetTemplate: 'delete(url: ${1:"url"}${2:, headers: ${3:{ "Authorization": "Bearer token" \}}})',
    debugInfo: {
      helperFunction: 'http_delete_request',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['url', 'headers']
      }
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the DELETE request to'
      },
      {
        name: 'headers',
        type: HTTP_HEADERS_TYPE,
        required: false,
        description: 'Optional HTTP headers as key-value pairs',
        placeholder: '{ "Content-Type": "application/json" }',
        suggestions: [
          '{ "Content-Type": "application/json" }',
          '{ "Authorization": "Bearer YOUR_TOKEN" }',
          '{ "Accept": "application/json" }'
        ]
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'response', params: any, debugContext?: any) => {
      const url = params?.url || params?.arg1 || '"https://example.com"'
      const headers = params?.headers || params?.arg2

      // Always use helpers to maintain HttpResponse interface consistency
      if (headers) {
        return `${resultVar} = http_delete_request(url=${url}, headers=${JSON.stringify(headers)})`
      } else {
        return `${resultVar} = http_delete_request(url=${url})`
      }
    },
    pythonImports: ['from helper_functions.http_helpers import http_delete_request']
  },

  {
    id: 'http-patch',
    module: 'http',
    name: 'patch',
    type: 'method',
    category: 'http',
    returnInterface: 'HttpResponse',
    returnObject: {
      name: 'HttpResponse'
    },
    description: 'Perform HTTP PATCH request for partial updates to APIs',
    examples: [
      'http.patch(url: "https://api.example.com/users/123", data: partialUpdate)',
      'http.patch(url: "https://api.example.com/users/123", data: partialUpdate, headers: { "Authorization": "Bearer token" })'
    ],
    snippetTemplate: 'patch(url: ${1:"url"}, data: ${2:data}${3:, headers: ${4:{ "Authorization": "Bearer token" \}}})',
    debugInfo: {
      helperFunction: 'http_patch_request',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['url', 'data', 'headers']
      }
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the PATCH request to'
      },
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Partial data to update'
      },
      {
        name: 'headers',
        type: HTTP_HEADERS_TYPE,
        required: false,
        description: 'Optional HTTP headers as key-value pairs',
        placeholder: '{ "Content-Type": "application/json" }',
        suggestions: [
          '{ "Content-Type": "application/json" }',
          '{ "Authorization": "Bearer YOUR_TOKEN" }',
          '{ "Accept": "application/json" }'
        ]
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'response', params: any, debugContext?: any) => {
      const url = params?.url || params?.arg1 || '"https://example.com"'
      const data = params?.data || params?.arg2 || '{}'
      const headers = params?.headers || params?.arg3

      // Always use helpers to maintain HttpResponse interface consistency
      if (headers) {
        return `${resultVar} = http_patch_request(url=${url}, data=${data}, headers=${JSON.stringify(headers)})`
      } else {
        return `${resultVar} = http_patch_request(url=${url}, data=${data})`
      }
    },
    pythonImports: ['from helper_functions.http_helpers import http_patch_request']
  }
] 