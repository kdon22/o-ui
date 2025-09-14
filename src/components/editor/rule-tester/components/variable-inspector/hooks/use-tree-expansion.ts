import { useState, useCallback, useEffect } from 'react'
import type { EnhancedVariable } from '../types'
import { buildChildrenForVariable } from '../tree-builder'

interface UseTreeExpansionProps {
  variables: EnhancedVariable[]
  maxDepth: number
}

export function useTreeExpansion({ variables, maxDepth }: UseTreeExpansionProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [builtChildren, setBuiltChildren] = useState<Map<string, EnhancedVariable[]>>(new Map())

  // Clear built children and expanded paths when variables change
  useEffect(() => {
    setBuiltChildren(new Map())
    setExpandedPaths(new Set())
  }, [variables])

  // Expand/collapse logic with lazy child building
  const toggleExpanded = useCallback((variable: EnhancedVariable) => {
    const pathKey = variable.path.join('.')
    const isCurrentlyExpanded = expandedPaths.has(pathKey)
    
    if (isCurrentlyExpanded) {
      // Collapse - just remove from expanded paths
      setExpandedPaths(prev => {
        const newSet = new Set(prev)
        newSet.delete(pathKey)
        return newSet
      })
    } else {
      // Expand - build children first if needed
      if (variable.isExpandable && !builtChildren.has(pathKey)) {
        const children = buildChildrenForVariable(variable, maxDepth)
        
        // Build children first
        setBuiltChildren(prevBuilt => {
          const newBuilt = new Map(prevBuilt)
          newBuilt.set(pathKey, children)
          return newBuilt
        })
        
        // Use setTimeout to ensure children are built before expanding
        setTimeout(() => {
          setExpandedPaths(prev => {
            const newSet = new Set(prev)
            newSet.add(pathKey)
            return newSet
          })
        }, 0)
      } else {
        // Children already exist, expand immediately
        setExpandedPaths(prev => {
          const newSet = new Set(prev)
          newSet.add(pathKey)
          return newSet
        })
      }
    }
  }, [expandedPaths, builtChildren, maxDepth])

  // Collect all expandable paths recursively and build children
  const collectExpandablePaths = useCallback((variablesToScan: EnhancedVariable[]): { 
    paths: string[], 
    childrenMap: Map<string, EnhancedVariable[]> 
  } => {
    const paths: string[] = []
    const childrenMap = new Map<string, EnhancedVariable[]>()
    
    const traverse = (vars: EnhancedVariable[]) => {
      vars.forEach(variable => {
        if (variable.isExpandable) {
          const pathKey = variable.path.join('.')
          paths.push(pathKey)
          
          // Build children if not already built
          if (!builtChildren.has(pathKey)) {
            const children = buildChildrenForVariable(variable, maxDepth)
            childrenMap.set(pathKey, children)
            
            // Continue traversing the newly built children
            if (children.length > 0) {
              const childResult = collectExpandablePaths(children)
              paths.push(...childResult.paths)
              childResult.childrenMap.forEach((value, key) => {
                childrenMap.set(key, value)
              })
            }
          }
        }
      })
    }
    
    traverse(variablesToScan)
    return { paths, childrenMap }
  }, [builtChildren, maxDepth])

  // Expand/collapse all expandable items
  const expandAll = useCallback(() => {
    const { paths, childrenMap } = collectExpandablePaths(variables)
    setExpandedPaths(new Set(paths))
    
    // Merge new children with existing built children
    setBuiltChildren(prevBuilt => {
      const newBuilt = new Map(prevBuilt)
      childrenMap.forEach((value, key) => {
        if (!newBuilt.has(key)) {
          newBuilt.set(key, value)
        }
      })
      return newBuilt
    })
  }, [variables, collectExpandablePaths])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  // Auto-expand paths for search results
  const expandPaths = useCallback((pathsToExpand: Set<string>, childrenToPreBuild: Map<string, EnhancedVariable[]>) => {
    // Update expanded paths
    setExpandedPaths(prev => {
      const newSet = new Set(prev)
      pathsToExpand.forEach(path => newSet.add(path))
      return newSet
    })
    
    // Build children if needed
    if (childrenToPreBuild.size > 0) {
      setBuiltChildren(prev => {
        const newBuilt = new Map(prev)
        childrenToPreBuild.forEach((children, path) => {
          if (!newBuilt.has(path)) {
            newBuilt.set(path, children)
          }
        })
        return newBuilt
      })
    }
  }, [])

  return {
    expandedPaths,
    builtChildren,
    toggleExpanded,
    expandAll,
    collapseAll,
    expandPaths
  }
}