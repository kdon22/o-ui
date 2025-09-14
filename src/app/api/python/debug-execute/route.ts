/**
 * Smart Stepping API - Fresh debug-execute endpoint
 * 
 * Single API endpoint for smart stepping that returns business logic steps
 * instead of Python implementation details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import type {
  SmartSteppingRequest,
  SmartSteppingResponse,
  BusinessStep,
  BusinessBlockMap
} from '@/lib/editor/execution-mapping/types'
import { runtimeSourceMapGenerator } from '@/lib/debug/runtime-source-map'
import { variableDetector } from '@/lib/debug/variable-detector'

// =============================================================================
// SMART STEPPING API ENDPOINT
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: SmartSteppingRequest = await request.json()
    const {
      businessRulesCode,
      pythonCode,
      blockMap,
      blockBreakpoints = [],
      initialVariables = {},
      executionMode = 'step-by-step'
    } = body
    
    // Validate request
    if (!pythonCode?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Python code is required',
        businessSteps: [],
        executionTime: Date.now() - startTime,
        totalBlocks: 0,
        executedBlocks: 0
      }, { status: 400 })
    }
    
    console.log('🚀 [SmartSteppingAPI] Starting smart stepping execution:', {
      businessRulesLength: businessRulesCode?.length || 0,
      pythonCodeLength: pythonCode.length,
      blockBreakpoints: blockBreakpoints.length,
      executionMode,
      pythonCodePreview: pythonCode.substring(0, 200) + (pythonCode.length > 200 ? '...' : ''),
      usingRuntimeSourceMap: true
    })
    
    // 🗺️ **GENERATE RUNTIME SOURCE MAP** - Create accurate mappings from actual code
    let runtimeSourceMap = null
    let instrumentationPoints: number[] = []
    
    if (businessRulesCode) {
      try {
        console.log('🗺️ [SmartSteppingAPI] Generating runtime source map from actual code')
        runtimeSourceMap = await runtimeSourceMapGenerator.generateForDebugging(
          pythonCode,
          businessRulesCode,
          { enableCaching: true }
        )
        
        instrumentationPoints = runtimeSourceMapGenerator.getInstrumentationPoints(runtimeSourceMap)
        
        console.log('✅ [SmartSteppingAPI] Runtime source map generated:', {
          mappings: runtimeSourceMap.mappings.length,
          instrumentationPoints: instrumentationPoints.length,
          generationTime: `${runtimeSourceMap.generationTime}ms`,
          averageConfidence: Math.round(runtimeSourceMap.mappings.reduce((sum, m) => sum + m.confidence, 0) / runtimeSourceMap.mappings.length * 100) + '%'
        })
      } catch (error) {
        console.warn('⚠️ [SmartSteppingAPI] Runtime source map generation failed:', error)
      }
    }
    
    // Execute Python with runtime source map instrumentation
    const pythonResult = await executeInstrumentedPython(
      pythonCode,
      runtimeSourceMap,
      blockBreakpoints,
      initialVariables
    )
    
    if (!pythonResult.success) {
      console.error('❌ [SmartSteppingAPI] Python execution failed - no fallback, returning error')
      
      return NextResponse.json({
        success: false,
        error: pythonResult.error || 'Python execution failed',
        businessSteps: [],
        executionTime: Date.now() - startTime,
        totalBlocks: runtimeSourceMap?.mappings?.length || 0,
        executedBlocks: 0,
        metadata: {
          pythonExecutionTime: 0,
          blockProcessingTime: Date.now() - startTime,
          stepsFiltered: 0,
          pythonError: pythonResult.error
        }
      }, { status: 500 })
    }
    
    // 🔍 **PROCESS PYTHON STEPS** - Apply dynamic variable detection and runtime source mapping
    console.log('🔍 [SmartSteppingAPI] Processing Python steps with dynamic variable detection')
    const businessSteps = await processStepsWithRuntimeMapping(
      pythonResult.steps || [],
      runtimeSourceMap
    )
    
    // ❌ **NO FALLBACK** - If no business steps generated, return error
    if (businessSteps.length === 0) {
      console.error('❌ [SmartSteppingAPI] No business steps generated from Python execution')
      console.log('🔍 [SmartSteppingAPI] Debug info:', {
        pythonStepsCount: pythonResult.steps.length,
        pythonStepsPreview: pythonResult.steps.slice(0, 3),
        hasRuntimeSourceMap: !!runtimeSourceMap,
        runtimeMappings: runtimeSourceMap ? runtimeSourceMap.mappings.length : 0
      })
      
      return NextResponse.json({
        success: false,
        error: 'No business steps were generated during execution. The instrumentation may not be working correctly.',
        businessSteps: [],
        executionTime: Date.now() - startTime,
        totalBlocks: runtimeSourceMap?.mappings?.length || 0,
        executedBlocks: 0,
        metadata: {
          pythonExecutionTime: pythonResult.executionTime,
          blockProcessingTime: Date.now() - startTime - pythonResult.executionTime,
          stepsFiltered: 0, // Deprecated: business step detector removed
          pythonStepsReceived: pythonResult.steps.length,
          instrumentationIssue: true
        }
      }, { status: 500 })
    }
    
    const response: SmartSteppingResponse = {
      success: true,
      businessSteps,
      executionTime: Date.now() - startTime,
      totalBlocks: runtimeSourceMap?.mappings?.length || 0,
      executedBlocks: businessSteps.length,
      metadata: {
        pythonExecutionTime: pythonResult.executionTime,
        blockProcessingTime: Date.now() - startTime - pythonResult.executionTime,
        stepsFiltered: 0, // Deprecated: business step detector removed
        runtimeSourceMapGenerated: !!runtimeSourceMap,
        sourceMapGenerationTime: runtimeSourceMap?.generationTime || 0,
        mappingCount: runtimeSourceMap?.mappings?.length || 0
      }
    }
    
    console.log('✅ [SmartSteppingAPI] Smart stepping completed:', {
      businessStepsCount: businessSteps.length,
      executionTime: response.executionTime,
      totalBlocks: response.totalBlocks,
      executedBlocks: response.executedBlocks,
      runtimeSourceMapUsed: !!runtimeSourceMap,
      sourceMapGenerationTime: runtimeSourceMap?.generationTime || 0
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ [SmartSteppingAPI] Execution failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      businessSteps: [],
      executionTime: Date.now() - startTime,
      totalBlocks: 0,
      executedBlocks: 0
    }, { status: 500 })
  }
}

// =============================================================================
// PYTHON EXECUTION WITH INSTRUMENTATION
// =============================================================================

interface PythonExecutionResult {
  success: boolean
  steps: any[]
  executionTime: number
  error?: string
}

async function executeInstrumentedPython(
  pythonCode: string,
  blockMap: BusinessBlockMap | undefined,
  blockBreakpoints: string[],
  initialVariables: Record<string, any>
): Promise<PythonExecutionResult> {
  const executionStartTime = Date.now()
  let tempFile: string | null = null
  
  try {
    // Create temporary Python file
    tempFile = join(tmpdir(), `smart_stepping_${randomUUID()}.py`)
    
    // Create instrumented Python code with smart stepping
    console.log('🔧 [Instrumentation] Starting code instrumentation:', {
      inputCodeLength: pythonCode.length,
      hasBlockMap: !!blockMap,
      blockBreakpointsCount: blockBreakpoints.length
    })
    
    const instrumentedCode = createSmartSteppingWrapper(
      pythonCode,
      blockMap,
      blockBreakpoints,
      initialVariables
    )
    
    console.log('🔧 [SmartSteppingAPI] Generated instrumented code:', {
      instrumentedCodeLength: instrumentedCode.length,
      instrumentedCodePreview: instrumentedCode.substring(0, 800) + (instrumentedCode.length > 800 ? '...' : ''),
      tempFile
    })
    
    // 🔍 **INSTRUMENTED CODE VALIDATION** - Check for indentation issues
    console.log('🔍 [Instrumentation] Instrumented code validation:')
    const instrumentedLines = instrumentedCode.split('\n')
    instrumentedLines.forEach((line, index) => {
      const indent = line.match(/^(\s*)/)?.[1] || ''
      if (index < 20 || line.includes('IndentationError') || line.trim().startsWith('air =')) {
        console.log(`🔍 [Instrumentation] Line ${index + 1}: "${line}" → indent: "${indent}" (${indent.length} chars)`)
      }
    })
    
    await writeFile(tempFile, instrumentedCode, 'utf8')
    
    // Execute Python with smart stepping
    const result = await executePythonWithSmartStepping(tempFile)
    
    return {
      success: true,
      steps: result.steps,
      executionTime: Date.now() - executionStartTime
    }
    
  } catch (error) {
    console.error('❌ [SmartSteppingAPI] Python execution failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pythonCodeLength: pythonCode.length,
      hasBlockMap: !!blockMap
    })
    
    return {
      success: false,
      steps: [],
      executionTime: Date.now() - executionStartTime,
      error: error instanceof Error ? error.message : String(error)
    }
  } finally {
    // Clean up temporary file
    if (tempFile) {
      try {
        await unlink(tempFile)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError)
      }
    }
  }
}

/**
 * 🔍 **PROCESS STEPS WITH RUNTIME MAPPING** - Apply dynamic variable detection and source mapping
 */
