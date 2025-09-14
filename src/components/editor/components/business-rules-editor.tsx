// Business Rules Monaco Editor Component

import { useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import {
  registerBusinessRulesLanguageFactory,
  isBusinessRulesLanguageRegistered
} from '../language'
import type { Variable } from '../language/constants'
import { BUSINESS_RULES_EDITOR_OPTIONS } from '../language/language-config'

export interface BusinessRulesEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
  hasUnsavedChanges?: boolean
  height?: string | number
  className?: string
  userVariables?: Variable[]
}

export function BusinessRulesEditor({
  value,
  onChange,
  onSave,
  onMount,
  hasUnsavedChanges,
  height = '100%',
  className = '',
  userVariables = []
}: BusinessRulesEditorProps) {
  console.log('📝 BusinessRulesEditor loading...', { userVariables: userVariables.length })

  const { data: session } = useSession()
  const { tenantId: entTenantId, branchContext } = useEnterpriseSession()

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // Initialize editor context (tenant/branch) for column-name completions from DataTable.config
  useEffect(() => {
    try {
      if (entTenantId && branchContext && (branchContext as any).currentBranchId) {
        const { EditorContextService } = require('../language/editor-context')
        EditorContextService.set({
          tenantId: entTenantId,
          branchContext: branchContext as any
        })
        console.log('🧭 [BusinessRulesEditor] EditorContext set for SQL completions')
      }
    } catch (error) {
      console.warn('⚠️ [BusinessRulesEditor] Failed to set EditorContext:', error)
    }
  }, [entTenantId, branchContext])

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    console.log('✅ Monaco editor mounted successfully!')
    editorRef.current = editor

          // NOW REGISTER THE LANGUAGE WITH MONACO AVAILABLE
      console.log('🔧 [BusinessRulesEditor] Registering language with modular completion system...')
      if (!isBusinessRulesLanguageRegistered(monaco)) {
        registerBusinessRulesLanguageFactory(monaco)
        console.log('✅ [BusinessRulesEditor] Language registered successfully with modular system')
      } else {
        console.log('⚠️ [BusinessRulesEditor] Language already registered')
      }

      // FORCE the language on the model
      const model = editor.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, 'business-rules')
        console.log('🎯 [BusinessRulesEditor] Model language set to:', model.getLanguageId())
      }

      // Apply business rules theme
      editor.updateOptions({
        theme: 'business-rules-theme'
      })

    // Add save command (Cmd+S / Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave()
      }
    })

    // SSOT: Do not programmatically trigger suggestions

    // Add debug command (Ctrl+Shift+D)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD, () => {
      const model = editor.getModel()
      console.log('🐛 [DEBUG] Editor state:', {
        language: model?.getLanguageId(),
        availableLanguages: monaco.languages.getLanguages().map(l => l.id),
        position: editor.getPosition(),
        value: model?.getValue(),
        userVariables: userVariables.length
      })
    })

    // Focus the editor
    editor.focus()

    // Call additional onMount callback if provided
    if (onMount) {
      onMount(editor, monaco)
    }
  }

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      console.log('🎯 [BusinessRulesEditor] onChange triggered:', {
        newValueLength: newValue.length,
        hasOnChangeProp: !!onChange,
        timestamp: new Date().toISOString()
      })
      onChange(newValue)
    }
  }

  return (
    <div className={`relative h-full ${className}`}>
      {/* Monaco Editor - Full height, no interruptions */}
      <div className="h-full">
        <Editor
          height={height}
          language="business-rules"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: 'Monaco, "Cascadia Code", "Courier New", monospace',
            lineHeight: 1.5,
            wordWrap: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            // Enable IntelliSense features
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            // Only show real schema-driven suggestions (disable word/snippet fallbacks)
            wordBasedSuggestions: 'off',
            snippetSuggestions: 'none',
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always'
          }}
          theme="business-rules-theme"
        />
      </div>
    </div>
  )
} 