// Language Registration Factory - Dynamic Monaco language setup
// Uses factory pattern to avoid static Monaco imports

import type * as monaco from 'monaco-editor'
// DEPRECATED: This wrapper now proxies to lib/editor/completion language registration
import { registerBusinessRulesLanguageFactory as coreRegister, disposeBusinessRulesLanguageProviders as coreDispose } from '@/lib/editor/completion/language/registration'

interface LanguageRegistrationFactory {
  (monacoInstance: typeof monaco): void
}

/**
 * Factory function to register business-rules language with Monaco
 * Called when Monaco is dynamically loaded
 */
export const registerBusinessRulesLanguageFactory: LanguageRegistrationFactory = (monacoInstance) => {
  coreRegister(monacoInstance)
}

/**
 * Check if the business-rules language is already registered
 */
export function isBusinessRulesLanguageRegistered(monaco: any): boolean {
  return monaco.languages.getLanguages().some((lang: any) => lang.id === 'business-rules')
}

/**
 * Get the registered language configuration
 */
export function getBusinessRulesLanguageId(): string {
  return 'business-rules'
}

/**
 * Apply the business rules theme to an editor instance
 */
export function applyBusinessRulesTheme(
  editor: any,
  options?: { mode?: 'light' | 'dark' }
): void {
  let theme: 'business-rules-light' | 'business-rules-dark' = 'business-rules-light'

  if (options?.mode === 'dark') {
    theme = 'business-rules-dark'
  } else if (options?.mode === 'light') {
    theme = 'business-rules-light'
  } else if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme = prefersDark ? 'business-rules-dark' : 'business-rules-light'
  }

  editor.updateOptions({ theme })
}

/**
 * Dispose global business-rules language providers (e.g., completion) to prevent duplicates.
 * Safe to call multiple times.
 */
export function disposeBusinessRulesLanguageProviders(): void { coreDispose() }