async function processStepsWithRuntimeMapping(
  pythonSteps: any[],
  runtimeSourceMap: any | null
): Promise<BusinessStep[]> {
  console.log('🔍 [processStepsWithRuntimeMapping] Processing steps:', {
    pythonSteps: pythonSteps.length,
    hasSourceMap: !!runtimeSourceMap
  })
  
  const businessSteps: BusinessStep[] = []
  
  for (const pythonStep of pythonSteps) {
    // Extract basic step info
    const blockId = pythonStep.block_id || `STEP_${pythonStep.line || businessSteps.length + 1}`
    const pythonLine = pythonStep.line || 0
    
    // Get business line from runtime source map
    let businessLine = pythonLine // Default fallback
    let description = `Execute Python line ${pythonLine}`
    
    if (runtimeSourceMap) {
      const mapping = runtimeSourceMap.mappings.find((m: any) => m.pythonLine === pythonLine)
      if (mapping) {
        businessLine = mapping.businessLine
        description = mapping.description
      }
    }
    
    // Apply dynamic variable detection
    const relevantVariables = variableDetector.detectRelevantVariables({
      executionVariables: pythonStep.variables || {},
      contextVariables: pythonStep.execution_context || {}
    })
    
    // Convert to the format expected by the frontend
    const processedVariables: Record<string, any> = {}
    relevantVariables.forEach(varInfo => {
      processedVariables[varInfo.name] = varInfo.value
    })
    
    // Create business step
    const businessStep: BusinessStep = {
      blockId,
      businessLine,
      pythonLine,
      description,
      variables: processedVariables,
      timestamp: pythonStep.timestamp || Date.now(),
      executionContext: {
        business_line: businessLine,
        block_type: 'runtime_mapped',
        description,
        confidence: runtimeSourceMap ? 
          runtimeSourceMap.mappings.find((m: any) => m.pythonLine === pythonLine)?.confidence || 0.5 : 0.5
      }
    }
    
    businessSteps.push(businessStep)
  }
  
  console.log('✅ [processStepsWithRuntimeMapping] Processed business steps:', {
    businessSteps: businessSteps.length,
    averageVariablesPerStep: businessSteps.reduce((sum, step) => sum + Object.keys(step.variables).length, 0) / businessSteps.length
  })
  
  return businessSteps
}

