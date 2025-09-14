// Core types for rule tester - focused and lightweight
export interface TestSession {
  id: string
  businessRules: string
  pythonCode: string
  status: 'idle' | 'running' | 'debugging' | 'completed' | 'error'
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface TestParameter {
  name: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  schemaId?: string
  description?: string
}

export interface TestParameters {
  [key: string]: TestParameter
}

// ✨ New interfaces for enhanced debugging
export interface DebugTerminalMessage {
  id: string
  timestamp: number
  type: 'output' | 'error' | 'info' | 'debug' | 'trace' | 'step'
  content: string
  line?: number
  variables?: Variable[]
}

export interface ExecutionTrace {
  line: number
  timestamp: number
  variables: Variable[]
  output?: string
  error?: string
}

export interface DebugState {
  isActive: boolean
  currentLine: number
  businessRuleLine?: number
  breakpoints: Set<number>
  canStep: boolean
  canContinue: boolean
  canPause: boolean
  // ✨ Enhanced debug state
  executionTrace: ExecutionTrace[]
  terminalMessages: DebugTerminalMessage[]
  callStack: Array<{
    line: number
    functionName?: string
    variables: Variable[]
  }>
}

export interface Variable {
  name: string
  value: any
  type: string
  scope: 'local' | 'global' | 'builtin'
  changed?: boolean
  // ✨ Enhanced for old -> new value tracking
  previousValue?: any
  valueHistory?: Array<{
    value: any
    line: number
    timestamp: number
  }>
}

export interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime: number
  variables?: Variable[]
}

export interface DebugMapping {
  businessRuleLine: number
  pythonLine: number
  schemaId?: string
  variableNames: string[]
}

// ✨ UTR Integration Types
export interface UTRSourceData {
  id: string
  vendor: 'amadeus' | 'sabre' | 'kayak' | 'direct'
  locator: string
  isPrimary: boolean
  dataTypes: string[] // ['flights', 'hotel', 'car', 'pricing']
  status: 'pending' | 'loading' | 'loaded' | 'error'
  error?: string
}

export interface WorkflowConfig {
  workflowId: string
  processName: string
  mockMode: boolean // True for now, connects to action system later
  description?: string
}

export interface EmailOverrides {
  mode: 'override_all' | 'bcc' | 'regular' | 'delivery_test'
  testEmail?: string
  deliveryAddress: string
  enabled: boolean
}

export interface UTRConnectionConfig {
  sources: UTRSourceData[]
  workflow: WorkflowConfig | null
  emailOverrides: EmailOverrides
  lastUpdated: Date | null
}

export interface ConsolidatedUTR {
  metadata: {
    sourceCount: number
    assembledAt: Date
    completenessScore: number
  }
  sources: UTRSourceData[]
  data: any // The actual UTR object
  errors?: string[]
}

// Tab types for the new tabbed interface
export type ResultsTabType = 'utr-connection' | 'variables' | 'execution-log' 