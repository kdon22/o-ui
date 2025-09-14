// Business Rules Monaco Editor Component
'use client'

import { useRef, memo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type * as monaco from 'monaco-editor'
import type { BusinessRulesEditorProps } from '../types' // 🚀 **IMPORT FROM TYPES**
import { useEditorPreferences } from '@/hooks/use-editor-preferences' // 🚀 **DRY HOOK**
import '../monaco-hover-fix.css' // 🎯 **HOVER & COMPLETION PANEL FIXES**
import { registerBusinessRulesLanguageFactory, disposeBusinessRulesLanguageProviders } from '@/lib/editor/completion/language/registration'
import { createUnifiedHoverProvider } from '@/lib/editor/hover/hover-provider'
import { BusinessRulesDiagnosticProvider } from '../services/diagnostics/diagnostic-provider'

// Avoid SSR issues by loading Monaco Editor on client only
const Editor = dynamic(
  () => import('@monaco-editor/react').then(m => ({ default: m.Editor })),
  { ssr: false }
)

const BusinessRulesEditorComponent = ({
  value,
  onChange,
  onSave,
  onMount,
  hasUnsavedChanges,
  height = '100%',
  className = '',
  userVariables = []
}: BusinessRulesEditorProps) => {
  // BusinessRulesEditor loading - silent
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const disposablesRef = useRef<monaco.IDisposable[]>([])
  
  // 🚀 **DRY HOOK**: All preferences logic in one place
  const { preferences, monacoOptions, registerEditor } = useEditorPreferences('business-rules')

  const handleEditorDidMount = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor
    
    // 🚀 **REGISTER FOR PREFERENCES**: Hook will handle updates automatically
    registerEditor(editor)

    try {
      // Register language (tokenizer, config, and completion provider)
      registerBusinessRulesLanguageFactory(monaco)

      // Register hover provider
      const hoverDisposable = monaco.languages.registerHoverProvider(
        'business-rules',
        createUnifiedHoverProvider()
      )
      disposablesRef.current.push(hoverDisposable)

      // Register diagnostics provider
      const diagnostics = new BusinessRulesDiagnosticProvider(monaco)
      const diagDisposable = diagnostics.register()
      disposablesRef.current.push(diagDisposable)

      // VS Code-like documentation panel controller (kept)
      const { createCompletionPanelController } = await import('../language/completion-panel-controller')
      createCompletionPanelController(editor, monaco)

      // SSOT: Do not programmatically trigger suggestions; rely on provider
    } catch (error) {
      console.error('❌ [BusinessRulesEditor] Failed to initialize editor services:', error)
    }

    // Call parent's onMount if provided
    onMount?.(editor, monaco)
  }, [registerEditor, onMount])

  const handleEditorChange = useCallback((newValue: string | undefined, event: monaco.editor.IModelContentChangedEvent) => {
    if (onChange && newValue !== undefined && newValue !== value) {
      onChange(newValue, false) // false = not immediate save
    }
  }, [onChange, value])

  // Cleanup Monaco disposables on unmount
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach(d => {
        try { d.dispose() } catch {}
      })
      disposablesRef.current.length = 0
      // Ensure global completion provider is disposed when leaving this editor (e.g., switching tabs)
      try { disposeBusinessRulesLanguageProviders() } catch {}
    }
  }, [])

  // 🚀 **DRY**: Preferences updates handled automatically by useEditorPreferences hook

  return (
    <div className={`business-rules-editor h-full w-full ${className}`}>
      <Editor
        height={height}
        language="business-rules"
        value={value || ''}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={preferences.theme} // 🎯 **DYNAMIC**: Use preference theme
        options={{
          // 🚀 **SERVICE-BASED OPTIONS**: Monaco service handles base configuration
          language: 'business-rules',
          theme: preferences.theme || 'vs',
          ...monacoOptions, // 🚀 **DRY**: All preferences from hook
          automaticLayout: true, // Ensure proper layout
          scrollBeyondLastLine: false,
          // 🎯 **ENHANCED**: Better completion experience
          // Only real schema-driven suggestions; disable word/snippet-based noise
          wordBasedSuggestions: 'off',
          snippetSuggestions: 'none',
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'smart',
          tabCompletion: 'on',
          suggest: {
            preview: true,
            showIcons: true,
            showStatusBar: true,
            insertMode: 'replace'
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading Monaco Editor...</div>
          </div>
        }
      />
    </div>
  )
}

// 🎯 **ENHANCED**: Export with additional type inference utilities
export const BusinessRulesEditor = memo(BusinessRulesEditorComponent)

// 🎯 **NEW**: Export utility to get type inference from editor instance
// Type inference access removed in clean refactor

// 🎯 **EXPORT TYPES**
export type { BusinessRulesEditorProps } from '../types' 