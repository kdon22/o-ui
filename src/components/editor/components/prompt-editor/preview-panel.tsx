// Preview Panel - Bottom panel for real-time form preview and execution

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, Code, RefreshCw, X } from 'lucide-react'
import { PromptRenderer } from '../prompt/prompt-renderer'
import type { PromptEntity, FormState } from './types'

interface PreviewPanelProps {
  prompt: PromptEntity
  formData: FormState
  onFormDataChange: (data: FormState) => void
}

export function PreviewPanel({ prompt, formData, onFormDataChange }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'data' | 'json' | null>(null)

  const handleFormChange = (data: FormState) => {
    onFormDataChange(data)
  }

  const handleReset = () => {
    onFormDataChange({})
  }

  const handleTabClick = (tabValue: 'preview' | 'data' | 'json') => {
    // Toggle: if clicking the same tab, collapse; otherwise expand to new tab
    setActiveTab(activeTab === tabValue ? null : tabValue)
  }

  const isFormValid = () => {
    const validation = formData.__validation
    return !validation?.missingRequired?.length
  }

  const hasFormData = Object.keys(formData).length > 0
  const isExpanded = activeTab !== null

  return (
    <div className={`bg-white border-t border-gray-200 transition-all duration-300 relative z-[9999] ${
      isExpanded ? 'h-[calc(100vh-120px)]' : 'h-12'
    }`}>
      {/* Always Visible Tab Bar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center">
          <div className="flex">
            <button
              onClick={() => handleTabClick('preview')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'preview' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-3 w-3" />
              Form Preview
            </button>
            <button
              onClick={() => handleTabClick('data')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'data' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="h-3 w-3" />
              Form Data
              {hasFormData && (
                <Badge variant="secondary" className="h-4 text-[10px] px-1 ml-1">
                  {Object.keys(formData).length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabClick('json')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'json' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="h-3 w-3" />
              Layout JSON
            </button>
          </div>
          {hasFormData && isExpanded && (
            <Badge 
              variant={isFormValid() ? 'default' : 'outline'} 
              className={`text-xs ml-4 ${!isFormValid() ? 'text-red-600 border-red-300' : ''}`}
            >
              {isFormValid() ? 'Valid' : 'Invalid'}
            </Badge>
          )}
        </div>
        
        {isExpanded && (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={!hasFormData}
              className="h-8 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab(null)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {activeTab === 'preview' && (
                <>
                  {prompt.layout.items.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📋</div>
                        <p className="text-sm">No components to preview</p>
                        <p className="text-xs mt-1">Add components to the canvas to see the form preview</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl">
                      <PromptRenderer
                        name={prompt.promptName}
                        layout={prompt.layout}
                        data={formData}
                        onChange={handleFormChange}
                        readOnly={false}
                        isSubmitting={false}
                        isValid={isFormValid()}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'data' && (
                <>
                  {hasFormData ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-3">
                        Current form values:
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-xs text-gray-800 overflow-auto">
                          {JSON.stringify(formData, null, 2)}
                        </pre>
                      </div>
                      
                      {formData.__validation && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Validation Status</h4>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <pre className="text-xs text-red-800">
                              {JSON.stringify(formData.__validation, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📊</div>
                        <p className="text-sm">No form data yet</p>
                        <p className="text-xs mt-1">Fill out the form in the preview tab to see data here</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'json' && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Current layout configuration:
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 overflow-auto">
                      {JSON.stringify(prompt.layout, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <span>Components: {prompt.layout.items.length}</span>
                    <span>Canvas: {prompt.layout.canvasWidth || 960} × {prompt.layout.canvasHeight || 615}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
} 