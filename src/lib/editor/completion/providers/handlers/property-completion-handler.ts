// Property completion handler
// Handles property access completions for variables and modules

import type * as monaco from 'monaco-editor'
import { typeInferenceService } from '@/lib/editor/completion/type-inference-service'
import { sqlAssignmentCompletion } from '@/lib/editor/completion/sql-assignment-completion'
import { sqlQueryAnalyzer } from '../../sql-query-analyzer'
import { sqlProvider } from '@/lib/editor/sql/sql-provider'
import { getModuleMethodSuggestions } from '../utils/module-completion-utils'
import { getTypeSpecificCompletions, normalizeTypeForMethods } from '../utils/type-completion-utils'
import { handleArrayIndexing, ArrayIndexingResult } from '../utils/array-indexing-utils'
// Removed interface registry import - using built-in interface definitions instead

// Array indexing utilities are now imported from utils/array-indexing-utils

/**
 * Resolve element type from collection property
 * For example: "utr.accountingData" -> "AccountingEntry"
 */
async function resolveElementType(collectionType: string, propertyPath: string, model: monaco.editor.ITextModel): Promise<string | null> {
  try {
    console.log(`[ElementTypeResolver] Resolving element type for collection "${collectionType}" at path "${propertyPath}"`)
    
    // Use our NestedTypeFactory to resolve the element type
    const { createNestedTypeFactory } = await import('../../../type-system/nested-type-factory')
    const allText = model.getValue()
    const nestedTypeFactory = await createNestedTypeFactory(allText)
    
    // Split the property path to get the collection property
    const parts = propertyPath.split('.')
    if (parts.length >= 2) {
      const baseVar = parts[0] // e.g., "utr"
      const collectionProp = parts[parts.length - 1] // e.g., "accountingData"
      
      // Get the type definition for the base variable
      const baseType = nestedTypeFactory.getType(collectionType)
      if (baseType) {
        // Find the collection property
        const property = baseType.properties.find((p: any) => p.name === collectionProp)
        if (property && property.isCollection && property.elementType) {
          console.log(`[ElementTypeResolver] Found element type: "${property.elementType}" for collection "${collectionProp}"`)
          return property.elementType
        }
      }
    }
    
    console.log(`[ElementTypeResolver] Could not resolve element type for "${propertyPath}"`)
    return null
    
  } catch (error) {
    console.error(`[ElementTypeResolver] Error resolving element type:`, error)
    return null
  }
}

/**
 * Resolve element type from a complex property path
 * For example: "utr.accountingData" -> "AccountingEntry"
 */
async function resolveElementTypeFromPath(propertyPath: string, model: monaco.editor.ITextModel): Promise<string | null> {
  try {
    console.log(`[ElementTypeFromPath] Resolving element type from path: "${propertyPath}"`)
    
    // Use our NestedTypeFactory to resolve the element type
    const { createNestedTypeFactory } = await import('../../../type-system/nested-type-factory')
    const allText = model.getValue()
    const nestedTypeFactory = await createNestedTypeFactory(allText)
    
    // Split the property path
    const parts = propertyPath.split('.')
    console.log(`[ElementTypeFromPath] Path parts:`, parts)
    
    if (parts.length >= 2) {
      const baseVar = parts[0] // e.g., "utr"
      
      // First, get the base variable type (e.g., "UTR")
      const { typeInferenceService } = await import('@/lib/editor/completion/type-inference-service')
      const baseType = typeInferenceService.getTypeOf(baseVar)
      console.log(`[ElementTypeFromPath] Base variable "${baseVar}" has type: "${baseType}"`)
      
      if (baseType && baseType !== 'unknown') {
        // Navigate through the property chain to find the collection
        let currentType = baseType
        const typeDefinition = nestedTypeFactory.getType(currentType)
        
        if (typeDefinition) {
          console.log(`[ElementTypeFromPath] Found type definition for "${currentType}" with ${typeDefinition.properties.length} properties`)
          
          // Navigate through the property chain
          for (let i = 1; i < parts.length; i++) {
            const propName = parts[i]
            console.log(`[ElementTypeFromPath] Looking for property "${propName}" in type "${currentType}"`)
            
            const property = typeDefinition.properties.find((p: any) => p.name === propName)
            if (property) {
              console.log(`[ElementTypeFromPath] Found property "${propName}":`, {
                type: property.type,
                isCollection: property.isCollection,
                elementType: property.elementType
              })
              
              // If this is the last property and it's a collection, return element type
              if (i === parts.length - 1 && property.isCollection && property.elementType) {
                console.log(`[ElementTypeFromPath] Found collection element type: "${property.elementType}"`)
                return property.elementType
              }
              
              // Otherwise, continue navigating
              currentType = property.type
              // Note: We'd need to get the next type definition here for deeper navigation
            } else {
              console.log(`[ElementTypeFromPath] Property "${propName}" not found in type "${currentType}"`)
              break
            }
          }
        }
      }
    }
    
    console.log(`[ElementTypeFromPath] Could not resolve element type for path "${propertyPath}"`)
    return null
    
  } catch (error) {
    console.error(`[ElementTypeFromPath] Error resolving element type:`, error)
    return null
  }
}

