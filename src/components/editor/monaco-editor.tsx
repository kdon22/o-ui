/**
 * Clean Monaco Editor - Best in Class Implementation
 * 
 * Single source of truth for Monaco Editor in the application.
 * No workarounds, no legacy code, just clean and elegant.
 */

'use client'
import { Editor } from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type * as MonacoTypes from 'monaco-editor'

// Rely on @monaco-editor/react default loader and worker handling.
// Avoid overriding loader paths or MonacoEnvironment to prevent 404s.

export interface MonacoEditorProps {
  value?: string
  onChange?: (value: string | undefined) => void
  onMount?: (editor: MonacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco) => void
  language?: string
  theme?: string
  height?: string | number
  readOnly?: boolean
  options?: MonacoTypes.editor.IStandaloneEditorConstructionOptions
  className?: string
}

export function MonacoEditor({
  value = '',
  onChange,
  onMount,
  language = 'business-rules',
  theme = 'vs-dark',
  height = '100%',
  readOnly = false,
  options = {},
  className = ''
}: MonacoEditorProps) {
  
  return (
    <div className={`${className} h-full w-full`} style={{ height: typeof height === 'string' ? height : `${height}px` }}>
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={onMount}
        options={{
          automaticLayout: true,
          readOnly,
          // Enable debugging features by default
          glyphMargin: true,
          lineNumbers: 'on',
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 4,
          ...options
        }}
        loading={
          <div className="h-full flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading Monaco Editor...</div>
          </div>
        }
      />
    </div>
  )
}

export default MonacoEditor
