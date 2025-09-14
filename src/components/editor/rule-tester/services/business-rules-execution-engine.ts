"use client"

// Business Rules Execution Engine for Step-by-Step Debugging
import type { Variable } from '../types'
// Dynamic import to avoid SSR issues with type detection factory

// Define BusinessRuleStatement locally since it's not exported from types
interface BusinessRuleStatement {
  type: 'assignment' | 'condition' | 'loop' | 'function_call' | 'comment' | 'unknown' | 'expression' | 'empty'
  line: number
  content: string
  variables: {
    defined: Variable[]
    referenced: string[]
  }
  raw: string
  parsed?: any
}

export interface ExecutionStep {
  line: number
  statement: string
  type: BusinessRuleStatement['type']
  variables: Variable[]
  result?: any
  shouldBreak?: boolean
}

export interface ExecutionContext {
  variables: Map<string, Variable>
  currentLine: number
  isRunning: boolean
  isPaused: boolean
  breakpoints: Set<number>
  utr?: any // UTR data for business rules
  ruleType?: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' // Rule type to determine UTR availability
}

export class BusinessRulesExecutionEngine {
  private context: ExecutionContext
  private parsedStatements: BusinessRuleStatement[] = []
  private businessRulesCode: string = ''
    private typeDetector: any = null // Will be loaded dynamically
  
  constructor() {
    // Load type detector on client-side only
    if (typeof window !== 'undefined') {
      this.loadTypeDetector()
    }
    this.context = {
      variables: new Map(),
      currentLine: 0,
      isRunning: false,
      isPaused: false,
      breakpoints: new Set(),
      utr: undefined,
      ruleType: undefined
    }
  }

  private async loadTypeDetector() {
    try {
      const { unifiedTypeDetectionFactory } = await import('../../language/type-detection-factory')
      this.typeDetector = unifiedTypeDetectionFactory
    } catch (error) {
      
    }
  }

  // Initialize the engine with business rules code, UTR data, and rule type
  initialize(businessRulesCode: string, utrData?: any, ruleType: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' = 'BUSINESS'): void {
    console.log('🔧 [ExecutionEngine] Initializing with business rules:', {
      codeLength: businessRulesCode.length,
      codePreview: businessRulesCode.slice(0, 200),
      codeLines: businessRulesCode.split('\n').length,
      ruleType: ruleType,
      hasUTR: !!utrData
    })
    
    this.businessRulesCode = businessRulesCode
    this.parsedStatements = this.parseBusinessRules(businessRulesCode)
    this.context.utr = utrData
    this.context.ruleType = ruleType
    this.resetContext()
    
    
    
    
    // 🎯 Add UTR as built-in variable for BUSINESS rules only
    if (ruleType === 'BUSINESS' && utrData) {
      this.setVariable('utr', utrData, 'object')
      console.log('✅ [ExecutionEngine] UTR object made available to business rule:', {
        passengerCount: utrData?.passengers?.length || 0,
        segmentCount: utrData?.segments?.length || 0,
        recordLocator: utrData?.pnrHeader?.recordLocator || 'N/A'
      })
    }
  }

  // Parse business rules into executable statements
  private parseBusinessRules(code: string): BusinessRuleStatement[] {
    const lines = code.split('\n')
    const statements: BusinessRuleStatement[] = []

    console.log('🔍 [ExecutionEngine] Parsing business rules:', {
      totalLines: lines.length,
      nonEmptyLines: lines.filter(l => l.trim()).length
    })

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      const lineNumber = index + 1

      // Skip empty lines and comments, but don't add them as statements
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        if (trimmed) {
          
          statements.push({
            type: trimmed.startsWith('//') || trimmed.startsWith('#') ? 'comment' : 'empty',
            line: lineNumber,
            content: trimmed,
            variables: { defined: [], referenced: [] },
            raw: line
          })
        }
        return
      }

      // Determine statement type and extract variables
      let type: BusinessRuleStatement['type'] = 'expression'
      const variables = this.extractVariables(trimmed)

