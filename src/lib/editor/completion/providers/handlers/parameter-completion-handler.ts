// Parameter completion handler
// Provides type-aware parameter suggestions for function calls

import type * as monaco from 'monaco-editor'
import { typeInferenceService } from '../../type-inference-service'
import { schemaBridge } from '@/lib/editor/type-system/schema-bridge'

export const parameterCompletionHandler = {
  handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.CompletionList | undefined {
    const paramItems = getParameterSuggestions(monacoInstance, model, position)
    console.log(`[ParameterCompletionHandler] Parameter suggestions:`, paramItems?.length || 0, 'items')
    if (paramItems && paramItems.length) {
      return { suggestions: paramItems }
    }
    return undefined
  }
}

// Minimal parameter suggestions with type-aware header
function getParameterSuggestions(
  monacoInstance: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position
): monaco.languages.CompletionItem[] | undefined {
  const line = model.getLineContent(position.lineNumber)
  const before = line.substring(0, position.column - 1)
  const ctx = detectParameterContext(before)
  if (!ctx.active || !ctx.paramName || !ctx.expectedType) return undefined

  const text = model.getValue()
  const vars = typeInferenceService.getVariables()
  // Prefer typeRef-awareness: treat complex typeRefs as 'object' for compatibility filtering
  const expected = ctx.expectedTypeRef ? 'object' : (ctx.expectedType || 'unknown')
  const filtered = vars.filter(v => isTypeCompatible(v.type, expected))

  const header: monaco.languages.CompletionItem = {
    label: `${ctx.paramName}: ${ctx.expectedType}`,
    kind: monacoInstance.languages.CompletionItemKind.Text,
    insertText: '',
    detail: 'parameter',
    sortText: '0_000',
    range: {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    }
  }

  const items = filtered.map(v => ({
    label: v.name,
    kind: monacoInstance.languages.CompletionItemKind.Variable,
    insertText: v.name,
    detail: `${v.type} (${ctx.paramName})`,
    documentation: `${ctx.paramName}: expects ${ctx.expectedTypeRef || ctx.expectedType}.`,
    sortText: `1_${v.name}`
  } as monaco.languages.CompletionItem))

  // Add a basic literal snippet for primitives and an object skeleton for complex refs
  const literalSuggestions: monaco.languages.CompletionItem[] = []
  if (!ctx.expectedTypeRef) {
    if (normalize(expected) === 'string') {
      literalSuggestions.push({
        label: '""',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: '"${1:text}"',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'string literal',
        sortText: '0_100'
      } as monaco.languages.CompletionItem)
    } else if (normalize(expected) === 'number') {
      literalSuggestions.push({
        label: '0',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: '${1:0}',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'number literal',
        sortText: '0_101'
      } as monaco.languages.CompletionItem)
    } else if (normalize(expected) === 'boolean') {
      literalSuggestions.push({
        label: 'true',
        kind: monacoInstance.languages.CompletionItemKind.Keyword,
        insertText: 'true',
        detail: 'boolean literal',
        sortText: '0_102'
      } as monaco.languages.CompletionItem)
      literalSuggestions.push({
        label: 'false',
        kind: monacoInstance.languages.CompletionItemKind.Keyword,
        insertText: 'false',
        detail: 'boolean literal',
        sortText: '0_103'
      } as monaco.languages.CompletionItem)
    }
  } else {
    // Generic object skeleton for complex type refs (e.g., HttpHeaders)
    literalSuggestions.push({
      label: '{}',
      kind: monacoInstance.languages.CompletionItemKind.Snippet,
      insertText: '{ ${1:key}: ${2:value} }',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: `${ctx.expectedTypeRef} object`,
      sortText: '0_110'
    } as monaco.languages.CompletionItem)
  }

  return [header, ...literalSuggestions, ...items]
}

function detectParameterContext(beforeCursor: string): { active: boolean; moduleName?: string; methodName?: string; paramIndex?: number; expectedType?: string; expectedTypeRef?: string; paramName?: string } {
  // Robustly find the nearest call site like module.method(
  const callMatch = /([A-Za-z][\w]*)\.([a-zA-Z_][\w]*)\s*\(([^)]*)$/.exec(beforeCursor)
  if (!callMatch) return { active: false }
  const moduleName = callMatch[1]
  const methodName = callMatch[2]
  const tail = callMatch[3] || ''
  // Detect named parameter currently being typed: e.g., "headers: {"
  const namedParamMatch = tail.match(/([a-zA-Z_][\w]*)\s*:\s*[^,]*$/)
  const namedParam: string | undefined = namedParamMatch ? namedParamMatch[1] : undefined
  // Determine param index by counting top-level commas (ignore braces/parens nesting)
  let parenDepth = 0, braceDepth = 0, count = 0
  for (let i = 0; i < tail.length; i++) {
    const ch = tail[i]
    if (ch === '(') parenDepth++
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    else if (ch === '{') braceDepth++
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1)
    else if (ch === ',' && parenDepth === 0 && braceDepth === 0) count++
  }
  const paramIndex = count
  if (!methodName) return { active: false }
  // Prefer module params if module known; otherwise fallback to type-method params (not implemented here)
  const params = schemaBridge.getParametersForModuleMethod(moduleName, methodName)
  if (params && params.length) {
    // If named param present, find by name; else use index
    const meta = namedParam ? params.find(p => p.name === namedParam) : params[Math.min(paramIndex, params.length - 1)]
    if (!meta) return { active: false }
    return { active: true, moduleName, methodName, paramIndex, expectedType: String(meta.type), expectedTypeRef: meta.typeRef, paramName: String(meta.name) }
  }
  return { active: false }
}

function isTypeCompatible(variableType: string, expectedType: string): boolean {
  const v = normalize(variableType)
  const e = normalize(expectedType)
  // Fast path for exact match after normalization
  if (v === e) return true
  if (e === 'number') return v === 'number' || v === 'float' || v === 'int'
  if (e === 'float') return v === 'float' || v === 'number'
  if (e === 'string') return v === 'string'
  if (e === 'boolean') return v === 'boolean'
  if (e.startsWith('array')) return v === 'array'
  if (e === 'object') return v === 'object'
  return v === e
}

function normalize(t: string): string {
  const s = (t || '').toLowerCase()
  if (s === 'str') return 'string'
  if (s === 'int') return 'number'
  if (s === 'float64' || s === 'double') return 'float'
  if (s === 'bool') return 'boolean'
  if (s === 'list') return 'array'
  if (s === 'dict' || s === 'record' || s === 'map') return 'object'
  return s
}
