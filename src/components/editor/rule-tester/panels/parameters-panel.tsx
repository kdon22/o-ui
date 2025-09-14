"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TestParameters } from '../types'

interface ParametersPanelProps {
  businessRules: string
  onParametersChange: (parameters: TestParameters) => void
}

export const ParametersPanel = ({ businessRules, onParametersChange }: ParametersPanelProps) => {
  const [parameters, setParameters] = useState<TestParameters>({})
  const [autoDetectedVars, setAutoDetectedVars] = useState<string[]>([])

  // Auto-detect variables from business rules
  useEffect(() => {
    // Simple regex to find variable references (e.g., customer.age, booking.total)
    const varRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g
    const matches = businessRules.match(varRegex) || []
    const uniqueVars = [...new Set(matches)]
    setAutoDetectedVars(uniqueVars)

    // Initialize parameters for detected variables
    const initialParams: TestParameters = {}
    uniqueVars.forEach(varName => {
      if (!parameters[varName]) {
        initialParams[varName] = {
          name: varName,
          value: '',
          type: 'string' as const,
          required: false,
          description: `Auto-detected from: ${varName}`
        }
      }
    })
    
    if (Object.keys(initialParams).length > 0) {
      setParameters(prev => ({ ...prev, ...initialParams }))
    }
  }, [businessRules])

  const updateParameter = (name: string, value: any, type?: 'string' | 'number' | 'boolean' | 'array' | 'object') => {
    const updatedParams = {
      ...parameters,
      [name]: { ...parameters[name], value, ...(type && { type }) }
    }
    setParameters(updatedParams)
    onParametersChange(updatedParams)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-muted-foreground">
        Variables detected: {autoDetectedVars.length}
      </div>

      {autoDetectedVars.length === 0 && (
        <div className="text-sm text-muted-foreground italic">
          No variables detected. Write business rules to see parameters here.
        </div>
      )}

      {Object.entries(parameters).map(([name, param]) => (
        <div key={name} className="space-y-2">
          <Label className="text-xs font-medium">{name}</Label>
          <Input
            value={param.value}
            onChange={(e) => updateParameter(name, e.target.value)}
            placeholder={`Enter value for ${name}`}
            className="h-8 text-xs"
          />
        </div>
      ))}
    </div>
  )
} 