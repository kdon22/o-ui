/**
 * 🏆 Rule Studio - Clean Public API
 * 
 * Enterprise-grade rule editing system with focused architecture.
 * Clean exports for the new rule studio system.
 */

// Main component - THE component that replaces the 782-line monolith
export { RuleStudioEditor as default } from './rule-studio-editor'
export { RuleStudioEditor } from './rule-studio-editor'

// Public types for external consumption
export type {
  RuleStudioEditorProps,
  RuleStudioState,
  TabId,
  InheritanceInfo
} from './types'

// Layout component (for advanced usage)
export { RuleStudioLayout } from './components/rule-studio-layout'

// Hooks (for advanced integration)
export { useRuleStudio } from './hooks/use-rule-studio'
export { useRuleInheritance } from './hooks/use-rule-inheritance'
export { useTabManagement } from './hooks/use-tab-management'

// UI components (for custom layouts)
export {
  InheritanceBanner,
  LoadingSpinner,
  RuleLoadingState,
  ErrorDisplay,
  TabDirtyIndicator,
  SaveStatusIndicator
} from './components/ui'

// Tab components (for custom arrangements)
export { BusinessRulesTab } from './components/tabs/business-rules-tab'
export { ParametersTab } from './components/tabs/parameters-tab'
export { PythonOutputTab } from './components/tabs/python-output-tab'
export { TestDebugTab } from './components/tabs/test-debug-tab'
