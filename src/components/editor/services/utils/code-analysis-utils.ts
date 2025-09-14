/**
 * 🔍 CODE ANALYSIS UTILITIES
 * 
 * Pure functions for analyzing and extracting information from code text
 */

/**
 * Extract variable names from code assignments
 */
export function extractVariableNames(fullText: string): string[] {
  const variables = new Set<string>()
  
  // Match variable assignments: varName = something
  const assignmentRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
  let match
  
  while ((match = assignmentRegex.exec(fullText)) !== null) {
    const varName = match[1]
    // Skip keywords and short names
    if (varName.length > 2 && !['if', 'and', 'or', 'not', 'in', 'is', 'true', 'false'].includes(varName.toLowerCase())) {
      variables.add(varName)
    }
  }
  
  return Array.from(variables)
}

/**
 * Extract all class names from code
 */
export function extractClassNames(fullText: string): string[] {
  const classNames: string[] = []
  const classRegex = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
  let match

  while ((match = classRegex.exec(fullText)) !== null) {
    const className = match[1]
    // Skip keywords and short names
    if (className.length > 2 && !['if', 'and', 'or', 'not', 'in', 'is', 'true', 'false'].includes(className.toLowerCase())) {
      classNames.push(className)
    }
  }

  return classNames
}

/**
 * Extract all enum names from code
 */
export function extractEnumNames(fullText: string): string[] {
  const enumNames: string[] = []
  const enumRegex = /enum\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
  let match

  while ((match = enumRegex.exec(fullText)) !== null) {
    const enumName = match[1]
    if (enumName.length > 2 && !['if', 'and', 'or', 'not', 'in', 'is', 'true', 'false'].includes(enumName.toLowerCase())) {
      enumNames.push(enumName)
    }
  }

  return enumNames
}

/**
 * Find a class definition in code
 */
export function findClassDefinition(fullText: string, className: string): { classBody: string; match: RegExpMatchArray } | null {
  const classPattern = new RegExp(`class\\s+${className}\\s*\\{([^}]+)\\}`, 'i')
  const classMatch = fullText.match(classPattern)
  
  if (!classMatch) {
    return null
  }
  
  return {
    classBody: classMatch[1],
    match: classMatch
  }
}

/**
 * Extract property assignments from class body
 */
export function extractClassProperties(classBody: string): Array<{ name: string; type: string }> {
  const properties: Array<{ name: string; type: string }> = []
  
  // Extract properties (name = type)
  const propertyPattern = /(\w+)\s*=\s*(\w+|<\w+>)/g
  let propertyMatch
  
  while ((propertyMatch = propertyPattern.exec(classBody)) !== null) {
    const [, propName, propType] = propertyMatch
    properties.push({ name: propName, type: propType })
  }
  
  return properties
}

/**
 * Extract method definitions from class body
 */
export function extractClassMethods(classBody: string): Array<{ name: string; returnType: string }> {
  const methods: Array<{ name: string; returnType: string }> = []
  
  // Extract methods (name -> returnType)
  const methodPattern = /(\w+)\s*->\s*(\w+|<\w+>)/g
  let methodMatch
  
  while ((methodMatch = methodPattern.exec(classBody)) !== null) {
    const [, methodName, returnType] = methodMatch
    methods.push({ name: methodName, returnType })
  }
  
  return methods
}

/**
 * Check if a class exists in the code
 */
export function classExistsInCode(fullText: string, className: string): boolean {
  const classDefinitionRegex = new RegExp(`class\\s+${className}\\s*\\{`, 'i')
  return classDefinitionRegex.test(fullText)
}

/**
 * Check if an enum exists in the code
 */
export function enumExistsInCode(fullText: string, enumName: string): boolean {
  const enumDefinitionRegex = new RegExp(`enum\\s+${enumName}\\s*\\{`, 'i')
  return enumDefinitionRegex.test(fullText)
}

/**
 * Find all class definitions for debugging
 */
export function findAllClassDefinitions(fullText: string): Array<{ name: string; body: string }> {
  const classes: Array<{ name: string; body: string }> = []
  const anyClassPattern = /class\s+(\w+)\s*\{([^}]+)\}/gi
  const allClasses = [...fullText.matchAll(anyClassPattern)]
  
  allClasses.forEach(match => {
    classes.push({
      name: match[1],
      body: match[2]
    })
  })
  
  return classes
}

/**
 * Find all assignments for debugging
 */
export function findAllAssignments(text: string): Array<{ variable: string; value: string }> {
  const assignments: Array<{ variable: string; value: string }> = []
  const debugAssignmentPattern = /(\w+)\s*=\s*(.+)/g
  const allAssignments = [...text.matchAll(debugAssignmentPattern)]
  
  allAssignments.forEach(match => {
    assignments.push({
      variable: match[1],
      value: match[2].trim()
    })
  })
  
  return assignments
} 