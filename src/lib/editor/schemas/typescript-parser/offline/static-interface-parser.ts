/**
 * 🎯 STATIC INTERFACE PARSER - Offline TypeScript interface parsing
 * 
 * Parses TypeScript interfaces without TypeScript compiler dependency
 * Generates return objects in HTTP_RESPONSE_OBJECT format
 * Works completely offline for user utility functions
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Parsed interface representation
 */
export interface ParsedInterface {
  name: string
  properties: ParsedProperty[]
  extends?: string[]
  location: { line: number; column: number }
  rawText: string
}

/**
 * Parsed property representation
 */
export interface ParsedProperty {
  name: string
  type: string
  optional: boolean
  isArray: boolean
  isObject: boolean
  rawType: string
}

/**
 * Return object in HTTP_RESPONSE_OBJECT format
 */
export interface ReturnObject {
  name: string
  properties: Record<string, string>
}

/**
 * Parse result with dependencies
 */
export interface ParseResult {
  interfaces: ParsedInterface[]
  returnObjects: ReturnObject[]
  dependencies: Record<string, string[]>
  errors: string[]
}

// =============================================================================
// STATIC INTERFACE PARSER
// =============================================================================

/**
 * Parse TypeScript interfaces from source code using regex
 * Completely offline - no TypeScript compiler needed
 */
