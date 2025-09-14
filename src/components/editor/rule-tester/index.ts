"use client"

// Rule Tester Module Exports - Clean Debugging Edition

// 🎯 **CORE COMPONENTS** - Clean, professional debugging experience
export { VariableInspector } from './components/variable-inspector'
export { DebugTabClient } from './components/debug-tab-client'

// 🚀 **DEBUG SYSTEM** - Smart stepping with Python execution
export { useSmartStepping } from '@/hooks/editor/use-smart-stepping'
export { SimpleDebugger } from './services/simple-debugger'
export { PythonExecutor } from './services/python-executor'

// 🔧 **UTILITY SERVICES** - Supporting services
export { useUTRIntegration } from './hooks/use-utr-integration'
export { VendorIntegrationService } from './services/vendor-integration'

// 📊 **TYPE EXPORTS** - TypeScript interfaces
export type { 
  TestSession, 
  TestParameter, 
  TestParameters, 
  ExecutionResult, 
  Variable,
  DebugState as LegacyDebugState,
  DebugMapping 
} from './types'

export type { 
  SimpleDebugState,
  SimpleDebugStep
} from './services/simple-debugger'

export type { 
  PythonExecutionResult,
  PythonDebugStep
} from './services/python-executor'

// LineMapping and SourceMapping types removed - replaced by enhanced source map types

/**
 * 🎯 **USAGE EXAMPLE**
 * 
 * ```typescript
 * import { DebugTabClient, useSmartStepping } from '@/components/editor/rule-tester'
 * 
 * function MyDebugger() {
 *   return (
 *     <DebugTabClient 
 *       sourceCode={businessRules}      // What user sees and debugs
 *       pythonCode={generatedPython}    // What actually executes
 *       sourceMap={blockMap}            // Smart stepping mapping
 *       onChange={handleCodeChange}
 *       rule={currentRule}
 *     />
 *   )
 * }
 * ```
 * 
 * Key Features:
 * - Smart stepping through business logic (user-friendly)
 * - Python execution with business rule mapping (reliable)
 * - Visual debugging with floating toolbar controls
 * - Real-time variable inspection and state tracking
 * - Clean, focused architecture (~360 lines total)
 * - Like TypeScript debugging: execute compiled code, debug original source
 */