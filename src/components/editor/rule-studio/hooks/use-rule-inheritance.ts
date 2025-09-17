/**
 * 🏆 useRuleInheritance - Inheritance Detection Hook
 * 
 * Determines if a rule is inherited and should be read-only in the current context.
 * Clean separation of inheritance logic from main editor state.
 */

import { useMemo } from 'react'
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context'
import { useNodeRuleHierarchy } from '@/hooks/node-rule-hierarchy/use-node-rule-hierarchy'
import type { InheritanceInfo } from '../types'

export function useRuleInheritance(ruleId: string): InheritanceInfo & { loading: boolean } {
  
  // Get navigation context to determine current node
  const navigationContext = useAutoNavigationContext()
  
  // Get node rule hierarchy to check inheritance
  const inheritanceResult = useNodeRuleHierarchy(
    navigationContext?.nodeId || '' // Only check if we have a node context
  )
  
  const inheritanceData = (inheritanceResult as any)?.data
  const loading = (inheritanceResult as any)?.isLoading || false
  
  // Calculate inheritance info
  const inheritanceInfo = useMemo((): InheritanceInfo => {
    // Default to not inherited if we don't have the necessary data
    if (!ruleId || !navigationContext?.nodeId || !inheritanceData) {
      return {
        isInherited: false,
        isReadOnly: false
      }
    }
    
    // Find this rule in the inheritance data
    const inheritedRule = inheritanceData.rules?.find((r: any) => r.ruleId === ruleId)
    
    if (!inheritedRule) {
      return {
        isInherited: false,
        isReadOnly: false
      }
    }
    
    // A rule is read-only if it's inherited from a PARENT node
    // If isInherited is false, the rule belongs to this node and should be editable
    const isInherited = inheritedRule.isInherited || false
    
    console.log('🔍 [useRuleInheritance] Inheritance analysis:', {
      ruleId,
      nodeId: navigationContext.nodeId,
      foundInHierarchy: true,
      isInherited,
      shouldBeReadOnly: isInherited,
      inheritanceLevel: inheritedRule.inheritanceLevel,
      sourceNodeName: inheritedRule.sourceNodeName,
      displayClass: inheritedRule.displayClass
    })
    
    return {
      isInherited,
      isReadOnly: isInherited, // Only inherited rules are read-only
      sourceNodeName: inheritedRule.sourceNodeName,
      inheritanceLevel: inheritedRule.inheritanceLevel
    }
  }, [ruleId, navigationContext?.nodeId, inheritanceData])
  
  return {
    ...inheritanceInfo,
    loading
  }
}
