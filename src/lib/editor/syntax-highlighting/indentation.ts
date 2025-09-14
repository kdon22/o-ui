// Business Rules Language Indentation Configuration
// Handles 4-space indentation for custom business rules syntax

import type * as monaco from 'monaco-editor'

/**
 * 🎯 BUSINESS RULES INDENTATION RULES FACTORY
 * 
 * Creates indentation configuration for business rules language constructs.
 * This function approach prevents SSR issues by only accessing Monaco at runtime.
 */
export function createBusinessRulesIndentation(
  monaco: typeof import('monaco-editor')
): monaco.languages.LanguageConfiguration {
  return {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    
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
      { open: "'", close: "'" },
      { open: '"""', close: '"""' },
      { open: "'''", close: "'''" }
    ],
    
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],

    // 🚀 ENHANCED INDENTATION RULES FOR BUSINESS RULES
    indentationRules: {
      // Increase indent after these patterns:
      increaseIndentPattern: /^(.*\s*)?(if\b|else\b|elseif\b|for\b|while\b|class\b|enum\b|def\b|function\b|switch\b|case\b|default\b).*[:{]?\s*$/,
      
      // Decrease indent for closing constructs:
      decreaseIndentPattern: /^(.*\s*)?(}|else\b|elseif\b|elif\b).*$/,
      
      // Unindented patterns (reset to base level):
      unIndentedLinePattern: /^(class\b|enum\b|def\b|function\b)/
    },

    // Word boundaries for double-click selection
    wordPattern: /[a-zA-Z_$][\w$]*/,

    // Code folding regions
    foldingRules: {
      markers: {
        start: /^\s*\/\*/,  // Block comments start
        end: /^\s*\*\//     // Block comments end
      }
    },

    // Auto-indent settings - using Monaco at runtime
    onEnterRules: [
      // After opening brace, indent next line
      {
        beforeText: /.*\{\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      
      // After if statement without brace, indent next line
      {
        beforeText: /^\s*(if|for|while)\b.*[^{]\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      
      // 🔧 **CRITICAL FIX** - Special handling for else/elseif
      // When typing "else" or "elseif", outdent to match the corresponding "if"
      {
        beforeText: /^\s*(else|elseif|elif)\b.*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.Outdent,
          appendText: '    ' // Add 4 spaces after outdenting for the content
        }
      },
      
      // After else/elseif statement, indent next line
      {
        beforeText: /^\s*(else|elseif|elif)\b.*[^{]\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      
      // After case/default in switch, indent next line
      {
        beforeText: /^\s*(case\b.*:|default\s*:)\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      
      // After function definition, indent next line
      {
        beforeText: /^\s*(def|function)\s+\w+.*:?\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },

      // Special handling for closing brace - align with opening
      {
        beforeText: /^\s*\}\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Outdent }
      }
    ]
  }
}

/**
 * 🎯 APPLY INDENTATION CONFIGURATION
 * 
 * Sets up proper 4-space indentation for business rules language
 */
export function applyBusinessRulesIndentation(
  monaco: typeof import('monaco-editor'),
  editor?: monaco.editor.IStandaloneCodeEditor
) {
  // Create and apply language configuration
  const indentationConfig = createBusinessRulesIndentation(monaco)
  monaco.languages.setLanguageConfiguration('business-rules', indentationConfig)
  
  // 🔧 **REGISTER SMART ELSE/ELSEIF INDENTATION PROVIDER**
  const elseProvider = createElseIndentationProvider(monaco)
  monaco.languages.registerOnTypeFormattingEditProvider('business-rules', elseProvider)
  console.log('✅ [Indentation] Registered smart else/elseif indentation provider')
  
  // If editor instance provided, configure editor-specific settings
  if (editor) {
    editor.updateOptions({
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: false,
      automaticLayout: true,
      formatOnType: true,
      formatOnPaste: true,
      autoIndent: 'full'
    })
  }
  
  console.log('✅ [Indentation] Applied 4-space indentation rules for business-rules language')
}

/**
 * 🔧 **SMART ELSE/ELSEIF INDENTATION PROVIDER**
 * 
 * Provides intelligent indentation for else/elseif statements
 */
export function createElseIndentationProvider(
  monaco: typeof import('monaco-editor')
): monaco.languages.OnTypeFormattingEditProvider {
  return {
    autoFormatTriggerCharacters: ['e', 'f'], // Trigger on 'else' and 'elseif'
    
    provideOnTypeFormattingEdits(
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      ch: string,
      options: monaco.languages.FormattingOptions
    ): monaco.languages.TextEdit[] {
      const lineContent = model.getLineContent(position.lineNumber)
      const trimmedLine = lineContent.trim()
      
      // Check if we just completed typing "else" or "elseif"
      if (trimmedLine === 'else' || trimmedLine === 'elseif') {
        // Find the matching if statement to align with
        const targetIndent = findMatchingIfIndentation(model, position.lineNumber)
        
        if (targetIndent !== null) {
          const currentIndent = lineContent.length - lineContent.trimStart().length
          const indentDiff = targetIndent - currentIndent
          
          if (indentDiff !== 0) {
            // Create edit to fix indentation
            const range = new monaco.Range(
              position.lineNumber, 1,
              position.lineNumber, currentIndent + 1
            )
            
            const newIndent = ' '.repeat(targetIndent)
            return [{
              range,
              text: newIndent
            }]
          }
        }
      }
      
      return []
    }
  }
}

/**
 * 🎯 **FIND MATCHING IF INDENTATION**
 * 
 * Finds the indentation level of the corresponding if statement
 */
function findMatchingIfIndentation(
  model: monaco.editor.ITextModel, 
  currentLine: number
): number | null {
  let ifCount = 0
  
  // Search backwards for matching if statement
  for (let line = currentLine - 1; line >= 1; line--) {
    const lineContent = model.getLineContent(line)
    const trimmed = lineContent.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue
    
    // Count else/elseif statements (need to skip over them)
    if (/^\s*(else|elseif|elif)\b/.test(trimmed)) {
      ifCount++
      continue
    }
    
    // Found an if statement
    if (/^\s*if\b/.test(trimmed)) {
      if (ifCount === 0) {
        // This is our matching if statement
        return lineContent.length - lineContent.trimStart().length
      } else {
        ifCount--
      }
    }
  }
  
  return null // No matching if found
}

/**
 * 🚀 MANUAL INDENTATION HELPERS
 * 
 * For cases where automatic indentation needs assistance
 */
export class BusinessRulesIndentationHelper {
  private editor: monaco.editor.IStandaloneCodeEditor
  private monaco: typeof import('monaco-editor')
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) {
    this.editor = editor
    this.monaco = monaco
  }
  
  /**
   * Force proper indentation on current line
   */
  fixCurrentLineIndentation(): void {
    const position = this.editor.getPosition()
    if (!position) return
    
    const model = this.editor.getModel()
    if (!model) return
    
    const lineContent = model.getLineContent(position.lineNumber)
    const trimmedContent = lineContent.trim()
    
    if (!trimmedContent) return
    
    // Calculate expected indent level
    const expectedIndent = this.calculateIndentLevel(position.lineNumber)
    const newIndent = '  '.repeat(expectedIndent) // 2 spaces per level
    const newLineContent = newIndent + trimmedContent
    
    // Replace line content
    const lineRange = new this.monaco.Range(
      position.lineNumber, 1,
      position.lineNumber, lineContent.length + 1
    )
    
    this.editor.executeEdits('indentation-fix', [{
      range: lineRange,
      text: newLineContent
    }])
    
    // Position cursor after indent
    this.editor.setPosition({
      lineNumber: position.lineNumber,
      column: newIndent.length + 1
    })
  }
  
  /**
   * Calculate expected indent level for line
   */
  private calculateIndentLevel(lineNumber: number): number {
    const model = this.editor.getModel()
    if (!model) return 0
    
    let indentLevel = 0
    
    // Look at previous lines to determine context
    for (let i = lineNumber - 1; i >= 1; i--) {
      const line = model.getLineContent(i).trim()
      if (!line) continue
      
      // Increase for opening constructs
      if (/^(if|else|elseif|for|while|class|enum|def|function|switch|case|default)\b/.test(line) || 
          line.endsWith('{') || line.endsWith(':')) {
        indentLevel++
      }
      
      // Decrease for closing constructs
      if (line.startsWith('}') || /^(else|elseif|elif)\b/.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1)
      }
    }
    
    return indentLevel
  }
  
  /**
   * Format entire document with proper indentation
   */
  formatDocument(): void {
    const model = this.editor.getModel()
    if (!model) return
    
    const lineCount = model.getLineCount()
    let currentIndentLevel = 0
    
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber)
      const trimmedContent = lineContent.trim()
      
      if (!trimmedContent) continue
      
      // Adjust indent for current line
      if (/^(}|else|elseif|elif)\b/.test(trimmedContent)) {
        currentIndentLevel = Math.max(0, currentIndentLevel - 1)
      }
      
      // Apply indent
      const expectedIndent = '  '.repeat(currentIndentLevel)
      const newLineContent = expectedIndent + trimmedContent
      
      if (newLineContent !== lineContent) {
        const lineRange = new this.monaco.Range(
          lineNumber, 1,
          lineNumber, lineContent.length + 1
        )
        
        this.editor.executeEdits('format-document', [{
          range: lineRange,
          text: newLineContent
        }])
      }
      
      // Adjust indent for next line
      if (/^(if|else|elseif|for|while|class|enum|def|function|switch|case|default)\b/.test(trimmedContent) || 
          trimmedContent.endsWith('{') || trimmedContent.endsWith(':')) {
        currentIndentLevel++
      }
    }
    
    console.log('✅ [Indentation] Formatted document with proper 2-space indentation')
  }
}