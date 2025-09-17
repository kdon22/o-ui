/**
 * 🏆 RuleStudioEditor - Clean Enterprise Orchestrator
 * 
 * The main rule studio editor component using the coordination pattern.
 * This is THE component that replaces the 782-line monolith.
 * 
 * Features:
 * - Clean coordination between editor state and save system
 * - Focused, single-responsibility architecture
 * - Preserves ALL existing Monaco and language features
 * - Enterprise-grade error handling and loading states
 */

'use client'

import { useEffect } from 'react'
import { useActionQuery } from '@/hooks/use-action-api'
import { useRuleStudio } from './hooks/use-rule-studio'
import { useRuleInheritance } from './hooks/use-rule-inheritance'
import { useTabManagement } from './hooks/use-tab-management'

// Layout and UI components
import { RuleStudioLayout } from './components/rule-studio-layout'
import { RuleLoadingState, ErrorDisplay } from './components/ui/index'

// Tab components  
import { BusinessRulesTab } from './components/tabs/business-rules-tab'
import { ParametersTab } from './components/tabs/parameters-tab'
import { PythonOutputTab } from './components/tabs/python-output-tab'
import { TestDebugTab } from './components/tabs/test-debug-tab'

// Types
import type { RuleStudioEditorProps } from './types'
import { PARAMETER_ENABLED_RULE_TYPES } from './constants'

/**
 * 🏆 GOLD STANDARD RULE STUDIO EDITOR
 * 
 * Clean, focused orchestrator that coordinates all the systems.
 * Under 100 lines of pure coordination logic.
 */
