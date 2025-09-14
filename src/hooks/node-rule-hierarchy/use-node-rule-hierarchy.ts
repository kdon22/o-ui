/**
 * Node Rule Hierarchy Hook V2 - Hybrid Inheritance System
 * 
 * Clean replacement for the old calculation-based system.
 * Uses the new hybrid inheritance engine for extreme performance and reliability.
 */

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useReadyBranchContext } from '@/lib/context/branch-context'
import { useNodeInheritance, type BranchContext } from '@/lib/inheritance'

// ============================================================================
// HOOK OPTIONS AND RETURN TYPES
// ============================================================================

export interface UseNodeRuleHierarchyOptions {
  nodeId: string
  branchId?: string
  includeInherited?: boolean
  includeIgnored?: boolean
}

export interface UseNodeRuleHierarchyResult {
  /** Process names for FilterTabBar Level 2 */
  processNames: Array<{
    id: string
    name: string
    count: number
    type: string
    sourceNodeId: string
    inheritanceLevel: number
    isInherited: boolean
  }>
  
  /** Enhanced rules with inheritance metadata */
  rules: Array<{
    id: string
    name: string
    type: string
    processId: string
    processName: string
    processType: string
    sourceNodeId: string
    sourceNodeName: string
    inheritanceLevel: number
    isInherited: boolean
    isIgnored: boolean
    order?: number
    displayClass: 'direct' | 'inherited' | 'ignored'
    textColor?: 'red' | 'blue' | undefined
  }>
  
