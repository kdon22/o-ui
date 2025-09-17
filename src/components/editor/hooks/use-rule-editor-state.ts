/**
 * 🚀 SIMPLIFIED RULE EDITOR STATE
 * 
 * Clean, simple state management for rule editing that preserves
 * all Monaco/schema functionality while removing complex dependencies.
 */

import { useState, useCallback, useEffect } from 'react'
import { useActionQuery } from '@/hooks/use-action-api'
import { translateBusinessRulesToPython } from '@/lib/editor/python-generation'
import { useEditorSave } from '@/lib/editor/save/use-editor-save'
import { ruleCodeAdapter } from '@/lib/editor/save/adapters/rule-code.adapter'

export interface UseRuleEditorStateProps {
  ruleId: string
  // autoSave and autoSaveDelay removed - generic save system handles all automatic triggers
}

export interface RuleEditorState {
  // Current values
  sourceCode: string
  pythonCode: string
  
  // State flags
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  
  // Actions - NO MANUAL SAVE, only automatic triggers
  updateSourceCode: (code: string) => void
  updatePythonCode: (code: string) => void
  
  // Rule data
  rule: any
}

/**
 * 🚀 SIMPLIFIED RULE EDITOR STATE HOOK
 * 
 * Provides clean state management without complex Zustand dependencies
 */
