/**
 * 🏭 TRANSFORMATION PATTERN FACTORY - Core Factory
 * 
 * Factory-driven system for handling multi-line business rule constructs.
 * Follows the same pattern as JunctionAutoCreatorFactory and SchemaFactory.
 */

import type {
  TransformationPattern,
  TransformationResult,
  TransformationContext,
  TransformationMetadata,
  EnhancedSourceMap,
  EnhancedSourceMapping,
  PatternRegistryConfig
} from './types'

import { IfAnyPattern } from './patterns/if-any-pattern'
// Future patterns will be imported here:
// import { ForLoopPattern } from './patterns/for-loop-pattern'
// import { TryCatchPattern } from './patterns/try-catch-pattern'

export class TransformationPatternFactory {
  private static instance: TransformationPatternFactory
  private patterns: Map<string, TransformationPattern> = new Map()
  private initialized = false
  private config: PatternRegistryConfig

  private constructor(config: Partial<PatternRegistryConfig> = {}) {
    this.config = {
      enabledPatterns: ['if-any'], // Start with just if-any, add more as needed
      debugMode: false,
      strictMode: false,
      ...config
    }
  }

  static getInstance(config?: Partial<PatternRegistryConfig>): TransformationPatternFactory {
    if (!TransformationPatternFactory.instance) {
      TransformationPatternFactory.instance = new TransformationPatternFactory(config)
    }
    return TransformationPatternFactory.instance
  }

  /**
   * 🚀 Initialize factory with auto-discovery of patterns
   */
  initialize(): void {
    if (this.initialized) return

    console.log('🏭 [TransformationFactory] Initializing pattern registry...')

    // Auto-register all available patterns
    this.registerPattern(new IfAnyPattern())
    
    // Future patterns will be auto-registered here:
    // this.registerPattern(new ForLoopPattern())
    // this.registerPattern(new TryCatchPattern())

    this.initialized = true

    console.log('✅ [TransformationFactory] Pattern registry initialized:', {
      totalPatterns: this.patterns.size,
      enabledPatterns: this.config.enabledPatterns,
      registeredPatterns: Array.from(this.patterns.keys())
    })
  }

  /**
   * 🔧 Register a transformation pattern
   */
  private registerPattern(pattern: TransformationPattern): void {
    this.patterns.set(pattern.id, pattern)
    
    if (this.config.debugMode) {
      console.log(`📝 [TransformationFactory] Registered pattern: ${pattern.id} - ${pattern.name}`)
    }
  }

