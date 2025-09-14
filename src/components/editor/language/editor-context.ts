// Editor Context Service - Provides tenant and branch context for editor operations
// Simple service to maintain context state for the editor system

interface EditorContext {
  tenantId?: string
  branchContext?: {
    currentBranchId: string
    defaultBranchId?: string
  }
}

class EditorContextServiceImpl {
  private context: EditorContext = {}

  set(context: EditorContext): void {
    this.context = { ...context }
  }

  get(): EditorContext {
    return { ...this.context }
  }

  getTenantId(): string | undefined {
    return this.context.tenantId
  }

  getCurrentBranchId(): string | undefined {
    return this.context.branchContext?.currentBranchId
  }

  getDefaultBranchId(): string | undefined {
    return this.context.branchContext?.defaultBranchId
  }

  // Cache management for column data
  private columnCache = new Map<string, any[]>()

  cacheColumns(key: string, columns: any[]): void {
    this.columnCache.set(key, columns)
  }

  invalidateColumns(key: string): void {
    this.columnCache.delete(key)
  }

  clear(): void {
    this.context = {}
  }
}

// Export singleton instance
export const EditorContextService = new EditorContextServiceImpl()

// Export types for use by consumers
export type { EditorContext }
