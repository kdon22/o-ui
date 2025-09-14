// Main exports for Monaco Business Rule Editor

// Core types (Phase 1 - IMPLEMENTED)
export * from './types'

// Constants (Phase 2 - IMPLEMENTED)  
export * from './constants'

// Language service (Phase 3 - IMPLEMENTED)
export * from './language'

// Core services (Phase 4 - TO BE IMPLEMENTED)
// export { CodeGenerator } from './services/code-generator'
// export { PythonParser } from './services/python-parser'
// export { ReverseCodeGenerator } from './services/reverse-code-generator'
// export { BidirectionalSync } from './services/bidirectional-sync'
// export { TypeInferenceService } from './services/type-inference'
// export { MethodRegistry } from './services/method-registry'
// export { ContextAnalyzer } from './services/context-analyzer'

// Monaco providers (Phase 5 - TO BE IMPLEMENTED)
// export * from './providers'

// Main editor components (Phase 6 - IMPLEMENTED)
// Note: BusinessRuleEditor was removed - use RuleStudioEditor or MonacoBusinessEditor instead
// Export the actual component name from monaco-business-rules-editor
export { MonacoBusinessRulesEditor } from './components/monaco-business-rules-editor'
// Export client-safe versions with backward compatibility
export { DynamicBusinessRulesEditor as BusinessRulesEditor } from './components/client-only-monaco-wrapper'
export { DynamicMonacoBusinessRulesEditor } from './components/client-only-monaco-wrapper'
export { ClientOnlyMonacoWrapper } from './components/client-only-monaco-wrapper'
export { PythonEditor } from './components/python-editor'
export { ParametersEditor } from './components/parameters-editor'
export { MonacoBusinessEditor } from './components/monaco-business-editor'

// Export component types for TypeScript support
export type { BusinessRulesEditorProps } from './components/business-rules-editor'

// export { SyncIndicator } from './components/sync-indicator' // TO BE IMPLEMENTED
// export { EditorToolbar } from './components/editor-toolbar' // TO BE IMPLEMENTED

// Utilities (Phase 7 - TO BE IMPLEMENTED)
// export * from './utils'

// Helper widget integrations (Phase 8 - IMPLEMENTED)
export * from '@/lib/editor/schemas'

// Note: Exports will be uncommented as each phase is implemented 