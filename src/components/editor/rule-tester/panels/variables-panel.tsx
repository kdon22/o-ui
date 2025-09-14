"use client"

import { ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Variable } from '../types'

interface VariablesPanelProps {
  variables: Variable[]
}

export const VariablesPanel = ({ variables }: VariablesPanelProps) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['local']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Group variables by scope
  const groupedVariables = variables.reduce((acc, variable) => {
    if (!acc[variable.scope]) acc[variable.scope] = []
    acc[variable.scope].push(variable)
    return acc
  }, {} as Record<string, Variable[]>)

  const formatValue = (value: any, type: string): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (type === 'string') return `"${value}"`
    if (type === 'object') return JSON.stringify(value, null, 0)
    return String(value)
  }

  return (
    <div className="p-2">
      <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
        Variables ({variables.length})
      </div>

      {Object.entries(groupedVariables).map(([scope, vars]) => {
        const isExpanded = expandedSections.has(scope)
        
        return (
          <div key={scope} className="mb-2">
            <button
              onClick={() => toggleSection(scope)}
              className="flex items-center gap-1 text-xs font-medium text-foreground hover:bg-muted w-full px-2 py-1 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {scope} ({vars.length})
            </button>

            {isExpanded && (
              <div className="ml-4 space-y-1">
                {vars.map((variable) => (
                  <div
                    key={`${scope}-${variable.name}`}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono hover:bg-muted ${
                      variable.changed ? 'bg-blue-50 border-l-2 border-blue-400' : ''
                    }`}
                  >
                    <span className="text-blue-600 font-medium">{variable.name}</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-green-600 text-xs">{variable.type}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-orange-600 truncate flex-1">
                      {formatValue(variable.value, variable.type)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {variables.length === 0 && (
        <div className="text-xs text-muted-foreground italic px-2">
          No variables to display
        </div>
      )}
    </div>
  )
} 