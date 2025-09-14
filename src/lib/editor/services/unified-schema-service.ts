/**
 * 🎯 UNIFIED SCHEMA SERVICE - Zero Hardcoding SSOT
 * 
 * Automatically combines:
 * - Module schemas (from source files)
 * - Interface definitions (auto-discovered)  
 * - User utility schemas (from database)
 * 
 * NO IndexedDB storage needed - everything discovered at runtime
 */

import type { UnifiedSchema } from '../schemas/types'
// Removed complex TypeScript interface parser - using simple interface service instead
import { PropertyDefinition } from '../type-system/interface-completion-factory.ts'

// =============================================================================
// UNIFIED SCHEMA SERVICE
// =============================================================================

export class UnifiedSchemaService {
  private static instance: UnifiedSchemaService
  private schemaCache = new Map<string, UnifiedSchema>()
  private interfaceCache = new Map<string, PropertyDefinition[]>()
  private lastCacheTime = 0
  private readonly CACHE_TTL = 30000 // 30 seconds for development

  static getInstance(): UnifiedSchemaService {
    if (!this.instance) {
      this.instance = new UnifiedSchemaService()
    }
    return this.instance
  }

  /**
   * 🚀 GET ALL SCHEMAS - Auto-discovered, zero hardcoding
   */
  async getAllSchemas(tenantId?: string, force = false): Promise<UnifiedSchema[]> {
    const now = Date.now()
    
    // Use cache if fresh
    if (!force && this.schemaCache.size > 0 && (now - this.lastCacheTime) < this.CACHE_TTL) {
      return Array.from(this.schemaCache.values())
    }

    console.log('[UnifiedSchemaService] 🔍 Auto-discovering all schemas...')
    
    try {
      // Clear cache
      this.schemaCache.clear()

      // 1. Discover module schemas from source files
      await this.discoverModuleSchemas()
      
      // 2. Discover user utility schemas from database
      if (tenantId) {
        await this.discoverUserUtilitySchemas(tenantId)
      }

      // 3. Enrich all schemas with interface definitions
      await this.enrichSchemasWithInterfaces()

      this.lastCacheTime = now
      console.log(`✅ [UnifiedSchemaService] Discovered ${this.schemaCache.size} schemas`)
      
      return Array.from(this.schemaCache.values())

    } catch (error) {
      console.error('[UnifiedSchemaService] Error during schema discovery:', error)
      return Array.from(this.schemaCache.values())
    }
  }

  /**
   * Get schema by ID
   */
  async getSchema(schemaId: string, tenantId?: string): Promise<UnifiedSchema | null> {
    const schemas = await this.getAllSchemas(tenantId)
    return this.schemaCache.get(schemaId) || null
  }

  /**
   * Get schemas by module name
   */
  async getModuleSchemas(moduleName: string, tenantId?: string): Promise<UnifiedSchema[]> {
    const schemas = await this.getAllSchemas(tenantId)
    return schemas.filter(schema => schema.module === moduleName)
  }

  /**
   * Get method return interface
   */
  async getMethodReturnInterface(module: string, method: string, tenantId?: string): Promise<string | null> {
    const schemaId = `${module}-${method}`
    const schema = await this.getSchema(schemaId, tenantId)
    return schema?.returnInterface || null
  }

  /**
   * Get interface properties using simple interface service
   */
  async getInterfaceProperties(interfaceName: string): Promise<PropertyDefinition[] | null> {
    console.log(`🔍 [UnifiedSchemaService] Getting interface properties for: ${interfaceName}`)
    
    try {
      // Use simple interface service
      const { simpleInterfaceService } = await import('./simple-interface-service')
      const properties = await simpleInterfaceService.getInterfaceProperties(interfaceName)
      
      if (properties && properties.length > 0) {
        // Convert to PropertyDefinition format
        const convertedProperties: PropertyDefinition[] = properties.map(prop => ({
          name: prop.name,
          type: prop.type,
          description: prop.description,
          nullable: prop.nullable || false,
          optional: prop.optional || false,
          isCollection: false
        }))
        
        console.log(`✅ [UnifiedSchemaService] Found ${interfaceName} with ${convertedProperties.length} properties`)
        return convertedProperties
      }
      
      console.log(`❌ [UnifiedSchemaService] Interface ${interfaceName} not found`)
      return null
      
    } catch (error) {
      console.error(`[UnifiedSchemaService] Error getting interface ${interfaceName}:`, error instanceof Error ? error.message : String(error))
      return null
    }
  }

