import type { InspectorValueType, EnhancedVariable, ValueHistory } from './types'

// 🔍 **ADVANCED TYPE DETECTION** - Better than basic typeof
export function detectValueType(value: unknown): InspectorValueType {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  const basicType = typeof value
  
  switch (basicType) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'function': return 'function'
    case 'symbol': return 'symbol'
    case 'bigint': return 'bigint'
    case 'object':
      if (Array.isArray(value)) return 'array'
      if (value instanceof Date) return 'date'
      if (value instanceof RegExp) return 'regexp'
      if (value instanceof Error) return 'error'
      if (value instanceof Promise) return 'promise'
      if (value instanceof Set) return 'set'
      if (value instanceof Map) return 'map'
      return 'object'
    default:
      return 'object'
  }
}

// 🎨 **TYPE STYLING** - Color coding like JetBrains IDEs
export function getTypeStyle(type: InspectorValueType) {
  const styles = {
    string: 'text-green-700',
    number: 'text-blue-600',
    boolean: 'text-purple-600', 
    null: 'text-gray-500',
    undefined: 'text-gray-500',
    array: 'text-orange-600',
    object: 'text-teal-600',
    function: 'text-pink-600',
    date: 'text-indigo-600',
    regexp: 'text-red-600',
    error: 'text-red-700',
    promise: 'text-yellow-600',
    set: 'text-cyan-600',
    map: 'text-emerald-600',
    symbol: 'text-violet-600',
    bigint: 'text-blue-800'
  }
  return styles[type] || 'text-gray-700'
}

// 🔧 **CLEAN VALUE FORMATTER** - Professional, no-clutter display
export function formatValue(value: unknown, type: InspectorValueType, context: 'main' | 'preview' = 'main'): string {
  switch (type) {
    case 'string':
      const str = String(value)
      // Only truncate extremely long strings (>120 chars) and only in preview
      if (context === 'preview' && str.length > 120) {
        return `"${str.slice(0, 100)}…"`
      }
      // Empty string gets special treatment
      if (str === '') return '""'
      return `"${str}"`
      
    case 'number':
      return String(value)
      
    case 'boolean':
      return String(value)
      
    case 'null':
      return 'null'
      
    case 'undefined':
      return 'undefined'
      
    case 'array':
      const arr = value as unknown[]
      // Clean, consistent array display
      if (arr.length === 0) return '[]'
      if (arr.length === 1) return '[1 item]'
      return `[${arr.length} items]`
      
    case 'object':
      if (value && typeof value === 'object') {
        const keys = Object.keys(value as Record<string, unknown>)
        // Clean, consistent object display
        if (keys.length === 0) return '{}'
        if (keys.length === 1) return '{1 key}'
        return `{${keys.length} keys}`
      }
      return '{}'
      
    case 'function':
      const func = value as Function
      const funcStr = func.toString()
      const match = funcStr.match(/^(?:async\s+)?(?:function\s*)?(\w*)\s*\(([^)]*)\)/)
      const name = match?.[1] || 'anonymous'
      const params = match?.[2]?.replace(/\s+/g, ' ').trim() || ''
      // Clean function display
      if (params.length > 30) {
        return `ƒ ${name}(…)`
      }
      return `ƒ ${name}(${params})`
      
    case 'date':
      // Cleaner date display
      const date = value as Date
      return date.toLocaleString()
      
    case 'regexp':
      return (value as RegExp).toString()
      
    case 'error':
      const error = value as Error
      return error.message || error.name || 'Error'
      
    case 'promise':
      return 'Promise'
      
    case 'set':
      const setSize = (value as Set<unknown>).size
      if (setSize === 0) return 'Set()'
      if (setSize === 1) return 'Set(1 item)'
      return `Set(${setSize} items)`
      
    case 'map':
      const mapSize = (value as Map<unknown, unknown>).size
      if (mapSize === 0) return 'Map()'
      if (mapSize === 1) return 'Map(1 entry)'
      return `Map(${mapSize} entries)`
      
    default:
      return String(value)
  }
}

// 🔄 **CHANGE DETECTION** - VS Code debugger-style change tracking
export function detectValueChange(current: unknown, previous: unknown): boolean {
  // Deep equality check for objects and arrays
  if (current === previous) return false
  
  // Handle null/undefined cases
  if (current == null || previous == null) {
    return current !== previous
  }
  
  // Handle arrays
  if (Array.isArray(current) && Array.isArray(previous)) {
    if (current.length !== previous.length) return true
    return current.some((item, index) => detectValueChange(item, previous[index]))
  }
  
  // Handle objects
  if (typeof current === 'object' && typeof previous === 'object') {
    const currentKeys = Object.keys(current as Record<string, unknown>)
    const previousKeys = Object.keys(previous as Record<string, unknown>)
    
    if (currentKeys.length !== previousKeys.length) return true
    
    return currentKeys.some(key => 
      detectValueChange(
        (current as Record<string, unknown>)[key],
        (previous as Record<string, unknown>)[key]
      )
    )
  }
  
  return current !== previous
}

// 🎯 **OLD VALUE FORMATTING** - Red strikethrough style
export function formatOldValue(oldValue: unknown, type: InspectorValueType): string {
  if (oldValue === undefined) return ''
  
  const formatted = formatValue(oldValue, type)
  return `(${formatted})`  // Strikethrough and red color applied via CSS
}

// ✨ **CHANGE TYPE DETECTION** - Determine what kind of change occurred
export function getChangeType(current: unknown, previous: unknown): 'added' | 'modified' | 'removed' {
  if (previous === undefined && current !== undefined) return 'added'
  if (previous !== undefined && current === undefined) return 'removed'
  return 'modified'
}

// 🔥 **CREATE VALUE HISTORY** - Track value changes over time
export function createValueHistory(
  current: unknown, 
  previous: unknown, 
  existingHistory?: ValueHistory
): ValueHistory {
  const now = Date.now()
  const changeType = getChangeType(current, previous)
  
  return {
    current,
    previous,
    changedAt: now,
    changeCount: (existingHistory?.changeCount || 0) + 1,
    changeType
  }
}

// 🎨 **CHANGE STYLING** - Visual indicators for different change types
export function getChangeStyle(changeType: 'added' | 'modified' | 'removed', isRecent = false) {
  const baseStyles = {
    added: 'bg-green-50 border-l-2 border-l-green-400',
    modified: 'bg-blue-50 border-l-2 border-l-blue-400', 
    removed: 'bg-red-50 border-l-2 border-l-red-400 line-through opacity-70'
  }
  
  const recentStyles = {
    added: 'bg-green-100 animate-pulse',
    modified: 'bg-blue-100 animate-pulse',
    removed: 'bg-red-100 animate-pulse'
  }
  
  return isRecent ? recentStyles[changeType] : baseStyles[changeType]
}

// 🕐 **RECENT CHANGE CHECK** - Is this change recent (within 3 seconds)?
export function isRecentChange(changedAt: number, thresholdMs = 3000): boolean {
  return Date.now() - changedAt < thresholdMs
}