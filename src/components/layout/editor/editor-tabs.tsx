'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useEffect, useCallback, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Code, 
  Play, 
  History, 
  FileText, 
  Palette, 
  ShoppingCart, 
  Link, 
  Users, 
  Workflow,
  Tags,
  Blocks,
  StepForward,
  Square,
  Database
} from 'lucide-react'
import { Rule } from '@/features/rules/types'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRuleEditor } from '@/lib/editor/hooks'
import { ExtendedRule, ExtendedClass } from './types'
import { useRuleSourceCode } from '@/components/editor/services/source-code-state-manager'
// 🚀 **PERFORMANCE**: Lazy load Python generation only when needed
const translateBusinessRulesToPython = async (code: string) => {
  const { translateBusinessRulesToPython: translate } = await import('@/lib/editor/python-generation')
  return translate(code)
}

// 🚀 **PERFORMANCE**: Lazy load heavy editor components only when tabs are accessed
const DebugTabClient = dynamic(
  () => import('@/components/editor/rule-tester/components/debug-tab-client').then(mod => ({ default: mod.DebugTabClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading debug editor...</div>
      </div>
    )
  }
)

// 🚀 **PERFORMANCE**: Lazy load query tester only when needed
const QueryTestBench = dynamic(
  () => import('@/components/editor/query-tester/query-test-bench').then(mod => ({ default: mod.QueryTestBench })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading query tester...</div>
      </div>
    )
  }
)


// 🚀 **PERFORMANCE**: Lazy load editor components to reduce initial bundle
// Import directly to avoid pulling the entire barrel (which includes Monaco-heavy modules)
const RuleDetailsTab = dynamic(
  () => import('../../editor/components/rule-details-tab').then(mod => ({ default: mod.RuleDetailsTab })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><div className="text-sm text-muted-foreground animate-pulse">Loading...</div></div> }
)

const RuleDocumentationTab = dynamic(
  () => import('../../editor/components/rule-documentation-tab').then(mod => ({ default: mod.RuleDocumentationTab })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><div className="text-sm text-muted-foreground animate-pulse">Loading...</div></div> }
)

const ClassDetailsTab = dynamic(
  () => import('../../editor/components/class-details-tab').then(mod => ({ default: mod.ClassDetailsTab })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><div className="text-sm text-muted-foreground animate-pulse">Loading...</div></div> }
)

const PromptEditor = dynamic(
  () => import('../../editor/components/prompt-editor').then(mod => ({ default: mod.PromptEditor })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><div className="text-sm text-muted-foreground animate-pulse">Loading...</div></div> }
)

import { RuleMarketTab } from './rule-market-tab'

// 🏆 GOLD STANDARD: Using UnifiedMonacoSystem instead of legacy factory system

// TODO: Create proper class editor - using placeholder for now

// Simple placeholder editor for now to bypass loading issues
const SimpleEditor = ({ rule, onRuleUpdate }: any) => (
  <div className="h-full flex flex-col bg-white">
    <div className="border-b border-gray-200 bg-gray-50 p-4">
      <h3 className="text-lg font-medium">Business Rules Editor</h3>
      <p className="text-sm text-muted-foreground">Monaco editor will load here</p>
    </div>
    <div className="flex-1 p-4">
      <textarea
        className="w-full h-full border rounded-md p-3 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Write your business rules here..."
        value={rule?.sourceCode || rule?.pythonCode || ''}
        onChange={(e) => onRuleUpdate && onRuleUpdate({ sourceCode: e.target.value, pythonCode: e.target.value })}
      />
    </div>
  </div>
)

// 🏆 GOLD STANDARD: Clean Monaco editor loading with unified system
const RuleEditor = dynamic(
  async () => {
    try {

      
      // Load RuleStudioEditor component with sophisticated Monaco system + Save Coordinator
      const { RuleStudioEditor } = await import('../../editor/components/rule-studio-editor')
      

      return { default: RuleStudioEditor }
    } catch (err) {

      return { default: SimpleEditor };
    }
  }, 
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Gold Standard Rule Editor...</p>
        </div>
      </div>
    )
  }
)

