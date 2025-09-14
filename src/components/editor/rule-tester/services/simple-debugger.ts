"use client"

// 🎯 **SIMPLE DEBUGGER** - TypeScript-like debugging experience
// Clean, focused, no over-engineering - just works like VSCode

import type * as monaco from 'monaco-editor'
import { PythonExecutor, type PythonExecutionResult } from './python-executor'
import { SimpleLineMapper } from './simple-line-mapper'

export interface SimpleDebugState {
  status: 'stopped' | 'running' | 'paused' | 'completed' | 'error'
  currentLine: number
  variables: Record<string, any>
  canStep: boolean
  canContinue: boolean
  error?: string
}

export interface SimpleDebugStep {
  businessLine: number
  pythonLine: number
  variables: Record<string, any>
  output: string
}

/**
 * 🎯 **SIMPLE DEBUGGER** - Clean TypeScript-like debugging
 * 
 * Key Features:
 * - Set breakpoints on business rule lines
 * - Execute Python with mapped breakpoints
 * - Show variables at breakpoint
 * - Highlight current line in Monaco
 * 
 * No complex filtering, no over-engineering - just works.
 */
export class SimpleDebugger {
  private editor: monaco.editor.IStandaloneCodeEditor
  private monaco: typeof import('monaco-editor')
  private pythonExecutor: PythonExecutor
  private lineMapper: SimpleLineMapper
  
  // State
  private currentState: SimpleDebugState
  private stateChangeListeners: Array<(state: SimpleDebugState) => void> = []
  
  // Execution tracking
  private currentSteps: SimpleDebugStep[] = []
  private currentStepIndex: number = 0
  
  // Monaco decorations
  private breakpointDecorations: string[] = []
  private executionLineDecoration: string | null = null
  