  /**
   * Load interfaces from TypeScript files using the auto-discovery parser
   */
  private async loadInterfacesFromTypeScript(): Promise<void> {
    try {
      console.log('[UnifiedSchemaService] Loading interfaces from TypeScript files...')
      
      const interfaceMap = await parseTypeScriptInterfacesFromFiles()
      
      // Cache the discovered interfaces
      for (const [interfaceName, properties] of interfaceMap) {
        this.interfaceCache.set(interfaceName, properties)
        console.log(`[UnifiedSchemaService] Cached interface: ${interfaceName} (${properties.length} properties)`)
      }
      
      console.log(`[UnifiedSchemaService] Loaded ${interfaceMap.size} interfaces from TypeScript files`)
      
    } catch (error) {
      console.error('[UnifiedSchemaService] Error loading interfaces from TypeScript:', error)
    }
  }

  // =============================================================================
  // DISCOVERY METHODS
  // =============================================================================

  /**
   * Discover module schemas from source files
   */
  private async discoverModuleSchemas(): Promise<void> {
    console.log('[UnifiedSchemaService] Discovering module schemas from source files...')
    
    try {
      // Import all module schemas directly from source
      const { ALL_MODULE_SCHEMAS } = await import('../schemas/modules')
      
      for (const schema of ALL_MODULE_SCHEMAS) {
        this.schemaCache.set(schema.id, { ...schema })
        console.log(`[UnifiedSchemaService] ✅ Found module schema: ${schema.id}`)
      }
      
    } catch (error) {
      console.error('[UnifiedSchemaService] Error discovering module schemas:', error)
    }
  }

  /**
   * Discover user utility schemas from database
   */
  private async discoverUserUtilitySchemas(tenantId: string): Promise<void> {
    console.log('[UnifiedSchemaService] Discovering user utility schemas from database...')
    
    try {
      // Use existing user utility registry
      const { UserUtilitySchemaRegistry } = await import('./user-utility-registry')
      const registry = new UserUtilitySchemaRegistry()
      
      const userSchemas = await registry.getAllUserSchemas(tenantId)
      
      for (const schema of userSchemas) {
        this.schemaCache.set(schema.id, { ...schema })
        console.log(`[UnifiedSchemaService] ✅ Found user utility schema: ${schema.id}`)
      }
      
    } catch (error) {
      console.error('[UnifiedSchemaService] Error discovering user utility schemas:', error)
    }
  }

  /**
   * Enrich schemas with interface definitions
   */
  private async enrichSchemasWithInterfaces(): Promise<void> {
    console.log('[UnifiedSchemaService] Enriching schemas with interface definitions...')
    
    try {
      // Enrich each schema that has a returnInterface
      for (const [schemaId, schema] of this.schemaCache) {
        if (schema.returnInterface) {
          const interfaceProperties = await this.getInterfaceProperties(schema.returnInterface)
          
          if (interfaceProperties && interfaceProperties.length > 0) {
            // Add interface properties to schema
            const enrichedSchema = {
              ...schema,
              returnObject: {
                name: schema.returnInterface,
                properties: this.convertPropertiesToReturnObject(interfaceProperties)
              }
            }
            
            this.schemaCache.set(schemaId, enrichedSchema)
            console.log(`[UnifiedSchemaService] ✅ Enriched ${schemaId} with ${schema.returnInterface} interface (${interfaceProperties.length} properties)`)
          }
        }
      }
      
    } catch (error) {
      console.error('[UnifiedSchemaService] Error enriching schemas with interfaces:', error)
    }
  }

  /**
   * Convert PropertyDefinition[] to returnObject format
   */
  private convertPropertiesToReturnObject(properties: PropertyDefinition[]): Record<string, any> {
    const returnObjectProperties: Record<string, any> = {}
    
    for (const prop of properties) {
      returnObjectProperties[prop.name] = {
        type: prop.type,
        description: prop.description,
        nullable: prop.nullable,
        optional: prop.optional,
        isCollection: prop.isCollection,
        elementType: prop.elementType
      }
    }
    
    return returnObjectProperties
  }

  /**
   * Force refresh cache
   */
  async refresh(tenantId?: string): Promise<void> {
    await this.getAllSchemas(tenantId, true)
  }

  /**
   * Get all available modules
   */
  async getAvailableModules(tenantId?: string): Promise<string[]> {
    const schemas = await this.getAllSchemas(tenantId)
    const modules = new Set<string>()
    
    for (const schema of schemas) {
      if (schema.module) {
        modules.add(schema.module)
      }
    }
    
    return Array.from(modules)
  }

  /**
   * Get all available interfaces
   */
  async getAvailableInterfaces(): Promise<string[]> {
    // Load interfaces if not already cached
    if (this.interfaceCache.size === 0) {
      await this.loadInterfacesFromTypeScript()
    }
    
    return Array.from(this.interfaceCache.keys())
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const unifiedSchemaService = UnifiedSchemaService.getInstance()
