'use client'

import { useCallback, useState, useEffect } from 'react'
import { create } from 'zustand'
import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
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

// Hidden persistence for OUTER (sidebar) tabs per entity (module-scoped singleton)
const useOuterTabStore = create<{ byKey: Record<string, string>; set: (key: string, tab: string) => void; get: (key: string) => string | undefined }>((set, get) => ({
  byKey: {},
  set: (key, tab) => set((state) => ({ byKey: { ...state.byKey, [key]: tab } })),
  get: (key) => get().byKey[key]
}))

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
  // 🎯 Smart default with hidden persistence
  const tabKey = `outer:${resourceType}:${resourceType === 'rule' ? (ruleId || '') : (classId || '')}`
  const persistedTab = useOuterTabStore.getState().get(tabKey)
  const defaultTabForMode = isCreateMode ? 'details' : 'code'
  const initialTab = persistedTab || defaultTabForMode
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  useEffect(() => {
    useOuterTabStore.getState().set(tabKey, initialTab)
  }, [tabKey, initialTab])
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
    // Only set default if nothing persisted for this entity
    const current = useOuterTabStore.getState().get(tabKey)
    if (!current) {
      const fallback = isCreateMode ? 'details' : 'code'
      setActiveTab(fallback)
      useOuterTabStore.getState().set(tabKey, fallback)
    }
  }, [isCreateMode, tabKey])

  // ============================================================================
  // 🚀 SSOT SAVE COORDINATOR - Single Source of Truth
  // ============================================================================

  // Saving is coordinated by editor-tabs/save at the tab level

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  // 🚀 ENTERPRISE: Use unified source code state for rules (always call hook)
  const ruleSourceCodeState = useRuleSourceCode(ruleId || 'dummy')

  // 🚀 Tab change for outer tabs (navigation only; saves owned by editors)
  const handleTabChange = useCallback(async (newTabKey: string) => {
    console.log('🚨🚨🚨 [EditorLayout] MAIN TAB SWITCH DETECTED!', {
      from: activeTab,
      to: newTabKey,
      resourceType
    })
    setActiveTab(newTabKey)
    useOuterTabStore.getState().set(tabKey, newTabKey)
  }, [activeTab, resourceType, ruleId])

  // Let individual editors handle their own beforeunload saves

  // Manual save function (for explicit saves if needed)
  const handleSaveRule = useCallback(async () => {
    // Container-level manual save no longer dispatches; tabs own their saves
  }, [])

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

  // Remove container-level auto-save; editors own persistence


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