  // Breakpoints (business rule line numbers)
  private breakpointLines = new Set<number>()
  
  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) {
    this.editor = editor
    this.monaco = monaco
    this.pythonExecutor = new PythonExecutor()
    this.lineMapper = new SimpleLineMapper()
    
    this.currentState = {
      status: 'stopped',
      currentLine: 0,
      variables: {},
      canStep: false,
      canContinue: false
    }
    
    this.setupMonacoIntegration()
    console.log('🎯 [SimpleDebugger] Initialized - ready for TypeScript-like debugging')
  }
  
  /**
   * 🎨 **SETUP MONACO INTEGRATION** - Breakpoint clicks and decorations
   */
  private setupMonacoIntegration(): void {
    // Handle breakpoint clicks in gutter
    this.editor.onMouseDown((e) => {
      if (e.target.type === this.monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position?.lineNumber
        if (line) {
          this.toggleBreakpoint(line)
        }
      }
    })
  }
  
  /**
   * 🔴 **TOGGLE BREAKPOINT** - Add/remove breakpoint on line
   */
  toggleBreakpoint(line: number): void {
    if (this.breakpointLines.has(line)) {
      this.breakpointLines.delete(line)
    } else {
      this.breakpointLines.add(line)
    }
    
    this.updateBreakpointDecorations()
    
    console.log('🔴 [SimpleDebugger] Breakpoint toggled:', {
      line,
      totalBreakpoints: this.breakpointLines.size,
      breakpoints: Array.from(this.breakpointLines)
    })
  }
  
  /**
   * 🎨 **UPDATE BREAKPOINT DECORATIONS** - Show breakpoints in Monaco
   */
  private updateBreakpointDecorations(): void {
    const decorations = Array.from(this.breakpointLines).map(line => ({
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'debug-breakpoint',
        glyphMarginHoverMessage: { value: 'Breakpoint' }
      }
    }))
    
    this.breakpointDecorations = this.editor.deltaDecorations(
      this.breakpointDecorations,
      decorations
    )
  }
  
  /**
   * 🚀 **START DEBUGGING** - Begin execution with breakpoints
   */
  async start(businessRulesCode: string, pythonCode: string, sourceMap?: any): Promise<void> {
    try {
      console.log('🚀 [SimpleDebugger] Starting debug session:', {
        businessRulesLength: businessRulesCode.length,
        pythonLength: pythonCode.length,
        breakpointCount: this.breakpointLines.size,
        hasSourceMap: !!sourceMap
      })
      
      // Initialize line mapper
      this.lineMapper.initialize(sourceMap, businessRulesCode, pythonCode)
      
      // Map business rule breakpoints to Python lines
      const pythonBreakpoints: number[] = []
      for (const businessLine of this.breakpointLines) {
        const pythonLine = this.lineMapper.getPythonLine(businessLine)
        if (pythonLine) {
          pythonBreakpoints.push(pythonLine)
          console.log(`🗺️ [SimpleDebugger] Mapped breakpoint: business line ${businessLine} → Python line ${pythonLine}`)
        } else {
          console.warn(`⚠️ [SimpleDebugger] Could not map business line ${businessLine} to Python`)
        }
      }
      
      if (pythonBreakpoints.length === 0) {
        console.warn('⚠️ [SimpleDebugger] No valid breakpoints found')
        this.updateState({ status: 'completed', error: 'No valid breakpoints set' })
        return
      }
      
      // Update state to running
      this.updateState({ status: 'running', currentLine: 0, variables: {}, error: undefined })
      
      // Execute Python with breakpoints
      const result = await this.pythonExecutor.execute(pythonCode, {
        breakpoints: pythonBreakpoints,
        initialVariables: {}
      })
      
      if (!result.success) {
        this.updateState({
          status: 'error',
          error: result.error || 'Python execution failed'
        })
        return
      }
      
      // Process debug steps
      await this.processDebugSteps(result)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [SimpleDebugger] Start failed:', errorMessage)
      this.updateState({
        status: 'error',
        error: errorMessage
      })
    }
  }
  
  /**
   * 👣 **STEP** - Advance to the next step in the execution
   */
  async step(): Promise<void> {
    if (this.currentState.status !== 'paused') {
      console.warn('⚠️ [SimpleDebugger] Cannot step - debugger not paused')
      return
    }
    
    if (this.currentStepIndex >= this.currentSteps.length - 1) {
      console.warn('⚠️ [SimpleDebugger] Cannot step - already at last step')
      return
    }
    
    console.log('👣 [SimpleDebugger] Stepping to next step:', {
      currentIndex: this.currentStepIndex,
      totalSteps: this.currentSteps.length
    })
    
    // Advance to next step
    this.currentStepIndex++
    
    // Process the next step
    this.processCurrentStep()
  }
  
  /**
   * 🔄 **PROCESS DEBUG STEPS** - Handle execution results
   */
  private async processDebugSteps(result: PythonExecutionResult): Promise<void> {
    console.log('🔄 [SimpleDebugger] Processing debug steps:', {
      stepCount: result.steps.length,
      success: result.success
    })
    
    if (result.steps.length === 0) {
      this.updateState({
        status: 'completed',
        currentLine: 0,
        variables: {},
        canStep: false,
        canContinue: false
      })
      this.clearExecutionLineDecoration()
      return
    }
    
    // Store all steps for stepping through
    this.currentSteps = result.steps
    this.currentStepIndex = 0
    
    // Process the first step
    this.processCurrentStep()
  }
  
  /**
   * 🎯 **PROCESS CURRENT STEP** - Handle the current step in the execution
   */
  private processCurrentStep(): void {
    if (this.currentStepIndex >= this.currentSteps.length) {
      // All steps completed
      this.updateState({
        status: 'completed',
        currentLine: 0,
        variables: {},
        canStep: false,
        canContinue: false
      })
      this.clearExecutionLineDecoration()
      console.log('✅ [SimpleDebugger] All steps completed')
      return
    }
    
    const step = this.currentSteps[this.currentStepIndex]
    const isLastStep = this.currentStepIndex === this.currentSteps.length - 1
    
    // Map Python line back to business rule line
    const businessLine = this.lineMapper.getBusinessLine(step.line) || step.line
    
    // Filter out Python internals from variables
    const cleanVariables = this.filterVariables(step.variables)
    
    console.log('🎯 [SimpleDebugger] Processing step:', {
      stepIndex: this.currentStepIndex,
      totalSteps: this.currentSteps.length,
      pythonLine: step.line,
      businessLine,
      variableCount: Object.keys(cleanVariables).length,
      variables: cleanVariables,
      isLastStep
    })
    
    // Update state and UI
    this.updateState({
      status: isLastStep ? 'completed' : 'paused',
      currentLine: businessLine,
      variables: cleanVariables,
      canStep: !isLastStep,
      canContinue: !isLastStep
    })
    
    // Highlight line in Monaco
    this.updateExecutionLineDecoration(businessLine)
    
    if (isLastStep) {
      console.log('✅ [SimpleDebugger] Reached final step')
    } else {
      console.log('⏸️ [SimpleDebugger] Paused at step', this.currentStepIndex + 1, 'of', this.currentSteps.length)
    }
  }
  
  /**
   * 🧹 **FILTER VARIABLES** - Remove Python internals
   */
  private filterVariables(variables: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {}
    
    for (const [name, value] of Object.entries(variables)) {
      // Skip Python internals
      if (name.startsWith('_') || 
          ['json', 'sys', 'debug_locals', 'debug_vars'].includes(name) ||
          (typeof value === 'string' && value.includes('<module'))) {
        continue
      }
      
      filtered[name] = value
    }
    
    return filtered
  }
  
  /**
   * 🎨 **UPDATE EXECUTION LINE DECORATION** - Highlight current line
   */
  private updateExecutionLineDecoration(line: number): void {
    const decoration = {
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'debug-execution-line',
        glyphMarginClassName: 'debug-execution-arrow'
      }
    }
    
    this.executionLineDecoration = this.editor.deltaDecorations(
      this.executionLineDecoration ? [this.executionLineDecoration] : [],
      [decoration]
    )[0]
    
    // Scroll to line
    this.editor.revealLineInCenter(line)
  }
  
  /**
   * 🧹 **CLEAR EXECUTION LINE DECORATION** - Remove highlight
   */
  private clearExecutionLineDecoration(): void {
    if (this.executionLineDecoration) {
      this.editor.deltaDecorations([this.executionLineDecoration], [])
      this.executionLineDecoration = null
    }
  }
  
  /**
   * ▶️ **CONTINUE DEBUGGING** - Resume execution
   */
  continue(): void {
    console.log('▶️ [SimpleDebugger] Continuing debug session')
    
    // For simple debugger, continue just means complete execution
    // In a more advanced implementation, this would continue to next breakpoint
    this.updateState({
      status: 'completed',
      canStep: false,
      canContinue: false
    })
  }
  
  /**
   * 🛑 **STOP DEBUGGING** - Clean stop
   */
  stop(): void {
    console.log('🛑 [SimpleDebugger] Stopping debug session')
    
    this.updateState({
      status: 'stopped',
      currentLine: 0,
      variables: {},
      canStep: false,
      canContinue: false,
      error: undefined
    })
    
    this.clearExecutionLineDecoration()
  }
  
  /**
   * 🔄 **UPDATE STATE** - Notify listeners of state changes
   */
  private updateState(newState: Partial<SimpleDebugState>): void {
    this.currentState = { ...this.currentState, ...newState }
    
    console.log('🔄 [SimpleDebugger] State updated:', this.currentState)
    
    // Notify listeners
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.currentState)
      } catch (error) {
        console.error('❌ [SimpleDebugger] State listener error:', error)
      }
    })
  }
  
  /**
   * 👂 **ADD STATE LISTENER** - Subscribe to state changes
   */
  addStateListener(listener: (state: SimpleDebugState) => void): void {
    this.stateChangeListeners.push(listener)
  }
  
  /**
   * 👂 **REMOVE STATE LISTENER** - Unsubscribe from state changes
   */
  removeStateListener(listener: (state: SimpleDebugState) => void): void {
    const index = this.stateChangeListeners.indexOf(listener)
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1)
    }
  }
  
  /**
   * 📊 **GET CURRENT STATE** - Get current debug state
   */
  getCurrentState(): SimpleDebugState {
    return { ...this.currentState }
  }
}
