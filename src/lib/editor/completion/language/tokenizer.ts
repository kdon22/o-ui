// Monaco Tokenizer for Business Rules Syntax Highlighting (SSR-safe)

// Business Rules Tokenizer using Monarch syntax
export const BUSINESS_RULES_TOKENIZER: import('monaco-editor').languages.IMonarchLanguage = {
  // Default token (fallback)
  defaultToken: 'invalid',

  // Keywords - Statement starters (case-insensitive matching)
  keywords: ['if', 'while', 'for', 'IF', 'WHILE', 'FOR'],

  // Logical operators
  logical: ['And', 'Or', 'and', 'or', 'AND', 'OR'],

  // Collection keywords
  collection: ['any', 'all', 'items', 'in', 'where', 'ANY', 'ALL', 'ITEMS', 'IN', 'WHERE'],

  // String operators (natural language) - not hardcoded; provided via schemas
  stringOperators: [],
  
  // Comparison operators (no == or !=)
  comparisonOperators: ['<', '<=', '>', '>='],
  
  // Built-in types for highlighting
  types: ['string', 'number', 'boolean', 'array', 'object', 'class', 'dictionary'],
  
  // Escape sequences for strings
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // Tokenizer rules
  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],

      // Numbers
      [/\b\d*\.\d+([eE][-+]?\d+)?\b/, 'number.float'],
      [/\b\d+([eE][-+]?\d+)?\b/, 'number'],

      // Keywords and identifiers
      [/[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*/, {
        cases: {
          '@keywords': 'keyword',
          '@logical': 'keyword.operator',
          '@collection': 'keyword',
          '@types': 'type',
          '@default': 'identifier'
        }
      }],

      // Operators
      [/\s*=\s*/, 'operator'],
      [/<=|>=|<|>/, 'operator'],
      [/[+\-*/%]/, 'operator'],

      // Brackets and delimiters
      [/[{}()\[\]]/, '@brackets'],
      [/[,;]/, 'delimiter']
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/^[\/*]/, 'comment']
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop']
    ]
  }
}


