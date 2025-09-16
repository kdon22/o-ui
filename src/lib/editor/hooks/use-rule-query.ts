/**
 * 🏆 ENTERPRISE: Rule Query Hook - Server Data Fetching Only
 * 
 * Single responsibility: Fetch rule data from server and sync with SSOT
 * No local state, no refs, no complex logic - just clean data fetching
 */

import { useEffect } from 'react'
import { useActionQuery } from '@/hooks/use-action-api'
import { useRuleSourceCode } from '@/components/editor/services/source-code-state-manager'

export interface RuleQueryData {
  id: string
  name: string
  pythonName?: string
  sourceCode?: string
  pythonCode?: string
  branchId: string
  tenantId: string
  sourceMap?: any
  pythonCodeHash?: string
}

export function useRuleQuery(ruleId: string) {
  const ruleSourceCode = useRuleSourceCode(ruleId)
  
  // 🚀 CLEAN: Simple server data fetching using action system
  const { 
    data: ruleResponse, 
    isLoading, 
    error: queryError,
    refetch
  } = useActionQuery(
    'rule.read', 
    { id: ruleId },
    { enabled: !!ruleId && ruleId !== 'new' }
  )

  // 🚀 SSOT: Sync server data to global state (one-way only, preserve user edits)
  useEffect(() => {
    if (ruleResponse?.data && !isLoading) {
      const serverRule = ruleResponse.data as RuleQueryData
      
      console.log('🔄 [useRuleQuery] Syncing server data to SSOT:', {
        ruleId,
        serverSourceCode: serverRule.sourceCode,
        serverPythonCode: serverRule.pythonCode,
        sourceCodeLength: serverRule.sourceCode?.length || 0,
        currentSourceCode: ruleSourceCode.sourceCode,
        hasCurrentContent: !!ruleSourceCode.sourceCode
      })
      
      // 🚀 CRITICAL FIX: Only initialize if no current content exists
      // This prevents overwriting user's typed content
      if (!ruleSourceCode.sourceCode) {
        console.log('🚀 [useRuleQuery] Initializing SSOT with server data (no current content)')
        ruleSourceCode.initializeRule(
          serverRule.sourceCode || '',
          serverRule.pythonCode || ''
        )
      } else {
        console.log('🚀 [useRuleQuery] Preserving current content, not overwriting with server data')
      }
    }
  }, [ruleResponse?.data, isLoading, ruleId, ruleSourceCode])

  // 🚀 CLEAN: Simple error handling
  const error = queryError instanceof Error ? queryError.message : queryError

  return {
    // Server data (read-only)
    serverRule: ruleResponse?.data as RuleQueryData | null,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    refetch
  }
}
