/**
 * Smart Stepping Hook - React hook for business logic debugging
 * 
 * Provides smart stepping functionality that focuses on business logic
 * rather than Python implementation details.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  BusinessStep,
  BusinessBlockMap,
  SmartDebugSession,
  SmartDebugControls,
  SmartSteppingResponse
} from '@/lib/editor/execution-mapping/types'
import { smartSteppingExecutor } from '@/lib/editor/execution-mapping/smart-executor'
import { stepByStepExecutor, type StepExecutionState } from '@/lib/debug/step-by-step-executor'
import { runtimeSourceMapGenerator } from '@/lib/debug/runtime-source-map'

// =============================================================================
// SMART STEPPING HOOK
// =============================================================================

export function useSmartStepping(): SmartDebugSession & SmartDebugControls {
  // Core state - Updated for step-by-step execution
  const [businessSteps, setBusinessSteps] = useState<BusinessStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [executionStartTime, setExecutionStartTime] = useState<number | undefined>()
  const [executionEndTime, setExecutionEndTime] = useState<number | undefined>()
  
  // Step-by-step execution state
  const [currentExecutionState, setCurrentExecutionState] = useState<StepExecutionState | null>(null)
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set())
  const [useStepByStep, setUseStepByStep] = useState(true) // Enable new system by default
  
  // Execution context
  const [blockBreakpoints, setBlockBreakpoints] = useState<Set<string>>(new Set())
  const executionRef = useRef<{
    businessRules?: string
    pythonCode?: string
    blockMap?: BusinessBlockMap
    runtimeSourceMap?: any
  }>({})
  
  // Computed state - Updated for step-by-step
  const canStepForward = useStepByStep 
    ? (currentExecutionState?.canStepForward && !isRunning)
    : (currentStepIndex < businessSteps.length - 1 && !isRunning)
  const canStepBackward = currentStepIndex > 0 && !isRunning
  const canContinue = useStepByStep 
    ? (breakpoints.size > 0 && !isCompleted && !isRunning)
    : false
  const currentStep = currentStepIndex >= 0 ? businessSteps[currentStepIndex] : undefined
  
  // Breakpoint management
  const setBreakpointsWrapper = useCallback((newBreakpoints: Set<number>) => {
    setBreakpoints(newBreakpoints)
  }, [])
  
  /**
   * Start smart stepping execution
   */
  const start = useCallback(async (
    businessRules: string,
    pythonCode: string,
    blockMap: BusinessBlockMap | null
  ) => {
    console.log('🚀 [useSmartStepping] Starting smart stepping execution:', {
      useStepByStep,
      businessRulesLength: businessRules.length,
      pythonCodeLength: pythonCode.length
    })
    
    // Reset state
    setBusinessSteps([])
    setCurrentStepIndex(-1)
    setCurrentExecutionState(null)
    setIsRunning(true)
    setIsPaused(false)
    setIsCompleted(false)
    setHasError(false)
    setError(undefined)
    setExecutionStartTime(Date.now())
    setExecutionEndTime(undefined)
    
    try {
      if (useStepByStep) {
        // 🚀 NEW STEP-BY-STEP SYSTEM
        console.log('🚀 [useSmartStepping] Using new step-by-step execution system')
        
        // Generate runtime source map
        const runtimeSourceMap = await runtimeSourceMapGenerator.generateForDebugging(
          pythonCode,
          businessRules,
          { enableCaching: false }
        )
        
        // Store execution context
        executionRef.current = { businessRules, pythonCode, blockMap, runtimeSourceMap }
        
        // Initialize step-by-step executor
        await stepByStepExecutor.initialize(pythonCode, businessRules, runtimeSourceMap)
        
        // Set breakpoints if any
        if (breakpoints.size > 0) {
          stepByStepExecutor.setBreakpoints(Array.from(breakpoints))
        }
        
        // Execute first step
        const firstStepResult = await stepByStepExecutor.stepForward()
        
        if (firstStepResult.success) {
          setCurrentExecutionState(firstStepResult.state)
          setCurrentStepIndex(0)
          setIsPaused(true)
          setIsRunning(false)
          
          // Convert step-by-step state to business step format for UI compatibility
          const businessStep: BusinessStep = {
            stepId: `step_${firstStepResult.state.currentLine}`,
            line: firstStepResult.state.businessLine,
            pythonLine: firstStepResult.state.currentLine,
            variables: firstStepResult.state.variables,
            output: firstStepResult.state.output || '',
            blockType: 'statement',
            description: `Line ${firstStepResult.state.businessLine}`,
            isBreakpoint: false,
            executionTime: 0
          }
          
          setBusinessSteps([businessStep])
          
          console.log('✅ [useSmartStepping] Step-by-step execution started:', {
            currentLine: firstStepResult.state.currentLine,
            businessLine: firstStepResult.state.businessLine,
            variableCount: Object.keys(firstStepResult.state.variables).length,
            businessStep
          })
        } else {
          throw new Error(firstStepResult.error || 'Step-by-step execution failed')
        }
        
      } else {
        // 🔄 LEGACY SYSTEM (fallback)
        console.log('🔄 [useSmartStepping] Using legacy smart stepping system')
        
        // Store execution context
        executionRef.current = { businessRules, pythonCode, blockMap }
        
        // Execute smart stepping
        const result: SmartSteppingResponse = await smartSteppingExecutor.executeBusinessSteps(
          businessRules,
          pythonCode,
          blockMap || {} as BusinessBlockMap,
          {
            blockBreakpoints: Array.from(blockBreakpoints),
            executionMode: 'step-by-step'
          }
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Smart stepping execution failed')
        }
        
        console.log('✅ [useSmartStepping] Legacy execution completed:', {
          businessStepsCount: result.businessSteps.length,
          executedBlocks: result.executedBlocks,
          totalBlocks: result.totalBlocks
        })
        
        // Update state with results
        setBusinessSteps(result.businessSteps)
        setCurrentStepIndex(0) // Start at first step
        setIsRunning(false)
        setIsPaused(true) // Pause at first step for user to examine
        setIsCompleted(result.businessSteps.length === 0)
        setExecutionEndTime(Date.now())
      }
      
    } catch (err) {
      console.error('❌ [useSmartStepping] Execution failed:', err)
      
      setIsRunning(false)
      setHasError(true)
      setError(err instanceof Error ? err.message : String(err))
      setExecutionEndTime(Date.now())
    }
  }, [blockBreakpoints, breakpoints, useStepByStep])
  
  /**
   * Step forward to next business step
   */
  const stepForward = useCallback(async () => {
    if (!canStepForward) return
    
    console.log('👉 [useSmartStepping] Step forward requested:', {
      useStepByStep,
      currentStepIndex,
      canStepForward
    })
    
    if (useStepByStep) {
      // 🚀 NEW STEP-BY-STEP SYSTEM
      try {
        setIsRunning(true)
        
        const stepResult = await stepByStepExecutor.stepForward()
        
        if (stepResult.success) {
          setCurrentExecutionState(stepResult.state)
          const newStepIndex = currentStepIndex + 1
          setCurrentStepIndex(newStepIndex)
          setIsCompleted(stepResult.state.isCompleted)
          setIsPaused(!stepResult.state.isCompleted)
          
          // Convert step-by-step state to business step format and add to array
          const businessStep: BusinessStep = {
            stepId: `step_${stepResult.state.currentLine}`,
            line: stepResult.state.businessLine,
            pythonLine: stepResult.state.currentLine,
            variables: stepResult.state.variables,
            output: stepResult.state.output || '',
            blockType: 'statement',
            description: `Line ${stepResult.state.businessLine}`,
            isBreakpoint: false,
            executionTime: 0
          }
          
          setBusinessSteps(prev => [...prev, businessStep])
          
        console.log('✅ [useSmartStepping] Step forward completed:', {
          currentLine: stepResult.state.currentLine,
          businessLine: stepResult.state.businessLine,
          isCompleted: stepResult.state.isCompleted,
          canStepForward: stepResult.state.canStepForward,
          variableCount: Object.keys(stepResult.state.variables).length,
          executionTime: stepResult.executionTime,
          newStepIndex: currentStepIndex + 1
        })
        } else {
          throw new Error(stepResult.error || 'Step forward failed')
        }
        
      } catch (error) {
        console.error('❌ [useSmartStepping] Step forward failed:', error)
        setHasError(true)
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setIsRunning(false)
      }
      
    } else {
      // 🔄 LEGACY SYSTEM
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      
      console.log('👉 [useSmartStepping] Legacy step forward:', {
        from: currentStepIndex,
        to: nextIndex,
        step: businessSteps[nextIndex]?.description
      })
      
      // Check if we've reached the end
      if (nextIndex >= businessSteps.length - 1) {
        setIsCompleted(true)
        setIsPaused(false)
      }
    }
  }, [currentStepIndex, businessSteps, canStepForward, useStepByStep])
  
  /**
   * Step backward to previous business step
   */
  const stepBackward = useCallback(async () => {
    if (!canStepBackward) return
    
    const prevIndex = currentStepIndex - 1
    setCurrentStepIndex(prevIndex)
    
    console.log('👈 [useSmartStepping] Step backward:', {
      from: currentStepIndex,
      to: prevIndex,
      step: businessSteps[prevIndex]?.description
    })
    
    // No longer completed if we step back
    if (isCompleted) {
      setIsCompleted(false)
      setIsPaused(true)
    }
  }, [currentStepIndex, businessSteps, canStepBackward, isCompleted])
  
  /**
   * Go to specific step
   */
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= businessSteps.length || isRunning) return
    
    console.log('🎯 [useSmartStepping] Go to step:', {
      from: currentStepIndex,
      to: stepIndex,
      step: businessSteps[stepIndex]?.description
    })
    
    setCurrentStepIndex(stepIndex)
    setIsCompleted(stepIndex >= businessSteps.length - 1)
    setIsPaused(stepIndex < businessSteps.length - 1)
  }, [currentStepIndex, businessSteps, isRunning])
  
  /**
   * Continue execution to next breakpoint
   */
  const continueExecution = useCallback(async () => {
    if (!canContinue) return
    
    console.log('▶️ [useSmartStepping] Continue execution requested:', {
      useStepByStep,
      breakpointCount: breakpoints.size
    })
    
    if (useStepByStep) {
      // 🚀 NEW STEP-BY-STEP SYSTEM
      try {
        setIsRunning(true)
        
        const continueResult = await stepByStepExecutor.continueExecution()
        
        if (continueResult.success) {
          setCurrentExecutionState(continueResult.state)
          setCurrentStepIndex(prev => prev + 1)
          setIsCompleted(continueResult.state.isCompleted)
          setIsPaused(!continueResult.state.isCompleted)
          
          console.log('✅ [useSmartStepping] Continue execution completed:', {
            currentLine: continueResult.state.currentLine,
            businessLine: continueResult.state.businessLine,
            isCompleted: continueResult.state.isCompleted
          })
        } else {
          throw new Error(continueResult.error || 'Continue execution failed')
        }
        
      } catch (error) {
        console.error('❌ [useSmartStepping] Continue execution failed:', error)
        setHasError(true)
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setIsRunning(false)
      }
      
    } else {
      // Legacy system doesn't support continue mode
      console.warn('⚠️ [useSmartStepping] Continue not supported in legacy mode')
    }
  }, [canContinue, useStepByStep, breakpoints])
  
  /**
   * Run to next breakpoint (legacy)
   */
  const runToBreakpoint = useCallback(async () => {
    if (!canStepForward) return
    
    console.log('🏃 [useSmartStepping] Running to next breakpoint')
    
    // Find next breakpoint
    let nextBreakpointIndex = -1
    for (let i = currentStepIndex + 1; i < businessSteps.length; i++) {
      if (blockBreakpoints.has(businessSteps[i].blockId)) {
        nextBreakpointIndex = i
        break
      }
    }
    
    if (nextBreakpointIndex === -1) {
      // No breakpoint found, run to end
      setCurrentStepIndex(businessSteps.length - 1)
      setIsCompleted(true)
      setIsPaused(false)
    } else {
      // Run to breakpoint
      setCurrentStepIndex(nextBreakpointIndex)
      setIsPaused(true)
    }
  }, [currentStepIndex, businessSteps, blockBreakpoints, canStepForward])
  
  /**
   * Stop execution
   */
  const stop = useCallback(() => {
    console.log('⏹️ [useSmartStepping] Stopping execution')
    
    // Cancel any running execution
    smartSteppingExecutor.cancel()
    
    // Reset state
    setBusinessSteps([])
    setCurrentStepIndex(-1)
    setIsRunning(false)
    setIsPaused(false)
    setIsCompleted(false)
    setHasError(false)
    setError(undefined)
    setExecutionStartTime(undefined)
    setExecutionEndTime(undefined)
    
    // Clear execution context
    executionRef.current = {}
  }, [])
  
  /**
   * Set breakpoint on a block
   */
  const setBlockBreakpoint = useCallback((blockId: string) => {
    console.log('🔴 [useSmartStepping] Set breakpoint:', blockId)
    setBlockBreakpoints(prev => new Set([...prev, blockId]))
  }, [])
  
  /**
   * Remove breakpoint from a block
   */
  const removeBlockBreakpoint = useCallback((blockId: string) => {
    console.log('⚪ [useSmartStepping] Remove breakpoint:', blockId)
    setBlockBreakpoints(prev => {
      const next = new Set(prev)
      next.delete(blockId)
      return next
    })
  }, [])
  
  /**
   * Toggle breakpoint on a block
   */
  const toggleBlockBreakpoint = useCallback((blockId: string) => {
    if (blockBreakpoints.has(blockId)) {
      removeBlockBreakpoint(blockId)
    } else {
      setBlockBreakpoint(blockId)
    }
  }, [blockBreakpoints, setBlockBreakpoint, removeBlockBreakpoint])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      smartSteppingExecutor.cancel()
    }
  }, [])
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [useSmartStepping] State update:', {
      businessStepsCount: businessSteps.length,
      currentStepIndex,
      canStepForward,
      canStepBackward,
      isRunning,
      isPaused,
      isCompleted,
      hasError,
      currentStepDescription: currentStep?.description
    })
  }, [
    businessSteps.length,
    currentStepIndex,
    canStepForward,
    canStepBackward,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    currentStep?.description
  ])
  
  return {
    // Session state
    businessSteps,
    currentStepIndex,
    canStepForward,
    canStepBackward,
    canContinue,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error,
    executionStartTime,
    executionEndTime,
    
    // Step-by-step execution state
    currentExecutionState,
    useStepByStep,
    
    // Controls
    start,
    stepForward,
    stepBackward,
    continueExecution,
    goToStep,
    runToBreakpoint,
    stop,
    setBlockBreakpoint,
    removeBlockBreakpoint,
    toggleBlockBreakpoint,
    setBreakpoints: setBreakpointsWrapper,
    
    // Additional computed state
    currentStep,
    totalSteps: businessSteps.length,
    executionTime: executionStartTime && executionEndTime 
      ? executionEndTime - executionStartTime 
      : undefined,
    blockBreakpoints: Array.from(blockBreakpoints),
    breakpoints: Array.from(breakpoints),
    setBreakpoints
  }
}
