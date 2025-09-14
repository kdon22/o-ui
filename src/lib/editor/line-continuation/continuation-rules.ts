// Smart Continuation Rules - Context-Aware Detection
// These rules determine when a line should continue to the next line

import type { ContinuationRule, ContinuationContext } from './types'

/**
 * Rule: Lines ending with comma should continue
 * Example: debug("message", | log=true, email="user@example.com")
 */
export const COMMA_CONTINUATION_RULE: ContinuationRule = {
  name: 'comma-continuation',
  description: 'Lines ending with comma indicate parameter continuation',
  priority: 100,
  test: (context: ContinuationContext) => {
    return context.currentLine.trimmed.endsWith(',')
  }
}

/**
 * Rule: Lines ending with open parenthesis should continue
 * Example: if customer.hasActiveBooking( | startDate, endDate | )
 */
export const OPEN_PAREN_CONTINUATION_RULE: ContinuationRule = {
  name: 'open-paren-continuation',
  description: 'Lines ending with open parenthesis need closing',
  priority: 95,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    // Count open vs closed parens to see if we have unmatched opens
    const openCount = (line.match(/\(/g) || []).length
    const closeCount = (line.match(/\)/g) || []).length
    return openCount > closeCount
  }
}

/**
 * Rule: Lines ending with assignment operator should continue
 * Example: customerInfo = | customer.name + " - " + customer.email
 */
export const ASSIGNMENT_CONTINUATION_RULE: ContinuationRule = {
  name: 'assignment-continuation',
  description: 'Lines ending with assignment need a value',
  priority: 90,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    return line.endsWith('=') || line.match(/\s+=$/)
  }
}

/**
 * Rule: Lines ending with logical operators should continue
 * Example: if customer.age > 18 and | customer.status == "active"
 */
export const LOGICAL_OPERATOR_CONTINUATION_RULE: ContinuationRule = {
  name: 'logical-operator-continuation',
  description: 'Lines ending with logical operators need continuation',
  priority: 85,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    const logicalOperators = ['and', 'or', 'not', '&&', '||']
    return logicalOperators.some(op => {
      const regex = new RegExp(`\\s+${op}\\s*$`, 'i')
      return regex.test(line)
    })
  }
}

/**
 * Rule: Lines ending with arithmetic operators should continue
 * Example: total = price + | tax + shipping
 */
export const ARITHMETIC_OPERATOR_CONTINUATION_RULE: ContinuationRule = {
  name: 'arithmetic-operator-continuation',
  description: 'Lines ending with arithmetic operators need continuation',
  priority: 80,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    const arithmeticOps = ['+', '-', '*', '/', '%']
    return arithmeticOps.some(op => line.endsWith(` ${op}`))
  }
}

/**
 * Rule: Lines ending with comparison operators should continue
 * Example: if customer.age > | 18
 */
export const COMPARISON_OPERATOR_CONTINUATION_RULE: ContinuationRule = {
  name: 'comparison-operator-continuation',
  description: 'Lines ending with comparison operators need continuation',
  priority: 75,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    const comparisonOps = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'in', 'is']
    return comparisonOps.some(op => {
      const regex = new RegExp(`\\s+${op}\\s*$`, 'i')
      return regex.test(line)
    })
  }
}

/**
 * Rule: Function calls that are incomplete should continue
 * Example: debug("Processing customer", | <-- missing closing paren
 */
export const INCOMPLETE_FUNCTION_CALL_RULE: ContinuationRule = {
  name: 'incomplete-function-call',
  description: 'Incomplete function calls need continuation',
  priority: 70,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    
    // Check if line has function call pattern with unmatched parens
    const functionCallMatch = line.match(/\w+\s*\(/g)
    if (!functionCallMatch) return false
    
    // Count all parens to see if unmatched
    const openCount = (line.match(/\(/g) || []).length
    const closeCount = (line.match(/\)/g) || []).length
    
    return openCount > closeCount
  }
}

/**
 * Rule: If statements without conclusion should continue
 * Example: if customer.age > 18 | <-- needs "then" or action
 */
export const INCOMPLETE_IF_STATEMENT_RULE: ContinuationRule = {
  name: 'incomplete-if-statement',
  description: 'If statements without actions need continuation',
  priority: 65,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    
    // Check if line starts with 'if' but doesn't have a clear conclusion
    if (!line.toLowerCase().startsWith('if ')) return false
    
    // If it has 'then' or seems to have an action, it might be complete
    if (line.toLowerCase().includes(' then ') || 
        line.includes('=') || 
        line.includes('()')) {
      return false
    }
    
    // Check if next line is indented (has action)
    if (context.nextLine && context.nextLine.indentLevel > context.currentLine.indentLevel) {
      return false
    }
    
    return true
  }
}

/**
 * Rule: String concatenation should continue
 * Example: message = "Hello " + | "world"
 */
export const STRING_CONCATENATION_RULE: ContinuationRule = {
  name: 'string-concatenation',
  description: 'String concatenation should continue',
  priority: 60,
  test: (context: ContinuationContext) => {
    const line = context.currentLine.trimmed
    
    // Check for string + at end
    const stringConcatPattern = /["'][^"']*["']\s*\+\s*$/
    return stringConcatPattern.test(line)
  }
}

// Export all rules in priority order (highest first)
export const CONTINUATION_RULES: ContinuationRule[] = [
  COMMA_CONTINUATION_RULE,
  OPEN_PAREN_CONTINUATION_RULE,
  ASSIGNMENT_CONTINUATION_RULE,
  LOGICAL_OPERATOR_CONTINUATION_RULE,
  ARITHMETIC_OPERATOR_CONTINUATION_RULE,
  COMPARISON_OPERATOR_CONTINUATION_RULE,
  INCOMPLETE_FUNCTION_CALL_RULE,
  INCOMPLETE_IF_STATEMENT_RULE,
  STRING_CONCATENATION_RULE
].sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)

/**
 * Helper function to get rule by name
 */
export const getContinuationRule = (name: string): ContinuationRule | undefined => {
  return CONTINUATION_RULES.find(rule => rule.name === name)
}

/**
 * Helper function to get all rule names
 */
export const getContinuationRuleNames = (): string[] => {
  return CONTINUATION_RULES.map(rule => rule.name)
} 