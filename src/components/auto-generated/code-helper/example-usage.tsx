// Example usage of the schema-driven helper system
// This shows how to integrate helpers into Monaco editor or other components

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HelperFactory, HelperSelector, useHelperFactory } from './helper-factory'
import { ALL_HELPER_SCHEMAS } from '@/lib/editor/schemas'

// Example integration with Monaco editor
export function CodeHelperExample() {
  const { selectedSchema, isOpen, openHelper, closeHelper } = useHelperFactory()
  const [generatedCode, setGeneratedCode] = useState<string>('')

  const handleInsertCode = (code: string, imports?: string[]) => {
    // In a real Monaco integration, you would insert this into the editor
    setGeneratedCode(code)
    
    // Example of how to insert into Monaco (pseudo-code):
    // const editor = monaco.editor.getModels()[0]
    // const position = editor.getPosition()
    // editor.executeEdits('helper-insert', [{
    //   range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
    //   text: code
    // }])
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Schema-Driven Helper System Demo</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Helpers</h3>
        <HelperSelector
          schemas={ALL_HELPER_SCHEMAS}
          onSelectHelper={openHelper}
        />
      </div>

      {generatedCode && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Generated Code</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}

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

// Example Monaco completion item integration
export function addHelpersToMonacoCompletions(monaco: any) {
  return ALL_HELPER_SCHEMAS.map(schema => ({
    label: `🔧 ${schema.helperUI?.title || schema.name}`,
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: {
      value: `**Helper**: ${schema.helperUI?.description || schema.description}\n\nClick to open helper dialog.`
    },
    detail: `Helper: ${schema.helperUI?.category || schema.category}`,
    insertText: '', // No text insertion, just open dialog
    command: {
      id: 'openHelper',
      title: 'Open Helper',
      arguments: [schema.id]
    }
  }))
}

// Example integration with business rules editor
export function BusinessRuleEditorWithHelpers() {
  const { selectedSchema, isOpen, openHelper, closeHelper } = useHelperFactory()

  return (
    <div className="flex h-screen">
      {/* Sidebar with helper categories */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <h3 className="font-semibold mb-4">Code Helpers</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              const remarkHelper = ALL_HELPER_SCHEMAS.find(s => s.id === 'find-remark-helper')
              if (remarkHelper) openHelper(remarkHelper)
            }}
          >
            🎫 Add Vendor Remark
          </Button>
          
          {/* More helper buttons would go here */}
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 p-4">
        <div className="bg-white border rounded p-4 h-full">
          <p className="text-gray-500">
            Monaco editor would be integrated here.
            Helpers can be triggered from:
            - IntelliSense completions (🔧 Helper Name)
            - Sidebar buttons
            - Command palette
            - Right-click context menu
          </p>
        </div>
      </div>

      {/* Helper modal */}
      {selectedSchema && (
        <HelperFactory
          schema={selectedSchema}
          isOpen={isOpen}
          onClose={closeHelper}
          onInsertCode={(code, imports) => {
            // Insert into Monaco editor here
          }}
        />
      )}
    </div>
  )
}