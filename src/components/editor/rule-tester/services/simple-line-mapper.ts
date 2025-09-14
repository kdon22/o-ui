"use client"

// 🎯 **SIMPLE LINE MAPPER** - Clean business rule ↔ Python line mapping
// Like TypeScript source maps, but simple and reliable

export interface SimpleLineMapping {
  businessLine: number
  pythonLine: number
  businessText: string
  pythonText: string
}

/**
 * 🗺️ **SIMPLE LINE MAPPER** - Maps business rule lines to Python lines
 * 
 * Uses the existing simple source map from Python generation.
 * No complex AST parsing, no over-engineering - just works.
 */
export class SimpleLineMapper {
  private mappings: SimpleLineMapping[] = []
  
  /**
   * 🔧 **INITIALIZE FROM SOURCE MAP** - Load from existing source map
   */
  initialize(sourceMap: any, businessRulesCode: string, pythonCode: string): void {
    this.mappings = []
    
    if (!sourceMap?.mappings) {
      console.warn('⚠️ [SimpleLineMapper] No source map available - using direct line mapping')
      this.createDirectMapping(businessRulesCode, pythonCode)
      return
    }
    
    // Use existing source map mappings
    const businessLines = businessRulesCode.split('\n')
    const pythonLines = pythonCode.split('\n')
    
    sourceMap.mappings.forEach((mapping: any) => {
      if (mapping.originalLine && mapping.generatedLine) {
        this.mappings.push({
          businessLine: mapping.originalLine,
          pythonLine: mapping.generatedLine,
          businessText: businessLines[mapping.originalLine - 1] || '',
          pythonText: pythonLines[mapping.generatedLine - 1] || ''
        })
      }
    })
    
    console.log('✅ [SimpleLineMapper] Initialized with mappings:', {
      mappingCount: this.mappings.length,
      businessLines: businessLines.length,
      pythonLines: pythonLines.length
    })
  }
  
  /**
   * 🔄 **CREATE DIRECT MAPPING** - Fallback when no source map
   */
  private createDirectMapping(businessRulesCode: string, pythonCode: string): void {
    const businessLines = businessRulesCode.split('\n')
    const pythonLines = pythonCode.split('\n')
    
    // Simple 1:1 mapping for basic cases
    const maxLines = Math.min(businessLines.length, pythonLines.length)
    for (let i = 0; i < maxLines; i++) {
      const businessText = businessLines[i].trim()
      const pythonText = pythonLines[i].trim()
      
      // Only map non-empty lines
      if (businessText && pythonText) {
        this.mappings.push({
          businessLine: i + 1,
          pythonLine: i + 1,
          businessText,
          pythonText
        })
      }
    }
    
    console.log('✅ [SimpleLineMapper] Created direct mapping:', {
      mappingCount: this.mappings.length
    })
  }
  
  /**
   * 🎯 **GET PYTHON LINE** - Map business rule line to Python line
   */
  getPythonLine(businessLine: number): number | null {
    const mapping = this.mappings.find(m => m.businessLine === businessLine)
    return mapping?.pythonLine || null
  }
  
  /**
   * 🎯 **GET BUSINESS LINE** - Map Python line to business rule line
   */
  getBusinessLine(pythonLine: number): number | null {
    const mapping = this.mappings.find(m => m.pythonLine === pythonLine)
    return mapping?.businessLine || null
  }
  
  /**
   * 🔍 **GET ALL MAPPINGS** - For debugging
   */
  getAllMappings(): SimpleLineMapping[] {
    return [...this.mappings]
  }
}
