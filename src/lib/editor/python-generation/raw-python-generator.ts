/**
 * Raw Python Generator - Preserves Perfect Indentation for Step Debugging
 * 
 * This generator is specifically designed for the step debugging API to maintain
 * perfect indentation and provide instrumentation hooks for step-by-step execution.
 */

import { SimplePythonGenerator, SimplePythonResult } from './simple-generator'

export interface RawPythonOptions {
  debugMode?: boolean
  preserveComments?: boolean
  generateSourceMap?: boolean
  // Step debugging options
  currentStep?: number
  targetStep?: number
  breakpoints?: number[]
  sessionId?: string
  mode?: 'step' | 'continue' | 'initialize'
}

export interface RawPythonResult {
  success: boolean
  instrumentedCode: string
  originalCode: string
  errors: string[]
  warnings: string[]
  sourceMap?: any
}

/**
 * Generate raw Python code with optional instrumentation for debugging
 */
export function generateRawPython(
  pythonCode: string,
  businessRulesCode: string,
  options: RawPythonOptions = {}
): RawPythonResult {
  console.log('🔧 [RawPythonGenerator] Starting raw Python generation:', {
    pythonCodeLength: pythonCode?.length || 0,
    businessRulesLength: businessRulesCode?.length || 0,
    debugMode: options.debugMode,
    preserveComments: options.preserveComments,
    generateSourceMap: options.generateSourceMap
  })

  try {
    // If we have Python code already, use it as-is
    if (pythonCode && pythonCode.trim()) {
      console.log('✅ [RawPythonGenerator] Using existing Python code')
      
      let instrumentedCode = pythonCode
      
      // If debug mode is enabled, add instrumentation
      if (options.debugMode) {
        instrumentedCode = addDebugInstrumentation(pythonCode, options)
      }
      
      return {
        success: true,
        instrumentedCode,
        originalCode: pythonCode,
        errors: [],
        warnings: []
      }
    }
    
    // If we only have business rules, generate Python from them
    if (businessRulesCode && businessRulesCode.trim()) {
      console.log('🔄 [RawPythonGenerator] Generating Python from business rules')
      
      const generator = new SimplePythonGenerator({
        generateComments: options.preserveComments !== false,
        strictMode: false
      })
      
      const result = generator.translate(businessRulesCode)
      
      if (!result.success) {
        return {
          success: false,
          instrumentedCode: '',
          originalCode: '',
          errors: result.errors,
          warnings: result.warnings
        }
      }
      
      let instrumentedCode = result.pythonCode
      
      // If debug mode is enabled, add instrumentation
      if (options.debugMode) {
        instrumentedCode = addDebugInstrumentation(result.pythonCode, options)
      }
      
      return {
        success: true,
        instrumentedCode,
        originalCode: result.pythonCode,
        errors: result.errors,
        warnings: result.warnings
      }
    }
    
    // No valid input provided
    return {
      success: false,
      instrumentedCode: '',
      originalCode: '',
      errors: ['No valid Python code or business rules provided'],
      warnings: []
    }
    
  } catch (error) {
    console.error('❌ [RawPythonGenerator] Generation failed:', error)
    
    return {
      success: false,
      instrumentedCode: '',
      originalCode: '',
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    }
  }
}

/**
 * Add debug instrumentation to Python code for step-by-step execution
 */
