'use client'

import React from 'react'
import type { EnhancedVariable } from '../types'
import type { Variable } from '../../../types'
import { VariableRow } from '../variable-row'
import { EmptyState } from './empty-state'

interface VariableListProps {
  variables: EnhancedVariable[]
  originalVariables: Variable[]
  searchTerm: string
  debouncedSearchTerm: string
  expandedPaths: Set<string>
  builtChildren: Map<string, EnhancedVariable[]>
  showOldValues: boolean
  changeAnimations: boolean
  onToggleExpanded: (variable: EnhancedVariable) => void
  onCopyValue: (value: string) => void
}

export function VariableList({
  variables,
  originalVariables,
  searchTerm,
  debouncedSearchTerm,
  expandedPaths,
  builtChildren,
  showOldValues,
  changeAnimations,
  onToggleExpanded,
  onCopyValue
}: VariableListProps) {
  // Render variable tree recursively with lazy loading
  const renderVariable = (variable: EnhancedVariable, level = 0): React.ReactNode => {
    const pathKey = variable.path.join('.')
    const isExpanded = expandedPaths.has(pathKey)
    
    // Get children - either from built cache or from variable.children
    const children = builtChildren.get(pathKey) || variable.children || []
    
    return (
      <div key={pathKey} data-variable-path={pathKey}>
        <VariableRow
          variable={variable}
          isExpanded={isExpanded}
          onToggle={() => onToggleExpanded(variable)}
          onCopy={onCopyValue}
          level={level}
          searchTerm={debouncedSearchTerm}
          showOldValue={showOldValues}
          showChangeAnimation={changeAnimations}
          oldValueDisplayStyle="strikethrough"
          onValueClick={(variable) => {
            // Could implement value history modal here
            console.log('Variable clicked:', variable.name, variable.valueHistory)
          }}
        />
        
        {isExpanded && children.length > 0 && (
          <div>
            {children.map((child, index) => renderVariable(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (variables.length === 0) {
    return <EmptyState variableCount={originalVariables.length} searchTerm={searchTerm} />
  }

  return (
    <div className="text-sm">
      {variables.map(variable => renderVariable(variable))}
    </div>
  )
}