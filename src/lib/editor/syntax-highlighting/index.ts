// Business Rules Syntax Highlighting System
// Complete integration with Monaco editor and variable-detection system

import type * as monaco from 'monaco-editor'
import { BUSINESS_RULES_TOKENIZER } from './tokenizer'
import { applyBusinessRulesIndentation } from './indentation'

/**
 * 🎯 SETUP SYNTAX HIGHLIGHTING FOR BUSINESS RULES
 * 
 * Integrates comprehensive tokenizer with variable-detection system
 * WITHOUT touching the existing system - only adds syntax highlighting
 */
export function setupBusinessRulesSyntaxHighlighting(monaco: typeof import('monaco-editor')) {
  // Check if language is already registered (by variable-detection system)
  const existingLanguages = monaco.languages.getLanguages()
  const isRegistered = existingLanguages.some((lang: any) => lang.id === 'business-rules')
  
  if (!isRegistered) {
    // Register language if not already done
    monaco.languages.register({ id: 'business-rules' })
    console.log('✅ [SyntaxHighlighting] Registered business-rules language')
  }

  // Set tokenizer for syntax highlighting (this is what was missing!)
  monaco.languages.setMonarchTokensProvider('business-rules', BUSINESS_RULES_TOKENIZER)
  console.log('✅ [SyntaxHighlighting] Applied comprehensive tokenizer with all syntax guide constructs')

  // Apply enhanced indentation configuration
  applyBusinessRulesIndentation(monaco)
  console.log('✅ [SyntaxHighlighting] Applied enhanced 4-space indentation configuration')
}

/**
 * 🚀 ENHANCED SETUP WITH EDITOR INSTANCE
 * 
 * Sets up syntax highlighting AND configures editor for 4-space indentation
 */
export function setupBusinessRulesWithEditor(
  monaco: typeof import('monaco-editor'),
  editor: monaco.editor.IStandaloneCodeEditor
) {
  // Setup syntax highlighting
  setupBusinessRulesSyntaxHighlighting(monaco)
  
  // Configure editor for 4-space indentation
  applyBusinessRulesIndentation(monaco, editor)
  
  console.log('🎨 [SyntaxHighlighting] Complete setup with editor configuration applied')
  return editor
}

/**
 * 🚀 INTEGRATION FUNCTION FOR VARIABLE-DETECTION SYSTEM
 * 
 * Call this AFTER variable-detection system initializes to add syntax highlighting
 * without interfering with completion providers
 */
export function integrateSyntaxHighlighting(monaco: typeof import('monaco-editor')) {
  try {
    setupBusinessRulesSyntaxHighlighting(monaco)
    console.log('🎨 [SyntaxHighlighting] Integration complete - business rules now have full syntax highlighting!')
    return true
  } catch (error) {
    console.error('❌ [SyntaxHighlighting] Integration failed:', error)
    return false
  }
}

// Export tokenizer and components for advanced usage
export { BUSINESS_RULES_TOKENIZER } from './tokenizer'
export { KEYWORDS, BUILT_IN_FUNCTIONS } from './keywords'
export { ALL_OPERATORS } from './operators'
export * from './patterns'

// Export indentation components
export { 
  createBusinessRulesIndentation,
  applyBusinessRulesIndentation, 
  BusinessRulesIndentationHelper 
} from './indentation'