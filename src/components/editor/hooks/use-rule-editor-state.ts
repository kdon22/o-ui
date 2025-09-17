/**
 * 🚀 SIMPLIFIED RULE EDITOR STATE
 * 
 * Clean, simple state management for rule editing that preserves
 * all Monaco/schema functionality while removing complex dependencies.
 */

import { useState, useCallback, useEffect } from 'react'
import { useActionQuery } from '@/hooks/use-action-api'
import { useRuleSaveCoordinator } from '../services/rule-save-coordinator'
import { translateBusinessRulesToPython } from '@/lib/editor/python-generation'

export interface UseRuleEditorStateProps {
  ruleId: string
  autoSave?: boolean
  autoSaveDelay?: number
}

export interface RuleEditorState {
  // Current values
  sourceCode: string
  pythonCode: string
  
  // State flags
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  
  // Actions
  updateSourceCode: (code: string) => void
  updatePythonCode: (code: string) => void
  save: () => Promise<boolean>
  
  // Rule data
  rule: any
}

/**
 * 🚀 SIMPLIFIED RULE EDITOR STATE HOOK
 * 
 * Provides clean state management without complex Zustand dependencies
 */
export function useRuleEditorState({ 
  ruleId, 
  autoSave = true, 
  autoSaveDelay = 2000 
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
  
  // Save coordinator
  const { saveRule } = useRuleSaveCoordinator()
  
  // Initialize from loaded rule
  useEffect(() => {
    if (rule && !isDirty) {
      const initialSourceCode = rule.sourceCode || ''
      const initialPythonCode = rule.pythonCode || ''
      
      setSourceCode(initialSourceCode)
      setPythonCode(initialPythonCode)
      setLastSavedSourceCode(initialSourceCode)
      setIsDirty(false)
    }
  }, [rule, isDirty])
  
  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !isDirty || isSaving) return
    
    const timeoutId = setTimeout(async () => {
      await handleSave('auto')
    }, autoSaveDelay)
    
    return () => clearTimeout(timeoutId)
  }, [sourceCode, isDirty, autoSave, autoSaveDelay, isSaving])
  
  // Update source code with Python generation
  const updateSourceCode = useCallback(async (newSourceCode: string) => {
    setSourceCode(newSourceCode)
    setIsDirty(newSourceCode !== lastSavedSourceCode)
    
    // Auto-generate Python code
    try {
      const generatedPython = await translateBusinessRulesToPython(newSourceCode)
      setPythonCode(generatedPython)
    } catch (error) {
      console.warn('Python generation failed:', error)
      setPythonCode(`# Python generation failed\n# ${error}`)
    }
  }, [lastSavedSourceCode])
  
  // Update Python code directly (for Python tab editing)
  const updatePythonCode = useCallback((newPythonCode: string) => {
    setPythonCode(newPythonCode)
    // Note: We don't set isDirty for Python-only changes
    // Python is typically generated, not manually edited
  }, [])
  
  // Save function
  const handleSave = useCallback(async (context: 'manual' | 'auto' = 'manual'): Promise<boolean> => {
    if (isSaving) return false
    
    setIsSaving(true)
    try {
      const success = await saveRule(ruleId, {
        sourceCode,
        pythonCode
      }, { 
        context,
        skipIfClean: context === 'auto'
      })
      
      if (success) {
        setLastSavedSourceCode(sourceCode)
        setIsDirty(false)
      }
      
      return success
    } catch (error) {
      console.error('Save failed:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [ruleId, sourceCode, pythonCode, isSaving, saveRule])
  
  const save = useCallback(() => handleSave('manual'), [handleSave])
  
  return {
    // Current values
    sourceCode,
    pythonCode,
    
    // State flags
    isDirty,
    isSaving,
    isLoading,
    
    // Actions
    updateSourceCode,
    updatePythonCode,
    save,
    
    // Rule data
    rule
  }
}
