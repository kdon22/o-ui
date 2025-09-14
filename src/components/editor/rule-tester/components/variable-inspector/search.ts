import React from 'react'
import type { EnhancedVariable } from './types'

// 🔍 **SEARCH MATCH RESULT** - Represents a single search match with context
export interface SearchMatch {
  id: string
  variable: EnhancedVariable
  matchPath: string[]
  matchType: 'name' | 'value' | 'type'
  matchText: string
  valuePreview: string
  contextPath: string
}

// 🔍 **RECURSIVE SEARCH** - Search through all nested properties
export function searchInValue(value: unknown, searchTerm: string, maxDepth = 10, currentDepth = 0): boolean {
  if (currentDepth >= maxDepth) return false
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  // Check primitive values
  if (value === null || value === undefined) {
    return String(value).toLowerCase().includes(lowerSearchTerm)
  }
  
  const stringValue = String(value).toLowerCase()
  if (stringValue.includes(lowerSearchTerm)) {
    return true
  }
  
  // Recursively search objects
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      // Search array elements
      return value.some((item, index) => {
        // Check if array index matches
        if (String(index).toLowerCase().includes(lowerSearchTerm)) {
          return true
        }
        return searchInValue(item, searchTerm, maxDepth, currentDepth + 1)
      })
    } else {
      // Search object properties
      const obj = value as Record<string, unknown>
      return Object.entries(obj).some(([key, val]) => {
        // Check if property name matches
        if (key.toLowerCase().includes(lowerSearchTerm)) {
          return true
        }
        // Check if property value matches
        return searchInValue(val, searchTerm, maxDepth, currentDepth + 1)
      })
    }
  }
  
  return false
}

// 🔍 **ENHANCED SEARCH FILTER** - Filter variables by name/value recursively
export function filterVariables(variables: EnhancedVariable[], searchTerm: string): EnhancedVariable[] {
  if (!searchTerm) return variables
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  return variables.filter(variable => {
    // Check variable name
    if (variable.name.toLowerCase().includes(lowerSearchTerm)) {
      return true
    }
    
    // Check variable type
    if (variable.type.toLowerCase().includes(lowerSearchTerm)) {
      return true
    }
    
    // Check inspector type
    if (variable.inspectorType.toLowerCase().includes(lowerSearchTerm)) {
      return true
    }
    
    // Recursively search in the variable's value
    return searchInValue(variable.value, searchTerm)
  })
}

// 🔍 **COLLECT SEARCH MATCHES** - Find all matches with metadata for sidebar
export function collectSearchMatches(variables: EnhancedVariable[], searchTerm: string): SearchMatch[] {
  if (!searchTerm) return []
  
  const matches: SearchMatch[] = []
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  const collectFromVariable = (variable: EnhancedVariable, parentPath: string[] = []) => {
    const fullPath = [...parentPath, variable.name]
    const contextPath = fullPath.join('.')
    
    // Check variable name match
    if (variable.name.toLowerCase().includes(lowerSearchTerm)) {
      matches.push({
        id: `${contextPath}-name`,
        variable,
        matchPath: fullPath,
        matchType: 'name',
        matchText: variable.name,
        valuePreview: formatValuePreview(variable.value),
        contextPath
      })
    }
    
    // Check variable type match
    if (variable.type.toLowerCase().includes(lowerSearchTerm)) {
      matches.push({
        id: `${contextPath}-type`,
        variable,
        matchPath: fullPath,
        matchType: 'type',
        matchText: variable.type,
        valuePreview: formatValuePreview(variable.value),
        contextPath
      })
    }
    
    // Check value matches recursively
    const valueMatches = collectValueMatches(variable.value, lowerSearchTerm, fullPath)
    valueMatches.forEach(match => {
      matches.push({
        id: `${contextPath}-value-${matches.length}`,
        variable,
        matchPath: match.path,
        matchType: 'value',
        matchText: match.text,
        valuePreview: match.preview,
        contextPath: match.path.join('.')
      })
    })
  }
  
  // Collect matches from all variables recursively
  const processVariables = (vars: EnhancedVariable[], parentPath: string[] = []) => {
    vars.forEach(variable => {
      collectFromVariable(variable, parentPath)
      
      // Also process children if they exist
      if (variable.children && variable.children.length > 0) {
        processVariables(variable.children, [...parentPath, variable.name])
      }
    })
  }
  
  processVariables(variables)
  
  return matches
}

// Helper to collect value matches with paths
function collectValueMatches(
  value: unknown, 
  searchTerm: string, 
  basePath: string[], 
  maxDepth = 10, 
  currentDepth = 0
): Array<{ path: string[], text: string, preview: string }> {
  if (currentDepth >= maxDepth) return []
  
  const matches: Array<{ path: string[], text: string, preview: string }> = []
  
  // Check primitive values
  if (value === null || value === undefined) {
    const stringValue = String(value)
    if (stringValue.toLowerCase().includes(searchTerm)) {
      matches.push({
        path: basePath,
        text: stringValue,
        preview: stringValue
      })
    }
    return matches
  }
  
  const stringValue = String(value)
  if (stringValue.toLowerCase().includes(searchTerm)) {
    matches.push({
      path: basePath,
      text: stringValue,
      preview: formatValuePreview(value)
    })
  }
  
  // Recursively search objects and arrays
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const indexMatches = collectValueMatches(
          item, 
          searchTerm, 
          [...basePath, `[${index}]`], 
          maxDepth, 
          currentDepth + 1
        )
        matches.push(...indexMatches)
      })
    } else {
      const obj = value as Record<string, unknown>
      Object.entries(obj).forEach(([key, val]) => {
        // Check if property name matches
        if (key.toLowerCase().includes(searchTerm)) {
          matches.push({
            path: [...basePath, key],
            text: key,
            preview: formatValuePreview(val)
          })
        }
        
        // Check property value
        const keyMatches = collectValueMatches(
          val, 
          searchTerm, 
          [...basePath, key], 
          maxDepth, 
          currentDepth + 1
        )
        matches.push(...keyMatches)
      })
    }
  }
  
  return matches
}

// Helper to format value preview for display
function formatValuePreview(value: unknown, maxLength = 50): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  const stringValue = String(value)
  if (stringValue.length <= maxLength) return stringValue
  
  return stringValue.substring(0, maxLength) + '...'
}

// 🔍 **TEXT HIGHLIGHTER** - Highlight search matches
export function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || !text) return text
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      React.createElement('mark', {
        key: index,
        className: 'bg-yellow-200 text-yellow-900 px-0.5 rounded'
      }, part)
    ) : (
      part
    )
  )
}