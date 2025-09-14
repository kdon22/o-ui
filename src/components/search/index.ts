// ============================================================================
// UNIVERSAL RULE SEARCH SYSTEM
// ============================================================================

export {
  UniversalRuleSearch,
  type RuleType,
  type RuleSearchResult,
  type UniversalRuleSearchProps
} from './universal-rule-search'

export {
  UniversalSearchProvider,
  useUniversalSearch,
  useRuleTypeSearch,
  useRuleSelection,
  SearchTrigger,
  type SearchState,
  type UniversalSearchContextValue,
  type UniversalSearchProviderProps,
  type SearchTriggerProps
} from './universal-search-provider'

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Icons are imported directly from lucide-react where needed 