export function parseInterfacesStatic(sourceCode: string): ParseResult {
  const interfaces: ParsedInterface[] = []
  const errors: string[] = []
  
  try {
    // Find all interface declarations
    const interfaceMatches = findInterfaceDeclarations(sourceCode)
    
    for (const match of interfaceMatches) {
      const parsedInterface = parseInterfaceDeclaration(match, sourceCode)
      if (parsedInterface) {
        interfaces.push(parsedInterface)
      }
    }
    
    // Generate return objects
    const returnObjects = generateReturnObjects(interfaces)
    
    // Build dependency map
    const dependencies = buildDependencyMap(interfaces)
    
    return {
      interfaces,
      returnObjects,
      dependencies,
      errors
    }
    
  } catch (error) {
    errors.push(`Parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      interfaces: [],
      returnObjects: [],
      dependencies: {},
      errors
    }
  }
}

// =============================================================================
// INTERFACE DETECTION
// =============================================================================

/**
 * Find all interface declarations in source code
 */
function findInterfaceDeclarations(sourceCode: string): Array<{
  match: string
  name: string
  body: string
  startIndex: number
  endIndex: number
}> {
  const results: Array<{
    match: string
    name: string
    body: string
    startIndex: number
    endIndex: number
  }> = []
  
  // Regex to match interface declarations
  // Handles: export interface Name { ... } and interface Name extends Other { ... }
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{/g
  
  let match
  while ((match = interfaceRegex.exec(sourceCode)) !== null) {
    const interfaceName = match[1]
    const startIndex = match.index
    
    // Find the matching closing brace
    const openBraceIndex = sourceCode.indexOf('{', startIndex)
    const closeBraceIndex = findMatchingBrace(sourceCode, openBraceIndex)
    
    if (closeBraceIndex !== -1) {
      const fullMatch = sourceCode.substring(startIndex, closeBraceIndex + 1)
      const body = sourceCode.substring(openBraceIndex + 1, closeBraceIndex)
      
      results.push({
        match: fullMatch,
        name: interfaceName,
        body: body.trim(),
        startIndex,
        endIndex: closeBraceIndex + 1
      })
    }
  }
  
  return results
}

/**
 * Find matching closing brace
 */
function findMatchingBrace(text: string, openIndex: number): number {
  let braceCount = 1
  let index = openIndex + 1
  
  while (index < text.length && braceCount > 0) {
    const char = text[index]
    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
    }
    index++
  }
  
  return braceCount === 0 ? index - 1 : -1
}

// =============================================================================
// INTERFACE PARSING
// =============================================================================

/**
 * Parse a single interface declaration
 */
function parseInterfaceDeclaration(
  interfaceMatch: { match: string; name: string; body: string; startIndex: number },
  sourceCode: string
): ParsedInterface | null {
  try {
    const { name, body, match, startIndex } = interfaceMatch
    
    // Parse properties from interface body
    const properties = parseInterfaceProperties(body)
    
    // Extract extends clause
    const extendsMatch = match.match(/extends\s+([\w,\s]+)/)
    const extends_ = extendsMatch ? 
      extendsMatch[1].split(',').map(s => s.trim()) : 
      undefined
    
    // Calculate location
    const linesBeforeInterface = sourceCode.substring(0, startIndex).split('\n')
    const location = {
      line: linesBeforeInterface.length,
      column: linesBeforeInterface[linesBeforeInterface.length - 1].length + 1
    }
    
    return {
      name,
      properties,
      extends: extends_,
      location,
      rawText: match
    }
    
  } catch (error) {
    console.warn(`Failed to parse interface: ${error}`)
    return null
  }
}

/**
 * Parse properties from interface body
 */
function parseInterfaceProperties(body: string): ParsedProperty[] {
  const properties: ParsedProperty[] = []
  
  // Split by lines and process each property
  const lines = body.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
      continue
    }
    
    // Parse property line
    const property = parsePropertyLine(trimmed)
    if (property) {
      properties.push(property)
    }
  }
  
  return properties
}

/**
 * Parse a single property line
 */
function parsePropertyLine(line: string): ParsedProperty | null {
  try {
    // Remove trailing semicolon or comma
    const cleanLine = line.replace(/[;,]\s*$/, '')
    
    // Match property pattern: name?: type
    const propertyMatch = cleanLine.match(/^(\w+)(\?)?:\s*(.+)$/)
    if (!propertyMatch) {
      return null
    }
    
    const [, name, optionalMarker, rawType] = propertyMatch
    const optional = !!optionalMarker
    
    // Analyze type
    const typeInfo = analyzePropertyType(rawType.trim())
    
    return {
      name,
      type: typeInfo.type,
      optional,
      isArray: typeInfo.isArray,
      isObject: typeInfo.isObject,
      rawType: rawType.trim()
    }
    
  } catch (error) {
    console.warn(`Failed to parse property line: ${line}`, error)
    return null
  }
}

/**
 * Analyze property type and normalize it
 */
function analyzePropertyType(rawType: string): {
  type: string
  isArray: boolean
  isObject: boolean
} {
  let type = rawType
  let isArray = false
  let isObject = false
  
  // Handle array types
  if (type.endsWith('[]')) {
    isArray = true
    type = type.slice(0, -2)
  } else if (type.startsWith('Array<') && type.endsWith('>')) {
    isArray = true
    type = type.slice(6, -1)
  }
  
  // Normalize primitive types to our system
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'Date': 'date',
    'object': 'object',
    'any': 'object',
    'unknown': 'object'
  }
  
  // Check if it's a primitive type
  if (typeMap[type]) {
    type = typeMap[type]
  } else {
    // It's likely a custom interface/object type
    isObject = true
  }
  
  return { type, isArray, isObject }
}

// =============================================================================
// RETURN OBJECT GENERATION
// =============================================================================

/**
 * Generate return objects in HTTP_RESPONSE_OBJECT format
 */
function generateReturnObjects(interfaces: ParsedInterface[]): ReturnObject[] {
  const returnObjects: ReturnObject[] = []
  
  for (const iface of interfaces) {
    const returnObject = generateReturnObject(iface)
    returnObjects.push(returnObject)
  }
  
  return returnObjects
}

/**
 * Generate return object for a single interface
 */
function generateReturnObject(iface: ParsedInterface): ReturnObject {
  const properties: Record<string, string> = {}
  
  for (const prop of iface.properties) {
    let propType = prop.type
    
    // Handle arrays
    if (prop.isArray) {
      propType = `${propType}[]`
    }
    
    properties[prop.name] = propType
  }
  
  return {
    name: iface.name,
    properties
  }
}

// =============================================================================
// DEPENDENCY RESOLUTION
// =============================================================================

/**
 * Build dependency map between interfaces
 */
function buildDependencyMap(interfaces: ParsedInterface[]): Record<string, string[]> {
  const dependencies: Record<string, string[]> = {}
  const interfaceNames = new Set(interfaces.map(i => i.name))
  
  for (const iface of interfaces) {
    const deps: string[] = []
    
    // Check extends clause
    if (iface.extends) {
      for (const extended of iface.extends) {
        if (interfaceNames.has(extended)) {
          deps.push(extended)
        }
      }
    }
    
    // Check property types
    for (const prop of iface.properties) {
      if (prop.isObject && interfaceNames.has(prop.type)) {
        deps.push(prop.type)
      }
    }
    
    dependencies[iface.name] = [...new Set(deps)] // Remove duplicates
  }
  
  return dependencies
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get interfaces in dependency order (dependencies first)
 */
export function sortInterfacesByDependencies(
  interfaces: ParsedInterface[],
  dependencies: Record<string, string[]>
): ParsedInterface[] {
  const sorted: ParsedInterface[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  
  function visit(interfaceName: string) {
    if (visiting.has(interfaceName)) {
      // Circular dependency - just add it
      return
    }
    
    if (visited.has(interfaceName)) {
      return
    }
    
    visiting.add(interfaceName)
    
    // Visit dependencies first
    const deps = dependencies[interfaceName] || []
    for (const dep of deps) {
      visit(dep)
    }
    
    visiting.delete(interfaceName)
    visited.add(interfaceName)
    
    // Add the interface
    const iface = interfaces.find(i => i.name === interfaceName)
    if (iface && !sorted.includes(iface)) {
      sorted.push(iface)
    }
  }
  
  // Visit all interfaces
  for (const iface of interfaces) {
    visit(iface.name)
  }
  
  return sorted
}

/**
 * Validate parsed interfaces
 */
export function validateParsedInterfaces(result: ParseResult): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = [...result.errors]
  const warnings: string[] = []
  
  // Check for empty interfaces
  for (const iface of result.interfaces) {
    if (iface.properties.length === 0) {
      warnings.push(`Interface ${iface.name} has no properties`)
    }
  }
  
  // Check for unresolved dependencies
  const interfaceNames = new Set(result.interfaces.map(i => i.name))
  for (const [interfaceName, deps] of Object.entries(result.dependencies)) {
    for (const dep of deps) {
      if (!interfaceNames.has(dep)) {
        errors.push(`Interface ${interfaceName} depends on undefined interface ${dep}`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
