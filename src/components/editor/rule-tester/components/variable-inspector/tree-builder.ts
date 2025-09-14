import type { Variable } from '../../types'
import type { EnhancedVariable } from './types'
import { detectValueType, formatValue } from './utils'

// 🌳 **OBJECT TREE BUILDER** - Build expandable tree structure with lazy loading
export function buildVariableTree(
  variables: Variable[], 
  maxDepth = 8, // Increased depth for UTR data
  currentDepth = 0,
  parentPath: string[] = []
): EnhancedVariable[] {
  return variables.map(variable => {
    const inspectorType = detectValueType(variable.value)
    const path = [...parentPath, variable.name]
    
    let children: EnhancedVariable[] = []
    let size: number | undefined
    let keys: string[] | undefined
    let isExpandable = false
    
    // Determine if expandable and get size
    switch (inspectorType) {
      case 'object':
        if (variable.value && typeof variable.value === 'object') {
          const obj = variable.value as Record<string, unknown>
          keys = Object.keys(obj)
          size = keys.length
          isExpandable = size > 0
        }
        break
        
      case 'array':
        const arr = variable.value as unknown[]
        size = arr.length
        isExpandable = size > 0
        break
    }
    
    return {
      ...variable,
      inspectorType,
      size,
      keys,
      isExpandable,
      children, // Start with empty children - build on demand
      depth: currentDepth,
      path,
      preview: formatValue(variable.value, inspectorType, 'preview'),
      changed: (variable as any).changed,
      previousValue: (variable as any).previousValue
    }
  })
}

// 🔄 **LAZY CHILD BUILDER** - Build children only when needed
export function buildChildrenForVariable(
  variable: EnhancedVariable,
  maxDepth = 8
): EnhancedVariable[] {
  if (variable.depth >= maxDepth) {
    return []
  }
  
  let childVariables: Variable[] = []
  
  switch (variable.inspectorType) {
    case 'object':
      if (variable.value && typeof variable.value === 'object') {
        const obj = variable.value as Record<string, unknown>
        const keys = Object.keys(obj)
        childVariables = keys.map(key => ({
          name: key,
          value: obj[key],
          type: typeof obj[key] as any,
          scope: 'local' as const
        }))
      }
      break
      
    case 'array':
      const arr = variable.value as unknown[]
      childVariables = arr.map((item, index) => ({
        name: `[${index}]`,
        value: item,
        type: typeof item as any,
        scope: 'local' as const
      }))
      break
  }
  
  return buildVariableTree(childVariables, maxDepth, variable.depth + 1, variable.path)
}