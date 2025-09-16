/**
 * 🚀 ENTERPRISE SOURCE CODE STATE MANAGER
 * 
 * Single Source of Truth for source code across all editor tabs.
 * Ensures Monaco editor, Debug tab, and all other tabs have synchronized state.
 * 
 * CRITICAL: This prevents the bug where different tabs save different source code.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Import Python generation function
const translateBusinessRulesToPython = async (code: string) => {
  const { translateBusinessRulesToPython: translate } = await import('@/lib/editor/python-generation')
  return translate(code, { generateComments: true, strictMode: false })
}

export interface SourceCodeState {
  // Current source code for each rule
  sourceCode: Record<string, string>
  
  // Python code for each rule (generated from source code)
  pythonCode: Record<string, string>
  
  // Track which tab last modified the source code
  lastModifiedBy: Record<string, string>
  
  // Track if source code has unsaved changes
  hasUnsavedChanges: Record<string, boolean>
  
  // Track last saved source code to detect changes
  lastSavedSourceCode: Record<string, string>
}

export interface SourceCodeActions {
  // Update source code from any tab (with automatic Python generation)
  updateSourceCode: (ruleId: string, sourceCode: string, modifiedBy: string) => Promise<void>
  
  // Update Python code (usually generated)
  updatePythonCode: (ruleId: string, pythonCode: string) => void
  
  // Update source code without Python generation (for cases where Python is provided separately)
  updateSourceCodeOnly: (ruleId: string, sourceCode: string, modifiedBy: string) => void
  
  // Mark as saved (clears unsaved changes flag)
  markAsSaved: (ruleId: string, savedSourceCode: string) => void
  
  // Get current source code for a rule
  getSourceCode: (ruleId: string) => string
  
  // Get current Python code for a rule
  getPythonCode: (ruleId: string) => string
  
  // Check if rule has unsaved changes
  hasChanges: (ruleId: string) => boolean
  
  // Initialize rule state
  initializeRule: (ruleId: string, initialSourceCode: string, initialPythonCode?: string) => void
  
  // Clear rule state (when rule is closed)
  clearRule: (ruleId: string) => void
  
  // Get all current state for saving
  getRuleState: (ruleId: string) => { sourceCode: string; pythonCode: string; hasChanges: boolean }
}

export const useSourceCodeState = create<SourceCodeState & SourceCodeActions>()(
  subscribeWithSelector((set, get) => ({
    // State
    sourceCode: {},
    pythonCode: {},
    lastModifiedBy: {},
    hasUnsavedChanges: {},
    lastSavedSourceCode: {},
    
    // Actions
    updateSourceCode: async (ruleId: string, sourceCode: string, modifiedBy: string) => {
      console.log('📝 [SourceCodeStateManager] Updating source code with auto Python generation:', {
        ruleId,
        sourceCodeLength: sourceCode.length,
        modifiedBy,
        timestamp: new Date().toISOString()
      })
      
      // Update source code immediately
      set((state) => {
        const lastSaved = state.lastSavedSourceCode[ruleId] || ''
        const hasChanges = sourceCode !== lastSaved
        
        return {
          sourceCode: { ...state.sourceCode, [ruleId]: sourceCode },
          lastModifiedBy: { ...state.lastModifiedBy, [ruleId]: modifiedBy },
          hasUnsavedChanges: { ...state.hasUnsavedChanges, [ruleId]: hasChanges }
        }
      })
      
      // 🚀 ENTERPRISE: Auto-generate Python code
      try {
        if (sourceCode.trim()) {
          console.log('🐍 [SourceCodeStateManager] Auto-generating Python code...')
          const result = await translateBusinessRulesToPython(sourceCode)
          if (result.success) {
            console.log('✅ [SourceCodeStateManager] Python generation successful')
            set((state) => ({
              pythonCode: { ...state.pythonCode, [ruleId]: result.pythonCode }
            }))
          } else {
            console.log('⚠️ [SourceCodeStateManager] Python generation with errors')
            const errorComments = result.errors?.map(error => `# ERROR: ${error}`).join('\n') || ''
            const errorOutput = (result.pythonCode || '') + '\n' + errorComments
            set((state) => ({
              pythonCode: { ...state.pythonCode, [ruleId]: errorOutput }
            }))
          }
        } else {
          // Clear Python code when source code is empty
          console.log('🧹 [SourceCodeStateManager] Clearing Python code - no source code')
          set((state) => ({
            pythonCode: { ...state.pythonCode, [ruleId]: '' }
          }))
        }
      } catch (error) {
        console.error('❌ [SourceCodeStateManager] Python generation failed:', error)
        const errorOutput = `# Python generation failed: ${error instanceof Error ? error.message : String(error)}`
        set((state) => ({
          pythonCode: { ...state.pythonCode, [ruleId]: errorOutput }
        }))
      }
    },
    
    updateSourceCodeOnly: (ruleId: string, sourceCode: string, modifiedBy: string) => {
      console.log('📝 [SourceCodeStateManager] Updating source code only (no Python generation):', {
        ruleId,
        sourceCodeLength: sourceCode.length,
        modifiedBy,
        timestamp: new Date().toISOString()
      })
      
      set((state) => {
        const lastSaved = state.lastSavedSourceCode[ruleId] || ''
        const hasChanges = sourceCode !== lastSaved
        
        return {
          sourceCode: { ...state.sourceCode, [ruleId]: sourceCode },
          lastModifiedBy: { ...state.lastModifiedBy, [ruleId]: modifiedBy },
          hasUnsavedChanges: { ...state.hasUnsavedChanges, [ruleId]: hasChanges }
        }
      })
    },
    
    updatePythonCode: (ruleId: string, pythonCode: string) => {
      console.log('🐍 [SourceCodeStateManager] Updating Python code:', {
        ruleId,
        pythonCodeLength: pythonCode.length,
        timestamp: new Date().toISOString()
      })
      
      set((state) => ({
        pythonCode: { ...state.pythonCode, [ruleId]: pythonCode }
      }))
    },
    
    markAsSaved: (ruleId: string, savedSourceCode: string) => {
      console.log('✅ [SourceCodeStateManager] Marking as saved:', {
        ruleId,
        savedSourceCodeLength: savedSourceCode.length,
        timestamp: new Date().toISOString()
      })
      
      set((state) => ({
        hasUnsavedChanges: { ...state.hasUnsavedChanges, [ruleId]: false },
        lastSavedSourceCode: { ...state.lastSavedSourceCode, [ruleId]: savedSourceCode }
      }))
    },
    
    getSourceCode: (ruleId: string) => {
      return get().sourceCode[ruleId] || ''
    },
    
    getPythonCode: (ruleId: string) => {
      return get().pythonCode[ruleId] || ''
    },
    
    hasChanges: (ruleId: string) => {
      return get().hasUnsavedChanges[ruleId] || false
    },
    
    initializeRule: (ruleId: string, initialSourceCode: string, initialPythonCode = '') => {
      console.log('🚀 [SourceCodeStateManager] Initializing rule:', {
        ruleId,
        initialSourceCodeLength: initialSourceCode.length,
        initialPythonCodeLength: initialPythonCode.length,
        timestamp: new Date().toISOString()
      })
      
      set((state) => ({
        sourceCode: { ...state.sourceCode, [ruleId]: initialSourceCode },
        pythonCode: { ...state.pythonCode, [ruleId]: initialPythonCode },
        lastSavedSourceCode: { ...state.lastSavedSourceCode, [ruleId]: initialSourceCode },
        hasUnsavedChanges: { ...state.hasUnsavedChanges, [ruleId]: false },
        lastModifiedBy: { ...state.lastModifiedBy, [ruleId]: 'initialization' }
      }))
    },
    
    clearRule: (ruleId: string) => {
      console.log('🗑️ [SourceCodeStateManager] Clearing rule state:', { ruleId })
      
      set((state) => {
        const newState = { ...state }
        delete newState.sourceCode[ruleId]
        delete newState.pythonCode[ruleId]
        delete newState.lastModifiedBy[ruleId]
        delete newState.hasUnsavedChanges[ruleId]
        delete newState.lastSavedSourceCode[ruleId]
        return newState
      })
    },
    
    getRuleState: (ruleId: string) => {
      const state = get()
      return {
        sourceCode: state.sourceCode[ruleId] || '',
        pythonCode: state.pythonCode[ruleId] || '',
        hasChanges: state.hasUnsavedChanges[ruleId] || false
      }
    }
  }))
)

/**
 * 🚀 ENTERPRISE HOOK: Use Source Code State for a specific rule
 * 
 * Provides a clean interface for components to interact with source code state
 */
