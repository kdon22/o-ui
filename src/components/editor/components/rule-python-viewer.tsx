/**
 * 🏆 RULE PYTHON VIEWER - Gold Standard Implementation
 * 
 * Clean Python code viewer with bulletproof SSR handling.
 * Displays generated Python code from business rules.
 * 
 * Features:
 * - Read-only Python syntax highlighting
 * - Bulletproof SSR avoidance
 * - Performance optimized
 * - Clean, focused interface
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type * as MonacoTypes from 'monaco-editor'
import { useEditorPreferences } from '@/components/layout/editor/editor-preferences'
import { MonacoEditor } from '../monaco-editor'

// Use shared MonacoEditor wrapper for consistent loader/config

export interface RulePythonViewerProps {
  value?: string
  readOnly?: boolean
  height?: string | number
  className?: string
  showLineNumbers?: boolean
}

/**
 * 🏆 GOLD STANDARD PYTHON VIEWER
 * 
 * Single, focused component for displaying Python code
 */
export function RulePythonViewer({
  value = '',
  readOnly = true,
  height = '100%',
  className = '',
  showLineNumbers = true
}: RulePythonViewerProps) {
  
  // Client-side only state
  const [isClient, setIsClient] = useState(false)
  const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null)
  
  // 🎯 **UNIFIED PREFERENCES**: Use same preferences as other Monaco editors
  const { preferences } = useEditorPreferences()

  // Bulletproof client-side detection + Monaco disposal
  useEffect(() => {

    setIsClient(true)
    
    // 🏆 **MONACO DISPOSAL**: Proper cleanup on unmount
    return () => {
  
      if (editorRef.current) {
        
        editorRef.current.dispose()
    
        editorRef.current = null
      }
    }
  }, [])
  
  // Handle Monaco editor mount
  const handleEditorMount = (editor: MonacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco) => {

    editorRef.current = editor
    
    // 🎯 **APPLY PREFERENCES**: Use unified preferences like other Monaco editors
    editor.updateOptions({
      fontSize: preferences.fontSize,
      fontFamily: preferences.fontFamily,
      wordWrap: preferences.wordWrap ? 'on' : 'off',
      lineNumbers: preferences.lineNumbers,
    })

  }

  // Don't render anything during SSR
  if (!isClient) {
    return (
      <div className={`h-full bg-muted/20 border border-border rounded-md ${className}`}>
        <div className="h-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Initializing Python viewer...</div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!value || !value.trim()) {
    return (
      <div className={`h-full bg-muted/10 border border-border rounded-md p-8 ${className}`}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-lg mb-2">🐍</div>
            <div className="text-sm">Python code will appear here</div>
            <div className="text-xs mt-1">Write business rules to see generated Python</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rule-python-viewer ${className}`} style={{ height }}>
      <MonacoEditor
        height="100%"
        language="python"
        theme={preferences.theme === 'dark' ? 'vs-dark' : 'vs'}
        value={value}
        onMount={handleEditorMount}
        options={{
          readOnly,
          // 🎯 **UNIFIED PREFERENCES**: Use same preferences as other Monaco editors
          fontSize: preferences.fontSize,
          fontFamily: preferences.fontFamily,
          lineNumbers: preferences.lineNumbers,
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          tabSize: preferences.tabSize,
          // Static options for Python viewer
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wrappingIndent: 'indent',
          insertSpaces: true,
          folding: true,
          renderLineHighlight: readOnly ? 'none' : 'line',
          selectOnLineNumbers: true,
          padding: { top: 10 },
          // Python-specific options
          suggest: {
            showKeywords: true,
            showSnippets: false,
            showFunctions: true,
            showVariables: true
          },
          quickSuggestions: false, // Disable for read-only
          parameterHints: { enabled: false }, // Disable for read-only
          contextmenu: !readOnly
        }}
        loading={
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse">
              <div className="text-sm text-muted-foreground">Loading Python editor...</div>
            </div>
          </div>
        }
      />
    </div>
  )
}

export default RulePythonViewer