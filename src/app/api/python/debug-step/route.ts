/**
 * Step-by-Step Python Debug API
 * 
 * Executes Python code one step at a time for true debugging experience.
 * Supports both "Continue" (to breakpoint) and "Step Forward" (next statement) modes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { generateRawPython } from '@/lib/editor/python-generation/raw-python-generator'

export interface StepDebugRequest {
  pythonCode: string
  businessRulesCode: string
  runtimeSourceMap: any
  mode: 'step' | 'continue' | 'initialize'
  currentStep?: number
  breakpoints?: number[]
  sessionId?: string
}

export interface StepDebugResponse {
  success: boolean
  sessionId: string
  currentStep: number
  currentLine: number
  businessLine: number
  variables: Record<string, any>
  isCompleted: boolean
  canStepForward: boolean
  canContinue: boolean
  output: string
  executionTime: number
  error?: string
  hitBreakpoint?: boolean
}

/**
 * POST /api/python/debug-step
 * 
 * Execute Python code one step at a time with full debugging control
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const body: StepDebugRequest = await request.json()
    
    console.log('🚀 [StepDebugAPI] Step execution request:', {
      mode: body.mode,
      currentStep: body.currentStep,
      calculatedTargetStep: body.mode === 'step' ? (body.currentStep || 0) + 1 : 999999,
      breakpointCount: body.breakpoints?.length || 0,
      sessionId: body.sessionId,
      pythonCodeLength: body.pythonCode?.length || 0,
      businessRulesLength: body.businessRulesCode?.length || 0,
      hasSourceMap: !!body.runtimeSourceMap,
      breakpoints: body.breakpoints,
      pythonCodePreview: body.pythonCode?.substring(0, 200) + '...',
      businessRulesPreview: body.businessRulesCode?.substring(0, 200) + '...'
    })
    
    // Validate request
    if (!body.pythonCode || !body.businessRulesCode) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: pythonCode and businessRulesCode'
      }, { status: 400 })
    }
    
    // Generate or use existing session ID
    const sessionId = body.sessionId || randomUUID()
    
    // 🚀 **FIXED**: Use RawPythonGenerator with proper step control parameters
    console.log('🔧 [StepDebugAPI] Using RawPythonGenerator for step control instrumentation')
    const rawPythonResult = generateRawPython(
      body.pythonCode,
      body.businessRulesCode,
      { 
        debugMode: true,
        currentStep: body.currentStep || 0,
        targetStep: body.mode === 'step' ? (body.currentStep || 0) + 1 : 999999,
        breakpoints: body.breakpoints || [],
        sessionId: sessionId,
        mode: body.mode || 'step'
      }
    )
    
    if (!rawPythonResult.success) {
      console.error('❌ [StepDebugAPI] RawPythonGenerator failed:', rawPythonResult.errors)
      return NextResponse.json({
        success: false,
        error: `Python instrumentation failed: ${rawPythonResult.errors.join(', ')}`
      }, { status: 500 })
    }
    
    const instrumentedCode = rawPythonResult.instrumentedCode
    console.log('✅ [StepDebugAPI] RawPythonGenerator successful, instrumented code length:', instrumentedCode.length)
    
    // Execute Python with step control
    const result = await executeStepControlledPython(instrumentedCode, sessionId)
    
    // Process the result
    const response: StepDebugResponse = {
      success: result.success,
      sessionId,
      currentStep: result.currentStep,
      currentLine: result.currentLine,
      businessLine: result.businessLine,
      variables: result.variables,
      isCompleted: result.isCompleted,
      canStepForward: !result.isCompleted,
      canContinue: !result.isCompleted && (body.breakpoints?.length || 0) > 0,
      output: result.output,
      executionTime: Date.now() - startTime,
      error: result.error,
      hitBreakpoint: result.hitBreakpoint
    }
    
    console.log('✅ [StepDebugAPI] Step execution completed:', {
      success: response.success,
      currentStep: response.currentStep,
      businessLine: response.businessLine,
      isCompleted: response.isCompleted,
      executionTime: response.executionTime
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [StepDebugAPI] Step execution failed:', errorMessage)
    
    return NextResponse.json({
      success: false,
      sessionId: '',
      currentStep: 0,
      currentLine: 0,
      businessLine: 0,
      variables: {},
      isCompleted: true,
      canStepForward: false,
      canContinue: false,
      output: '',
      executionTime: Date.now() - startTime,
      error: errorMessage
    }, { status: 500 })
  }
}

/**
 * Find the business rule line number for a given Python line
 */