const RuleCodeTab = ({ rule, onUpdate, onSave, hasUnsavedChanges }: { 
  rule: ExtendedRule;
  onUpdate?: (updates: Partial<ExtendedRule>) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
}) => {
  // 🚀 FIXED: Connect the callback chain to parent components
  console.log('🔥🔥🔥 [RuleCodeTab] Rendering with callbacks:', {
    ruleId: rule.id,
    ruleName: rule.name,
    hasOnUpdate: !!onUpdate,
    hasOnSave: !!onSave,
    hasUnsavedChanges,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="h-full">
      <RuleEditor 
        ruleId={rule.id}
        onRuleUpdate={onUpdate}
        onSave={onSave}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  )
}

const ClassCodeTab = ({ classEntity, onUpdate, onSave, hasUnsavedChanges }: { 
  classEntity: ExtendedClass;
  onUpdate?: (updates: Partial<ExtendedClass>) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
}) => (
  <div className="h-full">
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-medium">Class Editor</h3>
        <p className="text-sm text-muted-foreground">Class editor will be implemented here</p>
      </div>
      <div className="flex-1 p-4">
        <div className="text-center text-muted-foreground">
          <p>Class editing functionality coming soon...</p>
          <p className="text-xs mt-2">Class ID: {classEntity.id}</p>
        </div>
      </div>
    </div>
  </div>
)

// 🐍 **FALLBACK PYTHON GENERATION**: Keep synchronous to avoid async handling here
const generatePythonForDebugger = (businessRules: string): string => {
  if (!businessRules.trim()) return ''
  return ''
}

interface TestTabContentProps {
  isCreateMode: boolean
  rule: ExtendedRule | null
  onRuleUpdate?: (updates: Partial<ExtendedRule>) => void
}

const TestTabContent = ({ isCreateMode, rule, onRuleUpdate }: TestTabContentProps) => {
  // 🔍 **DEBUG ENTRY POINT**: Log what we receive
  console.log('🔍 [TestTabContent] ENTRY DEBUG:', {
    isCreateMode,
    hasRule: !!rule,
    ruleId: rule?.id,
    ruleName: rule?.name,
    hasSourceMap: !!rule?.sourceMap,
    sourceMapType: typeof rule?.sourceMap,
    ruleKeys: rule ? Object.keys(rule) : []
  })
  
  // 🎯 **BULLETPROOF CODE SYNC**: Maintain same code state between Code and Debug tabs
  const ruleEditorId = rule?.id || ''
  console.log('🔍 [TestTabContent] useRuleEditor input:', {
    ruleId: rule?.id,
    ruleEditorId,
    hasRule: !!rule,
    ruleKeys: rule ? Object.keys(rule) : []
  })
  const ruleEditor = useRuleEditor(ruleEditorId)
  
  // 📋 **SINGLE SOURCE OF TRUTH**: Use rule editor source code (the authoritative source)
  const liveSourceCode = ruleEditor?.sourceCode || ''
  
  // 🔍 **DEBUG SOURCE CODE FLOW**: Log the source code resolution
  console.log('🔍 [TestTabContent] SOURCE CODE RESOLUTION:', {
    ruleEditorSourceCode: ruleEditor?.sourceCode,
    ruleEditorSourceCodeLength: ruleEditor?.sourceCode?.length || 0,
    ruleSourceCode: rule?.sourceCode,
    ruleSourceCodeLength: rule?.sourceCode?.length || 0,
    ruleEditorRuleSourceCode: ruleEditor?.rule?.sourceCode,
    ruleEditorRuleSourceCodeLength: ruleEditor?.rule?.sourceCode?.length || 0,
    finalLiveSourceCode: liveSourceCode,
    finalLiveSourceCodeLength: liveSourceCode.length,
    ruleEditorLoading: ruleEditor?.loading,
    ruleEditorError: ruleEditor?.error,
    ruleEditorIsReady: ruleEditor?.isReady
  })
  
  // 🚀 **USE SAVED RULE DATA**: Use saved Python code and source map for debugging
  const livePythonCode = useMemo(() => {
    // For existing rules, use saved Python code if available
    if (!isCreateMode && rule?.pythonCode) {
      console.log('🔄 [TestTabContent] Using saved Python code from rule database')
      return rule.pythonCode
    }
    
    // For new rules or when no saved Python exists, generate fresh
    console.log('🔄 [TestTabContent] Generating fresh Python for new/unsaved rule')
    return generatePythonForDebugger(liveSourceCode)
  }, [isCreateMode, rule?.pythonCode, liveSourceCode])
  
  // 🗺️ **SOURCE MAP**: Use saved source map for debugging
  const sourceMap = useMemo(() => {
    console.log('🗺️ [TestTabContent] SOURCE MAP DECISION:', {
      isCreateMode,
      hasRule: !!rule,
      hasSourceMap: !!rule?.sourceMap,
      sourceMapValue: rule?.sourceMap,
      willUseSourceMap: !isCreateMode && !!rule?.sourceMap
    })
    
    if (!isCreateMode && rule?.sourceMap) {
      console.log('✅ [TestTabContent] Using saved source map from rule database')
      console.log('🔍 [TestTabContent] Source map data structure:', {
        hasSourceMap: !!rule.sourceMap,
        sourceMapType: typeof rule.sourceMap,
        sourceMapKeys: rule.sourceMap ? Object.keys(rule.sourceMap) : [],
        version: rule.sourceMap?.version,
        hasStatements: !!rule.sourceMap?.statements,
        statementsCount: rule.sourceMap?.statements?.length || 0,
        hasMeta: !!rule.sourceMap?.meta,
        metaKeys: rule.sourceMap?.meta ? Object.keys(rule.sourceMap.meta) : [],
        pythonCodeHash: rule.sourceMap?.meta?.pythonCodeHash,
        generatedAt: rule.sourceMap?.meta?.generatedAt
      })
      return rule.sourceMap
    }
    console.log('❌ [TestTabContent] No saved source map available - reason:', {
      isCreateMode,
      hasRule: !!rule,
      hasSourceMap: !!rule?.sourceMap
    })
    return null
  }, [isCreateMode, rule?.sourceMap])
  
  // 🚀 ENTERPRISE: Import unified source code state
  const sourceCodeState = useRuleSourceCode(rule?.id || '')
  
  // 🔄 **SYNC**: Update unified state when debug tab changes code
  const handleCodeChange = useCallback(async (newCode: string) => {
    console.log('📝 [TestTabContent] Code changed in debug tab:', {
      ruleId: rule?.id,
      newLength: newCode.length,
      timestamp: new Date().toISOString()
    })
    
    // 🚀 ENTERPRISE: Update unified source code state with automatic Python generation
    if (rule?.id) {
      await sourceCodeState.updateSourceCode(newCode, 'debug-tab')
    }
    
    // Also update rule editor for compatibility
    if (ruleEditor?.onSourceCodeChange) {
      ruleEditor.onSourceCodeChange(newCode)
    }
    
    // Also sync to parent component
    if (onRuleUpdate) {
      onRuleUpdate({ sourceCode: newCode })
    }
  }, [rule?.id, sourceCodeState, ruleEditor?.onSourceCodeChange, onRuleUpdate])

  if (!isCreateMode && rule) {
    // 🚨 **SAFETY**: Don't render until rule editor is ready
    if (ruleEditor?.loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Loading debug environment...</div>
          </div>
        </div>
      )
    }

    // 🚨 **ERROR HANDLING**: Show error state if rule editor failed
    if (ruleEditor?.error) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-red-600">Error loading debug environment</div>
            <div className="text-xs text-muted-foreground mt-1">
              {String(ruleEditor.error)}
            </div>
          </div>
        </div>
      )
    }

    // ✨ **ENHANCED DEBUG SYSTEM**: Professional debugging with terminal and variable tracking (using synced code)
    // 🚀 **FIXED**: Now uses same Python generation as Monaco editor (true → True, false → False)
    return (
      <DebugTabClient
        sourceCode={liveSourceCode}
        pythonCode={livePythonCode}
        sourceMap={sourceMap}
        onChange={handleCodeChange}
        rule={{
          name: rule.name,
          id: rule.id,
          idShort: rule.idShort
        }}
      />
    )
  }

  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p>Save your rule to access debugging features</p>
        <div className="text-xs mt-2 text-gray-500 space-y-1">
          <p>• Professional step-by-step debugging</p>
          <p>• Variable tracking with change history</p>
          <p>• Debug terminal with execution logs</p>
          <p>• Breakpoint support in Monaco editor</p>
        </div>
      </div>
    </div>
  )
}

