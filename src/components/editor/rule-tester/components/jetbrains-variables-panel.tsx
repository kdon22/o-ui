"use client"

import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import { VariableHoverPopover, formatValueForDisplay, isComplexVariable } from './variable-hover-popover'

interface Variable {
  name: string
  type: string
  value: any
  scope: string
  changed?: boolean
  previousValue?: any
  children?: Variable[]
  path?: string[]
}

interface JetBrainsVariablesPanelProps {
  variables: Variable[]
  className?: string
  showSearch?: boolean
}

export function JetBrainsVariablesPanel({ 
  variables, 
  className = "",
  showSearch = true 
}: JetBrainsVariablesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['locals']))
  const [watchedVariables, setWatchedVariables] = useState<Set<string>>(new Set())

  // Group variables by scope
  const groupedVariables = useMemo(() => {
    const groups: Record<string, Variable[]> = {}
    variables.forEach(variable => {
      const scope = variable.scope || 'locals'
      if (!groups[scope]) groups[scope] = []
      groups[scope].push(variable)
    })
    return groups
  }, [variables])

  // Filter variables based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedVariables
    
    const filtered: Record<string, Variable[]> = {}
    Object.entries(groupedVariables).forEach(([scope, vars]) => {
      const matchingVars = vars.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(v.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (matchingVars.length > 0) {
        filtered[scope] = matchingVars
      }
    })
    
    return filtered
  }, [groupedVariables, searchTerm])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const toggleWatched = (variableName: string) => {
    const newWatched = new Set(watchedVariables)
    if (newWatched.has(variableName)) {
      newWatched.delete(variableName)
    } else {
      newWatched.add(variableName)
    }
    setWatchedVariables(newWatched)
  }


  const getValueColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-700'
      case 'number': return 'text-blue-700'
      case 'boolean': return 'text-purple-700'
      case 'object': return 'text-orange-700'
      case 'function': return 'text-pink-700'
      default: return 'text-gray-700'
    }
  }

  const getHoverTooltip = (variable: Variable): string => {
    let tooltip = `Type: ${variable.type}`
    
    if (variable.changed && variable.previousValue !== undefined) {
      tooltip += `\nChanged from: ${formatValueForDisplay({value: variable.previousValue}, variable.type)}`
      tooltip += `\nChanged to: ${formatValueForDisplay(variable, variable.type)}`
    }
    
    if (variable.type === 'object' && typeof variable.value === 'object' && variable.value !== null) {
      if (variable.value.__type__) {
        tooltip += `\nClass: ${variable.value.__type__}`
        const props = Object.entries(variable.value).filter(([key]) => !key.startsWith('__'))
        if (props.length > 0) {
          tooltip += `\nProperties:`
          props.slice(0, 5).forEach(([key, val]) => {
            tooltip += `\n  ${key}: ${formatValueForDisplay({value: val}, typeof val)}`
          })
          if (props.length > 5) {
            tooltip += `\n  ... and ${props.length - 5} more`
          }
        }
      } else if (Array.isArray(variable.value)) {
        tooltip += `\nLength: ${variable.value.length}`
        if (variable.value.length > 0) {
          tooltip += `\nItems: [${variable.value.slice(0, 3).map(v => formatValueForDisplay({value: v}, typeof v)).join(', ')}${variable.value.length > 3 ? '...' : ''}]`
        }
      }
    }
    
    return tooltip
  }

  const shouldShowTypeBadge = (type: string, value: any): boolean => {
    // Only show type badges for complex types or when it's not obvious
    return type === 'object' || type === 'function' || Array.isArray(value) || 
           type === 'undefined' || value === null
  }



  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'string': return '📝'
      case 'number': return '🔢'
      case 'boolean': return '✓'
      case 'object': return '🏗️'
      case 'function': return '⚡'
      case 'array': return '📋'
      default: return '❓'
    }
  }

  const renderVariable = (variable: Variable, level = 0, parentPath = ""): React.ReactNode => {
    const path = parentPath ? `${parentPath}.${variable.name}` : variable.name
    const isExpanded = expandedPaths.has(path)
    const hasChildren = variable.children && variable.children.length > 0
    const isWatched = watchedVariables.has(variable.name)
    const indent = level * 8

    return (
      <div key={path} className="select-none">
        {/* Variable Row */}
        <div 
          className={`
            flex items-center py-0.5 px-1 hover:bg-gray-50 group font-mono text-sm leading-tight
            ${variable.changed ? 'bg-blue-50/30 border-l-2 border-blue-300' : ''}
            ${isComplexVariable(variable) ? 'cursor-pointer' : hasChildren ? 'cursor-pointer' : 'cursor-default'}
          `}
          style={{ paddingLeft: `${2 + indent}px` }}
          onClick={(e) => {
            // Handle expand/collapse for expandable items
            if (hasChildren) {
              toggleExpanded(path)
            }
          }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-3 h-3 flex items-center justify-center mr-0.5">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
              )
            ) : null}
          </div>

          {/* Watch Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleWatched(variable.name)
            }}
            className="w-3 h-3 flex items-center justify-center mr-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isWatched ? (
              <Eye className="w-2.5 h-2.5 text-blue-400" />
            ) : (
              <EyeOff className="w-2.5 h-2.5 text-gray-300 hover:text-blue-400" />
            )}
          </button>

          {/* Type Icon */}
          <div className="w-3 h-3 flex items-center justify-center mr-0.5">
            {getTypeIcon(variable.type)}
          </div>

          {/* Variable Name */}
          <span className="text-sm font-semibold text-gray-900 mr-1 min-w-0 flex-shrink-0">
            {variable.name}
          </span>

          {/* Type Badge - Only for complex types */}
          {shouldShowTypeBadge(variable.type, variable.value) && (
            <Badge 
              variant="secondary" 
              className="text-xs px-1 py-0 h-3 mr-1 bg-gray-100 text-gray-500 border-0 font-normal"
            >
              {variable.type}
            </Badge>
          )}

          {/* Equals Sign */}
          <span className="text-gray-300 mr-1 font-normal">=</span>

          {/* Value with Hover and Popover */}
          <div className="flex-1 min-w-0 flex items-center">
            <VariableHoverPopover variable={variable} showMoreIndicator={true}>
              {variable.changed && variable.previousValue !== undefined ? (
                <>
                  {/* Old Value (strikethrough, red) */}
                  <span className="text-red-500 line-through text-sm mr-1 font-normal font-mono">
                    {formatValueForDisplay({value: variable.previousValue}, variable.type)}
                  </span>
                  {/* New Value */}
                  <span className={`text-sm font-normal font-mono ${getValueColor(variable.type)} truncate`}>
                    {formatValueForDisplay(variable, variable.type)}
                  </span>
                </>
              ) : (
                <span className={`text-sm font-normal font-mono ${getValueColor(variable.type)} truncate`}>
                  {formatValueForDisplay(variable, variable.type)}
                </span>
              )}
            </VariableHoverPopover>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {variable.children!.map(child => 
              renderVariable(child, level + 1, path)
            )}
          </div>
        )}
      </div>
    )
  }

  const renderScope = (scopeName: string, variables: Variable[]): React.ReactNode => {
    const isExpanded = expandedPaths.has(scopeName)
    const scopeDisplayName = scopeName === 'locals' ? 'LOCAL' : 
                            scopeName === 'global' ? 'GLOBAL' : 
                            scopeName.toUpperCase()

    return (
      <div key={scopeName} className="mb-1">
        {/* Scope Header */}
        <div 
          className="flex items-center py-0.5 px-1 hover:bg-gray-50 cursor-pointer select-none"
          onClick={() => toggleExpanded(scopeName)}
        >
          <div className="w-3 h-3 flex items-center justify-center mr-1">
            {isExpanded ? (
              <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-600 tracking-wide">
            {scopeDisplayName}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {variables.length}
          </span>
        </div>

        {/* Scope Variables */}
        {isExpanded && (
          <div>
            {variables.map(variable => renderVariable(variable, 0, scopeName))}
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full bg-gray-50/30 ${className}`}>
        {/* Search Bar */}
        {showSearch && (
          <div className="p-2 border-b bg-white/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Filter variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-6 text-xs border-gray-200 focus:border-blue-300"
              />
            </div>
          </div>
        )}

        {/* Variables List */}
        <div className="flex-1 overflow-auto">
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'No variables match your search' : 'No variables to display'}
            </div>
          ) : (
            <div className="py-1">
              {Object.entries(filteredGroups).map(([scope, vars]) => 
                renderScope(scope, vars)
              )}
            </div>
          )}
        </div>

      </div>
    </TooltipProvider>
  )
}