export function useRuleEditorState({ 
  ruleId
}: UseRuleEditorStateProps): RuleEditorState {
  
  // Local state
  const [sourceCode, setSourceCode] = useState('')
  const [pythonCode, setPythonCode] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedSourceCode, setLastSavedSourceCode] = useState('')
  
  // Data fetching
  const { data: ruleResponse, isLoading } = useActionQuery('rule.read', { id: ruleId })
  const rule = ruleResponse?.data
  
  // 🏆 GENERIC SAVE SYSTEM: Use unified save system with rule code adapter
  console.log('🔧 [useRuleEditorState] Setting up useEditorSave...', {
    ruleId,
    adapterName: ruleCodeAdapter.actionName,
    tabKey: `rule:${ruleId}:rule-code`
  })
  
  const { 
    isDirty: isEditorDirty,
    updateSnapshot 
  } = useEditorSave(ruleCodeAdapter, { id: ruleId, tab: 'rule-code' })
  
  console.log('✅ [useRuleEditorState] useEditorSave initialized', {
    ruleId,
    isEditorDirty,
    hasUpdateSnapshot: typeof updateSnapshot === 'function'
  })
  
  // Initialize from loaded rule
  useEffect(() => {
    console.log('🏁 [useRuleEditorState] Initialization effect running...', {
      ruleId,
      hasRule: !!rule,
      ruleFromServer: rule?.id,
      isDirty,
      shouldInitialize: !!(rule && !isDirty),
      timestamp: new Date().toISOString()
    })
    
    if (rule && !isDirty) {
      const initialSourceCode = rule.sourceCode || ''
      const initialPythonCode = rule.pythonCode || ''
      
      console.log('🔧 [useRuleEditorState] Initializing rule data...', {
        ruleId,
        ruleName: rule.name,
        initialSourceCodeLength: initialSourceCode.length,
        initialPythonCodeLength: initialPythonCode.length,
        sourcePreview: initialSourceCode.substring(0, 100) + '...',
      })
      
      setSourceCode(initialSourceCode)
      setPythonCode(initialPythonCode)
      setLastSavedSourceCode(initialSourceCode)
      setIsDirty(false)
      
      console.log('✅ [useRuleEditorState] Rule initialization complete!')
    }
  }, [ruleId, rule, isDirty])
  
  // Auto-save is handled by the generic save system automatically via updateSnapshot
  // No manual auto-save logic needed - the unified system handles all triggers
  
  // Update source code with Python generation
  const updateSourceCode = useCallback(async (newSourceCode: string) => {
    console.log('🔥🔥🔥 [useRuleEditorState] updateSourceCode CALLED!', {
      ruleId,
      newLength: newSourceCode.length,
      oldLength: sourceCode.length,
      preview: newSourceCode.substring(0, 100) + '...',
      lastSavedLength: lastSavedSourceCode.length,
      hasChanges: newSourceCode !== lastSavedSourceCode,
      callerStack: new Error().stack?.split('\n')[1]?.trim(),
      timestamp: new Date().toISOString()
    })
    
    setSourceCode(newSourceCode)
    const hasChanges = newSourceCode !== lastSavedSourceCode
    setIsDirty(hasChanges)
    
    console.log('🔥 [useRuleEditorState] State updated, starting Python generation...', {
      ruleId,
      hasChanges,
      isDirty: hasChanges
    })
    
    // Auto-generate Python code
    try {
      const result = await translateBusinessRulesToPython(newSourceCode)
      const generatedPython = result.pythonCode // Extract pythonCode from result
      setPythonCode(generatedPython)
      
      console.log('🐍 [useRuleEditorState] Python generated, calling updateSnapshot...', {
        ruleId,
        pythonLength: generatedPython.length,
        snapshot: { sourceCode: newSourceCode, pythonCode: generatedPython }
      })
      
      // Update the generic save system snapshot
      updateSnapshot({ sourceCode: newSourceCode, pythonCode: generatedPython })
      
      console.log('✅ [useRuleEditorState] updateSnapshot called successfully!')
      
    } catch (error) {
      console.error('❌ [useRuleEditorState] Python generation failed:', error)
      const errorPython = `# Python generation failed\n# ${error}`
      setPythonCode(errorPython)
      
      console.log('🔥 [useRuleEditorState] Calling updateSnapshot with error state...', {
        ruleId,
        snapshot: { sourceCode: newSourceCode, pythonCode: errorPython }
      })
      
      // Update snapshot with error state
      updateSnapshot({ sourceCode: newSourceCode, pythonCode: errorPython })
    }
  }, [ruleId, sourceCode.length, lastSavedSourceCode, updateSnapshot])
  
  // Update Python code directly (for Python tab editing)
  const updatePythonCode = useCallback((newPythonCode: string) => {
    console.log('🐍🔥 [useRuleEditorState] updatePythonCode CALLED!', {
      ruleId,
      newPythonLength: newPythonCode.length,
      oldPythonLength: pythonCode.length,
      sourceCodeLength: sourceCode.length,
      callerStack: new Error().stack?.split('\n')[1]?.trim(),
      timestamp: new Date().toISOString()
    })
    
    setPythonCode(newPythonCode)
    // Note: We don't set isDirty for Python-only changes
    // Python is typically generated, not manually edited
    
    console.log('🐍 [useRuleEditorState] Calling updateSnapshot with Python-only change...', {
      ruleId,
      snapshot: { sourceCode, pythonCode: newPythonCode }
    })
    
    // Update the generic save system snapshot
    updateSnapshot({ sourceCode, pythonCode: newPythonCode })
  }, [ruleId, sourceCode, pythonCode.length, updateSnapshot])
  
  // No manual save functions - all saves are handled automatically by the generic save system
  
  const combinedIsDirty = isDirty || isEditorDirty
  
  // DEBUG: Log state on every render
  console.log('🔄 [useRuleEditorState] Current state:', {
    ruleId,
    ruleName: rule?.name,
    sourceCodeLength: sourceCode.length,
    pythonCodeLength: pythonCode.length,
    localIsDirty: isDirty,
    editorIsDirty: isEditorDirty,
    combinedIsDirty,
    isSaving,
    isLoading,
    hasRule: !!rule,
    sourcePreview: sourceCode.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  })
  
  return {
    // Current values
    sourceCode,
    pythonCode,
    
    // State flags
    isDirty: combinedIsDirty, // Combine local and editor dirty states
    isSaving,
    isLoading,
    
    // Actions - NO MANUAL SAVE, only automatic triggers
    updateSourceCode,
    updatePythonCode,
    
    // Rule data
    rule
  }
}
