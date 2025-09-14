// Pattern Types for Business Rule Translation and Source Mapping

// Core Line Mapping Interface
export interface LineMapping {
  businessLine: number         // Line in Monaco editor (1-based)
  pythonLine: number          // Line in generated Python (1-based)
  pythonColumn?: number       // Column in Python (for precision)
  originalText: string        // Original business rule text
  generatedText: string       // Generated Python text
  patternType?: string        // Type of business rule pattern
  statementId?: string        // Unique identifier for complex statements
}

export interface BusinessRulePattern {
  name: string                // Pattern identifier (e.g., 'find_remark', 'method_call')
  pattern: RegExp             // Regex to match the business rule
  pythonGenerator: PythonPatternGenerator  // Function to generate Python + mappings
  linesGenerated: (context: any) => number // Predictable line count
  importsRequired?: string[]  // Python imports needed
  description: string         // Human-readable description
}

export interface GenerationContext {
  businessLine: number        // Current business rule line number
  pythonStartLine: number     // Starting Python line for this statement
  originalText: string        // Original business rule text
  hasElse?: boolean          // Whether this statement has an else clause
  variables?: Record<string, any> // Available variables in scope
  [key: string]: any         // Additional context data
}

export interface PatternGenerationResult {
  pythonCode: string          // Generated Python code
  mappings: LineMapping[]     // Line mappings for debugging
  imports: string[]          // Required Python imports
  statementId?: string       // Unique identifier for complex statements
}

export type PythonPatternGenerator = (
  match: RegExpMatchArray, 
  context: GenerationContext
) => PatternGenerationResult

// Extended Line Mapping for patterns
export interface PatternLineMapping extends LineMapping {
  patternType: string         // Type of business rule pattern
  statementId?: string        // Unique identifier for complex statements
}

// Context for method calls (extends GenerationContext)
export interface MethodCallContext extends GenerationContext {
  method: {
    name: string
    pythonGenerator?: Function
    pythonCode?: string
    pythonImports?: string[]
  }
  variable: string
  arguments: string[]
}

// Context for conditional statements
export interface ConditionalContext extends GenerationContext {
  condition: string
  thenAction: string
  elseAction?: string
  hasElse: boolean
} 