export function useRuleSourceCode(ruleId: string) {
  const sourceCode = useSourceCodeState((state) => state.sourceCode[ruleId] || '')
  const pythonCode = useSourceCodeState((state) => state.pythonCode[ruleId] || '')
  const hasChanges = useSourceCodeState((state) => state.hasUnsavedChanges[ruleId] || false)
  const lastModifiedBy = useSourceCodeState((state) => state.lastModifiedBy[ruleId] || '')
  
  const updateSourceCode = useSourceCodeState((state) => state.updateSourceCode)
  const updatePythonCode = useSourceCodeState((state) => state.updatePythonCode)
  const markAsSaved = useSourceCodeState((state) => state.markAsSaved)
  const initializeRule = useSourceCodeState((state) => state.initializeRule)
  const clearRule = useSourceCodeState((state) => state.clearRule)
  const getRuleState = useSourceCodeState((state) => state.getRuleState)
  
  return {
    // Current state
    sourceCode,
    pythonCode,
    hasChanges,
    lastModifiedBy,
    
    // Actions
    updateSourceCode: (newSourceCode: string, modifiedBy: string) => 
      updateSourceCode(ruleId, newSourceCode, modifiedBy),
    updateSourceCodeOnly: (newSourceCode: string, modifiedBy: string) => 
      updateSourceCodeOnly(ruleId, newSourceCode, modifiedBy),
    updatePythonCode: (newPythonCode: string) => 
      updatePythonCode(ruleId, newPythonCode),
    markAsSaved: (savedSourceCode: string) => 
      markAsSaved(ruleId, savedSourceCode),
    initializeRule: (initialSourceCode: string, initialPythonCode?: string) => 
      initializeRule(ruleId, initialSourceCode, initialPythonCode),
    clearRule: () => clearRule(ruleId),
    getRuleState: () => getRuleState(ruleId)
  }
}

/**
 * 🚀 ENTERPRISE HOOK: Subscribe to source code changes
 * 
 * Allows components to react to source code changes from other tabs
 */
export function useSourceCodeSubscription(ruleId: string, callback: (sourceCode: string) => void) {
  return useSourceCodeState.subscribe(
    (state) => state.sourceCode[ruleId],
    callback
  )
}
