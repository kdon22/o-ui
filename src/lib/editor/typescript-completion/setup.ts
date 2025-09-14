/**
 * 🎯 TYPESCRIPT COMPLETION SETUP
 * 
 * Setup utilities for TypeScript interface completion system
 */

import type * as monaco from 'monaco-editor'
import { interfaceRegistry, parseAndRegisterUtility } from './interface-registry'
import { registerTypeScriptCompletionProvider } from './monaco-provider'

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

/**
 * Complete setup for TypeScript completion system
 */
export function setupTypeScriptCompletion(
  monacoInstance: typeof monaco,
  options: {
    languageId?: string
    utilities?: Array<{ name: string; code: string }>
  } = {}
): {
  success: boolean
  disposable?: monaco.IDisposable
  errors: string[]
  stats: {
    totalUtilities: number
    totalCompletionItems: number
  }
} {
  const errors: string[] = []
  const { languageId = 'business-rules', utilities = [] } = options

  try {
    console.log(`[TypeScriptCompletionSetup] Setting up completion for ${languageId}`)
    
    // Clear existing registry
    interfaceRegistry.clear()
    
    // Register Monaco completion provider
    const disposable = registerTypeScriptCompletionProvider(monacoInstance, languageId)
    
    // Parse and register utilities
    let successCount = 0
    for (const utility of utilities) {
      console.log(`[TypeScriptCompletionSetup] Parsing utility: ${utility.name}`)
      
      const result = parseAndRegisterUtility(utility.name, utility.code)
      if (result.success) {
        successCount++
        console.log(`[TypeScriptCompletionSetup] ✅ Parsed ${utility.name}: ${result.completionItems?.length || 0} completions`)
      } else {
        errors.push(`Failed to parse ${utility.name}: ${result.error}`)
        console.error(`[TypeScriptCompletionSetup] ❌ Failed to parse ${utility.name}:`, result.error)
      }
    }
    
    const stats = interfaceRegistry.getStats()
    
    console.log(`[TypeScriptCompletionSetup] Setup complete:`)
    console.log(`  - Utilities parsed: ${successCount}/${utilities.length}`)
    console.log(`  - Total completion items: ${stats.totalCompletionItems}`)
    console.log(`  - Errors: ${errors.length}`)
    
    return {
      success: errors.length === 0,
      disposable,
      errors,
      stats: {
        totalUtilities: stats.totalUtilities,
        totalCompletionItems: stats.totalCompletionItems
      }
    }
    
  } catch (error) {
    const errorMessage = `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(`[TypeScriptCompletionSetup] ${errorMessage}`)
    
    return {
      success: false,
      errors: [errorMessage],
      stats: {
        totalUtilities: 0,
        totalCompletionItems: 0
      }
    }
  }
}

/**
 * Parse a single utility and setup completion
 */
export async function parseUtilityAndSetupCompletion(
  utilityName: string,
  utilityCode: string
): Promise<{
  success: boolean
  error?: string
  completionItems: number
  returnType?: string
}> {
  console.log(`[ParseUtilityAndSetup] Parsing utility: ${utilityName}`)
  
  const result = parseAndRegisterUtility(utilityName, utilityCode)
  
  if (!result.success) {
    console.error(`[ParseUtilityAndSetup] Failed to parse ${utilityName}:`, result.error)
    return {
      success: false,
      error: result.error,
      completionItems: 0
    }
  }
  
  const utilityInterface = interfaceRegistry.getUtilityInterface(utilityName)
  const completionItems = result.completionItems?.length || 0
  
  console.log(`[ParseUtilityAndSetup] ✅ Successfully parsed ${utilityName}:`)
  console.log(`  - Return type: ${utilityInterface?.returnTypeName}`)
  console.log(`  - Completion items: ${completionItems}`)
  
  return {
    success: true,
    completionItems,
    returnType: utilityInterface?.returnTypeName
  }
}

// =============================================================================
// DEMO UTILITIES
// =============================================================================

/**
 * Demo utilities for testing
 */
export const DEMO_UTILITIES = [
  {
    name: 'getUserData',
    code: `
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

function getUserData(userId: number): UserResult {
  // Implementation here
  return {} as UserResult;
}
`
  },
  {
    name: 'getOrderInfo',
    code: `
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderResult {
  orderId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
}

function getOrderInfo(orderId: string): OrderResult {
  // Implementation here
  return {} as OrderResult;
}
`
  }
]

/**
 * Setup demo utilities for testing
 */
export function setupDemoUtilities(monacoInstance: typeof monaco): {
  success: boolean
  stats: { totalUtilities: number; totalCompletionItems: number }
  errors: string[]
} {
  console.log(`[DemoSetup] Setting up demo utilities...`)
  
  return setupTypeScriptCompletion(monacoInstance, {
    utilities: DEMO_UTILITIES
  })
}
