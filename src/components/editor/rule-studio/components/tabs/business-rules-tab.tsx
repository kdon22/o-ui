/**
 * 🏆 BusinessRulesTab - Focused Business Rules Editing
 * 
 * Clean wrapper around the existing RuleCodeEditor with inheritance support.
 * Preserves ALL existing Monaco functionality and language services.
 */

import { RuleCodeEditor } from '@/components/editor/components/rule-code-editor'
import { InheritanceBanner } from '../ui/inheritance-banner'
import type { BusinessRulesTabProps } from '../../types'
import type { InheritanceInfo } from '../../types'

interface BusinessRulesTabExtendedProps extends BusinessRulesTabProps {
  inheritanceInfo?: InheritanceInfo
}

export function BusinessRulesTab({
  sourceCode,
  pythonCode,
  onChange,
  onSave,
  onPythonGenerated,
  ruleType = 'BUSINESS',
  readOnly = false,
  inheritanceInfo
}: BusinessRulesTabExtendedProps) {
  
  console.log('🏆 [BusinessRulesTab] Rendering with props:', {
    sourceCodeLength: sourceCode?.length || 0,
    pythonCodeLength: pythonCode?.length || 0,
    readOnly,
    ruleType,
    hasInheritanceInfo: !!inheritanceInfo
  })
  
  return (
    <div className="h-full flex flex-col">
      
      {/* Inheritance warning banner */}
      {inheritanceInfo && (
        <InheritanceBanner 
          inheritanceInfo={inheritanceInfo}
          context="business-rules"
        />
      )}
      
      {/* Main editor - preserves ALL existing functionality */}
      <div className="flex-1">
        <RuleCodeEditor
          key="business-rules-monaco-editor"
          value={sourceCode}
          onChange={onChange}
          onPythonGenerated={onPythonGenerated}
          onSave={onSave}
          height="100%"
          ruleType={ruleType}
          readOnly={readOnly}
          // 🛡️ ALL EXISTING MONACO FEATURES PRESERVED:
          // - Completions (business objects, methods, variables)
          // - Helper modals and command palette 
          // - Syntax highlighting and validation
          // - IntelliSense and hover providers
          // - Language services and diagnostics
        />
      </div>
      
    </div>
  )
}
