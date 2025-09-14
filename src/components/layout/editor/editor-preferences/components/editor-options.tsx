'use client'

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { EditorPreferences } from '../types/editor-preferences'

interface EditorOptionsProps {
  wordWrap: boolean
  lineNumbers: EditorPreferences['lineNumbers']
  onWordWrapChange: (checked: boolean) => void
  onLineNumbersChange: (value: EditorPreferences['lineNumbers']) => void
}

export function EditorOptions({ 
  wordWrap, 
  lineNumbers, 
  onWordWrapChange, 
  onLineNumbersChange 
}: EditorOptionsProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Editor Features</Label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="wordWrap" className="text-sm">Word Wrap</Label>
            <p className="text-xs text-muted-foreground">Wrap long lines</p>
          </div>
          <Switch
            id="wordWrap"
            checked={wordWrap}
            onCheckedChange={(checked) => {
              onWordWrapChange(checked)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="lineNumbers" className="text-sm">Line Numbers</Label>
            <p className="text-xs text-muted-foreground">Show line numbers</p>
          </div>
          <Switch
            id="lineNumbers"
            checked={lineNumbers === 'on'}
            onCheckedChange={(checked) => {
              onLineNumbersChange(checked ? 'on' : 'off')
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  )
}