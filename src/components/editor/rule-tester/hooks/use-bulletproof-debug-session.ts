"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  BusinessRulesParser,
  BusinessRulesDebugAdapter,
  DebugSession,
  ExecutionState,
  Variable,
  Breakpoint
} from '../services/business-rules-debugger'

// 🎯 **BULLETPROOF DEBUG HOOK** - Clean, predictable, testable
export function useBulletproofDebugSession(businessRulesText: string, ruleType: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' = 'BUSINESS'): DebugSession {
  // State (minimal, focused)
  const [executionState, setExecutionState] = useState<ExecutionState>({ status: 'stopped' })
  const [variables, setVariables] = useState<Variable[]>([])
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([])
  
  // Services (stable references)
  const parser = useRef(new BusinessRulesParser())
  const debugAdapter = useRef(new BusinessRulesDebugAdapter(parser.current))
  
  // Load UTR mock data for testing
  const loadUTRMockData = useCallback(async () => {
    try {
      // Load Amadeus mock data from schemas
      const amadeusUTR = await import('../../../../../../schemas/utr/normalized/amadeus-utr-full.json')
      console.log('✅ [UTR] Loaded mock data for bulletproof debug:', {
        recordLocator: amadeusUTR.pnrHeader?.recordLocator,
        passengerCount: amadeusUTR.passengers?.length || 0,
        segmentCount: amadeusUTR.segments?.length || 0
      })
      return amadeusUTR.default || amadeusUTR
    } catch (error) {
      console.warn('⚠️ [UTR] Failed to load mock data:', error)
      return null
    }
  }, [])
  
  // Initialize debug adapter with current business rules
  useEffect(() => {
    // Update the debug adapter with current business rules text
    debugAdapter.current.setBusinessRules(businessRulesText)
    
    // Listen for state changes from debug adapter (only set once)
    if (debugAdapter.current) {
      debugAdapter.current.onStateChanged((newState) => {
    
        setExecutionState(newState)
        setVariables(debugAdapter.current.getVariables())
        setBreakpoints(debugAdapter.current.getBreakpoints())
      })
    }
  }, [businessRulesText])
  
  // Actions (stable callbacks)
  const start = useCallback(async () => {
    try {
  
      
      // Load UTR data for BUSINESS rules only
      const utrData = ruleType === 'BUSINESS' ? await loadUTRMockData() : undefined
      debugAdapter.current.setUTRData(utrData, ruleType)
      
      // Start execution (parsing and validation handled in debug adapter)
      const state = await debugAdapter.current.start()
      // State will be updated via onStateChanged callback
      
    } catch (error) {
      console.error('❌ [Debug] Failed to start:', error)
      setExecutionState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [businessRulesText, ruleType, loadUTRMockData])
  
  const step = useCallback(async () => {
    try {
      if (executionState.status !== 'paused') {
        console.warn('⚠️ [Debug] Cannot step: not in paused state')
        return
      }
      
      const state = await debugAdapter.current.step()
      // State will be updated via onStateChanged callback
      
    } catch (error) {
      console.error('❌ [Debug] Failed to step:', error)
      setExecutionState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [executionState.status])
  
  const continue_ = useCallback(async () => {
    try {
      if (executionState.status !== 'paused') {
        console.warn('⚠️ [Debug] Cannot continue: not in paused state')
        return
      }
      
      const state = await debugAdapter.current.continue()
      // State will be updated via onStateChanged callback
      
    } catch (error) {
      console.error('❌ [Debug] Failed to continue:', error)
      setExecutionState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [executionState.status])
  
  const stop = useCallback(async () => {
    try {
      const state = await debugAdapter.current.stop()
      // State will be updated via onStateChanged callback
      
    } catch (error) {
      console.error('❌ [Debug] Failed to stop:', error)
    }
  }, [])
  
  const setBreakpoint = useCallback(async (line: number) => {
    try {
      await debugAdapter.current.setBreakpoint(line)
      setBreakpoints(debugAdapter.current.getBreakpoints())
      
    } catch (error) {
      console.error('❌ [Debug] Failed to set breakpoint:', error)
    }
  }, [])
  
  const removeBreakpoint = useCallback(async (line: number) => {
    try {
      await debugAdapter.current.removeBreakpoint(line)
      setBreakpoints(debugAdapter.current.getBreakpoints())
      
    } catch (error) {
      console.error('❌ [Debug] Failed to remove breakpoint:', error)
    }
  }, [])
  
  // Return clean, stable interface
  return {
    state: executionState,
    variables,
    breakpoints,
    start,
    step,
    continue: continue_, // 'continue' is a reserved word
    stop,
    setBreakpoint,
    removeBreakpoint
  }
}

// 🎯 **USAGE EXAMPLE**
/*
function DebugComponent({ businessRules }: { businessRules: string }) {
  const debug = useBulletproofDebugSession(businessRules)
  
  return (
    <div>
      <div>Status: {debug.state.status}</div>
      
      <button onClick={debug.start} disabled={debug.state.status !== 'stopped'}>
        Start Debug
      </button>
      
      <button onClick={debug.step} disabled={debug.state.status !== 'paused'}>
        Step Over
      </button>
      
      <button onClick={debug.continue} disabled={debug.state.status !== 'paused'}>
        Continue
      </button>
      
      <button onClick={debug.stop} disabled={debug.state.status === 'stopped'}>
        Stop
      </button>
      
      <div>
        Variables:
        {debug.variables.map(v => (
          <div key={v.name}>{v.name}: {String(v.value)}</div>
        ))}
      </div>
    </div>
  )
}
*/