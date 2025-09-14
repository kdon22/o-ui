/**
 * Step-by-Step Python Executor
 * 
 * Implements true step-by-step debugging where each "step forward" 
 * executes the next Python statement, not just replays pre-captured steps.
 */

export interface StepExecutionState {
  currentLine: number
  businessLine: number
  variables: Record<string, any>
  isCompleted: boolean
  canStepForward: boolean
  output: string
  error?: string
}

export interface StepExecutionResult {
  success: boolean
  state: StepExecutionState
  executionTime: number
  error?: string
}

/**
 * Step-by-Step Python Executor
 * 
 * Executes Python code one statement at a time for true debugging experience
 */
export class StepByStepExecutor {
  private pythonCode: string = ''
  private businessRulesCode: string = ''
  private runtimeSourceMap: any = null
  private currentState: StepExecutionState | null = null
  private debuggerSession: any = null
  
  /**
   * Initialize executor with code and source map
   */
  async initialize(
    pythonCode: string, 
    businessRulesCode: string, 
    runtimeSourceMap: any
  ): Promise<void> {
    console.log('🚀 [StepByStepExecutor] Initializing:', {
      pythonCodeLength: pythonCode.length,
      businessRulesLength: businessRulesCode.length,
      hasSourceMap: !!runtimeSourceMap
    })
    
    this.pythonCode = pythonCode
    this.businessRulesCode = businessRulesCode
    this.runtimeSourceMap = runtimeSourceMap
    
    // Initialize state
    this.currentState = {
      currentLine: 0,
      businessLine: 0,
      variables: {},
      isCompleted: false,
      canStepForward: true,
      output: ''
    }
    
    // Set up Python debugger session
    await this.setupDebuggerSession()
  }
  
  /**
   * Set up Python debugger session with breakpoints
   */
  private async setupDebuggerSession(): Promise<void> {
    if (!this.runtimeSourceMap?.mappings) {
      throw new Error('Runtime source map not available')
    }
    
    // Extract all instrumented Python lines as breakpoints
    const breakpointLines = this.runtimeSourceMap.mappings.map((m: any) => m.pythonLine)
    
    console.log('🔧 [StepByStepExecutor] Setting up debugger session:', {
      breakpointCount: breakpointLines.length,
      breakpoints: breakpointLines
    })
    
    // Create instrumented Python code with step-by-step control
    const instrumentedCode = this.createStepByStepInstrumentedCode(breakpointLines)
    
    this.debuggerSession = {
      code: instrumentedCode,
      breakpoints: breakpointLines,
      currentBreakpointIndex: -1,
      isInitialized: true
    }
  }
  
  /**
   * Create Python code instrumented for step-by-step execution
   */
  private createStepByStepInstrumentedCode(breakpointLines: number[]): string {
    const lines = this.pythonCode.split('\n')
    const instrumentedLines: string[] = []
    
    // Add step-by-step control infrastructure
    instrumentedLines.push('import sys')
    instrumentedLines.push('import json')
    instrumentedLines.push('import traceback')
    instrumentedLines.push('')
    instrumentedLines.push('# Step-by-step execution control')
    instrumentedLines.push('step_control = {')
    instrumentedLines.push('    "current_step": 0,')
    instrumentedLines.push('    "target_step": 0,')
    instrumentedLines.push('    "steps": [],')
    instrumentedLines.push('    "should_pause": True')
    instrumentedLines.push('}')
    instrumentedLines.push('')
    instrumentedLines.push('def __STEP_CONTROL__(step_id, line_num, locals_dict, context):')
    instrumentedLines.push('    """Control step-by-step execution"""')
    instrumentedLines.push('    step_control["current_step"] += 1')
    instrumentedLines.push('    ')
    instrumentedLines.push('    # Capture step information')
    instrumentedLines.push('    step_info = {')
    instrumentedLines.push('        "step_id": step_id,')
    instrumentedLines.push('        "line": line_num,')
    instrumentedLines.push('        "variables": {k: v for k, v in locals_dict.items() if not k.startswith("__")},')
    instrumentedLines.push('        "context": context')
    instrumentedLines.push('    }')
    instrumentedLines.push('    step_control["steps"].append(step_info)')
    instrumentedLines.push('    ')
    instrumentedLines.push('    # Check if we should pause (step-by-step mode)')
    instrumentedLines.push('    if step_control["current_step"] > step_control["target_step"]:')
    instrumentedLines.push('        # Output current state and pause')
    instrumentedLines.push('        print("__STEP_PAUSE__")')
    instrumentedLines.push('        print(json.dumps(step_info))')
    instrumentedLines.push('        return False  # Pause execution')
    instrumentedLines.push('    ')
    instrumentedLines.push('    return True  # Continue execution')
    instrumentedLines.push('')
    instrumentedLines.push('def step_by_step_main():')
    instrumentedLines.push('    """Main execution wrapper for step-by-step control"""')
    instrumentedLines.push('    try:')
    
    // Add instrumented user code with proper indentation
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()
      
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        instrumentedLines.push(`        ${line}`)
        return
      }
      