function findBusinessLineForPythonLine(pythonLine: number, runtimeSourceMap: any): number {
  console.log('🗺️ [StepDebugAPI] Finding business line for Python line:', {
    pythonLine,
    hasSourceMap: !!runtimeSourceMap,
    hasMappings: !!(runtimeSourceMap?.mappings),
    mappingsLength: runtimeSourceMap?.mappings?.length || 0,
    mappingsPreview: runtimeSourceMap?.mappings?.slice(0, 3)
  })
  
  // If we have a runtime source map, use it
  if (runtimeSourceMap && runtimeSourceMap.mappings && Array.isArray(runtimeSourceMap.mappings)) {
    // Find the mapping for this Python line
    const mapping = runtimeSourceMap.mappings.find((m: any) => m.pythonLine === pythonLine)
    if (mapping && mapping.businessLine) {
      console.log('✅ [StepDebugAPI] Found mapping:', {
        pythonLine,
        businessLine: mapping.businessLine,
        confidence: mapping.confidence
      })
      return mapping.businessLine
    }
    
    // If no exact mapping found, try to find the closest one
    const sortedMappings = runtimeSourceMap.mappings
      .filter((m: any) => m.pythonLine <= pythonLine)
      .sort((a: any, b: any) => b.pythonLine - a.pythonLine)
    
    if (sortedMappings.length > 0) {
      const closestMapping = sortedMappings[0]
      console.log('📍 [StepDebugAPI] Using closest mapping:', {
        pythonLine,
        closestPythonLine: closestMapping.pythonLine,
        businessLine: closestMapping.businessLine
      })
      return closestMapping.businessLine
    }
  }
  
  // Fallback: assume 1:1 mapping
  console.log('⚠️ [StepDebugAPI] No source map available, using 1:1 mapping')
  return pythonLine
}

/**
 * 🚫 **DEPRECATED**: Old step control function - replaced by RawPythonGenerator
 * 
 * This function was causing indentation errors and has been replaced by the new
 * RawPythonGenerator which preserves perfect indentation from IndexedDB.
 */
