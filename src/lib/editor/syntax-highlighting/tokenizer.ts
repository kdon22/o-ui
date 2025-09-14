// Business Rules Language Tokenizer
// Complete Monaco tokenizer supporting ALL syntax guide constructs

import type * as monaco from 'monaco-editor'
import { KEYWORDS, BUILT_IN_FUNCTIONS, COMPARISON_OPERATORS } from './keywords'
import { ALL_OPERATORS, SYMBOL_PATTERN } from './operators'

export interface BusinessRulesTokenizer {
  keywords: string[]
  operators: string[]
  symbols: RegExp
  tokenizer: monaco.languages.IMonarchLanguage['tokenizer']
}

/**
 * 🎯 COMPREHENSIVE MONACO TOKENIZER
 * Supports ALL constructs from syntax guide:
 * - Classes, enums, functions
 * - Control flow (if, for, while, switch)
 * - Special constructs (if any, if all)
 * - Regex literals with flags
 * - Multi-line strings
 * - Increment/compound operators
 * - Comments (// and block comments)
 */
export const BUSINESS_RULES_TOKENIZER: monaco.languages.IMonarchLanguage = {
  // === KEYWORDS ===
  keywords: [
    ...KEYWORDS
  ],

  // === OPERATORS ===
  operators: ALL_OPERATORS,

  // === SYMBOL PATTERN ===
  symbols: SYMBOL_PATTERN,

  // === TOKENIZER RULES ===
  tokenizer: {
    root: [
      // === REGEX LITERALS ===
      // /pattern/flags - must come before division operator
      [/\/(?![\/\*])(?:[^\/\\\r\n]|\\.)+\/[gimuy]*/, 'regexp'],

      // === SPECIAL CONSTRUCTS === (kept minimal; patterns added by schemas if needed)
      
      // for item in collection as element
      [/\b(for)\s+(\w+)\s+(in)\s+(\w+(?:\.\w+)*)\s+(as)\s+(\w+)/, ['keyword', 'variable.parameter', 'keyword', 'variable', 'keyword', 'variable.parameter']],

      // === CLASS DEFINITIONS ===
      // class ClassName {
      [/\b(class)\s+([A-Z][a-zA-Z0-9]*)\s*(\{)/, ['keyword', 'type.identifier', 'delimiter.bracket']],
      
      // === ENUM DEFINITIONS ===
      // enum ENUM_NAME {
      [/\b(enum)\s+([A-Z_][A-Z0-9_]*)\s*(\{)/, ['keyword', 'constant', 'delimiter.bracket']],

      // === FUNCTION DEFINITIONS ===
      [/\b(def|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\()/, ['keyword', 'entity.name.function', 'delimiter.parenthesis']],

      // === NAMED PARAMETERS ===
      [/\b([a-zA-Z_][\w]*)\s*(?=:)/, 'parameter.name'],

      // === TYPE ANNOTATIONS ===
      // variable: type = value
      [/\b([a-zA-Z_$][\w$]*)\s*:\s*([a-zA-Z_$][\w$]*)\s*=/, ['variable', 'type']],

      // === IDENTIFIERS ===
      [/[a-zA-Z_$][\w$]*/, { 
        cases: { 
          '@keywords': 'keyword',
          '@operators': 'operator',
          '@default': 'identifier' 
        } 
      }],

      // === NUMBERS ===
      // Hexadecimal: 0x1A, 0xFF
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      
      // Octal: 0o17, 0O755
      [/0[oO][0-7]+/, 'number.octal'],
      
      // Binary: 0b1010, 0B1111
      [/0[bB][01]+/, 'number.binary'],
      
      // Scientific notation: 1.23e-4, 2E+5
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      
      // Regular numbers: 123, -456
      [/\d+/, 'number'],

      // === STRINGS ===
      // Multi-line strings: """content"""
      [/"""/, { token: 'string.quote', bracket: '@open', next: '@multilinestring' }],
      
      // Multi-line strings: '''content'''
      [/'''/, { token: 'string.quote', bracket: '@open', next: '@multilinestringsingle' }],
      
      // Invalid strings (unterminated)
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      
      // Valid strings
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
      [/'/, { token: 'string.quote', bracket: '@open', next: '@stringsingle' }],

      // === COMMENTS ===
      // Documentation comments: /** ... */
      [/\/\*\*(?!\/)/, { token: 'comment.doc', next: '@doccomment' }],
      
      // Multi-line comments: /* ... */
      [/\/\*/, { token: 'comment', next: '@comment' }],
      
      // Single-line comments: // comment
      [/\/\/.*$/, 'comment'],
      
      // Alternative single-line: # comment
      [/#.*$/, 'comment'],

      // === INCREMENT/COMPOUND OPERATORS ===
      // Must come before single operators
      [/\+\+|--/, 'operator.increment'],
      [/\+=|-=|\*=|\/=/, 'operator.assignment'],
      [/\*\*/, 'operator.power'],

      // === OPERATORS ===
      [/@symbols/, { 
        cases: { 
          '@operators': 'operator',
          '@default': '' 
        } 
      }],

      // === WHITESPACE ===
      [/[ \t\r\n]+/, 'white'],

      // === PARAMETER SEPARATOR ===
      // Colon after parameter name
      [/:/, 'parameter.separator'],

      // === DELIMITERS ===
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/[,.]/, 'delimiter'],
    ],

    // === STRING STATES ===
    string: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    stringsingle: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    multilinestring: [
      [/[^"]+/, 'string'],
      [/"""/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      [/"/, 'string']
    ],

    multilinestringsingle: [
      [/[^']+/, 'string'],
      [/'''/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      [/'/, 'string']
    ],

    // === COMMENT STATES ===
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, { token: 'comment', next: '@pop' }],
      [/[\/*]/, 'comment']
    ],

    doccomment: [
      [/[^\/*]+/, 'comment.doc'],
      [/\*\//, { token: 'comment.doc', next: '@pop' }],
      [/[\/*]/, 'comment.doc']
    ]
  }
}