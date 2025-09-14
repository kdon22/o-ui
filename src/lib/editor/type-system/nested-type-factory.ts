/**
 * 🏭 NESTED TYPE FACTORY - Universal Type Discovery System
 * 
 * Auto-discovers ALL nested types from any source:
 * - UTR business object schemas (ContactInfo, Passenger, etc.)
 * - User-defined classes with deep nesting
 * - Module return types with nested properties
 * - TypeScript interfaces from schema files
 * 
 * Provides completions for ANY depth: customer.address.country.regulations[0].details
 */

import { BusinessObjectSchema } from '../schemas/business-objects/types'
import { ClassIndexer } from './class-indexer'
import { schemaBridge } from './schema-bridge'

// =============================================================================
// CORE TYPE DEFINITIONS
// =============================================================================

export interface TypeDefinition {
  name: string
  properties: PropertyDefinition[]
  methods: MethodDefinition[]
  source: 'business-object' | 'user-class' | 'module-return' | 'typescript-interface'
  description?: string
  isCollection?: boolean
  elementType?: string
}

export interface PropertyDefinition {
  name: string
  type: string
  description?: string
  isCollection?: boolean
  elementType?: string
  nullable?: boolean
}

export interface MethodDefinition {
  name: string
  returnType: string
  returnInterface?: string    // Interface name for complex return types (e.g., 'StringSplitResult')
  parameters?: ParameterDefinition[]
  description?: string
}

export interface ParameterDefinition {
  name: string
  type: string
  optional?: boolean
  description?: string
}

// =============================================================================
// NESTED TYPE FACTORY - UNIVERSAL TYPE DISCOVERY
// =============================================================================

export class NestedTypeFactory {
  private typeRegistry: Map<string, TypeDefinition> = new Map()
  private visited: Set<string> = new Set()
  private allText: string
  private initializationPromise: Promise<void>

