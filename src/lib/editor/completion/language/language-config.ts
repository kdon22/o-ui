// Monaco Language Configuration for Business Rules (SSR-safe)
// Export builders that accept the runtime monaco instance to avoid server-side imports

export const createBusinessRulesLanguageConfig = (monaco: typeof import('monaco-editor')): import('monaco-editor').languages.LanguageConfiguration => ({
  // Comment configuration
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },

  // Bracket configuration for proper matching and auto-closing
  brackets: [
    ['{', '}'],
    ['[', ']'], 
    ['(', ')'],
    ['"', '"'],
    ["'", "'"]
  ],

  // Auto-closing pairs
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string'] }
  ],

  // Surrounding pairs for text selection
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],

  // Folding configuration for code blocks
  folding: {
    offSide: true, // Python-style indentation-based folding
    markers: {
      start: /^\s*#region/,
      end: /^\s*#endregion/
    }
  },

  // Word pattern for IntelliSense
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,

  // Indentation rules - This is KEY for fixing auto-indent!
  indentationRules: {
    // Increase indent after these patterns
    increaseIndentPattern: /^(.*\s+(if|while|for|when|unless|any|all)\s+.*|\s*(if|while|for|when|unless|any|all)\s+.*)$/,
    
    // 🔧 **FIXED** - Decrease indent for else/elseif to align with if
    decreaseIndentPattern: /^\s*(else|elseif|elif|except|finally)\b.*$/,
    
    // Keep indent for these patterns  
    indentNextLinePattern: /^(.*\s+(if|while|for|when|unless|any|all)\s+.*|\s*(if|while|for|when|unless|any|all)\s+.*)$/,
    
    // Unindent for these patterns
    unIndentedLinePattern: /^(\s*(\/\/.*)?)?$/
  },

  // Auto-indent on new lines
  onEnterRules: [
    {
      // After if/while/for statements, increase indent on next line
      beforeText: /^(\s*)(if|while|for|when|unless|any|all)(\s+.*)$/,
      action: { 
        indentAction: monaco.languages.IndentAction.Indent 
      }
    },
    {
      // 🔧 **CRITICAL FIX** - After else/elseif, indent next line properly
      beforeText: /^(\s*)(else|elseif|elif)(\s+.*)?$/,
      action: { 
        indentAction: monaco.languages.IndentAction.Indent 
      }
    },
    {
      // After empty lines, maintain current indent
      beforeText: /^\s*$/,
      action: { 
        indentAction: monaco.languages.IndentAction.None 
      }
    },
    {
      // After comments, maintain indent
      beforeText: /^\s*\/\/.*$/,
      action: { 
        indentAction: monaco.languages.IndentAction.None 
      }
    }
  ]
})

// Editor options specifically for business rules
export const createBusinessRulesEditorOptions = (monaco: typeof import('monaco-editor')): import('monaco-editor').editor.IStandaloneEditorConstructionOptions => ({
  // Language basics
  language: 'business-rules',
  theme: 'vs', // Use VS Code light theme by default
  
  // Line numbers and folding
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'indentation',
  
  // Indentation settings - CRITICAL for fixing auto-indent
  tabSize: 4, // 🔧 **UPDATED** - Use 4 spaces for business rules (Python standard)
  insertSpaces: true,
  detectIndentation: false,
  autoIndent: 'full', // Enable full auto-indentation
  
  // IntelliSense and suggestions
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  suggest: {
    showStatus: false, // Disable "no suggestions" bubble
  },
  
  // Word wrapping and formatting
  wordWrap: 'on',
  wordWrapColumn: 120,
  wrappingIndent: 'indent',
  
  // Bracket matching
  matchBrackets: 'always',
  
  // Scrolling and minimap
  scrollBeyondLastLine: false,
  minimap: { enabled: false }, // Hide minimap for cleaner look
  
  // Font and rendering
  fontSize: 14,
  fontFamily: 'Monaco, "Cascadia Code", "Courier New", monospace',
  lineHeight: 1.5,
  renderWhitespace: 'boundary',
  
  // Selection and cursor
  selectOnLineNumbers: true,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  
  // Undo/redo
  automaticLayout: true,
  
  // Hover and tooltips
  hover: {
    enabled: true,
    delay: 300,
    sticky: true
  },
  
  // Context menu
  contextmenu: true,
  
  // Performance
  scrollbar: {
    useShadows: false,
    verticalHasArrows: true,
    horizontalHasArrows: true
  }
})


