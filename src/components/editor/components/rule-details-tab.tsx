'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, RefreshCw } from 'lucide-react'
import { AutoForm } from '@/components/auto-generated/form'
import { InlineForm } from '@/components/auto-generated/table/inline-form'
import { getFormWidthClass } from '@/components/auto-generated/form/form-utils'
import { cn } from '@/lib/utils/generalUtils'
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api'
import { useRuleSaveCoordinator } from '@/components/editor/services/rule-save-coordinator'
import { RULE_SCHEMA } from '@/features/rules/rules.schema'
import { useNavigationContext, useRuleCreationContext } from '@/lib/context/navigation-context'
import { useReadyBranchContext } from '@/lib/context/branch-context'

// Local navigation context type
type JunctionNavigationContext = {
  nodeId?: string;
  processId?: string;
  workflowId?: string;
  parentId?: string;
  [key: string]: string | undefined;
}

interface RuleDetailsTabProps {
  ruleId: string // 'new' for create mode, actual ID for edit mode
  onSave?: () => void
  isCreateMode?: boolean
  onRuleCreated?: (newRule: { id: string; idShort: string }) => void
}

export function RuleDetailsTab({ 
  ruleId, 
  onSave, 
  isCreateMode = false,
  onRuleCreated
}: RuleDetailsTabProps) {
  // Get branch context from SSOT
  const branchContext = useReadyBranchContext();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 🚀 SSOT SAVE COORDINATOR - Single source of truth for all rule saving
  const { saveRule } = useRuleSaveCoordinator()

  // Get rule creation context to detect if coming from process
  const { isCreatingRuleFromProcess, processContext, clearContext } = useRuleCreationContext()
  const navigationContextState = useNavigationContext()

  // Convert navigation context to simple junction format for factory pattern
  // Always include nodeId when available via NavigationContext.sourceContext (handled in provider hook)
  // Include processId only when creating from a process, so auto-creator makes the junction
  const junctionNavigationContext: JunctionNavigationContext = {
    ...(isCreatingRuleFromProcess && processContext ? { processId: processContext.processId } : {}),
    ...(navigationContextState.sourceContext?.type === 'node' && navigationContextState.sourceContext.id
      ? { nodeId: navigationContextState.sourceContext.id }
      : {}),
  }

  // Only fetch rule data if not in create mode
  const { data: ruleResponse, isLoading: loadingRule } = useActionQuery(
    'rule.read', 
    { id: ruleId },
    { enabled: !isCreateMode && ruleId !== 'new' }
  )
  
  // 🚀 FIXED: Use useActionMutation for automatic cache invalidation
  const contextualCreateMutation = useActionMutation('rule.create', {
    // Pass navigation context for junction auto-creation
    navigationContext: junctionNavigationContext,
    onSuccess: (result) => {
        const created = (result as any)?.data || (result as any)?.entity?.data
        console.log('🎉 [RuleDetailsTab] Contextual create completed:', {
          entityId: created?.id,
          junctions: (result as any)?.junctions,
          timestamp: new Date().toISOString()
        })
        
        // Clear the navigation context since we've handled it
        if (isCreatingRuleFromProcess) {
          clearContext()
        }
        
        // Notify parent component of successful creation
        if (onRuleCreated && created) {
          onRuleCreated({
            id: created.id,
            idShort: created.idShort
          })
        }
        
        setHasUnsavedChanges(false)
        onSave?.()
      },
      onError: (error) => {
        console.error('❌ [RuleDetailsTab] Contextual create failed:', error)
      }
    }
  )
  
  // Use update mutation for edit mode
  const updateRuleMutation = useActionMutation('rule.update')

  // Extract rule data from response
  const rule = ruleResponse?.data



  // Handle form submission using SSOT save coordinator
  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsSaving(true)
    try {
      if (isCreateMode) {
        // 🚀 FACTORY PATTERN: Use contextual create for automatic junction creation
        console.log('🔥 [RuleDetailsTab] Using factory pattern for rule creation:', {
          formData,
          junctionNavigationContext,
          isCreatingRuleFromProcess,
          processContext,
          timestamp: new Date().toISOString()
        })

        await contextualCreateMutation.mutateAsync(formData)
        // Success handling is done in the contextualCreateMutation.onSuccess callback
      } else {
        // 🚀 SSOT: Use unified save coordinator for all rule updates
        await saveRule(ruleId, {
          ...formData,
          id: ruleId
        }, { context: 'manual' })

        setHasUnsavedChanges(false)
        onSave?.()
      }
    } catch (error) {
      console.error('Save failed:', error)
      throw error // Let AutoForm handle the error display
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setHasUnsavedChanges(false)
    // Reset form to original values if needed
  }

  // Loading state for edit mode
  if (!isCreateMode && loadingRule) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading rule details...</p>
        </div>
      </div>
    )
  }

  // Error state for edit mode
  if (!isCreateMode && !loadingRule && !rule) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Rule not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isCreateMode ? 'Create New Rule' : 'Rule Details'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isCreateMode 
                ? 'Configure basic rule properties to get started' 
                : 'Configure rule properties and metadata'
              }
            </p>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className={cn(getFormWidthClass(RULE_SCHEMA as any), 'mx-auto w-full')}>
        {isCreateMode && !isCreatingRuleFromProcess && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Getting Started</p>
                  <p className="text-sm text-blue-700">
                    Provide a name and type to create your rule. Other tabs will unlock after saving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isCreateMode && isCreatingRuleFromProcess && processContext && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Creating Rule for Process</p>
                  <p className="text-sm text-green-700">
                    This rule will be automatically linked to <strong>{processContext.processName || processContext.processId}</strong> when saved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isCreateMode ? (
          <Card>
            <CardContent className="p-6">
              <AutoForm
                schema={RULE_SCHEMA}
                mode="create"
                initialData={{}}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isSaving || contextualCreateMutation.isPending}
                compact={true}
                enableAnimations={false}
                className="space-y-6"
                onError={(error) => {
                  console.error('Form error:', error)
                  setIsSaving(false)
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <InlineForm
            resource={RULE_SCHEMA as any}
            entity={rule}
            mode="edit"
            onSubmit={async (formData) => {
              await updateRuleMutation.mutateAsync({ id: ruleId, ...formData })
              setHasUnsavedChanges(false)
              onSave?.()
            }}
            onCancel={handleCancel}
          />
        )}
        </div>
      </div>
    </div>
  )
} 


