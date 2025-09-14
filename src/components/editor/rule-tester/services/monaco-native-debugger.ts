"use client"

// 🎯 **ENHANCED MONACO NATIVE DEBUGGER** - TypeScript-like debugging with enhanced source maps
// Clean implementation with no legacy code or backwards compatibility

import type * as monaco from 'monaco-editor'
import { PythonExecutor, type PythonExecutionResult } from './python-executor'
import { EnhancedSourceMapConsumer } from '../../source-maps/enhanced-source-map-consumer'
import { SimpleSourceMapConsumer, createSimpleSourceMapConsumer } from './simple-source-map-consumer'
import type { SimpleSourceMap } from '@/lib/editor/python-generation/simple-source-map'
import type { 
  EnhancedBusinessRuleSourceMap, 
  EnhancedDebugStep,
  BusinessLocation 
} from '../../types/enhanced-source-map-types'
import { 
  expandBreakpointsWithSourceMap,
  processEnhancedDebugSteps,
  updateMonacoExecutionHighlight
} from './enhanced-debugger-methods'

export interface DebugVariable {
  name: string
  value: any
  type: string
  scope: 'local' | 'global' | 'builtin'
  changed?: boolean
  previousValue?: any
}

export interface DebugState {
  status: 'stopped' | 'running' | 'paused' | 'completed' | 'error'
  currentLine: number
  variables: DebugVariable[]
  canStep: boolean
  canContinue: boolean
  error?: string
}

/**
 * 🚀 **ENHANCED MONACO NATIVE DEBUGGER** - Professional debugging with enhanced source maps
 */
export class MonacoNativeDebugger {
  private editor: monaco.editor.IStandaloneCodeEditor
  private monaco: typeof import('monaco-editor')
  private pythonExecutor: PythonExecutor
  private sourceMapConsumer: EnhancedSourceMapConsumer | null = null
  private simpleSourceMapConsumer: SimpleSourceMapConsumer | null = null
  
  // State management
  private currentState: DebugState
  private stateChangeListeners: Array<(state: DebugState) => void> = []
  
  // Monaco native decorations (single source of truth)
  private breakpointDecorations: string[] = []
  private executionLineDecorationId: string | null = null
  
  // Breakpoint management (Monaco-native)
  private breakpointLines = new Set<number>() // Business rule line numbers
  
