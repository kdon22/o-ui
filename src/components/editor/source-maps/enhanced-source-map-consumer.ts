/**
 * 🗺️ **ENHANCED SOURCE MAP CONSUMER** - Single source of truth for all mappings
 * 
 * Replaces all offset calculation hell with a single, authoritative consumer.
 * No more heuristics, no more magic numbers, no more fragile mappings.
 * 
 * Key Features:
 * - Stateful execution context tracking
 * - Smart breakpoint expansion
 * - Precise bidirectional mapping
 * - Hash-based validation
 * - Professional TypeScript-like experience
 */

import type {
  EnhancedBusinessRuleSourceMap,
  EnhancedSourceMapStatement,
  EnhancedDebugStep,
  ExecutionContext,
  BusinessLocation,
  PythonBreakpoint,
  BreakpointExpansion
} from '../types/enhanced-source-map-types'

export interface SourceMapLookupResult {
  statementId: string
  businessLocation: BusinessLocation
  branchId?: string
  confidence: number
  executionContext?: ExecutionContext
}

export interface BreakpointExpansionResult {
  pythonBreakpoints: PythonBreakpoint[]
  strategy: string
  expandedCount: number
}

/**
 * 🎯 **ENHANCED SOURCE MAP CONSUMER** - Professional debugging precision
 */
export class EnhancedSourceMapConsumer {
  private sourceMap: EnhancedBusinessRuleSourceMap
  private executionState: ExecutionContext | null = null
  private statementIndex: Map<string, EnhancedSourceMapStatement> = new Map()
  private pythonToBusinessIndex: Map<number, SourceMapLookupResult[]> = new Map()
  private businessToPythonIndex: Map<string, number[]> = new Map()

  constructor(sourceMap: EnhancedBusinessRuleSourceMap) {
    this.sourceMap = sourceMap
    this.buildIndexes()
    console.log('🗺️ [EnhancedSourceMapConsumer] Initialized with enhanced source map:', {
      version: sourceMap.version,
      statements: sourceMap.statements.length,
      complexity: sourceMap.meta.complexity,
      pythonCodeHash: sourceMap.meta.pythonCodeHash
    })
  }

  /**
   * 🔧 **BUILD INDEXES** - Pre-compute lookup tables for O(1) performance
   */
  private buildIndexes(): void {
    console.log('🔧 [EnhancedSourceMapConsumer] Building lookup indexes...')

    // Build statement index
    for (const statement of this.sourceMap.statements) {
      this.statementIndex.set(statement.id, statement)
    }

    // Build Python → Business index
    for (const statement of this.sourceMap.statements) {
      for (const segment of statement.generated) {
        for (let line = segment.startLine; line <= segment.endLine; line++) {
          const existing = this.pythonToBusinessIndex.get(line) || []
          existing.push({
            statementId: statement.id,
            businessLocation: {
              line: statement.original.line,
              column: statement.original.startColumn,
              statementId: statement.id,
              branchId: segment.branchId
            },
            branchId: segment.branchId,
            confidence: 1.0
          })
          this.pythonToBusinessIndex.set(line, existing)
        }
      }
    }

    // Build Business → Python index
    for (const statement of this.sourceMap.statements) {
      const businessKey = `${statement.original.line}:${statement.original.startColumn}`
      const pythonLines: number[] = []
      
      for (const segment of statement.generated) {
        for (let line = segment.startLine; line <= segment.endLine; line++) {
          pythonLines.push(line)
        }
      }
      
      this.businessToPythonIndex.set(businessKey, pythonLines)
    }

    console.log('✅ [EnhancedSourceMapConsumer] Indexes built:', {
      statements: this.statementIndex.size,
      pythonMappings: this.pythonToBusinessIndex.size,
      businessMappings: this.businessToPythonIndex.size
    })
  }

  /**
   * 🎯 **ORIGINAL POSITION FOR** - Python line → Business location (TypeScript parity)
   */
  originalPositionFor(pythonLocation: { line: number; column?: number }): BusinessLocation | null {
    const results = this.pythonToBusinessIndex.get(pythonLocation.line)
    if (!results || results.length === 0) {
      console.log(`⚠️ [EnhancedSourceMapConsumer] No mapping found for Python line ${pythonLocation.line}`)
      return null
    }

    // If we have execution context, prefer the matching branch
    if (this.executionState && results.length > 1) {
      const contextMatch = results.find(r => r.branchId === this.executionState?.currentBranchId)
      if (contextMatch) {
        console.log(`🎯 [EnhancedSourceMapConsumer] Context match for line ${pythonLocation.line}:`, contextMatch)
        return contextMatch.businessLocation
      }
    }

    // Return the highest confidence result
    const best = results.reduce((prev, curr) => 
      curr.confidence > prev.confidence ? curr : prev
    )

    console.log(`🗺️ [EnhancedSourceMapConsumer] Mapped Python line ${pythonLocation.line} → Business line ${best.businessLocation.line}`)
    return best.businessLocation
  }

  /**
   * 🎯 **GENERATED POSITION FOR** - Business location → Python lines (TypeScript parity)
   */
  generatedPositionFor(businessLocation: BusinessLocation): number[] {
    const businessKey = `${businessLocation.line}:${businessLocation.column}`
    const pythonLines = this.businessToPythonIndex.get(businessKey)
    
    if (!pythonLines || pythonLines.length === 0) {
      console.log(`⚠️ [EnhancedSourceMapConsumer] No mapping found for business location ${businessKey}`)
      return []
    }

    console.log(`🗺️ [EnhancedSourceMapConsumer] Mapped business location ${businessKey} → Python lines [${pythonLines.join(', ')}]`)
    return pythonLines
  }

