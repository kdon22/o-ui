/**
 * 🏆 RULE STUDIO EDITOR - Gold Standard Implementation
 * 
 * Complete rule editing experience with tabbed interface.
 * Replaces the over-engineered BusinessRuleEditor with clean, focused architecture.
 * 
 * Features:
 * - Business Rules tab with unified Monaco system
 * - Real-time Python generation tab  
 * - Parameters tab for utility rules
 * - Clean state management
 * - Bulletproof SSR handling
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, RefreshCw, Lock } from 'lucide-react'
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api'
import { useRuleEditor } from '@/lib/editor/hooks'
import { useRuleSourceCode } from '../services/source-code-state-manager'
import { testUnifiedState } from '../services/test-unified-state'
import { RuleCodeEditor } from './rule-code-editor'
import { RulePythonViewer } from './rule-python-viewer'
import { ParametersEditor } from './parameters-editor'
import { DebugTabClient } from '../rule-tester/components/debug-tab-client'
import { useSession } from 'next-auth/react'
import { EditorContextService } from '../language/editor-context'
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context'
import { useNodeRuleHierarchy } from '@/hooks/node-rule-hierarchy/use-node-rule-hierarchy'
import { useEditorSave, ruleCodeAdapter, ruleParametersAdapter } from '@/lib/editor/save'

export interface RuleStudioEditorProps {
  ruleId: string
  enableParameters?: boolean
  // 🔥 CALLBACK CHAIN: Connect to parent components
  onRuleUpdate?: (updates: any) => void
  onSave?: () => void  
  hasUnsavedChanges?: boolean
}

/**
 * 🏆 GOLD STANDARD RULE STUDIO EDITOR
 * 
 * Single, focused component that orchestrates the complete rule editing experience
 */
