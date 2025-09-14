// Parameters Editor - Function Parameter Configuration

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { TextArea } from '@/components/ui/text-area'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Type, ChevronRight, ArrowUp, ArrowDown, Sparkles, Info } from 'lucide-react'
import type { Rule } from '@/features/rules/types'
import type { UnifiedSchema } from '@/lib/editor/schemas/types'
import { TypeSelectorPopover } from './type-selector-popover'
import { typeRegistry, TypeDefinition } from '../types/type-registry'
import { userUtilitySchemaGenerator } from '@/lib/editor/services/user-utility-schema-generator'
import type { UtilityParameter } from '@/lib/editor/services/utility-service'
import { InterfaceDetector, type ParsedInterface } from '@/lib/editor/services/interface-detector'

interface ParametersEditorProps {
  rule?: Rule | null
  onParametersChange: (parameters: UtilityParameter[]) => void
  onReturnTypeChange?: (returnType: string) => void
  onSave: (parameters: UtilityParameter[], returnType: string, schema: UnifiedSchema) => void
  hasUnsavedChanges: boolean
  // 🚀 OPTIMISTIC UPDATES: Accept pending state from parent
  optimisticParameters?: UtilityParameter[] | undefined
  optimisticReturnType?: string | undefined
  // 🔍 TAB ACTIVATION: Detect when parameters tab becomes active
  isActive?: boolean
  isDirty?: boolean // Whether the source code has unsaved changes
  currentSourceCode?: string // Current editor content (may differ from saved rule.sourceCode)
}



