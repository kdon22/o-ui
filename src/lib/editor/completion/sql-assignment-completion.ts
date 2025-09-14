import type * as monaco from 'monaco-editor'
import { sqlProvider } from '@/lib/editor/sql/sql-provider'

/**
 * SQL Assignment Completion Helper
 *
 * Provides intelligent completion for SQL queries in variable assignments:
 * - Triggers on patterns like: variable = SELECT/UPDATE/DELETE...
 * - Suggests table names directly from IndexedDB table.config
 * - Uses ONLY table.config from IndexedDB, no fields or other data
 */
export class SqlAssignmentCompletion {
  private monacoInstance: typeof monaco | null = null

  setMonacoInstance(monacoInstance: typeof monaco) { this.monacoInstance = monacoInstance }

  /**
   * Check if we're in a SQL assignment context
   */
  isSqlAssignmentContext(beforeCursor: string): boolean {
    // Match patterns like: variable = SELECT/UPDATE/DELETE (case insensitive)
    const sqlAssignmentPattern = /\w+\s*=\s*(?:SELECT|UPDATE|DELETE)\s+/i
    return sqlAssignmentPattern.test(beforeCursor)
  }

  /**
   * Check if we're in a FROM clause within a SQL assignment
   */
  isFromClauseContext(beforeCursor: string): boolean {
    if (!this.isSqlAssignmentContext(beforeCursor)) return false

    // Look for FROM keyword after SQL verb
    const fromPattern = /(?:SELECT|UPDATE|DELETE)\s+.*?\bFROM\s+/i
    return fromPattern.test(beforeCursor)
  }

  /**
   * Get table name suggestions for FROM clause
   * Uses ONLY table.config from IndexedDB (no mock data, direct database access)
   */
  async getTableSuggestions(): Promise<monaco.languages.CompletionItem[]> {
    if (!this.monacoInstance) return []
    const names = await sqlProvider.getTableNames()
    return names.map(n => ({
      label: n,
      kind: this.monacoInstance!.languages.CompletionItemKind.Constant,
      insertText: n,
      detail: `Table: ${n}`,
      sortText: `1_${n}`
    } as monaco.languages.CompletionItem))
  }

  /**
   * Get table schemas directly from IndexedDB
   * Uses ONLY the table.config from IndexedDB, no fields or other data
   */
  private async getBranchAwareTableSchemas(): Promise<Array<{ name: string; displayName?: string; description?: string }>> {
    const names = await sqlProvider.getTableNames()
    return names.map(n => ({ name: n, displayName: n }))
  }

  /**
   * Get column suggestions for a specific table from IndexedDB table.config
   */
  async getTableColumnSuggestions(tableName: string): Promise<monaco.languages.CompletionItem[]> {
    if (!this.monacoInstance) return []
    const resolved = await sqlProvider.resolveTableIdentifier(tableName)
    if (!resolved) return []
    const columns = await sqlProvider.getColumns(resolved)
    return columns.map(column => ({
      label: column.name,
      kind: this.monacoInstance!.languages.CompletionItemKind.Field,
      insertText: column.name,
      detail: `${column.type || 'string'}${column.nullable ? ' | null' : ''}${column.primaryKey ? ' | PK' : ''}`,
      documentation: column.description || `Column from ${resolved} table`,
      sortText: column.primaryKey ? `0_${column.name}` : `1_${column.name}`
    } as monaco.languages.CompletionItem))
  }

  /**
   * Check if we're in a loop context iterating over a SQL result variable
   */
  isSqlLoopVariableContext(beforeCursor: string, allText: string): { isLoopContext: boolean; tableName?: string } {
    // Pattern: for variable in collection
    const forLoopPattern = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/
    const forMatch = beforeCursor.match(forLoopPattern)

    if (forMatch) {
      const [, loopVar, collectionVar] = forMatch

      // Check if the collection variable is a SQL query result
      const sqlAssignmentPattern = new RegExp(`^\\s*${collectionVar}\\s*=\\s*(?:SELECT|UPDATE|DELETE)\\s+.*?\\bFROM\\s+([a-zA-Z_][a-zA-Z0-9_]*)`, 'im')
      const sqlMatch = allText.match(sqlAssignmentPattern)

      if (sqlMatch) {
        const tableName = sqlMatch[1]
        console.log(`[SqlAssignmentCompletion] Detected SQL loop context: for ${loopVar} in ${collectionVar} (table: ${tableName})`)
        return { isLoopContext: true, tableName }
      }
    }

    return { isLoopContext: false }
  }

  /**
   * Provide completions for SQL assignment context and SQL loop variables
   */
  async provideSqlAssignmentCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList | undefined> {
    const currentLine = model.getLineContent(position.lineNumber)
    const beforeCursor = currentLine.substring(0, position.column - 1)
    const allText = model.getValue()

    // Check if we're in a loop context iterating over SQL results
    // Do NOT return column suggestions here; let generic completion offer variables after 'in '
    // Property access on the loop variable (e.g., "i.") is handled by the property completion handler
    // which will resolve to the correct table and filter columns by SELECT list.
    const loopContext = this.isSqlLoopVariableContext(beforeCursor, allText)
    if (loopContext.isLoopContext) {
      return undefined
    }

    // Check if we're in FROM clause context
    const isFromContext = this.isFromClauseContext(beforeCursor)
    if (isFromContext) {
      const tableSuggestions = await this.getTableSuggestions()
      return { suggestions: tableSuggestions }
    }

    // Future: Add more SQL context completions here
    // - Column names after table selection
    // - WHERE clause suggestions
    // - JOIN completions

    return undefined
  }
}

// Singleton instance
export const sqlAssignmentCompletion = new SqlAssignmentCompletion()
