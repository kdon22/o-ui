/**
 * Runtime Source Map Integration Tests
 * 
 * Tests the complete debugging flow with runtime source map generation
 */

import { runtimeSourceMapGenerator } from '../runtime-source-map'
import { variableDetector } from '../variable-detector'

describe('Runtime Source Map Integration', () => {
  const sampleBusinessRules = `
class Test {
    name = "ell"
    age = 12
}

newCls = Test()
newCls.age = 4
newCls.name = "ger"

if newCls.age = 4
    air = "gthan"
`.trim()

  const samplePythonCode = `
class Test:
    def __init__(self):
        self.name = "ell"
        self.age = 12

newCls = Test()
newCls.age = 4
newCls.name = "ger"

if newCls.age == 4:
    air = "gthan"
`.trim()

  test('should generate runtime source map successfully', async () => {
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules,
      { ruleId: 'test-rule', ruleName: 'Test Rule' }
    )

    expect(sourceMap).toBeDefined()
    expect(sourceMap.mappings).toBeDefined()
    expect(sourceMap.mappings.length).toBeGreaterThan(0)
    expect(sourceMap.pythonStatements).toBeGreaterThan(0)
    expect(sourceMap.businessBlocks).toBeGreaterThan(0)
    expect(sourceMap.generationTime).toBeGreaterThan(0)
    expect(sourceMap.codeHash).toBeDefined()
  })

  test('should generate instrumentation points', async () => {
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules
    )

    const instrumentationPoints = runtimeSourceMapGenerator.getInstrumentationPoints(sourceMap)
    
    expect(instrumentationPoints).toBeDefined()
    expect(Array.isArray(instrumentationPoints)).toBe(true)
    expect(instrumentationPoints.length).toBeGreaterThan(0)
    
    // Should be sorted
    for (let i = 1; i < instrumentationPoints.length; i++) {
      expect(instrumentationPoints[i]).toBeGreaterThan(instrumentationPoints[i - 1])
    }
  })

  test('should map Python lines to business lines', async () => {
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules
    )

    // Test mapping lookup
    const pythonLine = sourceMap.mappings[0]?.pythonLine
    if (pythonLine) {
      const businessLine = runtimeSourceMapGenerator.getBusinessLineForPythonLine(sourceMap, pythonLine)
      expect(businessLine).toBeDefined()
      expect(typeof businessLine).toBe('number')
      expect(businessLine).toBeGreaterThan(0)
    }
  })

  test('should provide descriptions for Python lines', async () => {
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules
    )

    const pythonLine = sourceMap.mappings[0]?.pythonLine
    if (pythonLine) {
      const description = runtimeSourceMapGenerator.getDescriptionForPythonLine(sourceMap, pythonLine)
      expect(description).toBeDefined()
      expect(typeof description).toBe('string')
      expect(description.length).toBeGreaterThan(0)
    }
  })

  test('should validate source map quality', async () => {
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules
    )

    const validation = runtimeSourceMapGenerator.validateSourceMap(sourceMap)
    
    expect(validation).toBeDefined()
    expect(typeof validation.isValid).toBe('boolean')
    expect(typeof validation.coverage).toBe('number')
    expect(typeof validation.averageConfidence).toBe('number')
    expect(Array.isArray(validation.issues)).toBe(true)
    
    expect(validation.coverage).toBeGreaterThan(0)
    expect(validation.coverage).toBeLessThanOrEqual(1)
    expect(validation.averageConfidence).toBeGreaterThan(0)
    expect(validation.averageConfidence).toBeLessThanOrEqual(1)
  })
})