/**
 * 🔧 **INSTRUMENT USER CODE** - Add __BUSINESS_STEP__ calls based on runtime source map
 */
function instrumentUserCodeWithBusinessSteps(
  userCode: string, 
  runtimeSourceMap: any | null
): string {
  if (!runtimeSourceMap || !runtimeSourceMap.mappings) {
    console.warn('⚠️ [Instrumentation] No runtime source map provided - returning uninstrumented code')
    return userCode
  }

  console.log('🔧 [Instrumentation] Instrumenting user code with runtime source map:', {
    totalMappings: runtimeSourceMap.mappings.length,
    instrumentationPoints: runtimeSourceMap.mappings.filter((m: any) => m.confidence > 0.5).length
  })

  const lines = userCode.split('\n')
  const instrumentedLines: string[] = []

  // Instead of mapping by line numbers, let's instrument based on actual Python content
  // Look for significant Python statements and add instrumentation
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1
    const trimmedLine = line.trim()

    // Add the original line
    instrumentedLines.push(line)

    // Add __BUSINESS_STEP__ calls for significant Python statements
    // Skip empty lines, comments, imports, and function/class definitions
    const shouldInstrument = trimmedLine && 
        trimmedLine !== '' &&
        !trimmedLine.startsWith('#') && 
        !trimmedLine.startsWith('//') &&
        !trimmedLine.startsWith('import ') &&
        !trimmedLine.startsWith('from ') &&
        !trimmedLine.endsWith(':') // Don't instrument class/function definitions
    
    console.log(`🔍 [Instrumentation] Line ${lineNumber}: "${line}" → trimmed: "${trimmedLine}" → shouldInstrument: ${shouldInstrument}`)
    
    if (shouldInstrument) {
      
      const indent = line.match(/^(\s*)/)?.[1] || ''
      
      // Find a matching mapping for this Python line number
      const mapping = runtimeSourceMap.mappings.find((m: any) => m.pythonLine === lineNumber)
      
      if (!mapping || mapping.confidence < 0.5) {
        console.log(`⚠️ [Instrumentation] Skipping Python line ${lineNumber} - no high-confidence mapping available`)
        continue // Skip lines without good mapping
      }
      
      console.log(`✅ [Instrumentation] Found runtime mapping: Python line ${lineNumber} → business line ${mapping.businessLine} (confidence: ${Math.round(mapping.confidence * 100)}%)`)
      
      // Create the business step call using runtime mapping
      const businessStepCall = `${indent}__BUSINESS_STEP__("RUNTIME_${lineNumber}", locals(), {
${indent}    "business_line": ${mapping.businessLine},
${indent}    "block_type": "runtime_mapped",
${indent}    "description": "${mapping.description.replace(/"/g, '\\"')}",
${indent}    "confidence": ${mapping.confidence}
${indent}})`

      instrumentedLines.push(businessStepCall)
      
      console.log(`🔧 [Instrumentation] Added runtime business step for Python line ${lineNumber}: business line ${mapping.businessLine} → "${trimmedLine}"`)
    }
  }

  const instrumentedCode = instrumentedLines.join('\n')
  
  console.log('✅ [Instrumentation] User code instrumentation completed:', {
    originalLines: lines.length,
    instrumentedLines: instrumentedLines.length,
    businessStepsAdded: instrumentedLines.filter(line => line.includes('__BUSINESS_STEP__')).length
  })

  return instrumentedCode
}

