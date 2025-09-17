/**
 * 🏆 MAIN RULE EDITOR EXPORT
 * 
 * This file exports the primary RuleEditor component used throughout the application.
 * Currently exports RuleStudioEditor as the gold standard implementation.
 */

// Export the gold standard implementation as the main RuleEditor
export { RuleStudioEditor as RuleEditor } from './rule-studio'

// Re-export other editor components for convenience
export { RuleCodeEditor } from './components/rule-code-editor'
export { RulePythonViewer } from './components/rule-python-viewer'
export { ParametersEditor } from './components/parameters-editor'

// Export types
export type { RuleStudioEditorProps } from './rule-studio'
export type { RuleCodeEditorProps } from './components/rule-code-editor'