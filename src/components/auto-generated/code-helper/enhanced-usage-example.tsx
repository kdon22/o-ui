// Enhanced Helper System Usage Example
// Shows complete integration with Monaco editor and helper factory

import React, { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnhancedHelperManager, HelperFactory, useHelperFactory, type HelperBlockInfo } from './index'
import type { UnifiedSchema } from '@/lib/editor/schemas'

// Import styles (you would import this in your main app)
import './helper-block-styles.css'

interface EnhancedHelperExampleProps {
  schemas: UnifiedSchema[]
  initialCode?: string
}

export function EnhancedHelperExample({ 
  schemas, 
  initialCode = '# Write your business rules here\n# Use helpers to add complex logic\n\n' 
}: EnhancedHelperExampleProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const helperManagerRef = useRef<EnhancedHelperManager | null>(null)
  
  const [helperBlocks, setHelperBlocks] = useState<HelperBlockInfo[]>([])
  const [currentBlock, setCurrentBlock] = useState<HelperBlockInfo | null>(null)
  const [deletionHistory, setDeletionHistory] = useState<Array<{id: string, timestamp: number, blockCount: number}>>([])
  const [editorStats, setEditorStats] = useState({ total: 0, readOnly: 0, inEditMode: 0, schemas: 0 })
  
  const { selectedSchema, isOpen, openHelper, closeHelper } = useHelperFactory()
  
  // Initialize Monaco Editor and Enhanced Helper Manager
  useEffect(() => {
    if (!editorRef.current) return
    
    // Create Monaco editor
    const editor = monaco.editor.create(editorRef.current, {
      value: initialCode,
      language: 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      glyphMargin: true,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      readOnly: false,
      wordWrap: 'on'
    })
    
    monacoRef.current = editor
    
    // Initialize Enhanced Helper Manager
    const helperManager = new EnhancedHelperManager(editor, {
      enableAtomicDeletion: true,
      enableUndoSupport: true,
      enableReadOnlyMode: true,
      defaultReadOnly: true,
      enableEditMode: true
    })
    
    helperManagerRef.current = helperManager
    
    // Connect event handlers
    helperManager.onHelperBlockDeleted = (info) => {
      console.log(`Helper block deleted: ${info.id}`)
      updateHelperBlocksList()
      updateDeletionHistory()
    }
    
    helperManager.onHelperBlockContentChanged = (info) => {
      console.log(`Helper block content changed: ${info.id}`)
      updateHelperBlocksList()
    }
    
    helperManager.onEditModeChanged = (info) => {
      console.log(`Edit mode changed: ${info.id} -> ${info.isEditMode}`)
      updateHelperBlocksList()
    }
    
    helperManager.onError = (error) => {
      console.error('Helper Manager Error:', error)
      // Could show toast notification here
    }
    
    // Update UI when cursor moves
    editor.onDidChangeCursorPosition(() => {
      const blockAtCursor = helperManager.getHelperBlockAtCursor()
      setCurrentBlock(blockAtCursor)
    })
    
    // Initial updates
    updateHelperBlocksList()
    updateDeletionHistory()
    updateStats()
    
    // Cleanup
    return () => {
      helperManager.dispose()
      editor.dispose()
    }
  }, [initialCode])
  
  // Helper functions to update UI state
  const updateHelperBlocksList = () => {
    if (helperManagerRef.current) {
      setHelperBlocks(helperManagerRef.current.getAllHelperBlocks())
    }
  }
  
  const updateDeletionHistory = () => {
    if (helperManagerRef.current) {
      setDeletionHistory(helperManagerRef.current.getDeletionHistory())
    }
  }
  
  const updateStats = () => {
    if (helperManagerRef.current) {
      setEditorStats(helperManagerRef.current.getStatistics())
    }
  }
  
  // Handle helper code insertion
  const handleInsertCode = (code: string, imports?: string[]) => {
    if (!monacoRef.current || !helperManagerRef.current || !selectedSchema?.id) return
    
    try {
      // Insert helper block using the enhanced manager
      const blockId = helperManagerRef.current.insertHelperBlock(code, selectedSchema.id)
      console.log(`Inserted helper block: ${blockId}`)
      
      // Update UI
      setTimeout(() => {
        updateHelperBlocksList()
        updateStats()
      }, 100)
      
    } catch (error) {
      console.error('Failed to insert helper code:', error)
    }
  }
  
  // Toggle edit mode for current block
  const toggleEditMode = () => {
    if (currentBlock && helperManagerRef.current) {
      helperManagerRef.current.toggleEditMode(currentBlock.id)
    }
  }
  
  // Delete current helper block
  const deleteCurrentBlock = () => {
    if (currentBlock && helperManagerRef.current) {
      helperManagerRef.current.deleteHelperBlock(currentBlock.id)
    }
  }
  
  // Restore deleted block
  const restoreDeletedBlock = (backupId: string) => {
    if (helperManagerRef.current) {
      const success = helperManagerRef.current.restoreDeletedBlock(backupId)
      if (success) {
        updateHelperBlocksList()
        updateDeletionHistory()
        updateStats()
      }
    }
  }
  
  // Get helper schemas for selector
  const helperSchemas = schemas.filter(s => s.type === 'helper')
  
  return (
    <div className="flex h-screen gap-4 p-4">
      {/* Main editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Enhanced Helper Editor</h2>
          <div className="flex gap-2">
            <Badge variant="outline">
              {editorStats.total} helpers
            </Badge>
            <Badge variant={currentBlock ? "default" : "secondary"}>
              {currentBlock ? `${currentBlock.id.split('-')[1]}` : 'No selection'}
            </Badge>
          </div>
        </div>
        
        {/* Editor container */}
        <div 
          ref={editorRef}
          className="flex-1 border border-border rounded-md overflow-hidden"
        />
        
        {/* Editor controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <Button
              onClick={toggleEditMode}
              disabled={!currentBlock}
              variant={currentBlock?.isEditMode ? "default" : "outline"}
              size="sm"
            >
              {currentBlock?.isEditMode ? '🔓 Exit Edit' : '🔒 Edit Mode'} (F2)
            </Button>
            <Button
              onClick={deleteCurrentBlock}
              disabled={!currentBlock}
              variant="destructive"
              size="sm"
            >
              🗑️ Delete Block
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            💡 Press F2 to edit • ESC to finish • Cmd+Z to undo deletion
          </div>
        </div>
      </div>
      
      {/* Helper panels */}
      <div className="w-80 flex flex-col gap-4">
        {/* Helper selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Helpers</CardTitle>
            <CardDescription>
              Select a helper to generate code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {helperSchemas.map((schema) => (
                <button
                  key={schema.id}
                  onClick={() => openHelper(schema)}
                  className="w-full p-2 text-left hover:bg-accent rounded-md transition-colors text-sm"
                >
                  <div className="font-medium">{schema.helperUI?.title || schema.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {schema.helperUI?.description || schema.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Current helper blocks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Helper Blocks ({helperBlocks.length})</CardTitle>
            <CardDescription>
              Active helpers in the editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {helperBlocks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No helper blocks yet
                </div>
              ) : (
                helperBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-2 rounded border ${
                      currentBlock?.id === block.id ? 'border-primary bg-accent/50' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-mono">
                        {block.id.split('-')[1]}
                      </div>
                      <div className="flex gap-1">
                        {block.isReadOnly && (
                          <Badge variant="secondary" className="text-xs">
                            {block.isEditMode ? '✏️' : '🔒'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {block.schemaId}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Deletion history for undo */}
        {deletionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deleted Blocks</CardTitle>
              <CardDescription>
                Restore recently deleted helpers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {deletionHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-2 border border-border rounded text-sm"
                  >
                    <div>
                      <div className="font-medium">{backup.blockCount} block(s)</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(backup.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      onClick={() => restoreDeletedBlock(backup.id)}
                      size="sm"
                      variant="outline"
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Helpers:</span>
              <Badge variant="outline">{editorStats.total}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Read-Only:</span>
              <Badge variant="outline">{editorStats.readOnly}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>In Edit Mode:</span>
              <Badge variant="outline">{editorStats.inEditMode}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Unique Schemas:</span>
              <Badge variant="outline">{editorStats.schemas}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Helper Factory Modal */}
      {selectedSchema && (
        <HelperFactory
          schema={selectedSchema}
          isOpen={isOpen}
          onClose={closeHelper}
          onInsertCode={handleInsertCode}
        />
      )}
    </div>
  )
}

// Quick demo component for testing
export function QuickHelperDemo() {
  // Sample schemas for demo
  const demoSchemas: UnifiedSchema[] = [
    {
      id: 'find-remark-helper',
      name: 'Find Remark Helper',
      type: 'helper',
      description: 'Add vendor-specific remarks',
      category: 'Remarks',
      pythonGenerator: (params: any) => `# Add ${params.remarkText} remark\n# Generated helper code`,
      pythonImports: [],
      examples: [],
      helperUI: {
        title: 'Add Vendor Remark',
        description: 'Generate code to add remarks to different booking systems',
        category: 'Remarks',
        fields: [
          {
            name: 'remarkText',
            label: 'Remark Text',
            type: 'text',
            required: true,
            placeholder: 'Enter remark text...'
          },
          {
            name: 'systems',
            label: 'Target Systems',
            type: 'checkboxGroup',
            options: [
              { value: 'amadeus', label: 'Amadeus' },
              { value: 'galileo', label: 'Galileo' },
              { value: 'worldspan', label: 'Worldspan' }
            ]
          }
        ]
      }
    }
  ]
  
  return (
    <EnhancedHelperExample 
      schemas={demoSchemas}
      initialCode={`# Business Rules Editor with Enhanced Helper System
# 
# ✨ Features:
# - 🔒 Helper blocks are read-only by default
# - 🎯 Press F2 to enter edit mode
# - 🗑️ Delete entire helper blocks atomically  
# - ↩️  Cmd+Z to undo deletions
# - 📋 Manual restore from deletion history
#
# Try adding a helper below!

def process_booking(booking_data):
    # Your business logic here
    pass
`}
    />
  )
} 