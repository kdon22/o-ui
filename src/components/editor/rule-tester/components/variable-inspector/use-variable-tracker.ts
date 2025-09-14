import { useState, useCallback, useRef } from 'react'
import type { Variable } from '../../types'
import type { ValueHistory } from './types'
import { detectValueChange, createValueHistory } from './utils'

// 🎯 **VARIABLE TRACKER HOOK** - Easy integration for rule tester
export function useVariableTracker() {
  const [changeHistory, setChangeHistory] = useState<Map<string, ValueHistory>>(new Map())
  const previousVariablesRef = useRef<Variable[]>([])
  
  // Track variable changes and return enhanced variables
  const trackChanges = useCallback((currentVariables: Variable[]) => {
    const previousVars = previousVariablesRef.current
    const currentHistory = changeHistory
    const updatedHistory = new Map(currentHistory)
    
    // Detect changes between previous and current variables
    currentVariables.forEach(currentVar => {
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
      } else if (!previousVar && currentVar.value !== undefined) {
        // New variable added
        const newHistory = createValueHistory(
          currentVar.value,
          undefined,
          existingHistory
        )
        updatedHistory.set(currentVar.name, newHistory)
      }
    })
    
    // Update state and refs
    setChangeHistory(updatedHistory)
    previousVariablesRef.current = [...currentVariables]
    
    return updatedHistory
  }, [changeHistory])
  
  // Get change count for UI display
  const getChangeCount = useCallback(() => {
    return changeHistory.size
  }, [changeHistory])
  
  // Clear all change history (useful when starting new debug session)
  const clearHistory = useCallback(() => {
    setChangeHistory(new Map())
    previousVariablesRef.current = []
  }, [])
  
  // Get change summary for a specific variable
  const getVariableHistory = useCallback((variableName: string) => {
    return changeHistory.get(variableName)
  }, [changeHistory])
  
  return {
    trackChanges,
    changeHistory,
    getChangeCount,
    clearHistory,
    getVariableHistory
  }
}

// 🔥 **USAGE EXAMPLE**
/*
// In your rule tester component:
const { trackChanges, changeHistory, clearHistory } = useVariableTracker()

// When variables update during debugging:
useEffect(() => {
  if (debugState.variables) {
    trackChanges(debugState.variables)
  }
}, [debugState.variables, trackChanges])

// When starting new debug session:
const startDebugging = () => {
  clearHistory()
  // ... start debugging logic
}

// In your render:
<VariableInspector 
  variables={debugState.variables}
  onVariableChange={(variable, oldValue) => {
    console.log(`${variable.name} changed from`, oldValue, 'to', variable.value)
  }}
/>
*/