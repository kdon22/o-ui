// Main Monaco Business Editor with Tabs

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, FileText, Settings } from 'lucide-react'
import { BusinessRulesEditor } from './business-rules-editor'
import { PythonEditor } from './python-editor'
import { ParametersEditor } from './parameters-editor'

// Define the props interface locally
interface MonacoBusinessEditorProps {
  rule?: {
    id?: string
    sourceCode?: string
    type?: 'BUSINESS' | 'UTILITY'
    [key: string]: any
  }
  onRuleUpdate?: (updates: any) => void
  onSave?: () => Promise<void> | void
  hasUnsavedChanges?: boolean
  initialTab?: string
  config?: any
}

// Define Variable type locally
interface Variable {
  name: string
  type: string
  description?: string
  className?: string
}

// Import the comprehensive Python translator (same as rule editor hook)
import { translateBusinessRulesToPython } from '@/lib/editor/python-generation'

// Advanced Python code generator using the same system as the rule editor
function generatePythonFromBusinessRules(businessRules: string): string {
  console.log('🔍 [generatePythonFromBusinessRules] Input:', {
    length: businessRules.length,
    trimmed: businessRules.trim().length,
    isEmpty: !businessRules.trim(),
    firstChars: businessRules.slice(0, 50)
  })
  
  if (!businessRules.trim()) {
    console.log('✅ [generatePythonFromBusinessRules] Empty input - returning placeholder')
    return '# No business rules defined yet\n# Write your rules in the Business Rules tab\n'
  }

  // Use the comprehensive Python translator (same as rule editor hook)
  console.log('🔄 [generatePythonFromBusinessRules] Translating with translateBusinessRulesToPython...')
  const result = translateBusinessRulesToPython(businessRules, { 
    generateComments: true, 
    strictMode: false 
  })
  console.log('🔍 [generatePythonFromBusinessRules] Translation result:', {
    success: result.success,
    codeLength: result.pythonCode?.length || 0,
    hasErrors: !!result.errors?.length
  })
  
  if (result.success) {
    console.log('✅ [generatePythonFromBusinessRules] Translation successful')
    return result.pythonCode
  } else {
    // If translation fails, show errors and fallback
    console.log('⚠️ [generatePythonFromBusinessRules] Translation failed, showing errors')
    let errorCode = '# Translation errors found:\n'
    if (result.errors) {
      result.errors.forEach(error => {
        errorCode += `# ${error}: ${error}\n`
      })
    }
    errorCode += '\n# Original business rules (as comments):\n'
    errorCode += businessRules.split('\n').map(line => `# ${line}`).join('\n')
    
    return errorCode
  }
}

