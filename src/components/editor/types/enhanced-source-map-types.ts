/**
 * 🗺️ **ENHANCED SOURCE MAPS** - TypeScript-like precision for business rules debugging
 * 
 * Solves the core architectural problems:
 * 1. Multi-segment mappings (1 business → many Python ranges)
 * 2. Stable statement IDs (no fragile line number dependencies)
 * 3. Branch path tracking (if/else, loop iterations)
 * 4. Scope chain management (variable lifetime tracking)
 * 5. Hash-based validation (prevents stale mappings)
 */

export interface SourceLocation {
  line: number
  startColumn: number
  endColumn: number
  text?: string
}

export interface GeneratedSegment {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  text?: string
  branchId?: string  // "setup" | "loop_start" | "condition" | "then" | "else" | "early_exit"
}

export interface LoopStateInfo {
  iterationType: 'any' | 'all' | 'standard'
  collectionPath: string
  iteratorVariable: string
  breakCondition: 'first_match' | 'all_match' | 'none'
  stateVariables: string[]  // Generated helper variables like "found_match"
}

export interface ScopeInfo {
  level: number
  type: 'global' | 'loop' | 'condition' | 'function'
  statementId: string
  variables: string[]
  parentScope?: number
}

export interface ControlFlowPath {
  condition: string
  next: string  // Next statement ID or "exit"
  pythonLines: number[]
}

export interface ControlFlowInfo {
  entry: string[]  // Entry branch IDs
  paths: ControlFlowPath[]
}

export interface VariableLifetimeInfo {
  scope: 'global' | 'loop' | 'condition' | 'generated'
  statementId: string
  availableIn: string[]  // Statement IDs where this variable is accessible
  type: string
  sourceCollection?: string  // For loop variables
  purpose?: 'loop_control' | 'user_defined'
}

export interface BreakpointExpansion {
  pythonLine: number
  trigger: 'loop_entry' | 'each_iteration' | 'condition_check' | 'assignment'
  condition: 'first_iteration_only' | 'always' | 'on_match'
}

export interface BreakpointStrategyInfo {
  userBreakpoint: SourceLocation
  expandedBreakpoints: BreakpointExpansion[]
}

export interface ErrorBoundaryInfo {
  type: string  // "AttributeError" | "TypeError" | etc.
  pythonLine: number
  businessLocation: SourceLocation
  message: string
  recovery: 'continue_loop' | 'exit_loop' | 'throw'
}

/**
 * 🎯 **ENHANCED SOURCE MAP STATEMENT** - Core mapping unit
 */
export interface EnhancedSourceMapStatement {
  /** Stable statement identifier (never changes) */
  id: string
  
  /** Statement type for semantic understanding */
  type: 'assignment' | 'condition' | 'loop' | 'method_call' | 'control_flow' | 'comment'
  
  /** Original business rule location */
  original: SourceLocation
  
  /** Generated Python segments (1 business → many Python ranges) */
  generated: GeneratedSegment[]
  
  // Complex mapping support
  loopState?: LoopStateInfo
  scopeChain?: ScopeInfo[]
  controlFlow?: ControlFlowInfo
  variableLifetime?: Record<string, VariableLifetimeInfo>
  breakpointStrategy?: BreakpointStrategyInfo
  errorBoundaries?: ErrorBoundaryInfo[]
}

/**
 * 🗺️ **ENHANCED BUSINESS RULE SOURCE MAP** - Complete mapping
 */
export interface EnhancedBusinessRuleSourceMap {
  /** Source map version */
  version: 1
  
  /** Source file references (TypeScript parity) */
  sources: string[]
  
  /** Source file contents (TypeScript parity) */
  sourcesContent: string[]
  
  /** Enhanced statement mappings */
  statements: EnhancedSourceMapStatement[]
  
  /** Global scope chain */
  globalScope: ScopeInfo
  
  /** Variable lifetime tracking */
  variableLifetime: Record<string, VariableLifetimeInfo>
  
  /** Control flow graph */
  controlFlowGraph: Record<string, ControlFlowInfo>
  
  /** Metadata */
  meta: {
    generatedAt: string
    businessLines: number
    pythonLines: number
    pythonCodeHash: string
    generator: string
    complexity: 'simple' | 'medium' | 'complex'
  }
}

/**
 * 🎯 **ENHANCED DEBUG STEP** - Runtime execution step with rich context
 */
export interface EnhancedDebugStep {
  /** Python line number */
  line: number
  
  /** Statement ID (stable reference) */
  statementId: string
  
  /** Branch path being executed */
  branchId?: string
  
  /** Current variables */
  variables: Record<string, any>
  
  /** Breakpoint flag */
  isBreakpoint: boolean
  
  /** Execution context */
  executionContext: {
    iterationNumber?: number
    totalIterations?: number
    scopeLevel: number
    executionPath: string[]
  }
  
  /** Variable changes since last step */
  variableChanges?: {
    added: string[]
    modified: string[]
    removed: string[]
  }
  
  /** Output from this step */
  output?: string
}

/**
 * 🔍 **EXECUTION CONTEXT** - Current execution state
 */
export interface ExecutionContext {
  currentStatementId: string
  currentBranchId?: string
  iterationNumber?: number
  scopeLevel: number
  activeVariables: Record<string, any>
  executionPath: string[]
}

/**
 * 🎯 **BUSINESS LOCATION** - Precise business rule location
 */
export interface BusinessLocation {
  line: number
  column: number
  statementId?: string
  branchId?: string
}

/**
 * 🐍 **PYTHON BREAKPOINT** - Expanded Python breakpoint
 */
export interface PythonBreakpoint {
  line: number
  condition?: string
  trigger: string
  businessLocation: BusinessLocation
}
