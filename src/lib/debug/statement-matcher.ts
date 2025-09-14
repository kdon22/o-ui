/**
 * Business Rule to Python Statement Matcher
 * 
 * Maps Python AST statements back to their business rule origins
 * using pattern matching and content analysis.
 */

import type { PythonStatement } from './ast-source-mapper'

export interface BusinessRuleBlock {
  businessLine: number
  content: string
  type: 'assignment' | 'condition' | 'loop' | 'action' | 'class_def'
  variables: string[]
}

export interface StatementMapping {
  pythonLine: number
  businessLine: number
  confidence: number
  description: string
  variables: string[]
}

/**
 * Statement Matcher Service
 * 
 * Matches Python AST nodes back to business rule origins using pattern matching
 */
export class StatementMatcher {
  
  /**
   * Parse business rules into logical blocks
   */
  parseBusinessRules(businessRulesCode: string): BusinessRuleBlock[] {
    console.log('🔍 [StatementMatcher] Parsing business rules:', {
      codeLength: businessRulesCode.length,
      lineCount: businessRulesCode.split('\n').length
    })
    
    const blocks: BusinessRuleBlock[] = []
    const lines = businessRulesCode.split('\n')
    
    lines.forEach((line, index) => {
      const businessLine = index + 1
      const trimmedLine = line.trim()
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        return
      }
      
      const block = this.parseBusinessRuleBlock(trimmedLine, businessLine)
      if (block) {
        blocks.push(block)
      }
    })
    
    console.log('✅ [StatementMatcher] Parsed business rule blocks:', {
      totalBlocks: blocks.length,
      blockTypes: this.getBlockTypeCounts(blocks)
    })
    
