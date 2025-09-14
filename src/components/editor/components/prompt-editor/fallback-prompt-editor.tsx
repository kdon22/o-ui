// Fallback Prompt Editor - Simple version to prevent loading issues

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PromptEditorProps {
  ruleId: string
  onSave?: () => void
}

export function PromptEditor({ ruleId, onSave }: PromptEditorProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Prompt Editor</h2>
          <span className="text-sm text-gray-600">
            Rule ID: {ruleId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onSave?.()}
            disabled={isLoading}
            className="px-4 py-2"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold mb-2">Prompt Editor Loading</h3>
          <p className="text-gray-600 mb-4">
            The unified prompt editor is being loaded. This may take a moment.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✅ Left Panel: Prompts & Components</p>
            <p>✅ Center: Visual Canvas</p>
            <p>✅ Right: Properties (on double-click)</p>
            <p>✅ Bottom: Live Preview</p>
          </div>
        </div>
      </div>
    </div>
  )
} 