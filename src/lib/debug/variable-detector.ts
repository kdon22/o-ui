/**
 * Dynamic Variable Detection System
 * 
 * Replaces hardcoded variable patterns with dynamic detection
 * based on actual Python execution context and variable values.
 */

export interface VariableInfo {
  name: string
  value: any
  type: string
  isBusinessRelevant: boolean
  source: 'execution' | 'context' | 'parameter'
  description?: string
}

export interface VariableContext {
  executionVariables: Record<string, any>
  contextVariables?: Record<string, any>
  parameterVariables?: Record<string, any>
}

/**
 * Dynamic Variable Detector
 * 
 * Analyzes execution context to determine which variables are relevant
 * for debugging without relying on hardcoded patterns.
 */
export class VariableDetector {
  
  /**
   * Detect and filter relevant variables from execution context
   * 
   * @param context - Variable context from Python execution
   * @returns Array of relevant variables for debugging
   */
  detectRelevantVariables(context: VariableContext): VariableInfo[] {
    console.log('🔍 [VariableDetector] Analyzing variables:', {
      executionVars: Object.keys(context.executionVariables || {}).length,
      contextVars: Object.keys(context.contextVariables || {}).length,
      parameterVars: Object.keys(context.parameterVariables || {}).length
    })
    
    const relevantVariables: VariableInfo[] = []
    
    // Process execution variables (highest priority)
    if (context.executionVariables) {
      Object.entries(context.executionVariables).forEach(([name, value]) => {
        const variableInfo = this.analyzeVariable(name, value, 'execution')
        if (variableInfo.isBusinessRelevant) {
          relevantVariables.push(variableInfo)
        }
      })
    }
    
    // Process context variables
    if (context.contextVariables) {
      Object.entries(context.contextVariables).forEach(([name, value]) => {
        // Avoid duplicates
        if (!relevantVariables.some(v => v.name === name)) {
          const variableInfo = this.analyzeVariable(name, value, 'context')
          if (variableInfo.isBusinessRelevant) {
            relevantVariables.push(variableInfo)
          }
        }
      })
    }
    
    // Process parameter variables
    if (context.parameterVariables) {
      Object.entries(context.parameterVariables).forEach(([name, value]) => {
        // Avoid duplicates
        if (!relevantVariables.some(v => v.name === name)) {
          const variableInfo = this.analyzeVariable(name, value, 'parameter')
          if (variableInfo.isBusinessRelevant) {
            relevantVariables.push(variableInfo)
          }
        }
      })
    }
    
    // Sort by relevance (execution variables first, then by name)
    relevantVariables.sort((a, b) => {
      if (a.source !== b.source) {
        const sourceOrder = { execution: 0, context: 1, parameter: 2 }
        return sourceOrder[a.source] - sourceOrder[b.source]
      }
      return a.name.localeCompare(b.name)
    })
    
    console.log('✅ [VariableDetector] Detected relevant variables:', {
      totalRelevant: relevantVariables.length,
      bySource: this.groupBySource(relevantVariables),
      sampleVariables: relevantVariables.slice(0, 5).map(v => ({ name: v.name, type: v.type }))
    })
    
    return relevantVariables
  }
  
  /**
   * Analyze a single variable to determine if it's business relevant
   */
  private analyzeVariable(name: string, value: any, source: VariableInfo['source']): VariableInfo {
    const type = this.getVariableType(value)
    const isBusinessRelevant = this.isBusinessRelevant(name, value, type)
    const description = this.generateDescription(name, value, type)
    
    return {
      name,
      value,
      type,
      isBusinessRelevant,
      source,
      description
    }
  }
  
