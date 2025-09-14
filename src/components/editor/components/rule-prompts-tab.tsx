'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, RefreshCw, Palette } from 'lucide-react'
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api'
import { useRuleSaveCoordinator } from '@/components/editor/services/rule-save-coordinator'
import { AutoModal } from '@/components/auto-generated/modal'

interface RulePromptsTabProps {
  ruleId: string
  onSave?: () => void
}

interface Prompt {
  id: string
  ruleId: string
  promptName: string
  content: string
  layout?: any
  isPublic: boolean
  executionMode: 'INTERACTIVE' | 'AUTOMATED' | 'READ_ONLY'
  createdAt: string
  updatedAt: string
}

export function RulePromptsTab({ ruleId, onSave }: RulePromptsTabProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // 🚀 SSOT SAVE COORDINATOR - Single source of truth for all rule saving
  const { saveRule } = useRuleSaveCoordinator()

  // Use action system for data fetching and mutations
  const { data: promptsResponse, isLoading: loadingPrompts } = useActionQuery(
    'prompt.list',
    { filters: { ruleId } }
  )
  const createPromptMutation = useActionMutation('prompt.create')
  const updatePromptMutation = useActionMutation('prompt.update')
  const deletePromptMutation = useActionMutation('prompt.delete')

  // Extract prompts data from response
  const prompts = promptsResponse?.data || []

  const handleCreatePrompt = async (promptData: any) => {
    try {
      await createPromptMutation.mutateAsync({
        ruleId,
        ...promptData,
        layout: {
          items: [],
          canvasWidth: 960,
          canvasHeight: 615
        }
      })
      setShowCreateModal(false)
      onSave?.()
    } catch (error) {
      console.error('Failed to create prompt:', error)
      throw error
    }
  }

  const handleUpdatePrompt = async (promptData: any) => {
    if (!selectedPrompt) return
    
    try {
      await updatePromptMutation.mutateAsync({
        id: selectedPrompt.id,
        ...promptData
      })
      setShowEditModal(false)
      setSelectedPrompt(null)
      onSave?.()
    } catch (error) {
      console.error('Failed to update prompt:', error)
      throw error
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return
    
    try {
      await deletePromptMutation.mutateAsync({ id: promptId })
      onSave?.()
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setShowEditModal(true)
  }

  const getExecutionModeBadgeVariant = (mode: string) => {
    switch(mode) {
      case 'INTERACTIVE': return 'default'
      case 'AUTOMATED': return 'secondary'
      case 'READ_ONLY': return 'outline'
      default: return 'outline'
    }
  }

  if (loadingPrompts) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Rule Prompts</h2>
            <p className="text-sm text-muted-foreground">Interactive prompts for user interaction</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {prompts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <Palette className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Prompts Yet</h3>
                  <p className="text-muted-foreground">Create interactive prompts for this rule</p>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {prompts.map((prompt: Prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{prompt.promptName}</CardTitle>
                      <Badge variant={getExecutionModeBadgeVariant(prompt.executionMode)}>
                        {prompt.executionMode}
                      </Badge>
                      {prompt.isPublic && (
                        <Badge variant="outline">Public</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPrompt(prompt)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {prompt.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prompt.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Prompt Modal */}
      <AutoModal
        resource="prompt"
        action="create"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreatePrompt}
        initialData={{
          ruleId,
          promptName: '',
          content: '',
          isPublic: false,
          executionMode: 'INTERACTIVE'
        }}
      />

      {/* Edit Prompt Modal */}
      {selectedPrompt && (
        <AutoModal
          resource="prompt"
          action="update"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPrompt(null)
          }}
          onSuccess={handleUpdatePrompt}
          initialData={selectedPrompt}
        />
      )}
    </div>
  )
} 