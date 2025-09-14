/**
 * Smart Stepping Types - Core interfaces for block-based debugging
 * 
 * This file defines the fundamental types for smart stepping that focuses on
 * business logic steps rather than Python implementation details.
 */

// =============================================================================
// BUSINESS STEP TYPES
// =============================================================================

export interface BusinessStep {
  blockId: string                    // "CONDITION_CUSTOMER_VIP_1"
  stepType: 'condition' | 'action' | 'loop' | 'assignment' | 'function_call'
  businessLine: number               // Line in business rules
  description: string                // "✅ Customer is VIP"
  variables: Record<string, any>     // Business-relevant variables only
  executionResult: 'success' | 'condition_true' | 'condition_false' | 'loop_iteration' | 'error'
  timestamp: number                  // When this step executed
  executionContext?: any             // Additional context for this step
}

export interface BusinessBlockMap {
  version: 2                         // Smart stepping version
  blocks: Record<string, BlockInfo>  // Block ID → Block info
  metadata: {
    generatedAt: string
    businessRulesHash: string
    pythonCodeHash: string
    totalBlocks: number
  }
}

export interface BlockInfo {
  blockId: string                    // "CONDITION_CUSTOMER_VIP_1"
  blockType: 'condition' | 'action' | 'loop_start' | 'loop_end' | 'assignment' | 'function_call'
  businessLine: number               // Line in business rules
  pythonLines: number[]              // Python lines this block covers
  description: string                // "Check if customer is VIP"
  variables: string[]                // Variables involved in this block
  parentBlockId?: string             // For nested blocks
  childBlockIds?: string[]           // For parent blocks
}

// =============================================================================
// SMART STEPPING EXECUTION TYPES
// =============================================================================

export interface SmartSteppingRequest {
  businessRulesCode: string          // Original business rules
  pythonCode: string                 // Generated Python with instrumentation
  blockMap: BusinessBlockMap         // Block-based source map
  blockBreakpoints?: string[]        // Block IDs to break on
  initialVariables?: Record<string, any>
  executionMode?: 'step-by-step' | 'run-to-breakpoint'
}

export interface SmartSteppingResponse {
  success: boolean
  businessSteps: BusinessStep[]      // ONLY business steps
  executionTime: number
  totalBlocks: number
  executedBlocks: number
  error?: string
  metadata?: {
    pythonExecutionTime: number
    blockProcessingTime: number
    stepsFiltered: number            // How many Python steps were filtered out
  }
}

// =============================================================================
// SMART DEBUG SESSION TYPES
// =============================================================================

export interface SmartDebugSession {
  businessSteps: BusinessStep[]
  currentStepIndex: number
  canStepForward: boolean
  canStepBackward: boolean
  canContinue: boolean
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  hasError: boolean
  error?: string
  executionStartTime?: number
  executionEndTime?: number
  // Step-by-step system properties
  useStepByStep?: boolean
  currentExecutionState?: any
}

export interface SmartDebugControls {
  start: (businessRules: string, pythonCode: string, blockMap: BusinessBlockMap | null) => Promise<void>
  stepForward: () => Promise<void>
  stepBackward: () => Promise<void>
  goToStep: (stepIndex: number) => void
  runToBreakpoint: () => Promise<void>
  stop: () => void
  setBlockBreakpoint: (blockId: string) => void
  removeBlockBreakpoint: (blockId: string) => void
  toggleBlockBreakpoint: (blockId: string) => void
  setBreakpoints?: (breakpoints: Set<number>) => void
}

// =============================================================================
// BLOCK GENERATION TYPES
// =============================================================================

export interface BlockGenerationContext {
  astNode: any                       // AST node being processed
  businessLine: number               // Current business rule line
  pythonLines: number[]              // Generated Python lines
  parentContext?: BlockGenerationContext
  variables: string[]                // Variables in scope
  depth: number                      // Nesting depth
}

export interface GeneratedBlock {
  blockId: string
  blockInfo: BlockInfo
  instrumentationPoints: InstrumentationPoint[]
}

export interface InstrumentationPoint {
  pythonLine: number                 // Where to inject __BUSINESS_STEP__()
  blockId: string                    // Block this instrumentation belongs to
  stepType: BusinessStep['stepType']
  description: string
  variables: string[]
}

// =============================================================================
// BUSINESS STEP DETECTION TYPES
// =============================================================================

export interface StepDetectionRule {
  pattern: RegExp | string           // Pattern to match in business rules
  stepType: BusinessStep['stepType']
  descriptionTemplate: string        // Template for step description
  variableExtractor: (match: RegExpMatchArray | string) => string[]
  isBusinessRelevant: boolean        // Should this generate a business step?
}

export interface DetectedStep {
  businessLine: number
  stepType: BusinessStep['stepType']
  description: string
  variables: string[]
  isBusinessRelevant: boolean
  confidence: number                 // 0-1, how confident we are this is a business step
}

// =============================================================================
// EXECUTION CONTEXT TYPES
// =============================================================================

export interface ExecutionContext {
  currentBlockId: string
  businessLine: number
  variables: Record<string, any>
  executionStack: string[]           // Stack of block IDs
  loopContext?: {
    loopBlockId: string
    iteration: number
    totalIterations?: number
  }
  conditionContext?: {
    conditionBlockId: string
    result: boolean
    evaluatedExpression: string
  }
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface SmartSteppingError {
  type: 'block_generation' | 'instrumentation' | 'execution' | 'mapping'
  message: string
  blockId?: string
  businessLine?: number
  pythonLine?: number
  originalError?: Error
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type BlockId = string
export type BusinessLineNumber = number
export type PythonLineNumber = number

export interface LineMapping {
  businessLine: BusinessLineNumber
  pythonLines: PythonLineNumber[]
  blockId: BlockId
}

export interface VariableSnapshot {
  blockId: BlockId
  timestamp: number
  variables: Record<string, any>
  changedVariables: string[]         // Variables that changed in this step
}