  /**
   * 🎯 **EXPAND BREAKPOINTS** - Smart breakpoint expansion for complex statements
   */
  expandBreakpointsForBusinessLine(businessLine: number): BreakpointExpansionResult {
    console.log(`🔴 [EnhancedSourceMapConsumer] Expanding breakpoints for business line ${businessLine}`)

    const statement = this.findStatementByBusinessLine(businessLine)
    if (!statement) {
      console.log(`⚠️ [EnhancedSourceMapConsumer] No statement found for business line ${businessLine}`)
      return {
        pythonBreakpoints: [],
        strategy: 'none',
        expandedCount: 0
      }
    }

    const pythonBreakpoints: PythonBreakpoint[] = []
    let strategy = 'simple'

    // Use predefined breakpoint strategy if available
    if (statement.breakpointStrategy) {
      strategy = 'predefined'
      for (const expansion of statement.breakpointStrategy.expandedBreakpoints) {
        pythonBreakpoints.push({
          line: expansion.pythonLine,
          condition: expansion.condition,
          trigger: expansion.trigger,
          businessLocation: {
            line: businessLine,
            column: statement.original.startColumn,
            statementId: statement.id
          }
        })
      }
    } else {
      // Default expansion strategy based on statement type
      strategy = this.getDefaultExpansionStrategy(statement)
      
      for (const segment of statement.generated) {
        for (let line = segment.startLine; line <= segment.endLine; line++) {
          pythonBreakpoints.push({
            line,
            trigger: segment.branchId || 'default',
            businessLocation: {
              line: businessLine,
              column: statement.original.startColumn,
              statementId: statement.id,
              branchId: segment.branchId
            }
          })
        }
      }
    }

    console.log(`✅ [EnhancedSourceMapConsumer] Expanded ${pythonBreakpoints.length} breakpoints using ${strategy} strategy`)
    return {
      pythonBreakpoints,
      strategy,
      expandedCount: pythonBreakpoints.length
    }
  }

  /**
   * 🔧 **GET DEFAULT EXPANSION STRATEGY** - Determine expansion strategy by statement type
   */
  private getDefaultExpansionStrategy(statement: EnhancedSourceMapStatement): string {
    switch (statement.type) {
      case 'control_flow':
        return statement.loopState ? 'loop_aware' : 'condition_aware'
      case 'condition':
        return 'branch_aware'
      case 'assignment':
        return 'simple'
      case 'method_call':
        return 'call_aware'
      default:
        return 'simple'
    }
  }

  /**
   * 🔍 **FIND STATEMENT BY BUSINESS LINE** - Locate statement containing business line
   */
  private findStatementByBusinessLine(businessLine: number): EnhancedSourceMapStatement | null {
    for (const statement of this.sourceMap.statements) {
      if (statement.original.line === businessLine) {
        return statement
      }
    }
    return null
  }

  /**
   * 🎯 **UPDATE EXECUTION STATE** - Track current execution context
   */
  updateExecutionState(debugStep: EnhancedDebugStep): void {
    this.executionState = {
      currentStatementId: debugStep.statementId,
      currentBranchId: debugStep.branchId,
      iterationNumber: debugStep.executionContext.iterationNumber,
      scopeLevel: debugStep.executionContext.scopeLevel,
      activeVariables: debugStep.variables,
      executionPath: debugStep.executionContext.executionPath
    }

    console.log('🎯 [EnhancedSourceMapConsumer] Updated execution state:', {
      statementId: this.executionState.currentStatementId,
      branchId: this.executionState.currentBranchId,
      scopeLevel: this.executionState.scopeLevel
    })
  }

  /**
   * 🔍 **GET STATEMENT BY ID** - Retrieve statement by stable ID
   */
  getStatementById(statementId: string): EnhancedSourceMapStatement | null {
    return this.statementIndex.get(statementId) || null
  }

  /**
   * 🎯 **GET AVAILABLE VARIABLES** - Get variables available at current execution point
   */
  getAvailableVariables(statementId: string): Record<string, any> {
    const statement = this.getStatementById(statementId)
    if (!statement || !this.executionState) {
      return {}
    }

    const availableVars: Record<string, any> = {}

    // Add global variables
    for (const [varName, varInfo] of Object.entries(this.sourceMap.variableLifetime)) {
      if (varInfo.scope === 'global' || varInfo.availableIn.includes(statementId)) {
        if (this.executionState.activeVariables[varName] !== undefined) {
          availableVars[varName] = this.executionState.activeVariables[varName]
        }
      }
    }

    return availableVars
  }

  /**
   * 🔍 **VALIDATE HASH** - Verify source map is current
   */
  validateHash(currentPythonCodeHash: string): boolean {
    const isValid = this.sourceMap.meta.pythonCodeHash === currentPythonCodeHash
    
    if (!isValid) {
      console.warn('⚠️ [EnhancedSourceMapConsumer] Hash mismatch detected:', {
        expected: this.sourceMap.meta.pythonCodeHash,
        actual: currentPythonCodeHash
      })
    }

    return isValid
  }

  /**
   * 📊 **GET STATISTICS** - Debug information about the source map
   */
  getStatistics() {
    return {
      version: this.sourceMap.version,
      statements: this.sourceMap.statements.length,
      complexity: this.sourceMap.meta.complexity,
      businessLines: this.sourceMap.meta.businessLines,
      pythonLines: this.sourceMap.meta.pythonLines,
      mappingRatio: this.sourceMap.meta.pythonLines / this.sourceMap.meta.businessLines,
      indexSizes: {
        statements: this.statementIndex.size,
        pythonMappings: this.pythonToBusinessIndex.size,
        businessMappings: this.businessToPythonIndex.size
      }
    }
  }
}
