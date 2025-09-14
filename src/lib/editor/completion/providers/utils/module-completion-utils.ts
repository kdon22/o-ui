// Module completion utilities
// Handles module method suggestions and snippet generation

import type * as monaco from 'monaco-editor'
import { ALL_MODULE_SCHEMAS } from '@/lib/editor/schemas/modules'

export function getModuleMethodSuggestions(monacoInstance: typeof monaco, moduleNameCapitalized: string): monaco.languages.CompletionItem[] {
  const modName = moduleNameCapitalized.toLowerCase()
  // Match by schema category, not examples, to avoid suggestion leaks
  const methods = ALL_MODULE_SCHEMAS.filter(m => String((m as any).category || '').toLowerCase() === modName)
  return methods.map(method => ({
    label: method.name,
    kind: monacoInstance.languages.CompletionItemKind.Method,
    insertText: (method as any).snippetTemplate ? (method as any).snippetTemplate : `${method.name}(${buildSnippetParams(method)})`,
    insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: `${method.returnType || (method.returnInterface ? 'object' : 'unknown')} ${method.name}(${buildSignature(method)})`,
    documentation: `${method.description || ''}`,
    sortText: `1_${method.name}`
  } as monaco.languages.CompletionItem))
}

export function buildSnippetParams(method: any): string {
  if (!method.parameters || !method.parameters.length) return ''
  return method.parameters
    .map((p: any, idx: number) => {
      const index = idx + 1
      const body = `${index}:${p.name}${p.optional ? '?' : ''}`
      // Return a Monaco snippet placeholder literal like ${1:name} or ${1:name?}
      return '${' + body + '}'
    })
    .join(', ')
}

export function buildSignature(method: any): string {
  if (!method.parameters || !method.parameters.length) return ''
  return method.parameters.map((p: any) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ')
}
