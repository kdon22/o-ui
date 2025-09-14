// Business Rules Language Patterns
// Regex patterns for complex language constructs

// === REGEX LITERAL PATTERNS ===
export const REGEX_PATTERNS = {
  // Basic regex: /pattern/flags
  basicRegex: /\/[^\/\r\n]*\/[gimuy]*/,
  
  // Named group regex: /(?<name>pattern)/
  namedGroupRegex: /\/.*\(\?\<\w+\>.*\).*\/[gimuy]*/,
  
  // Regex with escapes: /pattern\/with\/slashes/
  escapedRegex: /\/(?:[^\/\\\r\n]|\\.)*\/[gimuy]*/
}

// === NUMBER PATTERNS ===
export const NUMBER_PATTERNS = {
  // Integer: 123, -456
  integer: /^-?\d+$/,
  
  // Float: 12.34, -56.78, 1.23e-4
  float: /^-?\d*\.\d+([eE][\-+]?\d+)?$/,
  
  // Scientific: 1e5, 2.5E-3
  scientific: /^-?\d+\.?\d*[eE][\-+]?\d+$/,
  
  // Hexadecimal: 0x1A, 0xFF
  hexadecimal: /^0[xX][0-9a-fA-F]+$/,
  
  // Octal: 0o17, 0O755
  octal: /^0[oO][0-7]+$/,
  
  // Binary: 0b1010, 0B1111
  binary: /^0[bB][01]+$/
}

// === STRING PATTERNS ===
export const STRING_PATTERNS = {
  // Double quoted: "string content"
  doubleQuoted: /"(?:[^"\\]|\\.)*"/,
  
  // Single quoted: 'string content'  
  singleQuoted: /'(?:[^'\\]|\\.)*'/,
  
  // Multi-line double: """content"""
  multiLineDouble: /"""[\s\S]*?"""/,
  
  // Multi-line single: '''content'''
  multiLineSingle: /'''[\s\S]*?'''/,
  
  // Template literal: `string ${expr}`
  templateLiteral: /`(?:[^`\\$]|\\.|\\$(?!\{)|\$(?!\{))*`/,
  
  // String with interpolation: "Hello ${name}"
  interpolatedString: /"(?:[^"\\$]|\\.|\\$(?!\{)|\$(?!\{))*"/
}

// === IDENTIFIER PATTERNS ===
export const IDENTIFIER_PATTERNS = {
  // Variable names: camelCase, snake_case
  variable: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
  
  // Class names: PascalCase
  className: /^[A-Z][a-zA-Z0-9]*$/,
  
  // Constant names: UPPER_SNAKE_CASE
  constant: /^[A-Z][A-Z0-9_]*$/,
  
  // Method names: camelCase with optional parentheses
  method: /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(?/,
  
  // Property access: object.property, object?.property
  propertyAccess: /\w+(\?)?\.[\w$]+/
}

// === SPECIAL CONSTRUCT PATTERNS ===
export const SPECIAL_PATTERNS = {
  // Class definition: class Name { ... }
  classDefinition: /^\s*class\s+([A-Z][a-zA-Z0-9]*)\s*\{/,
  
  // Enum definition: enum NAME { ... }
  enumDefinition: /^\s*enum\s+([A-Z_][A-Z0-9_]*)\s*\{/,
  
  // Function definition: def functionName(...) -> returnType
  functionDefinition: /^\s*def\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
  
  // If any construct: if any collection as item
  ifAnyConstruct: /^\s*if\s+any\s+(\w+(?:\.\w+)*)\s+as\s+(\w+)/,
  
  // If all construct: if all collection as item  
  ifAllConstruct: /^\s*if\s+all\s+(\w+(?:\.\w+)*)\s+as\s+(\w+)/,
  
  // For loop with 'as': for item in collection as element
  forLoopAs: /^\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s+as\s+(\w+)/,
  
  // Standard for loop: for item in collection
  forLoop: /^\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)/,
  
  // While with maxloop: while condition | maxloop < 5
  whileMaxloop: /^\s*while\s+(.+)\s*\|\s*maxloop\s*<\s*(\d+)/,
  
  // Switch case: switch expression case value
  switchCase: /^\s*switch\s+(.+):\s*$/,
  
  // Parameter with type: name: type
  typedParameter: /(\w+)\s*:\s*(\w+)/,
  
  // Named parameter in function call: functionName(param: value)
  namedParameter: /\b(\w+)\s*:\s*([^,)]+)/
}

// === COMMENT PATTERNS ===
export const COMMENT_PATTERNS = {
  // Single line: // comment
  singleLine: /\/\/.*$/,
  
  // Single line alternative: # comment
  singleLineAlt: /#.*$/,
  
  // Multi-line: /* comment */
  multiLine: /\/\*[\s\S]*?\*\//,
  
  // Documentation: /** comment */
  documentation: /\/\*\*[\s\S]*?\*\//
}