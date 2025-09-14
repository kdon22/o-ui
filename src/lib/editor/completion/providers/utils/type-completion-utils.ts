// Type completion utilities
// Handles type-specific completions using built-in interface definitions

// Built-in interface definitions for common return types
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

// Type-specific completions using schema discovery, class indexer, and SQL tables
export async function getTypeSpecificCompletions(typeName: string, allText?: string): Promise<Array<{ label: string; type: string; schema?: any }>> {
  console.log(`[TypeCompletionUtils] getting type-specific completions for: "${typeName}"`)
  console.log(`[TypeCompletionUtils] typeName received:`, JSON.stringify(typeName))

  // DEBUG: Check if this is the problematic "Result" type
  if (typeName.includes('Result')) {
    console.error(`[TypeCompletionUtils] DEBUG: "Result" type detected in getTypeSpecificCompletions!`)
    console.error(`[TypeCompletionUtils] typeName: "${typeName}"`)
    console.error(`[TypeCompletionUtils] This should be a queryrow type, not "Result"`)
    console.trace('Stack trace for Result type in getTypeSpecificCompletions')
  }

  // First, check if this is a queryrow type from SQL results
  if (typeName.startsWith('queryrow:')) {
    const tableName = typeName.substring(9)
    try {
      const { sqlProvider } = require('../../../sql/sql-provider')
      const resolved = await sqlProvider.resolveTableIdentifier(tableName)
      if (!resolved) return []
      const cols = await sqlProvider.getColumns(resolved)
      return cols.map((c: any) => ({ label: c.name, type: c.type || 'string' }))
    } catch {
      return []
    }
  }

  // Second, check built-in interfaces for common return types
  const interfaceProperties = BUILT_IN_INTERFACES[typeName]
  if (interfaceProperties) {
    console.log(`[TypeCompletionUtils] Found built-in interface "${typeName}" with ${interfaceProperties.length} properties`)
    
    return interfaceProperties.map(prop => ({
      label: prop.label,
      type: prop.type,
      schema: {
        description: prop.description,
        returnType: prop.type
      }
    }))
  }

  // Interface types are handled by built-in interface definitions above

  // Fourth, try to get user-defined class properties from ClassIndexer (legacy fallback)
  if (allText) {
    try {
      const { ClassIndexer } = require('../../../type-system/class-indexer')
      const indexedClasses = ClassIndexer.index(allText)

      if (indexedClasses[typeName]) {
        const classInfo = indexedClasses[typeName]
        console.log(`[TypeCompletionUtils] Found user-defined class "${typeName}" with ${classInfo.properties.length} properties and ${classInfo.actions.length} actions`)

        const completions: Array<{ label: string; type: string }> = []

        // Add properties
        classInfo.properties.forEach((prop: { name: string; type?: string; description?: string }) => {
          const normalizedType = prop.type ? normalizeTypeForMethods(prop.type) : 'any'
          completions.push({
            label: prop.name,
            type: normalizedType
          })
        })

        // Add actions (methods)
        classInfo.actions.forEach((action: { name: string; returnType?: string; parameters?: Array<{ name: string; type?: string; optional?: boolean }>; description?: string }) => {
          const params = action.parameters ? `(${action.parameters.map((p: { name: string; type?: string; optional?: boolean }) => p.name).join(', ')})` : '()'
          const normalizedReturnType = action.returnType ? normalizeTypeForMethods(action.returnType) : 'any'
          completions.push({
            label: `${action.name}${params}`,
            type: normalizedReturnType
          })
        })

        if (completions.length > 0) {
          console.log(`[TypeCompletionUtils] SUCCESS: found ${completions.length} class-based completions for "${typeName}"`)
          return completions
        }
      }
    } catch (error) {
      console.error(`[TypeCompletionUtils] Error checking ClassIndexer for "${typeName}":`, error)
    }
  }

  // Fall back to dynamically discovered schema-based methods
  const schemaMethods = await getMethodsFromSchemas(typeName)
  console.log(`[TypeCompletionUtils] schema methods for "${typeName}":`, schemaMethods)

  if (schemaMethods.length > 0) {
    console.log(`[TypeCompletionUtils] SUCCESS: found ${schemaMethods.length} schema-based completions for "${typeName}"`)
    return schemaMethods
  }

  // If no completions found from any source, log for debugging but don't error
  console.log(`[TypeCompletionUtils] No completions found for type "${typeName}" - this may be expected for unknown types`)
  console.log(`[TypeCompletionUtils] Type system searched: SSOT Interface Factory, ClassIndexer, and Schema methods`)

  // Return empty array - this is normal for unknown types
  return []
}