/**
 * 🔍 **HELPER FUNCTIONS** - Content matching and block type detection
 */
function isLineContentMatch(pythonLine: string, blockDescription: string): boolean {
  // Simple content matching - look for key terms
  const pythonLower = pythonLine.toLowerCase()
  const descLower = blockDescription.toLowerCase()
  
  // Extract key words from both
  const pythonWords: string[] = pythonLower.match(/\b\w+\b/g) || []
  const descWords: string[] = descLower.match(/\b\w+\b/g) || []
  
  // Check for common words (excluding common terms)
  const excludeWords: string[] = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'if', 'then', 'else']
  const commonWords = pythonWords.filter((word: string) => 
    descWords.includes(word) && 
    !excludeWords.includes(word)
  )
  
  return commonWords.length >= 2 // Require at least 2 matching words
}

function getBlockTypeFromPythonLine(pythonLine: string): string {
  if (pythonLine.includes('if ') || pythonLine.includes('elif ') || pythonLine.includes('else:')) {
    return 'condition'
  }
  if (pythonLine.includes('for ') || pythonLine.includes('while ')) {
    return 'loop'
  }
  if (pythonLine.includes('=') && !pythonLine.includes('==') && !pythonLine.includes('!=')) {
    return 'assignment'
  }
  if (pythonLine.includes('(') && pythonLine.includes(')')) {
    return 'function_call'
  }
  return 'action'
}

