/**
 * 🚀 RULE SAVE COORDINATOR - SSOT for All Rule Saving
 *
 * Single Source of Truth for all rule saving operations:
 * - Tab switching auto-save
 * - Close/refresh auto-save
 * - Manual saves
 * - Background saves
 *
 * Eliminates competing save systems and provides unified UX.
 */

import { getActionClient } from '@/lib/action-client'
import type { ActionRequest } from '@/lib/resource-system/schemas'

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
 * 🚀 RULE SAVE COORDINATOR
 *
 * SSOT for all rule saving - coordinates between all tabs and contexts
 */
export class RuleSaveCoordinator {
  private static instance: RuleSaveCoordinator
  private actionClient: any
  private lastSavedStates = new Map<string, RuleState>()
  private pendingSaves = new Map<string, Promise<any>>()

  constructor(tenantId: string) {
    this.actionClient = getActionClient(tenantId)
  }

  static getInstance(tenantId: string): RuleSaveCoordinator {
    if (!RuleSaveCoordinator.instance) {
      RuleSaveCoordinator.instance = new RuleSaveCoordinator(tenantId)
    }
    return RuleSaveCoordinator.instance
  }

  /**
   * 🚀 MAIN SAVE METHOD - SSOT Entry Point
   *
   * All rule saving goes through here
   */
  async saveRule(
    ruleId: string,
    ruleState: Partial<RuleState>,
    options: SaveOptions = { context: 'manual' }
  ): Promise<boolean> {
    try {
      // Prevent concurrent saves for the same rule
      const saveKey = `${ruleId}-${options.context}`
      if (this.pendingSaves.has(saveKey)) {
        console.log(`⏳ [RuleSaveCoordinator] Save already in progress for ${saveKey}`)
        return true // Consider it successful since a save is already running
      }

      // Skip if no changes and not forced
      if (options.skipIfClean && !this.hasChanges(ruleId, ruleState)) {
        console.log(`⏭️ [RuleSaveCoordinator] No changes detected, skipping save`)
        return true
      }

      // Create save promise
      const savePromise = this.performSave(ruleId, ruleState, options)
      this.pendingSaves.set(saveKey, savePromise)

      // Execute save
      const result = await savePromise

      // Update last saved state
      if (result) {
        this.lastSavedStates.set(ruleId, { ...ruleState, id: ruleId })
      }

      // Clean up
      this.pendingSaves.delete(saveKey)

      console.log(`✅ [RuleSaveCoordinator] Save successful: ${saveKey}`)
      return result

    } catch (error) {
      console.error(`❌ [RuleSaveCoordinator] Save failed:`, error)

      // Clean up on error
      this.pendingSaves.delete(`${ruleId}-${options.context}`)

      return false
    }
  }

  /**
   * 🚀 TAB SWITCH SAVE - Called when switching tabs
   */
  async saveOnTabSwitch(ruleId: string, ruleState: RuleState): Promise<boolean> {
    return this.saveRule(ruleId, ruleState, {
      context: 'tab-switch',
      skipIfClean: true
    })
  }

  /**
   * 🚀 CLOSE/REFRESH SAVE - Uses sendBeacon for reliability
   */
  async saveOnClose(ruleId: string, ruleState: RuleState): Promise<void> {
    try {
      const payload: ActionRequest = {
        action: 'rule.update',
        data: {
          id: ruleId,
          ...this.buildSafeUpdatePayload(ruleState)
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
   * 🚀 AUTO SAVE - Background periodic saves
   */
  async autoSave(ruleId: string, ruleState: RuleState): Promise<boolean> {
    return this.saveRule(ruleId, ruleState, {
      context: 'auto',
      skipIfClean: true
    })
  }

  /**
   * Check if rule state has changes compared to last saved
   */
  private hasChanges(ruleId: string, currentState: Partial<RuleState>): boolean {
    const lastSaved = this.lastSavedStates.get(ruleId)
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
   * Perform the actual save operation
   */
  private async performSave(
    ruleId: string,
    ruleState: Partial<RuleState>,
    options: SaveOptions
  ): Promise<boolean> {
    const payload = {
      id: ruleId,
      ...this.buildSafeUpdatePayload(ruleState)
    }

    const request: ActionRequest = {
      action: 'rule.update',
      data: payload
    }

    const result = await this.actionClient.executeAction(request)
    return result.success === true
  }

  /**
   * Build safe update payload (exclude relations, only scalar fields)
   */
  private buildSafeUpdatePayload(ruleState: Partial<RuleState>): any {
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

    return safe
  }

  /**
   * Update last saved state (call after successful save)
   */
  updateLastSavedState(ruleId: string, state: RuleState): void {
    this.lastSavedStates.set(ruleId, { ...state })
  }

  /**
   * Get last saved state for comparison
   */
  getLastSavedState(ruleId: string): RuleState | undefined {
    return this.lastSavedStates.get(ruleId)
  }

  /**
   * Clear saved state (e.g., when rule is deleted)
   */
  clearSavedState(ruleId: string): void {
    this.lastSavedStates.delete(ruleId)
  }
}

/**
 * 🚀 HOOK: Use Rule Save Coordinator
 *
 * Provides unified save interface for React components
 */
import { useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useRuleSaveCoordinator() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenantId || 'default'

  const coordinator = RuleSaveCoordinator.getInstance(tenantId)

  const saveRule = useCallback(async (
    ruleId: string,
    ruleState: Partial<RuleState>,
    options?: Partial<SaveOptions>
  ) => {
    return coordinator.saveRule(ruleId, ruleState, {
      context: 'manual',
      skipIfClean: false,
      ...options
    })
  }, [coordinator])

  const saveOnTabSwitch = useCallback(async (ruleId: string, ruleState: RuleState) => {
    return coordinator.saveOnTabSwitch(ruleId, ruleState)
  }, [coordinator])

  const saveOnClose = useCallback(async (ruleId: string, ruleState: RuleState) => {
    return coordinator.saveOnClose(ruleId, ruleState)
  }, [coordinator])

  const autoSave = useCallback(async (ruleId: string, ruleState: RuleState) => {
    return coordinator.autoSave(ruleId, ruleState)
  }, [coordinator])

  return {
    saveRule,
    saveOnTabSwitch,
    saveOnClose,
    autoSave,
    getLastSavedState: (ruleId: string) => coordinator.getLastSavedState(ruleId),
    updateLastSavedState: (ruleId: string, state: RuleState) => coordinator.updateLastSavedState(ruleId, state)
  }
}
