// Example of integrated Call Utility with HelperFactory
// This shows how clicking on helper blocks opens the factory for editing

import React, { useState, useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'
import { Button } from '@/components/ui/button'
import { Wrench, Code2, Eye, EyeOff } from 'lucide-react'

import {
  HelperFactory,
  useHelperFactory,
  EnhancedHelperManager,
  CALL_UTILITY_SCHEMA,
  createUtilitySchema
} from './index'

export function IntegratedUtilityExample() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const helperManagerRef = useRef<EnhancedHelperManager | null>(null)
  
  const [currentBlock, setCurrentBlock] = useState<any>(null)
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(true)
  
  // Helper factory state
  const { selectedSchema, initialData, isOpen, openHelper, closeHelper } = useHelperFactory()

  // Initialize Monaco editor
  useEffect(() => {
    if (!containerRef.current) return

    const editor = monaco.editor.create(containerRef.current, {
      value: `# Sample business rule with utility call

# HELPER_START:helper-example:call-utility-helper
call utility "Document Error" with:
  errorText = "System failure detected"
  routineID = "BOOKING_001"
  severity = "high"
# HELPER_END:helper-example:call-utility-helper

if booking.status == "failed":
    print("Booking failed - utility was called above")
`,
      language: 'business-rules',
      theme: 'vs-dark',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 20
    })

    editorRef.current = editor

    // Initialize enhanced helper manager
    const helperManager = new EnhancedHelperManager(editor, {
      enableAtomicDeletion: true,
      enableUndoSupport: true,
      enableReadOnlyMode: true,
      defaultReadOnly: true,
      enableEditMode: true,
      enableClickToEdit: true
    })

    helperManagerRef.current = helperManager

    // Handle click-to-edit for utility calls
    helperManager.onHelperBlockClicked = ({ id, schemaId, content, initialData }) => {
      
      if (schemaId === 'call-utility-helper' && initialData) {
        // Create schema with parsed data for editing
        const utilitySchema = createUtilitySchema(initialData.utilityName || 'Unknown', [])
        openHelper(utilitySchema, initialData) // Pass the parsed initial data!
      }
    }

    // Track current helper block
    editor.onDidChangeCursorPosition(() => {
      const block = helperManager.getHelperBlockAtCursor()
      setCurrentBlock(block)
    })

    return () => {
      helperManager.dispose()
      editor.dispose()
    }
  }, [openHelper])

  // Handle code insertion from helper factory
  const handleInsertCode = (code: string) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    
    if (selection) {
      // Insert as helper block
      helperManagerRef.current?.insertHelperBlock(
        CALL_UTILITY_SCHEMA.id,
        code
      )
    }
  }

  // Toggle read-only mode for demo (simplified - affects all blocks)
  const toggleReadOnlyMode = () => {
    const newMode = !isReadOnlyMode
    setIsReadOnlyMode(newMode)
    // Note: Enhanced helper manager handles read-only mode internally
    // This is just for UI state demonstration
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-lg font-semibold">Integrated Call Utility Example</h3>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openHelper(CALL_UTILITY_SCHEMA)}
            size="sm"
            variant="outline"
            className="flex items-center gap-1 text-xs"
          >
            <Wrench className="w-3 h-3" />
            Add Utility Call
          </Button>
          
          <Button
            onClick={toggleReadOnlyMode}
            size="sm"
            variant="outline"
            className="flex items-center gap-1 text-xs"
          >
            {isReadOnlyMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {isReadOnlyMode ? 'Read-Only' : 'Editable'}
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <div ref={containerRef} className="h-full" />
      </div>
      
      <div className="p-3 border-t bg-muted/30 text-sm">
        <div className="flex items-center justify-between">
          <div>
            {currentBlock ? (
              <span className="text-blue-600">
                📍 In helper block: {currentBlock.id} ({currentBlock.schemaId})
              </span>
            ) : (
              <span className="text-muted-foreground">
                💡 Click on the utility call above to edit it, or use the button to add a new one
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Press F2 to edit • ESC to exit edit • Cmd+Z to undo deletion
          </div>
        </div>
      </div>

      {/* Integrated Helper Factory - handles both new helpers and editing existing ones */}
      {selectedSchema && (
        <HelperFactory
          schema={selectedSchema}
          initialData={initialData || undefined}
          isOpen={isOpen}
          onClose={closeHelper}
          onInsertCode={handleInsertCode}
        />
      )}
    </div>
  )
}

// Simple demo component
export function CallUtilityFactoryDemo() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Call Utility - HelperFactory Integration</h1>
        <p className="text-muted-foreground">
          Click on the utility call in the editor to edit it. The call-utility is now part of the HelperFactory system!
        </p>
      </div>
      
      <IntegratedUtilityExample />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h3 className="font-semibold text-green-600">✅ What Works Now</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Call utility is integrated with HelperFactory</li>
            <li>• Click on helper blocks to edit them</li>
            <li>• Atomic deletion with Cmd+Z undo</li>
            <li>• Read-only protection for helper blocks</li>
            <li>• F2 to edit, ESC to exit edit mode</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-600">🎯 Integration Benefits</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Single factory handles all helpers</li>
            <li>• Consistent editing experience</li>
            <li>• Schema-driven form generation</li>
            <li>• No separate modals needed</li>
            <li>• DRY architecture with reusable patterns</li>
          </ul>
        </div>
      </div>
    </div>
  )
}