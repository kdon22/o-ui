/**
 * 🏆 useTabManagement - Tab Switching Hook
 * 
 * Handles tab switching with auto-save functionality.
 * Integrates with the generic save system's auto-save triggers.
 */

import { useState, useCallback } from 'react'
// Inline store to avoid visible UI/state; kept internal to editor
import { create } from 'zustand'
const useRuleTabStore = create<{ activeByRuleId: Record<string, TabId>; set: (ruleId: string, tab: TabId) => void; get: (ruleId: string) => TabId | undefined }>((set, get) => ({
  activeByRuleId: {},
  set: (ruleId, tab) => set((state) => ({ activeByRuleId: { ...state.activeByRuleId, [ruleId]: tab } })),
  get: (ruleId) => get().activeByRuleId[ruleId]
}))
import type { TabId } from '../types'
// Temporary debug
const dbg = (...args: any[]) => console.log('🔄 [useTabManagement]', ...args)
import { DEFAULT_TAB } from '../constants'

interface TabManagementOptions {
  defaultTab?: TabId
  onTabSwitch?: (fromTab: TabId, toTab: TabId) => Promise<boolean>
  onBeforeTabSwitch?: (fromTab: TabId, toTab: TabId) => boolean
  ruleId?: string
}

export function useTabManagement(options: TabManagementOptions = {}) {
  const {
    defaultTab = DEFAULT_TAB,
    onTabSwitch,
    onBeforeTabSwitch,
    ruleId: ruleIdProp
  } = options
  
  // Prefer explicit ruleId; fallback to path parsing
  const ruleId = ruleIdProp || (typeof window !== 'undefined' ? (window.location.pathname.split('/').pop() || '') : '')
  const initialTab = (ruleId ? useRuleTabStore.getState().get(ruleId) : undefined) || defaultTab

  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  dbg('Init', { ruleId, initialTab, defaultTab })
  const [switching, setSwitching] = useState(false)
  
  /**
   * Switch to a new tab with auto-save coordination
   */
  const switchTab = useCallback(async (newTab: TabId): Promise<boolean> => {
    if (newTab === activeTab) return true
    
    dbg('Tab switch requested', {
      from: activeTab,
      to: newTab,
      ruleId,
      hasOnTabSwitch: !!onTabSwitch,
      hasOnBeforeTabSwitch: !!onBeforeTabSwitch
    })
    
    // Allow parent to prevent tab switch
    if (onBeforeTabSwitch && !onBeforeTabSwitch(activeTab, newTab)) {
      dbg('Tab switch prevented by parent')
      return false
    }
    
    setSwitching(true)
    
    try {
      // Auto-save current tab before switching (if handler provided)
      if (onTabSwitch) {
        const saveStart = Date.now()
        const saveSuccess = await onTabSwitch(activeTab, newTab)
        const saveMs = Date.now() - saveStart
        dbg('Tab switch save completed', { saveSuccess, durationMs: saveMs })
        if (!saveSuccess) {
          dbg('Tab switch save failed, proceeding anyway')
        }
      }
      
      // Switch to new tab and persist internally
      dbg('Setting active tab', { from: activeTab, to: newTab })
      setActiveTab(newTab)
      if (ruleId) {
        dbg('Persisting tab to store', { ruleId, tab: newTab })
        useRuleTabStore.getState().set(ruleId, newTab)
      }
      dbg('Tab switched successfully', newTab)
      return true
      
    } catch (error) {
      dbg('Tab switch failed', error)
      return false
    } finally {
      setSwitching(false)
    }
  }, [activeTab, onTabSwitch, onBeforeTabSwitch])
  
  /**
   * Force tab switch without save (for emergency scenarios)
   */
  const forceSwitch = useCallback((newTab: TabId) => {
    console.log('🚨 [useTabManagement] Force tab switch:', { from: activeTab, to: newTab })
    setActiveTab(newTab)
  }, [activeTab])
  
  return {
    activeTab,
    switching,
    switchTab,
    forceSwitch
  }
}
