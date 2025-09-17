'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useActionMutation } from '@/hooks/use-action-api'
import type { SaveOptions, TabSaveAdapter, TabSnapshot } from './types'

// Internal state maps shared per module instance
const lastSavedStates = new Map<string, any>()
const pendingSaves = new Map<string, Promise<any>>()

export function useEditorTabSave<TSnapshot extends TabSnapshot = TabSnapshot>(
    adapter: TabSaveAdapter<TSnapshot>,
    params: { id: string; tab: string }
) {
    const key = useMemo(() => adapter.getEntityKey(params), [adapter, params.id, params.tab])
    const mutation = useActionMutation(adapter.actionName)

    // Idle timer (15 minutes)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastActivityRef = useRef<number>(Date.now())

    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now()
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
            // consumer should call save with current snapshot; we expose a helper
            // to be invoked from outside when idle fires
        }, 15 * 60 * 1000)
    }, [])

    useEffect(() => {
        const onAnyActivity = () => resetIdleTimer()
        window.addEventListener('mousemove', onAnyActivity)
        window.addEventListener('keydown', onAnyActivity)
        window.addEventListener('click', onAnyActivity)
        resetIdleTimer()
        return () => {
            window.removeEventListener('mousemove', onAnyActivity)
            window.removeEventListener('keydown', onAnyActivity)
            window.removeEventListener('click', onAnyActivity)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [resetIdleTimer])

    // beforeunload save hook (refresh/close)
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            // Consumers must call save() synchronously beforehand if needed.
            // We only signal that a save may be pending; modern browsers limit async here.
            if (pendingSaves.size > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [])

    const save = useCallback(async (
        snapshot: TSnapshot,
        options?: Partial<SaveOptions>
    ): Promise<boolean> => {
        const context = options?.context || 'manual'
        const saveKey = `${key}:${context}`

        // If we don't have a valid entity id yet, skip gracefully
        if (!params.id) return true

        if (pendingSaves.has(saveKey)) return true

        const prev = lastSavedStates.get(key) as TSnapshot | undefined
        if (options?.skipIfClean && !adapter.hasChanges(prev, snapshot)) return true

        const payload = adapter.buildPayload(params.id, snapshot)
        const promise = mutation.mutateAsync(payload)
        pendingSaves.set(saveKey, promise)
        try {
            const result = await promise
            if (result?.success) {
                const persisted = adapter.selectPersisted
                    ? adapter.selectPersisted(result.data, snapshot)
                    : snapshot
                lastSavedStates.set(key, persisted)
                return true
            }
            return false
        } catch {
            return false
        } finally {
            pendingSaves.delete(saveKey)
        }
    }, [adapter, key, mutation, params.id])

    const setLastSaved = useCallback((snapshot: TSnapshot) => {
        lastSavedStates.set(key, snapshot)
    }, [key])

    const getLastSaved = useCallback(() => {
        return lastSavedStates.get(key) as TSnapshot | undefined
    }, [key])

    return {
        save,
        setLastSaved,
        getLastSaved,
        // Expose idle timer control so caller can trigger a save on idle expiry
        resetIdleTimer
    }
}


