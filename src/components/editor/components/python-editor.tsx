// Python Monaco Editor Component

import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { useEditorPreferences } from '@/components/layout/editor/editor-preferences' // 🚀 **DRY HOOK**

export interface PythonEditorProps {
  value: string
  onChange?: (value: string) => void
  onSave?: () => void
  hasUnsavedChanges?: boolean
  readOnly?: boolean
  height?: string | number
  className?: string
}

export function PythonEditor({
  value,
  onChange,
  onSave,
  hasUnsavedChanges,
  readOnly = true, // Default to read-only for now (Phase 10 will make it bidirectional)
  height = '100%',
  className = ''
}: PythonEditorProps) {
  
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  
  // 🚀 **DRY HOOK**: All preferences logic in one place  
  const { preferences } = useEditorPreferences()
  
  // 🏆 **MONACO DISPOSAL**: Proper cleanup on unmount
  useEffect(() => {
    
    
    return () => {
      
      if (editorRef.current) {
        console.log('🧹 [PythonEditor] Disposing Monaco editor with native dispose()')
        editorRef.current.dispose()
        
        editorRef.current = null
      }
    }
  }, [])

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor
    
    // 🎯 **APPLY INITIAL PREFERENCES**: Set preferences on mount (no registry needed)
    
    editor.updateOptions({
      fontSize: preferences.fontSize,
      fontFamily: preferences.fontFamily,  
      wordWrap: preferences.wordWrap ? 'on' : 'off',
      lineNumbers: preferences.lineNumbers,
    })
    

    // Configure Python editor
    editor.updateOptions({
      theme: 'vs', // Use VS Code light theme for Python
      readOnly,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      folding: true,
      lineNumbers: 'on',
      automaticLayout: true
    })

    // Add save command (Cmd+S / Ctrl+S) if editable
    if (!readOnly && onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave()
      })
    }

    // Focus if editable
    if (!readOnly) {
      editor.focus()
    }
  }

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined && onChange && !readOnly) {
      onChange(newValue)
    }
  }

  // 🚀 **DRY**: Preferences updates handled automatically by useEditorPreferences hook

  return (
    <div className={`relative h-full ${className}`}>
      {/* Header Bar */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">Generated Python Code</h3>
            {readOnly && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                Read-only
              </span>
            )}
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && !readOnly && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Unsaved
              </div>
            )}
            
            {readOnly && (
              <div className="text-xs text-gray-500">
                Auto-generated • Updates in real-time
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="h-[calc(100%-3rem)]">
        <Editor
          height={height}
          language="python"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={preferences.theme} // 🎯 **DYNAMIC**: Use preference theme
          options={{
            fontSize: preferences.fontSize,
            fontFamily: preferences.fontFamily,
            wordWrap: preferences.wordWrap ? 'on' : 'off',
            lineNumbers: preferences.lineNumbers,
            minimap: { enabled: false },
            lineHeight: 1.5,
            readOnly,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'boundary',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
        />
      </div>

      {/* Future: Bidirectional conversion status bar for Phase 10 */}
      {!readOnly && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600">
          💡 Tip: Edit Python directly here. Changes will be converted back to business rules automatically.
        </div>
      )}
    </div>
  )
}