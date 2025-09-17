/**
 * 🏆 useRuleStudio - Integration Masterpiece
 * 
 * The coordination hook that bridges editor state with the generic save system.
 * This is the ONLY hook the UI components should use.
 * 
 * Architecture:
 * - useRuleEditor: Editor state + Monaco integration
 * - useEditorSave: Generic save system with all triggers
 * - useRuleStudio: Coordination bridge (THIS HOOK)
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRuleEditor } from '@/lib/editor/hooks/use-rule-editor'
import { useEditorSave, ruleCodeAdapter, ruleParametersAdapter } from '@/lib/editor/save'
import type { RuleStudioState, StudioOptions } from '../types'

export function useRuleStudio(
  ruleId: string, 
  options: StudioOptions = {}
): RuleStudioState {
  
  console.log('🚨🚨🚨 [useRuleStudio] COORDINATION HOOK CALLED! This is our new save system!')
  console.log('🏆 [useRuleStudio] Initializing coordination for rule:', ruleId)
  
  // 🎯 LAYER 1: Pure editor state (Zustand + Monaco integration)
  const editor = useRuleEditor(ruleId)
  
  // 🎯 LAYER 2: Generic save system (auto-save triggers + race prevention) 
  // 🚨 CRITICAL FIX: Memoize params to prevent infinite re-render loop
  const codeParams = useMemo(() => ({ 
    id: ruleId, 
    tab: 'rulecode' 
  }), [ruleId])
  
  const parametersParams = useMemo(() => ({
    id: ruleId,
    tab: 'parameters'
  }), [ruleId])
  
  const codeSave = useEditorSave(ruleCodeAdapter, codeParams)
  const parametersSave = useEditorSave(ruleParametersAdapter, parametersParams)
  
  console.log('🔍 [useRuleStudio] Save system status:', {
    ruleId,
    codeSaveLoading: codeSave.loading,
    codeSaveSaving: codeSave.saving,
    codeSaveIsDirty: codeSave.isDirty,
    codeSaveError: codeSave.error,
    hasCodeSave: !!codeSave.save,
    hasUpdateSnapshot: !!codeSave.updateSnapshot,
    hasSetLastSaved: !!codeSave.setLastSaved
  })

  // 🎯 LAYER 3: Enterprise coordination - The bridge between systems
  
  /**
   * Coordinated source code change handler
   * This is THE source code change function the UI should use
   */
  // 🚨 FIX: Create refs to avoid infinite re-render loop
  const codeSaveRef = useRef(codeSave)
  const editorRef = useRef(editor)
  
  // Keep refs current
  codeSaveRef.current = codeSave
  editorRef.current = editor
  
  const changeSourceCode = useCallback((newCode: string) => {
    console.log('🚨🚨🚨 [useRuleStudio] SOURCE CODE CHANGE DETECTED! This should trigger save system!')
    console.log('🔥🔥🔥 [useRuleStudio] changeSourceCode BRIDGE!', {
      ruleId,
      newLength: newCode.length,
      preview: newCode.substring(0, 100) + (newCode.length > 100 ? '...' : ''),
      fullValue: newCode.length < 200 ? newCode : 'TOO_LONG_TO_DISPLAY',
      currentPythonCode: editorRef.current.pythonCode || 'EMPTY',
      timestamp: new Date().toISOString()
    })
    
    console.log('🔥 [useRuleStudio] Step 1: Calling editor.onSourceCodeChange...')
    // 1. Update editor state (Zustand) - triggers Python generation
    editorRef.current.onSourceCodeChange(newCode)
    console.log('✅ [useRuleStudio] Step 1: editor.onSourceCodeChange completed')
    
    console.log('🔥 [useRuleStudio] Step 2: Calling codeSave.updateSnapshot...')
    // 2. Sync to save system snapshot - triggers all auto-save machinery
    codeSaveRef.current.updateSnapshot({ 
      sourceCode: newCode, 
      pythonCode: editorRef.current.pythonCode || ''
    })
    console.log('✅ [useRuleStudio] Step 2: codeSave.updateSnapshot completed')
    
    console.log('✅ [useRuleStudio] State coordination completed - SAVE SYSTEM SHOULD BE TRIGGERED!')
  }, [ruleId])

  /**
   * Manual save function - saves current state immediately
   */
  const save = useCallback(async (): Promise<boolean> => {
    console.log('🚨🚨🚨 [useRuleStudio] SAVE FUNCTION CALLED! This is our new unified save system!')
    console.log('💾 [useRuleStudio] Manual save initiated', {
      ruleId,
      sourceCodeLength: editorRef.current.sourceCode?.length || 0,
      pythonCodeLength: editorRef.current.pythonCode?.length || 0
    })
    
    // Update snapshot with latest state before saving
    console.log('🚨 [useRuleStudio] Updating save system snapshot before save...')
    codeSaveRef.current.updateSnapshot({
      sourceCode: editorRef.current.sourceCode,
      pythonCode: editorRef.current.pythonCode || ''
    })
    
    // Execute save through generic system
    console.log('🚨 [useRuleStudio] Calling generic save system...')
    const result = await codeSaveRef.current.save({
      sourceCode: editorRef.current.sourceCode,
      pythonCode: editorRef.current.pythonCode || ''
    })
    
    console.log('🚨 [useRuleStudio] Generic save system returned:', result)
    
    console.log('💾 [useRuleStudio] Save result:', result)
    return result
  }, [ruleId])

  /**
   * Save all tabs function
   */
  const saveAll = useCallback(async (): Promise<boolean> => {
    console.log('🔄 [useRuleStudio] Save all initiated', { ruleId })
    
    const results = await Promise.all([
      save(), // Code save
      // Parameters save would go here when needed
    ])
    
    const success = results.every(result => result === true)
    console.log('🔄 [useRuleStudio] Save all result:', success)
    return success
  }, [save, ruleId])

  // 🏆 CRITICAL: Initialize snapshot only (do NOT set baseline)
  // This preserves local-unsaved content as dirty until pushed to server
  const initializationRef = useRef(false)
  
  useEffect(() => {
    if (editor.sourceCode && editor.isReady && !initializationRef.current) {
      console.log('🔧 [useRuleStudio] Initializing save system with loaded state:', {
        ruleId,
        sourceCodeLength: editor.sourceCode.length,
        pythonCodeLength: editor.pythonCode?.length || 0
      })
      
      // Seed snapshot so the save system can compute hasChanges vs lastSaved (undefined → dirty)
      codeSave.updateSnapshot({
        sourceCode: editor.sourceCode,
        pythonCode: editor.pythonCode || ''
      })
      
      initializationRef.current = true
    }
  }, [editor.sourceCode, editor.pythonCode, editor.isReady, ruleId])

  // 🏆 ENTERPRISE: Derived state for UI consumption (STABILIZED)
  const studioState = useMemo((): RuleStudioState => {
    const state = {
      // Editor content
      sourceCode: editor.sourceCode || '',
      pythonCode: editor.pythonCode || '',
      
      // Loading states (combined) - handle undefined properly
      loading: Boolean(editor.loading) || Boolean(codeSave.loading) || false,
      saving: Boolean(codeSave.saving) || false,
      
      // Change tracking (combined)
      isDirty: Boolean(editor.hasUnsavedChanges) || Boolean(codeSave.isDirty),
      hasUnsavedChanges: Boolean(editor.hasUnsavedChanges) || Boolean(codeSave.isDirty),
      
      // Error handling (combined) - ensure Error type  
      error: editor.error || codeSave.error ? new Error(String(editor.error || codeSave.error)) : null,
      
      // Coordinated actions - THE ONLY ACTIONS UI SHOULD USE
      changeSourceCode,
      save,
      saveAll
    }
    
    return state
  }, [
    // 🚨 CRITICAL FIX: Use primitive values only to prevent re-render loops
    editor.sourceCode,
    editor.pythonCode, 
    Boolean(editor.loading),
    Boolean(editor.hasUnsavedChanges),
    Boolean(codeSave.loading),
    Boolean(codeSave.saving),
    Boolean(codeSave.isDirty),
    // Functions are stable from useCallback
    changeSourceCode,
    save,
    saveAll
  ])

  return studioState
}
