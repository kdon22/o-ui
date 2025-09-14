// 🎯 **BULLETPROOF DEBUG ARCHITECTURE** - Based on VSCode DAP, Chrome DevTools, Node.js patterns
// Clean separation: Parser → AST → Interpreter → Debug Adapter → UI

import { TypeDetectionFactory } from '../../language/type-detection-factory'

// ==========================================
// 1. DOMAIN TYPES (Clean, focused types)
// ==========================================

export type ExecutionState = 
  | { status: 'stopped' }
  | { status: 'running', line: number }
  | { status: 'paused', line: number, variables: Variable[], reason: PauseReason }
  | { status: 'terminated', result?: any }
  | { status: 'error', error: string, line?: number }

export type PauseReason = 'breakpoint' | 'step' | 'entry' | 'exception'

export interface Variable {
  readonly name: string
  readonly value: unknown
  readonly type: string
  readonly scope: 'local' | 'global' | 'builtin'
  readonly isChanged?: boolean
  readonly previousValue?: unknown
}

export interface StackFrame {
  readonly line: number
  readonly functionName?: string
  readonly variables: Variable[]
}

export interface Breakpoint {
  readonly line: number
  readonly enabled: boolean
  readonly condition?: string
}

// ==========================================
// 2. AST NODES (Clean, typed AST)
// ==========================================

export type ASTNode = 
  | AssignmentNode
  | ConditionalNode
  | ExpressionNode
  | FunctionCallNode

export interface BaseASTNode {
  readonly type: string
  readonly line: number
  readonly sourceText: string
}

export interface AssignmentNode extends BaseASTNode {
  readonly type: 'assignment'
  readonly variable: string
  readonly expression: ExpressionNode
}

export interface ConditionalNode extends BaseASTNode {
  readonly type: 'conditional'
  readonly condition: ExpressionNode
  readonly thenBlock?: ASTNode[]
  readonly elseBlock?: ASTNode[]
}

export interface ExpressionNode extends BaseASTNode {
  readonly type: 'expression'
  readonly operator?: string
  readonly operands: (string | number | boolean | ExpressionNode)[]
}

export interface FunctionCallNode extends BaseASTNode {
  readonly type: 'function_call'
  readonly target: string
  readonly method: string
  readonly arguments: ExpressionNode[]
}

// ==========================================
// 3. PARSER (Single Responsibility)
// ==========================================

export class BusinessRulesParser {
  parse(businessRulesText: string): ASTNode[] {
    const lines = businessRulesText.split('\n')
    const ast: ASTNode[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('//') || line.startsWith('#')) continue
      
      const node = this.parseLine(line, i + 1)
      if (node) ast.push(node)
    }
    
    return ast
  }
  
  private parseLine(line: string, lineNumber: number): ASTNode | null {
    // Assignment: variable = expression
    const assignMatch = line.match(/^(\w+(?:\.\w+)*)\s*=\s*(.+)$/)
    if (assignMatch) {
      return {
        type: 'assignment',
        line: lineNumber,
        sourceText: line,
        variable: assignMatch[1],
        expression: this.parseExpression(assignMatch[2], lineNumber)
      }
    }
    
    // Conditional: if condition
    const ifMatch = line.match(/^if\s+(.+)$/)
    if (ifMatch) {
      return {
        type: 'conditional',
        line: lineNumber,
        sourceText: line,
        condition: this.parseExpression(ifMatch[1], lineNumber)
      }
    }
    
    // Default: treat as expression
    return {
      type: 'expression',
      line: lineNumber,
      sourceText: line,
      operands: [line]
    }
  }
  
  private parseExpression(expr: string, line: number): ExpressionNode {
    // Simple expression parsing - can be enhanced
    return {
      type: 'expression',
      line,
      sourceText: expr,
      operands: [expr.trim()]
    }
  }
}

// ==========================================
// 4. INTERPRETER (Pure execution, no UI concerns)
// ==========================================

export class BusinessRulesInterpreter {
  private variables = new Map<string, Variable>()
  private currentNodeIndex = 0
  private typeDetector = TypeDetectionFactory.getInstance()
  
  constructor(private ast: ASTNode[]) {}
  
