export type TypeCategory = 'primitive' | 'system' | 'custom'

export interface TypeProperty {
  name: string
  type: string
  description?: string
  required?: boolean
  defaultValue?: any
}

export interface TypeMethod {
  name: string
  description?: string
  parameters: TypeProperty[]
  returnType: string
}

export interface BaseTypeDefinition {
  id: string
  name: string
  category: TypeCategory
  description: string
  icon?: string
  popularity?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface PrimitiveType extends BaseTypeDefinition {
  category: 'primitive'
  // Primitives are simple and don't have complex structure
}

export interface SystemType extends BaseTypeDefinition {
  category: 'system'
  properties: TypeProperty[]
  methods?: TypeMethod[]
  extends?: string[] // Can extend other types
}

export interface CustomType extends BaseTypeDefinition {
  category: 'custom'
  properties: TypeProperty[]
  methods?: TypeMethod[]
  extends?: string[] // Can extend other types
  isAbstract?: boolean
  namespace?: string // For organization
}

export type TypeDefinition = PrimitiveType | SystemType | CustomType

export interface TypeRegistry {
  [typeId: string]: TypeDefinition
}

// Type registry class for managing all types
export class TypeRegistryManager {
  private registry: TypeRegistry = {}
  private listeners: ((registry: TypeRegistry) => void)[] = []

  constructor() {
    this.initializeBuiltInTypes()
  }

  private initializeBuiltInTypes() {
    // Add primitive types
    this.addType({
      id: 'string',
      name: 'string',
      category: 'primitive',
      description: 'Text value',
      popularity: 10
    })

    this.addType({
      id: 'number',
      name: 'number', 
      category: 'primitive',
      description: 'Numeric value (integer or decimal)',
      popularity: 9
    })

    this.addType({
      id: 'boolean',
      name: 'boolean',
      category: 'primitive', 
      description: 'True or false value',
      popularity: 8
    })

    this.addType({
      id: 'array',
      name: 'array',
      category: 'primitive',
      description: 'List of values',
      popularity: 7
    })

    this.addType({
      id: 'object',
      name: 'object',
      category: 'primitive',
      description: 'Complex object with properties',
      popularity: 6
    })

    this.addType({
      id: 'date',
      name: 'date',
      category: 'primitive',
      description: 'Date and time value',
      popularity: 5
    })

    // Add system types (these would typically be loaded from configuration)
    this.addType({
      id: 'pnr',
      name: 'PNR',
      category: 'system',
      description: 'Passenger Name Record',
      popularity: 4,
      properties: [
        { name: 'pnrNumber', type: 'string', required: true, description: 'PNR identifier' },
        { name: 'passengers', type: 'array', required: true, description: 'List of passengers' },
        { name: 'flights', type: 'array', required: true, description: 'Flight segments' },
        { name: 'bookingDate', type: 'date', required: true, description: 'When booking was made' }
      ],
      methods: [
        {
          name: 'addPassenger',
          description: 'Add a passenger to the PNR',
          parameters: [{ name: 'passenger', type: 'passenger', required: true }],
          returnType: 'boolean'
        }
      ]
    })

    this.addType({
      id: 'passenger',
      name: 'Passenger',
      category: 'system',
      description: 'Passenger information',
      popularity: 4,
      properties: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'lastName', type: 'string', required: true },
        { name: 'age', type: 'number', required: false },
        { name: 'tier', type: 'string', required: false, description: 'Loyalty tier' },
        { name: 'specialRequests', type: 'array', required: false }
      ]
    })

    this.addType({
      id: 'flight',
      name: 'Flight',
      category: 'system',
      description: 'Flight details',
      popularity: 3,
      properties: [
        { name: 'flightNumber', type: 'string', required: true },
        { name: 'departure', type: 'date', required: true },
        { name: 'arrival', type: 'date', required: true },
        { name: 'origin', type: 'string', required: true },
        { name: 'destination', type: 'string', required: true },
        { name: 'aircraft', type: 'string', required: false }
      ]
    })
  }

  addType(type: TypeDefinition): void {
    this.registry[type.id] = type
    this.notifyListeners()
  }

  removeType(typeId: string): boolean {
    if (this.registry[typeId] && this.registry[typeId].category === 'custom') {
      delete this.registry[typeId]
      this.notifyListeners()
      return true
    }
    return false
  }

  getType(typeId: string): TypeDefinition | undefined {
    return this.registry[typeId]
  }

  getAllTypes(): TypeDefinition[] {
    return Object.values(this.registry)
  }

  getTypesByCategory(category: TypeCategory): TypeDefinition[] {
    return Object.values(this.registry).filter(type => type.category === category)
  }

  searchTypes(query: string): TypeDefinition[] {
    const lowercaseQuery = query.toLowerCase()
    return Object.values(this.registry).filter(type => 
      type.name.toLowerCase().includes(lowercaseQuery) ||
      type.description.toLowerCase().includes(lowercaseQuery)
    ).sort((a, b) => {
      // Exact matches first
      const aExact = a.name.toLowerCase() === lowercaseQuery ? 1 : 0
      const bExact = b.name.toLowerCase() === lowercaseQuery ? 1 : 0
      if (aExact !== bExact) return bExact - aExact
      
      // Then by popularity
      return (b.popularity || 0) - (a.popularity || 0)
    })
  }

  // Check if a type depends on another type
  getTypeDependencies(typeId: string): string[] {
    const type = this.getType(typeId)
    if (!type || type.category === 'primitive') return []

    const dependencies: string[] = []
    
    if ('properties' in type && type.properties) {
      type.properties.forEach(prop => {
        if (prop.type !== 'string' && prop.type !== 'number' && 
            prop.type !== 'boolean' && prop.type !== 'date' && 
            prop.type !== 'array' && prop.type !== 'object') {
          dependencies.push(prop.type)
        }
      })
    }

    if ('extends' in type && type.extends) {
      dependencies.push(...type.extends)
    }

    return [...new Set(dependencies)] // Remove duplicates
  }

  // Validate a type definition
  validateType(type: TypeDefinition): string[] {
    const errors: string[] = []

    if (!type.name.trim()) {
      errors.push('Type name is required')
    }

    if (!type.description.trim()) {
      errors.push('Type description is required')
    }

    if (type.category === 'custom' || type.category === 'system') {
      const complexType = type as SystemType | CustomType
      
      if (complexType.properties) {
        complexType.properties.forEach((prop, index) => {
          if (!prop.name.trim()) {
            errors.push(`Property ${index + 1}: Name is required`)
          }
          if (!prop.type.trim()) {
            errors.push(`Property ${index + 1}: Type is required`)
          }
        })
      }

      // Check for circular dependencies
      const dependencies = this.getTypeDependencies(type.id)
      if (dependencies.includes(type.id)) {
        errors.push('Circular dependency detected')
      }
    }

    return errors
  }

  // Subscribe to registry changes
  subscribe(listener: (registry: TypeRegistry) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.registry))
  }

  // Export/Import for persistence
  exportRegistry(): string {
    return JSON.stringify({
      version: '1.0.0',
      registry: this.registry,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  importRegistry(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      if (parsed.registry) {
        // Only import custom types to preserve built-ins
        Object.values(parsed.registry).forEach((type: any) => {
          if (type.category === 'custom') {
            this.registry[type.id] = type
          }
        })
        this.notifyListeners()
        return true
      }
    } catch (error) {
      console.error('Failed to import type registry:', error)
    }
    return false
  }
}

// Global instance
export const typeRegistry = new TypeRegistryManager() 