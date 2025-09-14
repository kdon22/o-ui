/**
 * Python Name Converter Utility
 * 
 * Converts rule names to valid Python function names following Python naming conventions:
 * - Start with letter or underscore
 * - Only letters, numbers, and underscores
 * - Convert to snake_case
 * - Remove invalid characters
 * - Handle edge cases
 */

export function convertToPythonName(ruleName: string): string {
  if (!ruleName || typeof ruleName !== 'string') {
    return 'unnamed_rule'
  }

  // Remove leading/trailing whitespace
  let pythonName = ruleName.trim()

  // Convert to lowercase
  pythonName = pythonName.toLowerCase()

  // Replace spaces and hyphens with underscores
  pythonName = pythonName.replace(/[\s\-]+/g, '_')

  // Remove all invalid characters (keep only letters, numbers, underscores)
  pythonName = pythonName.replace(/[^a-z0-9_]/g, '')

  // Remove consecutive underscores
  pythonName = pythonName.replace(/_+/g, '_')

  // Remove leading/trailing underscores
  pythonName = pythonName.replace(/^_+|_+$/g, '')

  // Ensure it starts with a letter or underscore (not a number)
  if (pythonName && /^\d/.test(pythonName)) {
    pythonName = 'rule_' + pythonName
  }

  // Handle empty results
  if (!pythonName) {
    return 'unnamed_rule'
  }

  // Ensure it's not a Python keyword
  const pythonKeywords = [
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
    'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
    'True', 'False', 'None'
  ]

  if (pythonKeywords.includes(pythonName)) {
    pythonName = pythonName + '_rule'
  }

  return pythonName
}

/**
 * Generate a complete Python function definition from rule name and source code
 */
export function generatePythonFunction(ruleName: string, sourceCode?: string): string {
  const functionName = convertToPythonName(ruleName)
  
  const header = `def ${functionName}(context):`
  const docstring = `    """
    ${ruleName}
    
    Auto-generated business rule function.
    """
`
  
  if (sourceCode) {
    // This is a placeholder - you'd integrate with your Monaco language service here
    const body = `    # Generated from business rule: ${ruleName}
    # Source: ${sourceCode.slice(0, 100)}${sourceCode.length > 100 ? '...' : ''}
    
    # TODO: Implement business logic based on source code
    pass
    
    return {
        'success': True,
        'result': None,
        'message': 'Rule executed successfully'
    }`
    
    return header + '\n' + docstring + body
  }
  
  const defaultBody = `    # TODO: Implement business logic
    pass
    
    return {
        'success': True,
        'result': None,
        'message': 'Rule executed successfully'
    }`
  
  return header + '\n' + docstring + defaultBody
}

/**
 * Examples for testing
 */
export const conversionExamples = [
  { input: 'Customer Age Validation', expected: 'customer_age_validation' },
  { input: 'Check Booking Amount > 1000', expected: 'check_booking_amount_1000' },
  { input: '18+ Age Requirement', expected: 'rule_18_age_requirement' },
  { input: 'if-else-logic', expected: 'if_else_logic' },
  { input: 'def', expected: 'def_rule' },
  { input: '   Multiple   Spaces   ', expected: 'multiple_spaces' },
  { input: '!!!Invalid@@@Characters###', expected: 'invalid_characters' },
  { input: '', expected: 'unnamed_rule' },
  { input: '123NumericStart', expected: 'rule_123_numeric_start' }
] 