/**
 * 🏆 ErrorDisplay - Error State Components
 * 
 * Centralized error display components for the rule studio.
 * Clean, helpful error messages with consistent styling.
 */

import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  error: Error | string | null
  ruleId?: string
  context?: string
  onRetry?: () => void
}

export function ErrorDisplay({ 
  error, 
  ruleId, 
  context = 'operation',
  onRetry 
}: ErrorDisplayProps) {
  
  if (!error) return null
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Error Loading {context}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {errorMessage}
        </p>
        
        {ruleId && (
          <p className="text-xs text-muted-foreground mb-4">
            Rule ID: <span className="font-mono">{ruleId}</span>
          </p>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

export function RuleNotFoundError({ ruleId }: { ruleId: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Rule not found</h3>
        <p className="text-sm mb-2">
          The requested rule could not be loaded
        </p>
        <p className="text-xs">
          Rule ID: <span className="font-mono">{ruleId}</span>
        </p>
      </div>
    </div>
  )
}

export function PermissionDeniedError({ ruleId }: { ruleId: string }) {
  return (
    <ErrorDisplay
      error="You don't have permission to access this rule"
      ruleId={ruleId}
      context="rule"
    />
  )
}

export function SaveError({ 
  error, 
  onRetry 
}: { 
  error: Error | string
  onRetry?: () => void 
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-700">
          Save failed: {error instanceof Error ? error.message : String(error)}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Try saving again
          </button>
        )}
      </div>
    </div>
  )
}
