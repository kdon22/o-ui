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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<FormState>({})
  const [isDragging, setIsDragging] = useState(false)
  const [showPropertiesModal, setShowPropertiesModal] = useState(false)

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
    updateSnapshot: updatePromptSnapshot,
    saveOnTabSwitch: savePromptOnTabSwitch
  } = useEditorSave(
    promptAdapter,
    { id: selectedPrompt?.id || '', tab: 'prompt' }
  )

  // 🚀 CORRECT AUTO-SAVE with debouncing (2 seconds after user stops making changes)
  const debouncedAutoSave = useDebouncedCallback(
    async (prompt: PromptEntity, layout: PromptLayout) => {
      if (!prompt || !prompt.id) return
      try {
        await savePromptTab({ layout, promptName: prompt.promptName, content: prompt.content, isPublic: prompt.isPublic, executionMode: prompt.executionMode }, { context: 'manual', skipIfClean: true })
        setPromptLastSaved({ layout })
        onSave?.()
      } finally {
        // no-op
      }
    },
    2000
  )

  // ✅ REMOVED: Manual tab-switch-save listener - now handled automatically by useEditorSave universal system
  // The useEditorSave hook (used by savePromptTab) now automatically handles all tab-switch-save events

  // Handle prompt selection
  const handlePromptSelect = useCallback((prompt: PromptEntity) => {
    setSelectedPrompt(prompt)
    setSelectedComponent(null) // Clear component selection when switching prompts
    setSelectedIds([])
    setPreviewData({}) // Reset preview data
    setPromptLastSaved({ layout: prompt.layout })
    // Initialize snapshot for unified save/dirty tracking
    updatePromptSnapshot({
      layout: prompt.layout,
      promptName: prompt.promptName,
      content: prompt.content,
      isPublic: prompt.isPublic,
      executionMode: prompt.executionMode
    })
  }, [])

  // Handle component selection (single click - just highlight)
  const handleComponentSelect = useCallback((component: ComponentItem | null, opts?: { append?: boolean }) => {
    if (!component) {
      setSelectedComponent(null)
      setSelectedIds([])
      return
    }
    const append = !!opts?.append
    if (append) {
      setSelectedIds((prev) => {
        const exists = prev.includes(component.id)
        return exists ? prev.filter((id) => id !== component.id) : [...prev, component.id]
      })
      setSelectedComponent(component)
    } else {
      setSelectedIds([component.id])
      setSelectedComponent(component)
    }
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
    // Update snapshot for universal save/idle save
    updatePromptSnapshot({
      layout: updatedLayout,
      promptName: updatedPrompt.promptName,
      content: updatedPrompt.content,
      isPublic: updatedPrompt.isPublic,
      executionMode: updatedPrompt.executionMode
    })
  }, [selectedPrompt, selectedComponent, debouncedAutoSave])

  // Handle layout changes from canvas with auto-save
  const handleLayoutChange = useCallback((layout: PromptLayout) => {
    if (!selectedPrompt) return

    const updatedPrompt = { ...selectedPrompt, layout }
    setSelectedPrompt(updatedPrompt)

    // Trigger auto-save with debouncing
    debouncedAutoSave(updatedPrompt, layout)
    // Update snapshot for universal save/idle save
    updatePromptSnapshot({
      layout,
      promptName: updatedPrompt.promptName,
      content: updatedPrompt.content,
      isPublic: updatedPrompt.isPublic,
      executionMode: updatedPrompt.executionMode
    })
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
    // Update snapshot for universal save/idle save
    updatePromptSnapshot({
      layout: resetLayout,
      promptName: updatedPrompt.promptName,
      content: updatedPrompt.content,
      isPublic: updatedPrompt.isPublic,
      executionMode: updatedPrompt.executionMode
    })
  }, [selectedPrompt, debouncedAutoSave])

  // Bridge global rule-level tab-switch-save to the selected prompt's save
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent
      if (ev.detail?.ruleId === ruleId && selectedPrompt?.id) {
        void savePromptOnTabSwitch()
      }
    }
    window.addEventListener('tab-switch-save', handler as EventListener)
    return () => window.removeEventListener('tab-switch-save', handler as EventListener)
  }, [ruleId, selectedPrompt?.id, savePromptOnTabSwitch])

  // Remove selected component (single delete)
  const handleRemoveSelected = useCallback(() => {
    if (!selectedPrompt || (selectedIds.length === 0 && !selectedComponent)) return
    const idsToRemove = selectedIds.length > 0 ? new Set(selectedIds) : new Set([selectedComponent!.id])
    const updatedLayout: PromptLayout = {
      ...selectedPrompt.layout,
      items: selectedPrompt.layout.items.filter((item: ComponentItem) => !idsToRemove.has(item.id))
    }
    const updatedPrompt = { ...selectedPrompt, layout: updatedLayout }
    setSelectedPrompt(updatedPrompt)
    setSelectedComponent(null)
    setSelectedIds([])
    debouncedAutoSave(updatedPrompt, updatedLayout)
    updatePromptSnapshot({
      layout: updatedLayout,
      promptName: updatedPrompt.promptName,
      content: updatedPrompt.content,
      isPublic: updatedPrompt.isPublic,
      executionMode: updatedPrompt.executionMode
    })
  }, [selectedPrompt, selectedComponent, debouncedAutoSave])

  // Keyboard shortcut: Delete/Backspace removes selected component
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponent) {
        e.preventDefault()
        handleRemoveSelected()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedComponent, handleRemoveSelected])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Prompt Editor</h2>
          {/* Removed verbose editing/saving indicator to keep UI minimal */}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 border border-red-200">
              {selectedIds.length} selected
            </span>
          )}
          {selectedPrompt && selectedPrompt.layout.items.length > 0 && (
            <button
              onClick={handleResetCanvas}
              className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Clear all components from canvas"
            >
              Reset Canvas
            </button>
          )}
          <button
            onClick={handleRemoveSelected}
            disabled={(selectedIds.length === 0 && !selectedComponent)}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedIds.length > 0 || selectedComponent
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
            title={selectedIds.length > 1
              ? `Remove ${selectedIds.length} selected components`
              : selectedComponent ? 'Remove selected component' : 'Select components to enable'}
          >
            Remove Selected
          </button>
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
                selectedIds={selectedIds}
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