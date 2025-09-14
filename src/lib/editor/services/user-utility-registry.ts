// User Utility Schema Registry - Load and manage user-defined function schemas
// Provides UnifiedSchema objects for IntelliSense alongside built-in modules

import type { UnifiedSchema } from '../schemas/types'
import { getActionClient } from '@/lib/action-client'

export class UserUtilitySchemaRegistry {
  private cache: Map<string, UnifiedSchema[]> = new Map()
  private lastCacheTime = 0
  private readonly CACHE_TTL = 30000 // 30 seconds - fast refresh for dev

  /**
   * 🚀 LIGHTNING FAST: Get all user utility schemas with smart caching
   * Returns UnifiedSchema objects ready for IntelliSense
   */
  async getAllUserSchemas(tenantId: string, force = false): Promise<UnifiedSchema[]> {
    const now = Date.now()
    
    // Use cache if fresh (sub-millisecond performance)
    if (!force && this.cache.has(tenantId) && (now - this.lastCacheTime) < this.CACHE_TTL) {
      return this.cache.get(tenantId) || []
    }

    try {
      // ⚡ BLAZING FAST: Use ActionClient for IndexedDB query (< 5ms typical)
      const actionClient = getActionClient(tenantId)
      
      // Execute rule.list action with UTILITY filter and schema field
      const result = await actionClient.executeAction({
        action: 'rule.list',
        data: { 
          type: 'UTILITY', 
          isActive: true,
          // Include schema field in response
          include: ['schema']
        }
      })

      if (!result.success || !result.data) {
        console.warn('Failed to fetch user utility schemas:', result.error)
        return this.cache.get(tenantId) || []
      }

      // Extract schemas from UTILITY rules
      const schemas: UnifiedSchema[] = result.data
        .filter((rule: any) => rule.schema) // Only rules with schema field
        .map((rule: any) => {
          try {
            // Parse the JSON schema stored in Rule.schema field
            const schema = typeof rule.schema === 'string' 
              ? JSON.parse(rule.schema) 
              : rule.schema
            
            // Validate it's a proper UnifiedSchema
            if (this.isValidSchema(schema)) {
              return schema as UnifiedSchema
            } else {
              console.warn(`Invalid schema for rule ${rule.name}:`, schema)
              return null
            }
          } catch (error) {
            console.warn(`Failed to parse schema for rule ${rule.name}:`, error)
            return null
          }
        })
        .filter(Boolean) as UnifiedSchema[] // Remove null entries

      // Update cache
      this.cache.set(tenantId, schemas)
      this.lastCacheTime = now

  
      return schemas
      
    } catch (error) {
      console.error('Error loading user utility schemas:', error)
      // Return cached data if available
      return this.cache.get(tenantId) || []
    }
  }

  /**
   * Get a specific user utility schema by function name
   */
  async getUserSchemaByName(tenantId: string, functionName: string): Promise<UnifiedSchema | null> {
    const schemas = await this.getAllUserSchemas(tenantId)
    return schemas.find(schema => schema.name === functionName) || null
  }

  /**
   * Check if user function exists
   */
  async hasUserFunction(tenantId: string, functionName: string): Promise<boolean> {
    const schema = await this.getUserSchemaByName(tenantId, functionName)
    return schema !== null
  }

  /**
   * Get user functions by category
   */
  async getUserSchemasByCategory(tenantId: string, category = 'user-utilities'): Promise<UnifiedSchema[]> {
    const schemas = await this.getAllUserSchemas(tenantId)
    return schemas.filter(schema => schema.category === category)
  }

  /**
   * Clear cache for tenant (force refresh)
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.cache.delete(tenantId)
    } else {
      this.cache.clear()
    }
    this.lastCacheTime = 0
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { tenants: number; totalSchemas: number; lastUpdated: Date | null } {
    const totalSchemas = Array.from(this.cache.values())
      .reduce((sum, schemas) => sum + schemas.length, 0)
    
    return {
      tenants: this.cache.size,
      totalSchemas,
      lastUpdated: this.lastCacheTime ? new Date(this.lastCacheTime) : null
    }
  }

  /**
   * Validate that an object is a proper UnifiedSchema
   */
  private isValidSchema(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    
    // Check required fields
    const requiredFields = ['id', 'name', 'type', 'category', 'description']
    for (const field of requiredFields) {
      if (!obj[field]) return false
    }
    
    // Check type is 'function' for user utilities
    if (obj.type !== 'function') return false
    
    // Check parameters structure if present
    if (obj.parameters && !Array.isArray(obj.parameters)) return false
    
    if (obj.parameters) {
      for (const param of obj.parameters) {
        if (!param.name || !param.type) return false
      }
    }
    
    return true
  }

  /**
   * Update schema for a specific rule (called when rule is saved)
   */
  async updateRuleSchema(tenantId: string, ruleId: string, schema: UnifiedSchema): Promise<void> {
    try {
      const actionClient = getActionClient(tenantId)
      
      await actionClient.executeAction({
        action: 'rule.update',
        data: {
          id: ruleId,
          schema: schema
        }
      })
      
      // Clear cache to force refresh
      this.clearCache(tenantId)
      
    } catch (error) {
      console.error('Error updating rule schema:', error)
      throw error
    }
  }
}

// Export singleton instance
export const userUtilityRegistry = new UserUtilitySchemaRegistry()