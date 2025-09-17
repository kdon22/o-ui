/**
 * 🚀 SIMPLIFIED RULE STUDIO EDITOR
 * 
 * Streamlined rule editing that preserves all Monaco/schema functionality
 * while removing complex state management dependencies.
 * 
 * Features preserved:
 * - Monaco editor with sophisticated completion system
 * - Schema-driven IntelliSense (ALL_METHOD_SCHEMAS)
 * - Widget/helper integration
 * - Real-time Python generation
 * - Error boundaries for reliability
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRuleEditorState } from '../hooks/use-rule-editor-state'
import { RuleCodeEditor } from './rule-code-editor'
import { RulePythonViewer } from './rule-python-viewer'
import { EditorErrorBoundary } from './editor-error-boundary'

export interface SimplifiedRuleStudioEditorProps {
  ruleId: string
  enableParameters?: boolean
}

/**
 * 🚀 SIMPLIFIED RULE STUDIO EDITOR
 * 
 * Clean, focused rule editing with preserved Monaco functionality
 */
export function SimplifiedRuleStudioEditor({ 
  ruleId, 
  enableParameters = true 
}: SimplifiedRuleStudioEditorProps) {
  
  const [activeTab, setActiveTab] = useState('business-rules')
  
  // 🚀 SIMPLIFIED STATE: Single hook replaces complex Zustand + coordinator
  const {
    sourceCode,
    pythonCode,
    isDirty,
    isSaving,
    isLoading,
    updateSourceCode,
    updatePythonCode,
    save,
    rule
  } = useRuleEditorState({ ruleId })
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Rule not found</p>
        </div>
      </div>
    )
  }
  
  const handleSave = async () => {
    const success = await save()
    if (success) {
      console.log('✅ Rule saved successfully')
    } else {
      console.error('❌ Rule save failed')
    }
  }
  
  return (
    <EditorErrorBoundary>
      <div className="h-full flex flex-col">
        {/* Header with save button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">{rule.name || 'Untitled Rule'}</h2>
            {isDirty && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        
        {/* Tabbed editor interface */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="business-rules">Business Rules</TabsTrigger>
              <TabsTrigger value="python">Python Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="business-rules" className="flex-1 mt-0">
              <EditorErrorBoundary>
                <RuleCodeEditor
                  value={sourceCode}
                  onChange={updateSourceCode}
                  onSave={handleSave}
                  height="100%"
                  ruleType={rule.type || 'BUSINESS'}
                  // 🚀 PRESERVED: All Monaco/schema functionality
                  // - Sophisticated completion system
                  // - Widget integration
                  // - Schema-driven IntelliSense
                />
              </EditorErrorBoundary>
            </TabsContent>
            
            <TabsContent value="python" className="flex-1 mt-0">
              <EditorErrorBoundary>
                <RulePythonViewer
                  value={pythonCode}
                  onChange={updatePythonCode}
                  height="100%"
                  readOnly={false} // Allow Python editing
                />
              </EditorErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </EditorErrorBoundary>
  )
}

/**
 * 🚀 EXPORT WITH ERROR BOUNDARY
 * 
 * Default export wrapped in error boundary for maximum reliability
 */
export default function RuleStudioEditorWithErrorBoundary(props: SimplifiedRuleStudioEditorProps) {
  return (
    <EditorErrorBoundary>
      <SimplifiedRuleStudioEditor {...props} />
    </EditorErrorBoundary>
  )
}