export function RuleStudioEditor({ 
  ruleId, 
  enableParameters = true,
  onRuleUpdate,
  onSave,
  hasUnsavedChanges: parentHasUnsavedChanges
}: RuleStudioEditorProps) {
  
  console.log('🚨🚨🚨 [RuleStudioEditor] NEW SYSTEM IS RENDERING! Component instantiated!')
  console.log('🏆🏆🏆 [RuleStudioEditor] Enterprise orchestrator rendering:', {
    ruleId,
    enableParameters,
    hasCallbacks: { onRuleUpdate: !!onRuleUpdate, onSave: !!onSave },
    timestamp: new Date().toISOString()
  })
  
  // 🎯 LAYER 1: Rule data from action system
  const { data: ruleResponse, isLoading: loadingRule, error: ruleError } = useActionQuery(
    'rule.read', 
    { id: ruleId },
    { 
      enabled: !!ruleId && ruleId !== 'new',
      staleTime: 0,
      refetchOnMount: true
    }
  )
  
  const rule = ruleResponse?.data
  const ruleType = (rule as any)?.type || 'BUSINESS'
  
  // 🎯 LAYER 2: Coordination between editor state and save system (THE MAGIC)
  const studio = useRuleStudio(ruleId)
  
  // 🎯 LAYER 3: Inheritance detection for read-only rules
  const inheritance = useRuleInheritance(ruleId)
  
  // 🎯 LAYER 4: Internal tab management (no auto-save needed - handled by generic save system)
  const tabs = useTabManagement({
    ruleId,
    // Trigger a save when leaving editable tabs (business-rules / parameters)
    onTabSwitch: async (fromTab, toTab) => {
      console.log('🔁 [RuleStudioEditor] onTabSwitch called', {
        fromTab,
        toTab,
        isDirty: studio.isDirty,
        saving: studio.saving
      })
      if (fromTab === 'business-rules' || fromTab === 'parameters') {
        try {
          // Save silently via studio to avoid parent onSave side-effects (navigation bounce)
          const saveStart = Date.now()
          const saved = studio.isDirty ? await studio.save() : true
          const durationMs = Date.now() - saveStart
          console.log('✅ [RuleStudioEditor] onTabSwitch save result', { saved, durationMs })
          return saved
        } catch (e) {
          console.error('[RuleStudioEditor] Tab switch save failed:', e)
          return false
        }
      }
      return true
    }
  })
  
  // 🚀 BRIDGE: Connect studio changes to parent callbacks
  const handleSourceCodeChange = (newCode: string) => {
    console.log('🚨🚨🚨 [RuleStudioEditor] SOURCE CODE CHANGE BRIDGE CALLED!', {
      ruleId,
      newLength: newCode.length,
      preview: newCode.substring(0, 100) + (newCode.length > 100 ? '...' : ''),
      fullValue: newCode.length < 200 ? newCode : 'TOO_LONG_TO_DISPLAY',
      timestamp: new Date().toISOString()
    })
    
    console.log('🔥 [RuleStudioEditor] Calling studio.changeSourceCode...')
    // Use coordinated change handler (manages both systems)
    studio.changeSourceCode(newCode)
    console.log('✅ [RuleStudioEditor] studio.changeSourceCode called successfully')
    
    // Notify parent if callback provided
    if (onRuleUpdate) {
      console.log('🔗 [RuleStudioEditor] Notifying parent with onRuleUpdate...')
      onRuleUpdate({ 
        sourceCode: newCode,
        pythonCode: studio.pythonCode
      })
      console.log('✅ [RuleStudioEditor] Parent notified via onRuleUpdate')
    } else {
      console.log('⚠️ [RuleStudioEditor] No onRuleUpdate callback provided')
    }
  }
  
  // 🚀 BRIDGE: Connect save to parent callback
  const handleSave = async () => {
    console.log('🚨🚨🚨 [RuleStudioEditor] MANUAL SAVE TRIGGERED!')
    console.log('💾 [RuleStudioEditor] Bridge: Manual save')
    const success = await studio.save()
    console.log('🚨🚨🚨 [RuleStudioEditor] MANUAL SAVE RESULT:', success)
    if (success && onSave) {
      onSave()
    }
    return success
  }
  
  // Manual save remains available via Monaco and global keybinding (Ctrl/Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])
  
  // 🏆 LOADING STATE: Combined loading from all systems
  const loading = loadingRule || inheritance.loading || studio.loading
  const error = ruleError || studio.error
  const showParametersTab = enableParameters && PARAMETER_ENABLED_RULE_TYPES.includes(ruleType as any)
  
  // Loading state
  if (loading) {
    return <RuleLoadingState ruleId={ruleId} />
  }
  
  // Error state  
  if (error) {
    return <ErrorDisplay error={error} ruleId={ruleId} context="rule" />
  }
  
  // Rule not found
  if (!rule) {
    return <ErrorDisplay error="Rule not found" ruleId={ruleId} context="rule" />
  }
  
  // 🏆 MAIN RENDER: Clean orchestration of all systems
  return (
    <div className="h-full relative">
      <RuleStudioLayout
      activeTab={tabs.activeTab}
      onTabChange={tabs.switchTab}
      isDirty={studio.isDirty}
      saving={studio.saving}
      ruleType={ruleType}
      enableParameters={enableParameters}
    >
      {{
        businessRules: (
          <BusinessRulesTab
            sourceCode={studio.sourceCode}
            pythonCode={studio.pythonCode}
            onChange={handleSourceCodeChange}
            onSave={handleSave}
            ruleType={ruleType}
            readOnly={inheritance.isReadOnly}
            inheritanceInfo={inheritance}
          />
        ),
        
        ...(showParametersTab && {
          parameters: (
            <ParametersTab
              rule={rule}
              sourceCode={studio.sourceCode}
              pythonCode={studio.pythonCode}
              onChange={handleSourceCodeChange}
              onSave={handleSave}
              readOnly={inheritance.isReadOnly}
              inheritanceInfo={inheritance}
              isActive={tabs.activeTab === 'parameters'}
              // TODO: Wire up parameters-specific handlers when needed
            />
          )
        }),
        
        python: (
          <PythonOutputTab
            pythonCode={studio.pythonCode}
            readOnly={true}
          />
        ),
        
        test: (
          <TestDebugTab
            sourceCode={studio.sourceCode}
            pythonCode={studio.pythonCode}
            onChange={handleSourceCodeChange}
            onSave={handleSave}
            rule={rule}
          />
        )
      }}
      </RuleStudioLayout>
    </div>
  )
}

export default RuleStudioEditor