function createSmartSteppingWrapper(
  userCode: string,
  blockMap: BusinessBlockMap | undefined,
  blockBreakpoints: string[],
  initialVariables: Record<string, any>
): string {
  console.log('🔧 [Instrumentation] createSmartSteppingWrapper called:', {
    userCodeLength: userCode.length,
    userCodePreview: userCode.substring(0, 200),
    hasBlockMap: !!blockMap,
    initialVariablesCount: Object.keys(initialVariables).length
  })
  
  // 🔍 **USER CODE VALIDATION** - Check input indentation
  console.log('🔍 [Instrumentation] User code validation:')
  const userLines = userCode.split('\n')
  userLines.forEach((line, index) => {
    const indent = line.match(/^(\s*)/)?.[1] || ''
    console.log(`🔍 [Instrumentation] User Line ${index + 1}: "${line}" → indent: "${indent}" (${indent.length} chars)`)
  })
  
  const variablesSetup = Object.entries(initialVariables)
    .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
    .join('\n')
    
  console.log('🔧 [Instrumentation] Variables setup:', { variablesSetup })
  
  // 🔍 **INSTRUMENT USER CODE** - Add __BUSINESS_STEP__ calls based on BlockMap
  const instrumentedUserCode = instrumentUserCodeWithBusinessSteps(userCode, blockMap)
  
  // 🔍 **CRITICAL INDENTATION FIX** - Indent instrumented code properly
  const indentedUserCode = instrumentedUserCode
    .split('\n')
    .map(line => line.trim() ? `        ${line}` : line) // Add 8 spaces for function indentation
    .join('\n')
    
  console.log('🔍 [Instrumentation] Indented instrumented code:')
  const indentedLines = indentedUserCode.split('\n')
  indentedLines.forEach((line, index) => {
    const indent = line.match(/^(\s*)/)?.[1] || ''
    if (index < 20 || line.includes('__BUSINESS_STEP__')) { // Show first 20 lines and all business step calls
      console.log(`🔍 [Instrumentation] Indented Line ${index + 1}: "${line}" → indent: "${indent}" (${indent.length} chars)`)
    }
  })
  
  return `
import sys
import json
import traceback
from typing import Any, Dict, List

# Smart stepping state
business_steps = []
current_block_id = None
execution_context = {}

def _serialize_collection(obj):
    """Recursively serialize collections to JSON-safe format - SAFE VERSION"""
    try:
        if isinstance(obj, dict):
            result = {}
            for k, v in obj.items():
                try:
                    result[k] = _serialize_value(v)
                except:
                    result[k] = f"<{type(v).__name__}: not serializable>"
            return result
        elif isinstance(obj, (list, tuple)):
            result = []
            for item in obj:
                try:
                    result.append(_serialize_value(item))
                except:
                    result.append(f"<{type(item).__name__}: not serializable>")
            return result
        else:
            return _serialize_value(obj)
    except Exception as e:
        return f"<collection serialization error: {type(obj).__name__}>"

def _serialize_value(value):
    """Serialize a single value to JSON-safe format - NEVER THROWS EXCEPTIONS"""
    try:
        if isinstance(value, (str, int, float, bool, type(None))):
            return value
        elif isinstance(value, type):
            # Handle class definitions safely
            try:
                return f"<class '{value.__name__}'>"
            except:
                return "<class: unknown>"
        elif callable(value):
            # Handle functions safely
            try:
                func_name = getattr(value, '__name__', 'anonymous')
                return f"<function '{func_name}'>"
            except:
                return "<function: unknown>"
        elif isinstance(value, (list, tuple)):
            # Handle lists/tuples recursively but safely
            try:
                return [_serialize_value(item) for item in value]
            except:
                return f"<{type(value).__name__}: {len(value)} items>"
        elif isinstance(value, dict):
            # Handle dictionaries recursively but safely
            try:
                return {k: _serialize_value(v) for k, v in value.items()}
            except:
                return f"<dict: {len(value)} items>"
        elif hasattr(value, '__dict__'):
            # Handle class instances - show their properties
            try:
                instance_vars = {}
                for k, v in value.__dict__.items():
                    if not k.startswith('_'):
                        try:
                            instance_vars[k] = _serialize_value(v)
                        except:
                            instance_vars[k] = f"<{type(v).__name__}: not serializable>"
                
                return {
                    '__type__': value.__class__.__name__,
                    '__properties__': instance_vars
                }
            except:
                return f"<{type(value).__name__} instance>"
        else:
            # Fallback to string representation
            try:
                return str(value)
            except:
                return f"<{type(value).__name__}: not representable>"
    except Exception as e:
        # Ultimate fallback - should never happen but just in case
        return f"<serialization error: {type(value).__name__}>"

def __BUSINESS_STEP__(block_id: str, variables: Dict[str, Any], context: Dict[str, Any] = None):
    """Record a business step during execution"""
    global business_steps, current_block_id, execution_context
    
    current_block_id = block_id
    execution_context = context or {}
    
    # Capture current variable state
    frame = sys._getframe(1)
    current_vars = {}
    
    # Get variables from the calling frame - SAFE SERIALIZATION
    for name, value in frame.f_locals.items():
        if not name.startswith('__') and name != 'frame' and name not in ['business_steps', 'current_block_id', 'execution_context']:
            try:
                # Use the safe serialization function
                current_vars[name] = _serialize_value(value)
            except Exception as e:
                # If serialization fails, use a safe fallback
                current_vars[name] = f"<{type(value).__name__}: serialization failed>"
    
    # Merge with provided variables (also serialize them safely)
    for key, value in variables.items():
        try:
            current_vars[key] = _serialize_value(value)
        except Exception as e:
            current_vars[key] = f"<{type(value).__name__}: serialization failed>"
    
    business_steps.append({
        'block_id': block_id,
        'line': frame.f_lineno,
        'business_line': context.get('business_line', frame.f_lineno) if context else frame.f_lineno,
        'variables': current_vars,
        'execution_context': execution_context,
        'timestamp': __import__('time').time() * 1000
    })

def smart_stepping_main():
    """Main execution function with smart stepping"""
    global business_steps
    
    try:
        # Initialize variables
        ${variablesSetup}
        
        # Execute user code with smart stepping
${indentedUserCode}
        
        # Safely serialize final variables
        safe_final_vars = {}
        for k, v in locals().items():
            if not k.startswith('__') and k not in ['business_steps', 'current_block_id', 'execution_context']:
                safe_final_vars[k] = _serialize_value(v)
        
        return {
            'success': True,
            'steps': business_steps,
            'final_variables': safe_final_vars
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'steps': business_steps
        }

# Execute and output results
if __name__ == '__main__':
    result = smart_stepping_main()
    print('__SMART_STEPPING_RESULT__')
    print(json.dumps(result, indent=2))
    print('__SMART_STEPPING_END__')
`
}

