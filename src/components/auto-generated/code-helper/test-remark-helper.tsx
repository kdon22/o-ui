// Test component for the find-remark helper
// Demonstrates the complete schema-driven system working

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelperFactory, useHelperFactory } from './helper-factory'
import { getSchemaById } from '@/lib/editor/schemas'

export function TestRemarkHelper() {
  const { selectedSchema, isOpen, openHelper, closeHelper } = useHelperFactory()
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [generatedImports, setGeneratedImports] = useState<string[]>([])

  const handleTestHelper = () => {
    const remarkSchema = getSchemaById('find-remark-helper')
    if (remarkSchema) {
      openHelper(remarkSchema)
    } else {
      console.error('Remark helper schema not found')
    }
  }

  const handleInsertCode = (code: string, imports?: string[]) => {
    setGeneratedCode(code)
    setGeneratedImports(imports || [])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Schema-Driven Helper System</CardTitle>
          <CardDescription>
            This demonstrates the complete find-remark helper system working end-to-end.
            Click the button below to open the Add Vendor Remark helper.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestHelper} size="lg">
            🎫 Open Add Vendor Remark Helper
          </Button>
        </CardContent>
      </Card>

      {(generatedCode || generatedImports.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Output</CardTitle>
            <CardDescription>
              This is what would be inserted into the Monaco editor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedImports.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Required Imports:</h4>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  {generatedImports.map((imp, index) => (
                    <div key={index} className="text-blue-700">
                      import {imp}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {generatedCode && (
              <div>
                <h4 className="font-semibold mb-2">Generated Python Code:</h4>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto border">
                  <code className="text-gray-800">{generatedCode}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 How This Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>1. Schema Definition:</strong> The remark helper is defined in 
              <code className="bg-gray-100 px-1 rounded">remark-helpers.ts</code> with UI fields and Python generation logic.
            </p>
            <p>
              <strong>2. Form Generation:</strong> The helper UI fields automatically generate a form 
              with checkboxes, dropdowns, text inputs, and radio buttons based on the schema.
            </p>
            <p>
              <strong>3. Python Generation:</strong> When you submit the form, the schema's 
              <code className="bg-gray-100 px-1 rounded">pythonGenerator</code> function creates 
              custom Python code based on your selections.
            </p>
            <p>
              <strong>4. Monaco Integration:</strong> In a real editor, this generated code would be 
              inserted at the cursor position, and imports would be added to the top of the file.
            </p>
          </div>
        </CardContent>
      </Card>

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