      // Check if this line should be instrumented
      if (breakpointLines.includes(lineNumber)) {
        const mapping = this.runtimeSourceMap.mappings.find((m: any) => m.pythonLine === lineNumber)
        if (mapping) {
          // Add step control before the line
          instrumentedLines.push(`        if not __STEP_CONTROL__("STEP_${lineNumber}", ${lineNumber}, locals(), {`)
          instrumentedLines.push(`            "business_line": ${mapping.businessLine},`)
          instrumentedLines.push(`            "description": "${mapping.description.replace(/"/g, '\\"')}",`)
          instrumentedLines.push(`            "confidence": ${mapping.confidence}`)
          instrumentedLines.push(`        }):`)
          instrumentedLines.push(`            return  # Pause execution`)
        }
      }
      
      // Add the original line with proper indentation
      instrumentedLines.push(`        ${line}`)
    })
    
    // Close the try block and add exception handling
    instrumentedLines.push('    except Exception as e:')
    instrumentedLines.push('        print("__STEP_ERROR__")')
    instrumentedLines.push('        print(json.dumps({')
    instrumentedLines.push('            "error": str(e),')
    instrumentedLines.push('            "traceback": traceback.format_exc()')
    instrumentedLines.push('        }))')
    instrumentedLines.push('    finally:')
    instrumentedLines.push('        print("__STEP_COMPLETE__")')
    instrumentedLines.push('        print(json.dumps(step_control))')
    instrumentedLines.push('')
    instrumentedLines.push('# Start step-by-step execution')
    instrumentedLines.push('step_by_step_main()')
    
    return instrumentedLines.join('\n')
  }
  
  /**
   * Execute the next step (single statement)
   */
  async stepForward(): Promise<StepExecutionResult> {
    if (!this.debuggerSession?.isInitialized) {
      throw new Error('Debugger session not initialized')
    }
    
    if (this.currentState?.isCompleted) {
      console.log('⏹️ [StepByStepExecutor] Already completed, returning current state')
      return {
        success: true,
        state: this.currentState,
        executionTime: 0
      }
    }
    
    console.log('👉 [StepByStepExecutor] Executing next step:', {
      currentStepIndex: this.debuggerSession?.currentStepIndex,
      sessionId: this.debuggerSession?.sessionId,
      hasBreakpoints: (this.debuggerSession?.breakpoints?.length || 0) > 0,
      currentState: {
        currentLine: this.currentState?.currentLine,
        businessLine: this.currentState?.businessLine,
        isCompleted: this.currentState?.isCompleted,
        canStepForward: this.currentState?.canStepForward
      }
    })
    
    const startTime = Date.now()
    
    try {
      // Execute Python with step control
      const result = await this.executePythonStep()
      
      if (result.success) {
        this.currentState = result.state
        
        console.log('✅ [StepByStepExecutor] Step executed successfully:', {
          currentLine: result.state.currentLine,
          businessLine: result.state.businessLine,
          variableCount: Object.keys(result.state.variables).length,
          isCompleted: result.state.isCompleted,
          canStepForward: result.state.canStepForward,
          sessionId: this.debuggerSession?.sessionId,
          newStepIndex: this.debuggerSession?.currentStepIndex
        })
      } else {
        console.error('❌ [StepByStepExecutor] Step execution failed:', result.error)
      }
      
      return {
        ...result,
        executionTime: Date.now() - startTime
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [StepByStepExecutor] Step execution failed:', errorMessage)
      
      return {
        success: false,
        state: this.currentState || {
          currentLine: 0,
          businessLine: 0,
          variables: {},
          isCompleted: true,
          canStepForward: false,
          output: ''
        },
        executionTime: Date.now() - startTime,
        error: errorMessage
      }
    }
  }
  
  /**
   * Execute Python step via API
   */
  private async executePythonStep(): Promise<StepExecutionResult> {
    const requestPayload = {
      pythonCode: this.pythonCode,
      businessRulesCode: this.businessRulesCode,
      runtimeSourceMap: this.runtimeSourceMap,
      mode: 'step',
      currentStep: this.debuggerSession?.currentStepIndex || 0,
      breakpoints: this.debuggerSession?.breakpoints || [],
      sessionId: this.debuggerSession?.sessionId
    }
    
    console.log('🌐 [StepByStepExecutor] Making API call to /api/python/debug-step:', {
      mode: requestPayload.mode,
      currentStep: requestPayload.currentStep,
      breakpointCount: requestPayload.breakpoints.length,
      sessionId: requestPayload.sessionId,
      pythonCodeLength: requestPayload.pythonCode?.length || 0,
      businessRulesLength: requestPayload.businessRulesCode?.length || 0,
      hasSourceMap: !!requestPayload.runtimeSourceMap,
      sourceMapType: typeof requestPayload.runtimeSourceMap,
      sourceMapKeys: requestPayload.runtimeSourceMap ? Object.keys(requestPayload.runtimeSourceMap) : [],
      hasMappings: !!(requestPayload.runtimeSourceMap?.mappings),
      mappingsLength: requestPayload.runtimeSourceMap?.mappings?.length || 0
    })
    
    const response = await fetch('/api/python/debug-step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })
    
    if (!response.ok) {
      console.error('❌ [StepByStepExecutor] API request failed:', {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Python step execution failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    console.log('📨 [StepByStepExecutor] API response received:', {
      success: result.success,
      currentStep: result.currentStep,
      currentLine: result.currentLine,
      businessLine: result.businessLine,
      isCompleted: result.isCompleted,
      canStepForward: result.canStepForward,
      variableCount: Object.keys(result.variables || {}).length,
      sessionId: result.sessionId,
      executionTime: result.executionTime,
      error: result.error,
      outputLength: result.output?.length || 0
    })
    
    if (!result.success) {
      console.error('❌ [StepByStepExecutor] API returned error:', result.error)
      throw new Error(result.error || 'Python step execution failed')
    }
    
    // Update debugger session state
    const previousStepIndex = this.debuggerSession?.currentStepIndex
    if (this.debuggerSession) {
      this.debuggerSession.currentStepIndex = result.currentStep
      this.debuggerSession.sessionId = result.sessionId
      
      console.log('🔄 [StepByStepExecutor] Updated session state:', {
        previousStepIndex,
        newStepIndex: result.currentStep,
        sessionId: result.sessionId
      })
    }
    
    // Parse the step result
    const stepState: StepExecutionState = {
      currentLine: result.currentLine || 0,
      businessLine: result.businessLine || 0,
      variables: result.variables || {},
      isCompleted: result.isCompleted || false,
      canStepForward: result.canStepForward || false,
      output: result.output || '',
      error: result.error
    }
    
    return {
      success: true,
      state: stepState,
      executionTime: result.executionTime || 0
    }
  }
  
  /**
   * Continue execution to next breakpoint (or completion)
   */
  async continueExecution(): Promise<StepExecutionResult> {
    if (!this.debuggerSession?.isInitialized) {
      throw new Error('Debugger session not initialized')
    }
    
    if (this.currentState?.isCompleted) {
      return {
        success: true,
        state: this.currentState,
        executionTime: 0
      }
    }
    
    console.log('▶️ [StepByStepExecutor] Continuing execution to next breakpoint')
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/python/debug-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pythonCode: this.pythonCode,
          businessRulesCode: this.businessRulesCode,
          runtimeSourceMap: this.runtimeSourceMap,
          mode: 'continue',
          currentStep: this.debuggerSession?.currentStepIndex || 0,
          breakpoints: this.debuggerSession?.breakpoints || [],
          sessionId: this.debuggerSession?.sessionId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Python continue execution failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Python continue execution failed')
      }
      
      // Update debugger session state
      if (this.debuggerSession) {
        this.debuggerSession.currentStepIndex = result.currentStep
        this.debuggerSession.sessionId = result.sessionId
      }
      
      // Parse the result
      const stepState: StepExecutionState = {
        currentLine: result.currentLine || 0,
        businessLine: result.businessLine || 0,
        variables: result.variables || {},
        isCompleted: result.isCompleted || false,
        canStepForward: result.canStepForward || false,
        output: result.output || '',
        error: result.error
      }
      
      this.currentState = stepState
      
      console.log('✅ [StepByStepExecutor] Continue execution completed:', {
        currentLine: stepState.currentLine,
        businessLine: stepState.businessLine,
        isCompleted: stepState.isCompleted,
        hitBreakpoint: result.hitBreakpoint
      })
      
      return {
        success: true,
        state: stepState,
        executionTime: Date.now() - startTime
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [StepByStepExecutor] Continue execution failed:', errorMessage)
      
      return {
        success: false,
        state: this.currentState || {
          currentLine: 0,
          businessLine: 0,
          variables: {},
          isCompleted: true,
          canStepForward: false,
          output: ''
        },
        executionTime: Date.now() - startTime,
        error: errorMessage
      }
    }
  }
  
  /**
   * Set breakpoints for continue mode
   */
  setBreakpoints(breakpoints: number[]): void {
    console.log('🔴 [StepByStepExecutor] Setting breakpoints:', breakpoints)
    
    if (this.debuggerSession) {
      this.debuggerSession.breakpoints = breakpoints
    }
  }
  
  /**
   * Get current execution state
   */
  getCurrentState(): StepExecutionState | null {
    return this.currentState
  }
  
  /**
   * Reset executor to beginning
   */
  async reset(): Promise<void> {
    console.log('🔄 [StepByStepExecutor] Resetting to beginning')
    
    if (this.debuggerSession) {
      this.debuggerSession.currentBreakpointIndex = -1
    }
    
    this.currentState = {
      currentLine: 0,
      businessLine: 0,
      variables: {},
      isCompleted: false,
      canStepForward: true,
      output: ''
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    console.log('🧹 [StepByStepExecutor] Cleaning up resources')
    
    this.debuggerSession = null
    this.currentState = null
    this.runtimeSourceMap = null
  }
}

// Export singleton instance
export const stepByStepExecutor = new StepByStepExecutor()
