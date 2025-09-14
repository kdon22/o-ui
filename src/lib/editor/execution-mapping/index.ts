/**
 * Execution Mapping - Smart Stepping Core System
 * 
 * Main exports for the smart stepping system that focuses on business logic
 * rather than Python implementation details.
 */

// Core types
export type {
  BusinessStep,
  BusinessBlockMap,
  BlockInfo,
  SmartSteppingRequest,
  SmartSteppingResponse,
  SmartDebugSession,
  SmartDebugControls,
  BlockGenerationContext,
  GeneratedBlock,
  InstrumentationPoint,
  StepDetectionRule,
  DetectedStep,
  ExecutionContext,
  SmartSteppingError,
  BlockId,
  BusinessLineNumber,
  PythonLineNumber,
  LineMapping,
  VariableSnapshot
} from './types'

// Core classes
export { BlockIdGenerator, blockIdGenerator } from './block-generator'
export { BusinessStepDetector, businessStepDetector } from './business-step-detector'
export { SmartSteppingExecutor, smartSteppingExecutor } from './smart-executor'

// Utility functions
export { createSmartSteppingError, formatExecutionTime } from './smart-executor'
