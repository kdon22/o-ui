"use client"

// 🎯 **USE SIMPLE DEBUGGER** - Clean React hook for TypeScript-like debugging
// Small, focused, no over-engineering

import { useState, useCallback, useRef, useEffect } from 'react'
import type * as monaco from 'monaco-editor'
import { SimpleDebugger, type SimpleDebugState } from '../services/simple-debugger'

export interface SimpleDebugSession {
  // State
  debugState: SimpleDebugState
  error?: string
  
  // Actions
  initialize: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
  start: (businessRulesCode: string, pythonCode: string, sourceMap?: any) => Promise<void>
  stop: () => void
  toggleBreakpoint: (line: number) => void
  stepOver: () => Promise<void>
  stepInto: () => Promise<void>
  stepOut: () => void
  
  // Status
  isReady: boolean
}

/**
 * 🎯 **USE SIMPLE DEBUGGER** - TypeScript-like debugging hook
 * 
 * Simple interface for Monaco debugging:
 * 1. Initialize with Monaco editor
 * 2. Set breakpoints by clicking gutter
 * 3. Start debugging with business rules + Python code
 * 4. Watch debugState for updates
 */
export function useSimpleDebugger(): SimpleDebugSession {
  // State
  const [debugState, setDebugState] = useState<SimpleDebugState>({
    status: 'stopped',
    currentLine: 0,
    variables: {},
    canStep: false,
    canContinue: false
  })
  const [error, setError] = useState<string | undefined>()
  const [isReady, setIsReady] = useState(false)
  
  // Refs
  const debuggerRef = useRef<SimpleDebugger | null>(null)
  
  /**
   * 🔧 **INITIALIZE** - Set up debugger with Monaco editor
   */
  const initialize = useCallback((
    editor: monaco.editor.IStandaloneCodeEditor, 
    monaco: typeof import('monaco-editor')
  ) => {
    try {
      console.log('🔧 [useSimpleDebugger] Initializing with Monaco editor')
      
      // Clean up existing debugger
      if (debuggerRef.current) {
        debuggerRef.current.stop()
      }
      
      // Create new debugger
      debuggerRef.current = new SimpleDebugger(editor, monaco)
      
      // Listen to state changes
      debuggerRef.current.addStateListener((newState) => {
        setDebugState(newState)
        setError(newState.error)
      })
      
      setIsReady(true)
      setError(undefined)
      
      console.log('✅ [useSimpleDebugger] Debugger initialized successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ [useSimpleDebugger] Initialize failed:', errorMessage)
      setError(errorMessage)
      setIsReady(false)
    }
  }, [])
  
  /**
   * 🚀 **START** - Begin debugging session
   */
  const start = useCallback(async (
    businessRulesCode: string, 
    pythonCode: string, 
    sourceMap?: any
  ) => {
    if (!debuggerRef.current) {
      const errorMessage = 'Debugger not initialized - call initialize() first'
      console.error('❌ [useSimpleDebugger] Cannot start:', errorMessage)
      setError(errorMessage)
      return
    }
    
    try {
      console.log('🚀 [useSimpleDebugger] Starting debug session:', {
        businessRulesLength: businessRulesCode.length,
        pythonLength: pythonCode.length,
        hasSourceMap: !!sourceMap
      })
      
      setError(undefined)
      
      await debuggerRef.current.start(businessRulesCode, pythonCode, sourceMap)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ [useSimpleDebugger] Start failed:', errorMessage)
      setError(errorMessage)
    }
  }, [])
  
  /**
   * 🛑 **STOP** - Stop debugging session
   */
  const stop = useCallback(() => {
    if (debuggerRef.current) {
      console.log('🛑 [useSimpleDebugger] Stopping debug session')
      debuggerRef.current.stop()
    }
  }, [])
  
  /**
   * 🔴 **TOGGLE BREAKPOINT** - Add/remove breakpoint on line
   */
  const toggleBreakpoint = useCallback((line: number) => {
    if (debuggerRef.current) {
      debuggerRef.current.toggleBreakpoint(line)
    }
  }, [])
  
  /**
   * 👣 **STEP OVER** - Execute next line without entering functions
   */
  const stepOver = useCallback(async () => {
    if (debuggerRef.current) {
      console.log('👣 [useSimpleDebugger] Step over requested')
      await debuggerRef.current.step()
    }
  }, [])
  
  /**
   * 👣 **STEP INTO** - Execute next line and enter functions
   */
  const stepInto = useCallback(async () => {
    if (debuggerRef.current) {
      console.log('👣 [useSimpleDebugger] Step into requested')
      await debuggerRef.current.step()
    }
  }, [])
  
  /**
   * 👣 **STEP OUT** - Execute until returning from current function
   */
  const stepOut = useCallback(() => {
    if (debuggerRef.current) {
      // For simple debugger, step out is the same as continue for now
      debuggerRef.current.continue()
    }
  }, [])
  
  /**
   * 🧹 **CLEANUP** - Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (debuggerRef.current) {
        debuggerRef.current.stop()
      }
    }
  }, [])
  
  return {
    // State
    debugState,
    error,
    
    // Actions
    initialize,
    start,
    stop,
    toggleBreakpoint,
    stepOver,
    stepInto,
    stepOut,
    
    // Status
    isReady
  }
}