  // Enhanced step-by-step execution control
  private enhancedDebugSteps: EnhancedDebugStep[] = []
  private currentStepIndex = 0
  private isWaitingForUserAction = false
  private continueExecution: (() => void) | null = null

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) {
    this.editor = editor
    this.monaco = monaco
    this.pythonExecutor = new PythonExecutor()
    
    this.currentState = {
      status: 'stopped',
      currentLine: 0,
      variables: [],
      canStep: false,
      canContinue: false
    }
    
    this.setupMonacoIntegration()
    console.log('🎯 [MonacoNativeDebugger] Enhanced debugger initialized')
  }

  /**
   * 🎨 **SETUP MONACO INTEGRATION** - Native Monaco debugging setup
   */
  private setupMonacoIntegration(): void {
    this.editor.updateOptions({
      glyphMargin: true,
      lineNumbers: 'on',
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 4,
      renderLineHighlight: 'none',
      hideCursorInOverviewRuler: true
    })
    
    // Native breakpoint handling
    this.editor.onMouseDown((e) => {
      if (e.target.type === this.monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position?.lineNumber
        if (line) {
          this.toggleBreakpoint(line)
        }
      }
    })
    
    // Keyboard shortcuts
    this.editor.addCommand(this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.F9, () => {
      const position = this.editor.getPosition()
      if (position) {
        this.toggleBreakpoint(position.lineNumber)
      }
    })
    
    this.editor.addCommand(this.monaco.KeyCode.F5, () => {
      this.start()
    })
  }

  /**
   * 🔴 **TOGGLE BREAKPOINT** - Native Monaco breakpoint management
   */
  toggleBreakpoint(line: number): void {
    if (this.breakpointLines.has(line)) {
      this.breakpointLines.delete(line)
    } else {
      this.breakpointLines.add(line)
    }
    
    this.updateBreakpointDecorations()
    this.notifyStateChange()
  }

  /**
   * 🎨 **UPDATE BREAKPOINT DECORATIONS** - Native Monaco decorations
   */
  private updateBreakpointDecorations(): void {
    const decorations = Array.from(this.breakpointLines).map(line => ({
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'codicon codicon-debug-breakpoint',
        glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` },
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }))

    this.breakpointDecorations = this.editor.deltaDecorations(
      this.breakpointDecorations,
      decorations
    )
  }

  /**
   * ➡️ **UPDATE EXECUTION LINE** - Show current execution line
   */
  private updateExecutionLineDecoration(line: number): void {
    console.log('🎯 [MonacoNativeDebugger] Updating execution line decoration:', {
      line,
      hasOldDecoration: !!this.executionLineDecorationId,
      willShowDecoration: line > 0
    })
    
    const oldDecorations = this.executionLineDecorationId ? [this.executionLineDecorationId] : []

    const decorations = line > 0 ? [{
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'debug-current-line',
        glyphMarginClassName: 'debug-current-line-glyph',
        glyphMarginHoverMessage: { value: `Execution paused at line ${line}` }
      }
    }] : []

    const newDecorationIds = this.editor.deltaDecorations(oldDecorations, decorations)
    this.executionLineDecorationId = newDecorationIds.length > 0 ? newDecorationIds[0] : null
    
    console.log('✅ [MonacoNativeDebugger] Execution line decoration updated:', {
      decorationId: this.executionLineDecorationId,
      decorationsCount: newDecorationIds.length
    })
  }

  /**
   * 🚀 **START DEBUG SESSION** - Enhanced TypeScript-like debugging
   */
  async start(businessRulesCode?: string, pythonCode?: string, sourceMap?: EnhancedBusinessRuleSourceMap): Promise<void>
  async start(businessRulesCode?: string, pythonCode?: string, sourceMap?: EnhancedBusinessRuleSourceMap, simpleSourceMap?: SimpleSourceMap): Promise<void>
  async start(businessRulesCode?: string, pythonCode?: string, sourceMap?: EnhancedBusinessRuleSourceMap, simpleSourceMap?: SimpleSourceMap): Promise<void> {
    try {
      console.log('🚀 [MonacoNativeDebugger] Starting enhanced debug session')

      const businessRules = businessRulesCode || this.editor.getValue()
      
      // Initialize enhanced source map consumer
      if (sourceMap) {
        console.log('🔍 [MonacoNativeDebugger] Received source map:', {
          hasSourceMap: !!sourceMap,
          sourceMapType: typeof sourceMap,
          sourceMapKeys: sourceMap ? Object.keys(sourceMap) : [],
          version: sourceMap?.version,
          hasStatements: !!sourceMap?.statements,
          statementsCount: sourceMap?.statements?.length || 0,
          hasMeta: !!sourceMap?.meta,
          pythonCodeHash: sourceMap?.meta?.pythonCodeHash
        })
        
        try {
          this.sourceMapConsumer = new EnhancedSourceMapConsumer(sourceMap)
          console.log('✅ [MonacoNativeDebugger] Enhanced source map consumer initialized')
        } catch (error) {
          console.error('❌ [MonacoNativeDebugger] Failed to initialize source map consumer:', error)
          console.warn('⚠️ [MonacoNativeDebugger] Falling back to direct line mapping')
          this.sourceMapConsumer = null
        }
      } else {
        console.warn('⚠️ [MonacoNativeDebugger] No enhanced source map provided - debugging will be limited')
      }

      // Generate Python if not provided
      let python = pythonCode
      let generatedSimpleSourceMap: SimpleSourceMap | undefined
      if (!python) {
        const { translateBusinessRulesToPython } = await import('@/lib/editor/python-generation')
        const result = translateBusinessRulesToPython(businessRules, {
          generateComments: true,
          strictMode: false,
          generateSourceMap: true
        })
        python = result.pythonCode
        generatedSimpleSourceMap = result.sourceMap
      }

      // 🗺️ **INITIALIZE SIMPLE SOURCE MAP CONSUMER** - TypeScript-style fallback
      const activeSimpleSourceMap = simpleSourceMap || generatedSimpleSourceMap
      if (activeSimpleSourceMap) {
        try {
          this.simpleSourceMapConsumer = createSimpleSourceMapConsumer(activeSimpleSourceMap)
          console.log('✅ [MonacoNativeDebugger] Simple source map consumer initialized:', {
            mappings: this.simpleSourceMapConsumer.getMappingStats()
          })
        } catch (error) {
          console.error('❌ [MonacoNativeDebugger] Failed to initialize simple source map consumer:', error)
          this.simpleSourceMapConsumer = null
        }
      }

      if (!python) {
        throw new Error('Python code is required for execution')
      }

      // Validate source map hash if available
      if (this.sourceMapConsumer && sourceMap) {
        const currentHash = this.fastHash(python)
        if (!this.sourceMapConsumer.validateHash(currentHash)) {
          console.warn('⚠️ [MonacoNativeDebugger] Source map hash mismatch - regeneration needed')
        }
      }

      // Expand breakpoints using enhanced source map
      const businessBreakpoints = Array.from(this.breakpointLines)
      const expandedBreakpoints = expandBreakpointsWithSourceMap(businessBreakpoints, this.sourceMapConsumer)

      this.updateState({
        status: 'running',
        currentLine: 0,
        variables: [],
        canStep: false,
        canContinue: false
      })

      // Execute with enhanced debugging
      const result = await this.pythonExecutor.execute(python, {
        breakpoints: expandedBreakpoints,
        businessBreakpoints,
        initialVariables: {},
        sourceMap: sourceMap
      })

      if (!result.success) {
        this.updateState({
          status: 'error',
          currentLine: 0,
          variables: [],
          canStep: false,
          canContinue: false,
          error: result.error || 'Python execution failed'
        })
        return
      }

      // 🗺️ **PROCESS DEBUG STEPS** - Use enhanced or simple source map
      if (this.sourceMapConsumer) {
        // Use enhanced source map processing
        await processEnhancedDebugSteps(
          result,
          this.sourceMapConsumer,
          (line) => this.updateExecutionLineDecoration(line),
          (state) => this.updateState(state),
          () => this.executeNextStep(),
          (steps) => { 
            this.enhancedDebugSteps = steps
            this.currentStepIndex = 0
            console.log('🔧 [MonacoNativeDebugger] Enhanced steps stored:', {
              stepCount: steps.length,
              breakpointSteps: steps.filter(s => s.isBreakpoint).length
            })
          }
        )
      } else if (this.simpleSourceMapConsumer) {
        // 🚀 **FALLBACK TO SIMPLE SOURCE MAP** - TypeScript-style debugging
        console.log('🗺️ [MonacoNativeDebugger] Using simple source map for debugging')
        await this.processSimpleDebugSteps(result)
      } else {
        // Final fallback to direct line mapping
        console.warn('⚠️ [MonacoNativeDebugger] No source map available - using direct line mapping')
        await this.processDirectLineMapping(result)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [MonacoNativeDebugger] Enhanced start failed:', errorMessage)
      
      this.updateState({
        status: 'error',
        currentLine: 0,
        variables: [],
        canStep: false,
        canContinue: false,
        error: errorMessage
      })
    }
  }

  /**
   * ⏭️ **EXECUTE NEXT STEP** - Enhanced step execution with source mapping
   */
  private async executeNextStep(): Promise<void> {
    if (this.currentStepIndex >= this.enhancedDebugSteps.length) {
      this.updateState({
        status: 'completed',
        currentLine: 0,
        variables: [],
        canStep: false,
        canContinue: false
      })
      this.updateExecutionLineDecoration(0)
      return
    }

    const step = this.enhancedDebugSteps[this.currentStepIndex]
    
    // Update source map consumer with execution state
    if (this.sourceMapConsumer) {
      this.sourceMapConsumer.updateExecutionState(step)
    }

    // Map to business location and update Monaco
    const businessLocation = this.sourceMapConsumer?.originalPositionFor({ 
      line: step.line 
    })

    const businessLine = businessLocation?.line || 0
    const hasMoreSteps = (this.currentStepIndex + 1) < this.enhancedDebugSteps.length

    // Update state
    this.updateState({
      status: step.isBreakpoint ? 'paused' : 'running',
      currentLine: businessLine,
      variables: this.convertEnhancedVariables(step.variables),
      canStep: hasMoreSteps,
      canContinue: hasMoreSteps
    })

    // Update execution line with enhanced highlighting
    this.executionLineDecorationId = updateMonacoExecutionHighlight(
      this.editor,
      this.monaco,
      step,
      this.sourceMapConsumer,
      this.executionLineDecorationId
    )

    // Handle breakpoints and user interaction
    if (step.isBreakpoint) {
      this.isWaitingForUserAction = true
      return new Promise<void>((resolve) => {
        this.continueExecution = () => {
          this.isWaitingForUserAction = false
          this.continueExecution = null
          this.currentStepIndex++
          resolve()
          this.executeNextStep()
        }
      })
    } else {
      // Pause for step-by-step debugging
      this.isWaitingForUserAction = true
      this.continueExecution = () => {
        this.isWaitingForUserAction = false
        this.continueExecution = null
        this.currentStepIndex++
        this.executeNextStep()
      }
    }
  }

  /**
   * 🔄 **CONVERT ENHANCED VARIABLES** - Convert enhanced variables to debug format
   */
  private convertEnhancedVariables(enhancedVars: Record<string, any>): DebugVariable[] {
    return Object.entries(enhancedVars).map(([name, value]) => ({
      name,
      value,
      type: typeof value,
      scope: 'local' as const,
      changed: false
    }))
  }

  /**
   * 🧮 **FAST HASH** - Simple hash for integrity checking
   */
  private fastHash(input: string): string {
    let h = 0x811c9dc5
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
    }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8)
  }

  // 🎹 **CONTROL METHODS** - Step controls for UI integration

  stepOver(): void {
    if (this.isWaitingForUserAction && this.continueExecution) {
      this.continueExecution()
    }
  }

  stepInto(): void {
    if (this.isWaitingForUserAction && this.continueExecution) {
      this.continueExecution()
    }
  }

  stepOut(): void {
    if (this.isWaitingForUserAction && this.continueExecution) {
      this.continueExecution()
    }
  }

  continue(): void {
    if (this.isWaitingForUserAction && this.continueExecution) {
      this.continueExecution()
    }
  }

  stop(): void {
    console.log('🛑 [MonacoNativeDebugger] Stopping enhanced debug session')
    
    // Reset enhanced execution state
    this.enhancedDebugSteps = []
    this.currentStepIndex = 0
    this.isWaitingForUserAction = false
    this.sourceMapConsumer = null
    
    if (this.continueExecution) {
      this.continueExecution()
      this.continueExecution = null
    }
    
    this.updateState({
      status: 'stopped',
      currentLine: 0,
      variables: [],
      canStep: false,
      canContinue: false
    })
    
    this.updateExecutionLineDecoration(0)
  }

  // 📊 **PUBLIC API** - For React components

  onStateChange(listener: (state: DebugState) => void): () => void {
    this.stateChangeListeners.push(listener)
    return () => {
      const index = this.stateChangeListeners.indexOf(listener)
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1)
      }
    }
  }

  getState(): DebugState {
    return { 
      ...this.currentState,
      canStep: this.currentState.status === 'paused',
      canContinue: this.currentState.status === 'paused'
    }
  }

  getBreakpoints(): number[] {
    return Array.from(this.breakpointLines)
  }

  dispose(): void {
    this.editor.deltaDecorations(this.breakpointDecorations, [])
    if (this.executionLineDecorationId) {
      this.editor.deltaDecorations([this.executionLineDecorationId], [])
    }
    this.stateChangeListeners = []
    this.breakpointLines.clear()
    this.sourceMapConsumer = null
  }

  // 🔧 **PRIVATE HELPERS**

  /**
   * 🗺️ **PROCESS SIMPLE DEBUG STEPS** - TypeScript-style debugging with simple source maps
   */
  private async processSimpleDebugSteps(result: PythonExecutionResult): Promise<void> {
    if (!this.simpleSourceMapConsumer || !result.steps) {
      return
    }

    console.log('🚀 [MonacoNativeDebugger] Processing simple debug steps:', {
      stepCount: result.steps.length,
      hasSourceMap: !!this.simpleSourceMapConsumer
    })

    // Process each execution step
    for (const step of result.steps) {
      // Map Python line to business rule line using simple source map
      const mappingResult = this.simpleSourceMapConsumer.getOriginalLine(step.line)
      const businessLine = mappingResult?.originalLine || step.line

      console.log('🗺️ [SimpleMapping]', {
        pythonLine: step.line,
        businessLine,
        confidence: mappingResult?.confidence || 'fallback'
      })

      // Update execution line decoration
      this.updateExecutionLineDecoration(businessLine)

      // Update state with mapped line
      this.updateState({
        status: step.isBreakpoint ? 'paused' : 'running',
        currentLine: businessLine,
        variables: step.variables || [],
        canStep: step.isBreakpoint,
        canContinue: step.isBreakpoint
      })

      // If this is a breakpoint, wait for user action
      if (step.isBreakpoint) {
        console.log('🛑 [MonacoNativeDebugger] Breakpoint hit at business line:', businessLine)
        break
      }
    }

    // Mark as completed if no breakpoints hit
    if (!result.steps.some(s => s.isBreakpoint)) {
      this.updateState({
        status: 'completed',
        canStep: false,
        canContinue: false
      })
    }
  }

  /**
   * 🔄 **PROCESS DIRECT LINE MAPPING** - Final fallback for debugging
   */
  private async processDirectLineMapping(result: PythonExecutionResult): Promise<void> {
    console.log('🔄 [MonacoNativeDebugger] processDirectLineMapping called:', {
      hasSteps: !!result.steps,
      stepCount: result.steps?.length || 0,
      steps: result.steps?.map(s => ({ line: s.line, isBreakpoint: s.isBreakpoint })) || []
    })
    
    if (!result.steps) {
      console.warn('⚠️ [MonacoNativeDebugger] No steps found in result')
      return
    }

    console.log('🔄 [MonacoNativeDebugger] Using direct line mapping (1:1):', {
      stepCount: result.steps.length
    })

    // Simple 1:1 line mapping as final fallback
    for (const step of result.steps) {
      this.updateExecutionLineDecoration(step.line)
      
      this.updateState({
        status: step.isBreakpoint ? 'paused' : 'running',
        currentLine: step.line,
        variables: step.variables || [],
        canStep: step.isBreakpoint,
        canContinue: step.isBreakpoint
      })

      if (step.isBreakpoint) {
        break
      }
    }

    if (!result.steps.some(s => s.isBreakpoint)) {
      this.updateState({
        status: 'completed',
        canStep: false,
        canContinue: false
      })
    }
  }

  private updateState(newState: Partial<DebugState>): void {
    this.currentState = { ...this.currentState, ...newState }
    this.notifyStateChange()
  }

  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('❌ [MonacoNativeDebugger] State change listener error:', error)
      }
    })
  }
}
