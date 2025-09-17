'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, RefreshCw, FileText, BookOpen, Code } from 'lucide-react'
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api'
import { useEditorSave, ruleDocumentationAdapter } from '@/lib/editor/save'

interface RuleDocumentationTabProps {
  ruleId: string
  onSave?: () => void
}

export function RuleDocumentationTab({ ruleId, onSave }: RuleDocumentationTabProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [localData, setLocalData] = useState({
    documentation: '',
    examples: '',
    notes: '',
    version: '',
    author: '',
    changelog: ''
  })

  // 🚀 SSOT: Unified save system for documentation tab
  const { 
    save: saveDocTab, 
    setLastSaved: setDocLastSaved,
    isDirty: docIsDirty,
    updateSnapshot: updateDocSnapshot 
  } = useEditorSave(
    ruleDocumentationAdapter,
    { id: ruleId, tab: 'rule-documentation' }
  )

  // Use action system for data fetching
  const { data: ruleResponse, isLoading: loadingRule } = useActionQuery('rule.get', { id: ruleId })
  const updateRuleMutation = useActionMutation('rule.update')

  // Extract rule data from response
  const rule = ruleResponse?.data

  // ✅ REMOVED: Manual tab-switch-save listener - now handled automatically by useEditorSave universal system  
  // The useEditorSave hook (used by saveDocTab) now automatically handles all tab-switch-save events

  // Initialize local data and last-saved snapshot when rule loads
  useEffect(() => {
    if (rule && !hasUnsavedChanges) {
      setLocalData({
        documentation: rule.documentation || '',
        examples: rule.examples || '',
        notes: rule.notes || '',
        version: rule.version?.toString() || '1',
        author: rule.createdBy || 'Unknown',
        changelog: rule.changelog || ''
      })
      setDocLastSaved({
        documentation: rule.documentation || '',
        examples: rule.examples || '',
        notes: rule.notes || '',
        changelog: rule.changelog || ''
      })
    }
  }, [rule, hasUnsavedChanges])

  const handleFieldChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges || !rule) return

    setIsSaving(true)
    try {
      await saveDocTab({
        documentation: localData.documentation,
        examples: localData.examples,
        notes: localData.notes,
        changelog: localData.changelog
      }, { context: 'manual', skipIfClean: true })

      setHasUnsavedChanges(false)
      onSave?.()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (rule) {
      setLocalData({
        documentation: rule.documentation || '',
        examples: rule.examples || '',
        notes: rule.notes || '',
        version: rule.version?.toString() || '1',
        author: rule.createdBy || 'Unknown',
        changelog: rule.changelog || ''
      })
    }
    setHasUnsavedChanges(false)
  }

  if (loadingRule) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    )
  }

  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Rule not found</p>
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
            <h2 className="text-xl font-semibold">Rule Documentation</h2>
            <p className="text-sm text-muted-foreground">Documentation, examples, and notes for this rule</p>
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || isSaving}
            >
              Reset
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Rule Info Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{rule.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">v{localData.version}</Badge>
                <Badge variant="secondary">{rule.category || rule.type}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Documentation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="changelog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Changelog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rule Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documentation">Description and Usage</Label>
                  <textarea
                    id="documentation"
                    value={localData.documentation}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('documentation', e.target.value)}
                    placeholder="Describe what this rule does, when it should be used, and any important information..."
                    className="mt-2 min-h-[200px] w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={localData.author}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('author', e.target.value)}
                      placeholder="Rule author"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={localData.version}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('version', e.target.value)}
                      placeholder="1.0.0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={localData.examples}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('examples', e.target.value)}
                  placeholder="Provide usage examples, sample inputs/outputs, and common use cases..."
                  className="min-h-[300px] font-mono text-sm w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Development Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={localData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('notes', e.target.value)}
                  placeholder="Add development notes, TODOs, known issues, or other internal information..."
                  className="min-h-[300px] w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changelog" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Log</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={localData.changelog}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('changelog', e.target.value)}
                  placeholder="Track changes to this rule:&#10;&#10;v1.1.0 - Added validation for empty inputs&#10;v1.0.0 - Initial implementation"
                  className="min-h-[300px] font-mono text-sm w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 