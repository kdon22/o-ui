/**
 * 🚀 RULE SAVE COORDINATOR - SSOT for All Rule Saving
 *
 * Single Source of Truth for all rule saving operations:
 * - Tab switching auto-save
 * - Close/refresh auto-save
 * - Manual saves
 * - Background saves
 *
 * Uses proper action-system hooks for cache invalidation and error handling.
 */

import { useActionMutation } from '@/hooks/use-action-api'
import { useSourceCodeState } from './source-code-state-manager'

// Types for different save contexts
export type SaveContext = 'tab-switch' | 'close' | 'refresh' | 'manual' | 'auto'

export interface SaveOptions {
  context: SaveContext
  skipIfClean?: boolean
  force?: boolean
}

export interface RuleState {
  id: string
  sourceCode?: string
  pythonCode?: string
  name?: string
  description?: string
  type?: string
  isActive?: boolean
  schema?: any
  documentation?: string
  examples?: string
  notes?: string
  changelog?: string
}

/**
 * 🚀 RULE SAVE COORDINATOR - Hook-Based Implementation
 *
 * SSOT for all rule saving using proper action-system patterns
 */

// Global state for tracking saves across components
const lastSavedStates = new Map<string, RuleState>()
const pendingSaves = new Map<string, Promise<any>>()

/**
 * Helper functions for rule save operations
 */

/**
 * Check if rule state has changes compared to last saved
 */
function hasChanges(ruleId: string, currentState: Partial<RuleState>): boolean {
  const lastSaved = lastSavedStates.get(ruleId)
  if (!lastSaved) return true // No previous save, so there are changes

  // Compare key fields
  const fieldsToCheck: (keyof RuleState)[] = [
    'sourceCode', 'name', 'description', 'type', 'isActive',
    'documentation', 'examples', 'notes', 'schema'
  ]

  return fieldsToCheck.some(field => {
    const current = currentState[field]
    const saved = lastSaved[field]

    // Handle undefined/null comparisons
    if (current == null && saved == null) return false
    if (current == null || saved == null) return true

    return current !== saved
  })
}

/**
 * Build safe update payload (exclude relations, only scalar fields)
 */
function buildSafeUpdatePayload(ruleState: Partial<RuleState>): any {
  const safe: any = {}

  // Core rule fields
  if (ruleState.id) safe.id = ruleState.id
  if (ruleState.name !== undefined) safe.name = ruleState.name
  if (ruleState.sourceCode !== undefined) safe.sourceCode = ruleState.sourceCode
  if (ruleState.pythonCode !== undefined) safe.pythonCode = ruleState.pythonCode
  if (ruleState.description !== undefined) safe.description = ruleState.description
  if (ruleState.type !== undefined) safe.type = ruleState.type
  if (ruleState.isActive !== undefined) safe.isActive = ruleState.isActive

  // Documentation fields
  if (ruleState.documentation !== undefined) safe.documentation = ruleState.documentation
  if (ruleState.examples !== undefined) safe.examples = ruleState.examples
  if (ruleState.notes !== undefined) safe.notes = ruleState.notes
  if (ruleState.changelog !== undefined) safe.changelog = ruleState.changelog

  // Schema for utility rules
  if (ruleState.schema !== undefined) safe.schema = ruleState.schema

  console.log('🔍 [RuleSaveCoordinator] Building save payload:', {
    inputRuleState: ruleState,
    outputSafe: safe,
    hasSourceCode: safe.sourceCode !== undefined,
    sourceCodeValue: safe.sourceCode,
    sourceCodeLength: safe.sourceCode?.length || 0
  })

  return safe
}

/**
 * Close/refresh save using sendBeacon for reliability
 */
async function saveOnClose(ruleId: string, ruleState: RuleState): Promise<void> {
  try {
    const payload = {
      action: 'rule.update',
      data: {
        id: ruleId,
        ...buildSafeUpdatePayload(ruleState)
      }
    }

    const body = JSON.stringify(payload)
    const endpoint = '/api/workspaces/current/actions'

    // Use sendBeacon for reliable delivery during page unload
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      const sent = navigator.sendBeacon(endpoint, blob)
      if (sent) {
        console.log('📡 [RuleSaveCoordinator] SendBeacon save initiated for close')
      }
    }

    // Fallback to fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'include'
      }).catch(() => {}) // Fire-and-forget
    }

  } catch (error) {
    console.error('❌ [RuleSaveCoordinator] Close save failed:', error)
  }
}

/**
 * 🚀 HOOK: Use Rule Save Coordinator
 *
 * Provides unified save interface using proper action-system patterns
 */
import { useCallback } from 'react'

