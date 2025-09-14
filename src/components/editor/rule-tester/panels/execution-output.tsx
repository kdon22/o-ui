import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import type { ExecutionResult } from '../types'

interface ExecutionOutputProps {
  result: ExecutionResult | null
}

export const ExecutionOutput = ({ result }: ExecutionOutputProps) => {
  if (!result) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No test results yet</div>
          <div className="text-xs">Run a test to see output here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full font-mono text-sm">
      {/* Result Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        {result.success ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}
        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
          {result.success ? 'Test Passed' : 'Test Failed'}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {result.executionTime}ms
        </span>
      </div>

      {/* Output Content */}
      <div className="space-y-4">
        {result.output && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Output:</div>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto whitespace-pre-wrap">
              {result.output}
            </pre>
          </div>
        )}

        {result.error && (
          <div>
            <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
            <pre className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-800 overflow-auto whitespace-pre-wrap">
              {result.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 