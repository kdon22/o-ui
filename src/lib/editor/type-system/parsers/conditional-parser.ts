// Conditional Parser: Handles if any/all patterns and switch case variables
import type * as monaco from 'monaco-editor'
import type { SymbolEntry, VarType } from './types'

export class ConditionalParser {
  parseConditional(line: string, lineNumber: number, known: Record<string, VarType>, model: monaco.editor.ITextModel): SymbolEntry | null {
    // If any/all patterns: if any collection as item
    const ifAnyMatch = line.match(/^\s*if\s+(any|all)\s+(\w+(?:\.\w+)*)\s+as\s+(\w+)\s*$/)
    if (ifAnyMatch) {
      const [, , collectionPath, itemVar] = ifAnyMatch
      const elementType: VarType = this.resolveCollectionElementType(collectionPath, known, model)
      return { name: itemVar, type: elementType, line: lineNumber, source: 'loop' }
    }

    return null
  }

  parseSwitchCase(line: string, lineNumber: number, known: Record<string, VarType>): SymbolEntry | null {
    // Switch case with variable: case "value" as variable
    const caseMatch = line.match(/^\s*\t*case\s+["']([^"']+)["']\s+as\s+(\w+)\s*$/)
    if (caseMatch) {
      const [, , varName] = caseMatch
      // For now, assume string type for case values (could be enhanced to infer from switch expression)
      return { name: varName, type: 'string', line: lineNumber, source: 'assignment' }
    }

    return null
  }

  private resolveCollectionElementType(collectionPath: string, known: Record<string, VarType>, model: monaco.editor.ITextModel): VarType {
    try {
      const parts = collectionPath.split('.')
      const baseVar = parts[0]
      let currentType: VarType | undefined = known[baseVar]

      if (!currentType) {
        const text = model.getValue()
        const arrAssign = new RegExp(`^\\s*${baseVar}\\s*=\\s*\\[(.+?)\\]\\s*$`, 'm').exec(text)
        if (arrAssign) {
          const { ClassIndexer } = require('../class-indexer')
          const classes = ClassIndexer.index(text)
          const classNames = new Set(Object.keys(classes))
          const { LiteralParser } = require('./literal-parser')
          const literalParser = new LiteralParser()
          const inferred = literalParser.inferLiteral(`[${arrAssign[1]}]`, classNames, known)
          currentType = inferred
        } else {
          const varAssign = new RegExp(`^\\s*${baseVar}\\s*=\\s*([a-zA-Z_][\\w]*)\\s*$`, 'm').exec(text)
          if (varAssign) {
            const rhs = varAssign[1]
            const rhsType = known[rhs]
            if (rhsType) currentType = rhsType
          }
        }
      }

      if (currentType === 'queryresult') {
        try {
          const { UnifiedTypeDetectionFactory } = require('../type-detection-factory')
          const factory = new UnifiedTypeDetectionFactory()
          const info = factory.detectVariableType(baseVar, model.getValue())
          const table = (info as any)?.tableSchema
          if (table) return `queryrow:${table}`
          return 'queryrow'
        } catch {}
      }

      if (!currentType) {
        currentType = this.capitalize(baseVar)
      }

      for (let i = 1; i < parts.length; i++) {
        const prop = parts[i]
        const { schemaBridge } = require('../schema-bridge')
        const propType = schemaBridge.getBusinessObjectPropertyType?.(String(currentType), prop, model.getValue()) as string | undefined
        if (propType && propType !== 'unknown') {
          currentType = propType
        } else {
          break
        }
      }

      if (/\[\]$/.test(String(currentType))) {
        return String(currentType).replace(/\[\]$/, '')
      }
      const generic = String(currentType).match(/<\s*([A-Za-z_][\w]*)\s*>/)
      if (generic) return generic[1]
      const last = parts[parts.length - 1]
      return this.capitalize(this.singularize(last))
    } catch {
      const last = collectionPath.split('.').pop() || 'Item'
      return this.capitalize(this.singularize(last))
    }
  }

  private singularize(name: string): string {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y'
    if (name.endsWith('s')) return name.slice(0, -1)
    return name
  }

  private capitalize(name: string): string {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
}
