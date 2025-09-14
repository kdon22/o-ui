import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { translateBusinessRulesToPython } from '@/lib/editor/python-generation'
import { RuleCodeSyncService, RuleData } from '@/components/editor/services/rule-code-sync-service'
import { getActionClient } from '@/lib/action-client'
import { useSession } from 'next-auth/react'
import { useBranchContext, isBranchContextReady } from '@/lib/context/branch-context'

export function useRuleEditor(ruleId: string) {
  const { data: session } = useSession()
  const branchContext = useBranchContext()
  const [rule, setRule] = useState<RuleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false)
  
  // Use ref to store current branchContext for debounced callbacks
  const branchContextRef = useRef(branchContext)
  const lastServerHashRef = useRef<string | null>(null)
  const lastCheckpointAtRef = useRef<number>(0)
  const lastKeystrokeAtRef = useRef<number>(0)
  // Removed idle checkpoint timer; versioning is handled by a 15-minute interval and on-close
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentDraftHashRef = useRef<string | null>(null)
  const lastCheckpointCharLenRef = useRef<number>(0)
  const lastCheckpointLineCountRef = useRef<number>(0)
  // Version promotion tracking
  const lastVersionAtRef = useRef<number>(0)
  const lastVersionHashRef = useRef<string | null>(null)
  const lastVersionCharLenRef = useRef<number>(0)
  const lastVersionLineCountRef = useRef<number>(0)
  const latestSourceRef = useRef<string>('')
  
  // Initialize sync service
  const [syncService] = useState(() => {
    if (!session?.user?.tenantId) return null
    const actionClient = getActionClient(session.user.tenantId)
    
    // Set branch context on action client if available
    if (branchContext && isBranchContextReady(branchContext) && session.user.id) {
      actionClient.setBranchContext({
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId: session.user.tenantId,
        userId: session.user.id
      })
    }
    
    return new RuleCodeSyncService(actionClient)
  })

  // Update branch context when it changes
  useEffect(() => {
    // Keep ref updated with current branchContext
    branchContextRef.current = branchContext
    
    if (syncService && branchContext && isBranchContextReady(branchContext) && session?.user?.tenantId && session?.user?.id) {
      const actionClient = getActionClient(session.user.tenantId)
      actionClient.setBranchContext({
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId: session.user.tenantId,
        userId: session.user.id
      })
    }
  }, [syncService, branchContext, session?.user?.tenantId, session?.user?.id])

  // Load rule on mount
  useEffect(() => {
    if (!syncService || !ruleId) return

    const loadRule = async () => {
      console.log('🔍 [useRuleEditor] Loading rule:', { ruleId, hasSyncService: !!syncService })
      setLoading(true)
      try {
        const ruleData = await syncService.loadRule(ruleId)
        console.log('🔍 [useRuleEditor] Rule loaded:', {
          ruleId,
          hasRuleData: !!ruleData,
          ruleDataKeys: ruleData ? Object.keys(ruleData) : [],
          sourceCode: ruleData?.sourceCode,
          sourceCodeLength: ruleData?.sourceCode?.length || 0,
          sourceCodePreview: ruleData?.sourceCode?.substring(0, 100) || 'EMPTY'
        })
        setRule(ruleData)
        setError(null)

        // Initialize server hash and check for local draft recovery
        const serverSource = (ruleData as any)?.sourceCode || ''
        const serverHash = computeHash(serverSource)
        lastServerHashRef.current = serverHash
        currentDraftHashRef.current = serverHash
        lastCheckpointCharLenRef.current = (serverSource || '').length
        lastCheckpointLineCountRef.current = countLines(serverSource)
        // Initialize version promotion references on initial load
        lastVersionHashRef.current = serverHash
        lastVersionCharLenRef.current = (serverSource || '').length
        lastVersionLineCountRef.current = countLines(serverSource)
        lastVersionAtRef.current = Date.now()

        const draft = readLocalDraft()
        if (draft && draft.hash && draft.hash !== serverHash) {
          setHasRecoverableDraft(true)
        } else {
          setHasRecoverableDraft(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rule')
      } finally {
        setLoading(false)
      }
    }

    loadRule()
  }, [syncService, ruleId])

  // Removed server autosave; we only persist local drafts during typing

  // Draft saver (fast, local) with shorter debounce
  const debouncedSaveDraft = useDebouncedCallback(
    (source: string) => {
      saveLocalDraft(source)
    },
    500
  )

  // Handle source code changes from Monaco editor  
  const onSourceCodeChange = useCallback((newSourceCode: string) => {
    // Capture latest synchronously for close events
    latestSourceRef.current = newSourceCode
    // Use functional update to check current rule state without dependency
    let shouldProceed = false
    setRule(prev => {
      if (!prev) return prev
      shouldProceed = true
      return { ...prev, sourceCode: newSourceCode }
    })
    
    if (!shouldProceed) return
    
    // Update keystroke time
    lastKeystrokeAtRef.current = Date.now()

    // Always update local draft quickly (no DB writes while typing)
    debouncedSaveDraft(newSourceCode)
  }, [])

  // Helper to read the latest sourceCode from state without capturing
  const getLatestSource = useCallback(() => {
    // Prefer the ref which is updated synchronously on change
    if (latestSourceRef.current) return latestSourceRef.current
    let current: string | null = null
    setRule(prev => {
      current = prev?.sourceCode ?? null
      return prev
    })
    return current
  }, [])

  // Local draft persistence
  const draftKey = useMemo(() => {
    const tenantId = session?.user?.tenantId || 'anon'
    const current = branchContextRef.current
    const branchId = current && (current as any).isReady ? (current as any).currentBranchId : 'unknown'
    return `rule-draft:${tenantId}:${ruleId}:${branchId}`
  }, [ruleId, session?.user?.tenantId])

  const saveLocalDraft = useCallback((source: string) => {
    try {
      const hash = computeHash(source)
      currentDraftHashRef.current = hash
      const payload = { hash, updatedAt: Date.now(), source }
      if (typeof window !== 'undefined') {
        localStorage.setItem(draftKey, JSON.stringify(payload))
      }
    } catch (e) {
      // ignore draft failures silently
    }
  }, [draftKey])

  const readLocalDraft = useCallback(() => {
    if (typeof window === 'undefined') return null as null | { hash: string; updatedAt: number; source: string }
    const raw = localStorage.getItem(draftKey)
    if (!raw) return null
    try {
      return JSON.parse(raw) as { hash: string; updatedAt: number; source: string }
    } catch {
      return null
    }
  }, [draftKey])

  const clearLocalDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(draftKey)
  }, [draftKey])

  // Best-effort close-time save using sendBeacon/keepalive
  const tryCloseTimeSave = useCallback((latest: string, currentRuleName?: string) => {
    try {
      console.log('🗺️ [DEBUG] use-rule-editor.tryCloseTimeSave called')
      console.log('🗺️ [DEBUG] latest business rules length:', latest?.length || 0)
      console.log('🗺️ [DEBUG] latest business rules (first 100 chars):', latest?.substring(0, 100) || 'EMPTY')
      // Compute python code synchronously for SSOT parity on close
      const py = translateBusinessRulesToPython(latest)
      const pythonCode = py?.pythonCode || ''
      console.log('🗺️ [DEBUG] generated python code length:', pythonCode?.length || 0)
      console.log('🗺️ [DEBUG] generated python code (first 100 chars):', pythonCode?.substring(0, 100) || 'EMPTY')
      // Source map generation now handled by enhanced system in saveRule
      const payload: any = {
        action: 'rule.update',
        data: { id: ruleId, sourceCode: latest, name: currentRuleName, pythonCode }
      }
      const body = JSON.stringify(payload)
      const endpoint = '/api/workspaces/current/actions'
      let sent = false
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' })
        sent = navigator.sendBeacon(endpoint, blob)
      }
      // Fallback to fetch keepalive if beacon not available or failed
      if (!sent && typeof fetch !== 'undefined') {
        // Fire-and-forget; browser may keep the request alive during unload
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
          credentials: 'include'
        }).catch(() => {})
        sent = true
      }
      return sent
    } catch {
      return false
    }
  }, [ruleId])

  // Periodic versioning: every minute, if dirty and last version >= 15 minutes ago, create a new version in DB
  useEffect(() => {
    if (!syncService || !ruleId) return
    const timer = setInterval(async () => {
      try {
        const latest = getLatestSource() || ''
        const newHash = computeHash(latest)
        const serverHash = lastServerHashRef.current
        const dirty = !!serverHash && newHash !== serverHash
        const now = Date.now()
        const sinceLastVersionMs = now - (lastVersionAtRef.current || 0)
        if (!dirty) return
        if (sinceLastVersionMs < PROMOTE_TIME_MS) return

        setSaving(true)
        let currentRuleName: string | undefined
        setRule(prev => { currentRuleName = prev?.name; return prev })
        await syncService.saveRule({ id: ruleId, sourceCode: latest, name: currentRuleName })

        // Update version references
        lastVersionAtRef.current = now
        lastVersionHashRef.current = newHash
        lastVersionCharLenRef.current = (latest || '').length
        lastVersionLineCountRef.current = countLines(latest)
        lastServerHashRef.current = newHash
        lastCheckpointAtRef.current = now
        lastCheckpointCharLenRef.current = (latest || '').length
        lastCheckpointLineCountRef.current = countLines(latest)
        clearLocalDraft()
        setHasRecoverableDraft(false)
      } catch (err) {
        // Keep draft locally; background version save failed
      } finally {
        setSaving(false)
      }
    }, 60 * 1000)
    return () => clearInterval(timer)
  }, [syncService, ruleId, getLatestSource, clearLocalDraft])

  const forceCheckpoint = useCallback(async () => {
    // No DB writes; only ensure latest draft is persisted locally
    const latest = getLatestSource() || ''
    saveLocalDraft(latest)
  }, [getLatestSource, saveLocalDraft])

  // Draft recovery
  const applyRecoveredDraft = useCallback(() => {
    const draft = readLocalDraft()
    if (!draft?.source) return
    setRule(prev => prev ? { ...prev, sourceCode: draft.source } : prev)
    currentDraftHashRef.current = draft.hash
    setHasRecoverableDraft(false)
  }, [readLocalDraft])

  const discardRecoveredDraft = useCallback(() => {
    clearLocalDraft()
    setHasRecoverableDraft(false)
  }, [clearLocalDraft])

  // Ensure DB save on component unmount (e.g., closing editor "X") if dirty
  useEffect(() => {
    return () => {
      try {
        const latest = latestSourceRef.current || getLatestSource() || ''
        const newHash = computeHash(latest)
        const serverHash = lastServerHashRef.current
        const dirty = !!serverHash && newHash !== serverHash
        if (dirty && syncService && ruleId) {
          // Fire-and-forget; SPA navigation won't cancel fetch
          void syncService.saveRule({ id: ruleId, sourceCode: latest })
        }
      } catch {}
    }
  }, [syncService, ruleId, getLatestSource])

  // Protect against accidental close by always persisting latest draft
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onBeforeUnload = () => {
      const latest = latestSourceRef.current || getLatestSource()
      if (latest) {
        saveLocalDraft(latest)
        // Promote final version on close ONLY if dirty since last server save
        try {
          const newHash = computeHash(latest)
          const serverHash = lastServerHashRef.current
          const dirty = !!serverHash && newHash !== serverHash
          if (dirty && syncService) {
            let currentRuleName: string | undefined
            setRule(prev => { currentRuleName = prev?.name; return prev })
            // Best-effort beacon/keepalive save; don't await
            tryCloseTimeSave(latest, currentRuleName)
          }
        } catch {}
      }
      // Cancel any pending timers
      try {
        ;(debouncedSaveDraft as any)?.flush?.()
      } catch {}
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const latest = latestSourceRef.current || getLatestSource()
        if (latest) {
          saveLocalDraft(latest)
          // Also attempt a best-effort save if dirty
          try {
            const newHash = computeHash(latest)
            const serverHash = lastServerHashRef.current
            const dirty = !!serverHash && newHash !== serverHash
            if (dirty) {
              let currentRuleName: string | undefined
              setRule(prev => { currentRuleName = prev?.name; return prev })
              tryCloseTimeSave(latest, currentRuleName)
            }
          } catch {}
        }
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [getLatestSource, saveLocalDraft, tryCloseTimeSave, syncService, ruleId])

  // Manual save function
  const saveRule = useCallback(async (updates: Partial<RuleData>) => {
    if (!syncService) return false

    // Use functional update to get current rule state
    let currentRule: RuleData | null = null
    setRule(prev => {
      currentRule = prev
      return prev
    })

    if (!currentRule) return false

    setSaving(true)
    try {
      const base: RuleData = currentRule as RuleData
      // Whitelist fields for update to avoid sending nested relations
      const payload: Partial<RuleData> & { id: string } = {
        id: base.id,
        // Preserve name if explicitly provided
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.sourceCode !== undefined ? { sourceCode: updates.sourceCode } : {}),
        ...(updates.pythonCode !== undefined ? { pythonCode: updates.pythonCode } : {}),
      }
      const success = await syncService.saveRule(payload)
      if (success) {
        setRule(prev => prev ? { ...prev, ...updates } : null)
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }, [syncService]) // Remove 'rule' dependency to prevent re-creation

  // Bidirectional sync: Python → Business Rules
  const syncFromPython = useCallback(async (pythonCode: string) => {
    if (!syncService || !ruleId) return null

    setSaving(true)
    try {
      await syncService.syncFromPython(ruleId, pythonCode)
      // Update the rule with the new Python code
      setRule(prev => prev ? { ...prev, pythonCode: pythonCode } : null)
      return pythonCode
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Python sync failed')
      return null
    } finally {
      setSaving(false)
    }
  }, [syncService, ruleId])

  // Memoize computed values to prevent unnecessary re-renders
  const sourceCode = useMemo(() => {
    const result = rule?.sourceCode || ''
    console.log('🔍 [useRuleEditor] sourceCode computed:', {
      ruleId,
      hasRule: !!rule,
      ruleSourceCode: rule?.sourceCode,
      resultLength: result.length,
      resultPreview: result.substring(0, 100) || 'EMPTY'
    })
    return result
  }, [rule?.sourceCode, ruleId])
  const generatedCode = useMemo(() => rule?.pythonCode || '', [rule?.pythonCode])
  const hasUnsavedChanges = useMemo(() => saving, [saving])
  const isReady = useMemo(() => !loading && !!rule && !!syncService, [loading, rule, syncService])
  // Dirty since last successful server checkpoint/version
  const isDirtySinceServer = useMemo(() => {
    const current = rule?.sourceCode || ''
    const currentHash = computeHash(current)
    const serverHash = lastServerHashRef.current || null
    return !!serverHash && currentHash !== serverHash
  }, [rule?.sourceCode])

  return {
    // State
    rule,
    loading,
    saving,
    error,
    
    // Business rules (Monaco input) - memoized
    sourceCode,
    
    // Generated Python (read-only output) - memoized  
    generatedCode,
    
    // Actions
    onSourceCodeChange,
    saveRule,
    syncFromPython,
    
    // Status - memoized
    hasUnsavedChanges,
    isReady,
    // Draft & checkpoint helpers
    hasRecoverableDraft,
    recoverDraft: applyRecoveredDraft,
    discardDraft: discardRecoveredDraft,
    requestCheckpoint: forceCheckpoint
    ,
    // Dirty state vs last server write
    isDirtySinceServer
  }
} 

// =============================================================
// Local Draft + Checkpoint Gate
// =============================================================

// Make checkpoints responsive so quick edits are not ignored
// Short idle window ensures the 3s debounce will pass the idle check
const IDLE_CHECKPOINT_MS = 1200
// Merge nearby versions but allow frequent checkpoints during active edits
const MERGE_WINDOW_MS = 5000
// Consider tiny edits as meaningful to persist frequently
const MIN_CHANGE_CHARS = 1
const MIN_CHANGE_LINES = 0

// Smart version promotion thresholds (keep impact low)
const PROMOTE_TIME_MS = 5 * 60 * 1000 // 5 minutes

function computeHash(input: string): string {
  // FNV-1a 32-bit (simple and fast)
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0
  }
  return ('0000000' + hash.toString(16)).slice(-8)
}

function countLines(text: string): number {
  if (!text) return 0
  return text.split('\n').length
}
