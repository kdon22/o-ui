'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useActionMutation } from '@/hooks/use-action-api'
import type { 
    SaveOptions, 
    TabSaveAdapter, 
    TabSnapshot, 
    EditorSaveState,
    TabAdapterRegistration 
} from './types'

// Internal state maps shared per module instance - SSOT for all save states
const lastSavedStates = new Map<string, any>()
const pendingSaves = new Map<string, Promise<any>>()
const dirtyStates = new Map<string, boolean>()

/**
 * 🏆 UNIFIED EDITOR SAVE SYSTEM - SSOT for all editor saves
 * 
 * Single source of truth for ALL editor tab saves across the application.
 * Eliminates competing save systems and provides unified auto-save behavior.
 * 
 * Features:
 * - Auto-save on tab switch, close, refresh, idle (15 min)
 * - Smart change detection to avoid unnecessary saves
 * - Race condition prevention
 * - Central error handling
 * - Action system integration
 */
export function useEditorSave<TSnapshot extends TabSnapshot = TabSnapshot>(
    adapter: TabSaveAdapter<TSnapshot>,
    params: { id: string; tab: string }
) {
    const key = useMemo(() => adapter.getEntityKey(params), [adapter, params.id, params.tab])
    const mutation = useActionMutation(adapter.actionName)
    
    // Track dirty state for this specific tab
    const [isDirty, setIsDirty] = useState(false)

    // Idle timer (15 minutes)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastActivityRef = useRef<number>(Date.now())
    const currentSnapshotRef = useRef<TSnapshot | null>(null)

    // Auto-save callback for idle timer
    const performIdleSave = useCallback(async () => {
        if (currentSnapshotRef.current && isDirty) {
            console.log(`⏰ [EditorSave] Idle save triggered for ${key}`)
            await save(currentSnapshotRef.current, { context: 'auto-idle', skipIfClean: false })
        }
    }, [key, isDirty])

    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now()
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        
        idleTimerRef.current = setTimeout(performIdleSave, 15 * 60 * 1000) // 15 minutes
    }, [performIdleSave])

    // Activity detection for idle timer
    useEffect(() => {
        const onAnyActivity = () => resetIdleTimer()
        window.addEventListener('mousemove', onAnyActivity, { passive: true })
        window.addEventListener('keydown', onAnyActivity, { passive: true })
        window.addEventListener('click', onAnyActivity, { passive: true })
        resetIdleTimer()
        
        return () => {
            window.removeEventListener('mousemove', onAnyActivity)
            window.removeEventListener('keydown', onAnyActivity) 
            window.removeEventListener('click', onAnyActivity)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [resetIdleTimer])

    // Global save-on-close handler
    useEffect(() => {
        const handler = async (e: BeforeUnloadEvent) => {
            // If we have unsaved changes, attempt synchronous save
            if (isDirty && currentSnapshotRef.current) {
                // Modern browsers limit async here, so we just warn the user
                e.preventDefault()
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
                
                // Attempt save anyway (may not complete before page closes)
                try {
                    await save(currentSnapshotRef.current, { context: 'close', skipIfClean: false })
                } catch (error) {
                    console.warn(`⚠️ [EditorSave] Close save failed for ${key}:`, error)
                }
            }
        }
        
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [isDirty, key])

    // Core save function - SSOT for all saves
    const save = useCallback(async (
        snapshot: TSnapshot,
        options?: Partial<SaveOptions>
    ): Promise<boolean> => {
        const context = options?.context || 'manual'
        const saveKey = `${key}:${context}`

        console.log(`🔍 [EditorSave] Save request for ${key}`, {
            context,
            hasSnapshot: !!snapshot,
            isDirty,
            skipIfClean: options?.skipIfClean
        })

        // If we don't have a valid entity id yet, skip gracefully
        if (!params.id || params.id === 'new') {
            console.log(`⏭️ [EditorSave] Skipping save - no valid ID for ${key}`)
            return true
        }

        // Prevent concurrent saves for the same tab/context
        if (pendingSaves.has(saveKey)) {
            console.log(`⏳ [EditorSave] Save already in progress for ${saveKey}`)
            return true
        }

        // Check for changes if requested
        const prev = lastSavedStates.get(key) as TSnapshot | undefined
        if (options?.skipIfClean && !adapter.hasChanges(prev, snapshot)) {
            console.log(`⏭️ [EditorSave] No changes detected for ${key}, skipping`)
            return true
        }

        try {
            // Build safe payload for action system
            const payload = adapter.buildPayload(params.id, snapshot)
            
            console.log(`💾 [EditorSave] Executing save for ${key}`, {
                action: adapter.actionName,
                payload,
                context
            })

            // Create and track save promise
            const promise = mutation.mutateAsync(payload)
            pendingSaves.set(saveKey, promise)

            // Execute save
            const result = await promise

            if (result?.success) {
                // Update last saved state
                const persisted = adapter.selectPersisted
                    ? adapter.selectPersisted(result.data, snapshot)
                    : snapshot
                
                lastSavedStates.set(key, persisted)
                dirtyStates.set(key, false)
                setIsDirty(false)
                
                console.log(`✅ [EditorSave] Save successful for ${key}`)
                return true
            } else {
                console.error(`❌ [EditorSave] Save failed for ${key}:`, result?.error)
                return false
            }
        } catch (error) {
            console.error(`❌ [EditorSave] Save error for ${key}:`, error)
            return false
        } finally {
            pendingSaves.delete(saveKey)
        }
    }, [adapter, key, mutation, params.id, isDirty])

    // Update current snapshot and dirty state
    const updateSnapshot = useCallback((snapshot: TSnapshot) => {
        console.log('🔥🔥🔥 [EditorSave] updateSnapshot CALLED!', {
            key,
            snapshot,
            snapshotKeys: Object.keys(snapshot || {}),
            sourceCodeLength: (snapshot as any)?.sourceCode?.length || 0,
            pythonCodeLength: (snapshot as any)?.pythonCode?.length || 0,
            callerStack: new Error().stack?.split('\n')[1]?.trim(),
            timestamp: new Date().toISOString()
        })
        
        currentSnapshotRef.current = snapshot
        
        // Check if dirty
        const prev = lastSavedStates.get(key) as TSnapshot | undefined
        console.log('🔄 [EditorSave] Checking for changes...', {
            key,
            hasPrev: !!prev,
            prevSourceLength: (prev as any)?.sourceCode?.length || 0,
            currSourceLength: (snapshot as any)?.sourceCode?.length || 0,
            currentIsDirty: isDirty
        })
        
        const hasChanges = adapter.hasChanges(prev, snapshot)
        console.log('✅ [EditorSave] hasChanges result:', {
            key,
            hasChanges,
            prevIsDirty: isDirty,
            willUpdateDirty: hasChanges !== isDirty
        })
        
        if (hasChanges !== isDirty) {
            console.log('🚨 [EditorSave] Updating dirty state!', {
                key,
                oldIsDirty: isDirty,
                newIsDirty: hasChanges
            })
            setIsDirty(hasChanges)
            dirtyStates.set(key, hasChanges)
        }
        
        // Reset idle timer on change
        if (hasChanges) {
            console.log('⏰ [EditorSave] Resetting idle timer due to changes')
            resetIdleTimer()
        }
        
        console.log('✅ [EditorSave] updateSnapshot complete!')
    }, [adapter, key, isDirty, resetIdleTimer])

    // Set initial snapshot without marking as dirty
    const setLastSaved = useCallback((snapshot: TSnapshot) => {
        lastSavedStates.set(key, snapshot)
        currentSnapshotRef.current = snapshot
        dirtyStates.set(key, false)
        setIsDirty(false)
    }, [key])

    // Get last saved snapshot
    const getLastSaved = useCallback(() => {
        return lastSavedStates.get(key) as TSnapshot | undefined
    }, [key])

    // Save on tab switch - to be called by parent components
    const saveOnTabSwitch = useCallback(async (): Promise<boolean> => {
        console.log('🔄🔥 [EditorSave] saveOnTabSwitch CALLED!', {
            key,
            isDirty,
            hasSnapshot: !!currentSnapshotRef.current,
            snapshotData: currentSnapshotRef.current ? {
                sourceCodeLength: (currentSnapshotRef.current as any)?.sourceCode?.length || 0,
                pythonCodeLength: (currentSnapshotRef.current as any)?.pythonCode?.length || 0
            } : null,
            timestamp: new Date().toISOString()
        })
        
        if (currentSnapshotRef.current && isDirty) {
            console.log(`💾 [EditorSave] Executing tab switch save for ${key}`)
            return await save(currentSnapshotRef.current, { context: 'tab-switch', skipIfClean: true })
        }
        
        console.log(`⏭️ [EditorSave] Skipping tab switch save for ${key} - no changes or no snapshot`)
        return true
    }, [save, key, isDirty])

    return {
        // Core save functionality
        save,
        updateSnapshot,
        saveOnTabSwitch,
        
        // State management
        setLastSaved,
        getLastSaved,
        
        // State information
        isDirty,
        isPending: pendingSaves.has(key),
        
        // Utils
        resetIdleTimer
    }
}

/**
 * 🏆 MULTI-TAB EDITOR SAVE COORDINATOR
 * 
 * Manages saves across multiple tabs in a single editor.
 * Provides unified dirty state and batch save operations.
 */
export function useMultiTabEditorSave(
    editorId: string,
    adapters: TabAdapterRegistration[]
) {
    const [globalDirtyState, setGlobalDirtyState] = useState<EditorSaveState>({
        isDirty: false,
        dirtyTabs: [],
        lastSaved: {},
        pendingSaves: {}
    })

    // Track individual tab save hooks
    const tabSaveHooks = useMemo(() => {
        const hooks: Record<string, ReturnType<typeof useEditorSave>> = {}
        
        adapters.forEach(({ tabId, adapter }) => {
            hooks[tabId] = useEditorSave(adapter, { id: editorId, tab: tabId })
        })
        
        return hooks
    }, [editorId, adapters])

    // Update global dirty state when individual tabs change
    useEffect(() => {
        const isDirty = Object.values(tabSaveHooks).some(hook => hook.isDirty)
        const dirtyTabs = Object.entries(tabSaveHooks)
            .filter(([_, hook]) => hook.isDirty)
            .map(([tabId]) => tabId)
        
        setGlobalDirtyState(prev => ({
            ...prev,
            isDirty,
            dirtyTabs
        }))
    }, [tabSaveHooks])

    // Save all dirty tabs
    const saveAll = useCallback(async (context: SaveOptions['context'] = 'manual'): Promise<boolean> => {
        console.log(`🔄 [MultiTabSave] Saving all dirty tabs for editor ${editorId}`)
        
        const savePromises = Object.entries(tabSaveHooks)
            .filter(([_, hook]) => hook.isDirty)
            .map(async ([tabId, hook]) => {
                try {
                    return await hook.saveOnTabSwitch()
                } catch (error) {
                    console.error(`❌ [MultiTabSave] Failed to save tab ${tabId}:`, error)
                    return false
                }
            })
        
        const results = await Promise.all(savePromises)
        return results.every(result => result === true)
    }, [editorId, tabSaveHooks])

    // Save on tab switch - automatically saves current tab before switching
    const handleTabSwitch = useCallback(async (fromTab: string, toTab: string): Promise<boolean> => {
        if (tabSaveHooks[fromTab]) {
            console.log(`🔄 [MultiTabSave] Tab switch: ${fromTab} → ${toTab}`)
            return await tabSaveHooks[fromTab].saveOnTabSwitch()
        }
        return true
    }, [tabSaveHooks])

    return {
        // Individual tab access
        getTabSave: (tabId: string) => tabSaveHooks[tabId],
        
        // Global operations
        saveAll,
        handleTabSwitch,
        
        // Global state
        globalDirtyState,
        
        // Convenience getters
        isDirty: globalDirtyState.isDirty,
        dirtyTabs: globalDirtyState.dirtyTabs
    }
}

// Export cleanup utilities for testing
export const __internal = {
    clearAllStates: () => {
        lastSavedStates.clear()
        pendingSaves.clear()
        dirtyStates.clear()
    }
}
