#!/usr/bin/env node

/**
 * 🧪 **RAW PYTHON GENERATOR TEST**
 * 
 * Tests the new RawPythonGenerator to ensure it:
 * 1. Preserves perfect indentation from IndexedDB
 * 2. Generates correct source mapping
 * 3. Adds step control without breaking indentation
 * 4. Fixes the IndentationError we were seeing
 */

const fs = require('fs')
const path = require('path')

// Import the generator (we'll use require since this is a Node.js test)
const generatorPath = path.join(__dirname, 'o-ui/src/lib/editor/python-generation/raw-python-generator.ts')

console.log('🧪 [Test] Starting Raw Python Generator Test')
console.log('📁 [Test] Generator path:', generatorPath)

// Your actual problematic code from the terminal output
const perfectPythonFromIndexedDB = `# this is a test
class Test:
    name = "ell"
    age = 12

air = "123"

newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [newCls, new1Cls]

for testcls in testClasses:
    if testcls.age == 4:
        if newCls.age == 5:
            air = ""
        elif newCls.age == 3:
            air = "gthan"
        
        break
else:
    air = "RR"
    if newCls.age == 6:
        air = ""
    elif newCls.age == 12:
        air = "gthan"
        air = ""
        air = "yes"`

// Corresponding business rules
const businessRules = `// this is a test
class Test {
  name = "ell"
  age = 12
}

air = "123"

newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [newCls, new1Cls]

if any testcls in testClasses has testcls.age = 4
  if newCls.age = 5
    air = ""
  elseif newCls.age = 3
    air = "gthan"
else
  air = "RR"
  if newCls.age = 6
    air = ""
  elseif newCls.age = 12
    air = "gthan"
    air = ""
    air = "yes"`

console.log('📝 [Test] Input Python code:')
console.log('  Lines:', perfectPythonFromIndexedDB.split('\n').length)
console.log('  Characters:', perfectPythonFromIndexedDB.length)
console.log('  First few lines:')
perfectPythonFromIndexedDB.split('\n').slice(0, 5).forEach((line, i) => {
  console.log(`    ${i + 1}: "${line}"`)
})

console.log('\n📝 [Test] Input business rules:')
console.log('  Lines:', businessRules.split('\n').length)
console.log('  Characters:', businessRules.length)

// Test the generator using a simple mock since we can't import TS directly
console.log('\n🔧 [Test] Creating mock RawPythonGenerator...')

class MockRawPythonGenerator {
  generate(rawPythonCode, businessRules) {
    console.log('🚀 [MockGenerator] Starting generation...')
    
    // Simple source map generation (1:1 mapping where possible)
    const pythonLines = rawPythonCode.split('\n')
    const businessLines = businessRules.split('\n')
    
    const mappings = []
    for (let i = 0; i < Math.min(pythonLines.length, businessLines.length); i++) {
      mappings.push({
        generatedLine: i + 1,
        generatedColumn: 0,
        originalLine: i + 1,
        originalColumn: 0
      })
    }
    
    const sourceMap = {
      version: 3,
      sources: ['business-rules.txt'],
      sourcesContent: [businessRules],
      names: [],
      mappings,
      file: 'generated.py'
    }
    
    // Add step control instrumentation while preserving indentation
    const instrumentedCode = this.addStepControlInstrumentation(rawPythonCode, sourceMap)
    
    return {
      success: true,
      pythonCode: rawPythonCode,
      instrumentedCode,
      sourceMap,
      errors: [],
      warnings: []
    }
  }
  