function createStepControlledCode_DEPRECATED(
  pythonCode: string,
  runtimeSourceMap: any,
  mode: 'step' | 'continue' | 'initialize',
  currentStep: number,
  breakpoints: number[]
): string {
  
  // Build the step control infrastructure
  const stepControlInfrastructure = [
    'import sys',
    'import json',
    'import traceback',
    'from typing import Any, Dict, List',
    '',
    '# Step-by-step execution control',
    'step_control = {',
    `    "mode": "${mode}",`,
    `    "current_step": 0,`,
    `    "target_step": ${mode === 'step' ? currentStep + 1 : 999999},`,
    `    "breakpoints": ${JSON.stringify(breakpoints)},`,
    '    "steps": [],',
    '    "session_id": "",',
    '    "is_paused": False,',
    '    "is_completed": False',
    '}',
    '',
    'def __STEP_CONTROL__(step_id: str, python_line: int, business_line: int, description: str = "") -> bool:',
    '    """',
    '    Bulletproof step control system',
    '    ',
    '    Returns:',
    '        True: Continue execution',
    '        False: Pause execution and return to client',
    '    """',
    '    step_control["current_step"] += 1',
    '    current_step = step_control["current_step"]',
    '    ',
    '    # Get current local variables from the calling frame',
    '    import inspect',
    '    frame = inspect.currentframe().f_back',
    '    local_vars = frame.f_locals if frame else {}',
    '    ',
    '    # Clean variables (remove Python internals and system variables)',
    '    clean_vars = {',
    '        k: v for k, v in local_vars.items() ',
    '        if not k.startswith("__") and k not in [',
    '            "step_control", "json", "sys", "traceback", "inspect", "frame",',
    '            "Any", "Dict", "List", "Optional", "Union", "Callable",',
    '            "os", "re", "math", "datetime", "uuid", "typing"',
    '        ]',
    '    }',
    '    ',
    '    # Serialize variables safely with object introspection',
    '    serialized_vars = {}',
    '    for k, v in clean_vars.items():',
    '        try:',
    '            # Test if it\'s JSON serializable',
    '            json.dumps(v)',
    '            serialized_vars[k] = v',
    '        except (TypeError, ValueError):',
    '            # Handle non-serializable objects by extracting their properties',
    '            if hasattr(v, "__dict__"):',
    '                # Object with attributes - extract them',
    '                try:',
    '                    obj_dict = {',
    '                        "__type__": type(v).__name__,',
    '                        "__repr__": str(v)[:100],',
    '                        **{attr: getattr(v, attr) for attr in dir(v) ',
    '                           if not attr.startswith("_") and not callable(getattr(v, attr, None))}',
    '                    }',
    '                    # Test if the extracted dict is serializable',
    '                    json.dumps(obj_dict)',
    '                    serialized_vars[k] = obj_dict',
    '                except:',
    '                    serialized_vars[k] = f"<{type(v).__name__}: {str(v)[:50]}>"',
    '            else:',
    '                # Fallback for other non-serializable types',
    '                serialized_vars[k] = f"<{type(v).__name__}: {str(v)[:50]}>"',
    '    ',
    '    # Create step information',
    '    step_info = {',
    '        "step_id": step_id,',
    '        "step_number": current_step,',
    '        "python_line": python_line,',
    '        "business_line": business_line,',
    '        "variables": serialized_vars,',
    '        "description": description,',
    '        "mode": step_control["mode"]',
    '    }',
    '    ',
    '    # Store step information',
    '    step_control["steps"].append(step_info)',
    '    ',
    '    # Store step info by step number for easy retrieval',
    '    step_control[f"step_{current_step}"] = step_info',
    '    ',
    '    # Determine if we should pause',
    '    should_pause = False',
    '    hit_breakpoint = False',
    '    ',
    '    ',
    '    if step_control["mode"] == "step":',
    '        # Step mode: only pause when we reach the exact target step',
    '        should_pause = current_step == step_control["target_step"]',
    '        ',
    '    elif step_control["mode"] == "continue":',
    '        # Continue mode: only pause at breakpoints',
    '        if python_line in step_control["breakpoints"]:',
    '            should_pause = True',
    '            hit_breakpoint = True',
    '        elif current_step >= step_control["target_step"]:',
    '            # Also pause if we\'ve reached the target step',
    '            should_pause = True',
    '    ',
    '    # If we should pause, output state and stop',
    '    if should_pause:',
    '        step_control["is_paused"] = True',
    '        ',
    '        # Get the step info for the current step (the one that triggered the pause)',
    '        # The current step info should be the correct one since we pause when current_step == target_step',
    '        pause_info = step_info',
    '        output_data = {',
    '            "type": "step_pause",',
    '            "step_info": pause_info,',
    '            "hit_breakpoint": hit_breakpoint,',
    '            "total_steps": current_step,',
    '            "can_continue": len(step_control["breakpoints"]) > 0',
    '        }',
    '        ',
    '        print("__STEP_PAUSE__")',
    '        print(json.dumps(output_data))',
    '        sys.stdout.flush()  # Ensure output is flushed',
    '        ',
    '        # Exit the program to pause execution',
    '        import os',
    '        os._exit(0)  # Force exit without running finally block',
    '    ',
    '    # Continue execution - do not pause',
    '    return True',
    '',
    'def __SERIALIZE_FINAL_STATE__():',
    '    """Output final execution state"""',
    '    try:',
    '        final_state = {',
    '            "type": "execution_complete",',
    '            "total_steps": step_control["current_step"],',
    '            "final_variables": {},',
    '            "is_completed": True',
    '        }',
    '        ',
    '        print("__EXECUTION_COMPLETE__")',
    '        print(json.dumps(final_state))',
    '        ',
    '    except Exception as e:',
    '        print("__SERIALIZATION_ERROR__")',
    '        print(json.dumps({"error": str(e)}))',
    '',
    'try:',
    '    # Execute the original user code with step instrumentation'
  ]
  
  // 🚀 INSTRUMENT EACH PYTHON STATEMENT with step control
  const userCodeLines = pythonCode.split('\n')
  const instrumentedCode: string[] = []
  
  console.log('🔍 [StepDebugAPI] Instrumenting Python code:', {
    mode,
    currentStep,
    targetStep: mode === 'step' ? currentStep + 1 : 999999,
    totalLines: userCodeLines.length,
    breakpointCount: breakpoints.length,
    lines: userCodeLines.slice(0, 5) // Show first 5 lines only
  })
  
  for (let i = 0; i < userCodeLines.length; i++) {
    const line = userCodeLines[i]
    const lineNumber = i + 1
    const trimmedLine = line.trim()
    
    // Calculate the original indentation level
    const originalIndent = line.length - line.trimStart().length
    const baseIndent = '    '  // Base indentation for try block
    
    console.log(`🔍 [StepDebugAPI] Processing line ${lineNumber}:`, {
      line: line,
      trimmedLine: trimmedLine,
      originalIndent: originalIndent,
      isEmpty: trimmedLine === '',
      isComment: trimmedLine.startsWith('#') || trimmedLine.startsWith('//'),
      isClassDef: trimmedLine.startsWith('class ') || trimmedLine.startsWith('def '),
      isControlStructure: !!trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/),
      isModuleLevel: originalIndent === 0,
      isExecutable: originalIndent === 0 && trimmedLine !== '' && !trimmedLine.match(/^(class|def|import|from)\b/)
    })
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
      instrumentedCode.push(baseIndent + line)
      console.log(`⏭️ [StepDebugAPI] Skipped line ${lineNumber}: empty/comment`)
      continue
    }
    
    // Skip class/function definitions (they don't execute immediately)
    if (trimmedLine.startsWith('class ') || trimmedLine.startsWith('def ')) {
      instrumentedCode.push(baseIndent + line)
      console.log(`⏭️ [StepDebugAPI] Skipped line ${lineNumber}: class/function definition`)
      continue
    }
    
    // Skip control structure headers (if, for, while, etc.) - they don't execute statements
    // We'll instrument the statements inside them instead
    if (trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/)) {
      instrumentedCode.push(baseIndent + line)
      console.log(`⏭️ [StepDebugAPI] Skipped line ${lineNumber}: control structure header`)
      continue
    }
    
    // Add the original line first
    instrumentedCode.push(baseIndent + line)
    
    // Add step control AFTER executable statements (both module level AND nested)
    const isExecutableStatement = trimmedLine !== '' && 
                                 !trimmedLine.match(/^(class|def|import|from)\b/) &&
                                 !trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/)
    
    if (isExecutableStatement) {
      const businessLine = findBusinessLineForPythonLine(lineNumber, runtimeSourceMap)
      const stepControlCall = `__STEP_CONTROL__("STMT_${lineNumber}", ${lineNumber}, ${businessLine}, "${trimmedLine.replace(/"/g, '\\"')}")`
      
      // Maintain the same indentation as the original line
      const indentString = ' '.repeat(originalIndent)
      instrumentedCode.push(`${baseIndent}${indentString}${stepControlCall}`)
      
      console.log(`✅ [StepDebugAPI] INSTRUMENTED executable line ${lineNumber}:`, {
        originalLine: trimmedLine,
        pythonLine: lineNumber,
        businessLine: businessLine,
        originalIndent: originalIndent,
        stepControlCall: stepControlCall
      })
    } else {
      console.log(`⏭️ [StepDebugAPI] Not instrumented line ${lineNumber}: not executable statement`)
    }
  }
  
  console.log('🔍 [StepDebugAPI] Instrumentation complete:', {
    originalLines: userCodeLines.length,
    instrumentedLines: instrumentedCode.length
  })
  
  // Combine all parts to create final Python code
  const finalPythonCode = [
    ...stepControlInfrastructure,
    ...instrumentedCode,
    '',
    'except Exception as e:',
    '    print("__EXECUTION_ERROR__")',
    '    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))',
    '',
    '# Mark execution as complete if we reach here',
    '__STEP_CONTROL__("COMPLETE", 0, 0, "Execution completed")'
  ].join('\n')
  
  console.log('🐍 [StepDebugAPI] Final instrumented Python code:')
  console.log('='.repeat(50))
  console.log(finalPythonCode)
  console.log('='.repeat(50))
  
  return finalPythonCode
  
  // Add the completion code
  const completionCode = [
    '    ',
    '    # Add step control at the end',
    '    __STEP_CONTROL__("END", 999, 999, "Execution completed")',
    '    ',
    'except Exception as e:',
    '    print("__EXECUTION_ERROR__")',
    '    print(json.dumps({',
    '        "error": str(e),',
    '        "traceback": traceback.format_exc(),',
    '        "step": step_control["current_step"]',
    '    }))',
    'finally:',
    '    step_control["is_completed"] = True',
    '    __SERIALIZE_FINAL_STATE__()'
  ]
  
  // Combine all parts
  const allLines = [
    ...stepControlInfrastructure,
    ...instrumentedCode,
    ...completionCode
  ]
  
  return allLines.join('\n')
}

