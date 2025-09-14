/**
 * 🔍 **SOURCE MAP CONSUMER** - Consumes source maps for debugging
 * 
 * Small, focused class for reading source maps during debugging.
 */

import { BusinessRuleSourceMap, SourceMapStatement, SourceMapLookup } from '../types/source-map-types'

export class SourceMapConsumer implements SourceMapLookup {
  private businessToPythonMap = new Map<number, number[]>()
  private pythonToBusinessMap = new Map<number, number>()
  private businessLineToStatement = new Map<number, SourceMapStatement>()
  private pythonLineToStatement = new Map<number, SourceMapStatement>()
  
  constructor(private sourceMap: BusinessRuleSourceMap) {
    this.buildLookupMaps()
  }
  
  private buildLookupMaps(): void {
    for (const statement of this.sourceMap.statements) {
      // Build business line to Python lines mapping
      const pythonLines: number[] = []
      for (let line = statement.pythonLines.start; line <= statement.pythonLines.end; line++) {
        pythonLines.push(line)
        this.pythonToBusinessMap.set(line, statement.businessLine)
        this.pythonLineToStatement.set(line, statement)
      }
      
      this.businessToPythonMap.set(statement.businessLine, pythonLines)
      this.businessLineToStatement.set(statement.businessLine, statement)
    }
  }
  
  pythonToBusiness(pythonLine: number): number | null {
    return this.pythonToBusinessMap.get(pythonLine) || null
  }
  
  businessToPython(businessLine: number): number[] | null {
    return this.businessToPythonMap.get(businessLine) || null
  }
  
  getStatementByBusinessLine(businessLine: number): SourceMapStatement | null {
    return this.businessLineToStatement.get(businessLine) || null
  }
  
  getStatementByPythonLine(pythonLine: number): SourceMapStatement | null {
    return this.pythonLineToStatement.get(pythonLine) || null
  }
  
  /**
   * Get the source map data
   */
  getSourceMap(): BusinessRuleSourceMap {
    return this.sourceMap
  }
}