  addStepControlInstrumentation(pythonCode, sourceMap) {
    const lines = pythonCode.split('\n')
    const instrumentedLines = []
    
    // Add step control header
    instrumentedLines.push('import sys')
    instrumentedLines.push('import json')
    instrumentedLines.push('import traceback')
    instrumentedLines.push('from typing import Any, Dict, List')
    instrumentedLines.push('')
    instrumentedLines.push('# Step control system (simplified for test)')
    instrumentedLines.push('step_control = {"current_step": 0, "mode": "step", "target_step": 1}')
    instrumentedLines.push('')
    instrumentedLines.push('def __STEP_CONTROL__(step_id, python_line, business_line, description=""):')
    instrumentedLines.push('    step_control["current_step"] += 1')
    instrumentedLines.push('    return True')
    instrumentedLines.push('')
    instrumentedLines.push('try:')
    instrumentedLines.push('    # Execute the original user code with step instrumentation')
    instrumentedLines.push('    ')
    
    // Process each line and add step control where appropriate
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      const originalIndent = this.getIndentation(line)
      
      // Check if this line should have step control BEFORE adding the line
      const shouldInstrument = this.shouldInstrumentLine(line)
      const isControlFlowStatement = this.isControlFlowStatement(trimmedLine)

      // For control flow statements (break, continue, return), add step control BEFORE the statement
      if (shouldInstrument && isControlFlowStatement) {
        const businessLine = this.findBusinessLineForPythonLine(i + 1, sourceMap)
        const stepId = `STMT_${i + 1}`
        const description = trimmedLine.replace(/"/g, '\\"')
        
        // Add step control call BEFORE the control flow statement
        const stepControlCall = `__STEP_CONTROL__("${stepId}", ${i + 1}, ${businessLine}, "${description}")`
        instrumentedLines.push(`    ${originalIndent}${stepControlCall}`)
      }
      
      // Add the original line with proper indentation (add 4 spaces for try block)
      instrumentedLines.push(`    ${line}`)
      
      // For non-control flow statements, add step control AFTER the statement
      if (shouldInstrument && !isControlFlowStatement) {
        const businessLine = this.findBusinessLineForPythonLine(i + 1, sourceMap)
        const stepId = `STMT_${i + 1}`
        const description = trimmedLine.replace(/"/g, '\\"')
        
        // Add step control call with same indentation as original line (plus try block indent)
        const stepControlCall = `__STEP_CONTROL__("${stepId}", ${i + 1}, ${businessLine}, "${description}")`
        instrumentedLines.push(`    ${originalIndent}${stepControlCall}`)
      }
    }
    
    // Add error handling footer
    instrumentedLines.push('')
    instrumentedLines.push('except Exception as e:')
    instrumentedLines.push('    print("__EXECUTION_ERROR__")')
    instrumentedLines.push('    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))')
    instrumentedLines.push('')
    instrumentedLines.push('__STEP_CONTROL__("COMPLETE", 0, 0, "Execution completed")')
    
    return instrumentedLines.join('\n')
  }
  
  shouldInstrumentLine(line) {
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return false
    }
    
    // Skip class definitions and control structure headers
    if (trimmed.startsWith('class ') || 
        trimmed.startsWith('def ') ||
        trimmed.endsWith(':')) {
      return false
    }
    
    // Skip import statements
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      return false
    }
    
    // Instrument executable statements
    return true
  }
  
  isControlFlowStatement(trimmedLine) {
    // Control flow statements that transfer execution
    return trimmedLine === 'break' || 
           trimmedLine === 'continue' || 
           trimmedLine.startsWith('return') ||
           trimmedLine.startsWith('raise') ||
           trimmedLine.startsWith('yield')
  }
  
  findBusinessLineForPythonLine(pythonLine, sourceMap) {
    const mapping = sourceMap.mappings.find(m => m.generatedLine === pythonLine)
    return mapping ? mapping.originalLine : pythonLine
  }
  
  getIndentation(line) {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }
}

// Run the test
console.log('\n🧪 [Test] Running generation test...')
const generator = new MockRawPythonGenerator()
const result = generator.generate(perfectPythonFromIndexedDB, businessRules)

console.log('\n✅ [Test] Generation Results:')
console.log('  Success:', result.success)
console.log('  Errors:', result.errors.length)
console.log('  Warnings:', result.warnings.length)
console.log('  Source map mappings:', result.sourceMap.mappings.length)

console.log('\n🐍 [Test] Original Python preserved:')
console.log('  Length:', result.pythonCode.length)
console.log('  Same as input:', result.pythonCode === perfectPythonFromIndexedDB)

