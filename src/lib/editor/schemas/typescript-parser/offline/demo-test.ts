/**
 * 🎯 DEMO TEST - Test the offline TypeScript interface parser
 * 
 * Demonstrates parsing user-defined interfaces and enhancing utility schemas
 * Shows the complete workflow from interface to Monaco completion
 */

import { parseInterfacesStatic, sortInterfacesByDependencies } from './static-interface-parser'
import { enhanceUtilitySchema, extractInterfaceSourceFromCode, createMonacoCompletionItems } from './utility-schema-enhancer'

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Sample user utility with TypeScript interfaces
 */
const SAMPLE_UTILITY_CODE = `
// User-defined interfaces for their utility function
interface Address {
  street: string;
  city: string;
  zipCode: string;
  country?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  address: Address;
  isActive: boolean;
}

interface UserResult {
  user: User;
  success: boolean;
  message: string;
}

// The actual utility function (not parsed, just for context)
function getUserData(userId: number): UserResult {
  // Implementation would go here
  return {
    user: {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "Anytown",
        zipCode: "12345"
      },
      isActive: true
    },
    success: true,
    message: "User found"
  };
}
`

/**
 * Sample utility schema (before enhancement)
 */
const SAMPLE_UTILITY_SCHEMA = {
  "id": "utility-get-user-data",
  "name": "getUserData",
  "type": "function",
  "category": "user-utilities",
  "examples": [
    "getUserData(userId)",
    "getUserData(123)"
  ],
  "docstring": "**getUserData** - Retrieves user data by ID\n\n**Parameters:**\n• **userId**: number (required) - The user ID to lookup\n\n**Returns:** object\n\n**Usage:**\n```\ngetUserData(userId)\ngetUserData(123)\n```",
  "parameters": [
    {
      "name": "userId",
      "type": "number",
      "required": true,
      "description": "The user ID to lookup"
    }
  ],
  "returnType": "object",
  "description": "Retrieves user data by ID"
}

// =============================================================================
// DEMO FUNCTIONS
// =============================================================================

/**
 * Demo: Parse interfaces from utility code
 */
export function demoInterfaceParsing(): void {
  console.group('🎯 Interface Parsing Demo')
  
  console.log('📝 Parsing interfaces from utility code...')
  
  // Extract interface source
  const interfaceSource = extractInterfaceSourceFromCode(SAMPLE_UTILITY_CODE)
  console.log('🔍 Extracted interface source:')
  console.log(interfaceSource)
  
  // Parse interfaces
  const parseResult = parseInterfacesStatic(interfaceSource)
  
  console.log('✅ Parse result:')
  console.log('📊 Found interfaces:', parseResult.interfaces.map(i => i.name))
  console.log('🔗 Dependencies:', parseResult.dependencies)
  console.log('📦 Return objects:', parseResult.returnObjects)
  
  if (parseResult.errors.length > 0) {
    console.error('❌ Errors:', parseResult.errors)
  }
  
  // Show dependency-sorted interfaces
  const sortedInterfaces = sortInterfacesByDependencies(parseResult.interfaces, parseResult.dependencies)
  console.log('📋 Dependency order:', sortedInterfaces.map(i => i.name))
  
  console.groupEnd()
}

/**
 * Demo: Enhance utility schema with parsed interfaces
 */
export function demoSchemaEnhancement(): void {
  console.group('🔧 Schema Enhancement Demo')
  
  console.log('📝 Original utility schema:')
  console.log('Return type:', SAMPLE_UTILITY_SCHEMA.returnType)
  console.log('Has returnObject:', 'returnObject' in SAMPLE_UTILITY_SCHEMA)
  
  // Extract interfaces and enhance schema
  const interfaceSource = extractInterfaceSourceFromCode(SAMPLE_UTILITY_CODE)
  const enhancementResult = enhanceUtilitySchema(SAMPLE_UTILITY_SCHEMA, interfaceSource)
  
  if (enhancementResult.success && enhancementResult.enhancedSchema) {
    console.log('✅ Enhanced schema:')
    console.log('New return type:', enhancementResult.enhancedSchema.returnType)
    console.log('Return object:', enhancementResult.enhancedSchema.returnObject)
    console.log('All return objects:', enhancementResult.enhancedSchema.returnObjects?.map(obj => obj.name))
    console.log('Updated docstring:', enhancementResult.enhancedSchema.docstring)
  } else {
    console.error('❌ Enhancement failed:', enhancementResult.errors)
  }
  
  console.groupEnd()
}