// Dynamically discover and load methods from schemas
async function getMethodsFromSchemas(typeName: string): Promise<Array<{
  label: string;
  type: string;
  schema: any; // Full schema object for rich metadata
}>> {
  console.log(`[SchemaLoader] Loading methods for type: "${typeName}"`)

  try {
    // Dynamically import method schemas
    const methodSchemasModule = await import('@/lib/editor/schemas/methods')
    
    let allMethodSchemas: any[] = []
    
    // Extract ALL_METHOD_SCHEMAS if available
    if (methodSchemasModule.ALL_METHOD_SCHEMAS && Array.isArray(methodSchemasModule.ALL_METHOD_SCHEMAS)) {
      allMethodSchemas = methodSchemasModule.ALL_METHOD_SCHEMAS
    } else {
      // Try to discover method schemas from module exports
      const moduleKeys = Object.keys(methodSchemasModule)
      for (const key of moduleKeys) {
        const value = (methodSchemasModule as any)[key]
        
        // Check if this looks like a method schema array
        if (Array.isArray(value) && key.includes('SCHEMA')) {
          allMethodSchemas.push(...value)
          console.log(`[SchemaLoader] Discovered method schemas from: ${key}`)
        }
      }
    }

    // Use dynamic type mapping and schema lookup
    const schemaCategory = normalizeTypeForMethods(typeName)
    console.log(`[SchemaLoader] Original typeName: "${typeName}" -> Schema category: "${schemaCategory}"`)

    // Filter methods by category from the discovered schemas
    const categoryMethods = allMethodSchemas.filter((schema: any) => {
      // Handle different type mappings for method categories
      const schemaCat = schema.category
      return schemaCat === schemaCategory ||
             // Handle legacy category mappings
             (schemaCategory === 'string' && (schemaCat === 'str' || schemaCat === 'validation' || schemaCat === 'encoding')) ||
             (schemaCategory === 'number' && (schemaCat === 'int' || schemaCat === 'math')) ||
             (schemaCategory === 'boolean' && schemaCat === 'bool') ||
             (schemaCategory === 'array' && (schemaCat === 'list' || schemaCat === 'collection')) ||
             (schemaCategory === 'dictionary' && (schemaCat === 'dict' || schemaCat === 'object'))
    })

    console.log(`[SchemaLoader] Found ${categoryMethods.length} methods for category "${schemaCategory}" from ${allMethodSchemas.length} total schemas`)

    // DEBUG: Log sample schemas to understand structure
    if (allMethodSchemas.length > 0) {
      console.log(`[SchemaLoader] Sample schema:`, allMethodSchemas[0])
      console.log(`[SchemaLoader] Available categories:`, [...new Set(allMethodSchemas.map(s => s.category))])
    }

    return categoryMethods.map((schema: any) => ({
      label: schema.name + (schema.noParensAllowed ? '' : '()'),
      type: schema.returnType || (schema.returnInterface ? 'object' : 'unknown') || 'any',
      schema: schema // Include full schema for rich metadata access
    }))
    
  } catch (error) {
    console.error(`[SchemaLoader] Error loading method schemas:`, error)
    return []
  }
}

// Direct TypeScript type mapping - no normalization layer
export function normalizeTypeForMethods(typeName: string): string {
  // Direct mapping to TypeScript/JavaScript types
  const typeMap: Record<string, string> = {
    // Business-friendly -> Technical types
    'str': 'string',
    'int': 'number',
    'bool': 'boolean',
    'list': 'array',
    'dict': 'dictionary',  // Keep as 'dictionary' for clarity
    'float': 'float',      // Keep separate from number for precision

    // Keep existing types as-is
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'array',
    'date': 'date',
    'object': 'object',
    'dictionary': 'dictionary',
    'undefined': 'undefined',
    'null': 'null',
    'unknown': 'unknown'
  }

  const normalized = typeMap[typeName] || 'unknown'
  console.log(`[TypeDirect] "${typeName}" -> "${normalized}"`)
  return normalized
}
