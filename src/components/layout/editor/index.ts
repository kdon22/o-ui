// Public API for editor layout components
export { default as EditorLayout } from './editor-layout'
export { EditorHeader } from './editor-header'
export { EditorTabs } from './editor-tabs'

// Editor preferences modal
export { EditorPreferencesModal } from './editor-preferences'

// Export types that other components might need
export type { 
  EditorLayoutProps,
  ExtendedRule,
  Prompt,
  Branch,
  EditorTab
} from './types'

// Export editor preferences types
export type { EditorPreferences, EditorPreferencesModalProps } from './editor-preferences' 