/**
 * Demo: Generate Monaco completion items
 */
export function demoMonacoCompletion(): void {
  console.group('💡 Monaco Completion Demo')
  
  // Parse and enhance
  const interfaceSource = extractInterfaceSourceFromCode(SAMPLE_UTILITY_CODE)
  const enhancementResult = enhanceUtilitySchema(SAMPLE_UTILITY_SCHEMA, interfaceSource)
  
  if (enhancementResult.success && enhancementResult.returnObjects) {
    console.log('🎯 Generating Monaco completion items...')
    
    // Generate completion items for 'result' variable
    const completionItems = createMonacoCompletionItems(enhancementResult.returnObjects, 'result')
    
    console.log('✨ Available completions:')
    completionItems.forEach(item => {
      console.log(`  • ${item.label} (${item.detail})`)
    })
    
    console.log('\n🎉 User would now get IntelliSense for:')
    console.log('  • result.user.name')
    console.log('  • result.user.email') 
    console.log('  • result.user.address.street')
    console.log('  • result.user.address.city')
    console.log('  • result.success')
    console.log('  • result.message')
    
  } else {
    console.error('❌ Could not generate completions:', enhancementResult.errors)
  }
  
  console.groupEnd()
}

/**
 * Demo: Complete workflow
 */
export function demoCompleteWorkflow(): void {
  console.group('🚀 Complete Workflow Demo')
  
  console.log('🎯 Demonstrating complete interface parsing workflow...')
  
  // Step 1: Parse interfaces
  console.log('\n📝 Step 1: Parse interfaces')
  demoInterfaceParsing()
  
  // Step 2: Enhance schema
  console.log('\n🔧 Step 2: Enhance utility schema')
  demoSchemaEnhancement()
  
  // Step 3: Generate completions
  console.log('\n💡 Step 3: Generate Monaco completions')
  demoMonacoCompletion()
  
  console.log('\n✅ Workflow complete!')
  console.log('🎉 User utility now has full TypeScript-like IntelliSense!')
  
  console.groupEnd()
}

/**
 * Test with different interface patterns
 */
export function testDifferentPatterns(): void {
  console.group('🧪 Testing Different Interface Patterns')
  
  const patterns = [
    {
      name: 'Simple Interface',
      code: `
interface SimpleResult {
  value: string;
  count: number;
}
`
    },
    {
      name: 'Nested Objects',
      code: `
interface Config {
  host: string;
  port: number;
}

interface ApiResponse {
  data: any;
  config: Config;
  status: number;
}
`
    },
    {
      name: 'Arrays and Optional Properties',
      code: `
interface Item {
  id: string;
  name: string;
  tags?: string[];
}

interface ListResult {
  items: Item[];
  total: number;
  hasMore?: boolean;
}
`
    }
  ]
  
  for (const pattern of patterns) {
    console.log(`\n🔍 Testing: ${pattern.name}`)
    const result = parseInterfacesStatic(pattern.code)
    console.log('Interfaces:', result.interfaces.map(i => i.name))
    console.log('Return objects:', result.returnObjects)
    if (result.errors.length > 0) {
      console.error('Errors:', result.errors)
    }
  }
  
  console.groupEnd()
}

// =============================================================================
// BROWSER CONSOLE HELPERS
// =============================================================================

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).interfaceParserDemo = {
    demoInterfaceParsing,
    demoSchemaEnhancement,
    demoMonacoCompletion,
    demoCompleteWorkflow,
    testDifferentPatterns,
    
    // Direct access to functions for testing
    parseInterfacesStatic,
    enhanceUtilitySchema,
    extractInterfaceSourceFromCode,
    createMonacoCompletionItems
  }
  
  console.log('🎯 Interface Parser Demo loaded!')
  console.log('Try: interfaceParserDemo.demoCompleteWorkflow()')
}
