'use client'

import { useCallback, useState, useEffect } from 'react'
import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
import { useRuleSaveCoordinator } from '@/components/editor/services/rule-save-coordinator'
import { useRuleSourceCode } from '@/components/editor/services/source-code-state-manager'
import { EditorHeader } from './editor-header'
import { EditorTabs } from './editor-tabs'
import { ExtendedRule, ExtendedClass } from './types'

export interface EditorLayoutProps {
  // Rule-specific props
  ruleId?: string | null
  ruleIdShort?: string | null
  initialRule?: ExtendedRule | null
  
  // Class-specific props
  classId?: string | null
  classIdShort?: string | null
  initialClass?: ExtendedClass | null
}

export default function EditorLayout({ 
  ruleId, ruleIdShort, initialRule,
  classId, classIdShort, initialClass 
}: EditorLayoutProps) {
  const { session, isAuthenticated, isLoading: sessionLoading, branchContext } = useEnterpriseSession()
  
  // ============================================================================
  // ENTERPRISE SSR HANDLING - PROGRESSIVE LOADING
  // ============================================================================
  
  // During SSR or while session is loading, show loading state
  if (sessionLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
          </div>
        </div>
      </div>
    )
  }
  
  // Determine resource type based on props
  const resourceType = classId !== undefined || classIdShort !== undefined || initialClass !== undefined ? 'class' : 'rule'
  const isCreateMode = resourceType === 'class' ? (!classId || classId === 'new') : (!ruleId || ruleId === 'new')
  
  // Create default empty entities
  const createEmptyRule = (): ExtendedRule => ({
    id: ruleId || 'new',
    name: 'Untitled Rule',
    description: '',
    code: '',
    content: '',
    type: 'validation',
    isActive: true,
    version: 1
  })

  const createEmptyClass = (): ExtendedClass => ({
    id: classId || 'new',
    name: 'Untitled Class',
    description: '',
    pythonName: '',
    category: 'Utility',
    sourceCode: '',
    pythonCode: '',
    content: '',
    isActive: true,
    isAbstract: false,
    version: 1,
    methods: [],
    properties: [],
    imports: []
  })

  // State management for the current entity
  const [currentRule, setCurrentRule] = useState<ExtendedRule>(initialRule || createEmptyRule())
  const [currentClass, setCurrentClass] = useState<ExtendedClass>(initialClass || createEmptyClass())
  // 🎯 Smart default tab: 'code' for existing entities, 'details' for new ones
  const [activeTab, setActiveTab] = useState<string>(isCreateMode ? 'details' : 'code')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update entities when initial data changes
  useEffect(() => {
    if (resourceType === 'rule') {
      if (initialRule) {
        setCurrentRule(initialRule)
      } else {
        setCurrentRule(createEmptyRule())
      }
    } else {
      if (initialClass) {
        setCurrentClass(initialClass)
      } else {
        setCurrentClass(createEmptyClass())
      }
    }
  }, [initialRule, initialClass, ruleId, classId, resourceType])

  // 🎯 Update default tab when switching between create/edit modes
  useEffect(() => {
    // Set appropriate default tab based on create/edit mode
    const defaultTab = isCreateMode ? 'details' : 'code'
    setActiveTab(defaultTab)
  }, [isCreateMode]) // Only run when create mode changes

  // ============================================================================
  // 🚀 SSOT SAVE COORDINATOR - Single Source of Truth
  // ============================================================================

  // Use the unified RuleSaveCoordinator for all saving operations
  const { saveOnTabSwitch, saveOnClose } = useRuleSaveCoordinator()

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  // 🚀 ENTERPRISE: Use unified source code state for rules (always call hook)
  const ruleSourceCodeState = useRuleSourceCode(ruleId || 'dummy')

  // 🚀 **ENHANCED TAB CHANGE**: Auto-save current tab before switching
  const handleTabChange = useCallback(async (newTabKey: string) => {
    // Auto-save current tab if there are unsaved changes
    if (hasUnsavedChanges && activeTab !== newTabKey) {
      console.log(`🔄 [EditorLayout] Switching from ${activeTab} to ${newTabKey} - auto-saving...`)
      const entityId = resourceType === 'rule' ? ruleId : classId
      if (entityId && entityId !== 'new') {
        // 🚀 ENTERPRISE: For rules, get the latest source code from unified state
        if (resourceType === 'rule' && ruleId && ruleId !== 'dummy') {
          const { sourceCode, pythonCode } = ruleSourceCodeState.getRuleState()
          await saveOnTabSwitch(entityId, {
            ...currentRule,
            sourceCode,
            pythonCode
          } as any)
        } else {
          const currentEntity = resourceType === 'rule' ? currentRule : currentClass
          await saveOnTabSwitch(entityId, currentEntity as any)
        }
      }
    }

    setActiveTab(newTabKey)
  }, [activeTab, hasUnsavedChanges, saveOnTabSwitch, resourceType, ruleId, classId, currentRule, currentClass, ruleSourceCodeState])

  // Manual save function (for explicit saves if needed)
  const handleSaveRule = useCallback(async () => {
    const entityId = resourceType === 'rule' ? ruleId : classId
    if (entityId && entityId !== 'new') {
      const currentEntity = resourceType === 'rule' ? currentRule : currentClass
      await saveOnTabSwitch(entityId, currentEntity as any)
    }
  }, [saveOnTabSwitch, resourceType, ruleId, classId, currentRule, currentClass])

  const handleRuleUpdate = useCallback((updatedRule: Partial<ExtendedRule>) => {
    const newRule = { ...currentRule, ...updatedRule }
    setCurrentRule(newRule)
    setHasUnsavedChanges(true)
  }, [currentRule, ruleId])

  const handleClassUpdate = useCallback((updatedClass: Partial<ExtendedClass>) => {
    const newClass = { ...currentClass, ...updatedClass }
    setCurrentClass(newClass)
    setHasUnsavedChanges(true)
  }, [currentClass, classId])

  // Auto-save functionality - like VS Code
  useEffect(() => {
    if (!hasUnsavedChanges) return
    
    const autoSaveTimer = setTimeout(() => {
      handleSaveRule()
    }, 1000) // Auto-save after 1 second of no changes
    
    return () => clearTimeout(autoSaveTimer)
  }, [currentRule, currentClass, hasUnsavedChanges, handleSaveRule])


  const handleSearch = useCallback((query: string) => {
    // TODO: Implement universal search

  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  const currentEntity = resourceType === 'rule' ? currentRule : currentClass
  const entityIdShort = resourceType === 'rule' ? ruleIdShort : classIdShort
  const handleEntityUpdate = resourceType === 'rule' ? handleRuleUpdate : handleClassUpdate

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Thin Header Bar */}
      <EditorHeader
        rule={resourceType === 'rule' ? currentRule : undefined}
        class={resourceType === 'class' ? currentClass : undefined}
        onSearch={handleSearch}
        hasUnsavedChanges={hasUnsavedChanges}
        resourceType={resourceType}
      />
      
      {/* Main Content - Full Height Workspace */}
      <div className="flex-1 min-h-0">
        <EditorTabs
          rule={resourceType === 'rule' ? currentRule : undefined}
          class={resourceType === 'class' ? currentClass : undefined}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onRuleUpdate={resourceType === 'rule' ? handleRuleUpdate : undefined}
          onClassUpdate={resourceType === 'class' ? handleClassUpdate : undefined}
          onSave={handleSaveRule}
          hasUnsavedChanges={hasUnsavedChanges}
          ruleIdShort={ruleIdShort || undefined}
          classIdShort={classIdShort || undefined}
          resourceType={resourceType}
        />
      </div>
    </div>
  )
}