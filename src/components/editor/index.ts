// Main Monaco Business Rules Editor Exports

// Main editor component (GOLD STANDARD - RuleStudioEditor)
export { RuleStudioEditor } from './rule-studio'

// Monaco editor components  
export { MonacoEditor } from './components/monaco-editor'  
export { PythonEditor } from './components/python-editor'

// Other editor components
export { ParametersEditor } from './components/parameters-editor'
export { RuleDetailsTab } from './components/rule-details-tab'
export { RuleDocumentationTab } from './components/rule-documentation-tab'

// Types
export type * from './types'

// 🔥 REMOVED: Legacy language service export - use factory system instead

// Services - using the correct Python generation system
// Note: Use translateBusinessRulesToPython from '@/lib/editor/python-generation' instead

// Constants
export type { Variable } from './language/constants' 