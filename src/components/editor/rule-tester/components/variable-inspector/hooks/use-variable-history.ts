import { useEffect, useRef, useMemo } from 'react'
import type { Variable } from '../../../types'
import type { EnhancedVariable, ValueHistory } from '../types'
import { buildVariableTree } from '../tree-builder'
import { 
  detectValueChange, 
  createValueHistory,
  isRecentChange 
} from '../utils'

interface UseVariableHistoryProps {
  variables: Variable[]
  maxDepth: number
  onVariableChange?: (current: Variable, previousValue?: any) => void
}

export function useVariableHistory({ 
  variables, 
  maxDepth, 
  onVariableChange 
}: UseVariableHistoryProps) {
  const previousVariablesRef = useRef<Variable[]>([])
  const variableHistoryRef = useRef<Map<string, ValueHistory>>(new Map())

  // Real-time change detection and value history tracking
  useEffect(() => {
    const previousVars = previousVariablesRef.current
    const currentHistory = variableHistoryRef.current
    
    // Detect changes between previous and current variables
    const updatedHistory = new Map(currentHistory)
    
    variables.forEach(currentVar => {
      const previousVar = previousVars.find(v => v.name === currentVar.name)
      const existingHistory = currentHistory.get(currentVar.name)
      
      if (previousVar && detectValueChange(currentVar.value, previousVar.value)) {
        // Variable changed - create/update history
        const newHistory = createValueHistory(
          currentVar.value,
          previousVar.value,
          existingHistory
        )
        updatedHistory.set(currentVar.name, newHistory)
        
        // Trigger change callback
        onVariableChange?.(currentVar, previousVar.value)
      } else if (!previousVar && currentVar.value !== undefined) {
        // New variable added
        const newHistory = createValueHistory(
          currentVar.value,
          undefined,
          existingHistory
        )
        updatedHistory.set(currentVar.name, newHistory)
        onVariableChange?.(currentVar, undefined)
      }
    })
    
    // Update refs
    variableHistoryRef.current = updatedHistory
    previousVariablesRef.current = [...variables]
  }, [variables, onVariableChange])

  // Build enhanced variable tree with change history
  const enhancedVariables = useMemo(() => {
    const baseVariables = buildVariableTree(variables, maxDepth)
    const history = variableHistoryRef.current
    
    // Enhance variables with change history
    return baseVariables.map(variable => ({
      ...variable,
      valueHistory: history.get(variable.name),
      isRecentlyChanged: history.get(variable.name) ? 
        isRecentChange(history.get(variable.name)!.changedAt) : false,
      changeType: history.get(variable.name)?.changeType
    }))
  }, [variables, maxDepth])

  const changedCount = variables.filter(v => 
    (v as any).changed || (v as any).previousValue !== undefined
  ).length

  return {
    enhancedVariables,
    changedCount,
    variableHistory: variableHistoryRef.current
  }
}