  constructor(allText: string) {
    this.allText = allText
    this.initializationPromise = this.initializeAsync()
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<void> {
    await this.initializationPromise
  }

  /**
   * Initialize factory with schema bridge integration
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Initialize with SSOT Schema Bridge (no async needed)
      console.log(`[NestedTypeFactory] Using SSOT Schema Bridge for type resolution`)

      // Discover all types from schemas
      this.discoverAllTypes()

      console.log(`[NestedTypeFactory] Initialization complete`)
    } catch (error) {
      console.error(`[NestedTypeFactory] Error during initialization:`, error)
    }
  }

  /**
   * Main discovery orchestrator - crawls all type sources
   */
  private discoverAllTypes(): void {
    console.log(`[NestedTypeFactory] Starting universal type discovery...`)
    
    // Phase 1: Crawl business object schemas recursively
    this.crawlBusinessObjectSchemas()
    
    // Phase 2: Crawl user-defined classes recursively
    this.crawlUserDefinedClasses()
    
    // Phase 3: Crawl module return types recursively
    this.crawlModuleReturnTypes()
    
    // Phase 4: Auto-generate missing TypeScript interface types
    this.generateMissingInterfaceTypes()
    
    console.log(`[NestedTypeFactory] Discovery complete. Found ${this.typeRegistry.size} types:`, 
      Array.from(this.typeRegistry.keys()))
  }

  /**
   * Phase 1: Recursively crawl business object schemas
   */
  private crawlBusinessObjectSchemas(): void {
    console.log(`[NestedTypeFactory] Phase 1: Crawling business object schemas...`)
    
    // Dynamically discover all business object schemas
    const discoveredSchemas = this.discoverBusinessObjectSchemas()
    
    for (const schema of discoveredSchemas) {
      this.crawlBusinessObjectSchema(schema)
    }
  }

  /**
   * Dynamically discover all business object schemas from imports
   */
  private discoverBusinessObjectSchemas(): BusinessObjectSchema[] {
    const schemas: BusinessObjectSchema[] = []
    
    try {
      // Try to dynamically import business object schemas
      console.log(`[NestedTypeFactory] Discovering business object schemas...`)
      
      // Import business objects index to get all schemas
      const businessObjectsModule = require('../schemas/business-objects')
      
      // NO HARDCODED UTR SCHEMA LOOKUP - Must use dynamic discovery only
      console.log(`[NestedTypeFactory] No hardcoded UTR schema lookup - using dynamic discovery only`)
      
      // Extract all business object schemas if available
      if (businessObjectsModule.ALL_BUSINESS_OBJECT_SCHEMAS && Array.isArray(businessObjectsModule.ALL_BUSINESS_OBJECT_SCHEMAS)) {
        schemas.push(...businessObjectsModule.ALL_BUSINESS_OBJECT_SCHEMAS)
        console.log(`[NestedTypeFactory] Found ${businessObjectsModule.ALL_BUSINESS_OBJECT_SCHEMAS.length} additional business object schemas`)
      }
      
      // Try to discover other business object schema exports
      const moduleKeys = Object.keys(businessObjectsModule)
      for (const key of moduleKeys) {
        const value = businessObjectsModule[key]
        
        // Check if this looks like a business object schema
        if (this.isBusinessObjectSchema(value) && !schemas.includes(value)) {
          schemas.push(value)
          console.log(`[NestedTypeFactory] Discovered business object schema: ${key}`)
        }
      }
      
    } catch (error) {
      console.warn(`[NestedTypeFactory] Could not dynamically discover business object schemas:`, error)
    }
    
    console.log(`[NestedTypeFactory] Total discovered business object schemas: ${schemas.length}`)
    return schemas
  }

  /**
   * Recursively crawl a single business object schema
   */
  private crawlBusinessObjectSchema(schema: BusinessObjectSchema): void {
    if (this.visited.has(schema.name)) return
    this.visited.add(schema.name)
    
    console.log(`[NestedTypeFactory] Crawling business object: "${schema.name}"`)
    
    // Convert schema properties to our format
    const properties: PropertyDefinition[] = Object.values(schema.properties).map(prop => ({
      name: prop.name,
      type: String(prop.type),
      description: prop.description,
      isCollection: prop.isCollection,
      elementType: prop.elementType ? String(prop.elementType) : undefined,
      nullable: prop.nullable
    }))
    
    // Convert schema methods to our format
    const methods: MethodDefinition[] = Object.values(schema.methods || {}).map(method => ({
      name: method.name,
      returnType: String(method.returnType || 'any'),
      parameters: method.parameters?.map(param => ({
        name: param.name,
        type: String(param.type),
        optional: param.optional,
        description: param.description
      })),
      description: method.description
    }))
    
    // Register this type
    this.typeRegistry.set(schema.name, {
      name: schema.name,
      properties,
      methods,
      source: 'business-object',
      description: schema.description
    })
    
    // Recursively discover nested types from properties
    for (const prop of properties) {
      const typeToDiscover = prop.elementType || prop.type
      
      if (this.isBusinessObjectType(typeToDiscover) && !this.visited.has(typeToDiscover)) {
        // Try to find existing schema for this type
        const nestedSchema = this.findBusinessObjectSchema(typeToDiscover)
        if (nestedSchema) {
          this.crawlBusinessObjectSchema(nestedSchema)
        } else {
          // Mark for TypeScript interface generation
          this.queueForInterfaceGeneration(typeToDiscover)
        }
      }
    }
  }

  /**
   * Phase 2: Crawl user-defined classes from code
   */
  private crawlUserDefinedClasses(): void {
    console.log(`[NestedTypeFactory] Phase 2: Crawling user-defined classes...`)
    
    try {
      const classes = ClassIndexer.index(this.allText)
      
      for (const [className, classInfo] of Object.entries(classes)) {
        if (this.visited.has(className)) continue
        this.visited.add(className)
        
        console.log(`[NestedTypeFactory] Crawling user class: "${className}"`)
        
        // Convert class properties
        const properties: PropertyDefinition[] = classInfo.properties.map(prop => ({
          name: prop.name,
          type: String(prop.type || 'any'),
          description: prop.description
        }))
        
        // Convert class actions (methods)
        const methods: MethodDefinition[] = classInfo.actions.map(action => ({
          name: action.name,
          returnType: String(action.returnType || 'any'),
          parameters: action.parameters?.map(param => ({
            name: param.name,
            type: String((param as any).type || 'any'),
            optional: (param as any).optional
          })),
          description: action.description
        }))
        
        // Register this user-defined type
        this.typeRegistry.set(className, {
          name: className,
          properties,
          methods,
          source: 'user-class',
          description: `User-defined class: ${className}`
        })
        
        // Recursively discover nested types from properties
        for (const prop of properties) {
          if (this.isBusinessObjectType(prop.type) && !this.visited.has(prop.type)) {
            this.queueForInterfaceGeneration(prop.type)
          }
        }
      }
    } catch (error) {
      console.error(`[NestedTypeFactory] Error crawling user classes:`, error)
    }
  }

  /**
   * Phase 3: Crawl module return types
   */
  private crawlModuleReturnTypes(): void {
    console.log(`[NestedTypeFactory] Phase 3: Crawling module return types...`)

    // Dynamically discover all module schemas
    const discoveredModuleSchemas = this.discoverModuleSchemas()

    for (const moduleSchema of discoveredModuleSchemas) {
      // Check both returnType and returnInterface properties
      const returnType = moduleSchema.returnType || moduleSchema.returnInterface

      if (returnType && this.isBusinessObjectType(returnType) && !this.visited.has(returnType)) {
        console.log(`[NestedTypeFactory] Found module return type/interface: "${returnType}" from ${moduleSchema.name}`)
        this.queueForInterfaceGeneration(returnType)
      }
    }
  }

  /**
   * Dynamically discover all module schemas from imports
   */
  private discoverModuleSchemas(): any[] {
    const schemas: any[] = []
    
    try {
      console.log(`[NestedTypeFactory] Discovering module schemas...`)
      
      // Try to import modules index to get all schemas
      const modulesModule = require('../schemas/modules')
      
      // Extract ALL_MODULE_SCHEMAS if available
      if (modulesModule.ALL_MODULE_SCHEMAS && Array.isArray(modulesModule.ALL_MODULE_SCHEMAS)) {
        schemas.push(...modulesModule.ALL_MODULE_SCHEMAS)
        console.log(`[NestedTypeFactory] Found ${modulesModule.ALL_MODULE_SCHEMAS.length} module schemas`)
      }
      
      // Try to discover other module schema exports
      const moduleKeys = Object.keys(modulesModule)
      for (const key of moduleKeys) {
        const value = modulesModule[key]
        
        // Check if this looks like a module schema array
        if (Array.isArray(value) && key.includes('SCHEMA')) {
          // Check if any of these values are already in schemas to avoid duplicates
          const newSchemas = value.filter(item => !schemas.includes(item))
          if (newSchemas.length > 0) {
            schemas.push(...newSchemas)
            console.log(`[NestedTypeFactory] Discovered ${newSchemas.length} module schemas from: ${key}`)
          }
        }
      }
      
    } catch (error) {
      console.warn(`[NestedTypeFactory] Could not dynamically discover module schemas:`, error)
    }
    
    console.log(`[NestedTypeFactory] Total discovered module schemas: ${schemas.length}`)
    return schemas
  }

  /**
   * Phase 4: Generate missing types from TypeScript interfaces
   */
  private generateMissingInterfaceTypes(): void {
    console.log(`[NestedTypeFactory] Phase 4: Generating missing interface types...`)
    
    // Get all types that were queued but not found
    const missingTypes = Array.from(this.visited).filter(typeName => 
      !this.typeRegistry.has(typeName) && this.isBusinessObjectType(typeName)
    )
    
    console.log(`[NestedTypeFactory] Found ${missingTypes.length} missing types to generate:`, missingTypes)
    
    for (const typeName of missingTypes) {
      this.generateFromTypeScriptInterface(typeName)
    }
  }

  /**
   * Generate type definition using SSOT Schema Bridge
   */
  private generateFromTypeScriptInterface(typeName: string): void {
    console.log(`[NestedTypeFactory] Attempting to generate interface for: "${typeName}"`)

    try {
      // Try to resolve using schema bridge business object property lookup
      const businessObjectType = schemaBridge.getBusinessObjectPropertyType?.(typeName, '', this.allText)
      
      if (businessObjectType && businessObjectType !== 'unknown') {
        console.log(`[NestedTypeFactory] Found type via schema bridge for: "${typeName}"`)
        
        // Create a basic type definition from schema bridge info
        this.typeRegistry.set(typeName, {
          name: typeName,
          properties: [], // Will be populated by recursive discovery
          methods: [],
          source: 'typescript-interface',
          description: `Auto-generated from SSOT Schema Bridge: ${typeName}`
        })
      } else {
        // Provide sensible defaults for well-known ubiquitous types
        const defaultInterfaces: Record<string, PropertyDefinition[]> = {
          SourceAttribution: [
            { name: 'system', type: 'string', description: 'Originating system' },
            { name: 'type', type: 'string', description: 'Attribution type' }
          ]
        }

        const defaults = (defaultInterfaces as any)[typeName]
        if (defaults) {
          console.log(`[NestedTypeFactory] Using built-in defaults for interface: ${typeName}`)
          this.typeRegistry.set(typeName, {
            name: typeName,
            properties: defaults,
            methods: [],
            source: 'typescript-interface',
            description: `Auto-generated defaults for ${typeName}`
          })
        } else {
          // Create a placeholder type so we don't keep trying
          console.log(`[NestedTypeFactory] Creating placeholder for unknown type: ${typeName}`)
          this.typeRegistry.set(typeName, {
            name: typeName,
            properties: [],
            methods: [],
            source: 'typescript-interface',
            description: `Placeholder for unknown type: ${typeName}`
          })
        }
      }
    } catch (error) {
      console.error(`[NestedTypeFactory] Error generating interface for "${typeName}":`, error)
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Check if a type name represents a business object (not a primitive)
   */
  private isBusinessObjectType(typeName: string): boolean {
    if (!typeName) return false
    
    // Primitive types are not business objects
    const primitives = ['string', 'number', 'boolean', 'date', 'any', 'unknown', 'void', 
                       'str', 'int', 'float', 'bool', 'array', 'object', 'dict']
    
    if (primitives.includes(typeName.toLowerCase())) return false
    
    // Collection syntax like 'Passenger[]' or '<Passenger>'
    if (typeName.endsWith('[]')) return true
    if (typeName.match(/^<\s*[A-Z]/)) return true
    
    // Capitalized names are likely business objects
    return /^[A-Z][A-Za-z0-9_]*$/.test(typeName)
  }

  /**
   * Find existing business object schema by name (dynamically)
   */
  private findBusinessObjectSchema(typeName: string): BusinessObjectSchema | null {
    // Dynamically discover and search through all available schemas
    const discoveredSchemas = this.discoverBusinessObjectSchemas()
    
    return discoveredSchemas.find(schema => schema.name === typeName) || null
  }

  /**
   * Check if an object looks like a business object schema
   */
  private isBusinessObjectSchema(obj: any): obj is BusinessObjectSchema {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           obj.properties && 
           typeof obj.properties === 'object'
  }

  /**
   * Queue a type for interface generation (mark as visited)
   */
  private queueForInterfaceGeneration(typeName: string): void {
    if (!this.visited.has(typeName)) {
      console.log(`[NestedTypeFactory] Queuing for interface generation: "${typeName}"`)
      this.visited.add(typeName)
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get type definition by name
   */
  getType(typeName: string): TypeDefinition | null {
    const type = this.typeRegistry.get(typeName)
    if (type) {
      console.log(`[NestedTypeFactory] Found type "${typeName}" with ${type.properties.length} properties and ${type.methods.length} methods`)
    } else {
      console.log(`[NestedTypeFactory] Type "${typeName}" not found in registry`)
    }
    return type || null
  }

  /**
   * Get all registered type names
   */
  getAllTypeNames(): string[] {
    return Array.from(this.typeRegistry.keys())
  }

  /**
   * Get types by source
   */
  getTypesBySource(source: TypeDefinition['source']): TypeDefinition[] {
    return Array.from(this.typeRegistry.values()).filter(type => type.source === source)
  }

  /**
   * Debug: Get full registry
   */
  getRegistry(): Map<string, TypeDefinition> {
    return new Map(this.typeRegistry)
  }
}

// =============================================================================
// FACTORY INSTANCE MANAGEMENT & CACHING
// =============================================================================

// Cache factory instances by text hash for performance
const factoryCache = new Map<string, Promise<NestedTypeFactory>>()
// Cache of fully initialized factories for synchronous access where needed
const readyFactoryCache = new Map<string, NestedTypeFactory>()

/**
 * Get or create cached NestedTypeFactory instance (async)
 */
export async function createNestedTypeFactory(allText: string): Promise<NestedTypeFactory> {
  // Simple hash for caching (in production, use a proper hash function)
  const textHash = hashCode(allText)
  
  if (!factoryCache.has(textHash)) {
    console.log(`[NestedTypeFactory] Creating new factory instance for text hash: ${textHash}`)
    
    const factoryPromise = createFactoryInstance(allText)
    factoryCache.set(textHash, factoryPromise)
    
    // Limit cache size to prevent memory leaks
    if (factoryCache.size > 10) {
      const firstKey = factoryCache.keys().next().value
      if (firstKey) {
        factoryCache.delete(firstKey)
      }
    }
  } else {
    console.log(`[NestedTypeFactory] Using cached factory instance for text hash: ${textHash}`)
  }
  
  return factoryCache.get(textHash)!
}

/**
 * Create a new factory instance with proper async initialization
 */
async function createFactoryInstance(allText: string): Promise<NestedTypeFactory> {
  const factory = new NestedTypeFactory(allText)
  
  // Wait for async initialization to complete
  await factory.waitForInitialization()
  // Store in ready cache for synchronous consumers
  const textHash = hashCode(allText)
  readyFactoryCache.set(textHash, factory)
  
  return factory
}

/**
 * Simple hash function for text caching
 */
function hashCode(text: string): string {
  let hash = 0
  if (text.length === 0) return hash.toString()
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

// =============================================================================
// SYNC ACCESS HELPERS (best effort)
// =============================================================================

/**
 * Return a fully initialized factory if available, otherwise null.
 * This allows synchronous code paths to leverage the already-built registry
 * without awaiting. It will return null on first-run before initialization.
 */
export function getReadyNestedTypeFactory(allText: string): NestedTypeFactory | null {
  const textHash = hashCode(allText)
  return readyFactoryCache.get(textHash) || null
}
