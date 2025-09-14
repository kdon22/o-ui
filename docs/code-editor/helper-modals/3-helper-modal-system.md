# Helper Modal System - Dynamic Form Generation

## 🎯 Overview

This guide covers the **complete helper modal architecture** that dynamically generates UI forms from schemas and manages the modal lifecycle for code generation.

## 🎨 **Helper Factory Architecture**

### **Core Factory Component**
```typescript
// o-ui/src/components/auto-generated/code-helper/helper-factory.tsx
import React, { useState } from 'react'
import { SchemaFactory } from '@/lib/editor/schemas'
import { AutoForm } from '@/components/auto-generated/form'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import type { UnifiedSchema } from '@/lib/editor/schemas/types'

interface HelperFactoryProps {
  schema: UnifiedSchema
  initialData?: Record<string, any> // For editing existing helpers
  onCodeGenerated: (code: string) => void
  onClose: () => void
}

export function HelperFactory({
  schema,
  initialData,
  onCodeGenerated,
  onClose
}: HelperFactoryProps) {
  const [formData, setFormData] = useState(initialData || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Determine if we're editing or creating
  const isEditing = Boolean(initialData && Object.keys(initialData).length > 0)
  const modalTitle = isEditing ? `Edit ${schema.name}` : `Create ${schema.name}`
  const submitButtonText = isEditing ? 'Update Helper' : 'Generate Code'
  
  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear error for this field if it exists
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }
  
  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    schema.helperUI?.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.name]
        
        // Check for empty required fields
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          newErrors[field.name] = `${field.label} is required`
          return
        }
      }
      
      // Field-specific validation
      if (field.validation) {
        const value = formData[field.name]
        
        if (field.type === 'number' && value !== undefined) {
          if (field.validation.min !== undefined && value < field.validation.min) {
            newErrors[field.name] = `Minimum value is ${field.validation.min}`
          }
          if (field.validation.max !== undefined && value > field.validation.max) {
            newErrors[field.name] = `Maximum value is ${field.validation.max}`
          }
        }
        
        if (field.type === 'text' && field.validation.pattern && value) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            newErrors[field.name] = 'Invalid format'
          }
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsGenerating(true)
    
    try {
      // Generate code using schema factory
      const result = SchemaFactory.generate({
        type: 'helper',
        schema,
        context: {
          variable: '', // Not used for helpers
          helperParams: formData
        }
      })
      
      // Pass generated code to parent
      onCodeGenerated(result.code)
      
    } catch (error) {
      console.error('Code generation failed:', error)
      setErrors({ _form: 'Failed to generate code. Please check your inputs.' })
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      size="lg"
      className="helper-factory-modal"
    >
      <ModalHeader className="border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isEditing ? '✏️' : '➕'}</span>
          <div>
            <h2 className="text-lg font-semibold">{modalTitle}</h2>
            <p className="text-sm text-gray-600">{schema.description}</p>
          </div>
        </div>
      </ModalHeader>
      
      <ModalBody className="max-h-96 overflow-y-auto">
        {/* Editing indicator */}
        {isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="text-blue-800 text-sm">
                Editing existing helper. Current settings have been loaded.
              </span>
            </div>
          </div>
        )}
        
        {/* Form errors */}
        {errors._form && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800 text-sm">{errors._form}</span>
            </div>
          </div>
        )}
        
        {/* Dynamic form */}
        <AutoForm
          fields={schema.helperUI?.fields || []}
          data={formData}
          errors={errors}
          onChange={handleFieldChange}
        />
      </ModalBody>
      
      <ModalFooter className="border-t">
        <div className="flex items-center justify-between w-full">
          {/* Helper info */}
          <div className="text-xs text-gray-500">
            Helper: {schema.name} • Category: {schema.category}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}
```

## 🔧 **Auto-Generated Form System**