/**
 * Built-in interface definitions for common return types
 */
const BUILT_IN_INTERFACES: Record<string, Array<{label: string, type: string, description: string}>> = {
  'HttpResponse': [
    { label: 'statusCode', type: 'number', description: 'HTTP status code (200, 404, etc.)' },
    { label: 'error', type: 'string | null', description: 'Error message if request failed' },
    { label: 'response', type: 'object', description: 'Response data from the API' }
  ],
  'DateParseResult': [
    { label: 'date', type: 'Date', description: 'Parsed date object' },
    { label: 'timestamp', type: 'number', description: 'Unix timestamp in milliseconds' },
    { label: 'iso', type: 'string', description: 'ISO 8601 formatted date string' },
    { label: 'formatted', type: 'string', description: 'Human-readable formatted date' }
  ],
  'DateAddResult': [
    { label: 'original', type: 'Date', description: 'Original date before addition' },
    { label: 'result', type: 'Date', description: 'Date after adding the specified amount' },
    { label: 'difference', type: 'number', description: 'Difference in milliseconds' }
  ],
  'ArrayFirstResult': [
    { label: 'value', type: 'any', description: 'First element of the array' },
    { label: 'index', type: 'number', description: 'Index of the first element (0)' },
    { label: 'found', type: 'boolean', description: 'Whether an element was found' }
  ],
  'ArrayLastResult': [
    { label: 'value', type: 'any', description: 'Last element of the array' },
    { label: 'index', type: 'number', description: 'Index of the last element' },
    { label: 'found', type: 'boolean', description: 'Whether an element was found' }
  ],
  'JsonParseResult': [
    { label: 'data', type: 'any', description: 'Parsed JSON data' },
    { label: 'valid', type: 'boolean', description: 'Whether parsing was successful' },
    { label: 'error', type: 'string', description: 'Error message if parsing failed' }
  ]
}

/**
 * Get interface completions if schema has returnInterface
 */
async function getInterfaceCompletions(
  schema: any,
  monacoInstance: typeof monaco
): Promise<monaco.languages.CompletionItem[] | null> {
  if (!schema?.returnInterface) {
    return null
  }

  try {
    // Check built-in interfaces first
    const interfaceProperties = BUILT_IN_INTERFACES[schema.returnInterface]
    if (interfaceProperties) {
      console.log(`[PropertyCompletionHandler] Found built-in interface "${schema.returnInterface}" with ${interfaceProperties.length} properties`)
      
      // Convert to Monaco completion items
      return interfaceProperties.map(prop => ({
        label: prop.label,
        kind: monacoInstance.languages.CompletionItemKind.Property,
        insertText: prop.label,
        detail: `${prop.label}: ${prop.type}`, // Rich detail like Master System
        documentation: prop.description || `**${prop.label}** → *${prop.type}*\n\n**Source:** interface\n**Evidence:** Interface property`, // Rich documentation like Master System
        sortText: `interface_${prop.label}`
      } as monaco.languages.CompletionItem))
    }
    
    // Note: User-defined interfaces could be added here in the future
    // For now, we only support built-in interfaces defined above
  } catch (error) {
    console.error(`[PropertyCompletionHandler] Error getting interface completions:`, error)
  }

  return null
}

