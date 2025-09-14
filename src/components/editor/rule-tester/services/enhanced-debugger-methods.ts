/**
 * 🎯 **ENHANCED DEBUGGER METHODS** - Clean focused methods for Monaco debugger
 * 
 * Separated from main debugger class for maintainability.
 * No legacy code, no backwards compatibility.
 */

import type * as monaco from 'monaco-editor'
import type { 
  EnhancedDebugStep,
  BusinessLocation,
  PythonBreakpoint
} from '../../types/enhanced-source-map-types'
import type { EnhancedSourceMapConsumer } from '../../source-maps/enhanced-source-map-consumer'
import type { PythonExecutionResult } from './python-executor'
import type { DebugVariable, DebugState } from './monaco-native-debugger'

/**
 * 🔧 **EXPAND BREAKPOINTS WITH SOURCE MAP** - Smart breakpoint expansion
 */
export function expandBreakpointsWithSourceMap(
  businessBreakpoints: number[],
  sourceMapConsumer: EnhancedSourceMapConsumer | null
): number[] {
  if (!sourceMapConsumer) {
    console.warn('⚠️ [EnhancedDebuggerMethods] No source map consumer - using direct line mapping')
    return businessBreakpoints
  }

  const expandedBreakpoints: number[] = []

  for (const businessLine of businessBreakpoints) {
    const expansion = sourceMapConsumer.expandBreakpointsForBusinessLine(businessLine)
    
    console.log(`🔴 [EnhancedDebuggerMethods] Expanded business line ${businessLine}:`, {
      strategy: expansion.strategy,
      count: expansion.expandedCount,
      pythonLines: expansion.pythonBreakpoints.map(bp => bp.line)
    })

    for (const pythonBreakpoint of expansion.pythonBreakpoints) {
      expandedBreakpoints.push(pythonBreakpoint.line)
    }
  }

  return [...new Set(expandedBreakpoints)].sort((a, b) => a - b)
}

/**
 * 🔄 **PROCESS ENHANCED DEBUG STEPS** - Handle enhanced debug steps with source mapping
 */
export async function processEnhancedDebugSteps(
  result: PythonExecutionResult,
  sourceMapConsumer: EnhancedSourceMapConsumer | null,
  updateExecutionLine: (line: number) => void,
  updateState: (state: Partial<DebugState>) => void,
  executeNextStep: () => Promise<void>,
  setEnhancedSteps: (steps: EnhancedDebugStep[]) => void
): Promise<void> {
  console.log('🎯 [EnhancedDebuggerMethods] Processing enhanced debug steps:', {
    stepCount: result.debugSteps?.length || 0,
    hasSourceMap: !!sourceMapConsumer
  })

  if (!result.debugSteps || result.debugSteps.length === 0) {
    updateState({
      status: 'completed',
      currentLine: 0,
      variables: [],
      canStep: false,
      canContinue: false
    })
    updateExecutionLine(0)
    return
  }

  // Convert to enhanced debug steps
  const enhancedSteps = convertToEnhancedDebugSteps(result.debugSteps, sourceMapConsumer)
  
  console.log('✅ [EnhancedDebuggerMethods] Converted to enhanced steps:', {
    originalCount: result.debugSteps.length,
    enhancedCount: enhancedSteps.length,
    businessStepsCount: enhancedSteps.filter(s => s.statementId).length,
    stepsPreview: enhancedSteps.slice(0, 3).map(s => ({
      line: s.line,
      statementId: s.statementId,
      isBreakpoint: s.isBreakpoint
    }))
  })

  // 🔧 **CRITICAL FIX**: Store enhanced steps in the debugger instance
  setEnhancedSteps(enhancedSteps)

  // Start step-by-step execution
  await executeNextStep()
}

/**
 * 🔄 **CONVERT TO ENHANCED DEBUG STEPS** - Convert Python steps to enhanced format
 */
function convertToEnhancedDebugSteps(
  pythonSteps: any[],
  sourceMapConsumer: EnhancedSourceMapConsumer | null
): EnhancedDebugStep[] {
  console.log('🔄 [convertToEnhancedDebugSteps] Converting steps:', {
    inputSteps: pythonSteps.length,
    stepsPreview: pythonSteps.map(s => ({ line: s.line, isBreakpoint: s.isBreakpoint, varCount: Object.keys(s.variables || {}).length }))
  })

  const enhancedSteps: EnhancedDebugStep[] = []

  for (let i = 0; i < pythonSteps.length; i++) {
    const pythonStep = pythonSteps[i]
    
    // Map Python line to business location
    let businessLocation: BusinessLocation | null = null
    let statementId = `unknown_${pythonStep.line}`
    let branchId: string | undefined

    if (sourceMapConsumer) {
      businessLocation = sourceMapConsumer.originalPositionFor({ 
        line: pythonStep.line 
      })
      
      if (businessLocation) {
        statementId = businessLocation.statementId || statementId
        branchId = businessLocation.branchId
      }
    }

    // Filter out Python internals - only include business-relevant steps
    if (shouldIncludeStep(pythonStep, businessLocation)) {
      const enhancedStep: EnhancedDebugStep = {
        line: pythonStep.line,
        statementId,
        branchId,
        variables: pythonStep.variables || {},
        isBreakpoint: pythonStep.isBreakpoint || false,
        executionContext: {
          iterationNumber: extractIterationNumber(pythonStep),
          scopeLevel: businessLocation?.line || 0,
          executionPath: [statementId]
        },
        variableChanges: calculateVariableChanges(pythonStep, enhancedSteps[enhancedSteps.length - 1]),
        output: pythonStep.output
      }

      enhancedSteps.push(enhancedStep)
    }
  }

  return enhancedSteps
}