      if (trimmed.startsWith('if ') || trimmed.includes(' if ')) {
        type = 'condition'
      } else if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('!=') && !trimmed.includes('<=') && !trimmed.includes('>=')) {
        type = 'assignment'
      }

      console.log(`🔍 [ExecutionEngine] Line ${lineNumber}: ${type} - "${trimmed}"`, {
        hasEquals: trimmed.includes('='),
        hasDoubleEquals: trimmed.includes('=='),
        startsWithIf: trimmed.startsWith('if '),
        isAssignment: trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('!=') && !trimmed.includes('<=') && !trimmed.includes('>=')
      })
      
      statements.push({
        type,
        line: lineNumber,
        content: trimmed,
        variables,
        raw: line
      })
    })

    const executableStatements = statements.filter(s => s.type !== 'comment' && s.type !== 'empty')
    console.log('🔍 [ExecutionEngine] Parse result:', {
      totalStatements: statements.length,
      executableStatements: executableStatements.length,
      statementTypes: statements.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })

    return statements
  }

  // Extract variables from a statement (parsing phase - don't evaluate yet)
  private extractVariables(statement: string): { defined: Variable[], referenced: string[] } {
    const defined: Variable[] = []
    const referenced: string[] = []

    // Handle assignments (variable = value) - just identify, don't evaluate yet  
    // More flexible regex that handles various spacing around =
    const assignmentMatch = statement.match(/(\w+(?:\.\w+)*)\s*=\s*(.+)/)
    if (assignmentMatch) {
      const varName = assignmentMatch[1]
      const expression = assignmentMatch[2].trim()
      
      // During parsing, just record that this variable will be defined
      // Don't evaluate the expression yet - wait for execution
      defined.push({
        name: varName,
        value: undefined, // Will be set during execution
        type: 'unknown',  // Will be inferred during execution
        scope: 'local'
      })
    }

    // Extract referenced variables (simple regex)
    const varMatches = statement.match(/\b([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\b/g)
    if (varMatches) {
      varMatches.forEach(match => {
        if (!['if', 'and', 'or', 'true', 'false', 'null'].includes(match.toLowerCase())) {
          referenced.push(match)
        }
      })
    }

    return { defined, referenced }
  }

  // Enhanced expression evaluation for business rules
  private evaluateExpression(expr: string): any {
    const trimmed = expr.trim()
    
    
    
    // Empty string literals (handle both "" and '')
    if (trimmed === '""' || trimmed === "''") {
      return ''
    }
    
    // String literals
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1)
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1)
    }
    
    // Numbers
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed)
    }
    if (/^\d*\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed)
    }
    
    // Booleans
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    if (trimmed === 'null') return null
    
    // 🚀 **ARRAY PARSING** - Parse [1,2,3] as actual array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        
        return parsed
      } catch (e) {
        
        return trimmed
      }
    }
    
    // 🚀 **OBJECT PARSING** - Parse {"key": value} as actual object
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        
        return parsed
      } catch (e) {
        
        return trimmed
      }
    }
    
    // Method calls like air.contains("thanks") or air.toBase64
    if (trimmed.includes('.') && (trimmed.includes('(') || !trimmed.includes(' '))) {
      return this.evaluateMethodCall(trimmed)
    }
    
    // Variable reference
    if (this.context.variables.has(trimmed)) {
      const varValue = this.context.variables.get(trimmed)?.value
      
      return varValue
    }
    
    // Comparison operators
    if (trimmed.includes(' > ')) {
      const [left, right] = trimmed.split(' > ')
      return this.evaluateExpression(left) > this.evaluateExpression(right)
    }
    if (trimmed.includes(' < ')) {
      const [left, right] = trimmed.split(' < ')
      return this.evaluateExpression(left) < this.evaluateExpression(right)
    }
    if (trimmed.includes(' == ')) {
      const [left, right] = trimmed.split(' == ')
      return this.evaluateExpression(left) === this.evaluateExpression(right)
    }
    
    
    return trimmed
  }

  // Handle method calls like air.contains("thanks") or air.toBase64
  private evaluateMethodCall(expr: string): any {
    
    
    // Parse method call: variable.method(args)
    const methodMatch = expr.match(/^(\w+)\.(\w+)(?:\(([^)]*)\))?$/)
    if (methodMatch) {
      const [, variableName, methodName, argsStr] = methodMatch
      const variable = this.context.variables.get(variableName)
      
      if (!variable) {
        
        return false
      }
      
      const value = variable.value
      
      
      // Handle different method types
      switch (methodName) {
        case 'contains':
          if (typeof value === 'string' && argsStr) {
            const arg = this.evaluateExpression(argsStr)
            const result = value.includes(String(arg))
            
            return result
          }
          return false
          
        case 'toBase64':
          if (typeof value === 'string') {
            try {
              const result = btoa(value) // Base64 encode
              
              return result
            } catch (e) {
              
              return value
            }
          }
          return value
          
        default:
          
          return value
      }
    }
    
    // If not a method call, treat as regular expression
    return this.evaluateExpression(expr)
  }

  // Infer variable type
  private inferType(value: any): string {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (value === null) return 'null'
    if (typeof value === 'object') return 'object'
    return 'unknown'
  }

  // Reset execution context
  resetContext(): void {
    const preservedUTR = this.context.utr
    const preservedRuleType = this.context.ruleType
    
    this.context = {
      variables: new Map(),
      currentLine: 0,
      isRunning: false,
      isPaused: false,
      breakpoints: this.context.breakpoints, // Preserve breakpoints
      utr: preservedUTR, // Preserve UTR data
      ruleType: preservedRuleType // Preserve rule type
    }

    // Re-add UTR as built-in variable for BUSINESS rules only
    if (preservedRuleType === 'BUSINESS' && preservedUTR) {
      this.setVariable('utr', preservedUTR, 'object')
      
    } else {
      console.log('🔄 [ExecutionEngine] Context reset - no UTR variables (rule type:', preservedRuleType, ')')
    }
  }

  // Set or update a variable
  setVariable(name: string, value: any, type?: string): void {
    // 🎯 **USE EXISTING TYPE DETECTION SYSTEM** - Get proper type from TypeDetectionFactory (if available)
    let finalType = type
    if (!finalType && this.typeDetector) {
      const typeInfo = this.typeDetector.detectVariableType(name, this.businessRulesCode)
      finalType = String(typeInfo.type).split('.')[0] || 'unknown' // Convert UnifiedType to simple string
    }
    
    if (!finalType) {
      finalType = 'unknown'
      
      if (finalType === 'unknown') {
        // Fallback to intelligent value-based detection
        if (value === null) finalType = 'null'
        else if (value === undefined) finalType = 'undefined'
        else if (Array.isArray(value)) finalType = 'array'
        else if (typeof value === 'object' && value !== null) finalType = 'object'
        else finalType = typeof value
      }
    }

    const variable: Variable = {
      name,
      value,
      type: finalType,
      scope: 'local'
    }

    // Track changes
    if (this.context.variables.has(name)) {
      const existing = this.context.variables.get(name)!
      if (existing.value !== value) {
        variable.changed = true
        variable.previousValue = existing.value
      }
    }

    console.log('🎯 [ExecutionEngine] Variable set:', {
      name: name,
      value: value,
      type: finalType,
      valueType: typeof value,
      isArray: Array.isArray(value),
      isObject: typeof value === 'object' && value !== null && !Array.isArray(value)
    })

    this.context.variables.set(name, variable)
  }

  // Get current variables as array
  getCurrentVariables(): Variable[] {
    return Array.from(this.context.variables.values())
  }

  // Get current execution state
  getCurrentState() {
    const executableStatements = this.parsedStatements.filter(s => s.type !== 'comment' && s.type !== 'empty')
    const state = {
      line: this.context.currentLine,
      isRunning: this.context.isRunning,
      isPaused: this.context.isPaused,
      variables: this.getCurrentVariables(),
      canStep: this.context.isPaused && this.context.isRunning && this.context.currentLine > 0,
      canContinue: this.context.isPaused && this.context.isRunning,
      totalLines: this.parsedStatements.length,
      executableLines: executableStatements.length
    }
    
    // console.log('📊 [ExecutionEngine] Current state:', state) // Commented to reduce log spam
    return state
  }

  // Set breakpoints
  setBreakpoints(breakpoints: Set<number>): void {
    this.context.breakpoints = new Set(breakpoints)
  }

  // Start execution
  start(): ExecutionStep | null {
    this.resetContext()
    
    console.log('🔍 [ExecutionEngine] Checking parsed statements for execution:', {
      totalStatements: this.parsedStatements.length,
      statements: this.parsedStatements.map((stmt, i) => ({
        line: i + 1,
        type: stmt.type,
        content: stmt.content?.slice(0, 50)
      }))
    })
    
    // Find first executable line
    const firstExecutableIndex = this.parsedStatements.findIndex(stmt => 
      stmt.type !== 'comment' && stmt.type !== 'empty'
    )
    
    const firstExecutableLine = firstExecutableIndex + 1

    console.log('🔍 [ExecutionEngine] First executable search:', {
      firstExecutableIndex,
      firstExecutableLine,
      executableStatements: this.parsedStatements.filter(stmt => 
        stmt.type !== 'comment' && stmt.type !== 'empty'
      ).length
    })

    if (firstExecutableLine === 0) {
      
      console.log('⚠️ [ExecutionEngine] All statement types:', 
        this.parsedStatements.map(s => s.type)
      )
      return null
    }

    this.context.isRunning = true
    this.context.isPaused = true
    this.context.currentLine = firstExecutableLine

    
    
    const currentStep = this.getCurrentStep()
    
    
    return currentStep
  }

  // Execute next step
  stepNext(): ExecutionStep | null {
    if (!this.context.isRunning || !this.context.isPaused) {
      return null
    }

    const currentStatement = this.parsedStatements[this.context.currentLine - 1]
    if (!currentStatement) {
      this.stop()
      return null
    }

    

    // Execute the statement
    this.executeStatement(currentStatement)

    // Move to next line
    this.context.currentLine++

    // Check if we should stop (end of program or breakpoint)
    if (this.context.currentLine > this.parsedStatements.length) {
      this.stop()
      return null
    }

    // Check for breakpoint
    if (this.context.breakpoints.has(this.context.currentLine)) {
      this.context.isPaused = true
      
    }

    return this.getCurrentStep()
  }

  // Continue execution until next breakpoint
  continue(): ExecutionStep | null {
    if (!this.context.isRunning || !this.context.isPaused) {
      return null
    }

    
    
    while (this.context.currentLine <= this.parsedStatements.length) {
      const step = this.stepNext()
      
      if (!step) {
        break // End of execution
      }
      
      if (this.context.breakpoints.has(this.context.currentLine)) {
        break // Hit breakpoint
      }
    }

    return this.getCurrentStep()
  }

  // Stop execution
  stop(): void {
    this.context.isRunning = false
    this.context.isPaused = false
    this.context.currentLine = 0
    
  }

  // Execute a single statement
  private executeStatement(statement: BusinessRuleStatement): void {
    try {
      // Handle different statement types
      switch (statement.type) {
        case 'assignment':
          this.executeAssignment(statement)
          break
        case 'condition':
          this.executeCondition(statement)
          break
        case 'expression':
          this.executeExpression(statement)
          break
        default:
          // Skip comments and empty lines
          break
      }
    } catch (error) {
      
    }
  }

  // Execute assignment statement
  private executeAssignment(statement: BusinessRuleStatement): void {
    
    
    const assignmentMatch = statement.content.match(/(\w+(?:\.\w+)*)\s*=\s*(.+)/)
    if (assignmentMatch) {
      const varName = assignmentMatch[1]
      const expression = assignmentMatch[2]
      
      
      
      const value = this.evaluateExpression(expression)
      
      this.setVariable(varName, value)
      console.log('✅ [ExecutionEngine] Set', varName, '=', value, '(type:', typeof value, ')')
    } else {
      
    }
  }

  // Execute condition statement
  private executeCondition(statement: BusinessRuleStatement): void {
    const condition = statement.content.replace(/^if\s+/, '')
    const result = this.evaluateExpression(condition)
    
    
    
    // Store the condition result for potential use by subsequent statements
    // In a real implementation, this would control the execution flow
    // For now, we just log whether the condition would execute its block
    if (result) {
      
    } else {
      
    }
    
    // Note: In a full implementation, we would need to track code blocks and
    // conditionally execute the statements inside the if block based on this result
  }

  // Execute expression statement
  private executeExpression(statement: BusinessRuleStatement): void {
    
  }

  // Get current step information
  private getCurrentStep(): ExecutionStep | null {
    const statement = this.parsedStatements[this.context.currentLine - 1]
    if (!statement) return null

    return {
      line: this.context.currentLine,
      statement: statement.content,
      type: statement.type,
      variables: this.getCurrentVariables(),
      shouldBreak: this.context.breakpoints.has(this.context.currentLine)
    }
  }
}