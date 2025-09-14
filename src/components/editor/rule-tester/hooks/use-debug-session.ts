"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { MonacoDebugService } from '../services/monaco-debug-service'
import { DebugMapper } from '../services/debug-mapper'
import { BusinessRulesExecutionEngine } from '../services/business-rules-execution-engine'
import type { DebugState, Variable, DebugTerminalMessage, ExecutionTrace } from '../types'
import type { UnifiedSchema } from '@/lib/editor/schemas/types'
import type * as monaco from 'monaco-editor'

export const useDebugSession = (
  businessRules: string,
  pythonCode: string,
  schemas: UnifiedSchema[] = []
) => {
  const [debugState, setDebugState] = useState<DebugState>({
    isActive: false,
    currentLine: 0,
    breakpoints: new Set(),
    canStep: false,
    canContinue: false,
    canPause: false,
    // ✨ Enhanced debug state
    executionTrace: [],
    terminalMessages: [],
    callStack: []
  })

  const [variables, setVariables] = useState<Variable[]>([])
  const [watchedVariables, setWatchedVariables] = useState<Set<string>>(new Set())
  
  const monacoDebugService = useRef<MonacoDebugService | null>(null)
  const debugMapper = useRef<DebugMapper | null>(null)
  const executionEngine = useRef<BusinessRulesExecutionEngine | null>(null)
  const messageIdCounter = useRef(0)

  // 🐛 **DEBUG**: Track debug state changes
  useEffect(() => {
    console.log('🔍 [useDebugSession] Debug state changed:', {
      isActive: debugState.isActive,
      canStep: debugState.canStep,
      canContinue: debugState.canContinue,
      currentLine: debugState.currentLine
    })
  }, [debugState.isActive, debugState.canStep, debugState.canContinue, debugState.currentLine])

  // Load UTR mock data for testing
  const loadUTRMockData = useCallback(async () => {
    try {
      // Load Amadeus mock data from schemas
      const amadeusUTR = await import('../../../../../schemas/utr/normalized/amadeus-utr-full.json')
      console.log('✅ [UTR] Loaded mock data:', {
        recordLocator: amadeusUTR.pnrHeader?.recordLocator,
        passengerCount: amadeusUTR.passengers?.length || 0,
        segmentCount: amadeusUTR.segments?.length || 0
      })
      return amadeusUTR.default || amadeusUTR
    } catch (error) {
      
      return null
    }
  }, [])

  // Initialize debug services when Monaco editor is available
  const initializeDebugSession = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, ruleType: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' = 'BUSINESS') => {
    monacoDebugService.current = new MonacoDebugService(editor)
    debugMapper.current = new DebugMapper(businessRules, pythonCode, schemas)
    executionEngine.current = new BusinessRulesExecutionEngine()
    
    // Load UTR data for BUSINESS rules only
    const utrData = ruleType === 'BUSINESS' ? await loadUTRMockData() : undefined
    executionEngine.current.initialize(businessRules, utrData, ruleType)
    
    // Sync breakpoints with execution engine
    const breakpoints = monacoDebugService.current.getBreakpoints()
    executionEngine.current.setBreakpoints(new Set(breakpoints))
  }, [businessRules, pythonCode, schemas, loadUTRMockData])

  // ✨ Enhanced terminal message creation
  const addTerminalMessage = useCallback((
    type: DebugTerminalMessage['type'], 
    content: string, 
    line?: number,
    variables?: Variable[]
  ) => {
    const message: DebugTerminalMessage = {
      id: `msg-${++messageIdCounter.current}`,
      timestamp: Date.now(),
      type,
      content,
      line,
      variables
    }

    setDebugState(prev => ({
      ...prev,
      terminalMessages: [...prev.terminalMessages, message]
    }))

    return message
  }, [])

  // ✨ Enhanced variable tracking with history
  const updateVariables = useCallback((newVariables: Variable[], currentLine: number) => {
    setVariables(prevVars => {
      return newVariables.map(newVar => {
        // Find previous version of this variable
        const prevVar = prevVars.find(v => v.name === newVar.name)
        
        if (!prevVar) {
          // New variable
          addTerminalMessage('trace', `Variable created: ${newVar.name} = ${newVar.value}`, currentLine, [newVar])
          return {
            ...newVar,
            valueHistory: [{
              value: newVar.value,
              line: currentLine,
              timestamp: Date.now()
            }]
          }
        }

        // Check if value changed
        const valueChanged = prevVar.value !== newVar.value
        
        if (valueChanged) {
          addTerminalMessage('trace', `${newVar.name}: ${prevVar.value} → ${newVar.value}`, currentLine, [newVar])
          
          // Update history
          const newHistory = [...(prevVar.valueHistory || []), {
            value: newVar.value,
            line: currentLine,
            timestamp: Date.now()
          }]
          
          return {
            ...newVar,
            changed: true,
            previousValue: prevVar.value,
            valueHistory: newHistory.slice(-10) // Keep last 10 changes
          }
        }

        // No change
        return {
          ...newVar,
          changed: false,
          previousValue: prevVar.previousValue,
          valueHistory: prevVar.valueHistory
        }
      })
    })
  }, [addTerminalMessage])

  // Start debug session with current content from editor
  const startDebugSessionWithContent = useCallback(async (currentContent: string, ruleType: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' = 'BUSINESS') => {
    if (!executionEngine.current) {
      
      return
    }

    console.log('🚀 [Debug] Starting debug session with current editor content:', {
      contentLength: currentContent.length,
      contentPreview: currentContent.slice(0, 100),
      contentLines: currentContent.split('\n').length,
      ruleType: ruleType
    })

    // Load UTR data for BUSINESS rules only
    const utrData = ruleType === 'BUSINESS' ? await loadUTRMockData() : undefined
    
    // Reinitialize execution engine with current editor content and UTR data
    executionEngine.current.initialize(currentContent, utrData, ruleType)
    
    // Continue with the rest of the debug session start logic
    return startDebugSessionInternal(currentContent)
  }, [loadUTRMockData])

     // Original startDebugSession for backwards compatibility
   const startDebugSession = useCallback(() => {
     return startDebugSessionWithContent(businessRules)
   }, [businessRules, startDebugSessionWithContent])

   // Internal debug session start logic
   const startDebugSessionInternal = useCallback((rulesToExecute: string) => {
     if (!executionEngine.current) return

          // Sync breakpoints before starting
     if (monacoDebugService.current) {
       const breakpoints = monacoDebugService.current.getBreakpoints()
       executionEngine.current.setBreakpoints(new Set(breakpoints))
       
       setDebugState(prev => ({
         ...prev,
         breakpoints: new Set(breakpoints)
       }))
     }

     // Start execution engine
     const firstStep = executionEngine.current.start()
     
     console.log('🚀 [Debug] Execution engine start result:', { 
       firstStep, 
       hasFirstStep: !!firstStep 
     })

     if (firstStep) {
       const engineState = executionEngine.current.getCurrentState()
       
       console.log('🚀 [Debug] Engine state after start:', {
         line: engineState.line,
         isRunning: engineState.isRunning,
         isPaused: engineState.isPaused,
         canStep: engineState.canStep,
         canContinue: engineState.canContinue,
         totalLines: engineState.totalLines,
         variableCount: engineState.variables.length
       })
       
       setDebugState(prev => {
         const newState = {
           ...prev,
           isActive: true,
           currentLine: engineState.line,
           businessRuleLine: engineState.line,
           canStep: engineState.canStep,
           canContinue: engineState.canContinue,
           canPause: false,
           executionTrace: [],
           terminalMessages: [],
           callStack: []
         }
         
         console.log('🔍 [Debug] Setting new debug state:', {
           oldCanStep: prev.canStep,
           oldCanContinue: prev.canContinue, 
           newCanStep: newState.canStep,
           newCanContinue: newState.canContinue,
           engineCanStep: engineState.canStep,
           engineCanContinue: engineState.canContinue
         })

         // Force a state change by ensuring the object reference changes
         setTimeout(() => {
           
         }, 0)
         
         return newState
       })
       
       // Update variables from execution engine
       updateVariables(engineState.variables, engineState.line)
       
       // Update Monaco visuals
       monacoDebugService.current?.setExecutionPointer(engineState.line)
       
       // Terminal messages
       addTerminalMessage('info', 'Debug session started')
       addTerminalMessage('debug', `Business rules loaded (${rulesToExecute.split('\n').length} lines)`)
       addTerminalMessage('step', `Paused at line ${engineState.line}`, engineState.line, engineState.variables)
       
       const businessRuleText = rulesToExecute.split('\n')[engineState.line - 1]?.trim()
       if (businessRuleText) {
         addTerminalMessage('trace', `Ready to execute: ${businessRuleText}`, engineState.line)
       }
     } else {
       
       addTerminalMessage('error', 'Failed to start debug session - no executable statements found')
     }
   }, [addTerminalMessage, updateVariables])

  const pauseDebugSession = useCallback((businessRuleLine: number, currentVariables: Variable[]) => {
    const pythonLine = debugMapper.current?.mapBusinessRuleToPython(businessRuleLine)
    
    // Add execution trace
    const trace: ExecutionTrace = {
      line: businessRuleLine,
      timestamp: Date.now(),
      variables: currentVariables,
      output: `Paused at line ${businessRuleLine}`
    }
    
    setDebugState(prev => ({
      ...prev,
      currentLine: businessRuleLine,
      businessRuleLine,
      canStep: true,
      canContinue: true,
      canPause: false,
      executionTrace: [...prev.executionTrace, trace],
      callStack: [{
        line: businessRuleLine,
        variables: currentVariables
      }]
    }))

    // Update variables with change tracking
    updateVariables(currentVariables, businessRuleLine)
    
    // Update Monaco editor visuals
    monacoDebugService.current?.setExecutionPointer(businessRuleLine)
    monacoDebugService.current?.showVariableValues(currentVariables)

    // Terminal messages
    addTerminalMessage('step', `Paused at line ${businessRuleLine}`, businessRuleLine, currentVariables)
    
    const businessRuleText = businessRules.split('\n')[businessRuleLine - 1]?.trim()
    if (businessRuleText) {
      addTerminalMessage('trace', `Executing: ${businessRuleText}`, businessRuleLine)
    }
  }, [businessRules, updateVariables, addTerminalMessage])

  const stepDebugSession = useCallback(() => {
    if (!executionEngine.current || !debugState.isActive) {
      
      return
    }

    const currentLine = debugState.currentLine
    addTerminalMessage('step', `Stepping from line ${currentLine}`)
    
    // Execute the next step using the execution engine
    const nextStep = executionEngine.current.stepNext()
    
    if (nextStep) {
      const engineState = executionEngine.current.getCurrentState()
      
      setDebugState(prev => ({
        ...prev,
        currentLine: engineState.line,
        businessRuleLine: engineState.line,
        canStep: engineState.canStep,
        canContinue: engineState.canContinue,
        canPause: engineState.isPaused
      }))
      
      // Update variables with changes
      updateVariables(engineState.variables, engineState.line)
      
      // Update Monaco visuals
      monacoDebugService.current?.setExecutionPointer(engineState.line)
      
      // Terminal messages
      addTerminalMessage('trace', `Executed: ${nextStep.statement}`, currentLine)
      if (engineState.line <= businessRules.split('\n').length) {
        addTerminalMessage('step', `Paused at line ${engineState.line}`, engineState.line, engineState.variables)
        
        const businessRuleText = businessRules.split('\n')[engineState.line - 1]?.trim()
        if (businessRuleText) {
          addTerminalMessage('trace', `Ready to execute: ${businessRuleText}`, engineState.line)
        }
      } else {
        addTerminalMessage('info', 'Execution completed')
      }
    } else {
      // Execution finished
      stopDebugSession()
      addTerminalMessage('info', 'Execution completed')
    }
  }, [debugState.currentLine, debugState.isActive, businessRules, addTerminalMessage, updateVariables])

  const continueDebugSession = useCallback(() => {
    if (!executionEngine.current || !debugState.isActive) {
      
      return
    }

    addTerminalMessage('info', 'Continuing execution...')
    
    // Continue execution until next breakpoint or end
    const lastStep = executionEngine.current.continue()
    const engineState = executionEngine.current.getCurrentState()
    
    setDebugState(prev => ({
      ...prev,
      currentLine: engineState.line,
      businessRuleLine: engineState.line,
      canStep: engineState.canStep,
      canContinue: engineState.canContinue,
      canPause: engineState.isPaused
    }))
    
    // Update variables
    updateVariables(engineState.variables, engineState.line)
    
    // Update Monaco visuals
    if (engineState.isRunning) {
      monacoDebugService.current?.setExecutionPointer(engineState.line)
      
      if (debugState.breakpoints.has(engineState.line)) {
        addTerminalMessage('info', `Hit breakpoint at line ${engineState.line}`)
        addTerminalMessage('step', `Paused at line ${engineState.line}`, engineState.line, engineState.variables)
      }
    } else {
      // Execution finished
      monacoDebugService.current?.clearExecutionPointer()
      addTerminalMessage('info', 'Execution completed')
    }
  }, [debugState.isActive, debugState.breakpoints, addTerminalMessage, updateVariables])

  const stopDebugSession = useCallback(() => {
    // Stop the execution engine
    if (executionEngine.current) {
      executionEngine.current.stop()
    }

    setDebugState(prev => ({
      ...prev,
      isActive: false,
      currentLine: 0,
      canStep: false,
      canContinue: false,
      canPause: false
    }))

    setVariables([])
    monacoDebugService.current?.clearExecutionPointer()
    
    addTerminalMessage('info', 'Debug session stopped')
  }, [addTerminalMessage])

  // ✨ Variable watching functionality
  const watchVariable = useCallback((variableName: string) => {
    setWatchedVariables(prev => new Set([...prev, variableName]))
    addTerminalMessage('debug', `Now watching: ${variableName}`)
  }, [addTerminalMessage])

  const unwatchVariable = useCallback((variableName: string) => {
    setWatchedVariables(prev => {
      const newSet = new Set(prev)
      newSet.delete(variableName)
      return newSet
    })
    addTerminalMessage('debug', `Stopped watching: ${variableName}`)
  }, [addTerminalMessage])

  // ✨ Terminal command execution
  const executeDebugCommand = useCallback((command: string) => {
    addTerminalMessage('info', `> ${command}`)
    
    // Simple command processor
    const trimmedCommand = command.trim().toLowerCase()
    
    if (trimmedCommand === 'help') {
      addTerminalMessage('info', 'Available commands: help, vars, clear, break <line>, continue, step')
    } else if (trimmedCommand === 'vars') {
      const varSummary = variables.map(v => `${v.name}: ${v.value}`).join(', ')
      addTerminalMessage('output', varSummary || 'No variables')
    } else if (trimmedCommand === 'clear') {
      clearTerminalMessages()
    } else if (trimmedCommand.startsWith('break ')) {
      const lineNum = parseInt(trimmedCommand.split(' ')[1])
      if (!isNaN(lineNum)) {
        addTerminalMessage('debug', `Breakpoint set at line ${lineNum}`)
        // Add to breakpoints
        setDebugState(prev => ({
          ...prev,
          breakpoints: new Set([...prev.breakpoints, lineNum])
        }))
        
        // Sync with execution engine
        if (executionEngine.current) {
          executionEngine.current.setBreakpoints(new Set([...debugState.breakpoints, lineNum]))
        }
      }
    } else {
      addTerminalMessage('error', `Unknown command: ${command}`)
    }
  }, [variables, addTerminalMessage])

  // Clear terminal messages
  const clearTerminalMessages = useCallback(() => {
    setDebugState(prev => ({
      ...prev,
      terminalMessages: []
    }))
  }, [])

  return {
    debugState,
    variables,
    watchedVariables,
    initializeDebugSession,
    startDebugSession,
    startDebugSessionWithContent,
    pauseDebugSession,
    stepDebugSession,
    continueDebugSession,
    stopDebugSession,
    watchVariable,
    unwatchVariable,
    executeDebugCommand,
    clearTerminalMessages,
    getDebugMapper: () => debugMapper.current,
    getMonacoDebugService: () => monacoDebugService.current,
    getExecutionEngine: () => executionEngine.current
  }
}