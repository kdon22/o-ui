/**
 * Runtime Source Map Generator
 * 
 * Combines Python AST parsing and statement matching to create accurate
 * source maps for debugging on-demand from stored Python code.
 */

import { pythonASTParser, type RuntimeSourceMap } from './ast-source-mapper'
import { statementMatcher, type StatementMapping } from './statement-matcher'

export interface DebugSourceMap {
  mappings: StatementMapping[]
  pythonStatements: number
  businessBlocks: number
  generatedAt: string
  generationTime: number
  codeHash: string
}

export interface DebugContext {
  pythonCode: string
  businessRulesCode: string
  ruleId?: string
  ruleName?: string
}

/**
 * Runtime Source Map Generator
 * 
 * Creates accurate source maps by analyzing actual Python code structure
 * and matching it back to business rule origins.
 */
export class RuntimeSourceMapGenerator {
  
  /**
   * Generate a complete source map from Python code and business rules
   * 
   * @param context - Debug context with Python and business rules code
   * @returns Complete source map for debugging
   */
  async generateSourceMap(context: DebugContext): Promise<DebugSourceMap> {
    const startTime = Date.now()
    
    console.log('🚀 [RuntimeSourceMapGenerator] Starting source map generation:', {
      pythonCodeLength: context.pythonCode.length,
      businessRulesLength: context.businessRulesCode.length,
      ruleId: context.ruleId,
      ruleName: context.ruleName
    })
    
    // Step 1: Parse Python code into AST statements
    const pythonStatements = pythonASTParser.parseCode(context.pythonCode)
    
    // Step 2: Parse business rules into logical blocks
    const businessBlocks = statementMatcher.parseBusinessRules(context.businessRulesCode)
    
    // Step 3: Match Python statements to business rule blocks
    const mappings = statementMatcher.matchStatements(pythonStatements, businessBlocks)
    
    // Step 4: Generate code hash for caching
    const codeHash = this.generateCombinedHash(context.pythonCode, context.businessRulesCode)
    
    const generationTime = Date.now() - startTime
    
    const sourceMap: DebugSourceMap = {
      mappings,
      pythonStatements: pythonStatements.length,
      businessBlocks: businessBlocks.length,
      generatedAt: new Date().toISOString(),
      generationTime,
      codeHash
    }
    
    console.log('✅ [RuntimeSourceMapGenerator] Source map generated successfully:', {
      totalMappings: mappings.length,
      pythonStatements: pythonStatements.length,
      businessBlocks: businessBlocks.length,
      generationTime: `${generationTime}ms`,
      averageConfidence: this.calculateAverageConfidence(mappings),
      highConfidenceMappings: mappings.filter(m => m.confidence > 0.8).length
    })
    
    return sourceMap
  }
  
  /**
   * Generate source map for debugging API
   * 
   * This is the main entry point for the debug API to get accurate line mappings
   */
  async generateForDebugging(
    pythonCode: string,
    businessRulesCode: string,
    options: {
      ruleId?: string
      ruleName?: string
      enableCaching?: boolean
    } = {}
  ): Promise<DebugSourceMap> {
    const context: DebugContext = {
      pythonCode,
      businessRulesCode,
      ruleId: options.ruleId,
      ruleName: options.ruleName
    }
    
    // TODO: Add caching layer if enableCaching is true
    return this.generateSourceMap(context)
  }
  
  /**
   * Get instrumentation points from source map
   * 
   * Returns Python line numbers that should be instrumented for debugging
   */
  getInstrumentationPoints(sourceMap: DebugSourceMap): number[] {
    return sourceMap.mappings
      .filter(mapping => mapping.confidence > 0.5) // Only instrument high-confidence mappings
      .map(mapping => mapping.pythonLine)
      .sort((a, b) => a - b)
  }
  
  /**
   * Get business line for Python line
   * 
   * Given a Python line number, return the corresponding business rule line
   */
  getBusinessLineForPythonLine(sourceMap: DebugSourceMap, pythonLine: number): number | null {
    const mapping = sourceMap.mappings.find(m => m.pythonLine === pythonLine)
    return mapping ? mapping.businessLine : null
  }
  
  /**
   * Get description for Python line
   * 
   * Given a Python line number, return a human-readable description
   */
  getDescriptionForPythonLine(sourceMap: DebugSourceMap, pythonLine: number): string | null {
    const mapping = sourceMap.mappings.find(m => m.pythonLine === pythonLine)
    return mapping ? mapping.description : null
  }
  
  /**
   * Get variables for Python line
   * 
   * Given a Python line number, return the variables involved
   */
  getVariablesForPythonLine(sourceMap: DebugSourceMap, pythonLine: number): string[] {
    const mapping = sourceMap.mappings.find(m => m.pythonLine === pythonLine)
    return mapping ? mapping.variables : []
  }
  
  /**
   * Validate source map quality
   * 
   * Returns metrics about the quality of the generated source map
   */
  validateSourceMap(sourceMap: DebugSourceMap): {
    isValid: boolean
    coverage: number
    averageConfidence: number
    issues: string[]
  } {
    const issues: string[] = []
    
    // Check coverage (percentage of Python statements that have mappings)
    const coverage = sourceMap.mappings.length / sourceMap.pythonStatements
    if (coverage < 0.5) {
      issues.push(`Low coverage: ${Math.round(coverage * 100)}% of Python statements mapped`)
    }
    
    // Check average confidence
    const averageConfidence = this.calculateAverageConfidence(sourceMap.mappings)
    if (averageConfidence < 0.6) {
      issues.push(`Low confidence: ${Math.round(averageConfidence * 100)}% average confidence`)
    }
    
    // Check for gaps in line numbers
    const mappedLines = sourceMap.mappings.map(m => m.pythonLine).sort((a, b) => a - b)
    const gaps = this.findLineGaps(mappedLines)
    if (gaps.length > sourceMap.pythonStatements * 0.3) {
      issues.push(`Many gaps: ${gaps.length} unmapped line ranges`)
    }
    
    const isValid = issues.length === 0
    
    return {
      isValid,
      coverage,
      averageConfidence,
      issues
    }
  }
  
  /**
   * Generate a combined hash of Python and business rules code
   */
  private generateCombinedHash(pythonCode: string, businessRulesCode: string): string {
    const combined = pythonCode + '|' + businessRulesCode
    let hash = 0
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16)
  }
  
  /**
   * Calculate average confidence of mappings
   */
  private calculateAverageConfidence(mappings: StatementMapping[]): number {
    if (mappings.length === 0) return 0
    
    const totalConfidence = mappings.reduce((sum, mapping) => sum + mapping.confidence, 0)
    return totalConfidence / mappings.length
  }
  
  /**
   * Find gaps in mapped line numbers
   */
  private findLineGaps(sortedLines: number[]): number[] {
    const gaps: number[] = []
    
    for (let i = 1; i < sortedLines.length; i++) {
      const gap = sortedLines[i] - sortedLines[i - 1]
      if (gap > 1) {
        // Add all the missing line numbers
        for (let j = sortedLines[i - 1] + 1; j < sortedLines[i]; j++) {
          gaps.push(j)
        }
      }
    }
    
    return gaps
  }
}

/**
 * Singleton instance for reuse
 */
export const runtimeSourceMapGenerator = new RuntimeSourceMapGenerator()
