/**
 * 🏆 ENTERPRISE: Rule Mutation Hook - Save Operations Only
 * 
 * Single responsibility: Handle rule saves using action system
 * Reads from SSOT, saves to server, updates SSOT on success
 */

import { useCallback } from 'react'
import { useRuleSaveCoordinator } from '@/components/editor/services/rule-save-coordinator'
import { useRuleSourceCode } from '@/components/editor/services/source-code-state-manager'

export interface SaveOptions {
  context?: 'manual' | 'tab-switch' | 'close' | 'auto'
  skipIfClean?: boolean
}

export function useRuleMutation(ruleId: string) {
  const { saveRule: saveRuleCoordinator, saveOnClose } = useRuleSaveCoordinator()
  const ruleSourceCode = useRuleSourceCode(ruleId)

  // 🚀 ENTERPRISE: Clean save operation using SSOT
  const saveRule = useCallback(async (options: SaveOptions = {}) => {
    try {
      console.log('💾 [useRuleMutation] Save initiated:', {
        ruleId,
        context: options.context || 'manual',
        skipIfClean: options.skipIfClean
      })

      // Get current state from SSOT
      const currentState = ruleSourceCode.getRuleState()
      
      // Skip if clean and requested
      if (options.skipIfClean && !currentState.hasChanges) {
        console.log('⏭️ [useRuleMutation] Skipping save - no changes')
        return true
      }

      // Build rule state for save coordinator
      const ruleState = {
        id: ruleId,
        sourceCode: currentState.sourceCode,
        pythonCode: currentState.pythonCode
      }

      // Use save coordinator for actual save
      const success = await saveRuleCoordinator(ruleId, ruleState, options)
      
      if (success) {
        // Mark as saved in SSOT
        ruleSourceCode.markAsSaved(currentState.sourceCode)
        console.log('✅ [useRuleMutation] Save successful')
      }
      
      return success
    } catch (error) {
      console.error('❌ [useRuleMutation] Save failed:', error)
      return false
    }
  }, [ruleId, saveRuleCoordinator, ruleSourceCode])

  // 🚀 ENTERPRISE: Clean close save operation
  const saveOnCloseRule = useCallback(async () => {
    try {
      const currentState = ruleSourceCode.getRuleState()
      
      if (!currentState.hasChanges) {
        console.log('⏭️ [useRuleMutation] Skipping close save - no changes')
        return
      }

      const ruleState = {
        id: ruleId,
        sourceCode: currentState.sourceCode,
        pythonCode: currentState.pythonCode
      }

      await saveOnClose(ruleId, ruleState)
      console.log('✅ [useRuleMutation] Close save completed')
    } catch (error) {
      console.error('❌ [useRuleMutation] Close save failed:', error)
    }
  }, [ruleId, saveOnClose, ruleSourceCode])

  return {
    // Actions
    saveRule,
    saveOnClose: saveOnCloseRule
  }
}