/**
 * 🚫 **SHOULD INCLUDE STEP** - Filter out Python internals
 */
function shouldIncludeStep(pythonStep: any, businessLocation: BusinessLocation | null): boolean {
  console.log('🔍 [shouldIncludeStep] Evaluating step:', {
    line: pythonStep.line,
    isBreakpoint: pythonStep.isBreakpoint,
    hasBusinessLocation: !!businessLocation,
    variableNames: pythonStep.variables ? Object.keys(pythonStep.variables) : []
  })

  // Always include breakpoint steps
  if (pythonStep.isBreakpoint) {
    console.log('✅ [shouldIncludeStep] Including: isBreakpoint = true')
    return true
  }

  // Include steps that map to business locations
  if (businessLocation) {
    console.log('✅ [shouldIncludeStep] Including: has business location')
    return true
  }

  // Include steps with business variables
  const hasBusinessVariables = pythonStep.variables && 
    Object.keys(pythonStep.variables).some(name => {
      const shouldFilter = shouldFilterOutVariable(name, pythonStep.variables[name])
      console.log(`🔍 [shouldIncludeStep] Variable "${name}": shouldFilter=${shouldFilter}`)
      return !shouldFilter
    })

  console.log(`${hasBusinessVariables ? '✅' : '❌'} [shouldIncludeStep] Final decision: hasBusinessVariables=${hasBusinessVariables}`)
  return hasBusinessVariables
}

/**
 * 🚫 **SHOULD FILTER OUT VARIABLE** - Filter Python internals
 */
function shouldFilterOutVariable(name: string, value: any): boolean {
  // Python internals
  const pythonInternals = [
    'etype', 'value', 'tb', 'limit', 'file', 'chain',
    'exc_type', 'exc_value', 'exc_traceback', 'lookup_lines', 'capture_locals',
    'self', 'cause', 'context', 'klass', 'frame_gen', 'result', 'fnames',
    'co', 'filename', 'lineno', 'f_locals'
  ]

  if (pythonInternals.includes(name)) {
    return true
  }

  // Underscore variables (Python internals)
  if (name.startsWith('_')) {
    return true
  }

  // Complex Python objects
  const valueStr = String(value)
  if (valueStr.includes('<') && valueStr.includes('>') && 
      (valueStr.includes('class') || valueStr.includes('object') || 
       valueStr.includes('TextIOWrapper') || valueStr.includes('traceback'))) {
    return true
  }

  return false
}

/**
 * 🔢 **EXTRACT ITERATION NUMBER** - Extract loop iteration from step
 */
function extractIterationNumber(pythonStep: any): number | undefined {
  // Could analyze variables to detect loop iteration
  // For now, return undefined
  return undefined
}

/**
 * 🔄 **CALCULATE VARIABLE CHANGES** - Detect variable changes between steps
 */
function calculateVariableChanges(
  currentStep: any, 
  previousStep?: EnhancedDebugStep
): { added: string[]; modified: string[]; removed: string[] } | undefined {
  if (!previousStep) {
    return undefined
  }

  const currentVars = new Set(Object.keys(currentStep.variables || {}))
  const previousVars = new Set(Object.keys(previousStep.variables || {}))

  const added = [...currentVars].filter(name => !previousVars.has(name))
  const removed = [...previousVars].filter(name => !currentVars.has(name))
  const modified = [...currentVars].filter(name => 
    previousVars.has(name) && 
    JSON.stringify(currentStep.variables[name]) !== JSON.stringify(previousStep.variables[name])
  )

  return { added, modified, removed }
}

/**
 * 🎯 **MAP PYTHON STEP TO BUSINESS LOCATION** - Enhanced mapping with context
 */
export function mapPythonStepToBusinessLocation(
  pythonStep: any,
  sourceMapConsumer: EnhancedSourceMapConsumer | null
): BusinessLocation | null {
  if (!sourceMapConsumer) {
    return null
  }

  return sourceMapConsumer.originalPositionFor({ 
    line: pythonStep.line,
    column: 1 
  })
}

/**
 * 🎨 **UPDATE MONACO EXECUTION HIGHLIGHT** - Precise business rule highlighting
 */
export function updateMonacoExecutionHighlight(
  editor: monaco.editor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  enhancedStep: EnhancedDebugStep,
  sourceMapConsumer: EnhancedSourceMapConsumer | null,
  executionLineDecorationId: string | null
): string | null {
  // Map to business location
  const businessLocation = sourceMapConsumer?.originalPositionFor({ 
    line: enhancedStep.line 
  })

  if (!businessLocation) {
    console.warn('⚠️ [EnhancedDebuggerMethods] No business location for Python line:', enhancedStep.line)
    return executionLineDecorationId
  }

  // Remove previous decoration
  const oldDecorations = executionLineDecorationId ? [executionLineDecorationId] : []

  // Create new decoration with enhanced context
  const decorations = [{
    range: new monaco.Range(businessLocation.line, 1, businessLocation.line, 1),
    options: {
      isWholeLine: true,
      className: 'editor-line-highlight',
      glyphMarginClassName: 'codicon codicon-debug-stackframe',
      glyphMarginHoverMessage: { 
        value: `Execution paused at line ${businessLocation.line}${enhancedStep.branchId ? ` (${enhancedStep.branchId})` : ''}` 
      }
    }
  }]

  // Apply decoration
  const newDecorationIds = editor.deltaDecorations(oldDecorations, decorations)
  const newDecorationId = newDecorationIds.length > 0 ? newDecorationIds[0] : null

  console.log('🎯 [EnhancedDebuggerMethods] Updated execution highlight:', {
    pythonLine: enhancedStep.line,
    businessLine: businessLocation.line,
    statementId: enhancedStep.statementId,
    branchId: enhancedStep.branchId
  })

  return newDecorationId
}
