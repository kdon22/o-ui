// Editor layout types adapted from RuleEditor components

export interface ExtendedRule {
  id: string
  idShort?: string  // Short ID for navigation
  name: string
  description?: string
  type?: string
  sourceCode?: string  // Business rules in natural language
  pythonCode?: string  // Generated Python code
  sourceMap?: any  // Enhanced source map for debugging
  pythonCodeHash?: string  // Hash for source map validation
  pythonName?: string  // Python function name
  sourceMapGeneratedAt?: Date | string  // When source map was generated
  executionMode?: string  // SYNC/ASYNC
  code?: string
  content?: string  // For Monaco editor compatibility
  isActive?: boolean
  tenantId?: string
  branchId?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  createdBy?: string
  updatedBy?: string
  version?: number
  documentation?: any
  prompts?: Prompt[]
  // Add other fields from the original ExtendedRule as needed
}

export interface ExtendedClass {
  id: string
  idShort?: string  // Short ID for navigation
  name: string
  description?: string
  pythonName?: string
  category?: string
  sourceCode?: string
  pythonCode?: string
  content?: string  // For Monaco editor compatibility
  isActive?: boolean
  isAbstract?: boolean
  tenantId?: string
  branchId?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  version?: number
  methods?: any[]
  properties?: any[]
  imports?: string[]
  // Add other fields from the class schema as needed
}

export interface Prompt {
  id: string
  name: string
  ruleId: string
  content?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  // Add other prompt fields as needed
}

export interface Branch {
  id: string
  name: string
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EditorTab {
  id: string
  label: string
  icon?: string
  component?: React.ComponentType<any>
}

export interface EditorLayoutProps {
  // Rule-specific props
  ruleId?: string | null
  ruleIdShort?: string | null
  initialRule?: ExtendedRule | null
  
  // Class-specific props
  classId?: string | null
  classIdShort?: string | null
  initialClass?: ExtendedClass | null
} 