/**
 * Execute step-controlled Python code
 */
async function executeStepControlledPython(
  instrumentedCode: string,
  sessionId: string
): Promise<{
  success: boolean
  currentStep: number
  currentLine: number
  businessLine: number
  variables: Record<string, any>
  isCompleted: boolean
  output: string
  error?: string
  hitBreakpoint?: boolean
}> {
  
  // Create temporary file
  const tempFile = join(tmpdir(), `step_debug_${sessionId}.py`)
  
  try {
    // Write instrumented code to file
    writeFileSync(tempFile, instrumentedCode, 'utf8')
    
    console.log('🐍 [StepDebugAPI] Executing step-controlled Python:', {
      tempFile,
      codeLength: instrumentedCode.length
    })
    
    // Execute Python
    const result = await new Promise<{
      success: boolean
      stdout: string
      stderr: string
      exitCode: number
    }>((resolve) => {
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
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0
        })
      })
      
      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          stdout,
          stderr: error.message,
          exitCode: 1
        })
      })
    })
    
    console.log('🐍 [StepDebugAPI] Python execution completed:', {
      success: result.success,
      exitCode: result.exitCode,
      stdoutLength: result.stdout.length,
      stderrLength: result.stderr.length,
      stdoutPreview: result.stdout.substring(0, 500) + (result.stdout.length > 500 ? '...' : ''),
      stderrPreview: result.stderr.substring(0, 200) + (result.stderr.length > 200 ? '...' : '')
    })
    
    // 🔍 **DETAILED STDOUT ANALYSIS**
    console.log('🔍 [StepDebugAPI] Full stdout for analysis:')
    console.log('='.repeat(80))
    console.log(result.stdout)
    console.log('='.repeat(80))
    
    // Parse the output
    const parsedResult = parseStepExecutionResult(result.stdout, result.stderr, result.success)
    
    console.log('📊 [StepDebugAPI] Parsed execution result:', {
      success: parsedResult.success,
      currentStep: parsedResult.currentStep,
      currentLine: parsedResult.currentLine,
      businessLine: parsedResult.businessLine,
      isCompleted: parsedResult.isCompleted,
      variableCount: Object.keys(parsedResult.variables).length,
      error: parsedResult.error,
      hitBreakpoint: parsedResult.hitBreakpoint
    })
    
    
    return parsedResult
    
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile)
    } catch (error) {
      console.warn('⚠️ [StepDebugAPI] Failed to clean up temp file:', error)
    }
  }
}

