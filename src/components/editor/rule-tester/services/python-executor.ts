"use client"

// 🚀 **PYTHON EXECUTOR** - Clean Python execution for TypeScript-like debugging
// Like TypeScript: execute compiled code, debug original source

export interface PythonDebugStep {
  line: number
  variables: Record<string, any>
  output: string
  error?: string
  isBreakpoint?: boolean
}

export interface PythonExecutionResult {
  success: boolean
  steps: PythonDebugStep[]
  error?: string
  executionTime: number
  diagnostics?: any
}

export interface PythonExecutorOptions {
  // Resolved Python breakpoints (numbers correspond to generated Python file lines)
  breakpoints?: number[]
  // Preferred: business rule breakpoints (mapped on server using sourceMap)
  businessBreakpoints?: number[]
  initialVariables?: Record<string, any>
  timeout?: number
  // Optional: include source map to allow server-side remapping (future)
  sourceMap?: any
}

/**
 * 🎯 **PYTHON EXECUTOR** - Clean, focused Python execution
 * 
 * Key Features:
 * - Delegates to Python backend for reliable execution
 * - Step-by-step debugging with breakpoint support
 * - Variable state tracking at each step
 * - Clean error handling and output capture
 * 
 * Like TypeScript debugging: execute compiled code, debug original source
 */
export class PythonExecutor {
  private readonly apiEndpoint = '/api/python/execute-simple'
  
  /**
   * 🚀 **EXECUTE PYTHON CODE** - Run Python with debugging support
   */
  async execute(
    pythonCode: string, 
    options: PythonExecutorOptions = {}
  ): Promise<PythonExecutionResult> {
    const startTime = Date.now()
    
    try {
      console.log('🐍 [PythonExecutor] Executing Python code:', {
        codeLength: pythonCode.length,
        breakpoints: options.breakpoints?.length || 0,
        businessBreakpoints: options.businessBreakpoints?.length || 0,
        hasInitialVars: Object.keys(options.initialVariables || {}).length > 0
      })

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pythonCode,
          breakpoints: options.businessBreakpoints || options.breakpoints || [],
          variables: options.initialVariables || {}
        })
      })

      if (!response.ok) {
        throw new Error(`Python execution failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('🔍 [PythonExecutor] API Response:', {
        success: result.success,
        hasDebugSteps: !!result.debugSteps,
        debugStepsCount: result.debugSteps?.length || 0,
        hasOutput: !!result.output,
        hasVariables: !!result.variables
      })
      
      // 🚨 **DEEP DEBUG** - Log the ENTIRE response structure
      console.log('🚨 [PythonExecutor] FULL API RESPONSE:', JSON.stringify(result, null, 2))
      
      if (!result.success) {
        throw new Error(result.error || 'Python execution failed')
      }

      // Convert debug API result to our format
      const steps: PythonDebugStep[] = (result.debugSteps || []).map((step: any) => ({
        line: step.line || 1,
        variables: step.variables || {},
        output: step.output || '',
        error: step.error,
        isBreakpoint: true // All debug steps from our API are breakpoints
      }))
      
      console.log('🔧 [PythonExecutor] Converted debug steps:', {
        originalSteps: result.debugSteps?.length || 0,
        convertedSteps: steps.length,
        stepsPreview: steps.map(s => ({ line: s.line, isBreakpoint: s.isBreakpoint, varCount: Object.keys(s.variables).length }))
      })

      // If no debug steps, create a simple completion step
      if (steps.length === 0) {
        steps.push({
          line: 1,
          variables: {},
          output: result.output || '',
          error: result.error,
          isBreakpoint: false
        })
      }

      const executionResult: PythonExecutionResult = {
        success: true,
        steps,
        executionTime: result.executionTime || (Date.now() - startTime)
      }

      console.log('✅ [PythonExecutor] Execution completed:', {
        stepCount: executionResult.steps.length,
        executionTime: executionResult.executionTime
      })

      return executionResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [PythonExecutor] Execution failed:', errorMessage)
      
      return {
        success: false,
        steps: [],
        error: errorMessage,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * 🔄 **EXECUTE WITH RETRY** - Retry failed executions
   */
  async executeWithRetry(
    pythonCode: string, 
    options: PythonExecutorOptions = {},
    maxRetries: number = 2
  ): Promise<PythonExecutionResult> {
    let lastError: string | undefined
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const result = await this.execute(pythonCode, options)
      
      if (result.success) {
        return result
      }
      
      lastError = result.error
      
      if (attempt <= maxRetries) {
        console.warn(`⚠️ [PythonExecutor] Attempt ${attempt} failed, retrying...`)
        await this.delay(1000 * attempt) // Exponential backoff
      }
    }
    
    return {
      success: false,
      steps: [],
      error: lastError || 'Python execution failed after retries',
      executionTime: 0
    }
  }

  /**
   * ⏱️ **DELAY HELPER** - Simple delay for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