export function useRuleSaveCoordinator() {
  // 🚀 FIXED: Use proper action-system hook with automatic cache invalidation
  const updateRuleMutation = useActionMutation('rule.update')
  
  // 🚀 ENTERPRISE FIX: Get access to source code state properly
  const getSourceCode = useSourceCodeState((state) => state.getSourceCode)
  const getPythonCode = useSourceCodeState((state) => state.getPythonCode)
  const markAsSaved = useSourceCodeState((state) => state.markAsSaved)

  const saveRule = useCallback(async (
    ruleId: string,
    ruleState: Partial<RuleState>,
    options?: Partial<SaveOptions>
  ): Promise<boolean> => {
    try {
      console.log('🔍 [useRuleSaveCoordinator] Save request with unified state:', {
        ruleId,
        context: options?.context || 'manual',
        hasSourceCode: ruleState.sourceCode !== undefined,
        sourceCodeValue: ruleState.sourceCode,
        sourceCodeLength: ruleState.sourceCode?.length || 0,
        skipIfClean: options?.skipIfClean,
        timestamp: new Date().toISOString()
      })

      // 🚀 ENTERPRISE FIX: Get the LATEST source code from unified state
      const latestSourceCode = getSourceCode(ruleId)
      const latestPythonCode = getPythonCode(ruleId)
      
      // 🚀 CRITICAL: Use the latest source code from the state manager, not the passed state
      const enhancedRuleState = {
        ...ruleState,
        ...(latestSourceCode ? { sourceCode: latestSourceCode } : {}),
        ...(latestPythonCode ? { pythonCode: latestPythonCode } : {})
      }

      // Prevent concurrent saves for the same rule
      const saveKey = `${ruleId}-${options?.context || 'manual'}`
      if (pendingSaves.has(saveKey)) {
        console.log(`⏳ [RuleSaveCoordinator] Save already in progress for ${saveKey}`)
        return true // Consider it successful since a save is already running
      }

      // Skip if no changes and not forced
      if (options?.skipIfClean && !hasChanges(ruleId, enhancedRuleState)) {
        console.log(`⏭️ [RuleSaveCoordinator] No changes detected, skipping save`)
        return true
      }

      // Build payload
      const payload = {
        id: ruleId,
        ...buildSafeUpdatePayload(enhancedRuleState)
      }

      console.log('🔍 [RuleSaveCoordinator] Executing action request:', {
        action: 'rule.update',
        payload,
        ruleId,
        context: options?.context || 'manual'
      })

      // Create save promise using proper action-system hook
      const savePromise = updateRuleMutation.mutateAsync(payload)
      pendingSaves.set(saveKey, savePromise)

      // Execute save - this will automatically handle cache invalidation
      const result = await savePromise

      console.log('🔍 [RuleSaveCoordinator] Action result:', {
        success: result.success,
        hasData: !!result.data,
        resultKeys: result.data ? Object.keys(result.data) : [],
        ruleId,
        savedSourceCode: result.data?.sourceCode,
        savedSourceCodeLength: result.data?.sourceCode?.length || 0,
        originalPayloadSourceCode: payload.sourceCode,
        sourceCodeMatches: result.data?.sourceCode === payload.sourceCode
      })

      // Update last saved state
      if (result.success) {
        // 🚀 ENTERPRISE: Mark as saved in unified state
        if (enhancedRuleState.sourceCode) {
          markAsSaved(ruleId, enhancedRuleState.sourceCode)
        }
        
        lastSavedStates.set(ruleId, { ...enhancedRuleState, id: ruleId })
      }

      // Clean up
      pendingSaves.delete(saveKey)

      console.log(`✅ [RuleSaveCoordinator] Save successful: ${saveKey}`)
      return result.success === true

    } catch (error) {
      console.error(`❌ [RuleSaveCoordinator] Save failed:`, error)

      // Clean up on error
      pendingSaves.delete(`${ruleId}-${options?.context || 'manual'}`)

      return false
    }
  }, [updateRuleMutation, getSourceCode, getPythonCode, markAsSaved])

  const saveOnTabSwitch = useCallback(async (ruleId: string, ruleState: RuleState): Promise<boolean> => {
    return saveRule(ruleId, ruleState, {
      context: 'tab-switch',
      skipIfClean: true
    })
  }, [saveRule])

  const saveOnCloseCallback = useCallback(async (ruleId: string, ruleState: RuleState): Promise<void> => {
    return saveOnClose(ruleId, ruleState)
  }, [])

  const autoSave = useCallback(async (ruleId: string, ruleState: RuleState): Promise<boolean> => {
    return saveRule(ruleId, ruleState, {
      context: 'auto',
      skipIfClean: true
    })
  }, [saveRule])

  return {
    saveRule,
    saveOnTabSwitch,
    saveOnClose: saveOnCloseCallback,
    autoSave,
    getLastSavedState: (ruleId: string) => lastSavedStates.get(ruleId),
    updateLastSavedState: (ruleId: string, state: RuleState) => lastSavedStates.set(ruleId, { ...state })
  }
}
