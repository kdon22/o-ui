/**
 * 🎯 SIMPLE INTERFACE SERVICE - GUARANTEED TO WORK
 * 
 * No auto-discovery, no complex parsing, no magic.
 * Just simple lookups that work every time.
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
}

// =============================================================================
// SIMPLE INTERFACE SERVICE
// =============================================================================

export class SimpleInterfaceService {
  private static instance: SimpleInterfaceService
  private interfaceCache = new Map<string, InterfaceDefinition>()

  static getInstance(): SimpleInterfaceService {
    if (!this.instance) {
      this.instance = new SimpleInterfaceService()
    }
    return this.instance
  }

  /**
   * Load interfaces from module exports
   */
  async loadModuleInterfaces(): Promise<void> {
    console.log('[SimpleInterfaceService] Loading module interfaces...')
    
    try {
      // Load HTTP module interfaces
      const { HTTP_MODULE_INTERFACES } = await import('../schemas/modules/http.module.ts')
      
      for (const [name, interfaceDef] of Object.entries(HTTP_MODULE_INTERFACES)) {
        this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
        console.log(`[SimpleInterfaceService] ✅ Loaded interface: ${name}`)
      }
      
      console.log(`[SimpleInterfaceService] Loaded ${this.interfaceCache.size} interfaces`)
      
    } catch (error) {
      console.error('[SimpleInterfaceService] Error loading module interfaces:', error)
    }
  }

  /**
   * Get interface by name
   */
  async getInterface(name: string): Promise<InterfaceDefinition | null> {
    // Load interfaces if not already loaded
    if (this.interfaceCache.size === 0) {
      await this.loadModuleInterfaces()
    }
    
    const interfaceDef = this.interfaceCache.get(name)
    if (interfaceDef) {
      console.log(`[SimpleInterfaceService] ✅ Found interface: ${name} with ${interfaceDef.properties.length} properties`)
      return interfaceDef
    }
    
    console.log(`[SimpleInterfaceService] ❌ Interface not found: ${name}`)
    return null
  }

  /**
   * Get interface properties for completion
   */
  async getInterfaceProperties(name: string): Promise<InterfaceProperty[]> {
    const interfaceDef = await this.getInterface(name)
    return interfaceDef ? interfaceDef.properties : []
  }

  /**
   * Check if interface exists
   */
  async hasInterface(name: string): Promise<boolean> {
    const interfaceDef = await this.getInterface(name)
    return interfaceDef !== null
  }

  /**
   * Get all available interface names
   */
  async getAllInterfaceNames(): Promise<string[]> {
    if (this.interfaceCache.size === 0) {
      await this.loadModuleInterfaces()
    }
    
    return Array.from(this.interfaceCache.keys())
  }

  /**
   * Clear cache and reload
   */
  async refresh(): Promise<void> {
    this.interfaceCache.clear()
    await this.loadModuleInterfaces()
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const simpleInterfaceService = SimpleInterfaceService.getInstance()
