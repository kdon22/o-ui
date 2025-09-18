/**
 * 🎯 MASTER TYPE DETECTION SYSTEM - Single Source of Truth
 * 
 * This is the ONLY type detection system used throughout the entire editor.
 * Handles ALL scenarios: assignments, loops, property chains, class definitions.
 * 
 * Replaces ALL other parsers:
 * - VariableParser ❌ DELETED
 * - LiteralParser ❌ DELETED  
 * - LoopParser element type logic ❌ DELETED
 * - Multiple competing systems ❌ DELETED
 */

import type * as monaco from 'monaco-editor'
import type { UnifiedType } from '@/lib/editor/schemas'
import { schemaBridge } from '@/lib/editor/type-system/schema-bridge'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'
import { getDisplayName } from '@/lib/editor/schemas/types/unified-types'

// =============================================================================
// MASTER TYPE DETECTION INTERFACE
// =============================================================================

export interface MasterTypeInfo {
  name: string
  type: UnifiedType
  elementType?: UnifiedType  // For arrays/collections
  confidence: number
  source: 'literal' | 'assignment' | 'class_definition' | 'property_chain' | 'method_call' | 'loop_variable'
  evidence: string
  properties?: Record<string, UnifiedType>  // For class types
  methods?: string[]  // Available methods for this type
}

export interface ClassDefinition {
  name: string
  properties: Record<string, UnifiedType>
  methods: Record<string, { returnType: UnifiedType; params: Array<{ name: string; type: UnifiedType }> }>
}

// =============================================================================
// MASTER TYPE DETECTION SYSTEM
// =============================================================================

export class MasterTypeDetector {
  private typeCache = new Map<string, MasterTypeInfo>()
  private classDefinitions = new Map<string, ClassDefinition>()
  private lastTextHash: string = ''
  private currentText: string = ''
  private parsingInProgress = false  // 🚨 Recursion guard

  /**
   * 🎯 MAIN METHOD: Detect ANY variable type in ANY context
   * This is the ONLY method used throughout the system
   */
  detectType(variableName: string, allText: string, context?: 'assignment' | 'loop_element' | 'property_access'): MasterTypeInfo {
    // 🚨 RECURSION GUARD: Prevent infinite loops during class parsing
    if (this.parsingInProgress) {
      console.log(`[MasterTypeDetector] 🚨 Recursion detected, returning fallback for: ${variableName}`)
      return {
        name: variableName,
        type: 'unknown',
        confidence: 0.1,
        source: 'literal',
        evidence: 'recursion_fallback'
      }
    }

    // Invalidate cache if text changed
    const textHash = this.hashString(allText)
    if (textHash !== this.lastTextHash) {
      console.log(`[MasterTypeDetector] Text changed, clearing cache and re-parsing classes`)
      this.typeCache.clear()
      
      // 🚨 Set guard before parsing to prevent recursion
      this.parsingInProgress = true
      try {
        this.parseClassDefinitions(allText)
      } finally {
        this.parsingInProgress = false
      }
      
      this.lastTextHash = textHash
      this.currentText = allText
    }

    const cacheKey = `${variableName}:${context || 'default'}:${textHash}`
    
    if (this.typeCache.has(cacheKey)) {
      const cached = this.typeCache.get(cacheKey)!
      console.log(`[MasterTypeDetector] Using cached result for "${variableName}":`, cached)
      return cached
    }

    console.log(`[MasterTypeDetector] Detecting type for "${variableName}" in context "${context || 'default'}"`)

    let result: MasterTypeInfo

    // Context-specific detection
    if (context === 'loop_element') {
      result = this.detectLoopElementType(variableName, allText)
    } else if (context === 'property_access') {
      result = this.detectPropertyAccessType(variableName, allText)
    } else {
      result = this.detectVariableType(variableName, allText)
    }

    // Cache and return
    this.typeCache.set(cacheKey, result)
    console.log(`[MasterTypeDetector] Final result for "${variableName}":`, result)
    return result
  }

  /**
   * 🎯 DETECT VARIABLE TYPE FROM ASSIGNMENTS
   */
  private detectVariableType(variableName: string, allText: string): MasterTypeInfo {
    const lines = allText.split('\n')
    let bestMatch: MasterTypeInfo = {
      name: variableName,
      type: 'unknown',
      confidence: 0.0,
      source: 'assignment',
      evidence: 'No assignment found',
      methods: []
    }

    // Scan all lines for variable assignments
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip non-assignment lines
      if (!trimmed.includes('=') || trimmed.startsWith('//') || trimmed.startsWith('class ')) {
        continue
      }

      const assignmentMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/)
      if (!assignmentMatch || assignmentMatch[1] !== variableName) {
        continue
      }

