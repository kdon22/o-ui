// Business Rules Language Operators and Symbols
// Complete operator set from syntax guide

export const ARITHMETIC_OPERATORS = [
  '+', '-', '*', '/', '%',  // Basic arithmetic
  '**',                     // Exponentiation
]

export const ASSIGNMENT_OPERATORS = [
  '=',                      // Basic assignment/equality
  '+=', '-=', '*=', '/=',   // Compound assignment
]

export const INCREMENT_OPERATORS = [
  '++', '--',               // Increment/decrement (pre and post)
]

export const LOGICAL_OPERATORS = [
  'and', 'or', 'not',       // Logical operators (already in keywords)
  '|',                      // Pipe (alternative OR)
  '&&', '||', '!',          // Alternative logical operators
]

export const COMPARISON_OPERATORS = [
  '==', '!=',               // Equality
  '>', '<', '>=', '<=',     // Relational
  '===', '!==',             // Strict equality
]

export const PUNCTUATION = [
  '{', '}',                 // Braces for blocks
  '[', ']',                 // Brackets for arrays
  '(', ')',                 // Parentheses for function calls
  ',',                      // Comma separator
  ';',                      // Statement separator
  ':',                      // Colon for labels, types, dictionaries
  '.',                      // Dot for property access
  '?',                      // Optional chaining, ternary
  '->',                     // Arrow for return types, lambdas
]

export const STRING_DELIMITERS = [
  '"',                      // Double quotes (preferred)
  "'",                      // Single quotes
  '"""',                    // Multi-line strings (triple quotes)
  "'''",                    // Multi-line strings (single quotes)
]

export const SPECIAL_SYMBOLS = [
  '#',                      // Comments (alternative to //)
  '//',                     // Line comments
  '/*', '*/',               // Block comments
  '@',                      // Decorators/annotations
  '\\',                     // Line continuation
]

// Combined symbols regex pattern for Monaco tokenizer
export const SYMBOL_PATTERN = /[=><!~?:&|+\-*\/\^%\.#@\\]+/

// All operators combined for easy reference
export const ALL_OPERATORS = [
  ...ARITHMETIC_OPERATORS,
  ...ASSIGNMENT_OPERATORS,
  ...INCREMENT_OPERATORS,
  ...LOGICAL_OPERATORS,
  ...COMPARISON_OPERATORS,
  ...PUNCTUATION,
  ...SPECIAL_SYMBOLS
]