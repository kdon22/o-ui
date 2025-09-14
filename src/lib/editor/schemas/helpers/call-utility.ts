// Call Utility Schema - Dynamic Utility Discovery System

import type { UnifiedSchema } from '@/lib/editor/schemas'
import { utilityService, type UtilityDefinition } from '../../services/utility-service'

export const CALL_UTILITY_SCHEMA: UnifiedSchema = {
  id: 'call-utility-helper',
  name: 'Call Utility',
  type: 'helper',
  description: 'Call a utility function with parameters',
  category: 'Utilities',
  
  // Keyboard shortcut
  keyboard: {
    shortcut: 'Cmd+U',
    keyCode: 'CtrlCmd+KeyU'
  },
  
  // Python code generator
  pythonGenerator: (params: any) => {
    const { utilityName, parameters = {}, insertReturn = false, returnVariableName = '', wrapInTryCatch = false } = params
    
    // Generate the call statement
    let callStatement = `call utility "${utilityName}"`
    
    // Add parameters if any
    const paramPairs = Object.entries(parameters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' ? `"${value}"` : value
        return `  ${key} = ${formattedValue}`
      })

    if (paramPairs.length > 0) {
      callStatement += ' with:\n' + paramPairs.join('\n')
    }

    // Handle return value
    if (insertReturn) {
      const varName = returnVariableName || 'result'
      callStatement = `${varName} = ${callStatement}`
    }

    // Wrap in try-catch if requested
    if (wrapInTryCatch) {
      callStatement = `try\n    ${callStatement.replace(/\n/g, '\n    ')}\ncatch error\n    // handle error\n    logError("Utility call failed", error)`
    }

    return callStatement
  },
  
  pythonImports: [],
  examples: [
    'call utility "Document Error" with:\n  errorText = "System failure"\n  routineID = "BOOKING_001"'
  ],
  
  // Dynamic helper UI - will be populated by available utilities
  helperUI: {
    title: 'Call Utility Function',
    description: 'Select a utility function and configure its parameters',
    category: 'Utilities',
    fields: [] // Will be dynamically populated
  }
}

// 🚀 DYNAMIC UTILITY DISCOVERY: Create utility-specific schema from service
export async function createDynamicUtilitySchema(utilityName: string, tenantId?: string): Promise<UnifiedSchema> {
  // Get utility definition from service
  const utility = await utilityService.getUtilityByName(utilityName, tenantId)
  
  if (utility) {
    return createUtilitySchemaFromDefinition(utility)
  } else {
    // Fallback to basic schema
    return createUtilitySchema(utilityName, [])
  }
}

