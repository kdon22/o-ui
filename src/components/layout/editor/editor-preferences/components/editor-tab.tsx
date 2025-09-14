'use client'

import { EditorOptions } from './editor-options'
import { EditorPreferences } from '../types/editor-preferences'

interface EditorTabProps {
  wordWrap: boolean
  lineNumbers: EditorPreferences['lineNumbers']
  onWordWrapChange: (checked: boolean) => void
  onLineNumbersChange: (value: EditorPreferences['lineNumbers']) => void
}

export function EditorTab({
  wordWrap,
  lineNumbers,
  onWordWrapChange,
  onLineNumbersChange
}: EditorTabProps) {
  return (
    <div className="space-y-4 mt-0">
      <EditorOptions
        wordWrap={wordWrap}
        lineNumbers={lineNumbers}
        onWordWrapChange={onWordWrapChange}
        onLineNumbersChange={onLineNumbersChange}
      />
    </div>
  )
}