function addDebugInstrumentation(pythonCode: string, options: RawPythonOptions = {}): string {
  console.log('🔧 [RawPythonGenerator] Adding debug instrumentation:', {
    currentStep: options.currentStep || 0,
    targetStep: options.targetStep,
    mode: options.mode || 'step',
    breakpoints: options.breakpoints || [],
    sessionId: options.sessionId
  })
  
  const lines = pythonCode.split('\n')
  const instrumentedLines: string[] = []
  
  // Calculate step control parameters
  const currentStep = options.currentStep || 0
  const mode = options.mode || 'step'
  const targetStep = options.targetStep || (mode === 'step' ? currentStep + 1 : 999999)
  const breakpoints = options.breakpoints || []
  const sessionId = options.sessionId || ''

  console.log('🎯 [RawPythonGenerator] Step control configuration:', {
    currentStep,
    targetStep,
    mode,
    breakpoints,
    sessionId
  })

  // Add debug infrastructure at the beginning
  const debugInfrastructure = [
    'import sys',
    'import json',
    'import traceback',
    'from typing import Any, Dict, List',
    '',
    '# Step-by-step execution control',
    'step_control = {',
    `    "mode": "${mode}",`,
    `    "current_step": ${currentStep},`,
    `    "target_step": ${targetStep},`,
    `    "breakpoints": ${JSON.stringify(breakpoints)},`,
    '    "steps": [],',
    `    "session_id": "${sessionId}",`,
    '    "is_paused": False,',
    '    "is_completed": False',
    '}',
    '',
    'def __STEP_CONTROL__(step_id: str, step_number: int, python_line: int, business_line: int, description: str = "") -> bool:',
    '    """Step control system for debugging - handles natural control flow"""',
    '    ',
    '    # Increment the actual executed step counter (only when actually executed)',
    '    if "executed_steps" not in step_control:',
    '        step_control["executed_steps"] = 0',
    '    step_control["executed_steps"] += 1',
    '    actual_step = step_control["executed_steps"]',
    '    ',
    '    # Update current step to the actual executed step',
    '    step_control["current_step"] = actual_step',
    '    ',
    '    # Get current local variables from the calling frame',
    '    import inspect',
    '    frame = inspect.currentframe().f_back',
    '    local_vars = frame.f_locals if frame else {}',
    '    ',
    '    # Clean variables (remove Python internals)',
    '    clean_vars = {',
    '        k: v for k, v in local_vars.items() ',
    '        if not k.startswith("__") and k not in [',
    '            "step_control", "json", "sys", "traceback", "inspect", "frame", "actual_step"',
    '        ]',
    '    }',
    '    ',
    '    # Serialize variables safely',
    '    serialized_vars = {}',
    '    for k, v in clean_vars.items():',
    '        try:',
    '            json.dumps(v)',
    '            serialized_vars[k] = v',
    '        except (TypeError, ValueError):',
    '            serialized_vars[k] = f"<{type(v).__name__}: {str(v)[:50]}>"',
    '    ',
    '    # Create step information using actual executed step number',
    '    step_info = {',
    '        "step_id": f"EXEC_{actual_step}",',
    '        "step_number": actual_step,',
    '        "original_step": step_number,  # Keep track of original numbering',
    '        "python_line": python_line,',
    '        "business_line": business_line,',
    '        "variables": serialized_vars,',
    '        "description": description',
    '    }',
    '    ',
    '    # Store step information',
    '    step_control["steps"].append(step_info)',
    '    step_control[f"step_{actual_step}"] = step_info',
    '    ',
    '    # Determine if we should pause',
    '    should_pause = False',
    '    hit_breakpoint = False',
    '    ',
    '    if step_control["mode"] == "step":',
    '        # Step mode: pause when we reach the target step (based on actual execution)',
    '        should_pause = actual_step == step_control["target_step"]',
    '        hit_breakpoint = False  # Never hit breakpoints in step mode',
    '        target_step = step_control["target_step"]',
    '        print(f"🎯 STEP MODE: executed={actual_step}, original={step_number}, target={target_step}, should_pause={should_pause}")',
    '    elif step_control["mode"] == "continue":',
    '        # Continue mode: pause at breakpoints or target step',
    '        if business_line in step_control["breakpoints"]:',
    '            should_pause = True',
    '            hit_breakpoint = True',
    '        elif actual_step >= step_control["target_step"]:',
    '            should_pause = True',
    '            hit_breakpoint = False',
    '    ',
    '    if should_pause:',
    '        step_control["is_paused"] = True',
    '        output_data = {',
    '            "type": "step_pause",',
    '            "step_info": step_info,',
    '            "hit_breakpoint": hit_breakpoint,',
    '            "total_steps": actual_step',
    '        }',
    '        print("__STEP_PAUSE__")',
    '        print(json.dumps(output_data))',
    '        sys.stdout.flush()',
    '        import os',
    '        os._exit(0)',
    '    ',
    '    return True',
    '',
    'try:',
    '    # Execute the original user code with step instrumentation'
  ]
  
  instrumentedLines.push(...debugInfrastructure)
  
  // Track class definition context
  let insideClassDefinition = false
  let classIndentLevel = 0

  // Process each line of the original code
  let stepCounter = 0  // Sequential step counter for instrumentation
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1
    const trimmedLine = line.trim()
    
    // Calculate indentation
    const originalIndent = line.length - line.trimStart().length
    const baseIndent = '    '  // Base indentation for try block
    
    // Track class definition context
    if (trimmedLine.startsWith('class ')) {
      insideClassDefinition = true
      classIndentLevel = originalIndent
    } else if (insideClassDefinition && trimmedLine !== '' && originalIndent <= classIndentLevel) {
      // We've exited the class definition
      insideClassDefinition = false
      classIndentLevel = 0
    }
    
    const isInsideClassBody = insideClassDefinition && originalIndent > classIndentLevel
    
    console.log(`🔍 [RawPythonGenerator] Processing line ${lineNumber}:`, {
      line: `"${line}"`,
      trimmedLine: `"${trimmedLine}"`,
      originalIndent,
      isEmpty: trimmedLine === '',
      isComment: trimmedLine.startsWith('#') || trimmedLine.startsWith('//'),
      isClassDef: trimmedLine.startsWith('class ') || trimmedLine.startsWith('def '),
      isControlStructure: !!trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/),
      insideClassDefinition,
      isInsideClassBody,
      classIndentLevel
    })
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
      instrumentedLines.push(baseIndent + line)
      console.log(`⏭️ [RawPythonGenerator] Skipped line ${lineNumber}: empty/comment`)
      continue
    }
    
    // Skip class/function definitions
    if (trimmedLine.startsWith('class ') || trimmedLine.startsWith('def ')) {
      instrumentedLines.push(baseIndent + line)
      console.log(`⏭️ [RawPythonGenerator] Skipped line ${lineNumber}: class/function definition`)
      continue
    }
    
    // Skip class body properties (they execute during class definition, not program flow)
    if (isInsideClassBody) {
      instrumentedLines.push(baseIndent + line)
      console.log(`⏭️ [RawPythonGenerator] Skipped line ${lineNumber}: inside class body`)
      continue
    }
    
    // Add the original line (ALL lines must be included for execution)
    instrumentedLines.push(baseIndent + line)
    
    // 🎯 SELECTIVE INSTRUMENTATION - Determine what should get step control
    const shouldInstrumentAsStep = !shouldSkipControlStructure(trimmedLine, lineNumber, lines)
    
    // Add step control for executable statements (but only if not skipped)
    const isExecutableStatement = trimmedLine !== '' && 
                                 !trimmedLine.match(/^(class|def|import|from)\b/) &&
                                 !trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/) &&
                                 shouldInstrumentAsStep
    
    console.log(`🎯 [RawPythonGenerator] Line ${lineNumber} executable check:`, {
      trimmedLine: `"${trimmedLine}"`,
      isExecutableStatement,
      matchesClassDef: !!trimmedLine.match(/^(class|def|import|from)\b/),
      matchesControlStructure: !!trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/)
    })
    
    if (isExecutableStatement) {
      stepCounter++  // Increment step counter for each executable statement
      const stepControlCall = `__STEP_CONTROL__("STMT_${stepCounter}", ${stepCounter}, ${stepCounter}, ${lineNumber}, "${trimmedLine.replace(/"/g, '\\"')}")`
      const indentString = ' '.repeat(originalIndent)
      instrumentedLines.push(`${baseIndent}${indentString}${stepControlCall}`)
      console.log(`✅ [RawPythonGenerator] INSTRUMENTED line ${lineNumber} as step ${stepCounter}: "${trimmedLine}"`)
    } else {
      console.log(`❌ [RawPythonGenerator] NOT instrumented line ${lineNumber}: "${trimmedLine}"`)
    }
  }
  
  // Add exception handling and completion
  const completionCode = [
    '',
    'except Exception as e:',
    '    print("__EXECUTION_ERROR__")',
    '    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))',
    '    sys.stdout.flush()',
    '    import os',
    '    os._exit(1)',
    '',
    '# Mark execution as complete if we reach the end',
    'step_control["is_completed"] = True',
    'final_step = step_control.get("executed_steps", 0)',
    'print(f"🎯 EXECUTION COMPLETE: total_steps={final_step}")',
    'completion_data = {',
    '    "type": "execution_complete",',
    '    "total_steps": final_step,',
    '    "final_variables": {}',
    '}',
    'print("__EXECUTION_COMPLETE__")',
    'print(json.dumps(completion_data))',
    'sys.stdout.flush()'
  ]
  
  instrumentedLines.push(...completionCode)
  
  const result = instrumentedLines.join('\n')
  
  console.log('✅ [RawPythonGenerator] Debug instrumentation added:', {
    originalLines: lines.length,
    instrumentedLines: instrumentedLines.length,
    codeLength: result.length
  })
  
  return result
}

/**
 * 🎯 SELECTIVE INSTRUMENTATION - Determine if a control structure should be skipped
 * 
 * Skip technical Python constructs, instrument meaningful business logic
 */
function shouldSkipControlStructure(trimmedLine: string, lineNumber: number, allLines: string[]): boolean {
  
  // 🎯 ONLY SKIP CONTROL STRUCTURE HEADERS - Everything else should be instrumented
  
  // Skip control structure headers (they control flow but aren't business steps)
  if (trimmedLine.match(/^(if|elif|else|for|while|try|except|finally|with)\b.*:$/) || trimmedLine === 'else:') {
    console.log(`🎯 [SelectiveInstrumentation] Skip control structure header: ${trimmedLine}`)
    return true
  }
  
  // Skip break statements (technical loop control)
  if (trimmedLine === 'break') {
    console.log(`🎯 [SelectiveInstrumentation] Skip break statement`)
    return true
  }
  
  // INSTRUMENT everything else (assignments, function calls, etc.)
  console.log(`🎯 [SelectiveInstrumentation] INSTRUMENT statement: ${trimmedLine}`)
  return false
}