export const propertyCompletionHandler = {
  async handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    trimmed: string
  ): Promise<monaco.languages.CompletionList | undefined> {
    // Property access: variable.
    if (trimmed.endsWith('.')) {
      console.log(`[PropertyCompletionHandler] Property access detected, trimmed: "${trimmed}"`)
      const base = trimmed.slice(0, -1).split(/\s+/).pop() || ''
      console.log(`[PropertyCompletionHandler] base extracted: "${base}"`)

      // Module access (e.g., http. or Math.) — support lowercase module names from schema
      if (/^[A-Za-z][A-Za-z0-9_]*$/.test(base)) {
        const methods = getModuleMethodSuggestions(monacoInstance, base)
        if (methods && methods.length > 0) {
          console.log(`[PropertyCompletionHandler] Module access detected for "${base}" with ${methods.length} methods`)
          return { suggestions: methods }
        }
        // If not a known module, fall through to variable/property access
      }
      
      // Variable/property access (including array indexing like obj.prop[0])
      if (/^[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*|\[\d+\])*$/.test(base)) {
        console.log(`[PropertyCompletionHandler] Variable/property access detected: "${base}"`)

        // Handle array indexing: convert "utr.accountingData[0]" to "utr.accountingData" + element type resolution
        const cleanBase = handleArrayIndexing(base)
        console.log(`[PropertyCompletionHandler] After array indexing cleanup: "${cleanBase.path}" (isArrayAccess: ${cleanBase.isArrayAccess})`)

        // Get the variable type from the type inference service
        const allText = model.getValue()
        console.log(`[PropertyCompletionHandler] Getting variable type for base: "${cleanBase.path}"`)
        const variableType = getVariableType(cleanBase.path, allText)
        console.log(`[PropertyCompletionHandler] Variable "${cleanBase.path}" has type: "${variableType}"`)

        // Get known variables from type inference service
        const known = typeInferenceService.getVariables().reduce((acc, v) => {
          acc[v.name] = v.type
          return acc
        }, {} as Record<string, string>)

        console.log(`[PropertyCompletionHandler] All known variables:`, known)
        console.log(`[PropertyCompletionHandler] Looking for base variable: "${cleanBase.path}"`)
        console.log(`[PropertyCompletionHandler] Type of "${cleanBase.path}" from known variables:`, known[cleanBase.path.split('.')[0]])

        // For simple variable access like "num.", use type directly
        if (!cleanBase.path.includes('.')) {
          let varType = known[cleanBase.path]
          console.log(`[PropertyCompletionHandler] Simple variable "${cleanBase.path}" has type: "${varType}"`)

          // If this is array access, resolve the element type. For SQL results
          // we convert queryrows:<table> → queryrow:<table> directly.
          if (cleanBase.isArrayAccess && varType) {
            console.log(`[PropertyCompletionHandler] Array access detected, resolving element type for: "${varType}"`)
            if (typeof varType === 'string' && varType.startsWith('queryrows:')) {
              const table = varType.substring('queryrows:'.length)
              varType = `queryrow:${table}`
              console.log(`[PropertyCompletionHandler] Converted SQL list type to row type: "${varType}"`)
            } else {
              const elementType = await resolveElementType(varType, cleanBase.path, model)
              if (elementType) {
                varType = elementType
                console.log(`[PropertyCompletionHandler] Resolved element type: "${elementType}"`)
              }
            }
          }

          // Normalize primitive synonyms (e.g., str -> string)
          const normalizePrimitive = (t: string) => (
            t === 'str' ? 'string' : t === 'int' ? 'number' : t
          )
          if (varType) varType = normalizePrimitive(varType)

          // Special handling for SQL query result types
          // If the base variable is a SELECT result list (queryrows:*), do not allow direct property access.
          // Columns should be suggested only when indexing or inside a loop (handled later in this file).
          if (varType && varType.startsWith('queryrows:')) {
            // Explicitly return an empty list to block downstream fallbacks
            return { suggestions: [] }
          }
          // Back-compat: older cached type queryrow:* meant a row type; treat like queryrows when used as a variable base
          if (varType && varType.startsWith('queryrow:')) {
            const tableName = varType.substring(9)
            try {
              // Rebuild analyzer to detect variable→SELECT mapping
              sqlQueryAnalyzer.rebuild(model)
              // Map loop variable back to its collection variable (e.g., for i in new23)
              // Search only up to current cursor line for most recent match
              let mappingVar = cleanBase.path
              try {
                const textUpToHere = model.getValueInRange(new monacoInstance.Range(1, 1, position.lineNumber, position.column))
                const loopRe = new RegExp(`\\bfor\\s+${cleanBase.path}\\s+in\\s+([A-Za-z_][\\w]*)`, 'ig')
                let m: RegExpExecArray | null = null
                let last: string | null = null
                while ((m = loopRe.exec(textUpToHere)) !== null) { last = m[1] }
                if (last) mappingVar = last
              } catch {}

              const mapping = sqlQueryAnalyzer.getMappingForVariable(mappingVar)
              const resolved = await sqlProvider.resolveTableIdentifier(tableName)
              if (!resolved) return undefined
              const allCols = await sqlProvider.getColumns(resolved)

              const allowed = Array.isArray(mapping?.columns) ? new Set(mapping!.columns as string[]) : null
              const filtered = allowed ? allCols.filter(c => allowed.has(c.name)) : allCols
              const suggestions = filtered.map(column => ({
                label: column.name,
                kind: monacoInstance.languages.CompletionItemKind.Field,
                insertText: column.name,
                detail: `${column.name}: ${normalizeTypeForMethods(column.type || 'string')}${column.nullable ? ' | null' : ''}${column.primaryKey ? ' | PK' : ''}`, // Rich detail like Master System
                documentation: column.description || `**${column.name}** → *${normalizeTypeForMethods(column.type || 'string')}*\n\n**Source:** database\n**Evidence:** Column from ${resolved} table`, // Rich documentation like Master System
                sortText: column.primaryKey ? `0_${column.name}` : `1_${column.name}`
              } as monaco.languages.CompletionItem))
              return { suggestions }
            } catch {
              return undefined
            }
          }

          if (varType && varType !== 'unknown') {
            // 🎯 UNIFIED APPROACH: Single system for all completions
            console.log(`[PropertyCompletionHandler] Getting unified completions for "${cleanBase.path}" with type: "${varType}"`)
            const allText = model.getValue()
            
            // Check built-in interfaces first (highest priority)
            const interfaceProperties = BUILT_IN_INTERFACES[varType]
            if (interfaceProperties) {
              console.log(`[PropertyCompletionHandler] Found built-in interface "${varType}" with ${interfaceProperties.length} properties`)
              
              const interfaceSuggestions = interfaceProperties.map(prop => ({
                label: prop.label,
                kind: monacoInstance.languages.CompletionItemKind.Property,
                insertText: prop.label,
                detail: `${prop.label}: ${prop.type}`,
                documentation: prop.description || `**${prop.label}** → *${prop.type}*\n\n**Source:** interface\n**Evidence:** Interface property`,
                sortText: `0_${prop.label}`
              } as monaco.languages.CompletionItem))
              
              return { suggestions: interfaceSuggestions }
            }
            
            // Get unified completions from Master System (properties + methods)
            const unifiedCompletions = await getUnifiedCompletions(cleanBase.path, varType, allText, monacoInstance)
            console.log(`[PropertyCompletionHandler] Found ${unifiedCompletions.length} unified completions`)
            
            return { suggestions: unifiedCompletions }
          } else {
            console.log(`[PropertyCompletionHandler] Variable "${cleanBase.path}" not found in known variables or has unknown type`)
          }
        }

        // For complex property chains, use simplified resolution
        console.log(`[PropertyCompletionHandler] Using complex property resolution for: "${cleanBase.path}" (isArrayAccess: ${cleanBase.isArrayAccess})`)
        
        // For array access in complex paths, resolve element type and use unified system
        if (cleanBase.isArrayAccess) {
          try {
            const parts = cleanBase.path.split('.')
            const baseVar = parts[0]
            const collectionPart = parts[parts.length - 1]
            const collectionProp = collectionPart.replace(/\[\d+\]$/, '')
            const baseType = typeInferenceService.getTypeOf(baseVar)
            const { getCollectionElementType } = await import('../../../type-system/schema-bridge')
            const elementType = getCollectionElementType(String(baseType), collectionProp)
            if (elementType && elementType !== 'unknown') {
              const allText = model.getValue()
              const suggestions = await getUnifiedCompletions(cleanBase.path, elementType, allText, monacoInstance)
              return { suggestions }
            }
          } catch (err) {
            console.log('[PropertyCompletionHandler] Element type resolution failed:', err)
          }
        }

        // Use simplified property resolution for complex chains
        const suggestions = await getSimplifiedPropertySuggestions(monacoInstance, cleanBase.path, model)
        return { suggestions }
      }
    }

    return undefined
  }
}

