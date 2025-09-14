// Editor component and configuration types

// Editor Configuration Types
export interface EditorConfig {
  showLineNumbers: boolean
  enableAutocomplete: boolean
  enableSyntaxHighlighting: boolean
  indentSize: number
  theme: 'light' | 'dark'
  enableBidirectionalSync: boolean
  enableHelperWidgets: boolean
  enableModules: string[] // Which custom modules to enable
  maxSuggestions: number
  autoSaveDelay: number
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
  currentPosition: any // monaco.Position
  selectedText: string
  availableVariables: any[] // Variable[]
  editorRef: React.RefObject<any> // monaco.editor.IStandaloneCodeEditor
}

export interface ExpressionBuilderResult {
  expression: string
  variables: string[]
  confidence: number
}

// NOTE: MonacoBusinessEditorProps removed - component was deleted 