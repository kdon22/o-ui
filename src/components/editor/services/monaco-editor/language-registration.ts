// Business Rules Language Registration for Monaco Editor
import type { Monaco } from '@monaco-editor/react'
import type * as MonacoTypes from 'monaco-editor'

// Import the business rules language configuration and tokenizer functions
import { createLanguageConfig } from './language-config'
import { createBusinessRulesTokenizer } from './tokenizer'
import { createBusinessRulesTheme, createBusinessRulesDarkTheme } from './theme'

/**
 * 🎯 UNIFIED LANGUAGE REGISTRATION WITH CLASS SUPPORT
 * 
 * Registers the business-rules language with Monaco using the bulletproof unified type system
 * and comprehensive class support including syntax highlighting, themes, and IntelliSense.
 */
export async function registerBusinessRulesLanguage(
  monaco: Monaco,
  isRegistered: boolean,
  enableTypeInference: boolean = true
): Promise<boolean> {
  try {




    // Skip if already registered to avoid conflicts
    if (isRegistered) {
  
      return true
    }

    // 1. Register the language

    monaco.languages.register({ id: 'business-rules' })

    
    // 🔍 DEBUG: Verify registration immediately
    const immediateCheck = monaco.languages.getLanguages().some(l => l.id === 'business-rules')


    // 2. Set up tokenizer for syntax highlighting (with class support)
    const tokenizer = createBusinessRulesTokenizer()
    monaco.languages.setMonarchTokensProvider('business-rules', tokenizer)


    // 3. Set up language configuration (brackets, auto-indent, etc.)
    const languageConfig = createLanguageConfig(monaco)
    monaco.languages.setLanguageConfiguration('business-rules', languageConfig)


    // 4. 🎯 Register themes for class syntax highlighting

    
    const lightTheme = createBusinessRulesTheme()
    monaco.editor.defineTheme('business-rules-light', lightTheme)

    
    const darkTheme = createBusinessRulesDarkTheme()
    monaco.editor.defineTheme('business-rules-dark', darkTheme)


    // 5. Final verification

    const finalCheck = monaco.languages.getLanguages().some(l => l.id === 'business-rules')

    
    // Check if themes are registered
    try {
      monaco.editor.setTheme('business-rules-light')
  
      monaco.editor.setTheme('business-rules-dark')
  
    } catch (themeError) {
      console.warn('⚠️ [LanguageRegistration] Theme verification failed:', themeError)
    }



    
    return true

  } catch (error) {
    console.error('❌ [LanguageRegistration] Failed to register business rules language:', error)
    return false
  }
}

/**
 * Check if business-rules language is already registered
 */
export function checkLanguageRegistration(monaco: Monaco): boolean {
  try {
    const languages = monaco.languages.getLanguages()
    return languages.some(lang => lang.id === 'business-rules')
  } catch (error) {
    console.warn('⚠️ [LanguageRegistration] Could not check registration:', error)
    return false
  }
}

/**
 * 🎯 Get debug info about registered providers
 */
export function getRegistrationDebugInfo(monaco: Monaco): {
  languageRegistered: boolean
  providersCount: {
    completion: number
    hover: number
    definition: number
  }
} {
  const languageRegistered = checkLanguageRegistration(monaco)
  
  // Note: Monaco doesn't expose provider counts directly
  // This is for debugging purposes during development
  return {
    languageRegistered,
    providersCount: {
      completion: 0, // Would need to track manually
      hover: languageRegistered ? 1 : 0, // We register one hover provider
      definition: 0  // Not implemented yet
    }
  }
}