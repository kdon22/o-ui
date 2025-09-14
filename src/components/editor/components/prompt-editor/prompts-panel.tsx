// Prompts Panel - Left sidebar for prompt management

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useActionMutation } from '@/hooks/use-action-api'
import { AutoModal } from '@/components/auto-generated/modal'
import { PROMPT_SCHEMA } from '@/features/prompts/prompts.schema'
import { ComponentPalette } from './component-palette'
import type { PromptEntity } from './types'

interface PromptsPanelProps {
  ruleId: string
  prompts: PromptEntity[]
  selectedPrompt: PromptEntity | null
  onPromptSelect: (prompt: PromptEntity) => void
  onRefetch: () => void
  onDragStart?: (dragging: boolean) => void
  onDragEnd?: () => void
}

export function PromptsPanel({ 
  ruleId, 
  prompts, 
  selectedPrompt, 
  onPromptSelect, 
  onRefetch,
  onDragStart,
  onDragEnd
}: PromptsPanelProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newPromptName, setNewPromptName] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptEntity | null>(null)

  const createPromptMutation = useActionMutation('prompt.create')
  const updatePromptMutation = useActionMutation('prompt.update')
  const deletePromptMutation = useActionMutation('prompt.delete')

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setNewPromptName('')
  }

  const handleSaveNewPrompt = async () => {
    if (!newPromptName.trim()) return
    
    try {
      const result = await createPromptMutation.mutateAsync({
        promptName: newPromptName.trim(),
        content: '',
        ruleId,
        isPublic: false,
        executionMode: 'INTERACTIVE' as const,
        layout: {
          items: [],
          canvasWidth: 960,
          canvasHeight: 615
        }
      })
      
      setIsCreatingNew(false)
      setNewPromptName('')
      onRefetch()
      
      // Immediately select the new prompt
      if (result?.data) {
        onPromptSelect(result.data)
      }
    } catch (error) {
      
    }
  }

  const handleCancelNew = () => {
    setIsCreatingNew(false)
    setNewPromptName('')
  }

  const handleUpdatePrompt = async (promptData: any) => {
    if (!editingPrompt) return
    
    try {
      await updatePromptMutation.mutateAsync({
        id: editingPrompt.id,
        ...promptData
      })
      setShowEditModal(false)
      setEditingPrompt(null)
      onRefetch()
    } catch (error) {
      
      throw error
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return
    
    try {
      await deletePromptMutation.mutateAsync({ id: promptId })
      onRefetch()
    } catch (error) {
      
    }
  }

  const handleEditPrompt = (prompt: PromptEntity) => {
    setEditingPrompt(prompt)
    setShowEditModal(true)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Prompts</h3>
          <Button
            size="sm"
            onClick={handleCreateNew}
            className="h-8 px-2"
            disabled={isCreatingNew}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Prompts List - Let it size naturally */}
      <div className="overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Inline New Prompt Creation */}
          {isCreatingNew && (
            <div className="p-2 border border-blue-200 bg-blue-50 rounded-lg">
              <Input
                placeholder="Enter prompt name..."
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                className="mb-2 h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNewPrompt()
                  } else if (e.key === 'Escape') {
                    handleCancelNew()
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNewPrompt}
                  disabled={!newPromptName.trim() || createPromptMutation.isPending}
                  className="h-6 px-2 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelNew}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Prompts */}
          {prompts.length === 0 && !isCreatingNew ? (
            <div className="p-3 text-center text-gray-500">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm">No Prompt Names</p>
            </div>
          ) : (
            prompts.map((prompt: PromptEntity) => (
              <div
                key={prompt.id}
                onClick={() => onPromptSelect(prompt)}
                className={`
                  group relative p-2 rounded-lg cursor-pointer transition-colors
                  ${selectedPrompt?.id === prompt.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {prompt.promptName}
                    </h4>
                    {prompt.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {prompt.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {prompt.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons - show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPrompt(prompt)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePrompt(prompt.id)
                      }}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Components Section - Right below prompts */}
      <div className="border-t border-gray-100">
        <ComponentPalette
          onDragStart={onDragStart || (() => {})}
          onDragEnd={onDragEnd || (() => {})}
        />
      </div>

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <AutoModal
          config={{
            resource: "prompt",
            action: "update"
          }}
          schema={PROMPT_SCHEMA}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingPrompt(null)
          }}
          onSuccess={handleUpdatePrompt}
          initialData={editingPrompt}
        />
      )}
    </div>
  )
}