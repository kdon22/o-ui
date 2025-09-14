/**
 * 🎯 SIMPLE INTERFACE REGISTRY - GUARANTEED TO WORK
 * 
 * No auto-discovery, no complex parsing, no TypeScript magic.
 * Just a simple registry that maps interface names to properties.
 * 
 * ADD NEW INTERFACES HERE - ONE SOURCE OF TRUTH
 */

export interface InterfaceProperty {
  name: string
  type: string
  description: string
  nullable?: boolean
  optional?: boolean
}

export interface InterfaceDefinition {
  name: string
  properties: InterfaceProperty[]
  description: string
}

// =============================================================================
// INTERFACE REGISTRY - ADD ALL INTERFACES HERE
// =============================================================================

export const INTERFACE_REGISTRY: Record<string, InterfaceDefinition> = {
  
  // 🌐 HTTP Response Interface
  HttpResponse: {
    name: 'HttpResponse',
    description: 'HTTP request response object',
    properties: [
      { name: 'statusCode', type: 'number', description: 'HTTP status code (200, 404, 500, etc.)' },
      { name: 'error', type: 'string', description: 'Error message if request failed, null if successful', nullable: true },
      { name: 'response', type: 'object', description: 'Response data from the API' }
    ]
  },

  // 📅 Date Parse Result Interface  
  DateParseResult: {
    name: 'DateParseResult',
    description: 'Parsed date object with datetime properties',
    properties: [
      { name: 'year', type: 'number', description: 'Year component' },
      { name: 'month', type: 'number', description: 'Month component (1-12)' },
      { name: 'day', type: 'number', description: 'Day component' },
      { name: 'hour', type: 'number', description: 'Hour component', optional: true },
      { name: 'minute', type: 'number', description: 'Minute component', optional: true },
      { name: 'second', type: 'number', description: 'Second component', optional: true },
      { name: 'timestamp', type: 'number', description: 'Unix timestamp' }
    ]
  },

  // 🔢 Math Result Interface
  MathResult: {
    name: 'MathResult',
    description: 'Mathematical operation result',
    properties: [
      { name: 'value', type: 'number', description: 'Calculated value' },
      { name: 'precision', type: 'number', description: 'Decimal precision used' },
      { name: 'overflow', type: 'boolean', description: 'Whether overflow occurred' }
    ]
  }

  // 📋 ADD MORE INTERFACES HERE AS NEEDED
  // Just follow the same pattern - simple and reliable!
}

// =============================================================================
// SIMPLE ACCESS FUNCTIONS
// =============================================================================

/**
 * Get interface definition by name
 */
export function getInterface(name: string): InterfaceDefinition | null {
  return INTERFACE_REGISTRY[name] || null
}

/**
 * Get all available interface names
 */
export function getAllInterfaceNames(): string[] {
  return Object.keys(INTERFACE_REGISTRY)
}

/**
 * Check if interface exists
 */
export function hasInterface(name: string): boolean {
  return name in INTERFACE_REGISTRY
}

/**
 * Get interface properties for completion
 */
export function getInterfaceProperties(name: string): InterfaceProperty[] {
  const interfaceDef = getInterface(name)
  return interfaceDef ? interfaceDef.properties : []
}
