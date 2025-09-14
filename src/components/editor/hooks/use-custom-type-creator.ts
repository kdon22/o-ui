import { useState } from 'react'
import { typeRegistry, CustomType, TypeProperty, TypeMethod } from '../types/type-registry'

export interface CreateCustomTypeData {
  name: string
  description: string
  properties: TypeProperty[]
  methods?: TypeMethod[]
  extends?: string[]
  namespace?: string
}

export function useCustomTypeCreator() {
  const [isCreating, setIsCreating] = useState(false)

  const createCustomType = async (data: CreateCustomTypeData): Promise<boolean> => {
    try {
      const customType: CustomType = {
        id: data.name.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        category: 'custom',
        description: data.description,
        properties: data.properties,
        methods: data.methods,
        extends: data.extends,
        namespace: data.namespace,
        popularity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // TODO: Add user ID when available
        createdBy: 'current-user'
      }

      // Validate the type
      const validationErrors = typeRegistry.validateType(customType)
      if (validationErrors.length > 0) {
        console.error('Type validation errors:', validationErrors)
        return false
      }

      // Add to registry
      typeRegistry.addType(customType)

      // TODO: Persist to backend/storage
      
      return true
    } catch (error) {
      console.error('Failed to create custom type:', error)
      return false
    }
  }

  const openTypeCreator = () => {
    setIsCreating(true)
    // TODO: Open type creation modal
  }

  const closeTypeCreator = () => {
    setIsCreating(false)
  }

  return {
    isCreating,
    createCustomType,
    openTypeCreator,
    closeTypeCreator
  }
}