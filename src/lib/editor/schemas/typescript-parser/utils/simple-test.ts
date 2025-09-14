/**
 * 🎯 SIMPLE TEST - Basic TypeScript parser test without dependencies
 * 
 * Tests the parser without complex TypeScript compiler API
 * Helps debug what's failing in the browser environment
 */

// =============================================================================
// SIMPLE INTERFACE PARSING TEST
// =============================================================================

/**
 * Simple regex-based interface parser for testing
 */
export function simpleParseInterfaces(sourceCode: string): {
  success: boolean
  interfaces: Array<{ name: string; properties: string[] }>
  errors: string[]
} {
  try {
    const interfaces: Array<{ name: string; properties: string[] }> = []
    const errors: string[] = []

    // Simple regex to find interface declarations
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g
    let match

    while ((match = interfaceRegex.exec(sourceCode)) !== null) {
      const interfaceName = match[1]
      const interfaceBody = match[2]

      // Simple property extraction
      const properties: string[] = []
      const propertyLines = interfaceBody.split('\n')
      
      for (const line of propertyLines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          // Extract property name (simple approach)
          const propMatch = trimmed.match(/^\s*(\w+)[\?\:]/)
          if (propMatch) {
            properties.push(propMatch[1])
          }
        }
      }

      interfaces.push({
        name: interfaceName,
        properties
      })
    }

    return {
      success: true,
      interfaces,
      errors
    }

  } catch (error) {
    return {
      success: false,
      interfaces: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Test with minimal UTR schema
 */
export function testSimpleParsing(): void {
  console.group('🧪 Simple Interface Parsing Test')

  const testSchema = `
export interface UTR {
  passengers: Passenger[]
  segments: TravelSegment[]
  office: Office
}

export interface Passenger {
  passengerNumber: number
  name: {
    first: string
    last: string
  }
}

export interface TravelSegment {
  carrier: string
  flightNumber: string
}

export interface Office {
  responsibilityOffice: string
  creationOffice: string
}
`

  console.log('📝 Testing simple parsing...')
  const result = simpleParseInterfaces(testSchema)
  
  console.log('✅ Result:', result)
  
  if (result.success) {
    console.log('🎯 Found interfaces:')
    result.interfaces.forEach(iface => {
      console.log(`  - ${iface.name}: [${iface.properties.join(', ')}]`)
    })
  } else {
    console.error('❌ Errors:', result.errors)
  }

  console.groupEnd()
}

/**
 * Test what happens when we try to import TypeScript
 */
export async function testTypeScriptImport(): Promise<void> {
  console.group('🔍 TypeScript Import Test')
  
  try {
    console.log('📦 Attempting to import TypeScript...')
    
    // Try to import TypeScript
    const ts = await import('typescript')
    console.log('✅ TypeScript imported successfully')
    console.log('📊 TypeScript version:', ts.version)
    console.log('🔧 Available methods:', Object.keys(ts).slice(0, 10).join(', '), '...')
    
    // Test basic TypeScript functionality
    console.log('🧪 Testing createSourceFile...')
    const sourceFile = ts.createSourceFile(
      'test.ts',
      'interface Test { name: string }',
      ts.ScriptTarget.Latest,
      true
    )
    console.log('✅ createSourceFile works, kind:', sourceFile.kind)
    
  } catch (error) {
    console.error('❌ TypeScript import failed:', error)
    console.log('💡 This might be why the parser is failing')
  }
  
  console.groupEnd()
}

/**
 * Debug the actual parsing error
 */
export async function debugParsingError(): Promise<void> {
  console.group('🔍 Debug Parsing Error')
  
  try {
    // Try to import our parser
    console.log('📦 Importing AST parser...')
    const { parseTypeScriptInterfaces } = await import('../core/ast-parser')
    console.log('✅ AST parser imported')
    
    // Try with minimal schema
    const minimalSchema = 'export interface Test { name: string }'
    console.log('🧪 Testing with minimal schema:', minimalSchema)
    
    const result = parseTypeScriptInterfaces(minimalSchema, 'test.ts')
    console.log('📊 Parse result:', result)
    
    if (result.errors.length > 0) {
      console.error('❌ Parse errors:', result.errors)
    } else {
      console.log('✅ Parsing successful!')
      console.log('🎯 Found interfaces:', result.interfaces.map(i => i.name))
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
    console.log('📋 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : 'No stack'
    })
  }
  
  console.groupEnd()
}

// =============================================================================
// BROWSER CONSOLE HELPERS
// =============================================================================

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).simpleParserTest = {
    testSimpleParsing,
    testTypeScriptImport,
    debugParsingError,
    simpleParseInterfaces
  }
}