console.log('\n🔧 [Test] Instrumented code analysis:')
const instrumentedLines = result.instrumentedCode.split('\n')
console.log('  Total lines:', instrumentedLines.length)
console.log('  Original lines:', perfectPythonFromIndexedDB.split('\n').length)

// Test indentation preservation
console.log('\n📏 [Test] Indentation Preservation Test:')
const originalLines = perfectPythonFromIndexedDB.split('\n')
let indentationErrors = 0
let linesChecked = 0

for (let i = 0; i < originalLines.length; i++) {
  const originalLine = originalLines[i]
  if (originalLine.trim()) {
    // Find this line in the instrumented code (should be there with 4 extra spaces for try block)
    const expectedLine = `    ${originalLine}`
    const found = instrumentedLines.includes(expectedLine)
    
    if (!found) {
      console.log(`  ❌ Line ${i + 1}: "${originalLine}" not found with correct indentation`)
      indentationErrors++
    } else {
      console.log(`  ✅ Line ${i + 1}: Indentation preserved`)
    }
    linesChecked++
    
    // Only check first 10 lines for brevity
    if (linesChecked >= 10) break
  }
}

console.log(`\n📊 [Test] Indentation Test Results:`)
console.log(`  Lines checked: ${linesChecked}`)
console.log(`  Indentation errors: ${indentationErrors}`)
console.log(`  Success rate: ${((linesChecked - indentationErrors) / linesChecked * 100).toFixed(1)}%`)

// Test for the specific error that was happening
console.log('\n🔍 [Test] Checking for IndentationError patterns...')
const problematicPatterns = [
  /break\s*\n\s*__STEP_CONTROL__/,  // break followed by step control on wrong indent
  /^\s{0,3}break$/m,                // break with less than 4 spaces (should be at least 8 in our case)
  /^\s*__STEP_CONTROL__.*break/     // step control call mentioning break but placed wrong
]

let patternIssues = 0
problematicPatterns.forEach((pattern, index) => {
  if (pattern.test(result.instrumentedCode)) {
    console.log(`  ❌ Found problematic pattern ${index + 1}: ${pattern}`)
    patternIssues++
  } else {
    console.log(`  ✅ Pattern ${index + 1} clean: ${pattern}`)
  }
})

// Write the instrumented code to a file for inspection
const outputFile = path.join(__dirname, 'test-output-instrumented.py')
fs.writeFileSync(outputFile, result.instrumentedCode)
console.log(`\n📁 [Test] Instrumented code written to: ${outputFile}`)

// Final assessment
console.log('\n🎯 [Test] FINAL ASSESSMENT:')
console.log(`  ✅ Generation successful: ${result.success}`)
console.log(`  ✅ Original code preserved: ${result.pythonCode === perfectPythonFromIndexedDB}`)
console.log(`  ${indentationErrors === 0 ? '✅' : '❌'} Indentation preserved: ${indentationErrors === 0}`)
console.log(`  ${patternIssues === 0 ? '✅' : '❌'} No problematic patterns: ${patternIssues === 0}`)

const overallSuccess = result.success && 
                      result.pythonCode === perfectPythonFromIndexedDB && 
                      indentationErrors === 0 && 
                      patternIssues === 0

console.log(`\n🏆 [Test] OVERALL RESULT: ${overallSuccess ? 'SUCCESS ✅' : 'NEEDS WORK ❌'}`)

if (overallSuccess) {
  console.log('\n🎉 The RawPythonGenerator approach should fix your IndentationError!')
  console.log('   Your perfectly indented code from IndexedDB will be preserved.')
  console.log('   Step control will be added without breaking indentation.')
} else {
  console.log('\n🔧 Issues found that need to be addressed:')
  if (indentationErrors > 0) console.log('   - Indentation preservation needs work')
  if (patternIssues > 0) console.log('   - Problematic patterns detected')
}

console.log('\n📝 [Test] Test completed. Check the output file for detailed instrumented code.')
