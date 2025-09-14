// SQL SSOT Provider
// Branch-aware, IndexedDB-first access to tables and columns from table.config

import type * as monaco from 'monaco-editor'

type BranchContext = {
  currentBranchId: string
  defaultBranchId: string
}

type TableRecord = {
  id: string
  name?: string
  tableName?: string
  description?: string
  branchId?: string
  originalTableId?: string | null
  config?: { columns?: Array<{ name: string; type?: string; nullable?: boolean; primaryKey?: boolean; description?: string }> }
}

export type SqlTable = {
  id: string
  tableName: string
  displayName: string
  description?: string
  branchId?: string
  originalTableId?: string | null
}

export type SqlColumn = { name: string; type: string; nullable?: boolean; primaryKey?: boolean; description?: string }

type CacheEntry = { ts: number; tables: SqlTable[]; columnsByTable: Map<string, SqlColumn[]> }

class SqlProvider {
  private cache: CacheEntry | null = null
  private static readonly TTL_MS = 5 * 60 * 1000

  async getTables(): Promise<SqlTable[]> {
    const ctx = await this.getEditorCtx()
    if (!ctx) return []

    const now = Date.now()
    if (this.cache && now - this.cache.ts < SqlProvider.TTL_MS) {
      return this.cache.tables
    }

    const records = await this.readAllTablesFromDexie()
    const overlayed = this.applyBranchOverlay(records, ctx)

    const tables: SqlTable[] = overlayed.map(r => ({
      id: String(r.id),
      tableName: String(r.tableName || this.sanitize(r.name || '')),
      displayName: String(r.name || r.tableName || ''),
      description: r.description,
      branchId: r.branchId,
      originalTableId: r.originalTableId || null
    }))

    const columnsByTable = new Map<string, SqlColumn[]>()
    for (const rec of overlayed) {
      const key = String(rec.tableName || this.sanitize(rec.name || ''))
      const cols = Array.isArray(rec.config?.columns) ? rec.config!.columns!.map(c => ({
        name: String(c.name),
        type: String(c.type || 'string'),
        nullable: !!c.nullable,
        primaryKey: !!c.primaryKey,
        description: c.description
      })) : []
      columnsByTable.set(key, cols)
    }

    this.cache = { ts: now, tables, columnsByTable }
    return tables
  }

  async getTableNames(): Promise<string[]> {
    const tables = await this.getTables()
    // Only sanitized tableName values are allowed for use
    return tables.map(t => t.tableName)
  }

  async getColumns(tableName: string): Promise<SqlColumn[]> {
    const ctx = await this.getEditorCtx()
    if (!ctx) return []
    const now = Date.now()
    if (!this.cache || now - this.cache.ts >= SqlProvider.TTL_MS) {
      await this.getTables()
    }
    const key = this.sanitize(tableName)
    const cols = this.cache?.columnsByTable.get(key)
    return cols ? cols.slice() : []
  }

  async resolveTableIdentifier(identifier: string): Promise<string | null> {
    // Returns the sanitized tableName for any of: tableName | display name | id
    const tables = await this.getTables()
    const needle = String(identifier).trim()
    const exactByTableName = tables.find(t => t.tableName === needle)
    if (exactByTableName) return exactByTableName.tableName
    const byDisplay = tables.find(t => t.displayName === needle)
    if (byDisplay) return byDisplay.tableName
    const byId = tables.find(t => t.id === needle)
    if (byId) return byId.tableName
    return null
  }

  sanitize(name: string): string {
    // snake_case, lowercase, allow [a-z0-9_]
    const base = String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    return base.replace(/^_+|_+$/g, '')
  }

  private async readAllTablesFromDexie(): Promise<TableRecord[]> {
    try {
      const { EditorContextService } = await import('@/components/editor/language/editor-context')
      const ctx = EditorContextService.get()
      if (!ctx) return []
      const { IndexedDBManager } = await import('@/lib/action-client/core/indexeddb-manager')
      const indexedDB = new IndexedDBManager(ctx.tenantId)
      const tables = await indexedDB.getAll('tables')
      return Array.isArray(tables) ? tables as TableRecord[] : []
    } catch {
      return []
    }
  }

  private applyBranchOverlay(records: TableRecord[], ctx: { branchContext?: BranchContext | null }): TableRecord[] {
    const currentId = ctx.branchContext?.currentBranchId
    const defaultId = ctx.branchContext?.defaultBranchId
    if (!records || records.length === 0 || !currentId || !defaultId) return records || []

    const byLineage = new Map<string, TableRecord>()
    for (const r of records) {
      const lineage = String(r.originalTableId || r.id)
      const existing = byLineage.get(lineage)
      if (!existing) {
        byLineage.set(lineage, r)
        continue
      }
      // Prefer current branch over default; otherwise keep existing
      const existingScore = existing.branchId === currentId ? 2 : (existing.branchId === defaultId ? 1 : 0)
      const candidateScore = r.branchId === currentId ? 2 : (r.branchId === defaultId ? 1 : 0)
      if (candidateScore > existingScore) byLineage.set(lineage, r)
    }
    return Array.from(byLineage.values())
  }

  private async getEditorCtx(): Promise<{ tenantId: string; branchContext?: BranchContext | null } | null> {
    try {
      const { EditorContextService } = await import('@/components/editor/language/editor-context')
      const ctx = EditorContextService.get()
      if (!ctx) return null
      return { tenantId: ctx.tenantId, branchContext: ctx.branchContext as any }
    } catch {
      return null
    }
  }
}

export const sqlProvider = new SqlProvider()


