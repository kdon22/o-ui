// SQL QueryAnalyzer (lean): associates variables with SELECT queries
// Supports multi-line SELECT [cols] FROM table WHERE [conditions]
// Range-aware invalidation for reliability

import type * as monaco from 'monaco-editor'

export interface QueryMapping {
  variable: string
  table: string
  columns: string[] | '*'
  range: { startLine: number; endLine: number }
  signature: string // for quick change detection
}

class SqlQueryAnalyzer {
  private mappings: QueryMapping[] = []

  rebuild(model: monaco.editor.ITextModel): void {
    const text = model.getValue()
    const lines = text.split('\n')
    const result: QueryMapping[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const assign = line.match(/^\s*([a-zA-Z_][\w]*)\s*=\s*SELECT\b/i)
      if (!assign) continue
      const variable = assign[1]
      // Collect subsequent lines until a blank or a semantically terminating pattern
      let j = i
      const block: string[] = [line]
      while (j + 1 < lines.length && !/^\s*$/.test(lines[j + 1])) {
        j++
        block.push(lines[j])
      }
      const blockText = block.join(' ')
      // Handle both [columns] and * syntax
      const colsMatch = blockText.match(/SELECT\s+(.+?)\s+FROM\s+/i)
      const fromMatch = blockText.match(/FROM\s+(\w+|\[[^\]]+\]|"[^"]+"|`[^`]+`)/i)
      const columns: string[] | '*' = colsMatch
        ? colsMatch[1].trim() === '*' ? '*' : colsMatch[1].split(',').map(s => s.trim()).filter(Boolean)
        : '*'
      const table = fromMatch ? fromMatch[1].replace(/^\[|\]$|^"|"$|^`|`$/g, '') : ''
      if (table) {
        result.push({
          variable,
          table,
          columns,
          range: { startLine: i + 1, endLine: j + 1 },
          signature: this.signature(variable, table, columns)
        })
      }
      i = j
    }
    this.mappings = result
  }

  invalidateOnChange(e: monaco.editor.IModelContentChangedEvent): void {
    if (!e.changes || e.changes.length === 0) return
    const affected = new Set<number>()
    for (const ch of e.changes) {
      const start = ch.range.startLineNumber
      const end = ch.range.endLineNumber
      this.mappings.forEach((m, idx) => {
        if (!(end < m.range.startLine || start > m.range.endLine)) {
          affected.add(idx)
        }
      })
    }
    if (affected.size > 0) {
      // Mark affected mappings for rebuild by clearing them; caller should call rebuild(model)
      this.mappings = this.mappings.filter((_m, idx) => !affected.has(idx))
    }
  }

  getMappingForVariable(name: string): QueryMapping | undefined {
    // Return last mapping for that variable
    for (let i = this.mappings.length - 1; i >= 0; i--) {
      if (this.mappings[i].variable === name) return this.mappings[i]
    }
    return undefined
  }

  private signature(variable: string, table: string, columns: string[] | '*'): string {
    const cols = Array.isArray(columns) ? columns.join(',') : '*'
    return `${variable}|${table}|${cols}`
  }
}

export const sqlQueryAnalyzer = new SqlQueryAnalyzer()


