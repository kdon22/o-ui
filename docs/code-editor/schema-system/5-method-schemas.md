# 5. Method Schemas - Creating IntelliSense Methods

## 🎯 **Overview**

Method schemas define **IntelliSense methods** that appear in auto-completion with automatic Python code generation. Each schema maps a business rule method to its Python equivalent.

## 📋 **Schema Structure**

### **Basic Method Schema**
```typescript
interface MethodSchema extends UnifiedSchema {
  type: 'method'
  id: string                    // Unique identifier  
  name: string                  // Method name (e.g., 'toUpper')  
  category: string              // Method category (e.g., 'string')
  description: string           // IntelliSense documentation
  parameters: ParameterSchema[] // Method parameters
  returnType: UnifiedType       // Return type
  pythonGenerator: PythonGenerator // Python code generation function
  examples: ExampleUsage[]      // Usage examples
  tags?: string[]              // Optional tags for filtering
}
```

### **Parameter Schema**
```typescript
interface ParameterSchema {
  name: string                  // Parameter name
  type: UnifiedType            // Parameter type
  required: boolean            // Is parameter required
  description: string          // Parameter description
  defaultValue?: any           // Default value if optional
}
```

### **Python Generator Function**
```typescript
type PythonGenerator = (target: string, ...args: string[]) => string

// Example Python generator
const toUpperGenerator: PythonGenerator = (target: string) => {
  return `${target}.upper()`
}

// Complex generator with parameters
const substringGenerator: PythonGenerator = (target: string, start: string, end?: string) => {
  if (end) {
    return `${target}[${start}:${end}]`
  }
  return `${target}[${start}:]`
}
```

## 🔧 **Creating Method Schemas**

### **String Methods Example**
```typescript
// o-ui/src/lib/editor/schemas/methods/string-methods.ts
import type { MethodSchema, UnifiedType } from '../types'

export const STRING_METHOD_SCHEMAS: MethodSchema[] = [
  {
    type: 'method',
    id: 'string-to-upper',
    name: 'toUpper',
    category: 'string',
    description: 'Convert text to uppercase',
    parameters: [],
    returnType: 'str',
    pythonGenerator: (target: string) => `${target}.upper()`,
    examples: [
      {
        businessRule: 'customerName.toUpper()',
        pythonCode: 'customer_name.upper()',
        description: 'Convert customer name to uppercase'
      }
    ],
    tags: ['text', 'case', 'formatting']
  },

  {
    type: 'method', 
    id: 'string-contains',
    name: 'contains',
    category: 'string',
    description: 'Check if text contains substring',
    parameters: [
      {
        name: 'substring',
        type: 'str',
        required: true,
        description: 'Text to search for'
      }
    ],
    returnType: 'bool',
    pythonGenerator: (target: string, substring: string) => 
      `${substring} in ${target}`,
    examples: [
      {
        businessRule: 'email.contains("@gmail.com")',
        pythonCode: '"@gmail.com" in email',
        description: 'Check if email is from Gmail'
      }
    ],
    tags: ['search', 'validation']
  },

  {
    type: 'method',
    id: 'string-substring',
    name: 'substring',
    category: 'string', 
    description: 'Extract part of text',
    parameters: [
      {
        name: 'start',
        type: 'int',
        required: true,
        description: 'Starting position (0-based)'
      },
      {
        name: 'end',
        type: 'int',
        required: false,
        description: 'Ending position (optional)'
      }
    ],
    returnType: 'str',
    pythonGenerator: (target: string, start: string, end?: string) => {
      if (end) {
        return `${target}[${start}:${end}]`
      }
      return `${target}[${start}:]`
    },
    examples: [
      {
        businessRule: 'fullName.substring(0, 5)',
        pythonCode: 'full_name[0:5]',
        description: 'Get first 5 characters'
      },
      {
        businessRule: 'text.substring(10)',
        pythonCode: 'text[10:]',
        description: 'Get text from position 10 onwards'
      }
    ],
    tags: ['extract', 'slice']
  }
]
```

### **Number Methods Example**
```typescript
// o-ui/src/lib/editor/schemas/methods/number-methods.ts
export const NUMBER_METHOD_SCHEMAS: MethodSchema[] = [
  {
    type: 'method',
    id: 'number-to-string',
    name: 'toString',
    category: 'number',
    description: 'Convert number to text',
    parameters: [],
    returnType: 'str',
    pythonGenerator: (target: string) => `str(${target})`,
    examples: [
      {
        businessRule: 'age.toString()',
        pythonCode: 'str(age)',
        description: 'Convert age number to text'
      }
    ],
    tags: ['conversion', 'format']
  },

  {
    type: 'method',
    id: 'number-round',
    name: 'round',
    category: 'number',
    description: 'Round number to specified decimal places',
    parameters: [
      {
        name: 'digits',
        type: 'int',
        required: false,
        description: 'Number of decimal places (default: 0)',
        defaultValue: 0
      }
    ],
    returnType: 'float',
    pythonGenerator: (target: string, digits: string = '0') => 
      `round(${target}, ${digits})`,
    examples: [
      {
        businessRule: 'price.round(2)',
        pythonCode: 'round(price, 2)',
        description: 'Round price to 2 decimal places'
      }
    ],
    tags: ['math', 'precision']
  }
]
```