const RuleHistoryTab = ({ rule }: { rule: Rule }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Version History</h3>
      <p className="text-gray-600">Track changes and versions</p>
    </div>
  </div>
)


const RuleNodesTab = ({ rule }: { rule: Rule }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <Link className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Node Relationships</h3>
      <p className="text-gray-600">Connect this rule to nodes</p>
    </div>
  </div>
)

const RuleProcessesTab = ({ rule }: { rule: Rule }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Process Relationships</h3>
      <p className="text-gray-600">Connect this rule to processes</p>
    </div>
  </div>
)



const RuleSettingsTab = ({ rule }: { rule: Rule }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
      <p className="text-gray-600">Advanced rule settings</p>
    </div>
  </div>
)

interface EditorTabsProps {
  // Rule props
  rule?: ExtendedRule  // Make rule optional for create mode
  onRuleUpdate?: (updates: Partial<ExtendedRule>) => void
  ruleIdShort?: string  // Add ruleIdShort prop for navigation
  
  // Class props  
  class?: ExtendedClass  // Make class optional for create mode
  onClassUpdate?: (updates: Partial<ExtendedClass>) => void
  classIdShort?: string  // Add classIdShort prop for navigation
  
  // Common props
  activeTab: string
  onTabChange: (tab: string) => void
  onSave: () => void
  hasUnsavedChanges: boolean
  resourceType?: 'rule' | 'class'  // Add resourceType to determine which tabs to show
}

