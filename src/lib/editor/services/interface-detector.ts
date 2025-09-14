/**
 * 🔍 Interface Detector - Simple Business Rule Code Parser
 * 
 * Designed for non-coders: parses simple, natural business rule syntax
 * - interface user { age = 0, name = "" }
 * - return user
 * 
 * NO complex expressions - keeps it simple for business users
 */

export interface ParsedInterface {
  name: string
  properties: ParsedProperty[]
}

export interface ParsedProperty {
  name: string
  type: string
  defaultValue?: any
  description?: string
}

export class InterfaceDetector {
  /**
   * Parse interfaces from business rule source code
   * Handles simple syntax: interface user { age = 0, name = "" }
   */
  static parseInterfaces(sourceCode: string): ParsedInterface[] {
    if (!sourceCode) return []
    
    const interfaces: ParsedInterface[] = []
    
    try {
      // Match interface declarations with simple property syntax
      const interfaceRegex = /interface\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{([^}]+)\}/g
      let match
      
      while ((match = interfaceRegex.exec(sourceCode)) !== null) {
        const interfaceName = match[1]
        const propertiesBlock = match[2]
        
        console.log(`🔍 [InterfaceDetector] Found interface: ${interfaceName}`)
        
        const properties = this.parseInterfaceProperties(propertiesBlock)
        
        interfaces.push({
          name: interfaceName,
          properties
        })
        
        console.log(`🔍 [InterfaceDetector] Parsed ${properties.length} properties for ${interfaceName}:`, 
          properties.map(p => `${p.name}: ${p.type}`))
      }
    } catch (error) {
      console.warn('🔍 [InterfaceDetector] Error parsing interfaces:', error)
    }
    
    return interfaces
  }
  
  /**
   * Parse properties from interface body
   * Handles: age = 0, name = "", isActive = true
   */
  private static parseInterfaceProperties(propertiesBlock: string): ParsedProperty[] {
    const properties: ParsedProperty[] = []
    
    try {
      // Split by lines and parse each property
      const lines = propertiesBlock.split('\n')
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//')) continue
        
        // Match: propertyName = defaultValue
        const propertyMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/)
        
        if (propertyMatch) {
          const propertyName = propertyMatch[1]
          const defaultValue = propertyMatch[2].trim()
          
          // Infer type from default value
          const type = this.inferTypeFromDefaultValue(defaultValue)
          
          properties.push({
            name: propertyName,
            type,
            defaultValue: this.parseDefaultValue(defaultValue)
          })
          
          console.log(`🔍 [InterfaceDetector] Property: ${propertyName} = ${defaultValue} (type: ${type})`)
        }
      }
    } catch (error) {
      console.warn('🔍 [InterfaceDetector] Error parsing properties:', error)
    }
    
    return properties
  }
  
  /**
   * Infer TypeScript type from default value
   */
  private static inferTypeFromDefaultValue(defaultValue: string): string {
    const trimmed = defaultValue.trim()
    
    // String literals: "hello", ""
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return 'string'
    }
    
    // Numbers: 0, 42, 3.14
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed.includes('.') ? 'number' : 'number'
    }
    
    // Booleans: true, false
    if (trimmed === 'true' || trimmed === 'false') {
      return 'boolean'
    }
    
    // Arrays: [], [1, 2, 3]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return 'array'
    }
    
    // Objects: {}, { key: value }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return 'object'
    }
    
    // Default fallback
    return 'string'
  }
  
  /**
   * Parse default value to appropriate JavaScript type
   */
  private static parseDefaultValue(defaultValue: string): any {
    const trimmed = defaultValue.trim()
    
    try {
      // String literals
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1) // Remove quotes
      }
      
      // Numbers
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return Number(trimmed)
      }
      
      // Booleans
      if (trimmed === 'true') return true
      if (trimmed === 'false') return false
      
      // Try JSON parsing for arrays/objects
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return JSON.parse(trimmed)
      }
    } catch (error) {
      console.warn('🔍 [InterfaceDetector] Could not parse default value:', defaultValue)
    }
    
    // Return as string if parsing fails
    return trimmed
  }
  
  /**
   * Detect return type from business rule code
   * Handles: return user, return 0, return "hello", return true, etc.
   */
  static detectReturnType(sourceCode: string): string | null {
    if (!sourceCode) return null
    
    try {
      // Match return statements: return <value>
      const returnMatch = sourceCode.match(/return\s+(.+?)\s*$/m)
      
      if (returnMatch) {
        const returnValue = returnMatch[1].trim()
        console.log(`🔍 [InterfaceDetector] Found return value: "${returnValue}"`)
        
        // Check if it's a variable name (interface name)
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(returnValue)) {
          console.log(`🔍 [InterfaceDetector] Detected interface return type: ${returnValue}`)
          return returnValue
        }
        
        // Check if it's a literal value and infer type
        const literalType = this.inferTypeFromReturnValue(returnValue)
        console.log(`🔍 [InterfaceDetector] Detected literal return type: ${literalType}`)
        return literalType
      }
      
      // No return statement found
      console.log(`🔍 [InterfaceDetector] No return statement found`)
      return null
    } catch (error) {
      console.warn('🔍 [InterfaceDetector] Error detecting return type:', error)
    }
    
    return null
  }
  
  /**
   * Infer type from return value (literal or expression)
   */
  private static inferTypeFromReturnValue(returnValue: string): string {
    const trimmed = returnValue.trim()
    
    // String literals: "hello", ""
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return 'string'
    }
    
    // Numbers: 0, 42, 3.14, -5
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return 'number'
    }
    
    // Booleans: true, false
    if (trimmed === 'true' || trimmed === 'false') {
      return 'boolean'
    }
    
    // Arrays: [], [1, 2, 3]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return 'array'
    }
    
    // Objects: {}, { key: value }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return 'object'
    }
    
    // Null/undefined
    if (trimmed === 'null' || trimmed === 'undefined') {
      return 'null'
    }
    
    // Default fallback for complex expressions
    return 'object'
  }
  
  /**
   * Check if detected return type matches any parsed interface
   */
  static validateReturnTypeAgainstInterfaces(returnType: string, interfaces: ParsedInterface[]): boolean {
    return interfaces.some(iface => iface.name === returnType)
  }
  
  /**
   * Get interface by name from parsed interfaces
   */
  static getInterface(interfaceName: string, interfaces: ParsedInterface[]): ParsedInterface | null {
    return interfaces.find(iface => iface.name === interfaceName) || null
  }
}
