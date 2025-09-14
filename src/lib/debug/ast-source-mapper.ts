/**
 * Python AST Parser Service for Runtime Source Map Generation
 * 
 * Replaces the broken static block map system with real-time AST parsing
 * of stored Python code to create accurate source maps for debugging.
 */

export interface PythonASTNode {
  type: string
  lineNumber: number
  columnOffset: number
  content: string
  children?: PythonASTNode[]
}

export interface PythonStatement {
  type: 'assignment' | 'condition' | 'loop' | 'function_call' | 'class_def' | 'expression'
  lineNumber: number
  content: string
  variables: string[]
  isInstrumentable: boolean
}

export interface RuntimeSourceMap {
  statements: PythonStatement[]
  totalLines: number
  generatedAt: string
  codeHash: string
}

/**
 * Python AST Parser Service
 * 
 * Parses stored Python code and extracts statement structure for debugging
 */
export class PythonASTParser {
  
  /**
   * Parse Python code and extract statement structure
   * 
   * @param pythonCode - The Python code to parse
   * @returns AST node tree with line numbers and statement types
   */
  parseCode(pythonCode: string): PythonStatement[] {
    console.log('🔍 [PythonASTParser] Parsing Python code:', {
      codeLength: pythonCode.length,
      lineCount: pythonCode.split('\n').length
    })
    
    const statements: PythonStatement[] = []
    const lines = pythonCode.split('\n')
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }
      
      // Skip instrumentation calls
      if (trimmedLine.includes('__BUSINESS_STEP__')) {
        return
      }
      
      const statement = this.parseStatement(trimmedLine, lineNumber, line)
      if (statement) {
        statements.push(statement)
      }
    })
    
    console.log('✅ [PythonASTParser] Parsed statements:', {
      totalStatements: statements.length,
      instrumentableStatements: statements.filter(s => s.isInstrumentable).length
    })
    
    return statements
  }
  
  /**
   * Parse a single Python statement
   */
  private parseStatement(trimmedLine: string, lineNumber: number, originalLine: string): PythonStatement | null {
    // Determine statement type
    const type = this.getStatementType(trimmedLine)
    
    // Extract variables from the statement
    const variables = this.extractVariables(trimmedLine)
    
    // Determine if this statement should be instrumented
    const isInstrumentable = this.shouldInstrument(trimmedLine, type)
    
    return {
      type,
      lineNumber,
      content: trimmedLine,
      variables,
      isInstrumentable
    }
  }
  
  /**
   * Determine the type of a Python statement
   */
  private getStatementType(line: string): PythonStatement['type'] {
    // Class definition
    if (line.startsWith('class ')) {
      return 'class_def'
    }
    
    // Function definition  
    if (line.startsWith('def ')) {
      return 'function_call'
    }
    
    // Control flow
    if (line.startsWith('if ') || line.startsWith('elif ') || line.startsWith('else:')) {
      return 'condition'
    }
    
    if (line.startsWith('for ') || line.startsWith('while ')) {
      return 'loop'
    }
    
    // Assignment (contains = but not == or !=)
    if (line.includes('=') && !line.includes('==') && !line.includes('!=') && !line.includes('<=') && !line.includes('>=')) {
      return 'assignment'
    }
    
    // Function call (contains parentheses)
    if (line.includes('(') && line.includes(')')) {
      return 'function_call'
    }
    
    // Default to expression
    return 'expression'
  }
  
  /**
   * Extract variable names from a Python statement
   */
  private extractVariables(line: string): string[] {
    const variables: string[] = []
    
    // For assignments, extract the left side
    if (line.includes('=') && !line.includes('==')) {
      const assignmentMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*=/)
      if (assignmentMatch) {
        const varName = assignmentMatch[1].split('.')[0] // Get base variable name
        variables.push(varName)
      }
    }
    
    // Extract all identifier-like tokens
    const identifiers = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
    
    // Filter out Python keywords and common built-ins
    const keywords = [
      'if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return', 'import', 'from',
      'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue',
      'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None',
      'print', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'
    ]
    
    identifiers.forEach(identifier => {
      if (!keywords.includes(identifier) && !variables.includes(identifier)) {
        variables.push(identifier)
      }
    })
    
    return variables
  }
  
  /**
   * Determine if a statement should be instrumented for debugging
   */
  private shouldInstrument(line: string, type: PythonStatement['type']): boolean {
    // Don't instrument class/function definitions
    if (type === 'class_def') {
      return false
    }
    
    // Don't instrument control flow keywords alone
    if (line === 'else:' || line === 'pass' || line === 'break' || line === 'continue') {
      return false
    }
    
    // Don't instrument import statements
    if (line.startsWith('import ') || line.startsWith('from ')) {
      return false
    }
    
    // Instrument assignments, function calls, and meaningful expressions
    return type === 'assignment' || type === 'function_call' || 
           (type === 'expression' && line.length > 3)
  }
  
  /**
   * Generate a runtime source map from Python code
   */
  generateSourceMap(pythonCode: string): RuntimeSourceMap {
    const startTime = Date.now()
    
    const statements = this.parseCode(pythonCode)
    const codeHash = this.generateCodeHash(pythonCode)
    
    const sourceMap: RuntimeSourceMap = {
      statements,
      totalLines: pythonCode.split('\n').length,
      generatedAt: new Date().toISOString(),
      codeHash
    }
    
    const generationTime = Date.now() - startTime
    
    console.log('✅ [PythonASTParser] Generated runtime source map:', {
      totalStatements: statements.length,
      instrumentableStatements: statements.filter(s => s.isInstrumentable).length,
      totalLines: sourceMap.totalLines,
      generationTime: `${generationTime}ms`,
      codeHash: codeHash.substring(0, 8)
    })
    
    return sourceMap
  }
  
  /**
   * Generate a hash of the Python code for caching
   */
  private generateCodeHash(code: string): string {
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

/**
 * Singleton instance for reuse
 */
export const pythonASTParser = new PythonASTParser()