### **Form Field Components**
```typescript
// o-ui/src/components/auto-generated/form/auto-form.tsx
import React from 'react'
import type { UIFieldSchema } from '@/lib/editor/schemas/types'

interface AutoFormProps {
  fields: UIFieldSchema[]
  data: Record<string, any>
  errors?: Record<string, string>
  onChange: (fieldName: string, value: any) => void
}

export function AutoForm({ fields, data, errors = {}, onChange }: AutoFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={data[field.name]}
          error={errors[field.name]}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
    </div>
  )
}

interface FormFieldProps {
  field: UIFieldSchema
  value: any
  error?: string
  onChange: (value: any) => void
}

function FormField({ field, value, error, onChange }: FormFieldProps) {
  const commonProps = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    required: field.required,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${field.name}-error` : undefined
  }
  
  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...commonProps}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...commonProps}
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...commonProps}
          />
        )
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...commonProps}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        )
      
      case 'checkboxGroup':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter(v => v !== option.value))
                    }
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )
      
      default:
        return (
          <div className="text-red-500 text-sm">
            Unsupported field type: {field.type}
          </div>
        )
    }
  }
  
  return (
    <div className="form-field">
      {/* Label */}
      {field.type !== 'checkbox' && (
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input */}
      {renderInput()}
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
      )}
      
      {/* Error message */}
      {error && (
        <p id={`${field.name}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
```

## 🎮 **Modal State Management**

### **Helper Modal Hook**
```typescript
// o-ui/src/components/auto-generated/code-helper/use-helper-factory.ts
import { useState, useCallback } from 'react'
import type { UnifiedSchema } from '@/lib/editor/schemas/types'

interface HelperModalState {
  schema: UnifiedSchema
  mode: 'create' | 'edit'
  initialData?: Record<string, any>
  onComplete: (code: string) => void
  onCancel: () => void
}

export function useHelperFactory() {
  const [modalState, setModalState] = useState<HelperModalState | null>(null)
  
  // Open helper modal for creating new helper
  const openHelper = useCallback((schema: UnifiedSchema, onComplete: (code: string) => void) => {
    setModalState({
      schema,
      mode: 'create',
      onComplete: (code) => {
        onComplete(code)
        setModalState(null)
      },
      onCancel: () => setModalState(null)
    })
  }, [])
  
  // Open helper modal for editing existing helper
  const editHelper = useCallback((
    schema: UnifiedSchema, 
    initialData: Record<string, any>,
    onComplete: (code: string) => void
  ) => {
    setModalState({
      schema,
      mode: 'edit',
      initialData,
      onComplete: (code) => {
        onComplete(code)
        setModalState(null)
      },
      onCancel: () => setModalState(null)
    })
  }, [])
  
  // Close modal
  const closeHelper = useCallback(() => {
    setModalState(null)
  }, [])
  
  return {
    modalState,
    openHelper,
    editHelper,
    closeHelper
  }
}
```

### **Helper Factory Provider**
```typescript
// o-ui/src/components/auto-generated/code-helper/helper-factory-provider.tsx
import React, { createContext, useContext } from 'react'
import { HelperFactory } from './helper-factory'
import { useHelperFactory } from './use-helper-factory'

const HelperFactoryContext = createContext<ReturnType<typeof useHelperFactory> | null>(null)

export function HelperFactoryProvider({ children }: { children: React.ReactNode }) {
  const helperFactory = useHelperFactory()
  
  return (
    <HelperFactoryContext.Provider value={helperFactory}>
      {children}
      
      {/* Render modal if active */}
      {helperFactory.modalState && (
        <HelperFactory
          schema={helperFactory.modalState.schema}
          initialData={helperFactory.modalState.initialData}
          onCodeGenerated={helperFactory.modalState.onComplete}
          onClose={helperFactory.modalState.onCancel}
        />
      )}
    </HelperFactoryContext.Provider>
  )
}

export function useHelperFactoryContext() {
  const context = useContext(HelperFactoryContext)
  if (!context) {
    throw new Error('useHelperFactoryContext must be used within HelperFactoryProvider')
  }
  return context
}
```

## 🔄 **Code Insertion Integration**

### **Monaco Editor Integration**
```typescript
// o-ui/src/components/editor/helpers/helper-code-inserter.ts
import * as monaco from 'monaco-editor'

export interface CodeInsertionResult {
  blockId: string
  range: monaco.Range
  success: boolean
  error?: string
}

export class HelperCodeInserter {
  private editor: monaco.editor.IStandaloneCodeEditor
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
  }
  
  // Insert new helper code at cursor position
  insertHelperCode(code: string, schemaId: string): CodeInsertionResult {
    const position = this.editor.getPosition()
    const model = this.editor.getModel()
    
    if (!position || !model) {
      return { blockId: '', range: new monaco.Range(0, 0, 0, 0), success: false, error: 'Editor not ready' }
    }
    
    try {
      // Generate unique block ID
      const blockId = this.generateBlockId(schemaId)
      
      // Wrap code with helper markers
      const wrappedCode = this.wrapWithMarkers(code, blockId, schemaId)
      
      // Calculate insertion position (beginning of line)
      const insertionRange = new monaco.Range(
        position.lineNumber, 1, 
        position.lineNumber, 1
      )
      
      // Insert code
      this.editor.executeEdits('helper-insert', [{
        range: insertionRange,
        text: wrappedCode + '\n'
      }])
      
      // Calculate final range
      const linesAdded = wrappedCode.split('\n').length
      const finalRange = new monaco.Range(
        position.lineNumber, 1,
        position.lineNumber + linesAdded - 1, 
        model.getLineMaxColumn(position.lineNumber + linesAdded - 1)
      )
      
      // Position cursor after the block
      this.editor.setPosition(new monaco.Position(
        position.lineNumber + linesAdded, 1
      ))
      
      return {
        blockId,
        range: finalRange,
        success: true
      }
      
    } catch (error) {
      return {
        blockId: '',
        range: new monaco.Range(0, 0, 0, 0),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Replace existing helper code
  replaceHelperCode(
    existingRange: monaco.Range, 
    newCode: string, 
    blockId: string, 
    schemaId: string
  ): CodeInsertionResult {
    try {
      // Wrap new code with same block ID
      const wrappedCode = this.wrapWithMarkers(newCode, blockId, schemaId)
      
      // Replace existing code
      this.editor.executeEdits('helper-replace', [{
        range: existingRange,
        text: wrappedCode
      }])
      
      // Calculate new range
      const linesCount = wrappedCode.split('\n').length
      const newRange = new monaco.Range(
        existingRange.startLineNumber, 1,
        existingRange.startLineNumber + linesCount - 1,
        this.editor.getModel()?.getLineMaxColumn(existingRange.startLineNumber + linesCount - 1) || 1
      )
      
      return {
        blockId,
        range: newRange,
        success: true
      }
      
    } catch (error) {
      return {
        blockId: '',
        range: existingRange,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Generate unique block ID
  private generateBlockId(schemaId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `helper-${timestamp}-${random}`
  }
  
  // Wrap code with helper markers
  private wrapWithMarkers(code: string, blockId: string, schemaId: string): string {
    return `# HELPER_START:${blockId}:${schemaId}
${code}
# HELPER_END:${blockId}:${schemaId}`
  }
}
```

## 🎨 **Modal Styling & UX**

### **CSS Styling**
```css
/* o-ui/src/components/auto-generated/code-helper/helper-factory.css */

/* Modal styling */
.helper-factory-modal {
  max-width: 600px;
}

.helper-factory-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.helper-factory-modal .modal-body {
  padding: 1.5rem;
}

/* Form field styling */
.form-field {
  position: relative;
}

.form-field input,
.form-field textarea,
.form-field select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Error states */
.form-field input[aria-invalid="true"],
.form-field textarea[aria-invalid="true"],
.form-field select[aria-invalid="true"] {
  border-color: #ef4444;
}

.form-field input[aria-invalid="true"]:focus,
.form-field textarea[aria-invalid="true"]:focus,
.form-field select[aria-invalid="true"]:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Checkbox and radio styling */
.form-field input[type="checkbox"],
.form-field input[type="radio"] {
  accent-color: #667eea;
}

/* Required field indicator */
.form-field label .text-red-500 {
  font-weight: bold;
}

/* Loading states */
.form-field input:disabled,
.form-field textarea:disabled,
.form-field select:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 640px) {
  .helper-factory-modal {
    max-width: 95vw;
    margin: 1rem;
  }
  
  .helper-factory-modal .modal-body {
    max-height: 60vh;
    padding: 1rem;
  }
}

