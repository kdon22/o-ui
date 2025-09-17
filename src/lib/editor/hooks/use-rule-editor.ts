/**
 * 🏆 Rule Editor Hook - Clean Architecture
 * 
 * Single Source of Truth architecture:
 * - useSourceCodeState (Zustand) = THE ONLY STATE
 * - Focused hooks for specific responsibilities
 * - No refs, no duplicate state, no complex synchronization
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useRuleSourceCode } from '@/components/editor/services/source-code-state-manager'
import { useRuleQuery } from './use-rule-query'
import { useDraftPersistence } from './use-draft-persistence'

export function useRuleEditor(ruleId: string) {
  // 🏆 SSOT: Single Source of Truth - All state comes from here
  const ruleSourceCode = useRuleSourceCode(ruleId)
  
  // 🏆 FOCUSED: Specialized hooks for specific responsibilities
  const ruleQuery = useRuleQuery(ruleId)
  const draftPersistence = useDraftPersistence(ruleId)

  // 🚀 CLEAN: Source code change handler (updates SSOT only)
  const onSourceCodeChange = useCallback((newSourceCode: string) => {
    console.log('🔥🔥🔥 [useRuleEditor] onSourceCodeChange CALLED!', {
      ruleId,
      newLength: newSourceCode.length,
      oldLength: ruleSourceCode.sourceCode.length,
      timestamp: new Date().toISOString(),
      preview: newSourceCode.substring(0, 100) + (newSourceCode.length > 100 ? '...' : ''),
      hasChanges: newSourceCode !== ruleSourceCode.sourceCode,
      callerStack: new Error().stack?.split('\n')[1]?.trim()
    })
    
    // Update SSOT (automatically generates Python)
    console.log('🔥 [useRuleEditor] Calling ruleSourceCode.updateSourceCode...')
    ruleSourceCode.updateSourceCode(newSourceCode, 'monaco-editor')
    console.log('✅ [useRuleEditor] ruleSourceCode.updateSourceCode completed!')
    
    // Save draft (debounced)
    console.log('💾 [useRuleEditor] Calling draftPersistence.saveDraft...')
    draftPersistence.saveDraft(newSourceCode)
    console.log('✅ [useRuleEditor] draftPersistence.saveDraft completed!')
  }, [ruleId, ruleSourceCode, draftPersistence])

  // 🚀 CLEAN: Python sync handler
  const syncFromPython = useCallback((pythonCode: string) => {
    console.log('🐍 [useRuleEditorEnterprise] Syncing from Python:', {
      ruleId,
      pythonLength: pythonCode.length
    })
    
    // Update Python code in SSOT
    ruleSourceCode.updatePythonCode(pythonCode)
  }, [ruleId, ruleSourceCode])

  // 🚀 DRAFT RECOVERY: Check for recoverable draft on mount
  const hasRecoverableDraft = useMemo(() => {
    if (ruleQuery.isLoading) return false
    
    const draft = draftPersistence.loadDraft()
    if (!draft) return false
    
    // Compare with current source code
    const currentSource = ruleSourceCode.sourceCode
    return draft !== currentSource && draft.trim().length > 0
  }, [ruleQuery.isLoading, ruleSourceCode.sourceCode, draftPersistence])

  // 🚀 DRAFT RECOVERY: Apply recovered draft
  const recoverDraft = useCallback(() => {
    const draft = draftPersistence.loadDraft()
    if (draft) {
      console.log('🔄 [useRuleEditorEnterprise] Recovering draft:', {
        ruleId,
        draftLength: draft.length
      })
      
      ruleSourceCode.updateSourceCode(draft, 'draft-recovery')
      draftPersistence.clearDraft()
    }
  }, [ruleId, ruleSourceCode, draftPersistence])

  // 🚀 DRAFT RECOVERY: Discard draft
  const discardDraft = useCallback(() => {
    console.log('🗑️ [useRuleEditorEnterprise] Discarding draft:', { ruleId })
    draftPersistence.clearDraft()
  }, [ruleId, draftPersistence])

  // 🚀 REMOVED: Manual save - now handled by generic save system

  // 🚀 CLEANUP: Save on unmount
  // 🚀 CLEANUP: Removed excessive save-on-unmount that was causing re-renders
  // Tab switching saves are now handled by EditorLayout.handleTabChange
  // This prevents the constant unmount/remount cycle

  // 🏆 CLEAN: Focused return interface
  return {
    // 🎯 SSOT: All state comes from useSourceCodeState
    sourceCode: ruleSourceCode.sourceCode,
    pythonCode: ruleSourceCode.pythonCode,
    hasUnsavedChanges: ruleSourceCode.hasChanges,
    
    // 🎯 SERVER: Query state
    loading: ruleQuery.isLoading,
    error: ruleQuery.error,
    isReady: !ruleQuery.isLoading && !!ruleQuery.serverRule,
    
    // 🎯 ACTIONS: Clean, focused actions
    onSourceCodeChange,
    syncFromPython,
    
    // 🎯 DRAFTS: Draft recovery
    hasRecoverableDraft,
    recoverDraft,
    discardDraft,
    
    // 🎯 COMPUTED: Derived state
    generatedCode: ruleSourceCode.pythonCode, // Alias for compatibility
    rule: ruleQuery.serverRule, // Server rule data
    
    // 🎯 LEGACY: Properties for migration compatibility
    saving: false, // TODO: Add saving state from mutation if needed
    isDirtySinceServer: ruleSourceCode.hasChanges // Simple implementation for now
  }
}