  /** Process types for FilterTabBar Level 1 */
  processTypes: Array<{
    id: string
    name: string
    count: number
    processIds: string[]
  }>
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error: string | null
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Main hook for node rule hierarchy with hybrid inheritance
 */
export function useNodeRuleHierarchy(
  options: UseNodeRuleHierarchyOptions | string
): UseNodeRuleHierarchyResult {
  
  // Handle both new object syntax and legacy string syntax
  const { nodeId, branchId, includeInherited, includeIgnored } = typeof options === 'string' 
    ? { nodeId: options, branchId: undefined, includeInherited: undefined, includeIgnored: undefined }
    : options

  console.log('🚀 [NodeRuleHierarchyV2] Hook called with:', {
    nodeId,
    branchId,
    includeInherited,
    includeIgnored,
    timestamp: new Date().toISOString()
  })

  // Get branch context from SSOT
  const ssotBranchContext = useReadyBranchContext()
  const { data: session, status } = useSession()
  
  console.log('🔍 [NodeRuleHierarchyV2] Session state:', {
    status,
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    sessionTenantId: session?.user?.tenantId,
    sessionBranchId: ssotBranchContext.currentBranchId,
    sessionDefaultBranchId: ssotBranchContext.defaultBranchId,
    nodeId,
    branchId,
    timestamp: new Date().toISOString()
  })
  
  // Create branch context only when session is available
  const branchContext: BranchContext | null = useMemo(() => {
    console.log('🔄 [NodeRuleHierarchyV2] Creating branch context:', {
      sessionStatus: status,
      hasSession: !!session,
      tenantId: session?.user?.tenantId,
      timestamp: new Date().toISOString()
    })

    // Don't create branch context until session is loaded
    if (status === 'loading' || !session?.user?.tenantId) {
      console.log('🚫 [NodeRuleHierarchyV2] Session not ready, returning null context:', {
        status,
        hasTenantId: !!session?.user?.tenantId,
        reason: status === 'loading' ? 'session_loading' : 'no_tenant_id'
      })
      return null
    }
    
    // Use SSOT branch context instead of manual session parsing
    const context = {
      currentBranchId: branchId || ssotBranchContext.currentBranchId,
      defaultBranchId: ssotBranchContext.defaultBranchId,
      tenantId: ssotBranchContext.tenantId,
      userId: ssotBranchContext.userId
    }
    
    console.log('✅ [NodeRuleHierarchyV2] Branch context created:', {
      context,
      willEnableInheritanceQuery: true,
      timestamp: new Date().toISOString()
    })
    
    return context
  }, [session, branchId, status])

  // Fetch inheritance data using the new hybrid system - only when session is ready
  const inheritanceQuery = useNodeInheritance(nodeId, branchContext)

  // Process the inheritance data for the hook interface
  const processedData = useMemo(() => {
    console.log('🔄 [NodeRuleHierarchyV2] Processing inheritance data:', {
      isLoading: inheritanceQuery.isLoading,
      hasError: !!inheritanceQuery.error,
      hasData: !!inheritanceQuery.data,
      hasBranchContext: !!branchContext,
      sessionStatus: status,
      timestamp: new Date().toISOString()
    })

    // Return empty data if session isn't ready or no branch context
    if (!branchContext || inheritanceQuery.isLoading || inheritanceQuery.error || !inheritanceQuery.data) {
      return {
        processNames: [],
        rules: [],
        processTypes: [],
        error: !branchContext ? 'Session not ready' : (inheritanceQuery.error?.message || null)
      }
    }

    const inheritanceData = inheritanceQuery.data

    // Apply optional filters to rules
    let filteredRules = inheritanceData.availableRules

    // 🚨 AGGRESSIVE DEBUG: See what we're starting with
    console.log('🔥 [NodeRuleHierarchyV2] RULE FILTERING DEBUG:', {
      totalAvailableRules: inheritanceData.availableRules.length,
      includeInherited,
      includeIgnored,
      availableRulesPreview: inheritanceData.availableRules.slice(0, 5).map(rule => ({
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        isInherited: rule.isInherited,
        isIgnored: rule.isIgnored,
        branchId: rule.branchId || 'no-branch',
        sourceNodeId: rule.sourceNodeId
      })),
      timestamp: new Date().toISOString()
    });

    // Apply includeInherited filter
    if (includeInherited === false) {
      const beforeFilter = filteredRules.length;
      filteredRules = filteredRules.filter(rule => !rule.isInherited)
      console.log('🔍 [NodeRuleHierarchyV2] Filtered out inherited rules:', {
        before: beforeFilter,
        after: filteredRules.length,
        removed: beforeFilter - filteredRules.length
      });
    }

    // Apply includeIgnored filter
    if (includeIgnored === false) {
      const beforeFilter = filteredRules.length;
      filteredRules = filteredRules.filter(rule => !rule.isIgnored)
      console.log('🔍 [NodeRuleHierarchyV2] Filtered out ignored rules:', {
        before: beforeFilter,
        after: filteredRules.length,
        removed: beforeFilter - filteredRules.length
      });
    }

    // 🚨 CRITICAL DEBUG: Show final filtered rules
    console.log('🔥 [NodeRuleHierarchyV2] FINAL FILTERED RULES:', {
      finalCount: filteredRules.length,
      finalRulesPreview: filteredRules.slice(0, 5).map(rule => ({
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        isInherited: rule.isInherited,
        isIgnored: rule.isIgnored,
        branchId: rule.branchId || 'no-branch'
      })),
      timestamp: new Date().toISOString()
    });

    console.log('✅ [NodeRuleHierarchyV2] Data processed successfully:', {
      processNamesCount: inheritanceData.processNames.length,
      rulesCount: filteredRules.length,
      processTypesCount: inheritanceData.processTypes.length,
      inheritedProcesses: inheritanceData.processNames.filter(p => p.isInherited).length,
      inheritedRules: filteredRules.filter(r => r.isInherited).length,
      ignoredRules: filteredRules.filter(r => r.isIgnored).length
    })

    // Map InheritedRule objects to the expected interface format
    const mappedRules = filteredRules.map(rule => ({
      id: rule.ruleId,
      name: rule.ruleName,
      type: rule.ruleType,
      processId: rule.processId,
      processName: rule.processName,
      processType: rule.processType,
      sourceNodeId: rule.sourceNodeId,
      sourceNodeName: rule.sourceNodeName,
      inheritanceLevel: rule.inheritanceLevel,
      isInherited: rule.isInherited,
      isIgnored: rule.isIgnored,
      order: rule.order,
      displayClass: rule.displayClass,
      textColor: rule.textColor
    }))

    return {
      processNames: inheritanceData.processNames,
      rules: mappedRules,
      processTypes: inheritanceData.processTypes,
      error: null
    }

  }, [inheritanceQuery.data, inheritanceQuery.isLoading, inheritanceQuery.error, includeInherited, includeIgnored, branchContext, status])

  // Final result
  const result: UseNodeRuleHierarchyResult = {
    processNames: processedData.processNames,
    rules: processedData.rules,
    processTypes: processedData.processTypes,
    isLoading: inheritanceQuery.isLoading,
    error: processedData.error
  }

  console.log('🎯 [NodeRuleHierarchyV2] Final result:', {
    processNamesCount: result.processNames.length,
    rulesCount: result.rules.length,
    processTypesCount: result.processTypes.length,
    isLoading: result.isLoading,
    error: result.error,
    // Log inheritance breakdown
    inheritanceBreakdown: {
      directProcesses: result.processNames.filter(p => !p.isInherited).length,
      inheritedProcesses: result.processNames.filter(p => p.isInherited).length,
      directRules: result.rules.filter(r => !r.isInherited && !r.isIgnored).length,
      inheritedRules: result.rules.filter(r => r.isInherited && !r.isIgnored).length,
      ignoredRules: result.rules.filter(r => r.isIgnored).length
    }
  })

  return result
}

// ============================================================================
// OPTIMIZED HOOK VARIANT
// ============================================================================

/**
 * Optimized hook for performance-critical scenarios
 */
export function useNodeRuleHierarchyOptimized(
  options: UseNodeRuleHierarchyOptions | string
): UseNodeRuleHierarchyResult {
  // The hybrid cache system already provides extreme optimization
  // This hook is identical to the main one, but could be enhanced
  // with additional optimizations like longer stale times
  return useNodeRuleHierarchy(options)
}

// ============================================================================
// REFRESH HOOK
// ============================================================================

/**
 * Hook for refreshing node rule hierarchy data
 */
export function useRefreshNodeRuleHierarchy(nodeId: string) {
  const refreshData = useMemo(() => {
    return async () => {
      // TODO: Implement refresh logic that invalidates the inheritance cache
      console.log('🔄 [NodeRuleHierarchyV2] Refreshing data for:', nodeId)
      
      // This will be implemented when we integrate with the cache invalidation system
    }
  }, [nodeId])

  return refreshData
}