  // Execute single step and return new state
  executeStep(): ExecutionState {
    if (this.currentNodeIndex >= this.ast.length) {
      return { status: 'terminated' }
    }
    
    const currentNode = this.ast[this.currentNodeIndex]
    
    try {
      this.executeNode(currentNode)
      this.currentNodeIndex++
      
      return {
        status: 'paused',
        line: currentNode.line,
        variables: Array.from(this.variables.values()),
        reason: 'step'
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        line: currentNode.line
      }
    }
  }
  
  private executeNode(node: ASTNode): void {
    switch (node.type) {
      case 'assignment':
        this.executeAssignment(node as AssignmentNode)
        break
      case 'conditional':
        this.executeConditional(node as ConditionalNode)
        break
      // Add other node types as needed
    }
  }
  
  private executeAssignment(node: AssignmentNode): void {
    const value = this.evaluateExpression(node.expression)
    
    // 🎯 **USE EXISTING TYPE DETECTION SYSTEM** - Get proper type from TypeDetectionFactory
    const allText = this.ast.map(n => n.sourceText).join('\n')
    const typeInfo = this.typeDetector.detectVariableType(node.variable, allText)
    
    // Use detected type, but also validate against actual value
    let finalType = typeInfo.type
    if (finalType === 'unknown') {
      // Fallback to intelligent value-based detection
      if (value === null) finalType = 'null'
      else if (value === undefined) finalType = 'undefined'
      else if (Array.isArray(value)) finalType = 'array'
      else if (typeof value === 'object' && value !== null) finalType = 'object'
      else finalType = typeof value
    }
    
    const variable: Variable = {
      name: node.variable,
      value,
      type: finalType,
      scope: 'local',
      isChanged: this.variables.has(node.variable),
      previousValue: this.variables.get(node.variable)?.value
    }
    
    console.log('🎯 [Interpreter] Variable assignment:', {
      name: node.variable,
      value: value,
      detectedType: typeInfo.type,
      finalType: finalType,
      confidence: typeInfo.confidence
    })
    
    this.variables.set(node.variable, variable)
  }
  
  private executeConditional(node: ConditionalNode): void {
    const conditionResult = this.evaluateExpression(node.condition)
    // In a full implementation, this would control execution flow
    console.log(`Condition "${node.sourceText}" evaluated to:`, conditionResult)
  }
  
  private evaluateExpression(expr: ExpressionNode): unknown {
    const operand = expr.operands[0]
    
    if (typeof operand === 'string') {
      const trimmed = operand.trim()
      
      // Check if it's a variable reference
      if (this.variables.has(trimmed)) {
        return this.variables.get(trimmed)!.value
      }
      
      // 🎯 **ENHANCED LITERAL PARSING** - Parse arrays and objects properly
      
      // String literals
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1)
      }
      if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1)
      }
      
      // Boolean literals
      if (trimmed === 'true') return true
      if (trimmed === 'false') return false
      if (trimmed === 'null') return null
      if (trimmed === 'undefined') return undefined
      
      // Number literals
      const numValue = parseFloat(trimmed)
      if (!isNaN(numValue) && isFinite(numValue)) return numValue
      
      // 🚀 **ARRAY PARSING** - Parse [1,2,3] as actual array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed)
        } catch (e) {
          console.warn('⚠️ [Interpreter] Failed to parse array:', trimmed, e)
          return trimmed
        }
      }
      
      // 🚀 **OBJECT PARSING** - Parse {"key": value} as actual object
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          return JSON.parse(trimmed)
        } catch (e) {
          console.warn('⚠️ [Interpreter] Failed to parse object:', trimmed, e)
          return trimmed
        }
      }
      
      return trimmed
    }
    
    return operand
  }
  
  getVariables(): Variable[] {
    return Array.from(this.variables.values())
  }
  
  reset(): void {
    this.variables.clear()
    this.currentNodeIndex = 0
  }
}

// ==========================================
// 5. DEBUG ADAPTER (Protocol-based, stateless)
// ==========================================

export interface DebugAdapter {
  // Configuration
  setBusinessRules(businessRulesText: string): void
  
  // Execution Control
  start(): Promise<ExecutionState>
  step(): Promise<ExecutionState>
  continue(): Promise<ExecutionState>
  pause(): Promise<ExecutionState>
  stop(): Promise<ExecutionState>
  
  // Breakpoint Management
  setBreakpoint(line: number, condition?: string): Promise<void>
  removeBreakpoint(line: number): Promise<void>
  getBreakpoints(): Breakpoint[]
  
