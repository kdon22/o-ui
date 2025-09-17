// Unified Prompt Editor - Main Orchestrator
// Combines left panel, canvas, right panel, and bottom preview in one screen

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useActionQuery } from '@/hooks/use-action-api'
import { PromptsPanel } from './prompts-panel'
import { CanvasEditor } from './canvas-editor'
import { PropertiesModal } from './properties-modal'
import { PreviewPanel } from './preview-panel'
import type { 
  PromptEntity, 
  ComponentItem, 
  PromptLayout,
  FormState 
} from './types'
import { useEditorSave, promptAdapter } from '@/lib/editor/save'

interface PromptEditorProps {
  ruleId: string
  onSave?: () => void
}

export function PromptEditor({ ruleId, onSave }: PromptEditorProps) {
  // State management
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntity | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null)
  const [previewData, setPreviewData] = useState<FormState>({})
  const [isDragging, setIsDragging] = useState(false)
  const [showPropertiesModal, setShowPropertiesModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedLayout, setLastSavedLayout] = useState<PromptLayout | null>(null)

  // Data fetching with proper ruleId filtering
  const { data: promptsResponse, refetch } = useActionQuery(
    'prompt.list',
    { filters: { ruleId } },
    { enabled: !!ruleId }
  )

  const prompts = (promptsResponse?.data || []) as PromptEntity[]
  
  // 🚀 SSOT: Use unified save system for prompt layout saves (per selected prompt)
  const { 
    save: savePromptTab, 
    setLastSaved: setPromptLastSaved,
    isDirty: promptIsDirty,
    updateSnapshot: updatePromptSnapshot
  } = useEditorSave(
    promptAdapter,
    { id: selectedPrompt?.id || '', tab: 'prompt' }
  )

  // 🚀 CORRECT AUTO-SAVE with debouncing (2 seconds after user stops making changes)
  const debouncedAutoSave = useDebouncedCallback(
    async (prompt: PromptEntity, layout: PromptLayout) => {
      if (!prompt || !prompt.id) return
      setIsSaving(true)
      try {
        await savePromptTab({ layout, promptName: prompt.promptName, content: prompt.content, isPublic: prompt.isPublic, executionMode: prompt.executionMode }, { context: 'manual', skipIfClean: true })
        setLastSavedLayout(layout)
        setPromptLastSaved({ layout })
        onSave?.()
      } finally {
        setIsSaving(false)
      }
    },
    2000
  )

  // Handle prompt selection
  const handlePromptSelect = useCallback((prompt: PromptEntity) => {
    setSelectedPrompt(prompt)
    setSelectedComponent(null) // Clear component selection when switching prompts
    setPreviewData({}) // Reset preview data
    setLastSavedLayout(prompt.layout) // Track initial layout
    setPromptLastSaved({ layout: prompt.layout })
  }, [])

  // Handle component selection (single click - just highlight)
  const handleComponentSelect = useCallback((component: ComponentItem | null) => {
    setSelectedComponent(component)
    // Don't auto-open modal on selection - only on double-click
  }, [])

  // Handle component double-click (open properties modal)
  const handleComponentDoubleClick = useCallback((component: ComponentItem) => {
    setSelectedComponent(component)
    setShowPropertiesModal(true)
  }, [])

  // Handle component updates with instant feedback and auto-save
  const handleComponentUpdate = useCallback((componentId: string, updates: Partial<ComponentItem>) => {
    if (!selectedPrompt) return

    const updatedLayout: PromptLayout = {
      ...selectedPrompt.layout,
      items: selectedPrompt.layout.items.map((item: ComponentItem) => 
        item.id === componentId ? { ...item, ...updates } : item
      )
    }

    // Update local state immediately for instant feedback
    const updatedPrompt = { ...selectedPrompt, layout: updatedLayout }
    setSelectedPrompt(updatedPrompt)

    // Update selected component if it's the one being modified
    if (selectedComponent?.id === componentId) {
      setSelectedComponent({ ...selectedComponent, ...updates })
    }

    // Trigger auto-save with debouncing
    debouncedAutoSave(updatedPrompt, updatedLayout)
  }, [selectedPrompt, selectedComponent, debouncedAutoSave])

  // Handle layout changes from canvas with auto-save
  const handleLayoutChange = useCallback((layout: PromptLayout) => {
    if (!selectedPrompt) return

    const updatedPrompt = { ...selectedPrompt, layout }
    setSelectedPrompt(updatedPrompt)

    // Trigger auto-save with debouncing
    debouncedAutoSave(updatedPrompt, layout)
  }, [selectedPrompt, debouncedAutoSave])

  // Reset canvas - clear all components
  const handleResetCanvas = useCallback(() => {
    if (!selectedPrompt) return

    const resetLayout: PromptLayout = {
      ...selectedPrompt.layout,
      items: []
    }

    const updatedPrompt = { ...selectedPrompt, layout: resetLayout }
    setSelectedPrompt(updatedPrompt)
    setSelectedComponent(null)

    // Trigger auto-save for reset action
    debouncedAutoSave(updatedPrompt, resetLayout)
  }, [selectedPrompt, debouncedAutoSave])

  // Check if there are unsaved changes
  const hasUnsavedChanges = selectedPrompt && lastSavedLayout && 
    JSON.stringify(selectedPrompt.layout) !== JSON.stringify(lastSavedLayout)
    
  // Combined saving state from both local state and mutation
  const isCurrentlySaving = isSaving

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Prompt Editor</h2>
          {selectedPrompt && (
            <span className="text-sm text-gray-600">
              Editing: {selectedPrompt.promptName}
            </span>
          )}
          {/* Auto-save status indicator */}
          {selectedPrompt && (
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <span className="text-blue-600">Saving...</span>
              ) : hasUnsavedChanges ? (
                <span className="text-orange-600">Unsaved changes</span>
              ) : (
                <span className="text-green-600">Saved</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedPrompt && selectedPrompt.layout.items.length > 0 && (
            <button
              onClick={handleResetCanvas}
              className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Clear all components from canvas"
            >
              Reset Canvas
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <PromptsPanel
              ruleId={ruleId}
              prompts={prompts}
              selectedPrompt={selectedPrompt}
              onPromptSelect={handlePromptSelect}
              onRefetch={refetch}
              onDragStart={setIsDragging}
              onDragEnd={() => setIsDragging(false)}
            />
          </div>
        </div>

        {/* Center Canvas - Full Width with flexible height */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-gray-100 min-h-0">
            {selectedPrompt ? (
              <CanvasEditor
                layout={selectedPrompt.layout}
                selectedComponent={selectedComponent}
                isDragging={isDragging}
                onLayoutChange={handleLayoutChange}
                onComponentSelect={handleComponentSelect}
                onComponentUpdate={handleComponentUpdate}
                onComponentDoubleClick={handleComponentDoubleClick}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium mb-2">Canvas Disabled</h3>
                  <p className="text-sm">Create or select a prompt to enable canvas editing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Preview Panel - Dynamic height */}
          {selectedPrompt && (
            <PreviewPanel
              prompt={selectedPrompt}
              formData={previewData}
              onFormDataChange={setPreviewData}
            />
          )}
        </div>
      </div>

      {/* Properties Modal - Only shows when component is double-clicked */}
      <PropertiesModal
        selectedComponent={selectedComponent}
        isOpen={showPropertiesModal}
        onClose={() => {
          setShowPropertiesModal(false)
          setSelectedComponent(null)
        }}
        onComponentUpdate={handleComponentUpdate}
      />
    </div>
  )
}