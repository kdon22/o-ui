/**
 * 🔧 **SOURCE MAP BUILDER** - Builds source maps during Python generation
 * 
 * Small, focused class for creating source maps during translation.
 */

import { BusinessRuleSourceMap, SourceMapStatement } from '../types/source-map-types'

export class SourceMapBuilder {
  private statements: SourceMapStatement[] = []
  private currentStatementId = 0
  
  constructor(
    private businessRulesContent: string,
    private pythonContent: string = ''
  ) {}
  
  /**
   * Add a statement mapping during translation
   */
  addStatement(mapping: Omit<SourceMapStatement, 'id'>): string {
    const id = `stmt_${++this.currentStatementId}`
    const statement: SourceMapStatement = {
      id,
      ...mapping
    }
    
    this.statements.push(statement)
    return id
  }
  
  /**
   * Update Python content after generation is complete
   */
  setPythonContent(pythonContent: string): void {
    this.pythonContent = pythonContent
  }
  
  /**
   * Build the final source map
   */
  build(): BusinessRuleSourceMap {
    return {
      version: 1,
      statements: this.statements,
      meta: {
        generatedAt: new Date().toISOString(),
        businessLines: this.businessRulesContent.split('\n').length,
        pythonLines: this.pythonContent.split('\n').length
      }
    }
  }
}
