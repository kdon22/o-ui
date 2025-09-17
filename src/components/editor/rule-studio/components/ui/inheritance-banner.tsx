/**
 * 🏆 InheritanceBanner - Read-Only Warning Component
 * 
 * Shows when a rule is inherited and cannot be edited in the current context.
 * Clean, focused UI component with single responsibility.
 */

import { Lock } from 'lucide-react'
import type { InheritanceInfo } from '../../types'

interface InheritanceBannerProps {
  inheritanceInfo: InheritanceInfo
  context?: 'business-rules' | 'parameters'
}

export function InheritanceBanner({ 
  inheritanceInfo, 
  context = 'business-rules' 
}: InheritanceBannerProps) {
  
  if (!inheritanceInfo.isReadOnly) return null
  
  const getMessage = () => {
    const baseMessage = context === 'parameters' 
      ? 'Parameters for this inherited rule cannot be modified here.'
      : 'This rule is inherited from an ancestor node and cannot be edited here.'
    
    const sourceInfo = inheritanceInfo.sourceNodeName 
      ? ` (from ${inheritanceInfo.sourceNodeName})`
      : ''
    
    const actionMessage = context === 'parameters'
      ? 'Edit at the source node to make changes.'
      : 'To modify this rule, edit it at its source or create a copy for this node.'
    
    return `${baseMessage}${sourceInfo} ${actionMessage}`
  }
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm">
      <Lock className="w-4 h-4 flex-shrink-0" />
      <span>{getMessage()}</span>
      {inheritanceInfo.inheritanceLevel && inheritanceInfo.inheritanceLevel > 1 && (
        <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
          Level {inheritanceInfo.inheritanceLevel}
        </span>
      )}
    </div>
  )
}
