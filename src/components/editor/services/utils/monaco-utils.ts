/**
 * 🛠️ MONACO UTILITY FUNCTIONS
 * 
 * Pure utility functions for Monaco editor operations
 */

import type * as MonacoTypes from 'monaco-editor'

/**
 * Create a default completion range for Monaco
 */
export function getDefaultCompletionRange(
  model?: MonacoTypes.editor.ITextModel, 
  position?: MonacoTypes.Position
): MonacoTypes.IRange {
  if (model && position) {
    const word = model.getWordAtPosition(position)
    if (word) {
      return {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn
      }
    }
  }
  
  // Default range when no model/position available
  return {
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 1
  }
}

/**
 * Setup Monaco language configuration
 */
export function setupBusinessRulesLanguageConfig(monaco: any): void {
  // Set tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider('business-rules', {
    tokenizer: {
      root: [
        [/\b(if|else|and|or|not|in|is|true|false)\b/, 'keyword'],
        [/\b(string|number|boolean|array|object)\b/, 'type'],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/\d+/, 'number'],
        [/[{}()\[\]]/, 'bracket'],
        [/[<>]=?|[!=]=?|&&|\|\|/, 'operator'],
        [/[,;.]/, 'delimiter']
      ]
    }
  })
  
  // Set language configuration
  monaco.languages.setLanguageConfiguration('business-rules', {
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  })
}

/**
 * Register business-rules language if not already done
 */
export function registerBusinessRulesLanguage(monaco: any): void {
  const existingLanguages = monaco.languages.getLanguages()
  const isRegistered = existingLanguages.some((lang: any) => lang.id === 'business-rules')
  
  if (!isRegistered) {
    monaco.languages.register({ id: 'business-rules' })

    
    // Verify registration
    const afterRegistration = monaco.languages.getLanguages()
    const nowRegistered = afterRegistration.some((lang: any) => lang.id === 'business-rules')

  } else {

  }
}