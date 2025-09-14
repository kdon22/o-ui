// Keyword completion handler
// Provides control flow keyword suggestions with snippets

import type * as monaco from 'monaco-editor'

export const keywordCompletionHandler = {
  handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    trimmed: string
  ): monaco.languages.CompletionList | undefined {
    console.log(`[KeywordCompletionHandler] Checking keyword patterns...`)
    
    if (/^(if)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched IF keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'if') }
    }
    if (/^(while)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched WHILE keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'while') }
    }
    if (/^(for)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched FOR keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'for') }
    }
    if (/^(switch)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched SWITCH keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'switch') }
    }
    if (/^(elseif)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched ELSEIF keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'elseif') }
    }
    if (/^(else)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched ELSE keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'else') }
    }
    if (/^(try)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched TRY keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'try') }
    }
    if (/^(if\s+any)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched IF ANY keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'ifany') }
    }
    if (/^(if\s+all)\s*$/i.test(trimmed)) {
      console.log(`[KeywordCompletionHandler] Matched IF ALL keyword pattern`)
      return { suggestions: getKeywordSuggestions(monacoInstance, model, position, 'ifall') }
    }
    
    console.log(`[KeywordCompletionHandler] No keyword patterns matched`)
    return undefined
  }
}

function getKeywordSuggestions(
  monacoInstance: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  keyword: 'if'|'while'|'for'|'switch'|'elseif'|'else'|'try'|'ifany'|'ifall'
): monaco.languages.CompletionItem[] {
  const range = {
    startLineNumber: position.lineNumber,
    startColumn: position.column - 2 > 1 ? position.column - 2 : 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  }
  
  if (keyword === 'if') {
    return [{
      label: 'if',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'if ${1:condition}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'conditional statement',
      documentation: 'Execute code conditionally',
      sortText: '0_if',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'while') {
    return [{
      label: 'while',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'while ${1:condition}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'loop while condition is true',
      documentation: 'Repeat while condition is true',
      sortText: '0_while',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'for') {
    return [{
      label: 'for',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'for ${1:item} in ${2:collection}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'iterate over a collection',
      documentation: 'Iterate items in a collection',
      sortText: '0_for',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'switch') {
    return [{
      label: 'switch',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'switch ${1:expr}\n\tcase ${2:value}\n\t\t$0\n\tdefault\n\t\t',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'multi-branch selection',
      documentation: 'Select behavior based on value',
      sortText: '0_switch',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'elseif') {
    return [{
      label: 'elseif',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'elseif ${1:condition}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'else-if branch',
      documentation: 'Secondary condition branch',
      sortText: '0_elseif',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'else') {
    return [{
      label: 'else',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'else\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'else branch',
      documentation: 'Fallback branch',
      sortText: '0_else',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'try') {
    return [{
      label: 'try',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'try\n\t$0\ncatch\n\t\nfinally\n\t',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'try/catch/finally scaffold',
      documentation: 'Handle errors with optional finally',
      sortText: '0_try',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'ifany') {
    return [{
      label: 'if any',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'if any ${1:collection} as ${2:item}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'exists-at-least-one pattern',
      documentation: 'Execute when any item matches',
      sortText: '0_ifany',
      range
    } as monaco.languages.CompletionItem]
  }
  if (keyword === 'ifall') {
    return [{
      label: 'if all',
      kind: monacoInstance.languages.CompletionItemKind.Keyword,
      insertText: 'if all ${1:collection} as ${2:item}\n\t$0',
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'all-match pattern',
      documentation: 'Execute when all items match',
      sortText: '0_ifall',
      range
    } as monaco.languages.CompletionItem]
  }
  return []
}
