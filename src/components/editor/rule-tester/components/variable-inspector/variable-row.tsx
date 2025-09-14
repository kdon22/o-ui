'use client'

import React from 'react'
import { ChevronDown, ChevronRight, Copy, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import { Button } from '@/components/ui/button'
import type { VariableRowProps } from './types'
import { 
  getTypeStyle, 
  formatValue, 
  detectValueType, 
  formatOldValue, 
  getChangeStyle, 
  isRecentChange
} from './utils'
import { highlightText } from './search'

// 🎨 **VARIABLE ROW COMPONENT** - Single variable display with VS Code debugger style
export function VariableRow({ 
  variable, 
  isExpanded, 
  onToggle, 
  onCopy, 
  level, 
  showOldValue = true, 
  searchTerm,
  showChangeAnimation = true,
  oldValueDisplayStyle = 'strikethrough',
  onValueClick
}: VariableRowProps) {
  const hasChanged = variable.changed || variable.previousValue !== undefined
  const hasValueHistory = variable.valueHistory !== undefined
  const isRecent = hasValueHistory && variable.valueHistory ? 
    isRecentChange(variable.valueHistory.changedAt) : false
  const indentStyle = { paddingLeft: `${level * 12 + 8}px` }
  
  return (
    <div
      className={cn(
        "group relative border-b border-gray-100 hover:bg-blue-50/50 transition-colors",
        // ✨ Enhanced change styling based on change type and recency
        hasValueHistory && variable.valueHistory && getChangeStyle(variable.valueHistory.changeType, isRecent && showChangeAnimation),
        hasChanged && !hasValueHistory && "bg-yellow-50/80 hover:bg-yellow-100/60"
      )}
      style={indentStyle}
    >
      <div className="flex items-center py-1.5 pr-2 gap-2">
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          {variable.isExpandable ? (
            <button
              onClick={onToggle}
              className="w-4 h-4 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>
        
        {/* Variable Name: Value (VS Code Debugger Style) */}
        <div className="flex items-center min-w-0 flex-1">
          <span className={cn(
            "font-mono text-sm",
            level > 0 ? "text-purple-700" : "text-blue-700"
          )}>
            {searchTerm ? highlightText(variable.name, searchTerm) : variable.name}
            {/* ✨ Enhanced change indicators */}
            {hasValueHistory && variable.valueHistory && (
              <span className={cn(
                "inline-flex items-center ml-1 px-1 py-0.5 rounded text-xs font-medium",
                {
                  'bg-green-100 text-green-800': variable.valueHistory.changeType === 'added',
                  'bg-blue-100 text-blue-800': variable.valueHistory.changeType === 'modified',
                  'bg-red-100 text-red-800': variable.valueHistory.changeType === 'removed'
                }
              )}>
                {variable.valueHistory.changeType === 'added' && '+'}
                {variable.valueHistory.changeType === 'modified' && '*'}
                {variable.valueHistory.changeType === 'removed' && '-'}
              </span>
            )}
            {hasChanged && !hasValueHistory && (
              <Zap className="inline w-3 h-3 ml-1 text-yellow-600" />
            )}
          </span>
          <span className="text-gray-500 mx-1">=</span>
          
          {/* ✨ VS Code Style: Current Value (Old Value) */}
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
            onClick={() => onValueClick?.(variable)}
          >
            <span className={cn(
              "font-mono text-sm",
              getTypeStyle(variable.inspectorType)
            )}>
              {searchTerm ? 
                highlightText(formatValue(variable.value, variable.inspectorType, 'main'), searchTerm) :
                formatValue(variable.value, variable.inspectorType, 'main')
              }
              
              {/* ✨ Old Value with Red Strikethrough */}
              {showOldValue && (hasChanged || hasValueHistory) && (
                <span className="ml-1 text-red-600 line-through">
                  {hasValueHistory && variable.valueHistory?.previous !== undefined ?
                    formatOldValue(
                      variable.valueHistory.previous, 
                      detectValueType(variable.valueHistory.previous)
                    ) :
                    variable.previousValue !== undefined ?
                    formatOldValue(
                      variable.previousValue, 
                      detectValueType(variable.previousValue)
                    ) :
                    ''
                  }
                </span>
              )}
            </span>
            
            {/* ✨ Change count indicator */}
            {hasValueHistory && variable.valueHistory && variable.valueHistory.changeCount > 1 && (
              <span className="text-xs text-gray-400 ml-1 bg-gray-100 px-1 rounded">
                {variable.valueHistory.changeCount}x
              </span>
            )}
          </div>
        </div>
        
        {/* Actions - Minimal */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-blue-100"
            onClick={() => onCopy(String(variable.value))}
            title="Copy value"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}