      const [, lhs, rhs] = assignmentMatch
      console.log(`[MasterTypeDetector] Found assignment: ${lhs} = ${rhs}`)

      const typeInfo = this.analyzeRightHandSide(rhs, allText)
      if (typeInfo.confidence > bestMatch.confidence) {
        bestMatch = {
          name: variableName,
          type: typeInfo.type,
          elementType: typeInfo.elementType,
          confidence: typeInfo.confidence,
          source: 'assignment',
          evidence: trimmed,
          properties: typeInfo.properties,
          methods: this.getMethodsForType(typeInfo.type)
        }

        // Perfect match found
        if (typeInfo.confidence === 1.0) {
          break
        }
      }
    }

    return bestMatch
  }

  /**
   * 🎯 ANALYZE RIGHT-HAND SIDE OF ASSIGNMENTS
   */
  private analyzeRightHandSide(rhs: string, allText: string): { type: UnifiedType; elementType?: UnifiedType; confidence: number; properties?: Record<string, UnifiedType> } {
    const trimmedRhs = rhs.trim()

    // 1. STRING LITERALS
    if (/^["'].*["']$/.test(trimmedRhs)) {
      return { type: 'string', confidence: 1.0 }
    }

    // 2. NUMBER LITERALS
    if (/^\d+$/.test(trimmedRhs)) {
      return { type: 'number', confidence: 1.0 }
    }
    if (/^\d+\.\d+$/.test(trimmedRhs)) {
      return { type: 'float', confidence: 1.0 }
    }

    // 3. BOOLEAN LITERALS
    if (/^(true|false|True|False|TRUE|FALSE)$/i.test(trimmedRhs)) {
      return { type: 'boolean', confidence: 1.0 }
    }

    // 4. ARRAY LITERALS - CRITICAL FIX
    if (/^\[.*\]$/.test(trimmedRhs)) {
      return this.analyzeArrayLiteral(trimmedRhs)
    }

    // 5. OBJECT LITERALS
    if (/^\{.*\}$/.test(trimmedRhs)) {
      return { type: 'dictionary', confidence: 1.0 }
    }

    // 6. CLASS CONSTRUCTOR CALLS
    const constructorMatch = trimmedRhs.match(/^([A-Z][a-zA-Z0-9_]*)\s*\(\s*\)$/)
    if (constructorMatch) {
      const className = constructorMatch[1]
      const classDef = this.classDefinitions.get(className)
      if (classDef) {
        return { 
          type: className as UnifiedType, 
          confidence: 1.0,
          properties: classDef.properties
        }
      }
      return { type: className as UnifiedType, confidence: 0.8 }
    }

    // 7. VARIABLE ALIASES (x = y)
    const aliasMatch = trimmedRhs.match(/^([a-zA-Z_][a-zA-Z0-9_]*)$/)
    if (aliasMatch) {
      const sourceVar = aliasMatch[1]
      const sourceType = this.detectType(sourceVar, allText)
      if (sourceType.confidence > 0.5) {
        return { 
          type: sourceType.type, 
          elementType: sourceType.elementType,
          confidence: sourceType.confidence * 0.9,
          properties: sourceType.properties
        }
      }
    }

    // 8. METHOD/CHAIN CALLS (var.method(), var.method, chaining)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\./.test(trimmedRhs)) {
      const chainType = this.analyzeMethodOrPropertyChain(trimmedRhs, allText)
      if (chainType.type !== 'unknown') return chainType
    }

    return { type: 'unknown', confidence: 0.0 }
  }

  /** Analyze chained method/property and infer final type */
  private analyzeMethodOrPropertyChain(chainExpr: string, allText: string): { type: UnifiedType; elementType?: UnifiedType; confidence: number; properties?: Record<string, UnifiedType> } {
    try {
      const parts = this.splitChain(chainExpr)
      if (parts.length === 0) return { type: 'unknown', confidence: 0.0 }

      const baseVar = parts[0]
      let current: UnifiedType = this.detectType(baseVar, allText).type
      let confidence = 0.7

      for (let i = 1; i < parts.length; i++) {
        const seg = parts[i]
        const m = seg.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\(.*\))?$/)
        if (!m) return { type: 'unknown', confidence: 0.3 }
        const name = m[1]

        // Method via schema
        const schema = (ALL_METHOD_SCHEMAS as any[]).find(s => s.name === name)
        if (schema) {
          let ret: any = schemaBridge.getTypeMethodReturnType(String(current), name)
          if (!ret || ret === 'unknown') ret = schema.returnType || (schema.returnInterface ? 'object' : 'unknown')
          if (ret && ret !== 'unknown') { 
            current = ret as UnifiedType
            confidence = Math.min(1.0, confidence + 0.2)
            continue 
          }
        }

        // Property fallback
        const propType = schemaBridge.getBusinessObjectPropertyType(String(current), name, allText)
        if (propType && propType !== 'unknown') { 
          current = propType as UnifiedType
          confidence = Math.min(1.0, confidence + 0.1)
          continue 
        }

        return { type: 'unknown', confidence: 0.3 }
      }

      return { type: current, confidence }
    } catch { 
      return { type: 'unknown', confidence: 0.0 } 
    }
  }

  /** Split a.b().c into tokens respecting parentheses */
  private splitChain(expr: string): string[] {
    const s = expr.trim()
    const tokens: string[] = []
    let current = ''
    let depth = 0
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (ch === '(') depth++
      if (ch === ')') depth = Math.max(0, depth - 1)
      if (ch === '.' && depth === 0) { 
        if (current) tokens.push(current)
        current = ''
        continue 
      }
      current += ch
    }
    if (current) tokens.push(current)
    return tokens
  }

  /**
   * 🎯 ANALYZE ARRAY LITERALS - DETECT ELEMENT TYPES
   */
  private analyzeArrayLiteral(arrayLiteral: string): { type: UnifiedType; elementType?: UnifiedType; confidence: number } {
    const inner = arrayLiteral.slice(1, -1).trim()
    
    if (inner.length === 0) {
      return { type: 'array', confidence: 1.0 }
    }

    // Split by commas and analyze elements
    const elements = inner.split(',').map(e => e.trim()).filter(Boolean)
    
    if (elements.length === 0) {
      return { type: 'array', confidence: 1.0 }
    }

    // Analyze first few elements to determine type
    const elementTypes = new Set<UnifiedType>()
    
    for (const element of elements.slice(0, 5)) { // Check first 5 elements
      let elementType: UnifiedType = 'unknown'

      // String elements
      if (/^["'].*["']$/.test(element)) {
        elementType = 'string'
      }
      // Number elements  
      else if (/^\d+$/.test(element)) {
        elementType = 'number'
      }
      // Float elements
      else if (/^\d+\.\d+$/.test(element)) {
        elementType = 'float'
      }
      // Boolean elements
      else if (/^(true|false|True|False|TRUE|FALSE)$/i.test(element)) {
        elementType = 'boolean'
      }
      // Variable references - need to detect their type
      else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(element)) {
        // This is a variable reference, we need to detect its actual type
        console.log(`[MasterTypeDetector] Array element "${element}" is a variable reference, detecting its type...`)
        
        // Look up the variable type from assignments in the same text
        // We need to avoid infinite recursion, so we'll do a simple lookup
        const lines = this.getCurrentText().split('\n')
        let foundType: UnifiedType = 'unknown'
        
        for (const line of lines) {
          const assignMatch = line.trim().match(new RegExp(`^${element}\\s*=\\s*(.+)$`))
          if (assignMatch) {
            const rhs = assignMatch[1].trim()
            // Simple type detection for the RHS
            if (/^["'].*["']$/.test(rhs)) {
              foundType = 'string'
            } else if (/^\d+$/.test(rhs)) {
              foundType = 'number'
            } else if (/^[A-Z][a-zA-Z0-9_]*\s*\(\s*\)$/.test(rhs)) {
              // Constructor call
              const className = rhs.match(/^([A-Z][a-zA-Z0-9_]*)/)?.[1]
              if (className) foundType = className as UnifiedType
            }
            break
          }
        }
        
        elementType = foundType
        console.log(`[MasterTypeDetector] Variable "${element}" resolved to type: ${elementType}`)
        
        // If still unknown, use capitalized fallback
        if (elementType === 'unknown') {
          elementType = this.capitalizeFirst(element) as UnifiedType
          console.log(`[MasterTypeDetector] Using capitalized fallback for "${element}": ${elementType}`)
        }
      }

      elementTypes.add(elementType)
    }

    // If all elements have the same type, use that as element type
    if (elementTypes.size === 1) {
      const elementType = Array.from(elementTypes)[0]
      console.log(`[MasterTypeDetector] Array literal has uniform element type: ${elementType}`)
      return { 
        type: 'array', 
        elementType: elementType,
        confidence: 1.0 
      }
    }

    // Mixed types - just return generic array
    console.log(`[MasterTypeDetector] Array literal has mixed element types:`, Array.from(elementTypes))
    return { type: 'array', confidence: 1.0 }
  }

  /**
   * 🎯 DETECT LOOP ELEMENT TYPE - CRITICAL FIX
   */
  private detectLoopElementType(loopVar: string, allText: string): MasterTypeInfo {
    console.log(`[MasterTypeDetector] Detecting loop element type for: ${loopVar}`)

    // Find the for loop line
    const lines = allText.split('\n')
    let collectionVar: string | null = null

    for (const line of lines) {
      const forMatch = line.trim().match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*$/)
      if (forMatch && forMatch[1] === loopVar) {
        collectionVar = forMatch[2]
        console.log(`[MasterTypeDetector] Found for loop: ${loopVar} in ${collectionVar}`)
        break
      }
    }

    if (!collectionVar) {
      console.log(`[MasterTypeDetector] Could not find for loop for variable: ${loopVar}`)
      return {
        name: loopVar,
        type: 'unknown',
        confidence: 0.0,
        source: 'loop_variable',
        evidence: 'Loop not found',
        methods: []
      }
    }

    // Get the collection type
    const collectionType = this.detectType(collectionVar, allText)
    console.log(`[MasterTypeDetector] Collection "${collectionVar}" has type:`, collectionType)

    // If collection has an element type, use that
    if (collectionType.elementType) {
      console.log(`[MasterTypeDetector] Using element type: ${collectionType.elementType}`)
      
      // Get class definition for the element type if it's a class
      const classDef = this.classDefinitions.get(collectionType.elementType as string)
      
      return {
        name: loopVar,
        type: collectionType.elementType,
        confidence: collectionType.confidence,
        source: 'loop_variable',
        evidence: `Element of ${collectionVar}`,
        properties: classDef?.properties,
        methods: this.getMethodsForType(collectionType.elementType)
      }
    }

    // Fallback: if collection is an array but no element type detected
    if (collectionType.type === 'array' || collectionType.type === 'list') {
      console.log(`[MasterTypeDetector] Collection is array but no element type, using unknown`)
      return {
        name: loopVar,
        type: 'unknown',
        confidence: 0.5,
        source: 'loop_variable',
        evidence: `Element of array ${collectionVar}`,
        methods: []
      }
    }

    // If collection is a class type, assume it's a collection of that class
    if (this.classDefinitions.has(collectionType.type as string)) {
      console.log(`[MasterTypeDetector] Collection is class type, using as element type: ${collectionType.type}`)
      return {
        name: loopVar,
        type: collectionType.type,
        confidence: collectionType.confidence * 0.9,
        source: 'loop_variable',
        evidence: `Element of ${collectionVar}`,
        properties: collectionType.properties,
        methods: this.getMethodsForType(collectionType.type)
      }
    }

    console.log(`[MasterTypeDetector] Could not determine element type for: ${collectionVar}`)
    return {
      name: loopVar,
      type: 'unknown',
      confidence: 0.0,
      source: 'loop_variable',
      evidence: `Unknown element type of ${collectionVar}`,
      methods: []
    }
  }

  /**
   * 🎯 DETECT PROPERTY ACCESS TYPE
   */
  private detectPropertyAccessType(propertyPath: string, allText: string): MasterTypeInfo {
    console.log(`[MasterTypeDetector] Detecting property access type for: ${propertyPath}`)

    const parts = propertyPath.split('.')
    if (parts.length < 2) {
      return this.detectVariableType(propertyPath, allText)
    }

    // Start with the base variable
    let currentType = this.detectType(parts[0], allText)
    console.log(`[MasterTypeDetector] Base variable "${parts[0]}" has type:`, currentType)

    // Walk the property chain
    for (let i = 1; i < parts.length; i++) {
      const property = parts[i]
      console.log(`[MasterTypeDetector] Resolving property "${property}" on type "${currentType.type}"`)

      // If current type is a class, look up the property
      if (currentType.properties && currentType.properties[property]) {
        const propertyType = currentType.properties[property]
        console.log(`[MasterTypeDetector] 🎯 Found property "${property}" with type: ${propertyType}`)
        
        // Get class definition for the property type if it's a class
        const classDef = this.classDefinitions.get(propertyType as string)
        currentType = {
          name: `${parts.slice(0, i + 1).join('.')}`,
          type: propertyType,
          confidence: currentType.confidence * 0.9,
          source: 'property_chain',
          evidence: `Property ${property} of ${currentType.type}`,
          properties: classDef?.properties,
          methods: this.getMethodsForType(propertyType)
        }
      } else {
        console.log(`[MasterTypeDetector] ❌ Property "${property}" not found on type "${currentType.type}"`)
        console.log(`[MasterTypeDetector] ❌ Available properties:`, currentType.properties)
        console.log(`[MasterTypeDetector] ❌ Class definitions:`, Array.from(this.classDefinitions.keys()))
        return {
          name: propertyPath,
          type: 'unknown',
          confidence: 0.0,
          source: 'property_chain',
          evidence: `Property ${property} not found on ${currentType.type}`,
          methods: []
        }
      }
    }

    return currentType
  }

  /**
   * 🎯 PARSE CLASS DEFINITIONS FROM CODE
   */
  private parseClassDefinitions(allText: string): void {
    console.log(`[MasterTypeDetector] Parsing class definitions...`)
    this.classDefinitions.clear()

    const lines = allText.split('\n')
    let currentClass: { name: string; properties: Record<string, UnifiedType> } | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Start of class definition
      const classMatch = line.match(/^class\s+([A-Z][a-zA-Z0-9_]*)\s*\{?\s*$/)
      if (classMatch) {
        const className = classMatch[1]
        console.log(`[MasterTypeDetector] Found class: ${className}`)
        currentClass = { name: className, properties: {} }
        continue
      }

      // End of class definition
      if (line === '}' && currentClass) {
        console.log(`[MasterTypeDetector] 🎯 COMPLETED CLASS: ${currentClass.name}`, currentClass.properties)
        this.classDefinitions.set(currentClass.name, {
          name: currentClass.name,
          properties: currentClass.properties,
          methods: {} // TODO: Parse methods
        })
        console.log(`[MasterTypeDetector] 🎯 TOTAL CLASSES NOW: ${this.classDefinitions.size}`)
        currentClass = null
        continue
      }

      // Property assignment within class
      if (currentClass && line.includes('=')) {
        const propMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/)
        if (propMatch) {
          const [, propName, propValue] = propMatch
          const propType = this.analyzeRightHandSide(propValue, allText)
          currentClass.properties[propName] = propType.type
          console.log(`[MasterTypeDetector] 🎯 Class ${currentClass.name} property: ${propName} = ${propType.type}`)
        }
      }
    }
  }

  /**
   * 🎯 GET AVAILABLE METHODS FOR A TYPE
   */
  private getMethodsForType(type: UnifiedType): string[] {
    // TODO: Implement method lookup from schemas
    const methodMap: Record<string, string[]> = {
      'string': ['toUpperCase', 'toLowerCase', 'substring', 'indexOf', 'replace'],
      'number': ['toString', 'toFixed', 'toPrecision'],
      'float': ['toString', 'toFixed', 'toPrecision'],
      'boolean': ['toString'],
      'array': ['length', 'push', 'pop', 'slice', 'indexOf', 'forEach'],
      'dictionary': ['keys', 'values', 'hasOwnProperty']
    }
    return methodMap[type as string] || []
  }

  /**
   * 🎯 UTILITY METHODS
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private getCurrentText(): string {
    // Return the last text we processed
    return this.currentText || ''
  }

  /**
   * 🎯 PUBLIC API FOR OTHER SYSTEMS
   */
  getClassDefinitions(): Map<string, ClassDefinition> {
    return this.classDefinitions
  }

  clearCache(): void {
    this.typeCache.clear()
  }
}

// =============================================================================
// SINGLETON INSTANCE - SINGLE SOURCE OF TRUTH
// =============================================================================

export const masterTypeDetector = new MasterTypeDetector()

/**
 * 🎯 MAIN API - Use this everywhere in the codebase
 */
export function detectVariableType(variableName: string, allText: string, context?: 'assignment' | 'loop_element' | 'property_access'): MasterTypeInfo {
  return masterTypeDetector.detectType(variableName, allText, context)
}

/**
 * 🎯 CONVENIENCE API for loop elements
 */
export function detectLoopElementType(loopVar: string, allText: string): MasterTypeInfo {
  return masterTypeDetector.detectType(loopVar, allText, 'loop_element')
}

/**
 * 🎯 CONVENIENCE API for property chains
 */
export function detectPropertyType(propertyPath: string, allText: string): MasterTypeInfo {
  return masterTypeDetector.detectType(propertyPath, allText, 'property_access')
}