export function RuleStudioEditor({ 
  ruleId, 
  enableParameters = true,
  onRuleUpdate,
  onSave,
  hasUnsavedChanges: parentHasUnsavedChanges
}: RuleStudioEditorProps) {
  
  console.log('🔥🔥🔥 [RuleStudioEditor] Rendering with parent callbacks:', {
    ruleId,
    hasOnRuleUpdate: !!onRuleUpdate,
    hasOnSave: !!onSave,
    parentHasUnsavedChanges,
    timestamp: new Date().toISOString()
  })
  
  const { data: session } = useSession()
  // 🎯 FIXED: Use action system for rule data + useRuleEditor for business rule editing
  const { data: ruleResponse, isLoading: loadingRule, error: ruleError } = useActionQuery(
    'rule.read', 
    { id: ruleId },
    { 
      enabled: !!ruleId && ruleId !== 'new',
      // 🔍 FORCE INDEXEDDB READ: Ensure we read from IndexedDB first
      staleTime: 0, // Always consider data stale to force fresh reads
      refetchOnMount: true // Always refetch on mount to get latest from IndexedDB
    }
  )
  
  // Extract rule from action system response
  const rule = ruleResponse?.data
  
  // 🔍 INHERITANCE: Get navigation context to determine if rule is inherited
  const navigationContext = useAutoNavigationContext()
  
  // 🔍 INHERITANCE: Use node rule hierarchy to check if this rule is inherited in current context
  const inheritanceResult = useNodeRuleHierarchy(
    navigationContext?.nodeId || '' // Only check inheritance if we have a node context
  )
  const inheritanceData = (inheritanceResult as any)?.data
  const loadingInheritance = (inheritanceResult as any)?.isLoading || false
  
  // 🔍 INHERITANCE: Determine if this specific rule is inherited in current context
  const isRuleInherited = useMemo(() => {
    if (!rule?.id || !navigationContext?.nodeId || !inheritanceData) return false
    
    // Find this rule in the inheritance data
    const inheritedRule = inheritanceData.rules?.find((r: any) => r.ruleId === rule.id)
    
    // 🚀 CRITICAL FIX: A rule is only read-only if it's inherited from a PARENT node
    // If the rule belongs to the current node (isInherited = false), it should be editable
    const isInherited = inheritedRule?.isInherited || false
    
    console.log('🔍 [RuleStudioEditor] Inheritance check:', {
      ruleId: rule.id,
      ruleName: rule.name,
      nodeId: navigationContext.nodeId,
      processId: navigationContext.processId,
      foundInHierarchy: !!inheritedRule,
      isInherited,
      shouldBeReadOnly: isInherited, // Only inherited rules should be read-only
      inheritanceLevel: inheritedRule?.inheritanceLevel,
      sourceNodeName: inheritedRule?.sourceNodeName,
      displayClass: inheritedRule?.displayClass,
      // 🚀 DEBUG: Additional context
      currentNodeId: navigationContext.nodeId,
      ruleData: inheritedRule ? {
        ruleId: inheritedRule.ruleId,
        isInherited: inheritedRule.isInherited,
        sourceNodeId: inheritedRule.sourceNodeId,
        sourceNodeName: inheritedRule.sourceNodeName
      } : null
    })
    
    // 🚀 ENTERPRISE FIX: Only return true if the rule is actually inherited from a parent
    // If isInherited is false, the rule belongs to this node and should be editable
    return isInherited
  }, [rule?.id, navigationContext?.nodeId, inheritanceData])
  
  // 🔍 DEBUG: Log rule data loading for parameters
  useEffect(() => {
    if (rule) {
      console.log('🔍 [RuleStudioEditor] Rule loaded from action system:', {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: (rule as any).type,
        hasSchema: !!(rule as any).schema,
        schemaPreview: (rule as any).schema ? 
          (typeof (rule as any).schema === 'string' ? 
            (rule as any).schema.substring(0, 100) + '...' : 
            'Object') : 
          null,
        isInherited: isRuleInherited,
        nodeContext: navigationContext?.nodeId
      })
    }
  }, [rule, isRuleInherited, navigationContext?.nodeId])
  
  // 🏆 REMOVED: Direct mutations - now using unified save system
  
  // 🏆 SSOT: Use the proper architecture we built - useRuleEditor is THE interface
  const {
    sourceCode,
    pythonCode: generatedCode,
    hasUnsavedChanges,
    loading: isLoadingEditor,
    error: sourceCodeError,
    isReady: isSourceCodeReady,
    onSourceCodeChange,
    saving: savingSourceCode,
    isDirtySinceServer,
    rule: serverRule
  } = useRuleEditor(ruleId)
  
  // 🏆 SSOT: No need for custom initialization - useRuleEditor handles everything
  
  // 🏆 SSOT: Combine states for UI using proper SSOT values
  const loading = loadingRule || loadingInheritance || isLoadingEditor
  const saving = savingSourceCode // Only use SSOT saving state
  const error = ruleError || sourceCodeError
  const isReady = !loading && !!rule
  // Provide editor context for language services (tenant/branch for DataTable lookups)
  useEffect(() => {
    if (!rule) return
    try {
      const tenantId = (rule as any).tenantId
      const currentBranchId = (rule as any).branchId
      const defaultBranchId = session?.user?.branchContext?.defaultBranchId || currentBranchId
      const userId = session?.user?.id || 'system'
      if (tenantId && currentBranchId) {
        EditorContextService.set({
          tenantId,
          branchContext: {
            currentBranchId,
            defaultBranchId
          }
        })
      }
    } catch {}
  }, [rule?.id, session?.user?.id, session?.user?.branchContext?.defaultBranchId])


  // UI state
  const [activeTab, setActiveTab] = useState('business-rules')
  const [localPythonCode, setLocalPythonCode] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [lastSourceCode, setLastSourceCode] = useState('')

  // Parameters state for auto-save
  const [hasUnsavedParameters, setHasUnsavedParameters] = useState(false)
  const [pendingParameters, setPendingParameters] = useState<any[] | undefined>(undefined) // Start undefined to avoid overriding
  const [pendingReturnType, setPendingReturnType] = useState<string | undefined>(undefined) // Start undefined to avoid overriding
  const [pendingSchema, setPendingSchema] = useState<any>(null)

  // 🏆 SSOT: Unified save system for Business Rules (rule code)
  const { 
    save: saveRuleTab, 
    setLastSaved: setRuleTabLastSaved,
    isDirty: ruleCodeIsDirty,
    updateSnapshot: updateRuleCodeSnapshot
  } = useEditorSave(
    ruleCodeAdapter,
    { id: ruleId, tab: 'rulecode' }
  )
  
  // 🏆 SSOT: Unified save system for Parameters tab
  const { 
    save: saveParametersTab, 
    setLastSaved: setParametersLastSaved,
    isDirty: parametersIsDirty,
    updateSnapshot: updateParametersSnapshot
  } = useEditorSave(
    ruleParametersAdapter,
    { id: ruleId, tab: 'parameters' }
  )

  // Initialize last-saved snapshot once source code is available
  useEffect(() => {
    if (sourceCode) {
      setRuleTabLastSaved({ sourceCode })
    }
  }, [sourceCode, setRuleTabLastSaved])

  // 🏆 SSOT: Update unified save system snapshot when source code changes
  useEffect(() => {
    if (sourceCode) {
      updateRuleCodeSnapshot({ sourceCode, pythonCode: generatedCode })
    }
  }, [sourceCode, generatedCode, updateRuleCodeSnapshot])

  // 🎯 DERIVED STATE: Calculate rule type and utility status BEFORE using in useEffect
  const ruleType = useMemo((): 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR' => {
    // Use the actual type field from the rule data
    return (rule as any)?.type || 'BUSINESS'
  }, [rule])

  const isUtilityRule = useMemo(() => {
    return ruleType === 'UTILITY'
  }, [ruleType])

  // 🏆 SSOT: Use proper SSOT for dirty state
  const isDirty = hasUnsavedChanges

  // 🔍 DEBUG: Log current state for debugging (AFTER derived state is calculated)
  useEffect(() => {
    const errorMessage = error instanceof Error ? error.message : error || null
    console.log('🏗️ [RuleStudioEditor] Component state:', {
      ruleId,
      loading,
      error: errorMessage,
      isReady,
      rule: rule ? `Rule(${rule.name})` : null,
      ruleType,
      isUtilityRule,
      enableParameters,
      showParametersTab: enableParameters && ruleType === 'UTILITY',
      sourceCode: sourceCode ? `"${sourceCode.substring(0, 30)}..."` : 'EMPTY',
      generatedCode: generatedCode ? `"${generatedCode.substring(0, 30)}..."` : null,
      localPythonCode: localPythonCode ? `"${localPythonCode.substring(0, 30)}..."` : null
    })
  }, [ruleId, loading, error, isReady, rule, ruleType, isUtilityRule, enableParameters, sourceCode, generatedCode, localPythonCode])

  // 🚀 FIXED: Only initialize Python code on first load, don't override real-time generation
  useEffect(() => {
    if (generatedCode && !localPythonCode) {
      console.log('🏁 [RuleStudioEditor] Initial Python code from useRuleEditor:', generatedCode)
      setLocalPythonCode(generatedCode)
      setLastSourceCode(sourceCode)
    }
  }, [generatedCode, sourceCode, localPythonCode])

  /**
   * Handle Python code generation from rule editor (REAL-TIME)
   * 🎯 CRITICAL: This is the primary source of Python code
   */
  const handlePythonGenerated = useCallback((pythonCode: string) => {
    console.log('🚀 [RuleStudioEditor] Real-time Python generated:', pythonCode)
    setLocalPythonCode(pythonCode)
    setLastSourceCode(sourceCode) // Store current sourceCode
  }, [sourceCode])

  // 🚀 FORCE INITIAL PYTHON GENERATION when sourceCode loads
  useEffect(() => {
    if (sourceCode && sourceCode.trim() && !localPythonCode) {
      console.log('⚡ [RuleStudioEditor] Forcing initial Python generation for existing content')
      // Trigger Python generation for existing content via the editor's onChange
      // This simulates the user typing to trigger the generation
      if (onSourceCodeChange) {
        setTimeout(() => {
          console.log('🔥 [RuleStudioEditor] Triggering onChange to force Python generation')
          onSourceCodeChange(sourceCode)
        }, 100)
      }
    }
  }, [sourceCode, localPythonCode, onSourceCodeChange])

  /**
   * Handle tab changes with smart Python regeneration and auto-save
   * 🎯 FIXED: Auto-save uses action system directly for parameters
   */
  const handleTabChange = useCallback(async (newTab: string) => {
    console.log('🔄 [RuleStudioEditor] Tab change requested:', { from: activeTab, to: newTab })
    
    // 🎯 AUTO-SAVE: Save parameters when leaving parameters tab (unified save system)
    if (activeTab === 'parameters' && parametersIsDirty && pendingSchema && rule?.id) {
      try {
        await saveParametersTab(
          { schema: pendingSchema, parameters: pendingParameters, returnType: pendingReturnType }, 
          { context: 'tab-switch', skipIfClean: true }
        )
        setHasUnsavedParameters(false)
      } catch (error) {
        console.warn('⚠️ [RuleStudioEditor] Parameters tab-switch save failed:', error)
        // Don't prevent tab change, but user will see unsaved state
      }
    }
    
    // Save rule code (+ python) when leaving Business Rules tab
    if (activeTab === 'business-rules' && sourceCode) {
      console.log('🔥🔥🔥 [RuleStudioEditor] BUSINESS RULES TAB SAVE TRIGGERED!', {
        ruleId,
        activeTab,
        newTab,
        sourceCodeLength: sourceCode.length,
        sourcePreview: sourceCode.substring(0, 100) + '...',
        pythonLength: (localPythonCode || generatedCode || '').length,
        pythonPreview: (localPythonCode || generatedCode || '').substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      })
      
      try {
        const pythonForSave = localPythonCode || generatedCode || ''
        console.log('💾 [RuleStudioEditor] Calling saveRuleTab with unified save system...')
        await saveRuleTab({ sourceCode, pythonCode: pythonForSave }, { context: 'tab-switch', skipIfClean: true })
        console.log('✅ [RuleStudioEditor] saveRuleTab completed successfully!')
      } catch (error) {
        console.error('❌ [RuleStudioEditor] saveRuleTab failed:', error)
      }
    } else {
      console.log('⏭️ [RuleStudioEditor] Skipping business rules save:', {
        ruleId,
        activeTab,
        newTab,
        hasSourceCode: !!sourceCode,
        sourceCodeLength: sourceCode?.length || 0,
        reason: activeTab !== 'business-rules' ? 'not leaving business-rules tab' : 'no source code'
      })
    }

    setActiveTab(newTab)
    console.log('✅ [RuleStudioEditor] Tab changed to:', newTab)
    
    // Auto-regenerate when switching to Python tab if content is dirty
    setIsRegenerating(prev => {
      const currentIsDirty = sourceCode !== lastSourceCode && sourceCode.trim() !== ''
      console.log('🔍 [RuleStudioEditor] Python regeneration check:', {
        newTab,
        currentIsDirty,
        sourceCode: sourceCode ? `"${sourceCode.substring(0, 30)}..."` : 'EMPTY',
        lastSourceCode: lastSourceCode ? `"${lastSourceCode.substring(0, 30)}..."` : 'EMPTY'
      })
      
      if (newTab === 'python' && currentIsDirty && sourceCode.trim()) {
        console.log('🔄 [RuleStudioEditor] Triggering Python regeneration')
        // The RuleCodeEditor will handle the actual generation via handlePythonGenerated
        setTimeout(() => setIsRegenerating(false), 500)
        return true
      }
      return prev
    })
  }, [activeTab, parametersIsDirty, pendingSchema, rule?.id, saveParametersTab, sourceCode, lastSourceCode])

  /**
   * Handle rule save (for business rules/source code)
   * 🚀 ENTERPRISE: Now uses unified save system
   */
  // 🏆 GENERIC SAVE SYSTEM: Use unified save system
  const handleSave = useCallback(async () => {
    console.log('💾 [RuleStudioEditor] Manual save initiated via generic save system')
    try {
      const pythonForSave = localPythonCode || generatedCode || ''
      const success = await saveRuleTab({ sourceCode, pythonCode: pythonForSave }, { context: 'manual', skipIfClean: false })
      if (success) {
        console.log('✅ [RuleStudioEditor] Manual save successful')
      } else {
        console.error('❌ [RuleStudioEditor] Manual save failed')
      }
    } catch (error) {
      console.error('❌ [RuleStudioEditor] Manual save failed with error:', error)
    }
  }, [sourceCode, localPythonCode, generatedCode, saveRuleTab])

  // 🏆 REMOVED: Global window function - unified save system handles close saves automatically via beforeunload
  // The useEditorSave hooks automatically handle save-on-close through their built-in beforeunload handlers
  // No need for manual global functions that compete with the unified system

  /**
   * Handle parameters change tracking - unified save system
   */
  const handleParametersChange = useCallback((parameters: any[]) => {
    setPendingParameters(parameters)
    setHasUnsavedParameters(true)
    
    // Generate schema for unified save system
    if (rule && parameters.length >= 0) {
      try {
        const { userUtilitySchemaGenerator } = require('@/lib/editor/services/user-utility-schema-generator')
        const schema = userUtilitySchemaGenerator.generateSchema(rule, parameters, pendingReturnType)
        setPendingSchema(schema)
        
        // 🏆 SSOT: Update unified save system snapshot
        updateParametersSnapshot({
          schema,
          parameters,
          returnType: pendingReturnType
        })
      } catch (error) {
        console.warn('⚠️ [RuleStudioEditor] Schema generation failed:', error)
      }
    }
  }, [rule, pendingReturnType, updateParametersSnapshot])

  /**
   * Handle return type change tracking - unified save system
   */
  const handleReturnTypeChange = useCallback((returnType: string) => {
    setPendingReturnType(returnType)
    setHasUnsavedParameters(true)
    
    // Generate schema for unified save system when return type changes
    if (rule && pendingParameters && pendingParameters.length >= 0) {
      try {
        const { userUtilitySchemaGenerator } = require('@/lib/editor/services/user-utility-schema-generator')
        const schema = userUtilitySchemaGenerator.generateSchema(rule, pendingParameters, returnType)
        setPendingSchema(schema)
        
        // 🏆 SSOT: Update unified save system snapshot
        updateParametersSnapshot({
          schema,
          parameters: pendingParameters,
          returnType
        })
      } catch (error) {
        console.warn('⚠️ [RuleStudioEditor] Schema generation failed on return type change:', error)
      }
    }
  }, [rule, pendingParameters, updateParametersSnapshot])

  /**
   * Handle parameters save for utility rules - unified save system
   * 🏆 SSOT: Now uses unified save system instead of direct mutations
   */
  const handleParametersSave = useCallback(async (parameters: any[], returnType: string, schema: any) => {
    if (!rule?.id) return
    
    console.log('💾 [RuleStudioEditor] Saving parameters via unified save system:', { 
      ruleId: rule.id,
      parameters: parameters.length, 
      returnType, 
      schemaGenerated: !!schema 
    })
    
    try {
      // Store pending changes
      setPendingParameters(parameters)
      setPendingReturnType(returnType)
      setPendingSchema(schema)
      
      // 🏆 SSOT: Use unified save system for parameters
      const success = await saveParametersTab(
        { schema, parameters, returnType },
        { context: 'manual', skipIfClean: false }
      )
      
      if (success) {
        // Clear unsaved state after successful save
        setHasUnsavedParameters(false)
        console.log('✅ [RuleStudioEditor] Parameters saved successfully via unified system')
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('❌ [RuleStudioEditor] Parameters save failed:', error)
      throw error // Let UI handle error display
    }
  }, [rule?.id, saveParametersTab])

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading rule...</span>
        <div className="text-xs text-muted-foreground ml-2">
          ID: {ruleId}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Failed to load rule</h3>
          <p className="text-sm mb-2">Error: {error instanceof Error ? error.message : String(error)}</p>
          <p className="text-xs text-muted-foreground">
            Rule ID: <span className="font-mono">{ruleId}</span>
          </p>
        </div>
      </div>
    )
  }

  // Not ready state
  if (!isReady || !rule) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Rule not found</h3>
          <p className="text-sm mb-2">
            {!isReady ? 'Editor not ready' : 'Rule data not available'}
          </p>
          <p className="text-xs">
            Rule ID: <span className="font-mono">{ruleId}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        
        {/* Tab Navigation */}
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="business-rules" className="relative">
            Business Rules
            {isDirty && activeTab !== 'business-rules' && (
              <div 
                className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" 
                title="Changes not reflected in Python code" 
              />
            )}
          </TabsTrigger>
          
          {/* Parameters Tab - Only for UTILITY type rules */}
          {enableParameters && ruleType === 'UTILITY' && (
            <TabsTrigger value="parameters" className="relative">
              Parameters Function
              {hasUnsavedParameters && (
                <div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" 
                  title="Unsaved parameter changes" 
                />
              )}
            </TabsTrigger>
          )}
          
          {/* Test Tab - Debugging functionality */}
          <TabsTrigger value="test" className="relative">
            Test
          </TabsTrigger>
          
          {/* Python Tab - Always visible */}
          <TabsTrigger value="python" className="relative">
            Python Output
            {isRegenerating && (
              <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
            )}
            {isDirty && activeTab !== 'python' && (
              <div 
                className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" 
                title="Click to refresh with latest changes" 
              />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          
          {/* 🏆 CONDITIONAL RENDERING: Actually unmount/remount Monaco editors for proper disposal */}
          {activeTab === "business-rules" && (
            <div className="h-full">
              {/* 🔍 INHERITANCE: Show read-only indicator if rule is inherited */}
              {isRuleInherited && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>
                    This rule is inherited from an ancestor node and cannot be edited here. 
                    To modify this rule, edit it at its source or create a copy for this node.
                  </span>
                </div>
              )}
              <RuleCodeEditor
                key="business-rules-editor" // Static key - should unmount naturally
                value={sourceCode}
                onChange={onSourceCodeChange}
                onPythonGenerated={handlePythonGenerated}
                onSave={handleSave}
                height="100%"
                ruleType={ruleType}
                readOnly={isRuleInherited} // 🔍 INHERITANCE: Make read-only if inherited
              />
            </div>
          )}

          {/* Parameters Tab - Only for UTILITY type rules */}
          {enableParameters && ruleType === 'UTILITY' && activeTab === "parameters" && (
            <div className="h-full">
              {/* 🔍 INHERITANCE: Show read-only indicator for parameters if rule is inherited */}
              {isRuleInherited && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>
                    Parameters for this inherited rule cannot be modified here. 
                    Edit at the source node to make changes.
                  </span>
                </div>
              )}
              <ParametersEditor
                key="parameters-editor" // Static key - should unmount naturally
                rule={rule as any}
                onParametersChange={handleParametersChange}
                onReturnTypeChange={handleReturnTypeChange}
                onSave={handleParametersSave}
                hasUnsavedChanges={hasUnsavedParameters}
                // 🚀 OPTIMISTIC UPDATES: Pass pending state as props
                optimisticParameters={pendingParameters}
                optimisticReturnType={pendingReturnType}
                // 🔍 TAB ACTIVATION: Pass active state and dirty flag
                isActive={activeTab === 'parameters'}
                isDirty={isDirty}
                currentSourceCode={sourceCode}
                readOnly={isRuleInherited} // 🔍 INHERITANCE: Make read-only if inherited
              />
            </div>
          )}

          {/* Test Tab - Debugging functionality */}
          {activeTab === "test" && (
            <div className="h-full">
              <DebugTabClient
                key="debug-tab-client" // Static key - should unmount naturally
                sourceCode={sourceCode}
                pythonCode={localPythonCode || generatedCode || ''}
                onChange={onSourceCodeChange}
                rule={rule as any}
              />
            </div>
          )}

          {/* Python Tab */}
          {activeTab === "python" && (
            <div className="h-full">
              {(() => {
                const displayValue = localPythonCode || generatedCode || ''
                console.log('📺 [RuleStudioEditor] Python Tab Display:', {
                  localPythonCode: localPythonCode ? `"${localPythonCode.substring(0, 50)}..."` : null,
                  generatedCode: generatedCode ? `"${generatedCode.substring(0, 50)}..."` : null,
                  displayValue: displayValue ? `"${displayValue.substring(0, 50)}..."` : 'EMPTY'
                })
                return (
                  <RulePythonViewer
                    key="python-viewer" // Static key - should unmount naturally
                    value={displayValue}
                    readOnly={true}
                    height="100%"
                  />
                )
              })()}
            </div>
          )}
          
        </div>
      </Tabs>
    </div>
  )
}

export default RuleStudioEditor