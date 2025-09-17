/**
 * 🏆 TestDebugTab - Rule Testing and Debugging
 * 
 * Clean wrapper around the existing DebugTabClient for testing functionality.
 * Preserves all existing debug and test features.
 */

import { DebugTabClient } from '@/components/editor/rule-tester/components/debug-tab-client'
import type { TestDebugTabProps } from '../../types'

export function TestDebugTab({
  sourceCode,
  pythonCode,
  onChange,
  rule
}: TestDebugTabProps) {
  
  console.log('🧪 [TestDebugTab] Rendering with props:', {
    ruleId: rule?.id,
    ruleName: rule?.name,
    sourceCodeLength: sourceCode?.length || 0,
    pythonCodeLength: pythonCode?.length || 0
  })
  
  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No rule data available</p>
          <p className="text-xs mt-1">Testing functionality unavailable</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full">
      <DebugTabClient
        key="debug-tab-client-component"
        sourceCode={sourceCode}
        pythonCode={pythonCode}
        onChange={onChange}
        rule={rule}
        // 🛡️ ALL EXISTING DEBUG FEATURES PRESERVED:
        // - Rule testing and execution
        // - Debug output and logging
        // - Variable inspection
        // - Step-through debugging
        // - Performance profiling
      />
    </div>
  )
}