  // State Inspection
  getVariables(): Variable[]
  getCallStack(): StackFrame[]
  
  // Events
  onStateChanged(callback: (state: ExecutionState) => void): void
}

export class BusinessRulesDebugAdapter implements DebugAdapter {
  private interpreter: BusinessRulesInterpreter | null = null
  private breakpoints = new Map<number, Breakpoint>()
  private currentState: ExecutionState = { status: 'stopped' }
  private stateChangeListeners: Array<(state: ExecutionState) => void> = []
  private businessRulesText = ''
  
  constructor(private parser: BusinessRulesParser) {}
  
  // Set the business rules text to debug
  setBusinessRules(businessRulesText: string): void {
    this.businessRulesText = businessRulesText
  }
  
  async start(): Promise<ExecutionState> {
    // Parse business rules into AST
    const ast = this.parser.parse(this.businessRulesText)
    
    if (ast.length === 0) {
      const errorState: ExecutionState = {
        status: 'error',
        error: 'No executable statements found in business rules'
      }
      this.updateState(errorState)
      return errorState
    }
    
    this.interpreter = new BusinessRulesInterpreter(ast)
    
    // Initial step to first line
    const state = this.interpreter.executeStep()
    this.updateState(state)
    return state
  }
  
  async step(): Promise<ExecutionState> {
    if (!this.interpreter) {
      throw new Error('Debug session not started')
    }
    
    const state = this.interpreter.executeStep()
    this.updateState(state)
    return state
  }
  
    async continue(): Promise<ExecutionState> {
    if (!this.interpreter) {
      throw new Error('Debug session not started')
    }

    console.log('🔄 [DebugAdapter] Continuing execution, checking breakpoints:', Array.from(this.breakpoints.keys()))

    // Continue until breakpoint or end
    let state = this.interpreter.executeStep()
    
    while (state.status === 'paused' && !this.shouldPauseAtLine(state.line)) {
      console.log('📍 [DebugAdapter] Continuing through line', state.line, '(no breakpoint)')
      state = this.interpreter.executeStep()
    }

    if (state.status === 'paused' && this.shouldPauseAtLine(state.line)) {
      console.log('🔴 [DebugAdapter] Hit breakpoint at line', state.line)
    }
    
    this.updateState(state)
    return state
  }
  
  async pause(): Promise<ExecutionState> {
    // In a real implementation, this would interrupt execution
    return this.currentState
  }
  
  async stop(): Promise<ExecutionState> {
    this.interpreter?.reset()
    this.interpreter = null
    
    const state: ExecutionState = { status: 'stopped' }
    this.updateState(state)
    return state
  }
  
  async setBreakpoint(line: number, condition?: string): Promise<void> {
    this.breakpoints.set(line, { line, enabled: true, condition })
  }
  
  async removeBreakpoint(line: number): Promise<void> {
    this.breakpoints.delete(line)
  }
  
  getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values())
  }
  
  getVariables(): Variable[] {
    return this.interpreter?.getVariables() || []
  }
  
  getCallStack(): StackFrame[] {
    if (this.currentState.status === 'paused') {
      return [{
        line: this.currentState.line,
        variables: this.currentState.variables
      }]
    }
    return []
  }
  
  onStateChanged(callback: (state: ExecutionState) => void): void {
    this.stateChangeListeners.push(callback)
  }
  
  private shouldPauseAtLine(line: number): boolean {
    const breakpoint = this.breakpoints.get(line)
    return breakpoint?.enabled || false
  }
  
  private updateState(state: ExecutionState): void {
    this.currentState = state
    this.stateChangeListeners.forEach(listener => listener(state))
  }
}

// ==========================================
// 6. REACT HOOK (Clean interface to React)
// ==========================================

export interface DebugSession {
  readonly state: ExecutionState
  readonly variables: Variable[]
  readonly breakpoints: Breakpoint[]
  
  // Actions
  readonly start: () => Promise<void>
  readonly step: () => Promise<void>
  readonly continue: () => Promise<void>
  readonly stop: () => Promise<void>
  readonly setBreakpoint: (line: number) => Promise<void>
  readonly removeBreakpoint: (line: number) => Promise<void>
}

// Usage in React:
// const debugSession = useBulletproofDebugSession(businessRulesText)
// debugSession.start() // Clean, predictable API 