    return blocks
  }
  
  /**
   * Parse a single business rule line into a block
   */
  private parseBusinessRuleBlock(line: string, businessLine: number): BusinessRuleBlock | null {
    const type = this.getBusinessRuleType(line)
    const variables = this.extractBusinessRuleVariables(line)
    
    return {
      businessLine,
      content: line,
      type,
      variables
    }
  }
  
  /**
   * Determine the type of a business rule statement
   */
  private getBusinessRuleType(line: string): BusinessRuleBlock['type'] {
    // Class definition
    if (line.startsWith('class ')) {
      return 'class_def'
    }
    
    // Conditions
    if (line.startsWith('if ') || line.startsWith('elseif ') || line.startsWith('else')) {
      return 'condition'
    }
    
    // Loops
    if (line.startsWith('for ') || line.startsWith('while ') || line.includes(' in ')) {
      return 'loop'
    }
    
    // Assignments
    if (line.includes('=') && !line.includes('==') && !line.includes('!=')) {
      return 'assignment'
    }
    
    // Default to action
    return 'action'
  }
  
  /**
   * Extract variables from a business rule statement
   */
  private extractBusinessRuleVariables(line: string): string[] {
    const variables: string[] = []
    
    // For assignments, extract the left side
    if (line.includes('=') && !line.includes('==')) {
      const assignmentMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*=/)
      if (assignmentMatch) {
        const varName = assignmentMatch[1].split('.')[0]
        variables.push(varName)
      }
    }
    
    // Extract all identifier-like tokens
    const identifiers = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
    
    // Filter out business rule keywords
    const keywords = [
      'if', 'else', 'elseif', 'for', 'while', 'class', 'and', 'or', 'not', 'in',
      'any', 'all', 'contains', 'beginswith', 'endswith', 'true', 'false'
    ]
    
    identifiers.forEach(identifier => {
      if (!keywords.includes(identifier.toLowerCase()) && !variables.includes(identifier)) {
        variables.push(identifier)
      }
    })
    
    return variables
  }
  
  /**
   * Match Python statements to business rule blocks
   */
  matchStatements(
    pythonStatements: PythonStatement[],
    businessBlocks: BusinessRuleBlock[]
  ): StatementMapping[] {
    console.log('🔍 [StatementMatcher] Matching statements:', {
      pythonStatements: pythonStatements.length,
      businessBlocks: businessBlocks.length
    })
    
    const mappings: StatementMapping[] = []
    
    pythonStatements.forEach(pythonStmt => {
      if (!pythonStmt.isInstrumentable) {
        return
      }
      
      const bestMatch = this.findBestMatch(pythonStmt, businessBlocks)
      if (bestMatch) {
        mappings.push({
          pythonLine: pythonStmt.lineNumber,
          businessLine: bestMatch.block.businessLine,
          confidence: bestMatch.confidence,
          description: this.generateDescription(pythonStmt, bestMatch.block),
          variables: [...new Set([...pythonStmt.variables, ...bestMatch.block.variables])]
        })
      }
    })
    
    console.log('✅ [StatementMatcher] Generated statement mappings:', {
      totalMappings: mappings.length,
      averageConfidence: mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length,
      highConfidenceMappings: mappings.filter(m => m.confidence > 0.8).length
    })
    
    return mappings
  }
  
  /**
   * Find the best matching business rule block for a Python statement
   */
  private findBestMatch(
    pythonStmt: PythonStatement,
    businessBlocks: BusinessRuleBlock[]
  ): { block: BusinessRuleBlock; confidence: number } | null {
    let bestMatch: { block: BusinessRuleBlock; confidence: number } | null = null
    
    businessBlocks.forEach(businessBlock => {
      const confidence = this.calculateMatchConfidence(pythonStmt, businessBlock)
      
      if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { block: businessBlock, confidence }
      }
    })
    
    return bestMatch
  }
  
  /**
   * Calculate confidence score for matching a Python statement to a business block
   */
  private calculateMatchConfidence(
    pythonStmt: PythonStatement,
    businessBlock: BusinessRuleBlock
  ): number {
    let confidence = 0
    
    // Type matching bonus
    if (this.typesMatch(pythonStmt.type, businessBlock.type)) {
      confidence += 0.4
    }
    
    // Variable overlap bonus
    const commonVariables = pythonStmt.variables.filter(v => 
      businessBlock.variables.includes(v)
    )
    if (commonVariables.length > 0) {
      confidence += Math.min(0.4, commonVariables.length * 0.2)
    }
    
    // Content similarity bonus
    const contentSimilarity = this.calculateContentSimilarity(
      pythonStmt.content,
      businessBlock.content
    )
    confidence += contentSimilarity * 0.3
    
    // Position proximity bonus (statements closer in line numbers are more likely to match)
    const positionBonus = Math.max(0, 0.1 - Math.abs(pythonStmt.lineNumber - businessBlock.businessLine) * 0.01)
    confidence += positionBonus
    
    return Math.min(1, confidence)
  }
  
  /**
   * Check if Python and business rule types are compatible
   */
  private typesMatch(pythonType: PythonStatement['type'], businessType: BusinessRuleBlock['type']): boolean {
    // Direct matches
    if (pythonType === businessType) {
      return true
    }
    
    // Compatible matches
    const compatibleTypes: Record<string, string[]> = {
      'assignment': ['assignment', 'action'],
      'condition': ['condition', 'action'],
      'loop': ['loop', 'action'],
      'function_call': ['action', 'assignment'],
      'expression': ['action', 'assignment']
    }
    
    return compatibleTypes[pythonType]?.includes(businessType) || false
  }
  
  /**
   * Calculate content similarity between two strings
   */
  private calculateContentSimilarity(pythonContent: string, businessContent: string): number {
    const pythonWords = this.extractWords(pythonContent.toLowerCase())
    const businessWords = this.extractWords(businessContent.toLowerCase())
    
    if (pythonWords.length === 0 || businessWords.length === 0) {
      return 0
    }
    
    const commonWords = pythonWords.filter(word => businessWords.includes(word))
    const totalWords = new Set([...pythonWords, ...businessWords]).size
    
    return commonWords.length / totalWords
  }
  
  /**
   * Extract meaningful words from a string
   */
  private extractWords(text: string): string[] {
    const words = text.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
    
    // Filter out common words
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'while',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'
    ]
    
    return words.filter(word => !stopWords.includes(word) && word.length > 2)
  }
  
  /**
   * Generate a human-readable description for a mapping
   */
  private generateDescription(pythonStmt: PythonStatement, businessBlock: BusinessRuleBlock): string {
    switch (businessBlock.type) {
      case 'assignment':
        return `Assign variable: ${businessBlock.content}`
      case 'condition':
        return `Check condition: ${businessBlock.content}`
      case 'loop':
        return `Loop: ${businessBlock.content}`
      case 'class_def':
        return `Define class: ${businessBlock.content}`
      default:
        return `Execute: ${businessBlock.content}`
    }
  }
  
  /**
   * Get counts of block types for logging
   */
  private getBlockTypeCounts(blocks: BusinessRuleBlock[]): Record<string, number> {
    const counts: Record<string, number> = {}
    
    blocks.forEach(block => {
      counts[block.type] = (counts[block.type] || 0) + 1
    })
    
    return counts
  }
}

/**
 * Singleton instance for reuse
 */
export const statementMatcher = new StatementMatcher()
