// Line Continuation System - Main Exports
// Smart line continuation detection for business rule language

// Types
export type {
  LineInfo,
  ContinuationContext,
  ContinuationRule,
  StatementGroup,
  ContinuationDetectionResult
} from './types'

// Core classes and instances
export {
  LineContinuationDetector,
  lineContinuationDetector,
  createLineContinuationDetector
} from './line-continuation-detector'

export {
  StatementGrouper,
  statementGrouper,
  createStatementGrouper
} from './statement-grouper'

// Rules and configuration
export {
  CONTINUATION_RULES,
  COMMA_CONTINUATION_RULE,
  OPEN_PAREN_CONTINUATION_RULE,
  ASSIGNMENT_CONTINUATION_RULE,
  LOGICAL_OPERATOR_CONTINUATION_RULE,
  ARITHMETIC_OPERATOR_CONTINUATION_RULE,
  COMPARISON_OPERATOR_CONTINUATION_RULE,
  INCOMPLETE_FUNCTION_CALL_RULE,
  INCOMPLETE_IF_STATEMENT_RULE,
  STRING_CONCATENATION_RULE,
  getContinuationRule,
  getContinuationRuleNames
} from './continuation-rules'

// Convenience functions for common use cases
export const detectLineContinuation = (text: string) => {
  return lineContinuationDetector.analyzeText(text)
}

export const groupIntoStatements = (text: string) => {
  return statementGrouper.groupStatements(text)
}

export const getCompleteStatements = (text: string) => {
  return statementGrouper.getCompleteStatements(text)
}

export const findStatementAtLine = (text: string, lineNumber: number) => {
  return statementGrouper.findStatementContainingLine(text, lineNumber)
} 