// Create schema from utility definition
export function createUtilitySchemaFromDefinition(utility: UtilityDefinition): UnifiedSchema {
  return {
    ...CALL_UTILITY_SCHEMA,
    id: `call-utility-${utility.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: `Call ${utility.name}`,
    description: `${utility.description || `Call the ${utility.name} utility function`}`,
    
    helperUI: {
      title: `Call ${utility.name}`,
      description: utility.description || `Configure parameters for the ${utility.name} utility`,
      category: 'Utilities',
      fields: [
        // Hidden field for utility name
        {
          name: 'utilityName',
          label: 'Utility Name',
          type: 'text',
          required: true,
          placeholder: utility.name
        },
        
        // Dynamic parameter fields from utility definition
        ...utility.parameters.map((param) => ({
          name: param.name,
          label: param.name,
          type: (param.type === 'number' ? 'number' : 'text') as 'number' | 'text',
          required: param.required || false,
          placeholder: param.description || `Enter ${param.name}...`,
          description: param.description
        })),
        
        // Return type validation field (hidden, used for validation)
        {
          name: 'expectedReturnType',
          label: 'Expected Return Type',
          type: 'text',
          required: false,
          placeholder: utility.returnType || 'string'
        },
        
        // Options
        {
          name: 'insertReturn',
          label: 'Store Return Value',
          type: 'checkbox' as const,
          required: false,
          description: 'Create a variable to capture the result'
        },
        {
          name: 'returnVariableName',
          label: 'Return Variable Name',
          type: 'text' as const,
          required: false,
          placeholder: 'Leave empty for auto-generated name',
          description: 'Name for the return variable (optional)'
        },
        {
          name: 'wrapInTryCatch',
          label: 'Wrap in Try-Catch',
          type: 'checkbox' as const,
          required: false,
          description: 'Add error handling around the utility call'
        }
      ]
    }
  }
}

// Helper function to create utility-specific schema (legacy support)
export function createUtilitySchema(utilityName: string, parameters: any[] = []): UnifiedSchema {
  return {
    ...CALL_UTILITY_SCHEMA,
    id: `call-utility-${utilityName.toLowerCase().replace(/\s+/g, '-')}`,
    name: `Call ${utilityName}`,
    description: `Call the ${utilityName} utility function`,
    
    helperUI: {
      title: `Call ${utilityName}`,
      description: `Configure parameters for the ${utilityName} utility`,
      category: 'Utilities',
      fields: [
        // Hidden field for utility name (we'll handle this in the factory)
        {
          name: 'utilityName',
          label: 'Utility Name',
          type: 'text',
          required: true,
          placeholder: utilityName
        },
        
        // Dynamic parameter fields
        ...parameters.map((param: any) => ({
          name: param.name,
          label: param.name,
          type: (param.type === 'number' ? 'number' : 'text') as 'number' | 'text',
          required: param.required || false,
          placeholder: param.description || `Enter ${param.name}...`,
          description: param.description
        })),
        
        // Options
        {
          name: 'insertReturn',
          label: 'Store Return Value',
          type: 'checkbox' as const,
          required: false,
          description: 'Create a variable to capture the result'
        },
        {
          name: 'returnVariableName',
          label: 'Return Variable Name',
          type: 'text' as const,
          required: false,
          placeholder: 'Leave empty for auto-generated name',
          description: 'Name for the return variable (optional)'
        },
        {
          name: 'wrapInTryCatch',
          label: 'Wrap in Try-Catch',
          type: 'checkbox' as const,
          required: false,
          description: 'Add error handling around the utility call'
        }
      ]
    }
  }
}

// 🔍 UTILITY PICKER: Get all available utilities for selection
export async function getAvailableUtilities(tenantId?: string): Promise<UtilityDefinition[]> {
  return await utilityService.getAllUtilities(tenantId)
}

// ✅ VALIDATION: Validate return type matches utility definition
export async function validateUtilityReturnType(utilityName: string, expectedType: string, tenantId?: string): Promise<boolean> {
  return await utilityService.validateReturnType(utilityName, expectedType, tenantId)
}

// 🔍 SEARCH: Search utilities by name or description
export async function searchUtilities(query: string, tenantId?: string): Promise<UtilityDefinition[]> {
  return await utilityService.searchUtilities(query, tenantId)
}

// 🔄 CACHE MANAGEMENT: Refresh utility cache
export function refreshUtilityCache(): void {
  utilityService.invalidateCache()
}

// Parser function to extract data from existing utility calls
export function parseUtilityCallForEditing(content: string): Record<string, any> | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => 
      line && !line.startsWith('#') && !line.startsWith('//')
    )
    
    if (lines.length === 0) return null
    
    const utilityCallRegex = /^(?:(\w+)\s*=\s*)?call\s+utility\s+"([^"]+)"(?:\s+with:)?/i
    let utilityName = ''
    let returnVariable = ''
    let parameters: Record<string, any> = {}
    
    // Find the main utility call line
    for (const line of lines) {
      const match = line.match(utilityCallRegex)
      if (match) {
        returnVariable = match[1] || ''
        utilityName = match[2] || ''
        break
      }
    }
    
    if (!utilityName) return null
    
    // Extract parameters
    for (const line of lines) {
      const paramMatch = line.match(/^\s*(\w+)\s*=\s*(.+)$/)
      if (paramMatch && !paramMatch[0].includes('call utility')) {
        const paramName = paramMatch[1]
        const paramValue = paramMatch[2]
        
        // Remove quotes and parse value
        if ((paramValue.startsWith('"') && paramValue.endsWith('"')) || 
            (paramValue.startsWith("'") && paramValue.endsWith("'"))) {
          parameters[paramName] = paramValue.slice(1, -1)
        } else {
          parameters[paramName] = paramValue
        }
      }
    }
    
    return {
      utilityName,
      ...parameters,
      insertReturn: !!returnVariable,
      returnVariableName: returnVariable,
      wrapInTryCatch: content.includes('try') && content.includes('catch')
    }
    
  } catch (error) {
    console.error('Failed to parse utility call:', error)
    return null
  }
} 