/**
 * 🏆 ParametersTab - Parameters Function Editor
 * 
 * Clean wrapper around the existing ParametersEditor for UTILITY rules.
 * Handles parameter editing with inheritance support and save coordination.
 */

import { ParametersEditor } from '@/components/editor/components/parameters-editor'
import { InheritanceBanner } from '../ui/inheritance-banner'
import type { ParametersTabProps } from '../../types'
import type { InheritanceInfo } from '../../types'

interface ParametersTabExtendedProps extends ParametersTabProps {
  inheritanceInfo?: InheritanceInfo
}

export function ParametersTab({
  rule,
  sourceCode,
  onChange,
  onParametersChange,
  onReturnTypeChange,
  onSave,
  onParametersSave,
  hasUnsavedParameters = false,
  optimisticParameters,
  optimisticReturnType,
  isDirty = false,
  currentSourceCode,
  isActive = false,
  readOnly = false,
  inheritanceInfo
}: ParametersTabExtendedProps) {
  
  console.log('🔧 [ParametersTab] Rendering with props:', {
    ruleId: rule?.id,
    ruleName: rule?.name,
    hasRule: !!rule,
    hasUnsavedParameters,
    isDirty,
    isActive,
    readOnly,
    hasInheritanceInfo: !!inheritanceInfo,
    parametersCount: optimisticParameters?.length || 0
  })
  
  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No rule data available</p>
          <p className="text-xs mt-1">Parameters cannot be edited</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      
      {/* Inheritance warning banner */}
      {inheritanceInfo && (
        <InheritanceBanner 
          inheritanceInfo={inheritanceInfo}
          context="parameters"
        />
      )}
      
      {/* Parameters editor - preserves ALL existing functionality */}
      <div className="flex-1">
        <ParametersEditor
          key="parameters-editor-component"
          rule={rule}
          onParametersChange={onParametersChange || (() => {})}
          onReturnTypeChange={onReturnTypeChange}
          onSave={onParametersSave || (() => Promise.resolve())}
          hasUnsavedChanges={hasUnsavedParameters}
          optimisticParameters={optimisticParameters}
          optimisticReturnType={optimisticReturnType}
          isActive={isActive}
          isDirty={isDirty}
          currentSourceCode={currentSourceCode}
          readOnly={readOnly}
          // 🛡️ ALL EXISTING PARAMETERS FEATURES PRESERVED:
          // - Parameter form editing
          // - Return type selection
          // - Schema generation
          // - Validation and error handling
          // - Optimistic updates
        />
      </div>
      
    </div>
  )
}
