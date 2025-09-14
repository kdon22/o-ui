// 🏆 GOLD STANDARD: Lightning-fast utility discovery from IndexedDB
import { useState, useCallback, useEffect } from 'react'
import { getActionClient } from '@/lib/action-client'
import type { Rule } from '@/features/rules/types'

export interface UtilityParameter {
  id: string
  name: string
  type: string
  className?: string
  required: boolean
  description?: string
  defaultValue?: any
}

export interface UtilityDefinition {
  id: string
  name: string
  description?: string
  parameters: UtilityParameter[]
  returnType: string
  pythonName?: string
}

class UtilityService {
  private cache: Map<string, UtilityDefinition> = new Map()
  private lastCacheTime = 0
  private readonly CACHE_TTL = 30000 // 30 seconds - fast refresh for dev

  /**
   * 🚀 LIGHTNING FAST: Get all utilities with smart caching
   */
  async getAllUtilities(tenantId?: string, force = false): Promise<UtilityDefinition[]> {
    const now = Date.now()
    
    // Use cache if fresh (sub-millisecond performance)
    if (!force && this.cache.size > 0 && (now - this.lastCacheTime) < this.CACHE_TTL) {
      return Array.from(this.cache.values())
    }

    // Early return if no tenantId available
    if (!tenantId) {
      return Array.from(this.cache.values())
    }

    try {
      // ⚡ BLAZING FAST: Use ActionClient for IndexedDB query (< 5ms typical)
      const actionClient = getActionClient(tenantId)
      
      // Execute rule.list action with UTILITY filter
      const response = await actionClient.executeAction({
        action: 'rule.list',
        data: {
          type: 'UTILITY',
          isActive: true
        },
        options: {
          pagination: { page: 1, limit: 1000 }  // Load up to 1000 utility functions
        }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load utilities')
      }

      const utilityRules = response.data

      // Transform to clean definitions
      const utilities: UtilityDefinition[] = []
      
      for (const rule of utilityRules) {
        try {
          const definition = this.ruleToUtilityDefinition(rule)
          if (definition) {
            utilities.push(definition)
            this.cache.set(definition.name.toLowerCase(), definition)
          }
        } catch (error) {
          // Skip utilities that fail to parse
        }
      }

      this.lastCacheTime = now
      
      return utilities

    } catch (error) {
      return Array.from(this.cache.values()) // Fallback to cache
    }
  }

  /**
   * 🎯 INSTANT: Get specific utility by name (cache-first)
   */
  async getUtilityByName(name: string, tenantId?: string): Promise<UtilityDefinition | null> {
    const utilities = await this.getAllUtilities(tenantId)
    return utilities.find(u => u.name.toLowerCase() === name.toLowerCase()) || null
  }

  /**
   * 🔄 SMART REFRESH: Invalidate cache when utilities change
   */
  invalidateCache(): void {
    this.cache.clear()
    this.lastCacheTime = 0
  }

  /**
   * 🔧 BULLETPROOF: Convert Rule to UtilityDefinition with error handling
   */
  private ruleToUtilityDefinition(rule: any): UtilityDefinition | null {
    if (!rule.name || rule.type !== 'UTILITY') {
      return null
    }

    // Parse schema safely (replaces old parameters field)
    let parameters: UtilityParameter[] = []
    let returnType = 'string'
    
    if (rule.schema) {
      try {
        const schema = typeof rule.schema === 'string' 
          ? JSON.parse(rule.schema) 
          : rule.schema
        
        // Extract parameters from UnifiedSchema format
        if (schema.parameters && Array.isArray(schema.parameters)) {
          parameters = schema.parameters.map((p: any, index: number) => ({
            id: p.id || `param-${index}`,
            name: p.name || `param${index}`,
            type: p.type || 'string',
            className: p.className,
            required: p.required ?? true,
            description: p.description || '',
            defaultValue: p.defaultValue
          }))
        }
        
        // Extract return type from schema
        if (schema.returnType) {
          returnType = schema.returnType
        }
      } catch (error) {
        // Use empty parameters array if parsing fails
      }
    }

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      parameters,
      returnType,
      pythonName: rule.pythonName
    }
  }

  /**
   * 🔍 FAST SEARCH: Fuzzy search utilities
   */
  async searchUtilities(query: string, tenantId?: string): Promise<UtilityDefinition[]> {
    const utilities = await this.getAllUtilities(tenantId)
    const searchTerm = query.toLowerCase()
    
    return utilities
      .filter(u => 
        u.name.toLowerCase().includes(searchTerm) ||
        u.description?.toLowerCase().includes(searchTerm) ||
        u.parameters.some(p => p.name.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        // Exact name matches first
        const aExact = a.name.toLowerCase() === searchTerm ? 0 : 1
        const bExact = b.name.toLowerCase() === searchTerm ? 0 : 1
        return aExact - bExact || a.name.localeCompare(b.name)
      })
  }

  /**
   * ✅ VALIDATION: Check if return type matches definition
   */
  async validateReturnType(utilityName: string, expectedType: string, tenantId?: string): Promise<boolean> {
    const utility = await this.getUtilityByName(utilityName, tenantId)
    if (!utility) return false
    
    return utility.returnType === expectedType
  }
}

// 🎯 SINGLETON: One instance, maximum performance
export const utilityService = new UtilityService()

// 🔄 HOOK: React integration with auto-refresh
export function useUtilities(tenantId?: string, searchQuery?: string) {
  const [utilities, setUtilities] = useState<UtilityDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUtilities = useCallback(async () => {
    if (!tenantId) {
      setUtilities([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const result = searchQuery 
        ? await utilityService.searchUtilities(searchQuery, tenantId)
        : await utilityService.getAllUtilities(tenantId)
        
      setUtilities(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load utilities')
    } finally {
      setLoading(false)
    }
  }, [tenantId, searchQuery])

  useEffect(() => {
    loadUtilities()
  }, [loadUtilities])

  const refresh = useCallback(() => {
    utilityService.invalidateCache()
    loadUtilities()
  }, [loadUtilities])

  return { utilities, loading, error, refresh }
} 