/**
 * 🎯 TYPESCRIPT COMPLETION SYSTEM - Main Exports
 * 
 * Clean, standalone TypeScript interface → Monaco completion system
 * No legacy dependencies, pure TypeScript parsing → IntelliSense
 */

// Core registry for managing parsed interfaces
export { 
  interfaceRegistry,
  parseAndRegisterUtility,
  type ParsedUtilityInterface,
  type CompletionItem
} from './interface-registry'

// Monaco completion provider
export {
  createTypeScriptCompletionProvider,
  registerTypeScriptCompletionProvider
} from './monaco-provider'

// Utility functions
export { 
  setupTypeScriptCompletion,
  parseUtilityAndSetupCompletion
} from './setup'

// =============================================================================
// QUICK SETUP FUNCTION
// =============================================================================

/**
 * One-line setup for TypeScript completion in Monaco
 */
export function enableTypeScriptCompletion(
  monacoInstance: typeof import('monaco-editor'),
  languageId: string = 'business-rules'
): {
  disposable: import('monaco-editor').IDisposable
  parseUtility: (name: string, code: string) => Promise<{ success: boolean; error?: string }>
} {
  // Register the completion provider
  const { registerTypeScriptCompletionProvider } = require('./monaco-provider')
  const disposable = registerTypeScriptCompletionProvider(monacoInstance, languageId)
  
  // Return utility parser function
  const parseUtility = async (name: string, code: string) => {
    const { parseAndRegisterUtility } = require('./interface-registry')
    return parseAndRegisterUtility(name, code)
  }
  
  console.log(`[TypeScriptCompletion] Enabled for language: ${languageId}`)
  
  return {
    disposable,
    parseUtility
  }
}