  /**
   * Determine if a variable is business relevant based on multiple factors
   */
  private isBusinessRelevant(name: string, value: any, type: string): boolean {
    // Filter out Python internal variables
    if (this.isPythonInternal(name)) {
      return false
    }
    
    // Filter out empty or null values (unless they're meaningful)
    if (this.isEmptyValue(value) && !this.isMeaningfulEmpty(name, value)) {
      return false
    }
    
    // Include variables with actual business data
    if (this.hasBusinessData(name, value, type)) {
      return true
    }
    
    // Include variables that are part of business logic
    if (this.isBusinessLogicVariable(name, type)) {
      return true
    }
    
    // Include user-defined variables (not built-ins)
    if (this.isUserDefinedVariable(name)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if a variable name indicates Python internal usage
   */
  private isPythonInternal(name: string): boolean {
    // Python magic methods and attributes
    if (name.startsWith('__') && name.endsWith('__')) {
      // Exception: __properties__ might contain business data
      return name !== '__properties__'
    }
    
    // Python built-in functions and modules
    const builtins = [
      'print', 'len', 'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple',
      'range', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
      'abs', 'min', 'max', 'sum', 'any', 'all',
      'isinstance', 'hasattr', 'getattr', 'setattr',
      'type', 'id', 'hash', 'repr', 'vars', 'dir'
    ]
    
    return builtins.includes(name)
  }
  
  /**
   * Check if a value is empty or null
   */
  private isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) {
      return true
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return true
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return true
    }
    
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if an empty value is meaningful in business context
   */
  private isMeaningfulEmpty(name: string, value: any): boolean {
    // Empty strings might be meaningful for certain business fields
    if (typeof value === 'string' && value === '') {
      const meaningfulEmptyFields = ['status', 'result', 'message', 'error', 'response']
      return meaningfulEmptyFields.some(field => name.toLowerCase().includes(field))
    }
    
    // Empty arrays might be meaningful
    if (Array.isArray(value) && value.length === 0) {
      return true // Empty collections can be meaningful in business logic
    }
    
    return false
  }
  
  /**
   * Check if a variable contains business data
   */
  private hasBusinessData(name: string, value: any, type: string): boolean {
    // Objects with properties likely contain business data
    if (type === 'object' && value && typeof value === 'object') {
      const keys = Object.keys(value)
      if (keys.length > 0) {
        // Check if it has business-like properties
        const businessKeys = keys.filter(key => 
          !key.startsWith('_') && 
          !this.isPythonInternal(key)
        )
        return businessKeys.length > 0
      }
    }
    
    // Arrays with data
    if (Array.isArray(value) && value.length > 0) {
      return true
    }
    
    // Non-empty strings that aren't just whitespace
    if (typeof value === 'string' && value.trim().length > 0) {
      return true
    }
    
    // Numbers (including 0, which can be meaningful)
    if (typeof value === 'number' && !isNaN(value)) {
      return true
    }
    
    // Booleans are often meaningful in business logic
    if (typeof value === 'boolean') {
      return true
    }
    
    return false
  }
  
  /**
   * Check if a variable is part of business logic based on naming patterns
   */
  private isBusinessLogicVariable(name: string, type: string): boolean {
    // Variables that follow common business naming patterns
    const businessPatterns = [
      /^(customer|user|client|account)/i,
      /^(order|booking|reservation|transaction)/i,
      /^(product|item|service|offering)/i,
      /^(price|cost|amount|total|fee|discount)/i,
      /^(status|state|result|response)/i,
      /^(date|time|timestamp|created|updated)/i,
      /^(name|title|description|message)/i,
      /^(id|key|reference|number)/i,
      /^(is|has|can|should|will)[A-Z]/,  // Boolean flags
      /^(get|set|create|update|delete)[A-Z]/, // Action methods
    ]
    
    return businessPatterns.some(pattern => pattern.test(name))
  }
  
  /**
   * Check if a variable is user-defined (not a built-in)
   */
  private isUserDefinedVariable(name: string): boolean {
    // Simple heuristic: if it's a valid identifier and not obviously built-in
    const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
    const notTooShort = name.length > 1 // Avoid single letters like 'i', 'x'
    const notBuiltIn = !this.isPythonInternal(name)
    
    return validIdentifier && notTooShort && notBuiltIn
  }
  
  /**
   * Get a human-readable type for a variable
   */
  private getVariableType(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (Array.isArray(value)) return 'array'
    
    const type = typeof value
    
    // For objects, try to get more specific type info
    if (type === 'object' && value.constructor && value.constructor.name !== 'Object') {
      return value.constructor.name.toLowerCase()
    }
    
    return type
  }
  
  /**
   * Generate a description for a variable
   */
  private generateDescription(name: string, value: any, type: string): string {
    if (type === 'array') {
      return `Array with ${value.length} items`
    }
    
    if (type === 'object' && value) {
      const keyCount = Object.keys(value).length
      return `Object with ${keyCount} properties`
    }
    
    if (type === 'string') {
      const length = value.length
      return length > 50 ? `String (${length} chars)` : `String: "${value}"`
    }
    
    if (type === 'number') {
      return `Number: ${value}`
    }
    
    if (type === 'boolean') {
      return `Boolean: ${value}`
    }
    
    return `${type}: ${String(value).substring(0, 50)}`
  }
  
  /**
   * Group variables by source for logging
   */
  private groupBySource(variables: VariableInfo[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    variables.forEach(variable => {
      groups[variable.source] = (groups[variable.source] || 0) + 1
    })
    
    return groups
  }
}

/**
 * Singleton instance for reuse
 */
export const variableDetector = new VariableDetector()