  /**
   * 🎯 MAIN TRANSFORMATION METHOD
   * 
   * Attempts to transform a line using registered patterns.
   * Returns null if no pattern matches (use simple translation).
   */
  transform(
    line: string, 
    allLines: string[], 
    currentIndex: number,
    context: Partial<TransformationContext> = {}
  ): TransformationResult | null {
    
    if (!this.initialized) {
      this.initialize()
    }

    const trimmedLine = line.trim()
    console.log(`🔍 [TransformationFactory] Analyzing line ${currentIndex + 1}: "${trimmedLine}"`)
    console.log(`📝 [TransformationFactory] Full line with indentation: "${line}"`)
    console.log(`🎯 [TransformationFactory] Enabled patterns: [${this.config.enabledPatterns.join(', ')}]`)

    // Try each enabled pattern in order
    for (const patternId of this.config.enabledPatterns) {
      const pattern = this.patterns.get(patternId)
      
      if (!pattern) {
        console.warn(`⚠️ [TransformationFactory] Pattern not found: ${patternId}`)
        continue
      }

      console.log(`🔎 [TransformationFactory] Testing pattern: ${pattern.id} (${pattern.name})`)

      // Check if pattern matches
      const matches = pattern.detector(line, allLines, currentIndex)
      console.log(`🎲 [TransformationFactory] Pattern ${pattern.id} match result: ${matches}`)

      if (matches) {
        console.log(`🎯 [TransformationFactory] ✅ PATTERN MATCHED: ${pattern.id} for line ${currentIndex + 1}`)
        console.log(`📋 [TransformationFactory] Pattern details:`, {
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          lineContent: trimmedLine
        })

        try {
          console.log(`🔄 [TransformationFactory] Starting transformation with ${pattern.id}...`)
          
          // Transform using the pattern
          const result = pattern.transformer(line, allLines, currentIndex)
          
          console.log(`🏭 [TransformationFactory] Transformation result:`, {
            pythonLinesGenerated: result.pythonLines.length,
            consumedBusinessLines: result.consumedLines,
            transformationType: result.metadata.type,
            businessLineRange: result.metadata.businessLineRange,
            pythonLines: result.pythonLines
          })

          // Generate source mappings
          const fullContext: TransformationContext = {
            businessLines: allLines,
            currentPythonLineOffset: context.currentPythonLineOffset || 0,
            indentLevel: this.getIndentLevel(line),
            options: {
              generateComments: true,
              strictMode: this.config.strictMode,
              debugMode: this.config.debugMode
            },
            ...context
          }

          console.log(`🗺️ [TransformationFactory] Generating mappings with context:`, {
            currentPythonLineOffset: fullContext.currentPythonLineOffset,
            indentLevel: fullContext.indentLevel,
            businessLinesTotal: fullContext.businessLines.length
          })

          // Add mappings generated by the pattern
          result.metadata.specialMappings = pattern.generateMappings(result, fullContext)

          console.log(`✅ [TransformationFactory] Transformation completed successfully:`, {
            pattern: pattern.id,
            pythonLines: result.pythonLines.length,
            consumedLines: result.consumedLines,
            specialMappings: result.metadata.specialMappings.length,
            mappingDetails: result.metadata.specialMappings.map(m => ({
              businessLine: m.businessLine,
              pythonLine: m.pythonLine,
              type: m.type,
              confidence: m.confidence,
              description: m.description
            }))
          })

          return result

        } catch (error) {
          console.error(`❌ [TransformationFactory] Pattern ${pattern.id} failed:`, error)
          console.error(`❌ [TransformationFactory] Error details:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            line: trimmedLine,
            lineIndex: currentIndex
          })
          // Continue to next pattern instead of failing completely
        }
      }
    }

    console.log(`❌ [TransformationFactory] No pattern matched for line ${currentIndex + 1}: "${trimmedLine}"`)
    return null
  }

  /**
   * 🗺️ Generate enhanced source map with transformation metadata
   */
  generateEnhancedSourceMap(
    businessRules: string,
    pythonCode: string,
    transformationMetadata: TransformationMetadata[]
  ): EnhancedSourceMap {
    
    const businessLines = businessRules.split('\n')
    const pythonLines = pythonCode.split('\n')
    const mappings: EnhancedSourceMapping[] = []

    // 1. Generate basic 1:1 mappings for non-transformed lines
    for (let i = 0; i < Math.min(businessLines.length, pythonLines.length); i++) {
      const businessLine = businessLines[i].trim()
      const pythonLine = pythonLines[i].trim()
      
      // Skip if this line is part of a transformation
      const isTransformed = transformationMetadata.some(meta => 
        i + 1 >= meta.businessLineRange[0] && i + 1 <= meta.businessLineRange[1]
      )
      
      if (!isTransformed && businessLine && pythonLine) {
        mappings.push({
          businessLine: i + 1,
          pythonLine: i + 1,
          confidence: 1.0,
          type: 'direct',
          description: 'Direct 1:1 mapping'
        })
      }
    }

    // 2. Add transformation-specific mappings
    for (const metadata of transformationMetadata) {
      for (const specialMapping of metadata.specialMappings) {
        mappings.push({
          businessLine: specialMapping.businessLine,
          pythonLine: specialMapping.pythonLine,
          confidence: specialMapping.confidence,
          type: specialMapping.type,
          transformationType: metadata.type,
          description: specialMapping.description || `${metadata.type} transformation`
        })
      }
    }

    // 3. Sort mappings by Python line number
    mappings.sort((a, b) => a.pythonLine - b.pythonLine)

    return {
      version: 1,
      mappings,
      transformations: transformationMetadata,
      businessLines,
      pythonLines
    }
  }

  /**
   * 🔍 Get available patterns (for debugging/introspection)
   */
  getAvailablePatterns(): TransformationPattern[] {
    return Array.from(this.patterns.values())
  }

  /**
   * 🔧 Helper: Get indentation level of a line
   */
  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/)
    return match ? match[1].length : 0
  }
}

// Export singleton instance for easy use
export const transformationFactory = TransformationPatternFactory.getInstance({
  debugMode: process.env.NODE_ENV === 'development'
})
