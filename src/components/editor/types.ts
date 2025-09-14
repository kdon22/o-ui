// Core types for Monaco Business Rule Editor

import type * as monaco from 'monaco-editor'
import type { Rule } from '@/features/rules/types'
import type { Variable as IntelliSenseVariable } from './language/constants'

// Business Rule Language Types
export type VariableType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'class'
  | 'dictionary'
  | 'unknown'

export interface Variable {
  name: string
  type: VariableType
  value: any
  description?: string
  isBuiltIn?: boolean
  className?: string // For class type
  arrayElementType?: VariableType // For array type
  keyType?: VariableType // For dictionary key type
  valueType?: VariableType // For dictionary value type
  properties?: Record<string, VariableType> // For object/class properties
}

export interface CustomMethod {
  name: string
  returnType: VariableType
  parameters?: Array<{
    name: string
    type: VariableType
    optional?: boolean
  }>
  description: string
  example: string
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
  message: string
  type: 'syntax' | 'semantic' | 'unsupported'
  line?: number
  position?: { start: number; end: number }
  suggestion?: string
}

// Bidirectional Conversion Types
export interface ConversionResult {
  success: boolean
  businessRules?: string
  confidence: number // 0-1, how confident we are in the conversion
  errors?: ConversionError[]
  warnings?: string[]
  unconvertibleLines?: number[]
}

export interface ConversionError {
  message: string
  type: 'parse_error' | 'unsupported_construct' | 'ambiguous_syntax'
  line?: number
  pythonCode?: string
  suggestion?: string
}

// Monaco Language Service Types
export interface CompletionContext {
  triggerKind: monaco.languages.CompletionTriggerKind
  triggerCharacter?: string
}

export interface SuggestionItem {
  label: string
  kind: monaco.languages.CompletionItemKind
  insertText: string
  documentation?: string
  detail?: string
  examples?: string[]
  category?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  message: string
  type: 'syntax' | 'semantic' | 'type_mismatch'
  severity: 'error' | 'warning' | 'info'
  line: number
  position?: { start: number; end: number }
  suggestion?: string
  quickFix?: QuickFix
}

export interface ValidationWarning {
  message: string
  type: 'style' | 'best-practice' | 'performance'
  line?: number
  suggestion?: string
}

export interface QuickFix {
  label: string
  replacement: string
  range: monaco.IRange
}

// Context Analysis Types
export type StatementContext = 
  | 'none'
  | 'keyword_started'     // "if"
  | 'awaiting_variable'   // "if "
  | 'variable_typing'     // "if p", "if pn"
  | 'variable_complete'   // "if pnr"
  | 'awaiting_operator'   // "if pnr "
  | 'operator_typing'     // "if pnr =", "if pnr Beg"
  | 'operator_complete'   // "if pnr ==", "if pnr BeginsWith"
  | 'awaiting_value'      // "if pnr == "
  | 'value_typing'        // "if pnr == \"A"
  | 'value_complete'      // "if pnr == \"ABC123\""
  | 'awaiting_logical'    // "if pnr == \"ABC123\" "
  | 'module_access'       // "Http." or module access
  | 'method_access'       // "if pnr." or "pnr."
  | 'method_typing'       // "pnr.toB"

export interface ContextAnalysis {
  context: StatementContext
  keyword?: string
  variable?: string
  module?: string
  operator?: string
  value?: string
  suggestions: 'variables' | 'operators' | 'values' | 'logical' | 'methods' | 'modules' | 'none'
  availableMethods?: CustomMethod[]
}

// Editor Configuration Types
export interface EditorConfig {
  showLineNumbers: boolean
  enableAutocomplete: boolean
  enableSyntaxHighlighting: boolean
  indentSize: number
  theme: 'light' | 'dark'
  enableBidirectionalSync: boolean
  enableHelperWidgets: boolean
}

// Sync State Types
export type SyncSource = 'business-rules' | 'python' | 'none'

export interface SyncState {
  lastEditedTab: SyncSource
  isConverting: boolean
  hasConflicts: boolean
  confidence: number
}

// Helper Widget Integration Types
export interface HelperWidgetContext {
  currentPosition: monaco.Position
  selectedText: string
  availableVariables: Variable[]
  editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor>
}

export interface ExpressionBuilderResult {
  expression: string
  variables: string[]
  confidence: number
}

// Monaco Editor Types

export interface MonacoEditorProps {
  value: string
  onChange: (value: string, immediate?: boolean) => void // 🚀 **ENHANCED: Support immediate save parameter**
  onSave?: () => void
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
  hasUnsavedChanges?: boolean
  height?: string
  className?: string
  userVariables?: Variable[]
  language?: string // Language mode for Monaco editor (business-rules, python, etc.)
  // 🎯 **DEBUG MODE SUPPORT**: Add debug capabilities to main editor
  debugMode?: boolean
  breakpoints?: number[]
  currentExecutionLine?: number
  onBreakpointToggle?: (line: number, enabled: boolean) => void
  debugVariables?: Variable[]
} 