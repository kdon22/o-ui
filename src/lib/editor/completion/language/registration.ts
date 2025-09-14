import type * as monaco from 'monaco-editor'
import { BUSINESS_RULES_TOKENIZER } from './tokenizer'
import { createBusinessRulesLanguageConfig as createConfig } from './language-config'
import { createCompletionProviderFactory } from '@/lib/editor/completion'

export function registerBusinessRulesLanguageFactory(monacoInstance: typeof monaco): void {
  if (!(globalThis as any).__or_business_rules_lang__) {
    ;(globalThis as any).__or_business_rules_lang__ = { registered: false, completionDisposable: null as any }
  }
  const registry = (globalThis as any).__or_business_rules_lang__ as {
    registered: boolean
    completionDisposable: { dispose: () => void } | null
  }

  if (!registry.registered) {
    monacoInstance.languages.register({ id: 'business-rules' })
    monacoInstance.languages.setMonarchTokensProvider('business-rules', BUSINESS_RULES_TOKENIZER)
    monacoInstance.languages.setLanguageConfiguration('business-rules', createConfig(monacoInstance))
    registry.registered = true
  }

  // Always ensure the latest provider is registered (replace any existing one)
  try {
    if (registry.completionDisposable) {
      registry.completionDisposable.dispose()
      registry.completionDisposable = null
    }
  } catch {}

  registry.completionDisposable = monacoInstance.languages.registerCompletionItemProvider(
    'business-rules',
    createCompletionProviderFactory(monacoInstance)
  )
}

export function disposeBusinessRulesLanguageProviders(): void {
  const registry = (globalThis as any).__or_business_rules_lang__ as
    | undefined
    | { registered: boolean; completionDisposable: { dispose: () => void } | null }
  if (registry?.completionDisposable) {
    try { registry.completionDisposable.dispose() } catch {}
    registry.completionDisposable = null
  }
}