## 🗂️ **File Organization**

### **Method Category Files**
```
o-ui/src/lib/editor/schemas/methods/
├── string-methods.ts          # String manipulation methods
├── number-methods.ts          # Number operations  
├── array-methods.ts           # Array/list operations
├── object-methods.ts          # Object property access
├── date-methods.ts            # Date/time operations
├── boolean-methods.ts         # Boolean logic methods
└── index.ts                   # Export all schemas
```

### **Index File Pattern**
```typescript
// o-ui/src/lib/editor/schemas/methods/index.ts
import { STRING_METHOD_SCHEMAS } from './string-methods'
import { NUMBER_METHOD_SCHEMAS } from './number-methods'
import { ARRAY_METHOD_SCHEMAS } from './array-methods'
import { OBJECT_METHOD_SCHEMAS } from './object-methods'

export const ALL_METHOD_SCHEMAS = [
  ...STRING_METHOD_SCHEMAS,
  ...NUMBER_METHOD_SCHEMAS,
  ...ARRAY_METHOD_SCHEMAS,
  ...OBJECT_METHOD_SCHEMAS
]

// Export individual categories for targeted loading
export {
  STRING_METHOD_SCHEMAS,
  NUMBER_METHOD_SCHEMAS,
  ARRAY_METHOD_SCHEMAS,
  OBJECT_METHOD_SCHEMAS
}
```

## 🎨 **Advanced Features**

### **Conditional Methods**
```typescript
// Methods that only appear in certain contexts
{
  type: 'method',
  id: 'array-first',
  name: 'first',
  category: 'array',
  description: 'Get first element (only for non-empty arrays)',
  parameters: [],
  returnType: 'any',
  pythonGenerator: (target: string) => `${target}[0] if ${target} else None`,
  conditions: {
    showWhen: (context: string) => {
      // Only show if array is guaranteed non-empty
      return context.includes('.length > 0') || context.includes('if any ')
    }
  },
  examples: [
    {
      businessRule: 'items.first()',
      pythonCode: 'items[0] if items else None',
      description: 'Get first item safely'
    }
  ]
}
```

### **Chained Method Support**
```typescript
// Method that returns same type for chaining
{
  type: 'method',
  id: 'string-trim-to-upper',
  name: 'trimToUpper',
  category: 'string',
  description: 'Remove whitespace and convert to uppercase',
  parameters: [],
  returnType: 'str', // Same type enables chaining
  pythonGenerator: (target: string) => `${target}.strip().upper()`,
  chainable: true,
  examples: [
    {
      businessRule: 'name.trimToUpper().contains("JOHN")',
      pythonCode: 'name.strip().upper() and "JOHN" in name.strip().upper()',
      description: 'Chain methods for complex text processing'
    }
  ]
}
```

## 📊 **Schema Validation**

### **Required Field Validation**
```typescript
// Validate schema before registration
function validateMethodSchema(schema: MethodSchema): void {
  // Required fields
  if (!schema.id) throw new Error('Method schema missing id')
  if (!schema.name) throw new Error('Method schema missing name')
  if (!schema.category) throw new Error('Method schema missing category')
  if (!schema.description) throw new Error('Method schema missing description')
  if (!schema.returnType) throw new Error('Method schema missing returnType')
  if (!schema.pythonGenerator) throw new Error('Method schema missing pythonGenerator')

  // Parameter validation
  for (const param of schema.parameters) {
    if (!param.name) throw new Error(`Parameter missing name in ${schema.id}`)
    if (!param.type) throw new Error(`Parameter missing type in ${schema.id}`)
    if (param.required === undefined) throw new Error(`Parameter missing required flag in ${schema.id}`)
  }

  // Python generator validation
  if (typeof schema.pythonGenerator !== 'function') {
    throw new Error(`Invalid pythonGenerator in ${schema.id}`)
  }
}
```

## 🎯 **Usage in IntelliSense**

### **Method Completion Generation**
```typescript
// How schemas become completion items
const generateMethodCompletion = (schema: MethodSchema): CompletionItem => {
  const parameterHints = schema.parameters.map((param, index) => {
    const placeholder = `\${${index + 1}:${param.name}}`
    return param.required ? placeholder : `\${${index + 1}:${param.name}?}`
  }).join(', ')

  return {
    label: `${schema.name}()`,
    kind: monaco.languages.CompletionItemKind.Method,
    detail: `${schema.category} → ${schema.returnType}`,
    documentation: {
      value: `**${schema.description}**\n\n${formatExamples(schema.examples)}`,
      isTrusted: true
    },
    insertText: `${schema.name}(${parameterHints})`,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    sortText: `1-method-${schema.category}-${schema.name}`,
    pythonGenerator: schema.pythonGenerator // Custom property for Python generation
  }
}
```

---

**Method schemas provide the foundation for intelligent IntelliSense with automatic Python code generation.** 📋 