"use client"

import React, { useState } from 'react'
import { X, MoreHorizontal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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

interface VariableHoverPopoverProps {
  variable: Variable
  children: React.ReactNode
  showMoreIndicator?: boolean
}

// 🔍 **VARIABLE COMPLEXITY DETECTION**
export const isComplexVariable = (variable: Variable): boolean => {
  return (
    (typeof variable.value === 'object' && variable.value !== null) ||
    Array.isArray(variable.value) ||
    (typeof variable.value === 'string' && variable.value.length > 50)
  )
}

// 🎨 **FORMAT VALUE FOR DISPLAY**
export const formatValueForDisplay = (variable: any, type?: string, maxLength: number = 30): string => {
  // If variable has a displayValue field (from debug conversion), use it
  if (variable && typeof variable === 'object' && variable.displayValue !== undefined) {
    return variable.displayValue
  }
  
  // Otherwise format the value directly
  const value = variable?.value ?? variable
  
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  if (typeof value === 'string') {
    if (value.length > maxLength) {
      return `"${value.substring(0, maxLength)}..."`
    }
    return `"${value}"`
  }
  
  if (typeof value === 'object' && value.__type__) {
    // Handle Python class instances
    const props = Object.entries(value).filter(([key]) => !key.startsWith('__'))
    return `${value.__type__} {${props.length}}`
  }
  
  if (Array.isArray(value)) {
    return `[${value.length} items]`
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return `{${keys.length} properties}`
  }
  
  return String(value)
}

// 🎯 **HOVER TOOLTIP CONTENT**
const HoverTooltipContent: React.FC<{ variable: Variable }> = ({ variable }) => {
  const getHoverInfo = (variable: Variable): string => {
    const lines = []
    
    // Basic info
    lines.push(`Name: ${variable.name}`)
    lines.push(`Type: ${variable.type}`)
    lines.push(`Scope: ${variable.scope}`)
    
    // Value preview
    if (typeof variable.value === 'object' && variable.value !== null) {
      if (variable.value.__type__) {
        lines.push(`Class: ${variable.value.__type__}`)
        const props = Object.entries(variable.value)
          .filter(([key]) => !key.startsWith('__'))
          .slice(0, 3)
        props.forEach(([key, val]) => {
          lines.push(`  ${key}: ${typeof val === 'string' ? `"${val}"` : val}`)
        })
        if (Object.keys(variable.value).filter(k => !k.startsWith('__')).length > 3) {
          lines.push('  ...')
        }
      } else if (Array.isArray(variable.value)) {
        lines.push(`Length: ${variable.value.length}`)
        if (variable.value.length > 0) {
          lines.push(`First: ${JSON.stringify(variable.value[0])}`)
        }
      } else {
        const keys = Object.keys(variable.value).slice(0, 3)
        keys.forEach(key => {
          const val = variable.value[key]
          lines.push(`  ${key}: ${typeof val === 'string' ? `"${val}"` : val}`)
        })
        if (Object.keys(variable.value).length > 3) {
          lines.push('  ...')
        }
      }
    } else {
      lines.push(`Value: ${formatValueForDisplay(variable, variable.type, 50)}`)
    }
    
    // Change info
    if (variable.changed && variable.previousValue !== undefined) {
      lines.push(`Previous: ${formatValueForDisplay({value: variable.previousValue}, variable.type, 30)}`)
    }
    
    return lines.join('\n')
  }

  return (
    <div className="max-w-xs">
      <pre className="text-xs whitespace-pre-wrap font-mono">
        {getHoverInfo(variable)}
      </pre>
    </div>
  )
}

// 🎯 **POPOVER MODAL CONTENT**
const PopoverModalContent: React.FC<{ variable: Variable; onClose: () => void }> = ({ variable, onClose }) => {
  const renderPopoverContent = () => {
    if (!variable) return null

    // For objects with __type__ (classes), show clean property view
    if (typeof variable.value === 'object' && variable.value.__type__) {
      const cleanProps = Object.entries(variable.value)
        .filter(([key]) => !key.startsWith('__'))
        .sort(([a], [b]) => a.localeCompare(b))

      return (
        <div className="max-w-md max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div>
              <h3 className="font-semibold text-sm">{variable.name}</h3>
              <p className="text-xs text-gray-500">{variable.value.__type__} object</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {cleanProps.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="font-mono text-blue-600 min-w-0 flex-shrink-0">{key}</span>
                <span className="text-gray-400">=</span>
                <span className="font-mono text-green-700 break-all">
                  {typeof value === 'string' ? `"${value}"` : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // For arrays, show clean list view
    if (Array.isArray(variable.value)) {
      return (
        <div className="max-w-md max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div>
              <h3 className="font-semibold text-sm">{variable.name}</h3>
              <p className="text-xs text-gray-500">Array ({variable.value.length} items)</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            {variable.value.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="font-mono text-blue-600 min-w-0 flex-shrink-0">[{index}]</span>
                <span className="font-mono text-green-700 break-all">
                  {typeof item === 'string' ? `"${item}"` : JSON.stringify(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // For regular objects, show key-value pairs
    if (typeof variable.value === 'object' && variable.value !== null) {
      const entries = Object.entries(variable.value)
      
      return (
        <div className="max-w-md max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div>
              <h3 className="font-semibold text-sm">{variable.name}</h3>
              <p className="text-xs text-gray-500">Object ({entries.length} properties)</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="font-mono text-blue-600 min-w-0 flex-shrink-0">{key}</span>
                <span className="text-gray-400">=</span>
                <span className="font-mono text-green-700 break-all">
                  {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // For long strings, show full content
    if (typeof variable.value === 'string' && variable.value.length > 50) {
      return (
        <div className="max-w-md max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div>
              <h3 className="font-semibold text-sm">{variable.name}</h3>
              <p className="text-xs text-gray-500">String ({variable.value.length} characters)</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap break-words">
            "{variable.value}"
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-xl border p-4 m-4">
      {renderPopoverContent()}
    </div>
  )
}

// 🎯 **MORE INDICATOR COMPONENT**
export const MoreIndicator: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = "" }) => (
  <button
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }}
    className={`inline-flex items-center text-blue-500 hover:text-blue-700 text-xs ml-1 ${className}`}
    title="Click to view details"
  >
    <MoreHorizontal className="w-3 h-3" />
    <span className="ml-0.5">more</span>
  </button>
)

// 🎯 **MAIN COMPONENT WITH HOVER AND POPOVER**
export const VariableHoverPopover: React.FC<VariableHoverPopoverProps> = ({ 
  variable, 
  children, 
  showMoreIndicator = false 
}) => {
  const [showPopover, setShowPopover] = useState(false)
  
  const isComplex = isComplexVariable(variable)
  
  const handleMoreClick = () => {
    console.log('🔥 More button clicked for variable:', variable.name)
    if (isComplex) {
      setShowPopover(true)
    }
  }

  const handleMouseEnter = () => {
    // Mouse enter handler for future use
  }

  const handleMouseLeave = () => {
    // Mouse leave handler for future use
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className="inline-flex items-center cursor-help"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {children}
            {showMoreIndicator && isComplex && (
              <MoreIndicator onClick={handleMoreClick} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-xs">
            {variable.name}: {variable.type} = {String(variable.value)}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Popover Modal */}
      {showPopover && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" 
          onClick={() => setShowPopover(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PopoverModalContent 
              variable={variable} 
              onClose={() => setShowPopover(false)} 
            />
          </div>
        </div>
      )}
    </>
  )
}

export default VariableHoverPopover
