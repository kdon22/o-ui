"use client"

// 🎯 **USE MONACO DEBUGGER** - Clean React hook for Monaco-native debugging
// Provides simple interface to MonacoNativeDebugger for React components

import { useState, useCallback, useRef, useEffect } from 'react'
import type * as monaco from 'monaco-editor'
import { MonacoNativeDebugger, type DebugState, type DebugVariable } from '../services/monaco-native-debugger'

export interface MonacoDebugSession {
  // State (read-only for React components)
  state: DebugState
  variables: DebugVariable[]
  breakpoints: number[]
  isReady: boolean
  error?: string
  
  // Actions
  start: (businessRulesCode?: string, pythonCode?: string) => Promise<void>
  stop: () => void
  stepOver: () => void
  stepInto: () => void
  stepOut: () => void
  continue: () => void
  toggleBreakpoint: (line: number) => void
  
  // Setup
  initializeDebugger: (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => void
  updateCodes: (businessRulesCode: string, pythonCode: string, sourceMap?: any) => void
}

/**
 * 🚀 **USE MONACO DEBUGGER** - Clean, focused debugging hook
 * 
 * Key Features:
 * - Single source of truth via MonacoNativeDebugger
 * - No React state conflicts (Monaco manages all UI state)
 * - Clean API that matches existing interface
 * - Automatic cleanup and resource management
 * 
 * Usage:
 * ```typescript
 * const debug = useMonacoDebugger()
 * 
 * // Initialize when Monaco editor mounts
 * const handleEditorMount = (editor, monaco) => {
 *   debug.initializeDebugger(editor, monaco)
 * }
 * 
 * // Start debugging
 * await debug.start(businessRules, pythonCode)
 * ```
 */
export function useMonacoDebugger(): MonacoDebugSession {
  // State
  const [debugState, setDebugState] = useState<DebugState>({
    status: 'stopped',
    currentLine: 0,
    variables: [],
    canStep: false,
    canContinue: false
  })
  const [variables, setVariables] = useState<DebugVariable[]>([])
  const [breakpoints, setBreakpoints] = useState<number[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | undefined>()
  
  // Refs
  const debuggerRef = useRef<MonacoNativeDebugger | null>(null)
  const businessRulesCodeRef = useRef<string>('')
  const pythonCodeRef = useRef<string>('')
  const sourceMapRef = useRef<any>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  /**
   * 🔧 **INITIALIZE DEBUGGER** - Set up Monaco-native debugging
   */
  const initializeDebugger = useCallback((
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    try {
      console.log('🔧 [useMonacoDebugger] Initializing Monaco built-in debugger')
      
      // Clean up existing debugger if any
      if (debuggerRef.current) {
        console.log('🧹 [useMonacoDebugger] Cleaning up existing debugger')
        debuggerRef.current = null
      }
      
      // Clean up existing listeners
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      
      // Create new Monaco native debugger (constructor handles initialization)
      debuggerRef.current = new MonacoNativeDebugger(editor, monaco)

      // Listen for state changes
      const cleanup = debuggerRef.current.onStateChange((newState) => {
        console.log('🔄 [useMonacoDebugger] State changed:', {
          status: newState.status,
          canStep: newState.canStep,
          canContinue: newState.canContinue,
          currentLine: newState.currentLine,
          variableCount: newState.variables?.length || 0
        })

        setDebugState(newState)
        setVariables(newState.variables)
        setBreakpoints(debuggerRef.current?.getBreakpoints() || [])

        if (newState.error) {
          setError(newState.error)
        } else {
          setError(undefined)
        }
      })
      
      // Get initial state
      const initialState = debuggerRef.current.getState()
      console.log('🔄 [useMonacoDebugger] Initial state:', {
        status: initialState.status,
        canStep: initialState.canStep,
        canContinue: initialState.canContinue,
        currentLine: initialState.currentLine
      })
      setDebugState(initialState)

      // Setup cleanup for MonacoNativeDebugger
      cleanupRef.current = () => {
        cleanup() // Clean up state listener
        if (debuggerRef.current) {
          debuggerRef.current.dispose()
          debuggerRef.current = null
        }
      }
      
      setIsReady(true)
      setError(undefined)
      console.log('✅ [useMonacoDebugger] Monaco native debugger initialized successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ [useMonacoDebugger] Failed to initialize:', errorMessage)
      setError(errorMessage)
      setIsReady(false)
    }
  }, [])

  /**
   * 🔄 **UPDATE CODES** - Update the codes and source map for debugging
   */
  const updateCodes = useCallback((businessRulesCode: string, pythonCode: string, sourceMap?: any) => {
    businessRulesCodeRef.current = businessRulesCode
    pythonCodeRef.current = pythonCode
    sourceMapRef.current = sourceMap
    console.log('🔄 [useMonacoDebugger] Codes updated:', {
      businessRulesLength: businessRulesCode.length,
      pythonLength: pythonCode.length,
      hasSourceMap: !!sourceMap
    })
  }, [])

  /**
   * 🚀 **START DEBUG SESSION** - Begin TypeScript-like debugging
   */
  const start = useCallback(async (businessRulesCode?: string, pythonCode?: string) => {
    if (!debuggerRef.current) {
      const errorMessage = 'Monaco debugger not initialized - please wait for editor to load'
      console.error('❌ [useMonacoDebugger] Cannot start:', errorMessage)
      setError(errorMessage)
      return
    }

    try {
      console.log('🚀 [useMonacoDebugger] Starting debug session with codes:', {
        hasBusinessRules: !!(businessRulesCode || businessRulesCodeRef.current),
        hasPython: !!(pythonCode || pythonCodeRef.current),
        businessRulesLength: (businessRulesCode || businessRulesCodeRef.current).length,
        pythonLength: (pythonCode || pythonCodeRef.current).length
      })
      setError(undefined)
      
      // Use provided codes or stored codes
      const finalBusinessRules = businessRulesCode || businessRulesCodeRef.current
      const finalPython = pythonCode || pythonCodeRef.current
      const finalSourceMap = sourceMapRef.current
      
      if (!finalPython) {
        throw new Error('Python code is required for debugging. Make sure both business rules and Python code are provided.')
      }
      
      console.log('🗺️ [useMonacoDebugger] Starting with source map:', {
        hasSourceMap: !!finalSourceMap,
        sourceMapType: finalSourceMap ? typeof finalSourceMap : 'none'
      })
      
      await debuggerRef.current.start(finalBusinessRules, finalPython, finalSourceMap)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ [useMonacoDebugger] Start failed:', errorMessage)
      setError(errorMessage)
    }
  }, [])

  /**
   * 🛑 **STOP DEBUG SESSION** - Clean stop
   */
  const stop = useCallback(() => {
    if (debuggerRef.current) {
      console.log('🛑 [useMonacoDebugger] Stopping debug session')
      debuggerRef.current.stop()
    }
  }, [])

  /**
   * 🔴 **TOGGLE BREAKPOINT** - Add/remove breakpoint
   */
  const toggleBreakpoint = useCallback((line: number) => {
    if (debuggerRef.current) {
      console.log('🔴 [useMonacoDebugger] Toggling breakpoint at line:', line)
      debuggerRef.current.toggleBreakpoint(line)
    }
  }, [])

  /**
   * ⏭️ **STEP OVER** - Execute next line
   */
  const stepOver = useCallback(() => {
    if (debuggerRef.current) {
      console.log('⏭️ [useMonacoDebugger] Step over')
      debuggerRef.current.stepOver()
    }
  }, [])

  /**
   * ⏬ **STEP INTO** - Step into function calls
   */
  const stepInto = useCallback(() => {
    if (debuggerRef.current) {
      console.log('⏬ [useMonacoDebugger] Step into')
      debuggerRef.current.stepInto()
    }
  }, [])

  /**
   * ⏫ **STEP OUT** - Step out of current function
   */
  const stepOut = useCallback(() => {
    if (debuggerRef.current) {
      console.log('⏫ [useMonacoDebugger] Step out')
      debuggerRef.current.stepOut()
    }
  }, [])

  /**
   * ▶️ **CONTINUE** - Continue execution to next breakpoint
   */
  const continue_ = useCallback(() => {
    if (debuggerRef.current) {
      console.log('▶️ [useMonacoDebugger] Continue')
      debuggerRef.current.continue()
    }
  }, [])

  /**
   * 🧹 **CLEANUP EFFECT** - Clean up resources on unmount
   */
  useEffect(() => {
    return () => {
      console.log('🧹 [useMonacoDebugger] Cleaning up resources')
      
      // Clean up state change listener
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      
      // Dispose debugger
      if (debuggerRef.current) {
        debuggerRef.current.dispose()
        debuggerRef.current = null
      }
    }
  }, [])

  // Return clean interface (matches existing EnterpriseDebugSession interface)
  return {
    // State
    state: debugState,
    variables,
    breakpoints,
    isReady,
    error,
    
    // Actions
    start,
    stop,
    stepOver,
    stepInto,
    stepOut,
    continue: continue_,
    toggleBreakpoint,
    
    // Setup
    initializeDebugger,
    updateCodes
  }
}
