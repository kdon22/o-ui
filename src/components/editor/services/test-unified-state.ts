/**
 * 🚀 ENTERPRISE TEST: Unified Source Code State
 * 
 * Simple test to verify the unified state is working correctly
 */

import { useSourceCodeState } from './source-code-state-manager'

export const testUnifiedState = async () => {
  console.log('🧪 [TEST] Testing unified source code state...')
  
  const ruleId = 'test-rule-123'
  const sourceCode = 'air = ""'
  
  // Test 1: Initialize rule
  console.log('🧪 [TEST] Step 1: Initialize rule')
  useSourceCodeState.getState().initializeRule(ruleId, 'initial code', 'initial python')
  
  const initialState = useSourceCodeState.getState().getRuleState(ruleId)
  console.log('🧪 [TEST] Initial state:', initialState)
  
  // Test 2: Update source code
  console.log('🧪 [TEST] Step 2: Update source code')
  await useSourceCodeState.getState().updateSourceCode(ruleId, sourceCode, 'test')
  
  const updatedState = useSourceCodeState.getState().getRuleState(ruleId)
  console.log('🧪 [TEST] Updated state:', updatedState)
  
  // Test 3: Verify save coordinator gets both
  console.log('🧪 [TEST] Step 3: Verify save coordinator gets both values')
  const { sourceCode: finalSourceCode, pythonCode: finalPythonCode } = 
    useSourceCodeState.getState().getRuleState(ruleId)
  
  console.log('🧪 [TEST] Final values for save:', {
    sourceCode: finalSourceCode,
    pythonCode: finalPythonCode,
    sourceCodeMatches: finalSourceCode === sourceCode
  })
  
  // Cleanup
  useSourceCodeState.getState().clearRule(ruleId)
  console.log('🧪 [TEST] Test completed and cleaned up')
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testUnifiedState = testUnifiedState
}


