import type { DebugMapping } from '../types'
import type { UnifiedSchema } from '@/lib/editor/schemas/types'

export interface LineMapping {
  businessRuleLine: number
  pythonLine: number
  schemaId?: string
  variableNames: string[]
  originalText: string
  generatedText: string
}

export class DebugMapper {
  private mappings: LineMapping[] = []
  private businessRulesContent: string = ''
  private pythonContent: string = ''
  private schemas: Map<string, UnifiedSchema> = new Map()

  constructor(businessRules: string, pythonCode: string, availableSchemas: UnifiedSchema[] = []) {
    this.businessRulesContent = businessRules
    this.pythonContent = pythonCode
    
    // Index schemas for quick lookup
    availableSchemas.forEach(schema => {
      this.schemas.set(schema.id, schema)
    })
    
    this.generateMappings()
  }

  // Generate mappings between business rules and Python lines
  private generateMappings() {
    const businessLines = this.businessRulesContent.split('\n')
    const pythonLines = this.pythonContent.split('\n')

    let pythonLineIndex = 0

    businessLines.forEach((businessLine, businessIndex) => {
      if (businessLine.trim()) {
        const mapping = this.createLineMapping(
          businessIndex + 1, // 1-indexed
          pythonLineIndex + 1, // 1-indexed  
          businessLine.trim(),
          pythonLines[pythonLineIndex]?.trim() || ''
        )
        
        if (mapping) {
          this.mappings.push(mapping)
        }
        
        pythonLineIndex++
      }
    })
  }

  private createLineMapping(
    businessLine: number, 
    pythonLine: number, 
    businessText: string, 
    pythonText: string
  ): LineMapping | null {
    // Extract variables from business rule line
    const variables = this.extractVariables(businessText)
    
    // Try to identify schema methods used
    const schemaId = this.identifySchemaMethod(businessText)

    return {
      businessRuleLine: businessLine,
      pythonLine,
      schemaId,
      variableNames: variables,
      originalText: businessText,
      generatedText: pythonText
    }
  }

  private extractVariables(text: string): string[] {
    // Extract variable references like customer.age, booking.total
    const variableRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g
    const matches = text.match(variableRegex) || []
    return [...new Set(matches)] // Remove duplicates
  }

  private identifySchemaMethod(text: string): string | undefined {
    // Look for schema method calls like .contains(), .toUpperCase(), etc.
    for (const [schemaId, schema] of this.schemas) {
      if (text.includes(`.${schema.name}`)) {
        return schemaId
      }
    }
    return undefined
  }

  // Public API methods
  mapBusinessRuleToPython(businessLine: number): number | null {
    const mapping = this.mappings.find(m => m.businessRuleLine === businessLine)
    return mapping?.pythonLine || null
  }

  mapPythonToBusinessRule(pythonLine: number): number | null {
    const mapping = this.mappings.find(m => m.pythonLine === pythonLine)
    return mapping?.businessRuleLine || null
  }

  getVariablesForLine(businessLine: number): string[] {
    const mapping = this.mappings.find(m => m.businessRuleLine === businessLine)
    return mapping?.variableNames || []
  }

  getSchemaForLine(businessLine: number): UnifiedSchema | null {
    const mapping = this.mappings.find(m => m.businessRuleLine === businessLine)
    if (!mapping?.schemaId) return null
    return this.schemas.get(mapping.schemaId) || null
  }

  getAllMappings(): LineMapping[] {
    return [...this.mappings]
  }
} 