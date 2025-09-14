// Completion providers index
// Single entry point for all completion functionality

export { createCompletionProviderFactory } from './core/main-provider'

// Export individual handlers for testing and direct use
export { sqlCompletionHandler } from './handlers/sql-completion-handler'
export { parameterCompletionHandler } from './handlers/parameter-completion-handler'
export { keywordCompletionHandler } from './handlers/keyword-completion-handler'
export { propertyCompletionHandler } from './handlers/property-completion-handler'
export { classCompletionHandler } from './handlers/class-completion-handler'
export { defaultCompletionHandler } from './handlers/default-completion-handler'

// Export utilities
export { getModuleMethodSuggestions, buildSnippetParams, buildSignature } from './utils/module-completion-utils'
export { getTypeSpecificCompletions } from './utils/type-completion-utils'
export { handleArrayIndexing } from './utils/array-indexing-utils'
export { getVariablesUsingMasterSystem, convertToLegacyFormat, type MasterVariableInfo } from './utils/master-variable-detection'