/**
 * Parse step execution result from Python output
 */
function parseStepExecutionResult(
  stdout: string,
  stderr: string,
  success: boolean
): {
  success: boolean
  currentStep: number
  currentLine: number
  businessLine: number
  variables: Record<string, any>
  isCompleted: boolean
  output: string
  error?: string
  hitBreakpoint?: boolean
} {
  
  try {
    // Look for step pause marker  
    const pauseMatch = stdout.match(/__STEP_PAUSE__\n({[\s\S]*?})(?=\n|$)/)
    
    if (pauseMatch) {
      const stepData = JSON.parse(pauseMatch[1])
      
      return {
        success: true,
        currentStep: stepData.step_info.step_number,
        currentLine: stepData.step_info.python_line,
        businessLine: stepData.step_info.business_line,
        variables: stepData.step_info.variables,
        isCompleted: false, // When we pause, we're not completed
        output: stdout,
        hitBreakpoint: stepData.hit_breakpoint || false
      }
    }
    
    // Look for completion marker
    const completeMatch = stdout.match(/__EXECUTION_COMPLETE__\n({[\s\S]*?})(?=\n|$)/)
    if (completeMatch) {
      const completeData = JSON.parse(completeMatch[1])
      
      return {
        success: true,
        currentStep: completeData.total_steps,
        currentLine: 0,
        businessLine: 0,
        variables: completeData.final_variables || {},
        isCompleted: true,
        output: stdout
      }
    }
    
    // Look for error marker
    const errorMatch = stdout.match(/__EXECUTION_ERROR__\n({[\s\S]*?})(?=\n|$)/)
    if (errorMatch) {
      const errorData = JSON.parse(errorMatch[1])
      
      return {
        success: false,
        currentStep: errorData.step || 0,
        currentLine: 0,
        businessLine: 0,
        variables: {},
        isCompleted: true,
        output: stdout,
        error: errorData.error
      }
    }
    
    // Fallback: no markers found
    return {
      success: success,
      currentStep: 0,
      currentLine: 0,
      businessLine: 0,
      variables: {},
      isCompleted: true,
      output: stdout,
      error: success ? undefined : stderr || 'Unknown execution error'
    }
    
  } catch (error) {
    console.error('❌ [StepDebugAPI] Failed to parse execution result:', error)
    
    return {
      success: false,
      currentStep: 0,
      currentLine: 0,
      businessLine: 0,
      variables: {},
      isCompleted: true,
      output: stdout,
      error: `Failed to parse execution result: ${error}`
    }
  }
}
