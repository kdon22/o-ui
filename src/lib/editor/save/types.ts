'use client'

// Core types for the unified editor save system (SSOT)

export type SaveContext = 'manual' | 'tab-switch' | 'close' | 'refresh' | 'auto-idle'

export interface SaveOptions {
    context: SaveContext
    skipIfClean?: boolean
}

export interface TabSnapshot {
    // Arbitrary per-tab shape (rule code, python, documentation, prompt layout, etc.)
    [key: string]: any
}

export interface ActionResult<T = any> {
    success: boolean
    data?: T | null
    error?: string
}

export interface TabSaveAdapter<TSnapshot extends TabSnapshot = TabSnapshot> {
    // e.g., 'rule.update', 'prompt.update'
    actionName: string

    // Build a stable key; namespaced, e.g., `rule:${ruleId}:rulecode`
    getEntityKey(params: { id: string; tab: string }): string

    // Field-aware change detection to avoid noisy saves
    hasChanges(prev: TSnapshot | null | undefined, curr: TSnapshot): boolean

    // Build the safe payload to send to action-system (no relations)
    buildPayload(id: string, curr: TSnapshot): Record<string, any>

    // Optional: derive the snapshot to cache from server response
    selectPersisted?(resultData: any, fallback: TSnapshot): TSnapshot
}

// Multi-tab editor save coordinator interface
export interface EditorSaveState {
    isDirty: boolean
    dirtyTabs: string[]
    lastSaved: Record<string, Date>
    pendingSaves: Record<string, boolean>
}

// For components that need to register multiple adapters
export interface TabAdapterRegistration {
    tabId: string
    adapter: TabSaveAdapter
    initialSnapshot?: TabSnapshot
}
