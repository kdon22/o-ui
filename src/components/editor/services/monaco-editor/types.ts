// 🏆 GOLD STANDARD MONACO TYPES
// Clean type definitions without over-engineered service interfaces

import type * as MonacoTypes from 'monaco-editor'

// Essential Monaco type re-exports
export type Monaco = typeof MonacoTypes
export type IStandaloneCodeEditor = MonacoTypes.editor.IStandaloneCodeEditor
export type ITextModel = MonacoTypes.editor.ITextModel

// Simple editor instance tracking (if needed)
export interface BasicEditorInstance {
  id: string
  editor: IStandaloneCodeEditor
  type: 'business-rules' | 'python' | 'debug'
  createdAt: number
}

// Note: Complex service configurations removed - use UnifiedMonacoSystem instead 