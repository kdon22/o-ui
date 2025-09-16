/**
 * 🏆 ENTERPRISE: Draft Persistence Hook - localStorage Only
 * 
 * Single responsibility: Handle draft persistence to localStorage
 * No complex logic, no refs, just clean draft management
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useSession } from 'next-auth/react'
import { useBranchContext } from '@/lib/context/branch-context'

export function useDraftPersistence(ruleId: string) {
  const { data: session } = useSession()
  const branchContext = useBranchContext()

  // 🚀 CLEAN: Generate draft key
  const draftKey = useMemo(() => {
    const tenantId = session?.user?.tenantId || 'anon'
    const branchId = branchContext?.currentBranchId || 'main'
    return `rule_draft_${tenantId}_${branchId}_${ruleId}`
  }, [session?.user?.tenantId, branchContext?.currentBranchId, ruleId])

  // 🚀 ENTERPRISE: Simple draft save (debounced)
  const saveDraft = useDebouncedCallback((sourceCode: string) => {
    if (!sourceCode.trim()) {
      // Don't save empty drafts
      return
    }
    
    try {
      const draftData = {
        sourceCode,
        timestamp: Date.now(),
        ruleId,
        tenantId: session?.user?.tenantId,
        branchId: branchContext?.currentBranchId
      }
      
      localStorage.setItem(draftKey, JSON.stringify(draftData))
      console.log('📝 [useDraftPersistence] Draft saved:', {
        draftKey,
        sourceCodeLength: sourceCode.length
      })
    } catch (error) {
      console.error('❌ [useDraftPersistence] Failed to save draft:', error)
    }
  }, 1000) // 1 second debounce

  // 🚀 CLEAN: Load draft
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(draftKey)
      if (!stored) return null

      const draftData = JSON.parse(stored)
      
      // Validate draft data
      if (!draftData.sourceCode || !draftData.timestamp) {
        return null
      }

      // Check if draft is recent (within 24 hours)
      const age = Date.now() - draftData.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (age > maxAge) {
        // Clean up old draft
        localStorage.removeItem(draftKey)
        return null
      }

      console.log('📖 [useDraftPersistence] Draft loaded:', {
        draftKey,
        sourceCodeLength: draftData.sourceCode.length,
        ageHours: Math.round(age / (60 * 60 * 1000))
      })

      return draftData.sourceCode
    } catch (error) {
      console.error('❌ [useDraftPersistence] Failed to load draft:', error)
      return null
    }
  }, [draftKey])

  // 🚀 CLEAN: Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
      console.log('🗑️ [useDraftPersistence] Draft cleared:', { draftKey })
    } catch (error) {
      console.error('❌ [useDraftPersistence] Failed to clear draft:', error)
    }
  }, [draftKey])

  // 🚀 CLEAN: Check if draft exists
  const hasDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(draftKey)
      return !!stored
    } catch {
      return false
    }
  }, [draftKey])

  return {
    // Actions
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft
  }
}
