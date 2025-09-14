// Smart Input Field - Type-Aware Parameter Input Component

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea' // TODO: Add textarea component or use Input
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Code2, Type } from 'lucide-react'

export interface ParameterDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum'
  required: boolean
  description?: string
  placeholder?: string
  defaultValue?: any
  enumOptions?: string[]
  arrayItemType?: 'string' | 'number' | 'object'
  objectSchema?: Record<string, ParameterDefinition>
}

interface SmartInputFieldProps {
  parameter: ParameterDefinition
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
  compact?: boolean
}

export function SmartInputField({
  parameter,
  value,
  onChange,
  error,
  disabled = false,
  compact = false
}: SmartInputFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isExpanded, setIsExpanded] = useState(false)

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle value changes with type conversion
  const handleChange = useCallback((newValue: any) => {
    let convertedValue = newValue

    // Type conversion based on parameter type
    switch (parameter.type) {
      case 'number':
        convertedValue = newValue === '' ? undefined : Number(newValue)
        break
      case 'boolean':
        convertedValue = Boolean(newValue)
        break
      case 'object':
        try {
          convertedValue = typeof newValue === 'string' ? JSON.parse(newValue) : newValue
        } catch {
          convertedValue = newValue // Keep as string if invalid JSON
        }
        break
      case 'array':
        convertedValue = Array.isArray(newValue) ? newValue : []
        break
    }

    setLocalValue(convertedValue)
    onChange(convertedValue)
  }, [parameter.type, onChange])

  // Render based on parameter type
  const renderInput = () => {
    switch (parameter.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={parameter.name}
              checked={Boolean(localValue)}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            <Label htmlFor={parameter.name} className="text-sm">
              {localValue ? 'True' : 'False'}
            </Label>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={parameter.placeholder || 'Enter number...'}
            disabled={disabled}
          />
        )

      case 'enum':
        return (
          <Select value={localValue || ''} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={parameter.placeholder || 'Select option...'} />
            </SelectTrigger>
            <SelectContent>
              {parameter.enumOptions?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'array':
        return renderArrayInput()

      case 'object':
        return renderObjectInput()

      case 'string':
      default:
        return (
          <Input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={parameter.placeholder || 'Enter text...'}
            disabled={disabled}
          />
        )
    }
  }

  // Render array input with add/remove functionality
  const renderArrayInput = () => {
    const arrayValue = Array.isArray(localValue) ? localValue : []

    const addItem = () => {
      const newItem = parameter.arrayItemType === 'number' ? 0 : 
                      parameter.arrayItemType === 'object' ? {} : ''
      handleChange([...arrayValue, newItem])
    }

    const removeItem = (index: number) => {
      const newArray = arrayValue.filter((_, i) => i !== index)
      handleChange(newArray)
    }

    const updateItem = (index: number, newValue: any) => {
      const newArray = [...arrayValue]
      newArray[index] = newValue
      handleChange(newArray)
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Items ({arrayValue.length})</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={disabled}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        
        {arrayValue.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded">
            <div className="flex-1">
              <SmartInputField
                parameter={{
                  name: `item-${index}`,
                  type: parameter.arrayItemType || 'string',
                  required: false
                }}
                value={item}
                onChange={(newValue) => updateItem(index, newValue)}
                disabled={disabled}
                compact={true}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              disabled={disabled}
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {arrayValue.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4 border border-dashed rounded">
            No items. Click "Add" to add items.
          </div>
        )}
      </div>
    )
  }

  // Render object input (JSON editor or structured)
  const renderObjectInput = () => {
    const [jsonMode, setJsonMode] = useState(false)
    const [jsonError, setJsonError] = useState<string | null>(null)

    if (jsonMode) {
      const jsonString = typeof localValue === 'object' 
        ? JSON.stringify(localValue, null, 2) 
        : String(localValue || '{}')

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">JSON Editor</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setJsonMode(false)}
            >
              <Type className="w-3 h-3 mr-1" />
              Form Mode
            </Button>
          </div>
          <textarea
            value={jsonString}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setJsonError(null)
                handleChange(parsed)
              } catch (error) {
                setJsonError('Invalid JSON')
                handleChange(e.target.value) // Keep as string for now
              }
            }}
            placeholder='{"key": "value"}'
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            rows={6}
            disabled={disabled}
          />
          {jsonError && (
            <div className="text-sm text-red-600">{jsonError}</div>
          )}
        </div>
      )
    }

    // Simple key-value mode for objects
    const objectValue = typeof localValue === 'object' && localValue !== null ? localValue : {}
    const entries = Object.entries(objectValue)

    const addProperty = () => {
      const newKey = `property${entries.length + 1}`
      handleChange({ ...objectValue, [newKey]: '' })
    }

    const removeProperty = (key: string) => {
      const { [key]: removed, ...rest } = objectValue
      handleChange(rest)
    }

    const updateProperty = (oldKey: string, newKey: string, value: any) => {
      if (oldKey !== newKey) {
        const { [oldKey]: removed, ...rest } = objectValue
        handleChange({ ...rest, [newKey]: value })
      } else {
        handleChange({ ...objectValue, [oldKey]: value })
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Object Properties</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setJsonMode(true)}
            >
              <Code2 className="w-3 h-3 mr-1" />
              JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProperty}
              disabled={disabled}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {entries.map(([key, value], index) => (
          <div key={`${key}-${index}`} className="flex items-center gap-2 p-2 border rounded">
            <Input
              type="text"
              value={key}
              onChange={(e) => updateProperty(key, e.target.value, value)}
              placeholder="Property name"
              className="w-1/3"
              disabled={disabled}
            />
            <div className="flex-1">
              <Input
                type="text"
                value={String(value || '')}
                onChange={(e) => updateProperty(key, key, e.target.value)}
                placeholder="Property value"
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeProperty(key)}
              disabled={disabled}
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4 border border-dashed rounded">
            No properties. Click "Add" to add properties.
          </div>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {renderInput()}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={parameter.name} className="text-sm font-medium">
          {parameter.name}
          {parameter.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="secondary" className="text-xs">
          {parameter.type}
        </Badge>
      </div>

      {parameter.description && (
        <p className="text-xs text-gray-600">{parameter.description}</p>
      )}

      {renderInput()}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  )
} 