export function MonacoBusinessEditor({
  rule,
  onRuleUpdate,
  onSave,
  hasUnsavedChanges,
  initialTab = 'business-rules',
  config
}: MonacoBusinessEditorProps) {
  console.log('🎯 [MonacoBusinessEditor] Simple approach - local state with strategic saves')
  
  // Determine available tabs based on rule type
  const isUtilityRule = rule?.type === 'UTILITY'
  
  type TabType = 'business-rules' | 'python' | 'parameters'
  
  const availableTabs: TabType[] = ['business-rules', 'python']
  const allTabs: TabType[] = isUtilityRule 
    ? ['business-rules', 'parameters', 'python']
    : availableTabs
  
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Smart tab selection based on rule type and initial preference
    if (isUtilityRule && initialTab === 'business-rules') return 'parameters'
    if (allTabs.includes(initialTab as TabType)) return initialTab as TabType
    return allTabs[0]
  })
  
  // 🚀 **SIMPLE**: Local state for real-time editing and Python generation
  const [businessRulesContent, setBusinessRulesContent] = useState(() => {
    return rule?.sourceCode || ''
  })
  
  // Track if content has changed (for strategic saves)
  const [hasChanges, setHasChanges] = useState(false)

  // Generate Python code whenever business rules change
  const pythonCode = useMemo(() => {
    console.log('🐍 [MonacoBusinessEditor] Generating Python for content:', {
      contentLength: businessRulesContent.length,
      isEmpty: !businessRulesContent.trim(),
      content: businessRulesContent.slice(0, 100) + '...'
    })
    const result = generatePythonFromBusinessRules(businessRulesContent)
    console.log('🐍 [MonacoBusinessEditor] Generated Python:', {
      resultLength: result.length,
      result: result.slice(0, 200) + '...'
    })
    return result
  }, [businessRulesContent])
  
  // Initialize content when rule loads
  useEffect(() => {
    if (rule?.sourceCode !== undefined) {
      console.log('🔄 [MonacoBusinessEditor] Loading rule content:', {
        ruleId: rule.id,
        contentLength: rule.sourceCode.length,
        preview: rule.sourceCode.slice(0, 100) + '...'
      })
      setBusinessRulesContent(rule.sourceCode)
      setHasChanges(false)
    }
  }, [rule?.sourceCode, rule?.id])
  
  // 🚀 **ENHANCED**: Handle content changes - update local state immediately, save strategically
  const handleBusinessRulesChange = useCallback((newContent: string) => {
    console.log('📝 [MonacoBusinessEditor] Content changed:', {
      length: newContent.length,
      isEmpty: !newContent.trim(),
      hasChanges: newContent !== (rule?.sourceCode || '')
    })
    
    // Update local state immediately (for real-time Python generation)
    setBusinessRulesContent(newContent)
    
    // Track if content has changed from saved version
    const changed = newContent !== (rule?.sourceCode || '')
    setHasChanges(changed)
    
    // Update parent component with sourceCode only - Python will be generated by useMemo
    if (onRuleUpdate) {
      onRuleUpdate({ sourceCode: newContent })
    }
  }, [rule?.sourceCode, onRuleUpdate])
  
  // 🚀 **STRATEGIC SAVE**: Save when switching tabs (including Python code)
  const handleTabChange = useCallback(async (newTab: string) => {
    console.log('🔄 [MonacoBusinessEditor] Tab changing:', { from: activeTab, to: newTab, hasChanges })
    
    // Save if there are changes before switching tabs
    if (hasChanges && rule?.id && onRuleUpdate) {
      console.log('💾 [MonacoBusinessEditor] Saving before tab switch...')
      try {
        // Update both sourceCode and pythonCode
        await onRuleUpdate({ 
          sourceCode: businessRulesContent,
          pythonCode: pythonCode // Use the live-generated Python code
        })
        
        // Also trigger the parent save if available
        if (onSave) {
          await onSave()
        }
        
        setHasChanges(false)
        console.log('✅ [MonacoBusinessEditor] Saved successfully with Python code')
      } catch (error) {
        console.error('❌ [MonacoBusinessEditor] Save failed:', error)
        // Continue with tab switch even if save fails
      }
    }
    
    setActiveTab(newTab as TabType)
  }, [activeTab, hasChanges, rule?.id, onRuleUpdate, onSave, businessRulesContent, pythonCode])
  
  // 🚀 **STRATEGIC SAVE**: Save on page unload/refresh/close (including Python code)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges && rule?.id) {
        // Try to save synchronously with Python code
        if (onRuleUpdate) {
          try {
            // Update both sourceCode and pythonCode synchronously
            onRuleUpdate({ 
              sourceCode: businessRulesContent,
              pythonCode: pythonCode // Use the live-generated Python code
            })
          } catch (error) {
            console.error('❌ [MonacoBusinessEditor] Sync save failed:', error)
          }
        }
        
        // Also try the parent save if available
        if (onSave) {
          const saveResult = onSave()
          if (saveResult && typeof saveResult.catch === 'function') {
            saveResult.catch(() => {}) // Fire and forget
          }
        }
        
        // Show browser warning
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return event.returnValue
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges, rule?.id, onRuleUpdate, onSave, businessRulesContent, pythonCode])

  // Handle parameter changes for utility rules
  const handleParametersChange = (parameters: any) => {
    console.log('🔧 Parameters changed:', parameters)
    if (onRuleUpdate) {
      onRuleUpdate({ parameters })
    }
  }

  // Handle return type changes for utility rules
  const handleReturnTypeChange = (returnType: string) => {
    console.log('🔄 Return type changed:', returnType)
    if (onRuleUpdate) {
      onRuleUpdate({ returnType })
    }
  }

  // Sample user variables for testing IntelliSense
  const sampleUserVariables: Variable[] = useMemo(() => [
    { name: 'totalPrice', type: 'number', description: 'Total price of booking' },
    { name: 'customerTier', type: 'string', description: 'Customer loyalty tier' },
    { name: 'isVip', type: 'boolean', description: 'VIP status flag' },
    { name: 'reservationDate', type: 'date', description: 'Date of reservation' },
    { name: 'customData', type: 'object', description: 'Custom business data', className: 'CustomData' }
  ], [])

  // 🚀 **ENHANCED**: Save handler - update both sourceCode and pythonCode
  const handleSave = useCallback(async () => {
    console.log('💾 [MonacoBusinessEditor] Save triggered')
    
    // First update the rule data with both sourceCode and pythonCode
    if (onRuleUpdate) {
      try {
        await onRuleUpdate({ 
          sourceCode: businessRulesContent,
          pythonCode: pythonCode // Use the live-generated Python code
        })
        console.log('✅ [MonacoBusinessEditor] Rule data updated with Python code')
      } catch (error) {
        console.error('❌ [MonacoBusinessEditor] Rule update failed:', error)
      }
    }
    
    // Then trigger the parent save
    if (onSave) {
      try {
        await onSave()
        setHasChanges(false)
        console.log('✅ [MonacoBusinessEditor] Save completed')
      } catch (error) {
        console.error('❌ [MonacoBusinessEditor] Save failed:', error)
        throw error
      }
    }
  }, [onSave, onRuleUpdate, businessRulesContent, pythonCode])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Show unsaved changes indicator */}
      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 text-sm flex items-center justify-between">
          <div>
            You have unsaved changes. They will be saved when you switch tabs or close the editor.
          </div>
          <button 
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
            onClick={handleSave}
          >
            Save Now
          </button>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <TabsList className="h-12 w-full justify-start bg-transparent p-1">
            <TabsTrigger 
              value="business-rules"
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Code className="h-4 w-4" />
              Business Rules
              {hasChanges && (
                <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                  •
                </span>
              )}
            </TabsTrigger>

            {/* Parameters Tab - Only show for UTILITY rules */}
            {isUtilityRule && (
              <TabsTrigger 
                value="parameters"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4" />
                Parameters
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                  Function
                </span>
              </TabsTrigger>
            )}
            
            <TabsTrigger 
              value="python"
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              Python Output
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                Live
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="business-rules" className="h-full mt-0 p-0">
            <BusinessRulesEditor
              value={businessRulesContent}
              onChange={handleBusinessRulesChange}
              onSave={handleSave}
              hasUnsavedChanges={hasChanges}
              height="100%"
              userVariables={sampleUserVariables}
            />
          </TabsContent>

          {/* Parameters Tab - Only render for UTILITY rules */}
          {isUtilityRule && (
            <TabsContent value="parameters" className="h-full mt-0 p-0">
              <ParametersEditor
                rule={rule as any}
                onParametersChange={handleParametersChange}
                onReturnTypeChange={handleReturnTypeChange}
                onSave={handleSave}
                hasUnsavedChanges={hasChanges}
                isActive={activeTab === 'parameters'}
                isDirty={hasChanges}
                currentSourceCode={businessRulesContent}
              />
            </TabsContent>
          )}

          <TabsContent value="python" className="h-full mt-0 p-0">
            <PythonEditor
              value={pythonCode}
              readOnly={true}
              height="100%"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 