async function executePythonWithSmartStepping(tempFile: string): Promise<{ steps: any[] }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [tempFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 // 30 second timeout
    })
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      console.log('🐍 [SmartSteppingAPI] Python process finished:', {
        exitCode: code,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        stdoutPreview: stdout.substring(0, 500),
        stderrPreview: stderr.substring(0, 500)
      })
      
      if (code !== 0) {
        reject(new Error(`Python execution failed with code ${code}: ${stderr}`))
        return
      }
      
      try {
        // Extract smart stepping result from output
        const resultMatch = stdout.match(/__SMART_STEPPING_RESULT__([\s\S]*?)__SMART_STEPPING_END__/)
        
        if (!resultMatch) {
          reject(new Error('No smart stepping result found in output'))
          return
        }
        
        const result = JSON.parse(resultMatch[1].trim())
        
        if (!result.success) {
          reject(new Error(result.error || 'Python execution failed'))
          return
        }
        
        resolve({
          steps: result.steps || []
        })
        
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${parseError}`))
      }
    })
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
    
    // Handle timeout
    setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill('SIGTERM')
        reject(new Error('Python execution timed out'))
      }
    }, 30000)
  })
}

// =============================================================================
// END OF FILE - NO FALLBACK/MOCK LOGIC
// =============================================================================