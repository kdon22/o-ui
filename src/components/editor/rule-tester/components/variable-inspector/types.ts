import type { Variable } from '../../types'

// 🎯 **ENHANCED TYPE DETECTION** - JavaScript/Python type system
export type InspectorValueType = 
  | 'string' | 'number' | 'boolean' | 'null' | 'undefined'
  | 'array' | 'object' | 'function' | 'date' | 'regexp'
  | 'symbol' | 'bigint' | 'error' | 'promise' | 'set' | 'map'

export interface ValueHistory {
  current: unknown
  previous: unknown
  changedAt: number
  changeCount: number
  changeType: 'added' | 'modified' | 'removed'
}

export interface EnhancedVariable extends Variable {
  inspectorType: InspectorValueType
  size?: number // For arrays/objects
  keys?: string[] // For objects
  preview?: string // Short preview for complex types
  isExpandable: boolean
  children?: EnhancedVariable[]
  depth: number
  path: string[]
  changed?: boolean // Track if variable has changed
  previousValue?: unknown // Previous value for change tracking
  // ✨ Enhanced change tracking
  valueHistory?: ValueHistory
  isRecentlyChanged?: boolean // Flash for 2-3 seconds
  changeType?: 'added' | 'modified' | 'removed'
}

export interface VariableInspectorProps {
  variables: Variable[]
  className?: string
  showSearch?: boolean
  showFilters?: boolean
  maxDepth?: number
  // ✨ Change tracking props
  showOldValues?: boolean
  onVariableChange?: (variable: Variable, oldValue: unknown) => void
}

export interface VariableRowProps {
  variable: EnhancedVariable
  isExpanded: boolean
  onToggle: () => void
  onCopy: (value: string) => void
  level: number
  showOldValue?: boolean
  searchTerm?: string
  // ✨ Enhanced display options
  showChangeAnimation?: boolean
  oldValueDisplayStyle?: 'strikethrough' // Always strikethrough now
  onValueClick?: (variable: EnhancedVariable) => void
}