// Statement Grouper - Groups lines into complete statements based on continuation detection

import type { LineInfo, StatementGroup } from './types'
import { lineContinuationDetector } from './line-continuation-detector'

/**
 * Groups lines of code into complete statements based on line continuation rules
 */
export class StatementGrouper {
  
  /**
   * Group lines of text into complete statements
   */
  groupStatements(text: string): StatementGroup[] {
    const lines = lineContinuationDetector.parseLines(text)
    const continuations = lineContinuationDetector.analyzeText(text)
    
    const groups: StatementGroup[] = []
    let currentGroup: LineInfo[] = []
    let groupStartLine = 1
    let groupReasons: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const continuation = continuations[i]
      
      // Skip empty lines (they don't belong to any statement)
      if (line.isEmpty) {
        // If we have a current group, finish it
        if (currentGroup.length > 0) {
          groups.push(this.createStatementGroup(currentGroup, groupStartLine, groupReasons))
          currentGroup = []
          groupReasons = []
        }
        continue
      }
      
      // Start new group if we don't have one
      if (currentGroup.length === 0) {
        groupStartLine = line.lineNumber
      }
      
      // Add line to current group
      currentGroup.push(line)
      
      // Track continuation reasons
      if (continuation.shouldContinue) {
        groupReasons.push(continuation.reason)
      }
      
      // If this line doesn't continue, finish the group
      if (!continuation.shouldContinue) {
        groups.push(this.createStatementGroup(currentGroup, groupStartLine, groupReasons))
        currentGroup = []
        groupReasons = []
      }
    }
    
    // Handle any remaining group
    if (currentGroup.length > 0) {
      groups.push(this.createStatementGroup(currentGroup, groupStartLine, groupReasons))
    }
    
    return groups
  }
  
  /**
   * Create a StatementGroup from lines
   */
  private createStatementGroup(
    lines: LineInfo[], 
    startLine: number, 
    reasons: string[]
  ): StatementGroup {
    const endLine = lines[lines.length - 1]?.lineNumber || startLine
    const isComplete = reasons.length === 0 || 
                      !reasons.includes('incomplete-function-call') && 
                      !reasons.includes('incomplete-if-statement')
    
    return {
      id: `statement-${startLine}-${endLine}`,
      lines: [...lines], // Copy array
      startLine,
      endLine,
      isComplete,
      continuationReasons: [...reasons] // Copy array
    }
  }
  
  /**
   * Get a single statement as text
   */
  getStatementText(group: StatementGroup): string {
    return group.lines.map(line => line.content).join('\n')
  }
  
  /**
   * Get a statement as trimmed/cleaned text for processing
   */
  getCleanStatementText(group: StatementGroup): string {
    return group.lines
      .map(line => line.trimmed)
      .filter(line => line.length > 0)
      .join(' ')
  }
  
  /**
   * Get all complete statements from text
   */
  getCompleteStatements(text: string): StatementGroup[] {
    const groups = this.groupStatements(text)
    return groups.filter(group => group.isComplete)
  }
  
  /**
   * Get all incomplete statements from text
   */
  getIncompleteStatements(text: string): StatementGroup[] {
    const groups = this.groupStatements(text)
    return groups.filter(group => !group.isComplete)
  }
  
  /**
   * Find statement group containing a specific line number
   */
  findStatementContainingLine(text: string, lineNumber: number): StatementGroup | null {
    const groups = this.groupStatements(text)
    
    return groups.find(group => 
      lineNumber >= group.startLine && lineNumber <= group.endLine
    ) || null
  }
  
  /**
   * Get statistics about statement grouping
   */
  getGroupingStatistics(text: string): {
    totalLines: number
    totalStatements: number
    completeStatements: number
    incompleteStatements: number
    averageLinesPerStatement: number
    longestStatement: number
    mostCommonContinuationReason: string | null
  } {
    const lines = lineContinuationDetector.parseLines(text)
    const groups = this.groupStatements(text)
    
    const completeStatements = groups.filter(g => g.isComplete).length
    const incompleteStatements = groups.length - completeStatements
    
    const lineCounts = groups.map(g => g.lines.length)
    const averageLinesPerStatement = lineCounts.length > 0 
      ? lineCounts.reduce((sum, count) => sum + count, 0) / lineCounts.length 
      : 0
    const longestStatement = lineCounts.length > 0 ? Math.max(...lineCounts) : 0
    
    // Find most common continuation reason
    const allReasons = groups.flatMap(g => g.continuationReasons)
    const reasonCounts = allReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostCommonReason = Object.keys(reasonCounts).length > 0
      ? Object.entries(reasonCounts).sort(([,a], [,b]) => b - a)[0][0]
      : null
    
    return {
      totalLines: lines.filter(l => !l.isEmpty).length,
      totalStatements: groups.length,
      completeStatements,
      incompleteStatements,
      averageLinesPerStatement: Math.round(averageLinesPerStatement * 100) / 100,
      longestStatement,
      mostCommonContinuationReason: mostCommonReason
    }
  }
}

// Export singleton instance
export const statementGrouper = new StatementGrouper()

// Export factory function
export const createStatementGrouper = () => {
  return new StatementGrouper()
} 