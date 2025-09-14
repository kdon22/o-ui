// Core schema interfaces for unified editor architecture
// Drives Monaco IntelliSense, Python generation, debug mappings, and helper UI

export type MethodCategory = 'string' | 'array' | 'number' | 'conversion' | 'validation' | 'encoding' | 'property'

export type PrimitiveType = 'string' | 'number' | 'float' | 'boolean' | 'array' | 'object' | 'dict'

// Custom return type for user-defined functions - supports business object types
export type ReturnType = PrimitiveType | string

// Enhanced type definition for better IntelliSense
export interface DetailedTypeDefinition {
  baseType: PrimitiveType
  structure?: 'key-value' | 'array-of-objects' | 'specific-keys'
  keyType?: PrimitiveType
  valueType?: PrimitiveType
  allowedKeys?: string[]
  examples?: any[]
  validation?: {
    pattern?: string
    validator?: string // Function name for runtime validation
    errorMessage?: string
  }
}

export interface ParameterSchema {
  name: string
  type: PrimitiveType | DetailedTypeDefinition
  // Optional named type reference for complex objects (e.g., 'HttpHeaders')
  typeRef?: string
  required: boolean
  description?: string
  defaultValue?: any
  // Enhanced validation and suggestions
  suggestions?: string[]
  placeholder?: string
}

// UI field types for helper generation
export interface UIFieldSchema {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'number' | 'radio' | 'checkboxGroup'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface TestCase {
  input: any
  expected: string
  description: string
}

// Debug context for Python generation
export interface DebugContext {
  mode: 'debug' | 'production' | 'inline'  // debug = use helpers, production = use helpers, inline = generate inline code
  useHelpers?: boolean  // Shorthand for mode === 'debug' || mode === 'production'
  lineNumber?: number   // Business rule line number for mapping
  sourceText?: string  // Original business rule text
}

// Python generation function types
export type PythonGeneratorFn = (variable: string, resultVar?: string, params?: any, debugContext?: DebugContext) => string

// Unified Schema Interface - the heart of the system
export interface UnifiedSchema {
  // Core identification
  id: string
  name: string
  type: 'method' | 'helper' | 'module' | 'function'
  category: string
  
  // Module linkage (for MODULE_REGISTRY integration)
  module?: string  // Links method to module (e.g., 'http', 'math')
  
  // Python generation (REQUIRED for built-ins, OPTIONAL for user functions)
  pythonGenerator?: PythonGeneratorFn
  pythonImports?: string[]
  
  // Method-specific (type: 'method') and Function-specific (type: 'function')
  returnType?: ReturnType
  // Optional named type reference for complex return objects (e.g., 'HttpResponse')
  returnTypeRef?: string
  returnObject?: any  // For complex return types with properties
  // 🎯 NEW: Interface-first approach for perfect IntelliSense
  returnInterface?: string  // Interface name for type-safe completions (e.g., 'HttpResponse')
  parameters?: ParameterSchema[]
  snippetTemplate?: string // Monaco snippet for tab placeholders: 'method(${1:param})'
  noParensAllowed?: boolean // Allow calling without parentheses: variable.method
  
  // Function-specific (type: 'function') - for user-defined utilities
  // Uses same returnType and parameters as methods, but called directly: functionName(args)
  
  // Helper-specific (type: 'helper')
  helperUI?: {
    title: string
    description: string
    fields: UIFieldSchema[]
    category: string
  }
  
  // Keyboard shortcut (for helpers)
  keyboard?: {
    shortcut: string // Human readable: "Cmd+Shift+R", "Ctrl+Alt+N", etc.
    keyCode?: string // Monaco key code for registration
  }
  
  // Documentation & Examples
  description: string
  docstring?: string  // 🆕 **NEW**: Rich documentation for hover panels
  examples: string[]
  testCases?: TestCase[]
  
  // Debug mapping information
  debugInfo?: {
    helperFunction?: string  // Python helper function name (e.g., 'mask_string_data')
    complexity: 'single-line' | 'multi-line'  // Helps debug mapper decide strategy
    variableMapping?: {  // Explicit variable mapping for debug tracking
      input: string     // Input variable name
      output: string    // Output variable name
      params: string[]  // Parameter names to track
    }
  }
  
  // Debug configuration (auto-generated from pythonGenerator)
  debugConfig?: {
    variableWatches: string[]
    breakpointHints: number[]
  }
}

// Context for Python generation
export interface GenerationContext {
  variable: string
  resultVar?: string
  parameters?: Record<string, any>
  helperParams?: Record<string, any>
}

// Factory configuration
export interface SchemaFactoryConfig {
  type: 'method' | 'helper'
  schema: UnifiedSchema
  context: GenerationContext
}

// Factory result
export interface GenerationResult {
  code: string
  imports: string[]
  debugInfo?: {
    variableWatches: string[]
    breakpointHints: number[]
  }
} 