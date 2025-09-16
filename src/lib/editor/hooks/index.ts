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
export { useRuleMutation } from './use-rule-mutation'
export { useDraftPersistence } from './use-draft-persistence'

// Types
export type { RuleQueryData } from './use-rule-query'
export type { SaveOptions } from './use-rule-mutation'
