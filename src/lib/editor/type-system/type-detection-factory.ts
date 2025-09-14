/**
 * 🎯 BULLETPROOF TYPE DETECTION - Unified System Integration
 * 
 * Now uses the unified type system for consistent, reliable type detection.
 * No more fragmented regex patterns or conflicting type names.
 */

import type { UnifiedType } from '@/lib/editor/schemas'
import { debugUnifiedTypeSystem } from '@/lib/editor/schemas'
import { inferTypeWithConfidence } from '@/lib/editor/schemas/types/primitive-types'
import { getMethodCategoriesForType } from '@/lib/editor/schemas/types/method-categories'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'

// =============================================================================
// UNIFIED VARIABLE INFO INTERFACE
// =============================================================================

export interface UnifiedVariableInfo {
  name: string
  type: UnifiedType
  confidence: number
  source: 'literal' | 'method_chain' | 'pattern_match' | 'sql_query'
  evidence: string
  availableMethods: typeof ALL_METHOD_SCHEMAS
  tableSchema?: string  // 🎯 Table name for query results
}

// =============================================================================
// BULLETPROOF TYPE DETECTION FACTORY
// =============================================================================

export class UnifiedTypeDetectionFactory {
  private typeCache = new Map<string, UnifiedVariableInfo>()

  /**
   * 🎯 MAIN METHOD: Detect variable type using unified system
   */
  detectVariableType(varName: string, allText: string): UnifiedVariableInfo {
    // 🎯 CRITICAL FIX: Include query content in cache key to detect query changes
    const queryAssignment = this.extractQueryAssignment(varName, allText)
    const cacheKey = queryAssignment
      ? `${varName}:query:${this.hashString(queryAssignment)}`
      : `${varName}:${allText.length}`

    console.log('🔍 [TypeDetection] Cache key debug:', {
      varName,
      cacheKey,
      queryAssignment: queryAssignment ? queryAssignment.substring(0, 50) + '...' : null
    })

    if (this.typeCache.has(cacheKey)) {
      const cached = this.typeCache.get(cacheKey)!
      console.log('🔍 [TypeDetection] Using cached result:', {
        type: cached.type,
        tableSchema: cached.tableSchema,
        confidence: cached.confidence
      })
      return cached
    }



    const lines = allText.split('\n')
    let bestMatch: UnifiedVariableInfo = {
      name: varName,
      type: 'unknown',
      confidence: 0.0,
      source: 'pattern_match',
      evidence: 'No assignment found',
      availableMethods: []
    }

    // Scan all lines for variable assignments
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip non-assignment lines
      if (!trimmed.includes('=') || trimmed.startsWith('//')) {
        continue
      }

      // Use unified type inference
      const inference = inferTypeWithConfidence(varName, trimmed)
      
      // Keep the highest confidence match
      if (inference.confidence > bestMatch.confidence) {
        const availableMethods = this.getMethodsForUnifiedType(inference.type)
        
        bestMatch = {
          name: varName,
          type: inference.type,
          confidence: inference.confidence,
          source: inference.source,
          evidence: inference.evidence,
          availableMethods,
          tableSchema: inference.tableSchema  // 🎯 Pass through table schema
        }


        
        // Perfect match found, stop searching
        if (inference.confidence === 1.0) {
          break
        }
      }
    }

    // Cache the result
    this.typeCache.set(cacheKey, bestMatch)
    console.log('🧩 [TypeDetection] Computed and cached:', {
      varName,
      cacheKey,
      type: bestMatch.type,
      tableSchema: bestMatch.tableSchema,
      confidence: bestMatch.confidence,
      evidence: bestMatch.evidence
    })
    


    return bestMatch
  }

  /**
   * 🎯 Get methods for unified type using new mapping system
   */
  private getMethodsForUnifiedType(type: UnifiedType): typeof ALL_METHOD_SCHEMAS {
    // Get method categories for this type
    const categories = getMethodCategoriesForType(type)
    

    
    // Filter ALL_METHOD_SCHEMAS by these categories
    const methods = ALL_METHOD_SCHEMAS.filter(schema => 
      categories.includes(schema.category as any)
    )
    

    
    return methods
  }

  /**
   * 🎯 Debug helper to show unified type resolution
   */
  debugTypeResolution(varName: string, allText: string): {
    detectionResult: UnifiedVariableInfo
    systemDebug: ReturnType<typeof debugUnifiedTypeSystem>
  } {
    const detectionResult = this.detectVariableType(varName, allText)
    const systemDebug = debugUnifiedTypeSystem(detectionResult.type as string)
    
    return {
      detectionResult,
      systemDebug
    }
  }

  /**
   * Clear cache for testing or when queries change
   */
  clearCache(): void {
    console.log('🔍 [TypeDetection] Clearing type cache')
    this.typeCache.clear()
  }

  /**
   * Clear cache for specific variable (when query changes)
   */
  clearVariableCache(varName: string): void {
    console.log('🔍 [TypeDetection] Clearing cache for variable:', varName)
    const keysToDelete = Array.from(this.typeCache.keys()).filter(key =>
      key.startsWith(`${varName}:`)
    )
    keysToDelete.forEach(key => this.typeCache.delete(key))
    console.log('🔍 [TypeDetection] Cleared', keysToDelete.length, 'cache entries for', varName)
  }

  /**
   * 🎯 Extract query assignment line for a variable (for cache invalidation)
   */
  private extractQueryAssignment(varName: string, allText: string): string | null {
    const lines = allText.split('\n')
    const queryPattern = new RegExp(`^\\s*${varName}\\s*=\\s*SELECT.*FROM\\s+([A-Za-z_]\\w*)`, 'i')

    for (const line of lines) {
      const match = line.match(queryPattern)
      if (match) {
        return line.trim() // Return the full assignment line
      }
    }

    return null
  }

  /**
   * Simple string hash for cache keys
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.typeCache.size,
      keys: Array.from(this.typeCache.keys())
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

/**
 * Singleton instance for consistent usage across the application
 */
export const unifiedTypeDetectionFactory = new UnifiedTypeDetectionFactory()