/**
 * SIMPLIFIED property suggestions for complex chains (like obj.prop.subprop)
 * Uses unified system to prevent duplicates
 */
async function getSimplifiedPropertySuggestions(
  monacoInstance: typeof monaco,
  baseChain: string,
  model: monaco.editor.ITextModel
): Promise<monaco.languages.CompletionItem[]> {
  try {
    console.log(`[PropertyCompletionHandler] getSimplifiedPropertySuggestions for: "${baseChain}"`)
    
    // For complex chains, resolve the final type and use unified system
    const parts = baseChain.split('.')
    const baseVar = parts[0]
    let finalType = typeInferenceService.getTypeOf(baseVar)
    const allText = model.getValue()

    // Traverse property chain to get final type
    for (let i = 1; i < parts.length; i++) {
      const props = typeInferenceService.getObjectProperties(finalType, allText, baseChain)
      const next = props.find(p => p.name === parts[i])
      if (!next) { 
        finalType = 'unknown'
        break 
      }
      finalType = String(next.type || 'unknown')
    }

    console.log(`[PropertyCompletionHandler] Complex chain "${baseChain}" resolved to type: "${finalType}"`)

    // Use unified system for final type to prevent duplicates
    if (finalType !== 'unknown') {
      return await getUnifiedCompletions(baseChain, finalType, allText, monacoInstance)
    }
    
    return []
    
  } catch (error) {
    console.warn('PropertyAccessParser failed, using Master System fallback:', error)

    // Fallback: resolve type chain and use unified completions
    const parts = baseChain.split('.')
    const baseVar = parts[0]
    let typeName = typeInferenceService.getTypeOf(baseVar)
    const allText = model.getValue()

    // Traverse property chain to get final type
    for (let i = 1; i < parts.length; i++) {
      const props = typeInferenceService.getObjectProperties(typeName, allText, baseChain)
      const next = props.find(p => p.name === parts[i])
      if (!next) { 
        typeName = 'unknown'
        break 
      }
      typeName = String(next.type || 'unknown')
    }

    // Use unified system for consistency
    if (typeName !== 'unknown') {
      return await getUnifiedCompletions(baseChain, typeName, allText, monacoInstance)
    }
    
    return []
  }
}

