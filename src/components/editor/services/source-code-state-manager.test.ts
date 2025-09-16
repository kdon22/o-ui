/**
 * 🚀 ENTERPRISE SOURCE CODE STATE MANAGER - Test Demo
 * 
 * This demonstrates how the unified source code state manager
 * automatically generates Python code when source code changes.
 */

// Mock the Python generation function for testing
jest.mock('@/lib/editor/python-generation', () => ({
  translateBusinessRulesToPython: jest.fn((code: string) => {
    if (code.includes('if booking.passengerCount > 0')) {
      return {
        success: true,
        pythonCode: 'if booking.passenger_count > 0:\n    return True\nelse:\n    return False'
      }
    }
    return {
      success: true,
      pythonCode: `# Generated Python for: ${code.substring(0, 30)}...`
    }
  })
}))

import { useSourceCodeState } from './source-code-state-manager'

describe('SourceCodeStateManager', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSourceCodeState.setState({
      sourceCode: {},
      pythonCode: {},
      lastModifiedBy: {},
      hasUnsavedChanges: {},
      lastSavedSourceCode: {}
    })
  })

  it('should automatically generate Python code when source code is updated', async () => {
    const ruleId = 'test-rule-123'
    const sourceCode = 'if booking.passengerCount > 0\n    return true\nelse\n    return false'
    
    // Update source code
    await useSourceCodeState.getState().updateSourceCode(ruleId, sourceCode, 'monaco-editor')
    
    // Check that both source code and Python code are updated
    const state = useSourceCodeState.getState()
    expect(state.sourceCode[ruleId]).toBe(sourceCode)
    expect(state.pythonCode[ruleId]).toBe('if booking.passenger_count > 0:\n    return True\nelse:\n    return False')
    expect(state.lastModifiedBy[ruleId]).toBe('monaco-editor')
    expect(state.hasUnsavedChanges[ruleId]).toBe(true)
  })

  it('should provide both source code and Python code when getting rule state', async () => {
    const ruleId = 'test-rule-456'
    const sourceCode = 'customer.age >= 18'
    
    // Update source code
    await useSourceCodeState.getState().updateSourceCode(ruleId, sourceCode, 'debug-tab')
    
    // Get complete rule state
    const ruleState = useSourceCodeState.getState().getRuleState(ruleId)
    
    expect(ruleState.sourceCode).toBe(sourceCode)
    expect(ruleState.pythonCode).toBe('# Generated Python for: customer.age >= 18...')
    expect(ruleState.hasChanges).toBe(true)
  })

  it('should clear Python code when source code is empty', async () => {
    const ruleId = 'test-rule-789'
    
    // First set some source code
    await useSourceCodeState.getState().updateSourceCode(ruleId, 'some code', 'monaco-editor')
    expect(useSourceCodeState.getState().pythonCode[ruleId]).toBeTruthy()
    
    // Then clear it
    await useSourceCodeState.getState().updateSourceCode(ruleId, '', 'monaco-editor')
    expect(useSourceCodeState.getState().pythonCode[ruleId]).toBe('')
  })

  it('should mark as saved and clear unsaved changes flag', async () => {
    const ruleId = 'test-rule-saved'
    const sourceCode = 'test code'
    
    // Update source code
    await useSourceCodeState.getState().updateSourceCode(ruleId, sourceCode, 'monaco-editor')
    expect(useSourceCodeState.getState().hasUnsavedChanges[ruleId]).toBe(true)
    
    // Mark as saved
    useSourceCodeState.getState().markAsSaved(ruleId, sourceCode)
    expect(useSourceCodeState.getState().hasUnsavedChanges[ruleId]).toBe(false)
  })
})

/**
 * 🎯 USAGE EXAMPLE: How the RuleSaveCoordinator uses this
 */
export const demonstrateUsage = async () => {
  const ruleId = 'example-rule'
  const sourceCode = 'if booking.passengerCount > 0\n    return true'
  
  // 1. User types in Monaco editor
  await useSourceCodeState.getState().updateSourceCode(sourceCode, 'monaco-editor')
  
  // 2. Save coordinator gets both source code and Python code
  const { sourceCode: latestSourceCode, pythonCode: latestPythonCode } = 
    useSourceCodeState.getState().getRuleState(ruleId)
  
  // 3. Both are saved to the server
  console.log('Saving to server:', {
    sourceCode: latestSourceCode,
    pythonCode: latestPythonCode
  })
  
  // 4. Mark as saved
  useSourceCodeState.getState().markAsSaved(ruleId, latestSourceCode)
}
