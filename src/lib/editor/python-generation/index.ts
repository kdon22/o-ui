// Gold Standard Python Generation System
// 🎯 SIMPLIFIED: Clean lookahead approach replaces over-engineered system

import { generateSimplePython } from './simple-generator'
import { generateEnhancedSourceMap } from './transformation/enhanced-source-map-generator'
import { generateRawPython } from './raw-python-generator'


export interface PythonGenerationResult {
  success: boolean
  pythonCode: string
  errors: string[]
  warnings: string[]
  sourceMap?: any // Simplified source map interface
}

export interface GenerationOptions {
  indentSize?: number
  generateComments?: boolean
  useHelpers?: boolean
  strictMode?: boolean
  generateSourceMap?: boolean
}

/**
 * 🏆 GOLD STANDARD PYTHON TRANSLATOR
 * 
 * Clean architecture that leverages existing method schemas
 * and handles control structures with focused translators
 */
// Source map generation removed - now handled by enhanced system

export class PythonGenerator {
  private options: Required<GenerationOptions>

  constructor(options: GenerationOptions = {}) {
    this.options = {
      indentSize: 4,
      generateComments: true,
      useHelpers: true,
      strictMode: false,
      generateSourceMap: true,
      ...options
    }
  }


  /**
   * 🚀 MAIN TRANSLATION METHOD
   * 
   * Orchestrates translation using focused translators
   */
  translate(businessRulesText: string): PythonGenerationResult {
    console.log('🐍 [PythonGenerator] Starting SIMPLIFIED translation for', businessRulesText.length, 'characters')
    console.log('🔧 [PythonGenerator] Using NEW simplified generator (not old complex system)')

    try {
      // 🎯 **USE SIMPLIFIED GENERATOR** - Clean lookahead approach
      const result = generateSimplePython(businessRulesText, {
        generateComments: this.options.generateComments,
        strictMode: this.options.strictMode
      })
      
      const pythonCode = result.pythonCode

      // 🗺️ **GENERATE ENHANCED SOURCE MAP** - Transformation-aware mapping
      let sourceMap: any | undefined
      if (this.options.generateSourceMap) {
        try {
          if (result.transformationMetadata && result.transformationMetadata.length > 0) {
            // Use enhanced source map for transformation-aware mapping
            const enhancedResult = generateEnhancedSourceMap(businessRulesText, pythonCode, result.transformationMetadata)
            
            // Use enhanced source map directly
            sourceMap = enhancedResult.sourceMap
            
            console.log('✅ [PythonGenerator] Enhanced source map generated:', {
              mappingsLength: sourceMap.mappings.length,
              transformations: result.transformationMetadata.length,
              businessLines: businessRulesText.split('\n').length,
              pythonLines: pythonCode.split('\n').length
            })
          } else {
            // Simple fallback - basic line mapping
            sourceMap = {
              version: 1,
              mappings: businessRulesText.split('\n').map((_, i) => ({
                businessLine: i + 1,
                pythonLine: i + 1,
                confidence: 1.0,
                type: 'direct'
              }))
            }
            console.log('✅ [PythonGenerator] Simple source map generated (no transformations)')
          }
        } catch (sourceMapError) {
          console.warn('⚠️ [PythonGenerator] Failed to generate source map:', sourceMapError)
          result.errors.push('Source map generation failed - debugging may be limited')
        }
      }

      return {
        success: result.success,
        pythonCode,
        errors: result.errors,
        warnings: result.warnings,
        sourceMap
      }

    } catch (error) {
      return {
        success: false,
        pythonCode: '',
        errors: [`Critical error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        sourceMap: undefined
      }
    }
  }
}

// Export singleton instance for easy use
export const pythonGenerator = new PythonGenerator()

// Export factory function
export const createPythonGenerator = (options?: GenerationOptions) => new PythonGenerator(options)

// Convenience function - UPDATED to use simplified generator
export const translateBusinessRulesToPython = (businessRulesText: string, options?: GenerationOptions) => {
  const generator = options ? createPythonGenerator(options) : pythonGenerator
  return generator.translate(businessRulesText)
}

// Export the raw python generator for debugging use
export { generateRawPython } from './raw-python-generator'
