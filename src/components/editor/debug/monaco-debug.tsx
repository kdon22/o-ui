'use client'

import { useState, useCallback } from 'react'
import { RuleCodeEditor } from '../components/rule-code-editor'

/**
 * 🔍 MONACO DEBUG COMPONENT
 * 
 * Simple test component to verify Monaco editor onChange is working
 */
export function MonacoDebugTest() {
  const [value, setValue] = useState('// Type here to test\nair = ""')
  const [changeCount, setChangeCount] = useState(0)
  const [lastChange, setLastChange] = useState('')

  const handleChange = useCallback((newValue: string) => {
    console.log('🔍 [MonacoDebugTest] onChange called:', {
      newValue,
      length: newValue.length,
      timestamp: new Date().toISOString()
    })
    
    setValue(newValue)
    setChangeCount(prev => prev + 1)
    setLastChange(new Date().toLocaleTimeString())
  }, [])

  const handleSave = useCallback(() => {
    console.log('🔍 [MonacoDebugTest] onSave called:', {
      currentValue: value,
      timestamp: new Date().toISOString()
    })
    alert(`Save called with value: "${value}"`)
  }, [value])

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-100 p-4 border-b">
        <h2 className="text-lg font-bold mb-2">Monaco Editor Debug Test</h2>
        <div className="text-sm space-y-1">
          <div>Changes: {changeCount}</div>
          <div>Last change: {lastChange}</div>
          <div>Current length: {value.length}</div>
          <div>Current value: <code className="bg-white px-1 rounded">{value}</code></div>
        </div>
        <button 
          onClick={handleSave}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Save (Ctrl+S)
        </button>
      </div>
      
      <div className="flex-1">
        <RuleCodeEditor
          value={value}
          onChange={handleChange}
          onSave={handleSave}
          height="100%"
        />
      </div>
    </div>
  )
}
