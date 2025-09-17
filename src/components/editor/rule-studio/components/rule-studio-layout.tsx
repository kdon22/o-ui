/**
 * 🏆 RuleStudioLayout - Clean Tab Layout Component
 * 
 * Handles tab navigation and layout for the rule studio.
 * Integrates dirty state indicators and maintains clean UI structure.
 */

import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw } from 'lucide-react'
import { TabDirtyIndicator, SaveStatusIndicator } from './ui/dirty-indicator'
import type { TabId } from '../types'
import { TAB_CONFIGS, PARAMETER_ENABLED_RULE_TYPES } from '../constants'

interface RuleStudioLayoutProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  isDirty: boolean
  saving?: boolean
  ruleType?: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR'
  enableParameters?: boolean
  isRegenerating?: boolean
  children: {
    businessRules: ReactNode
    parameters?: ReactNode
    python: ReactNode
    test: ReactNode
  }
}

export function RuleStudioLayout({
  activeTab,
  onTabChange,
  isDirty,
  saving = false,
  ruleType = 'BUSINESS',
  enableParameters = true,
  isRegenerating = false,
  children
}: RuleStudioLayoutProps) {
  
  const showParametersTab = enableParameters && PARAMETER_ENABLED_RULE_TYPES.includes(ruleType as any)
  
  console.log('🏗️ [RuleStudioLayout] Rendering layout:', {
    activeTab,
    isDirty,
    saving,
    ruleType,
    showParametersTab,
    isRegenerating
  })
  
  return (
    <div className="h-full">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            console.log('🧭 [RuleStudioLayout] Tabs.onValueChange', {
              from: activeTab,
              to: value
            })
            onTabChange(value as TabId)
          }}
          className="h-full flex flex-col"
        >
        
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b">
          <TabsList className="justify-start rounded-none border-none">
            
            {/* Business Rules Tab */}
            <TabsTrigger value="business-rules" className="relative">
              <span>Business Rules</span>
              {isDirty && activeTab !== 'business-rules' && (
                <div className="absolute -top-1 -right-1">
                  <TabDirtyIndicator isDirty={true} />
                </div>
              )}
            </TabsTrigger>
            
            {/* Parameters Tab - Only for UTILITY rules */}
            {showParametersTab && (
              <TabsTrigger value="parameters" className="relative">
                <span>Parameters Function</span>
                {/* Parameters tab dirty state would be managed by parameters save system */}
              </TabsTrigger>
            )}
            
            {/* Test Tab */}
            <TabsTrigger value="test" className="relative">
              <span>Test</span>
            </TabsTrigger>
            
            {/* Python Output Tab */}
            <TabsTrigger value="python" className="relative">
              <span>Python Output</span>
              {isRegenerating && (
                <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
              )}
              {isDirty && activeTab !== 'python' && (
                <div 
                  className="absolute -top-1 -right-1"
                  title="Click to refresh with latest changes"
                >
                  <TabDirtyIndicator isDirty={true} />
                </div>
              )}
            </TabsTrigger>
            
          </TabsList>
          
          {/* Save Status Indicator */}
          <div className="px-4 py-2">
            <SaveStatusIndicator isDirty={isDirty} saving={saving} />
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          
          <TabsContent value="business-rules" className="h-full m-0">
            {children.businessRules}
          </TabsContent>
          
          {showParametersTab && (
            <TabsContent value="parameters" className="h-full m-0">
              {children.parameters}
            </TabsContent>
          )}
          
          <TabsContent value="test" className="h-full m-0">
            {children.test}
          </TabsContent>
          
          <TabsContent value="python" className="h-full m-0">
            {children.python}
          </TabsContent>
          
        </div>
        
      </Tabs>
    </div>
  )
}
