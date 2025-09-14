// Global Helper Module - Cross-Tenant Utilities
// Provides hierarchical namespace: helper.debug.screen(), helper.regex.match(), etc.

import { REGEX_HELPER_SCHEMAS } from './regex'
import { STRING_HELPER_SCHEMAS } from './string'
import { EMAIL_HELPER_SCHEMAS } from './email'
import { DATA_HELPER_SCHEMAS } from './data'
import { MATH_HELPER_SCHEMAS } from './math'
import { DATE_HELPER_SCHEMAS } from './date'
import { FILE_HELPER_SCHEMAS } from './file'
import { CRYPTO_HELPER_SCHEMAS } from './crypto'

import type { UnifiedSchema } from '../../types'

// Combine all helper function schemas
export const HELPER_MODULE_SCHEMAS: UnifiedSchema[] = [
  ...REGEX_HELPER_SCHEMAS, 
  ...STRING_HELPER_SCHEMAS,
  ...EMAIL_HELPER_SCHEMAS,
  ...DATA_HELPER_SCHEMAS,
  ...MATH_HELPER_SCHEMAS,
  ...DATE_HELPER_SCHEMAS,
  ...FILE_HELPER_SCHEMAS,
  ...CRYPTO_HELPER_SCHEMAS
  // Easy to add more categories:
  // ...NETWORK_HELPER_SCHEMAS,
  // ...AUTH_HELPER_SCHEMAS,
  // ...PDF_HELPER_SCHEMAS,
]

// Export individual categories for direct access
export {
  REGEX_HELPER_SCHEMAS,
  STRING_HELPER_SCHEMAS,
  EMAIL_HELPER_SCHEMAS,
  DATA_HELPER_SCHEMAS,
  MATH_HELPER_SCHEMAS,
  DATE_HELPER_SCHEMAS,
  FILE_HELPER_SCHEMAS,
  CRYPTO_HELPER_SCHEMAS
}

// Convenience function to get helpers by category
export const getHelpersByCategory = (category: string): UnifiedSchema[] => {
  return HELPER_MODULE_SCHEMAS.filter(schema => 
    schema.category === category || 
    schema.name.startsWith(`${category}.`)
  )
}

// Get all helper categories for IntelliSense
export const getHelperCategories = (): string[] => {
  const categories = new Set<string>()
  
  HELPER_MODULE_SCHEMAS.forEach(schema => {
    // Extract category from name: "debug.screen" -> "debug"
    const parts = schema.name.split('.')
    if (parts.length > 1) {
      categories.add(parts[0])
    }
  })
  
  return Array.from(categories).sort()
}

// Monaco IntelliSense helper - generates completions for helper.* namespace
export const generateHelperCompletions = (monaco: any) => {
  const categories = getHelperCategories()
  const completions: any[] = []
  
  // Add category completions (helper.debug, helper.regex, etc.)
  categories.forEach(category => {
    completions.push({
      label: `helper.${category}`,
      kind: monaco.languages.CompletionItemKind.Module,
      documentation: `${category.charAt(0).toUpperCase() + category.slice(1)} helper functions`,
      detail: `Global ${category} utilities`,
      insertText: `helper.${category}.`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
      range: null
    })
  })
  
  // Add individual function completions
  HELPER_MODULE_SCHEMAS.forEach(schema => {
    completions.push({
      label: `helper.${schema.name}`,
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: schema.description,
      detail: `Returns: ${schema.returnType || 'void'}`,
      insertText: schema.snippetTemplate ? 
        `helper.${schema.snippetTemplate}` : 
        `helper.${schema.name}()`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: null
    })
  })
  
  return completions
} 