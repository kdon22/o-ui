// Scope Tracker: Main orchestrator for symbol table management (SSOT)
// NOW USES SINGLE MASTER TYPE DETECTION SYSTEM

import type * as monaco from 'monaco-editor'
import type { SymbolEntry, VarType } from './parsers/types'
import { masterTypeDetector, detectVariableType, detectLoopElementType } from './master-type-detector'

export class ScopeTracker {
  private symbols: SymbolEntry[] = []

  constructor() {
    // No more multiple parsers - single master system!
  }

  updateFromModel(model: monaco.editor.ITextModel): void {
    console.log(`[ScopeTracker] Updating from model using MASTER TYPE DETECTION SYSTEM`)
    this.symbols = []
    const allText = model.getValue()

    // Parse all variables using the master system
    const lines = allText.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNumber = i + 1

      // 1. Handle variable assignments
      const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/)
      if (assignmentMatch && !line.startsWith('//') && !line.startsWith('class ')) {
        const variableName = assignmentMatch[1]
        console.log(`[ScopeTracker] Found assignment: ${variableName}`)
        
        const typeInfo = detectVariableType(variableName, allText)
        this.symbols.push({
          name: variableName,
          type: typeInfo.type as VarType,
          line: lineNumber,
          source: 'assignment'
        })
        console.log(`[ScopeTracker] Added variable: ${variableName} = ${typeInfo.type}`)
      }

      // 2. Handle for loops - detect loop variables
      const forMatch = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*$/)
      if (forMatch) {
        const loopVar = forMatch[1]
        const collectionVar = forMatch[2]
        console.log(`[ScopeTracker] Found for loop: ${loopVar} in ${collectionVar}`)
        
        const elementTypeInfo = detectLoopElementType(loopVar, allText)
        this.symbols.push({
          name: loopVar,
          type: elementTypeInfo.type as VarType,
          line: lineNumber,
          source: 'loop'
        })
        console.log(`[ScopeTracker] Added loop variable: ${loopVar} = ${elementTypeInfo.type}`)
      }

      // 3. Handle conditional patterns (if any/all)
      const ifAnyMatch = line.match(/^if\s+any\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*$/)
      if (ifAnyMatch) {
        const collectionPath = ifAnyMatch[1]
        const parts = collectionPath.split('.')
        const singularName = this.singularize(parts[parts.length - 1])
        console.log(`[ScopeTracker] Found 'if any' pattern: ${collectionPath} -> ${singularName}`)
        
        // Use master system to detect the element type
        const elementTypeInfo = detectLoopElementType(singularName, allText)
        this.symbols.push({
          name: singularName,
          type: elementTypeInfo.type as VarType,
          line: lineNumber,
          source: 'conditional'
        })
      }

      // 4. Handle switch case variables
      const switchCaseMatch = line.match(/^case\s+"([^"]+)"\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/)
      if (switchCaseMatch) {
        const variableName = switchCaseMatch[2]
        console.log(`[ScopeTracker] Found switch case variable: ${variableName}`)
        
        // For switch cases, we'll assume string type for now
        this.symbols.push({
          name: variableName,
          type: 'string',
          line: lineNumber,
          source: 'conditional'
        })
      }
    }

    console.log(`[ScopeTracker] Final symbols:`, this.symbols)
  }

  getTypeOf(name: string): VarType | 'unknown' {
    console.log(`[ScopeTracker] getTypeOf called for "${name}"`)
    
    // Look through symbols in reverse order (most recent first)
    for (let i = this.symbols.length - 1; i >= 0; i--) {
      if (this.symbols[i].name === name) {
        const type = this.symbols[i].type
        console.log(`[ScopeTracker] Found type for "${name}": "${type}"`)
        return type
      }
    }
    
    console.log(`[ScopeTracker] No type found for "${name}"`)
    return 'unknown'
  }

  getVariables(): SymbolEntry[] {
    return [...this.symbols]
  }

  private singularize(name: string): string {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y'
    if (name.endsWith('s')) return name.slice(0, -1)
    return name
  }
}