export function ParametersEditor({ 
  rule, 
  onParametersChange, 
  onReturnTypeChange,
  onSave, 
  hasUnsavedChanges,
  // 🚀 OPTIMISTIC UPDATES: Accept pending state from parent
  optimisticParameters,
  optimisticReturnType,
  // 🔍 TAB ACTIVATION: Detect when parameters tab becomes active
  isActive = false,
  isDirty = false,
  currentSourceCode
}: ParametersEditorProps) {
  
  // 🔍 DEBUG: Component mount detection
  console.log('🚀 [ParametersEditor] Component mounted/rendered with rule:', {
    hasRule: !!rule,
    ruleId: rule?.id,
    ruleName: rule?.name,
    optimisticParametersLength: optimisticParameters?.length || 0,
    optimisticReturnType: optimisticReturnType
  })
  
  const [parameters, setParameters] = useState<UtilityParameter[]>([])
  const [returnType, setReturnType] = useState<string>('string')
  
  // 🔍 INTERFACE DETECTION: Auto-detect interfaces and return type from code
  const [detectedInterfaces, setDetectedInterfaces] = useState<ParsedInterface[]>([])
  const [detectedReturnType, setDetectedReturnType] = useState<string | null>(null)
  const [returnTypeUpdated, setReturnTypeUpdated] = useState<boolean>(false)
  
  // 🚀 DIRECT DERIVATION: Calculate parameters directly from rule data
  const derivedParameters = useMemo(() => {
    const ruleData = rule as any
    if (!ruleData?.schema) return []
    
    try {
      const schemaData = typeof ruleData.schema === 'string' 
        ? JSON.parse(ruleData.schema) 
        : ruleData.schema
      
      if (schemaData?.parameters && Array.isArray(schemaData.parameters)) {
        const parsedParameters = schemaData.parameters.map((p: any, index: number) => ({
          id: p.id || `param-${index}`,
          name: p.name || '',
          type: p.type || 'string',
          className: p.className,
          required: p.required !== undefined ? p.required : true,
          description: p.description || '',
          defaultValue: p.defaultValue
        }))
        
        console.log('🚀 [ParametersEditor] Derived parameters from rule:', parsedParameters)
        return parsedParameters
      }
    } catch (error) {
      console.warn('Failed to derive parameters from rule schema:', error)
    }
    
    return []
  }, [rule])
  
  const derivedReturnType = useMemo(() => {
    const ruleData = rule as any
    if (!ruleData?.schema) return 'string'
    
    try {
      const schemaData = typeof ruleData.schema === 'string' 
        ? JSON.parse(ruleData.schema) 
        : ruleData.schema
      
      if (schemaData?.returnType) {
        console.log('🚀 [ParametersEditor] Derived return type from rule:', schemaData.returnType)
        return schemaData.returnType
      }
    } catch (error) {
      console.warn('Failed to derive return type from rule schema:', error)
    }
    
    return 'string'
  }, [rule])
  
  // 🔍 INTERFACE DETECTION: Parse interfaces and return type from source code
  useEffect(() => {
    // Use current editor content if available, otherwise fall back to saved rule content
    const sourceCodeToAnalyze = currentSourceCode || rule?.sourceCode
    
    if (sourceCodeToAnalyze) {
      console.log('🔍 [ParametersEditor] Analyzing source code for interfaces...', {
        usingCurrentContent: !!currentSourceCode,
        sourceLength: sourceCodeToAnalyze.length
      })
      
      // Parse interfaces from code
      const interfaces = InterfaceDetector.parseInterfaces(sourceCodeToAnalyze)
      setDetectedInterfaces(interfaces)
      
      // Detect return type from code
      const returnType = InterfaceDetector.detectReturnType(sourceCodeToAnalyze)
      setDetectedReturnType(returnType)
      
      console.log('🔍 [ParametersEditor] Interface detection results:', {
        interfaceCount: interfaces.length,
        interfaces: interfaces.map(i => i.name),
        detectedReturnType: returnType,
        sourcePreview: sourceCodeToAnalyze.substring(0, 100) + '...'
      })
    } else {
      // Clear detection when no source code
      setDetectedInterfaces([])
      setDetectedReturnType(null)
    }
  }, [rule?.sourceCode, currentSourceCode])

  // 🔍 TAB ACTIVATION VALIDATION: When tab becomes active with dirty code, validate and update return type
  useEffect(() => {
    const sourceCodeToCheck = currentSourceCode || rule?.sourceCode
    
    // Trigger when tab becomes active OR when detected return type changes
    if (isActive && sourceCodeToCheck) {
      console.log('🔍 [ParametersEditor] Tab activated - validating return type...', {
        isActive,
        isDirty,
        usingCurrentContent: !!currentSourceCode,
        hasDetectedReturnType: !!detectedReturnType,
        sourceCodeLength: sourceCodeToCheck.length
      })
      
      // Force re-analysis of the source code when tab becomes active
      const interfaces = InterfaceDetector.parseInterfaces(sourceCodeToCheck)
      const freshReturnType = InterfaceDetector.detectReturnType(sourceCodeToCheck)
      
      console.log('🔍 [ParametersEditor] Fresh analysis results:', {
        interfaceCount: interfaces.length,
        freshReturnType,
        currentDetectedReturnType: detectedReturnType
      })
      
      // Update detected interfaces and return type if fresh analysis found something
      if (interfaces.length > 0 || freshReturnType) {
        setDetectedInterfaces(interfaces)
        if (freshReturnType) {
          setDetectedReturnType(freshReturnType)
        }
      }
      
      // Get current return type from parameters editor state
      const currentReturnType = optimisticReturnType || returnType
      const returnTypeToUse = freshReturnType || detectedReturnType
      
      // Check if detected return type differs from current
      if (returnTypeToUse && returnTypeToUse !== currentReturnType) {
        console.log('🔄 [ParametersEditor] Return type changed in code:', {
          currentReturnType,
          returnTypeToUse,
          autoUpdating: true
        })
        
        // Auto-update the return type
        setReturnType(returnTypeToUse)
        
        // Notify parent component
        if (onReturnTypeChange) {
          onReturnTypeChange(returnTypeToUse)
        }
        
        // Show visual feedback
        setReturnTypeUpdated(true)
        console.log('✨ [ParametersEditor] Return type auto-updated from code changes')
        
        // Clear feedback after 3 seconds
        setTimeout(() => setReturnTypeUpdated(false), 3000)
      } else {
        console.log('✅ [ParametersEditor] Return type is already in sync with code')
      }
    }
  }, [isActive, isDirty, detectedReturnType, optimisticReturnType, returnType, onReturnTypeChange, currentSourceCode, rule?.sourceCode])
  
  // 🚀 AUTO-SYNC: Update return type when interface is detected (but not during tab activation to avoid conflicts)
  useEffect(() => {
    if (detectedReturnType && detectedReturnType !== returnType && !isActive) {
      console.log(`🔄 [ParametersEditor] Auto-updating return type: ${returnType} → ${detectedReturnType}`)
      setReturnType(detectedReturnType)
      if (onReturnTypeChange) {
        onReturnTypeChange(detectedReturnType)
      }
    }
  }, [detectedReturnType, returnType, onReturnTypeChange, isActive])
  
  // 🚀 OPTIMISTIC UPDATES: Use pending state from parent if available, otherwise use derived data
  const displayParameters = optimisticParameters || derivedParameters
  const displayReturnType = optimisticReturnType || detectedReturnType || derivedReturnType
  
  // 🔍 DEBUG: Check what's being displayed
  console.log('🎨 [ParametersEditor] Render state:', {
    parametersLength: parameters.length,
    derivedParametersLength: derivedParameters.length,
    optimisticParametersLength: optimisticParameters?.length || 0,
    displayParametersLength: displayParameters.length,
    displayParameters: displayParameters.map((p: UtilityParameter) => ({ id: p.id, name: p.name })),
    returnType,
    derivedReturnType,
    displayReturnType
  })
  


  // Initialize parameters and return type from rule data
  useEffect(() => {
    const ruleData = rule as any
    
    console.log('🔄 [ParametersEditor] Initializing from rule data:', {
      ruleId: ruleData?.id,
      ruleName: ruleData?.name,
      ruleType: ruleData?.type,
      hasSchema: !!ruleData?.schema,
      schemaType: typeof ruleData?.schema,
      schemaContent: ruleData?.schema ? (typeof ruleData.schema === 'string' ? 'string' : 'object') : null,
      hasLegacyParameters: !!ruleData?.parameters,
      hasLegacyReturnType: !!ruleData?.returnType,
      allRuleKeys: ruleData ? Object.keys(ruleData) : []
    })
    
    // 🎯 FIXED: Read from schema field (where the data is actually saved)
    let schemaData = null
    
    // Try to get schema from rule.schema field
    if (ruleData?.schema) {
      try {
        schemaData = typeof ruleData.schema === 'string' 
          ? JSON.parse(ruleData.schema) 
          : ruleData.schema
        
        console.log('🔄 [ParametersEditor] Parsed schema data:', {
          hasParameters: !!schemaData?.parameters,
          parametersCount: schemaData?.parameters?.length || 0,
          parametersPreview: schemaData?.parameters?.slice(0, 2), // Show first 2 parameters
          returnType: schemaData?.returnType,
          schemaId: schemaData?.id,
          schemaName: schemaData?.name,
          fullSchemaKeys: schemaData ? Object.keys(schemaData) : []
        })
      } catch (error) {
        console.warn('Failed to parse rule schema:', error)
      }
    }
    
    // Initialize parameters from schema
    if (schemaData?.parameters && Array.isArray(schemaData.parameters)) {
      const parsedParameters = schemaData.parameters.map((p: any, index: number) => ({
        id: p.id || `param-${index}`,
        name: p.name || '',
        type: p.type || 'string',
        className: p.className,
        required: p.required !== undefined ? p.required : true,
        description: p.description || '',
        defaultValue: p.defaultValue
      }))
      setParameters(parsedParameters)
      console.log('🔄 [ParametersEditor] Loaded parameters from schema:', parsedParameters)
      
      // 🔍 DEBUG: Check if state update worked
      setTimeout(() => {
        console.log('🔄 [ParametersEditor] State after setParameters:', {
          parametersLength: parameters.length,
          parametersPreview: parameters.map(p => ({ id: p.id, name: p.name }))
        })
      }, 0)
    }
    
    // Initialize return type from schema
    if (schemaData?.returnType) {
      setReturnType(schemaData.returnType)
      console.log('🔄 [ParametersEditor] Loaded return type from schema:', schemaData.returnType)
    }
    
    // 🔄 FALLBACK: Try legacy fields if schema is not available
    if (!schemaData) {
      // Legacy: Try direct parameters field
      if (ruleData?.parameters) {
        try {
          const parsed = typeof ruleData.parameters === 'string' 
            ? JSON.parse(ruleData.parameters) 
            : ruleData.parameters
          if (Array.isArray(parsed)) {
            setParameters(parsed.map((p: any, index: number) => ({
              id: p.id || `param-${index}`,
              name: p.name || '',
              type: p.type || 'string',
              className: p.className,
              required: p.required || false,
              description: p.description || '',
              defaultValue: p.defaultValue
            })))
          }
        } catch (error) {
          console.warn('Failed to parse legacy parameters:', error)
        }
      }
      
      // Legacy: Try direct returnType field
      if (ruleData?.returnType) {
        setReturnType(ruleData.returnType)
      }
    }
  }, [rule])

  // 🔍 DEBUG: Track parameters state changes
  useEffect(() => {
    console.log('🔄 [ParametersEditor] Parameters state changed:', {
      parametersLength: parameters.length,
      parameters: parameters.map((p: UtilityParameter) => ({ id: p.id, name: p.name, type: p.type }))
    })
  }, [parameters])

  // 🚀 OPTIMISTIC UPDATES: Sync local state with optimistic props
  // Only override if optimistic parameters actually have content
  useEffect(() => {
    if (optimisticParameters && optimisticParameters.length > 0) {
      console.log('🔄 [ParametersEditor] Applying optimistic parameters:', optimisticParameters)
      setParameters(optimisticParameters)
    }
  }, [optimisticParameters])

  useEffect(() => {
    if (optimisticReturnType && optimisticReturnType !== 'string' && optimisticReturnType !== returnType) {
      console.log('🔄 [ParametersEditor] Applying optimistic return type:', optimisticReturnType)
      setReturnType(optimisticReturnType)
    }
  }, [optimisticReturnType, returnType])

  const addParameter = () => {
    const newParam: UtilityParameter = {
      id: `param-${Date.now()}`,
      name: '',
      type: 'string',
      required: true,
      description: ''
    }
    const newParameters = [...displayParameters, newParam]
    setParameters(newParameters)
    onParametersChange(newParameters) // This will trigger auto-save in parent
  }

  const removeParameter = (id: string) => {
    const newParameters = displayParameters.filter((p: UtilityParameter) => p.id !== id)
    setParameters(newParameters)
    onParametersChange(newParameters) // This will trigger auto-save in parent
  }

  const updateParameter = (id: string, updates: Partial<UtilityParameter>) => {
    const newParameters = displayParameters.map((p: UtilityParameter) => 
      p.id === id ? { ...p, ...updates } : p
    )
    setParameters(newParameters)
    onParametersChange(newParameters) // This will trigger auto-save in parent
  }

  const moveParameter = (id: string, direction: 'up' | 'down') => {
    const currentIndex = displayParameters.findIndex((p: UtilityParameter) => p.id === id)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= displayParameters.length) return
    
    const newParameters = [...displayParameters]
    const [movedParam] = newParameters.splice(currentIndex, 1)
    newParameters.splice(newIndex, 0, movedParam)
    
    setParameters(newParameters)
    onParametersChange(newParameters)
  }

  const handleReturnTypeSelect = (type: TypeDefinition) => {
    setReturnType(type.name)
    if (onReturnTypeChange) {
      onReturnTypeChange(type.name) // This will trigger auto-save in parent
    }
  }

  const handleParameterTypeSelect = (parameterId: string, type: TypeDefinition) => {
    updateParameter(parameterId, { 
      type: type.name, 
      className: type.name !== type.name.toLowerCase() ? type.name : undefined
    })
  }



  return (
    <div className="h-full flex bg-gray-50">
      {/* Main Parameters Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Function Parameters</h2>
              <p className="text-xs text-gray-600">
                Define the input parameters for this utility function
              </p>
            </div>
            {/* Removed save button - now auto-saves */}
          </div>
          
          {/* Return Type Configuration with Auto-Detection */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-gray-600 font-medium">Return Type:</Label>
              
              {/* Auto-detected return type display */}
              {detectedReturnType ? (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="default" 
                    className={`text-xs px-2 py-1 transition-colors duration-300 ${
                      returnTypeUpdated 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {displayReturnType}
                  </Badge>
                  <Sparkles className={`h-3 w-3 transition-colors duration-300 ${
                    returnTypeUpdated ? 'text-green-500' : 'text-blue-500'
                  }`} />
                  <span className={`text-xs transition-colors duration-300 ${
                    returnTypeUpdated 
                      ? 'text-green-600 font-medium' 
                      : 'text-gray-500'
                  }`}>
                    {returnTypeUpdated ? 'Updated from code!' : 'Auto-detected from code'}
                  </span>
                </div>
              ) : (
                <TypeSelectorPopover
                  onTypeSelect={handleReturnTypeSelect}
                  selectedTypeId={displayReturnType}
                  side="bottom"
                  align="start"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 mr-2">
                      {displayReturnType}
                    </Badge>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </TypeSelectorPopover>
              )}
            </div>
            
            {/* Interface detection info */}
            {detectedInterfaces.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">
                    Interface Detected
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Found interface '{detectedReturnType}' with {detectedInterfaces[0]?.properties.length || 0} properties: {' '}
                  {detectedInterfaces[0]?.properties.map(p => p.name).join(', ')}
                </p>
              </div>
            )}
            
            {/* Helpful explanation */}
            <p className="text-xs text-gray-500 mt-1">
              {detectedReturnType 
                ? 'Return type automatically set from your "return" statement'
                : 'What this function returns'
              }
            </p>
          </div>
        </div>

        {/* Parameters List */}
        <ScrollArea className="flex-1 p-3 relative">
          {displayParameters.length === 0 ? (
            <div className="max-w-md mx-auto">
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Type className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No Parameters Yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add parameters to define the inputs your utility function accepts
                  </p>
                  <Button onClick={addParameter} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Parameter
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {displayParameters.map((param: UtilityParameter, index: number) => (
                <Card key={param.id} className="bg-white">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Parameter Order Controls */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveParameter(param.id, 'up')}
                          disabled={index === 0}
                          className="h-5 w-5 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <div className="text-xs text-gray-500 font-medium min-w-[16px] text-center">
                          {index + 1}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveParameter(param.id, 'down')}
                          disabled={index === displayParameters.length - 1}
                          className="h-5 w-5 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Parameter Configuration */}
                      <div className="flex-1 space-y-3">
                        {/* Name and Type Row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`name-${param.id}`} className="text-xs text-gray-600">Parameter Name</Label>
                            <Input
                              id={`name-${param.id}`}
                              value={param.name}
                              onChange={(e) => updateParameter(param.id, { name: e.target.value })}
                              placeholder="parameterName"
                              className="font-mono text-sm h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Type</Label>
                            <TypeSelectorPopover
                              onTypeSelect={(type) => handleParameterTypeSelect(param.id, type)}
                              selectedTypeId={param.type}
                              side="bottom"
                              align="start"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-between h-8 text-sm"
                              >
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {param.className || param.type}
                                </Badge>
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </TypeSelectorPopover>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <Label htmlFor={`desc-${param.id}`} className="text-xs text-gray-600">Description</Label>
                          <TextArea
                            id={`desc-${param.id}`}
                            value={param.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              updateParameter(param.id, { description: e.target.value })
                              // Auto-resize
                              e.target.style.height = 'auto'
                              e.target.style.height = e.target.scrollHeight + 'px'
                            }}
                            placeholder="Describe this parameter..."
                            rows={2}
                            className="text-sm resize-none overflow-hidden"
                            style={{ minHeight: '64px' }}
                          />
                        </div>

                        {/* Options Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`required-${param.id}`}
                              checked={param.required}
                              onCheckedChange={(checked) => updateParameter(param.id, { required: checked })}
                            />
                            <Label htmlFor={`required-${param.id}`} className="text-xs text-gray-600">
                              Required
                            </Label>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeParameter(param.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* 🚀 ADD PARAMETER BUTTON - Positioned after the last parameter */}
              <div className="flex justify-center pt-2">
                <Button 
                  onClick={addParameter}
                  size="sm"
                  variant="outline"
                  className="border-dashed border-2 hover:border-solid hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>


    </div>
  )
}