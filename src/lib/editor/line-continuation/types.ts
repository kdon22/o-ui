// Types for the Line Continuation System

export interface LineInfo {
  content: string
  lineNumber: number
  trimmed: string
  indentLevel: number
  isEmpty: boolean
}

export interface ContinuationContext {
  previousLine: LineInfo | null
  currentLine: LineInfo
  nextLine: LineInfo | null
}

export interface ContinuationRule {
  name: string
  description: string
  test: (context: ContinuationContext) => boolean
  priority: number  // Higher priority rules are checked first
}

export interface StatementGroup {
  id: string
  lines: LineInfo[]
  startLine: number
  endLine: number
  isComplete: boolean
  continuationReasons: string[]  // Which rules caused continuation
}

export interface ContinuationDetectionResult {
  shouldContinue: boolean
  reason: string
  confidence: number  // 0-1, how confident we are
} 