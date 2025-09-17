/**
 * 🏆 LoadingStates - Loading UI Components
 * 
 * Centralized loading state components for the rule studio.
 * Clean, consistent loading experiences across all scenarios.
 */

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  ruleId?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  ruleId,
  size = 'md' 
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        <span className="text-sm text-muted-foreground">{message}</span>
        {ruleId && (
          <div className="text-xs text-muted-foreground">
            Rule ID: <span className="font-mono">{ruleId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function RuleLoadingState({ ruleId }: { ruleId: string }) {
  return (
    <LoadingSpinner 
      message="Loading rule..." 
      ruleId={ruleId}
      size="md"
    />
  )
}

export function EditorLoadingState() {
  return (
    <LoadingSpinner 
      message="Initializing editor..." 
      size="md"
    />
  )
}

export function InheritanceLoadingState() {
  return (
    <LoadingSpinner 
      message="Checking permissions..." 
      size="sm"
    />
  )
}

export function SavingIndicator({ message = 'Saving changes...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>{message}</span>
    </div>
  )
}
