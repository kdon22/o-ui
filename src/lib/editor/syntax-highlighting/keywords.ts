// Business Rules Language Keywords
// Complete set from syntax guide supporting ALL constructs

export const KEYWORDS = [
  // === CONTROL FLOW ===
  'if', 'else', 'elseif', 'elif',
  'while', 'for',
  'switch', 'case', 'default',
  'try', 'catch', 'finally',
  'return', 'break', 'continue',

  // === SPECIAL CONSTRUCTS ===
  'any', 'all',  // if any collection, if all collection
  'in',          // iteration and membership
  'where',       // filtering conditions
  'findFirst',   // find first matching item
  'has',         // condition checking (if any X has Y)
  'set',         // business-friendly assignment

  // === DECLARATIONS ===
  'class', 'enum', 'def', 'function',
  'var', 'let',

  // === DATA TYPES ===
  'string', 'number', 'boolean', 'array', 'object',
  'true', 'false', 'null', 'undefined',

  // === LOGICAL OPERATORS ===
  'and', 'or', 'not',

  // === BUSINESS RULE SPECIFIC ===
  'rule', 'priority', 'effective_date', 'expires_date', 'author',
  'assert', 'validate',
  'maxloop',  // while loop with max iterations

  // === IMPORTS ===
  'import', 'from', 'export'
]

export const BUILT_IN_FUNCTIONS = [
  // === CORE FUNCTIONS ===
  'log', 'print', 'debug',
  
  // === TYPE CONVERSION ===
  'toString', 'toNumber', 'toBoolean',
  'parseInt', 'parseFloat',
  
  // === COLLECTION FUNCTIONS ===
  'count', 'length', 'size',
  'first', 'last', 'isEmpty',
  
  // === UTILITY FUNCTIONS ===
  'helper', 'utility'
]

export const COMPARISON_OPERATORS = [
  // === EQUALITY ===
  '=',   // Assignment or equality (context-dependent)
  
  // === RELATIONAL ===
  '>', '<', '>=', '<=',
  
  // === STRING OPERATIONS ===
  // (string operations are schema-driven, not hardcoded)
]