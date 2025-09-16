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
import { useRuleSaveCoordinator } from '../services/rule-save-coordinator'
import { testUnifiedState } from '../services/test-unified-state'
import { RuleCodeEditor } from './rule-code-editor'
import { RulePythonViewer } from './rule-python-viewer'
import { ParametersEditor } from './parameters-editor'
import { DebugTabClient } from '../rule-tester/components/debug-tab-client'
import { useSession } from 'next-auth/react'
import { EditorContextService } from '../language/editor-context'
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context'
import { useNodeRuleHierarchy } from '@/hooks/node-rule-hierarchy/use-node-rule-hierarchy'

export interface RuleStudioEditorProps {
  ruleId: string
  enableParameters?: boolean
}

/**
 * 🏆 GOLD STANDARD RULE STUDIO EDITOR
 * 
 * Single, focused component that orchestrates the complete rule editing experience
 */
export function RuleStudioEditor({ 
  ruleId, 
  enableParameters = true 
}: RuleStudioEditorProps) {
  
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
  
  // Action system mutations for parameters (clean & fast)
  const updateRuleMutation = useActionMutation('rule.update')
  
  // 🏆 SSOT: Use the proper architecture we built - useRuleEditor is THE interface
  const {
    sourceCode,
    pythonCode: generatedCode,
    hasUnsavedChanges,
    loading: isLoadingEditor,
    error: sourceCodeError,
    isReady: isSourceCodeReady,
    onSourceCodeChange,
    saveRule: saveSourceCode,
    saving: savingSourceCode,
    isDirtySinceServer,
    rule: serverRule
  } = useRuleEditor(ruleId)
  
  // 🏆 SSOT: No need for custom initialization - useRuleEditor handles everything
  
  // 🏆 SSOT: Combine states for UI using proper SSOT values
  const loading = loadingRule || loadingInheritance || isLoadingEditor
  const saving = savingSourceCode || updateRuleMutation.isPending
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
    
    // 🎯 AUTO-SAVE: Save parameters when leaving parameters tab
    if (activeTab === 'parameters' && hasUnsavedParameters && pendingSchema && rule?.id) {
      try {
        await updateRuleMutation.mutateAsync({
          id: rule.id,
          schema: pendingSchema // Complete UnifiedSchema object for IntelliSense
        })
        setHasUnsavedParameters(false)
      } catch (error) {
        // Don't prevent tab change, but user will see unsaved state
      }
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
  }, [activeTab, hasUnsavedParameters, pendingSchema, rule?.id, updateRuleMutation, sourceCode, lastSourceCode])

  /**
   * Handle rule save (for business rules/source code)
   * 🚀 ENTERPRISE: Now uses unified save coordinator
   */
  // 🏆 SSOT: Use proper save handler from useRuleEditor
  const handleSave = useCallback(async () => {
    console.log('💾 [RuleStudioEditor] Manual save initiated via SSOT')
    const success = await saveSourceCode()
    if (success) {
      console.log('✅ [RuleStudioEditor] Manual save successful')
    }
  }, [saveSourceCode])

  // 🏆 SSOT: Provide a global "save on close" hook for the header X button
  useEffect(() => {
    ;(window as any).__orpoc_saveOnClose = async () => {
      try {
        // 🏆 SSOT: Use proper save handler for close saves
        if (hasUnsavedChanges) {
          console.log('🔄 [RuleStudioEditor] Saving on close via SSOT')
          await saveSourceCode()
        }
        // If parameters pending, persist schema via action system
        if (hasUnsavedParameters && pendingSchema && rule?.id) {
          await updateRuleMutation.mutateAsync({ id: rule.id, schema: pendingSchema })
        }
      } catch (e) {
        // swallow to avoid blocking navigation
      }
    }
    return () => {
      if ((window as any).__orpoc_saveOnClose) {
        delete (window as any).__orpoc_saveOnClose
      }
    }
  }, [hasUnsavedChanges, hasUnsavedParameters, pendingSchema, rule?.id, saveSourceCode, updateRuleMutation])

  /**
   * Handle parameters change tracking for auto-save
   */
  const handleParametersChange = useCallback((parameters: any[]) => {
    setPendingParameters(parameters)
    setHasUnsavedParameters(true)
    
    // Generate schema for auto-save when parameters change
    // This ensures we always have a valid schema to save
    if (rule && parameters.length >= 0) {
      try {
        const { userUtilitySchemaGenerator } = require('@/lib/editor/services/user-utility-schema-generator')
        const schema = userUtilitySchemaGenerator.generateSchema(rule, parameters, pendingReturnType)
        setPendingSchema(schema)
      } catch (error) {
        
      }
    }
  }, [rule, pendingReturnType])

  /**
   * Handle return type change tracking for auto-save
   */
  const handleReturnTypeChange = useCallback((returnType: string) => {
    setPendingReturnType(returnType)
    setHasUnsavedParameters(true)
    
    // Generate schema for auto-save when return type changes
    if (rule && pendingParameters && pendingParameters.length >= 0) {
      try {
        const { userUtilitySchemaGenerator } = require('@/lib/editor/services/user-utility-schema-generator')
        const schema = userUtilitySchemaGenerator.generateSchema(rule, pendingParameters, returnType)
        setPendingSchema(schema)
      } catch (error) {
        
      }
    }
  }, [rule, pendingParameters])

  /**
   * Handle parameters save for utility rules
   * 🎯 FIXED: Now uses action system directly for parameters (clean & fast)
   */
  const handleParametersSave = useCallback(async (parameters: any[], returnType: string, schema: any) => {
    if (!rule?.id) return
    
    console.log('💾 [RuleStudioEditor] Saving utility schema via action system:', { 
      ruleId: rule.id,
      parameters: parameters.length, 
      returnType, 
      schemaGenerated: !!schema 
    })
    
    try {
      // Store pending changes for auto-save
      setPendingParameters(parameters)
      setPendingReturnType(returnType)
      setPendingSchema(schema)
      
      // 🚀 FIXED: Use action system directly for parameters (no Python generation needed)
      await updateRuleMutation.mutateAsync({
        id: rule.id,
        schema: schema // Complete UnifiedSchema object for IntelliSense
      })
      
      // Clear unsaved state after successful save
      setHasUnsavedParameters(false)
  
      
    } catch (error) {
      
      throw error // Let UI handle error display
    }
  }, [rule?.id, updateRuleMutation])

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