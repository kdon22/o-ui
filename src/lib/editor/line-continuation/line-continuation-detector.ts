// Line Continuation Detector - Smart detection using context-aware rules

import type { 
  LineInfo, 
  ContinuationContext, 
  ContinuationDetectionResult,
  ContinuationRule 
} from './types'
import { CONTINUATION_RULES } from './continuation-rules'

/**
 * Core Line Continuation Detector
 * Analyzes lines of code to determine if they should continue to the next line
 */
export class LineContinuationDetector {
  private rules: ContinuationRule[]
  
  constructor(customRules?: ContinuationRule[]) {
    this.rules = customRules || CONTINUATION_RULES
  }

  /**
   * Parse raw text into LineInfo objects
   */
  parseLines(text: string): LineInfo[] {
    const rawLines = text.split('\n')
    
    return rawLines.map((line, index) => {
      const trimmed = line.trim()
      const indentMatch = line.match(/^(\s*)/)
      const indentLevel = indentMatch ? indentMatch[1].length : 0
      
      return {
        content: line,
        lineNumber: index + 1,
        trimmed,
        indentLevel,
        isEmpty: trimmed.length === 0
      }
    })
  }

  /**
   * Detect if a line should continue to the next line
   */
  shouldContinue(lines: LineInfo[], currentIndex: number): ContinuationDetectionResult {
    const currentLine = lines[currentIndex]
    
    // Empty lines never continue
    if (currentLine.isEmpty) {
      return {
        shouldContinue: false,
        reason: 'empty-line',
        confidence: 1.0
      }
    }

    // Last line cannot continue
    if (currentIndex >= lines.length - 1) {
      return {
        shouldContinue: false,
        reason: 'last-line',
        confidence: 1.0
      }
    }

    const context: ContinuationContext = {
      previousLine: currentIndex > 0 ? lines[currentIndex - 1] : null,
      currentLine,
      nextLine: currentIndex < lines.length - 1 ? lines[currentIndex + 1] : null
    }

    // Test rules in priority order
    for (const rule of this.rules) {
      try {
        if (rule.test(context)) {
          return {
            shouldContinue: true,
            reason: rule.name,
            confidence: this.calculateConfidence(rule, context)
          }
        }
      } catch (error) {
        console.warn(`Rule ${rule.name} failed with error:`, error)
        continue
      }
    }

    // No rules matched - line is complete
    return {
      shouldContinue: false,
      reason: 'complete-statement',
      confidence: 0.8 // Lower confidence since we're inferring completion
    }
  }

  /**
   * Calculate confidence score for a rule match
   */
  private calculateConfidence(rule: ContinuationRule, context: ContinuationContext): number {
    // Base confidence from rule priority (higher priority = higher confidence)
    let confidence = Math.min(rule.priority / 100, 1.0)
    
    // Boost confidence for certain patterns
    const line = context.currentLine.trimmed
    
    // Very high confidence for structural indicators
    if (line.endsWith(',') || line.endsWith('(')) {
      confidence = Math.max(confidence, 0.95)
    }
    
    // High confidence for operators
    if (line.endsWith('=') || line.endsWith(' and') || line.endsWith(' or')) {
      confidence = Math.max(confidence, 0.9)
    }
    
    // Medium confidence for incomplete patterns
    if (rule.name === 'incomplete-function-call' || rule.name === 'incomplete-if-statement') {
      confidence = Math.max(confidence, 0.7)
    }
    
    return Math.min(confidence, 1.0)
  }

  /**
   * Analyze all lines and return continuation decisions
   */
  analyzeText(text: string): ContinuationDetectionResult[] {
    const lines = this.parseLines(text)
    const results: ContinuationDetectionResult[] = []
    
    for (let i = 0; i < lines.length; i++) {
      results.push(this.shouldContinue(lines, i))
    }
    
    return results
  }

  /**
   * Get detailed analysis for debugging
   */
  getDetailedAnalysis(text: string): {
    lines: LineInfo[]
    continuations: ContinuationDetectionResult[]
    summary: {
      totalLines: number
      continuingLines: number
      completeStatements: number
      averageConfidence: number
    }
  } {
    const lines = this.parseLines(text)
    const continuations = this.analyzeText(text)
    
    const continuingLines = continuations.filter(c => c.shouldContinue).length
    const averageConfidence = continuations.reduce((sum, c) => sum + c.confidence, 0) / continuations.length
    
    return {
      lines,
      continuations,
      summary: {
        totalLines: lines.length,
        continuingLines,
        completeStatements: lines.length - continuingLines,
        averageConfidence: Math.round(averageConfidence * 100) / 100
      }
    }
  }

  /**
   * Add custom rule
   */
  addRule(rule: ContinuationRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove rule by name
   */
  removeRule(ruleName: string): boolean {
    const initialLength = this.rules.length
    this.rules = this.rules.filter(rule => rule.name !== ruleName)
    return this.rules.length < initialLength
  }
}

// Export singleton instance
export const lineContinuationDetector = new LineContinuationDetector()

// Export factory function for custom instances
export const createLineContinuationDetector = (customRules?: ContinuationRule[]) => {
  return new LineContinuationDetector(customRules)
} 