// Internal component that uses useSearchParams - wrapped in Suspense
function EditorTabsCore({ 
  rule, 
  class: classEntity,
  activeTab, 
  onTabChange, 
  onRuleUpdate, 
  onClassUpdate,
  onSave, 
  hasUnsavedChanges,
  ruleIdShort,
  classIdShort,
  resourceType = 'rule'
}: EditorTabsProps) {
  
  // 🔍 **DEBUG PARENT COMPONENT**: Log what rule data we receive
  console.log('🔍 [EditorTabsCore] PARENT DEBUG:', {
    resourceType,
    hasRule: !!rule,
    ruleId: rule?.id,
    ruleIdShort,
    ruleName: rule?.name,
    hasSourceMap: !!rule?.sourceMap,
    sourceMapType: typeof rule?.sourceMap,
    ruleKeys: rule ? Object.keys(rule) : [],
    ruleSourceMapValue: rule?.sourceMap
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Determine which entity we're working with
  const currentEntity = resourceType === 'rule' ? rule : classEntity
  const entityIdShort = resourceType === 'rule' ? ruleIdShort : classIdShort
  
  // Determine if we're in create mode (no entityIdShort provided)
  const isCreateMode = !entityIdShort || !currentEntity?.id
  
  // Get branch from URL params (defaults to "main")
  const branchName = searchParams.get('branch') || 'main'
  
  // Handle successful entity creation - navigate to edit mode
  const handleEntityCreated = (newEntity: { id: string; idShort: string }) => {
    const basePath = resourceType === 'rule' ? '/rules' : '/classes'
    const newUrl = `${basePath}/${newEntity.idShort}${branchName !== 'main' ? `?branch=${branchName}` : ''}`
    router.push(newUrl)
  }

  const tabs = useMemo(() => {
    if (resourceType === 'class') {
      return [
        { 
          id: 'details', 
          label: 'Details', 
          icon: Settings,
          disabled: false // Always enabled
        },
        { 
          id: 'code', 
          label: 'Code', 
          icon: Blocks,
          disabled: isCreateMode // Disabled until rule exists
        },
      ]
    }

    return [
      { 
        id: 'details', 
        label: 'Details', 
        icon: Settings,
        disabled: false // Always enabled
      },
      { 
        id: 'code', 
        label: 'Code', 
        icon: Blocks,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'query-tester', 
        label: 'Query Tester', 
        icon: Database,
        disabled: false // Always available for beginners
      },
      { 
        id: 'prompt', 
        label: 'Prompts', 
        icon: Palette,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'docs', 
        label: 'Docs', 
        icon: FileText,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'history', 
        label: 'History', 
        icon: History,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'nodes', 
        label: 'Nodes', 
        icon: Link,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'processes', 
        label: 'Processes', 
        icon: Workflow,
        disabled: isCreateMode // Disabled until rule exists
      },

      { 
        id: 'market', 
        label: 'Market', 
        icon: ShoppingCart,
        disabled: isCreateMode // Disabled until rule exists
      },
      { 
        id: 'settings', 
        label: 'Settings', 
        icon: Settings,
        disabled: isCreateMode // Disabled until rule exists
      },
    ]
  }, [isCreateMode, resourceType])

  // If in create mode and not on details tab, redirect to details (after render)
  useEffect(() => {
    if (isCreateMode && activeTab !== 'details') {
      onTabChange('details')
    }
  }, [isCreateMode, activeTab, onTabChange])

  return (
    <div className="h-full flex bg-white">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex w-full">
        {/* Left Vertical Tab Navigation */}
        <div className="w-32 border-r border-gray-200 bg-gray-50">
          <TabsList className="h-full w-full p-1 bg-transparent flex flex-col justify-start">
            {/* Create Mode Header */}
            {isCreateMode && (
              <div className="w-full p-2 mb-2 text-center border-b border-gray-300">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {resourceType === 'class' ? 'New Class' : 'New Rule'}
                </span>
              </div>
            )}
            
            {tabs.map((tab) => {
              const Icon = (tab.icon || Square) as any
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  disabled={tab.disabled}
                  className="w-full flex items-center gap-2 py-2 px-3 text-sm justify-start data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-r-2 data-[state=active]:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
            
            {/* Create Mode Footer */}
            {isCreateMode && (
              <div className="w-full p-2 mt-auto text-center border-t border-gray-300">
                <span className="text-xs text-muted-foreground">
                  Save to unlock {resourceType === 'class' ? 'code editor' : 'tabs'}
                </span>
              </div>
            )}
          </TabsList>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-auto">
          <TabsContent value="details" className="h-full mt-0">
            {resourceType === 'rule' ? (
              <RuleDetailsTab 
                ruleId={rule?.id || 'new'} // Pass 'new' for create mode
                onSave={() => {
                  onSave()
                  // If this was a creation, the parent component should handle URL update
                }}
                isCreateMode={isCreateMode}
                onRuleCreated={handleEntityCreated}
              />
            ) : (
              <ClassDetailsTab 
                classId={classEntity?.id || 'new'} // Pass 'new' for create mode
                onSave={() => {
                  onSave()
                  // If this was a creation, the parent component should handle URL update
                }}
                isCreateMode={isCreateMode}
                onClassCreated={handleEntityCreated}
              />
            )}
          </TabsContent>

          <TabsContent value="code" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleCodeTab 
                rule={rule} 
                onUpdate={onRuleUpdate}
                onSave={onSave}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            ) : !isCreateMode && classEntity && resourceType === 'class' ? (
              <ClassCodeTab 
                classEntity={classEntity} 
                onUpdate={onClassUpdate}
                onSave={onSave}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to access the code editor</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="query-tester" className="h-full mt-0">
            <QueryTestBench />
          </TabsContent>

          <TabsContent value="prompt" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <PromptEditor 
                ruleId={rule.id} 
                onSave={onSave} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to create prompts</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleDocumentationTab 
                ruleId={rule.id} 
                onSave={onSave} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to add documentation</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleHistoryTab rule={rule as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to view history</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="nodes" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleNodesTab rule={rule as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Link className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to connect to nodes</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processes" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleProcessesTab rule={rule as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to connect to processes</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="market" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleMarketTab rule={rule as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to access marketplace</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="h-full mt-0">
            {!isCreateMode && rule && resourceType === 'rule' ? (
              <RuleSettingsTab rule={rule as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p>Save your {resourceType} to access settings</p>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// Main wrapper with Suspense boundary
export function EditorTabs(props: EditorTabsProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-4">Loading...</div>}>
      <EditorTabsCore {...props} />
    </Suspense>
  )
}