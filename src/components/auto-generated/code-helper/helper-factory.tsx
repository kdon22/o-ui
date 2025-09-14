// Helper Factory - Schema → Helper UI generator
// Uses basic UI components for simplicity

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextArea } from '@/components/ui/text-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SchemaFactory, type UnifiedSchema, type UIFieldSchema } from '@/lib/editor/schemas'

interface HelperFactoryProps {
  schema: UnifiedSchema
  initialData?: Record<string, any>
  isOpen: boolean
  onClose: () => void
  onInsertCode: (code: string, imports?: string[]) => void
}

export function HelperFactory({ 
  schema, 
  initialData,
  isOpen, 
  onClose, 
  onInsertCode 
}: HelperFactoryProps) {
  // Validate schema type
  if (schema.type !== 'helper' || !schema.helperUI) {
    console.error(`Schema ${schema.id} is not a helper or missing helperUI config`)
    return null
  }

  const { helperUI } = schema

  // Convert schema fields to auto-form compatible format
  const formSchema = SchemaFactory.convertToAutoFormSchema(helperUI.fields)

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Generate code using the schema factory
      const result = SchemaFactory.generate({
        type: 'helper',
        schema,
        context: {
          variable: '', // Not used for helpers
          helperParams: formData
        }
      })

      // Insert the generated code
      onInsertCode(result.code, result.imports)
      onClose()
    } catch (error) {
      console.error('Error generating helper code:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{helperUI.title}</DialogTitle>
          {helperUI.description && (
            <DialogDescription>
              {helperUI.description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <SimpleHelperForm
          schema={schema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

// Simple form component for helpers
interface SimpleHelperFormProps {
  schema: UnifiedSchema
  initialData?: Record<string, any>
  onSubmit: (formData: Record<string, any>) => void
  onCancel: () => void
}

function SimpleHelperForm({ schema, initialData, onSubmit, onCancel }: SimpleHelperFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {})
  
  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])
  
  if (!schema.helperUI) {
    return null
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const renderField = (field: UIFieldSchema) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )
      
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <TextArea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )
      
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select option..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'radio':
        return (
          <div key={field.name} className="space-y-3">
            <Label>{field.label}</Label>
            <RadioGroup 
              value={value} 
              onValueChange={(val) => handleFieldChange(field.name, val)}
              className="space-y-2"
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 'checkboxGroup':
        return (
          <div key={field.name} className="space-y-3">
            <Label>{field.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : []
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value)
                      handleFieldChange(field.name, newValues)
                    }}
                  />
                  <Label htmlFor={option.value} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.label}
            </Label>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.helperUI.fields.map(renderField)}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Generate Code
        </Button>
      </div>
    </form>
  )
}

// Helper component for schema-driven helper selection
interface HelperSelectorProps {
  schemas: UnifiedSchema[]
  onSelectHelper: (schema: UnifiedSchema) => void
  category?: string
}

export function HelperSelector({ 
  schemas, 
  onSelectHelper, 
  category 
}: HelperSelectorProps) {
  const helperSchemas = schemas.filter(s => s.type === 'helper')
  const filteredSchemas = category 
    ? helperSchemas.filter(s => s.helperUI?.category === category)
    : helperSchemas

  return (
    <div className="grid gap-2">
      {filteredSchemas.map((schema) => (
        <button
          key={schema.id}
          onClick={() => onSelectHelper(schema)}
          className="flex flex-col items-start p-3 text-left hover:bg-accent rounded-md transition-colors"
        >
          <div className="font-medium">{schema.helperUI?.title || schema.name}</div>
          <div className="text-sm text-muted-foreground">
            {schema.helperUI?.description || schema.description}
          </div>
        </button>
      ))}
    </div>
  )
}

// Hook for managing helper state
export function useHelperFactory() {
  const [selectedSchema, setSelectedSchema] = React.useState<UnifiedSchema | null>(null)
  const [initialData, setInitialData] = React.useState<Record<string, any> | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const openHelper = (schema: UnifiedSchema, data?: Record<string, any>) => {
    setSelectedSchema(schema)
    setInitialData(data || null)
    setIsOpen(true)
  }

  const closeHelper = () => {
    setIsOpen(false)
    setSelectedSchema(null)
    setInitialData(null)
  }

  return {
    selectedSchema,
    initialData,
    isOpen,
    openHelper,
    closeHelper
  }
} 