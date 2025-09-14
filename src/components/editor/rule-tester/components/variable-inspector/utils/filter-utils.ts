import type { EnhancedVariable } from '../types'
import { filterVariables, searchInValue } from '../search'
import { buildChildrenForVariable } from '../tree-builder'

interface FilterVariablesOptions {
  enhancedVariables: EnhancedVariable[]
  searchTerm: string
  showOnlyChanged: boolean
  maxDepth: number
  builtChildren: Map<string, EnhancedVariable[]>
  onExpandPaths: (paths: Set<string>, children: Map<string, EnhancedVariable[]>) => void
}

export function useFilteredVariables({
  enhancedVariables,
  searchTerm,
  showOnlyChanged,
  maxDepth,
  builtChildren,
  onExpandPaths
}: FilterVariablesOptions) {
  let filtered = filterVariables(enhancedVariables, searchTerm)
  
  if (showOnlyChanged) {
    filtered = filtered.filter(v => 
      v.changed || 
      v.previousValue !== undefined || 
      v.valueHistory !== undefined ||
      v.isRecentlyChanged
    )
  }
  
  // Auto-expand variables that match search (to show nested matches)
  if (searchTerm && filtered.length > 0) {
    const pathsToExpand = new Set<string>()
    const childrenToPreBuild = new Map<string, EnhancedVariable[]>()
    
    // Find all variables that contain matches and auto-expand them
    const findMatchingPaths = (variables: EnhancedVariable[]) => {
      variables.forEach(variable => {
        if (variable.isExpandable && searchInValue(variable.value, searchTerm)) {
          const pathKey = variable.path.join('.')
          pathsToExpand.add(pathKey)
          
          // Pre-build the children so they're available immediately
          if (!builtChildren.has(pathKey)) {
            const children = buildChildrenForVariable(variable, maxDepth)
            childrenToPreBuild.set(pathKey, children)
            
            // Recursively check children too
            findMatchingPaths(children)
          }
        }
      })
    }
    
    findMatchingPaths(filtered)
    
    // Update expanded paths and built children
    if (pathsToExpand.size > 0 || childrenToPreBuild.size > 0) {
      onExpandPaths(pathsToExpand, childrenToPreBuild)
    }
  }
  
  return filtered
}