// Variable type resolution utility - NOW USES MASTER SYSTEM
function getVariableType(variableName: string, allText: string): string {
  console.log(`[PropertyCompletionHandler] getVariableType called for: "${variableName}" using MASTER SYSTEM`)

  // Use master type detection system for consistent results
  const { detectVariableType, detectLoopElementType } = require('@/lib/editor/type-system/master-type-detector')
  
  // First try to detect if this is a loop variable
  const loopTypeInfo = detectLoopElementType(variableName, allText)
  if (loopTypeInfo.confidence > 0.5) {
    console.log(`[PropertyCompletionHandler] "${variableName}" is a LOOP VARIABLE with type:`, loopTypeInfo)
    return loopTypeInfo.type || 'unknown'
  }
  
  // Fallback to regular variable detection
  const typeInfo = detectVariableType(variableName, allText)
  console.log(`[PropertyCompletionHandler] Master system result for "${variableName}":`, typeInfo)

  return typeInfo.type || 'unknown'
}

/**
 * UNIFIED COMPLETION SYSTEM
 * Gets both properties and methods in a single, consistent way
 */
async function getUnifiedCompletions(
  variableName: string, 
  typeName: string, 
  allText: string, 
  monacoInstance: typeof monaco
): Promise<monaco.languages.CompletionItem[]> {
  console.log(`[PropertyCompletionHandler] getUnifiedCompletions for "${variableName}" with type: "${typeName}"`)
  
  const completions: monaco.languages.CompletionItem[] = []
  
  // 1. Get properties from Master System
  const { detectVariableType, detectLoopElementType } = require('@/lib/editor/type-system/master-type-detector')
  
  let masterResult
  const loopTypeInfo = detectLoopElementType(variableName, allText)
  if (loopTypeInfo.confidence > 0.5) {
    masterResult = loopTypeInfo
  } else {
    masterResult = detectVariableType(variableName, allText)
  }
  
  // Add properties (with Property icon)
  if (masterResult.properties && Object.keys(masterResult.properties).length > 0) {
    console.log(`[PropertyCompletionHandler] Found ${Object.keys(masterResult.properties).length} properties from Master System`)
    
    Object.entries(masterResult.properties).forEach(([propName, propType]) => {
      completions.push({
        label: propName,
        kind: monacoInstance.languages.CompletionItemKind.Property,
        insertText: propName,
        detail: `${propName}: ${propType}`,
        documentation: `**${propName}** → *${propType}*\n\n**Source:** ${masterResult.source}\n**Evidence:** ${masterResult.evidence}`,
        sortText: `0_${propName}` // Properties first
      } as monaco.languages.CompletionItem)
    })
  }
  
  // 2. Get methods from schema system (with Method icon) - ONLY METHODS, NOT PROPERTIES
  try {
    const schemaCompletions = await getTypeSpecificCompletions(typeName, allText)
    console.log(`[PropertyCompletionHandler] Found ${schemaCompletions.length} schema completions for type "${typeName}"`)
    
    // Filter out properties that Master System already provided
    const existingPropertyNames = new Set(
      Object.keys(masterResult.properties || {})
    )
    
    for (const p of schemaCompletions) {
      // Skip if this is a property that Master System already provided
      if (existingPropertyNames.has(p.label)) {
        console.log(`[PropertyCompletionHandler] Skipping duplicate property "${p.label}" from schema system`)
        continue
      }
      
      const schema = p.schema
      const description = schema?.description || 'No description available'
      const examples = schema?.examples || []
      
      let returnType = schema?.returnType || p.type
      if (schema?.returnInterface) {
        returnType = schema.returnInterface
      }
      
      let documentation = description
      if (examples.length > 0) {
        documentation += '\n\n**Examples:**\n' + examples.map((ex: string) => `- ${ex}`).join('\n')
      }
      
      const snippetTemplate = schema?.snippetTemplate || p.label.replace('()', '')
      const isMethodWithParams = p.label.includes('()') && snippetTemplate !== p.label.replace('()', '')
      
      // Determine if this is actually a method or property based on schema
      const isMethod = p.label.includes('()') || schema?.type === 'method' || schema?.returnType
      
      completions.push({
        label: p.label,
        kind: isMethod ? 
          monacoInstance.languages.CompletionItemKind.Method : 
          monacoInstance.languages.CompletionItemKind.Property,
        insertText: snippetTemplate,
        insertTextRules: isMethodWithParams ? 
          monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet : 
          undefined,
        detail: returnType,
        documentation: documentation,
        sortText: isMethod ? `1_${p.label}` : `0_${p.label}` // Methods after properties
      } as monaco.languages.CompletionItem)
    }
  } catch (error) {
    console.log(`[PropertyCompletionHandler] Schema method lookup failed:`, error)
  }
  
  console.log(`[PropertyCompletionHandler] Unified completions: ${completions.length} total`)
  return completions
}
