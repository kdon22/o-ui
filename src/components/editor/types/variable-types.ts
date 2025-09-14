// Variable and Method Type Definitions for Monaco Business Rule Editor

export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'unknown'

export interface Variable {
  name: string
  type: VariableType
  value?: any
  description?: string
  isBuiltIn?: boolean
  properties?: Record<string, VariableType>
  className?: string
}

// Custom Method Parameters
export interface MethodParameter {
  name: string
  type: VariableType
  required?: boolean  // NEW: Required parameter flag
  optional?: boolean
  defaultValue?: any
}

// Python Translation Types
export type PythonGenerator = (variable: string, resultVar?: string, ...args: string[]) => string

// Custom Method Definition (with Python translation support)
export interface CustomMethod {
  name: string
  returnType: VariableType
  description: string
  example: string
  category?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'math' | 'custom' | 
           'conversion' | 'property' | 'validation' | 'encoding'  // NEW: Extended categories
  parameters?: MethodParameter[]
  
  // Python Translation Support - THREE OPTIONS:
  pythonCode?: string           // Simple template: 'int({variable})'
  pythonGenerator?: PythonGenerator  // Complex function for multi-line code
  pythonImports?: string[]      // Required Python imports
}

// Custom Module Definition  
export interface CustomModule {
  name: string
  description: string
  variables: ModuleVariable[]
  methods: CustomMethod[]
  category: 'date' | 'math' | 'string' | 'array' | 'database' | 'file' | 'network' | 'custom'
}

// Module Variable (like Date.today, Math.PI)
export interface ModuleVariable {
  name: string
  type: VariableType
  value?: any
  description: string
  example: string
  readOnly?: boolean
  
  // Python Translation
  pythonCode?: string
  pythonImports?: string[]
}

// Context Analysis Types
export interface TypingContext {
  isAfterDot: boolean
  variableName?: string
  variableType?: VariableType
  isModuleAccess: boolean
  moduleName?: string
  textBeforeCursor: string
  currentLine: string
}

// Variable Detection Types
export interface DetectedVariable {
  name: string
  type: VariableType
  line: number
  source: 'local' | 'builtin' | 'module'
  moduleSource?: string
}

// Business Rule Syntax Types
export interface BusinessRuleStatement {
  type: 'assignment' | 'condition' | 'loop' | 'function_call' | 'comment' | 'unknown'
  line: number
  content: string
  variables: {
    defined: Variable[]
    referenced: string[]
  }
  raw: string
  parsed?: any
}

// Code Generation Types
export interface CodeGenerationResult {
  success: boolean
  pythonCode: string
  errors?: GenerationError[]
  warnings?: string[]
}

export interface GenerationError {
  line: number
  message: string
  type: 'syntax' | 'semantic' | 'translation'
}

// Method Registry Types
export type MethodCategory = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'math' | 
                           'conversion' | 'property' | 'validation' | 'encoding' | 'custom'

export interface MethodRegistry {
  getMethodsForType(variableType: VariableType): CustomMethod[]
  getAllMethods(): CustomMethod[]
  addMethod(method: CustomMethod): void
  getMethodByName(name: string, variableType?: VariableType): CustomMethod | undefined
} 