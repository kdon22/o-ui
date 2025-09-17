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
    const key = useMemo(() => adapter.getEntityKey(params), [adapter.actionName, params.id, params.tab])
    const mutation = useActionMutation(adapter.actionName)
    // Stabilize mutate function identity via ref to prevent effect churn
    const mutateRef = useRef(mutation.mutateAsync)
    useEffect(() => {
        mutateRef.current = mutation.mutateAsync
    }, [mutation.mutateAsync])
    
    // 🚨 FIX: Only log once per key to avoid spam
    const hasLoggedRef = useRef(new Set<string>())
    if (!hasLoggedRef.current.has(key)) {
        console.log('🚨🚨🚨 [EditorSave] Hook initialized!', {
            adapterName: adapter.actionName,
            id: params.id,
            tab: params.tab,
            key,
            timestamp: new Date().toISOString()
        })
        hasLoggedRef.current.add(key)
    }
    
    // Track dirty state for this specific tab
    const [isDirty, setIsDirty] = useState(false)

    // Idle timer (15 minutes)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastActivityRef = useRef<number>(Date.now())
    const currentSnapshotRef = useRef<TSnapshot | null>(null)

    // Core save function - MOVED UP to avoid temporal dead zone error
    const save = useCallback(async (
        snapshot: TSnapshot,
        options?: Partial<SaveOptions>
    ): Promise<boolean> => {
        const context = options?.context || 'manual'
        const saveKey = `${key}:${context}`

        console.log(`🚨🚨🚨 [EditorSave] SAVE REQUEST - CRITICAL DEBUG!`, {
            key,
            context,
            hasSnapshot: !!snapshot,
            snapshotKeys: snapshot ? Object.keys(snapshot) : 'NO_SNAPSHOT',
            sourceCodeLength: (snapshot as any)?.sourceCode?.length || 0,
            timestamp: new Date().toISOString()
        })

        // Skip if no changes detected
        if (options?.skipIfClean !== false) {
            const lastSaved = lastSavedStates.get(key)
            if (!adapter.hasChanges(lastSaved, snapshot)) {
                console.log(`🚫 [EditorSave] No changes detected for ${key}, skipping save`)
                return true
            }
        }

        // Check for pending save
        const existingSave = pendingSaves.get(saveKey)
        if (existingSave) {
            console.log(`⏳ [EditorSave] Save already in progress for ${saveKey}, waiting...`)
            const result = await existingSave
            console.log(`✅ [EditorSave] Existing save completed for ${saveKey}:`, result)

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
            const promise = mutateRef.current(payload)
            pendingSaves.set(saveKey, promise)

            // Execute save
            console.log('🚨🚨🚨 [EditorSave] ABOUT TO EXECUTE API CALL!')
            const result = await promise
            console.log('🚨🚨🚨 [EditorSave] API CALL COMPLETED - RESULT:', {
                result,
                hasResult: !!result,
                resultSuccess: result?.success,
                resultData: result?.data,
                resultKeys: result ? Object.keys(result) : 'NO_RESULT'
            })

            if (result?.success) {
                // Update last saved state
                lastSavedStates.set(key, snapshot)
                console.log(`✅ [EditorSave] Save successful for ${key}`)
                
                // Clear dirty state
                dirtyStates.set(key, false)
                setIsDirty(false)
                
                return true
            } else {
                console.error(`❌ [EditorSave] Save failed for ${key}:`, result)
                return false
            }
        } catch (error) {
            console.error(`❌ [EditorSave] Save error for ${key}:`, error)
            return false
        } finally {
            // Clean up pending save
            pendingSaves.delete(saveKey)
        }
    }, [key, adapter, params.id])

    // Auto-save callback for idle timer
    // 🚨 CRITICAL FIX: Use ref to prevent circular dependencies
    const performIdleRef = useRef<() => Promise<void>>()
    
    const performIdleSave = useCallback(async () => {
        // 🔥 USE REFS TO AVOID DEPENDENCY ON isDirty STATE
        const currentIsDirty = dirtyStates.get(key) || false
        const currentSnapshot = currentSnapshotRef.current
        
        console.log(`🚨🚨🚨 [EditorSave] IDLE SAVE TIMER FIRED!`, {
            key,
            isDirty: currentIsDirty,
            hasSnapshot: !!currentSnapshot,
            timestamp: new Date().toISOString()
        })
        
        if (currentSnapshot && currentIsDirty) {
            console.log(`🚨🚨🚨 [EditorSave] EXECUTING IDLE SAVE for ${key}`)
            await save(currentSnapshot, { context: 'auto-idle', skipIfClean: false })
            console.log(`✅ [EditorSave] IDLE SAVE COMPLETED for ${key}`)
        } else {
            console.log(`⏭️ [EditorSave] IDLE SAVE SKIPPED for ${key} - isDirty:${currentIsDirty}, hasSnapshot:${!!currentSnapshot}`)
        }
    }, [key, save]) // ✅ REMOVED isDirty dependency, using refs instead
    
    // 🚨 CRITICAL: Assign ref to break circular dependencies
    performIdleRef.current = performIdleSave

    // 🚨 CRITICAL FIX: Use ref to prevent infinite re-render loop
    const resetIdleTimerRef = useRef<() => void>()
    
    resetIdleTimerRef.current = () => {
        console.log(`🚨🚨🚨 [EditorSave] RESET IDLE TIMER CALLED!`, {
            key,
            isDirty,
            hasSnapshot: !!currentSnapshotRef.current,
            currentTime: new Date().toISOString(),
            willSetTimer: true
        })
        
        lastActivityRef.current = Date.now()
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current)
            console.log(`🗑️ [EditorSave] Cleared existing idle timer for ${key}`)
        }
        
        // 15-minute idle auto-save window
        idleTimerRef.current = setTimeout(() => {
            // Call performIdleSave directly to avoid circular dependencies
            performIdleRef.current?.()
        }, 15 * 60 * 1000)
        console.log(`⏰ [EditorSave] NEW IDLE TIMER SET for ${key} - will fire in 15 minutes`)
    }
    
    const resetIdleTimer = useCallback(() => {
        resetIdleTimerRef.current?.()
    }, []) // 🚨 NO DEPENDENCIES - prevents circular re-creation

    // Removed global activity listeners: idle timer resets only on content change
    useEffect(() => {
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [])


    // Update current snapshot and dirty state
    const updateSnapshot = useCallback((snapshot: TSnapshot) => {
        console.log('🚨🚨🚨 [EditorSave] updateSnapshot CALLED!', {
            key,
            snapshot,
            snapshotKeys: Object.keys(snapshot || {}),
            sourceCodeLength: (snapshot as any)?.sourceCode?.length || 0,
            pythonCodeLength: (snapshot as any)?.pythonCode?.length || 0,
            sourceCodePreview: ((snapshot as any)?.sourceCode || '').substring(0, 100) + '...',
            callerStack: new Error().stack?.split('\n')[1]?.trim(),
            timestamp: new Date().toISOString()
        })
        
        currentSnapshotRef.current = snapshot
        
        // Check if dirty
        const prev = lastSavedStates.get(key) as TSnapshot | undefined
        console.log('🚨🚨🚨 [EditorSave] CHECKING FOR CHANGES - CRITICAL DEBUG!', {
            key,
            hasPrev: !!prev,
            prevSourceLength: (prev as any)?.sourceCode?.length || 0,
            currSourceLength: (snapshot as any)?.sourceCode?.length || 0,
            prevSourcePreview: ((prev as any)?.sourceCode || 'NONE').substring(0, 100) + '...',
            currSourcePreview: ((snapshot as any)?.sourceCode || 'NONE').substring(0, 100) + '...',
            prevSourceFull: (prev as any)?.sourceCode || 'NONE',
            currSourceFull: (snapshot as any)?.sourceCode || 'NONE',
            currentIsDirty: isDirty
        })
        
        console.log('🔥 [EditorSave] Calling adapter.hasChanges...')
        const hasChanges = adapter.hasChanges(prev, snapshot)
        console.log('🚨🚨🚨 [EditorSave] ADAPTER hasChanges RESULT - CRITICAL!', {
            key,
            hasChanges,
            prevIsDirty: isDirty,
            willUpdateDirty: hasChanges !== isDirty,
            stringComparison: (prev as any)?.sourceCode === (snapshot as any)?.sourceCode ? 'EQUAL' : 'DIFFERENT'
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
            resetIdleTimerRef.current?.()
        }
        
        console.log('✅ [EditorSave] updateSnapshot complete!')
    }, [adapter, key, isDirty]) // 🚨 REMOVED resetIdleTimer dependency to prevent circular re-renders

    // Keep a stable reference to save
    const saveRef = useRef(save)
    useEffect(() => { saveRef.current = save }, [save])

    // 🏆 UNIVERSAL TAB-SWITCH-SAVE HANDLER - SSOT for all tab switching saves
    useEffect(() => {
        const handleTabSwitchSave = async (event: CustomEvent) => {
            console.log('🚨 [EditorSave] Universal tab-switch-save event received!', {
                key,
                eventRuleId: event.detail?.ruleId,
                paramsId: params.id,
                matches: event.detail?.ruleId === params.id,
                isDirty: dirtyStates.get(key) || false,
                hasSnapshot: !!currentSnapshotRef.current,
                fromTab: event.detail?.fromTab,
                toTab: event.detail?.toTab
            })
            
            // Check if this event is for our entity and we have unsaved changes
            const currentIsDirty = dirtyStates.get(key) || false
            if (event.detail?.ruleId === params.id && currentIsDirty && currentSnapshotRef.current) {
                console.log('🚨 [EditorSave] UNIVERSAL SAVE TRIGGERED!', {
                    key,
                    fromTab: event.detail.fromTab,
                    toTab: event.detail.toTab,
                    snapshotKeys: Object.keys(currentSnapshotRef.current || {}),
                    timestamp: new Date().toISOString()
                })
                
                try {
                    const result = await saveRef.current(currentSnapshotRef.current, { 
                        context: 'tab-switch', 
                        skipIfClean: true 
                    })
                    console.log('✅ [EditorSave] Universal tab-switch save completed:', { key, result })
                } catch (error) {
                    console.error('❌ [EditorSave] Universal tab-switch save failed:', { key, error })
                }
            } else {
                console.log('⏭️ [EditorSave] Universal save skipped:', {
                    key,
                    reason: !event.detail?.ruleId ? 'no-rule-id' :
                            event.detail.ruleId !== params.id ? 'different-entity' :
                            !(dirtyStates.get(key) || false) ? 'not-dirty' :
                            !currentSnapshotRef.current ? 'no-snapshot' : 'unknown',
                    eventRuleId: event.detail?.ruleId,
                    paramsId: params.id,
                    isDirty: dirtyStates.get(key) || false,
                    hasSnapshot: !!currentSnapshotRef.current
                })
            }
        }
        
        window.addEventListener('tab-switch-save', handleTabSwitchSave as EventListener)
        console.log('🏆 [EditorSave] Universal tab-switch-save listener registered for:', key)
        
        return () => {
            window.removeEventListener('tab-switch-save', handleTabSwitchSave as EventListener)
            console.log('🗑️ [EditorSave] Universal tab-switch-save listener removed for:', key)
        }
    }, [params.id, key])

    // Global save-on-close handler with debug logging (after save function is defined)
    useEffect(() => {
        console.log('🚨🚨🚨 [EditorSave] Setting up beforeunload handler for:', key)
        
        const handler = async (e: BeforeUnloadEvent) => {
            console.log('🚨🚨🚨🚨🚨 [EditorSave] BEFOREUNLOAD EVENT FIRED!!! BROWSER CLOSING!', {
                key,
                isDirty: dirtyStates.get(key) || false,
                hasSnapshot: !!currentSnapshotRef.current,
                snapshotSourceLength: (currentSnapshotRef.current as any)?.sourceCode?.length || 0,
                snapshotPreview: ((currentSnapshotRef.current as any)?.sourceCode || 'NONE').substring(0, 100) + '...',
                eventType: e.type,
                timestamp: new Date().toISOString()
            })
            
            // If we have unsaved changes, attempt synchronous save
            if ((dirtyStates.get(key) || false) && currentSnapshotRef.current) {
                console.log('🚨🚨🚨🚨🚨 [EditorSave] BEFOREUNLOAD SAVE ATTEMPT! CRITICAL SAVE!', key)
                
                // Modern browsers limit async here, so we just warn the user
                e.preventDefault()
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
                
                // Attempt save anyway (may not complete before page closes)
                try {
                    console.log('🚨🚨🚨 [EditorSave] EXECUTING CRITICAL BEFOREUNLOAD SAVE for:', key)
                    const savePromise = saveRef.current(currentSnapshotRef.current, { context: 'close', skipIfClean: false })
                    console.log('🚨🚨🚨 [EditorSave] BEFOREUNLOAD SAVE PROMISE CREATED, awaiting...:', key)
                    const result = await savePromise
                    console.log('✅✅✅ [EditorSave] BEFOREUNLOAD SAVE COMPLETED!', { key, result })
                } catch (error) {
                    console.error(`❌❌❌ [EditorSave] BEFOREUNLOAD SAVE FAILED:`, { key, error })
                }
            } else {
                console.log('⏭️ [EditorSave] Beforeunload - no save needed:', {
                    key,
                    isDirty: dirtyStates.get(key) || false,
                    hasSnapshot: !!currentSnapshotRef.current
                })
            }
        }
        
        window.addEventListener('beforeunload', handler)
        console.log('✅ [EditorSave] Beforeunload handler registered for:', key)
        
        return () => {
            window.removeEventListener('beforeunload', handler)
            console.log('🗑️ [EditorSave] Beforeunload handler removed for:', key)
        }
    }, [key])
    

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
        console.log('🚨🚨🚨 [EditorSave] saveOnTabSwitch CALLED!', {
            key,
            isDirty: dirtyStates.get(key) || false,
            hasSnapshot: !!currentSnapshotRef.current,
            snapshotData: currentSnapshotRef.current ? {
                sourceCodeLength: (currentSnapshotRef.current as any)?.sourceCode?.length || 0,
                pythonCodeLength: (currentSnapshotRef.current as any)?.pythonCode?.length || 0
            } : null,
            timestamp: new Date().toISOString(),
            caller: new Error().stack?.split('\n')[2]?.trim()
        })
        
        const currentIsDirty = dirtyStates.get(key) || false
        if (currentSnapshotRef.current && currentIsDirty) {
            console.log('🚨🚨🚨 [EditorSave] EXECUTING TAB SWITCH SAVE for:', key)
            const result = await saveRef.current(currentSnapshotRef.current, { context: 'tab-switch', skipIfClean: true })
            console.log('🚨🚨🚨 [EditorSave] TAB SWITCH SAVE RESULT:', { key, result })
            return result
        }
        
        console.log('⏭️ [EditorSave] Skipping tab switch save for:', key, '- isDirty:', currentIsDirty, 'hasSnapshot:', !!currentSnapshotRef.current)
        return true
    }, [key])

    return {
        // Core save functionality
        save,
        updateSnapshot,
        saveOnTabSwitch,
        
        // State management
        setLastSaved,
        getLastSaved,
        
        // State information (compatible with old interface)
        isDirty,
        isPending: pendingSaves.has(key),
        saving: pendingSaves.has(key),  // Alias for compatibility
        loading: mutation.isPending,    // From mutation state
        error: mutation.error,          // From mutation state
        
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