/* Animation for modal appearance */
@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.helper-factory-modal {
  animation: modal-appear 0.2s ease-out;
}
```

### **Accessibility Features**
```typescript
// Enhanced accessibility in form components
function FormField({ field, value, error, onChange }: FormFieldProps) {
  const fieldId = `helper-field-${field.name}`
  const errorId = `${fieldId}-error`
  const descId = `${fieldId}-desc`
  
  return (
    <div className="form-field" role="group" aria-labelledby={`${fieldId}-label`}>
      <label 
        id={`${fieldId}-label`}
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {field.label}
        {field.required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {/* Input with proper ARIA attributes */}
      <input
        id={fieldId}
        name={field.name}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${field.description ? descId : ''}`.trim()}
        aria-required={field.required}
        // ... other props
      />
      
      {/* Description */}
      {field.description && (
        <p id={descId} className="text-xs text-gray-500 mt-1">
          {field.description}
        </p>
      )}
      
      {/* Error with proper role */}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
```

## 🚀 **Usage Examples**

### **Basic Usage**
```typescript
// Using the helper factory in your component
import { useHelperFactoryContext } from '@/components/auto-generated/code-helper/helper-factory-provider'
import { getSchemaById } from '@/lib/editor/schemas'

function MyComponent() {
  const { openHelper } = useHelperFactoryContext()
  
  const handleCreateRemark = () => {
    const schema = getSchemaById('find-remark-helper')
    if (schema) {
      openHelper(schema, (generatedCode) => {
        console.log('Generated code:', generatedCode)
        // Insert code into editor
      })
    }
  }
  
  return (
    <button onClick={handleCreateRemark}>
      Add Vendor Remark Helper
    </button>
  )
}
```

### **With Editor Integration**
```typescript
// Complete integration example
function BusinessRulesEditor() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const { openHelper } = useHelperFactoryContext()
  
  const handleHelperButton = (schemaId: string) => {
    const schema = getSchemaById(schemaId)
    if (!schema || !editor) return
    
    openHelper(schema, (code) => {
      const inserter = new HelperCodeInserter(editor)
      const result = inserter.insertHelperCode(code, schemaId)
      
      if (!result.success) {
        console.error('Failed to insert code:', result.error)
      }
    })
  }
  
  return (
    <HelperFactoryProvider>
      <div className="editor-container">
        <div className="toolbar">
          <button onClick={() => handleHelperButton('find-remark-helper')}>
            🎫 Add Remark
          </button>
        </div>
        <MonacoEditor onMount={setEditor} />
      </div>
    </HelperFactoryProvider>
  )
}
```

This helper modal system provides a **complete, professional form generation experience** that transforms complex business logic creation into simple, guided workflows for non-technical users. 