describe('Variable Detector Integration', () => {
  test('should detect relevant variables from execution context', () => {
    const context = {
      executionVariables: {
        'newCls': { name: 'ger', age: 4 },
        'air': 'gthan',
        'Test': 'function',
        '__builtins__': {},
        'print': 'function'
      },
      contextVariables: {
        'ruleId': 'test-rule',
        'tenantId': 'test-tenant'
      }
    }

    const relevantVariables = variableDetector.detectRelevantVariables(context)
    
    expect(relevantVariables).toBeDefined()
    expect(Array.isArray(relevantVariables)).toBe(true)
    expect(relevantVariables.length).toBeGreaterThan(0)
    
    // Should include business variables
    const variableNames = relevantVariables.map(v => v.name)
    expect(variableNames).toContain('newCls')
    expect(variableNames).toContain('air')
    
    // Should exclude Python built-ins
    expect(variableNames).not.toContain('__builtins__')
    expect(variableNames).not.toContain('print')
    
    // Each variable should have required properties
    relevantVariables.forEach(variable => {
      expect(variable.name).toBeDefined()
      expect(variable.type).toBeDefined()
      expect(typeof variable.isBusinessRelevant).toBe('boolean')
      expect(variable.source).toBeDefined()
      expect(['execution', 'context', 'parameter']).toContain(variable.source)
    })
  })

  test('should prioritize execution variables over context variables', () => {
    const context = {
      executionVariables: {
        'testVar': 'execution_value'
      },
      contextVariables: {
        'testVar': 'context_value',
        'contextOnly': 'context_only_value'
      }
    }

    const relevantVariables = variableDetector.detectRelevantVariables(context)
    
    // Should not have duplicates
    const variableNames = relevantVariables.map(v => v.name)
    const uniqueNames = [...new Set(variableNames)]
    expect(variableNames.length).toBe(uniqueNames.length)
    
    // Should prioritize execution source
    const testVar = relevantVariables.find(v => v.name === 'testVar')
    expect(testVar).toBeDefined()
    expect(testVar?.source).toBe('execution')
    expect(testVar?.value).toBe('execution_value')
  })
})

describe('End-to-End Integration', () => {
  const sampleBusinessRules = `
class Test {
    name = "ell"
    age = 12
}

newCls = Test()
newCls.age = 4
newCls.name = "ger"

if newCls.age = 4
    air = "gthan"
`.trim()

  const samplePythonCode = `
class Test:
    def __init__(self):
        self.name = "ell"
        self.age = 12

newCls = Test()
newCls.age = 4
newCls.name = "ger"

if newCls.age == 4:
    air = "gthan"
`.trim()

  test('should complete full debugging flow', async () => {
    // Step 1: Generate runtime source map
    const sourceMap = await runtimeSourceMapGenerator.generateForDebugging(
      samplePythonCode,
      sampleBusinessRules,
      { ruleId: 'test-rule', enableCaching: false }
    )
    
    expect(sourceMap).toBeDefined()
    expect(sourceMap.mappings.length).toBeGreaterThan(0)
    
    // Step 2: Get instrumentation points
    const instrumentationPoints = runtimeSourceMapGenerator.getInstrumentationPoints(sourceMap)
    expect(instrumentationPoints.length).toBeGreaterThan(0)
    
    // Step 3: Simulate variable detection for each step
    const mockExecutionSteps = instrumentationPoints.map((pythonLine, index) => ({
      line: pythonLine,
      variables: {
        [`var_${index}`]: `value_${index}`,
        'businessVar': { id: index, name: `test_${index}` }
      }
    }))
    
    // Step 4: Process each step with variable detection
    for (const step of mockExecutionSteps) {
      const relevantVariables = variableDetector.detectRelevantVariables({
        executionVariables: step.variables
      })
      
      expect(relevantVariables.length).toBeGreaterThan(0)
      
      // Should find business line mapping
      const businessLine = runtimeSourceMapGenerator.getBusinessLineForPythonLine(sourceMap, step.line)
      expect(businessLine).toBeDefined()
      
      // Should provide description
      const description = runtimeSourceMapGenerator.getDescriptionForPythonLine(sourceMap, step.line)
      expect(description).toBeDefined()
    }
    
    console.log('✅ End-to-end debugging flow completed successfully:', {
      sourceMapMappings: sourceMap.mappings.length,
      instrumentationPoints: instrumentationPoints.length,
      mockSteps: mockExecutionSteps.length,
      generationTime: sourceMap.generationTime
    })
  })
})
