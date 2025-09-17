/**
 * 🏆 ENTERPRISE: Editor Hooks - Clean Architecture
 * 
 * Domain-specific hooks for the Monaco business rules editor.
 * All hooks follow Single Source of Truth architecture.
 */

// Main orchestrator hook
export { useRuleEditor } from './use-rule-editor'

// Focused responsibility hooks
export { useRuleQuery } from './use-rule-query'
export { useDraftPersistence } from './use-draft-persistence'

// Types
export type { RuleQueryData } from './use-rule-query'
