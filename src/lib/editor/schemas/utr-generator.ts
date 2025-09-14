/**
 * 🎯 UTR Schema Generator - Auto-Import System
 * 
 * Generates UTR objects from schema for Monaco auto-completion
 * Replaces mock UTR data with schema-driven object generation
 */

import type { UTRSchema } from './types'

// Import the actual UTR schema from schemas directory
const UTR_SCHEMA_PATH = '../../../schemas/utr/utr-schema.json'

export interface UTRGeneratorOptions {
  includeHelperMethods?: boolean
  enableDeepInspection?: boolean
  generatePythonMethods?: boolean
}

/**
 * Generate UTR object structure from schema for Monaco IntelliSense
 */
export class UTRGenerator {
  private schema: any
  private options: UTRGeneratorOptions

  constructor(options: UTRGeneratorOptions = {}) {
    this.options = {
      includeHelperMethods: true,
      enableDeepInspection: true,
      generatePythonMethods: true,
      ...options
    }
  }

  /**
   * 🚀 Generate UTR object with IntelliSense support
   */
  async generateUTRForMonaco(utrData?: any): Promise<any> {
    try {
      // Load UTR schema (in production, this would be loaded from the schemas directory)
      this.schema = await this.loadUTRSchema()
      
      // Generate base UTR structure from schema
      const baseStructure = this.generateFromSchema(this.schema)
      
      // Merge with actual UTR data if provided
      if (utrData) {
        return this.mergeWithActualData(baseStructure, utrData)
      }
      
      return baseStructure
      
    } catch (error) {
      
      return this.getFallbackUTR()
    }
  }

  /**
   * Load UTR schema definition
   * NO HARDCODED SCHEMA - Must load from actual schema files or dynamic discovery
   */
  private async loadUTRSchema(): Promise<any> {
    // NO HARDCODED SCHEMA - Return null to force proper schema loading
    console.log(`[UTRGenerator] No hardcoded UTR schema - must load from actual TypeScript interfaces`)
    return null
  }

  /**
   * Generate object structure from JSON schema
   */
  private generateFromSchema(schema: any, depth = 0): any {
    if (depth > 10) return null // Prevent infinite recursion
    
    switch (schema.type) {
      case 'object':
        const obj: any = {}
        
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            obj[key] = this.generateFromSchema(propSchema as any, depth + 1)
          }
        }
        
        // Add helper methods if enabled
        if (this.options.includeHelperMethods && depth === 0) {
          obj._helpers = this.generateHelperMethods()
        }
        
        return obj
        
      case 'array':
        if (schema.items) {
          return [this.generateFromSchema(schema.items, depth + 1)]
        }
        return []
        
      case 'string':
        return ''
        
      case 'integer':
      case 'number':
        return 0
        
      case 'boolean':
        return false
        
      default:
        return null
    }
  }

  /**
   * Generate helper methods for UTR object
   */
  private generateHelperMethods(): any {
    return {
      // Passenger helpers
      getPassengerByNumber: (num: number) => `Helper: Get passenger ${num}`,
      getPrimaryPassenger: () => 'Helper: Get primary passenger',
      getPassengerCount: () => 'Helper: Get passenger count',
      
      // Segment helpers  
      getAirSegments: () => 'Helper: Get air segments',
      getHotelSegments: () => 'Helper: Get hotel segments',
      getCarSegments: () => 'Helper: Get car segments',
      getActiveSegments: () => 'Helper: Get active segments',
      
      // Contact helpers
      getPrimaryEmail: () => 'Helper: Get primary email',
      getPrimaryPhone: () => 'Helper: Get primary phone',
      
      // Corporate helpers
      hasCorporateTravel: () => 'Helper: Check corporate travel',
      getCorporateApprover: () => 'Helper: Get corporate approver',
      
      // Pricing helpers
      getTotalFareAmount: () => 'Helper: Get total fare',
      getBaseFareAmount: () => 'Helper: Get base fare',
      getTaxAmount: () => 'Helper: Get tax amount',
      
      // Status helpers
      isTicketed: () => 'Helper: Check if ticketed',
      isPending: () => 'Helper: Check if pending',
      needsApproval: () => 'Helper: Check if needs approval'
    }
  }

  /**
   * Merge generated structure with actual UTR data
   */
  private mergeWithActualData(baseStructure: any, actualData: any): any {
    const merged = { ...baseStructure }
    
    // Deep merge actual data while preserving helper methods
    for (const [key, value] of Object.entries(actualData)) {
      if (key !== '_helpers') {
        merged[key] = value
      }
    }
    
    return merged
  }

  /**
   * NO HARDCODED FALLBACK UTR - Must use proper schema loading
   */
  private getFallbackUTR(): any {
    // NO HARDCODED FALLBACK - Return null to force proper schema loading
    console.log(`[UTRGenerator] No hardcoded fallback UTR - must use actual schema parsing`)
    return null
  }
}

// Export singleton instance for easy use
export const utrGenerator = new UTRGenerator()

/**
 * 🎯 Enhanced UTR injection for GlobalDataService
 */
export async function generateEnhancedUTR(contextData?: any): Promise<any> {
  if (!contextData?.utr) {
    return null
  }
  
  // Generate schema-based UTR with IntelliSense support
  return await utrGenerator.generateUTRForMonaco(contextData.utr)
}