/**
 * Smart Stepping Executor - Execute business steps instead of Python lines
 * 
 * Replaces the traditional PythonExecutor with smart stepping that focuses
 * on business logic rather than implementation details.
 */

import type {
  BusinessStep,
  BusinessBlockMap,
  SmartSteppingRequest,
  SmartSteppingResponse,
  SmartSteppingError
} from './types'

// =============================================================================
// SMART STEPPING EXECUTOR CLASS
// =============================================================================

export class SmartSteppingExecutor {
  private readonly apiEndpoint = '/api/python/debug-execute'
  private currentExecution: AbortController | null = null
  
  /**
   * Execute business rules and return only business-relevant steps
   */
  async executeBusinessSteps(
    businessRulesCode: string,
    pythonCode: string,
    blockMap: BusinessBlockMap,
    options: {
      blockBreakpoints?: string[]
      initialVariables?: Record<string, any>
      executionMode?: 'step-by-step' | 'run-to-breakpoint'
      timeout?: number
    } = {}
  ): Promise<SmartSteppingResponse> {
    const startTime = Date.now()
    
    try {
      // Cancel any existing execution
      if (this.currentExecution) {
        this.currentExecution.abort()
      }
      
      // Create new abort controller for this execution
      this.currentExecution = new AbortController()
      
      console.log('🚀 [SmartSteppingExecutor] Starting smart stepping execution:', {
        businessRulesLength: businessRulesCode.length,
        pythonCodeLength: pythonCode.length,
        totalBlocks: blockMap?.metadata?.totalBlocks || 0,
        blockBreakpoints: options.blockBreakpoints?.length || 0,
        executionMode: options.executionMode || 'step-by-step'
      })
      
      const request: SmartSteppingRequest = {
        businessRulesCode,
        pythonCode,
        blockMap,
        blockBreakpoints: options.blockBreakpoints,
        initialVariables: options.initialVariables || {},
        executionMode: options.executionMode || 'step-by-step'
      }
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: this.currentExecution.signal,
        // Add timeout
        ...(options.timeout && {
          signal: AbortSignal.timeout(options.timeout)
        })
      })
      
      if (!response.ok) {
        throw new Error(`Smart stepping execution failed: ${response.status} ${response.statusText}`)
      }
      
      const result: SmartSteppingResponse = await response.json()
      
      console.log('✅ [SmartSteppingExecutor] Smart stepping completed:', {
        success: result.success,
        businessStepsCount: result.businessSteps?.length || 0,
        executedBlocks: result.executedBlocks,
        totalBlocks: result.totalBlocks,
        executionTime: result.executionTime,
        stepsFiltered: result.metadata?.stepsFiltered || 0
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Smart stepping execution failed')
      }
      
      // Validate and enhance the response
      const enhancedResponse = this.enhanceResponse(result, startTime)
      
      return enhancedResponse
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏹️ [SmartSteppingExecutor] Execution cancelled')
        throw new Error('Execution cancelled by user')
      }
      
      console.error('❌ [SmartSteppingExecutor] Execution failed:', error)
      
      return {
        success: false,
        businessSteps: [],
        executionTime,
        totalBlocks: blockMap?.metadata?.totalBlocks || 0,
        executedBlocks: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    } finally {
      this.currentExecution = null
    }
  }
  
  /**
   * Execute with retry logic for reliability
   */
  async executeWithRetry(
    businessRulesCode: string,
    pythonCode: string,
    blockMap: BusinessBlockMap,
    options: Parameters<typeof this.executeBusinessSteps>[3] & {
      maxRetries?: number
      retryDelay?: number
    } = {}
  ): Promise<SmartSteppingResponse> {
    const maxRetries = options.maxRetries || 2
    const retryDelay = options.retryDelay || 1000
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeBusinessSteps(
          businessRulesCode,
          pythonCode,
          blockMap,
          options
        )
        
        if (result.success) {
          return result
        }
        
        lastError = new Error(result.error || 'Execution failed')
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on user cancellation
        if (lastError.message.includes('cancelled')) {
          throw lastError
        }
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`⏳ [SmartSteppingExecutor] Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
    
    throw lastError || new Error('All retry attempts failed')
  }
  
  /**
   * Cancel current execution
   */
  cancel(): void {
    if (this.currentExecution) {
      console.log('⏹️ [SmartSteppingExecutor] Cancelling execution')
      this.currentExecution.abort()
      this.currentExecution = null
    }
  }
  
  /**
   * Check if execution is currently running
   */
  isRunning(): boolean {
    return this.currentExecution !== null
  }
  
  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================
  
  private enhanceResponse(
    response: SmartSteppingResponse,
    startTime: number
  ): SmartSteppingResponse {
    // Add client-side timing
    const clientExecutionTime = Date.now() - startTime
    
    // Validate business steps
    const validatedSteps = this.validateBusinessSteps(response.businessSteps || [])
    
    // Add step indices for navigation
    const enhancedSteps = validatedSteps.map((step, index) => ({
      ...step,
      stepIndex: index,
      isFirst: index === 0,
      isLast: index === validatedSteps.length - 1
    }))
    
    return {
      ...response,
      businessSteps: enhancedSteps,
      metadata: {
        ...response.metadata,
        clientExecutionTime,
        totalExecutionTime: clientExecutionTime,
        validSteps: enhancedSteps.length,
        invalidStepsFiltered: (response.businessSteps?.length || 0) - enhancedSteps.length
      }
    }
  }
  
  private validateBusinessSteps(steps: BusinessStep[]): BusinessStep[] {
    return steps.filter(step => {
      // Validate required fields
      if (!step.blockId || !step.stepType || !step.description) {
        console.warn('⚠️ [SmartSteppingExecutor] Invalid step filtered out:', step)
        return false
      }
      
      // Validate step type
      const validStepTypes = ['condition', 'action', 'loop', 'assignment', 'function_call']
      if (!validStepTypes.includes(step.stepType)) {
        console.warn('⚠️ [SmartSteppingExecutor] Invalid step type:', step.stepType)
        return false
      }
      
      // Validate execution result
      const validResults = ['success', 'condition_true', 'condition_false', 'loop_iteration', 'error']
      if (!validResults.includes(step.executionResult)) {
        console.warn('⚠️ [SmartSteppingExecutor] Invalid execution result:', step.executionResult)
        return false
      }
      
      return true
    })
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create error object with context
 */
export function createSmartSteppingError(
  type: SmartSteppingError['type'],
  message: string,
  context?: {
    blockId?: string
    businessLine?: number
    pythonLine?: number
    originalError?: Error
  }
): SmartSteppingError {
  return {
    type,
    message,
    ...context
  }
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  
  const seconds = (milliseconds / 1000).toFixed(1)
  return `${seconds}s`
}

/**
 * Create a singleton instance for the application
 */
export const smartSteppingExecutor = new SmartSteppingExecutor()
