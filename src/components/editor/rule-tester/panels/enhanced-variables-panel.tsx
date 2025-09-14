import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, History, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/generalUtils'
import type { Variable } from '../types'

interface EnhancedVariablesPanelProps {
  variables: Variable[]
  className?: string
  onWatchVariable?: (variableName: string) => void
  onUnwatchVariable?: (variableName: string) => void
  watchedVariables?: Set<string>
}

export const EnhancedVariablesPanel = ({ 
  variables, 
  className,
  onWatchVariable,
  onUnwatchVariable,
  watchedVariables = new Set()
}: EnhancedVariablesPanelProps) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['local', 'changed']))
  const [showValueHistory, setShowValueHistory] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const toggleValueHistory = (variableName: string) => {
    const newShowHistory = new Set(showValueHistory)
    if (newShowHistory.has(variableName)) {
      newShowHistory.delete(variableName)
    } else {
      newShowHistory.add(variableName)
    }
    setShowValueHistory(newShowHistory)
  }

  const formatValue = (value: any, type: string): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (type === 'string') return `"${value}"`
    if (type === 'object' && typeof value === 'object') return JSON.stringify(value, null, 0)
    return String(value)
  }

  const getValueChangeIndicator = (variable: Variable) => {
    if (!variable.changed || variable.previousValue === undefined) return null
    
    const oldVal = formatValue(variable.previousValue, variable.type)
    const newVal = formatValue(variable.value, variable.type)
    
    return { oldVal, newVal }
  }

  // Group variables by scope and change status
  const groupedVariables = variables.reduce((acc, variable) => {
    const scope = variable.scope
    const changeStatus = variable.changed ? 'changed' : 'unchanged'
    
    if (!acc[scope]) acc[scope] = { changed: [], unchanged: [] }
    acc[scope][changeStatus].push(variable)
    
    return acc
  }, {} as Record<string, { changed: Variable[], unchanged: Variable[] }>)

  // Create sections for display
  const sections = []
  
  // Changed variables first (most important during debugging)
  const changedVars = variables.filter(v => v.changed)
  if (changedVars.length > 0) {
    sections.push({ 
      key: 'changed', 
      title: 'Changed Variables', 
      variables: changedVars,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    })
  }

  // Watched variables
  const watchedVars = variables.filter(v => watchedVariables.has(v.name))
  if (watchedVars.length > 0) {
    sections.push({
      key: 'watched',
      title: 'Watched Variables',
      variables: watchedVars,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    })
  }

  // By scope
  Object.entries(groupedVariables).forEach(([scope, { changed, unchanged }]) => {
    if (scope !== 'local' || !changedVars.length) { // Don't duplicate locals if we already showed changed
      const allInScope = [...changed, ...unchanged]
      if (allInScope.length > 0) {
        sections.push({
          key: scope,
          title: `${scope.charAt(0).toUpperCase() + scope.slice(1)} (${allInScope.length})`,
          variables: allInScope,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        })
      }
    }
  })

  return (
    <div className={cn("p-2 space-y-2", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground">
          Variables ({variables.length})
        </div>
        {changedVars.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            {changedVars.length} changed
          </Badge>
        )}
      </div>

      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.key)
        
        return (
          <div key={section.key} className="space-y-1">
            <button
              onClick={() => toggleSection(section.key)}
              className="flex items-center gap-1 text-xs font-medium hover:bg-muted w-full px-2 py-1 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span className={section.color}>{section.title}</span>
            </button>

            {isExpanded && (
              <div className="ml-2 space-y-1">
                {section.variables.map((variable) => {
                  const changeInfo = getValueChangeIndicator(variable)
                  const isWatched = watchedVariables.has(variable.name)
                  const showHistory = showValueHistory.has(variable.name)
                  
                  return (
                    <div
                      key={`${section.key}-${variable.name}`}
                      className={cn(
                        "group relative rounded border-l-2 transition-all",
                        variable.changed 
                          ? "bg-yellow-50 border-yellow-400 shadow-sm" 
                          : "bg-gray-50 border-gray-200",
                        isWatched && "ring-1 ring-blue-300"
                      )}
                    >
                      {/* Main Variable Display */}
                      <div className="flex items-center gap-2 px-2 py-2 text-xs font-mono">
                        {/* Watch Toggle */}
                        <button
                          onClick={() => isWatched 
                            ? onUnwatchVariable?.(variable.name) 
                            : onWatchVariable?.(variable.name)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {isWatched ? (
                            <Eye className="w-3 h-3 text-blue-500" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>

                        {/* Variable Name */}
                        <span className="text-blue-600 font-medium min-w-0 flex-shrink">
                          {variable.name}
                        </span>
                        
                        {/* Type Badge */}
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {variable.type}
                        </Badge>

                        <span className="text-muted-foreground">:</span>

                        {/* Current Value */}
                        <span className="text-green-600 truncate flex-1 min-w-0">
                          {formatValue(variable.value, variable.type)}
                        </span>

                        {/* History Toggle */}
                        {(changeInfo || variable.valueHistory?.length) && (
                          <button
                            onClick={() => toggleValueHistory(variable.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <History className="w-3 h-3 text-gray-400 hover:text-orange-500" />
                          </button>
                        )}
                      </div>

                      {/* Value Change Indicator */}
                      {changeInfo && (
                        <div className="px-2 pb-1">
                          <div className="flex items-center gap-2 text-[10px] bg-white/60 rounded px-2 py-1">
                            <span className="text-red-500 line-through">
                              {changeInfo.oldVal}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-medium">
                              {changeInfo.newVal}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Value History */}
                      {showHistory && variable.valueHistory && variable.valueHistory.length > 0 && (
                        <div className="px-2 pb-2 border-t border-gray-200 mt-1">
                          <div className="text-[10px] text-gray-600 font-medium mb-1">History:</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {variable.valueHistory.slice(-5).map((history, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span className="w-6">L{history.line}</span>
                                <span className="flex-1 font-mono">
                                  {formatValue(history.value, variable.type)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {variables.length === 0 && (
        <div className="text-xs text-muted-foreground italic text-center py-8">
          <Eye className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p>No variables to display</p>
          <p className="text-[10px] mt-1">Start debugging to see variables</p>
        </div>
      )}
    </div>
  )
} 