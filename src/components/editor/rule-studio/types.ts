/**
 * 🏆 Rule Studio Types - Enterprise Architecture
 * 
 * Clean TypeScript interfaces for the rule studio system
 */

export interface RuleStudioEditorProps {
  ruleId: string
  enableParameters?: boolean
  onRuleUpdate?: (updates: any) => void
  onSave?: () => void  
  hasUnsavedChanges?: boolean
}

export interface RuleStudioState {
  // Editor state
  sourceCode: string
  pythonCode: string
  
  // Loading states
  loading: boolean
  saving: boolean
  
  // Change tracking
  isDirty: boolean
  hasUnsavedChanges: boolean
  
  // Error handling
  error: Error | null
  
  // Actions
  changeSourceCode: (code: string) => void
  save: () => Promise<boolean>
  saveAll: () => Promise<boolean>
}

export interface TabComponentProps {
  // Common props for all tab components
  sourceCode: string
  pythonCode: string
  onChange: (code: string) => void
  onSave: () => Promise<boolean>
  readOnly?: boolean
  isActive?: boolean
}

export interface BusinessRulesTabProps extends TabComponentProps {
  onPythonGenerated?: (python: string) => void
  ruleType?: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR'
}

export interface ParametersTabProps extends TabComponentProps {
  rule: any // Rule data from action system
  onParametersChange?: (parameters: any[]) => void
  onReturnTypeChange?: (returnType: string) => void
  onParametersSave?: (parameters: any[], returnType: string, schema: any) => Promise<void>
  hasUnsavedParameters?: boolean
  optimisticParameters?: any[]
  optimisticReturnType?: string
  isDirty?: boolean
  currentSourceCode?: string
}

export interface PythonOutputTabProps {
  pythonCode: string
  readOnly?: boolean
}

export interface TestDebugTabProps extends TabComponentProps {
  rule: any // Rule data for testing
}

export interface InheritanceInfo {
  isInherited: boolean
  isReadOnly: boolean
  sourceNodeName?: string
  inheritanceLevel?: number
}

export interface StudioOptions {
  enableParameters?: boolean
  enableAnalytics?: boolean
  enableCollaboration?: boolean
}

export type TabId = 'business-rules' | 'parameters' | 'python' | 'test'

export interface TabInfo {
  id: TabId
  label: string
  isDirty?: boolean
  isVisible?: boolean
}
