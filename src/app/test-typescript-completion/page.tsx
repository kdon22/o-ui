'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'

/**
 * 🎯 TYPESCRIPT COMPLETION TEST PAGE
 * 
 * Test the new TypeScript interface → Monaco completion system
 * Completely standalone, no legacy dependencies
 */

export default function TestTypeScriptCompletionPage() {
  const [output, setOutput] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editorCode, setEditorCode] = useState(`// Test TypeScript completion here
// 1. First, click "Setup Demo Utilities" to parse interfaces
// 2. Then type: result = getUserData(123)
// 3. On next line, type: result. (with dot)
// 4. You should see IntelliSense for user, success, message properties!

result = getUserData(123)
result.`)

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  const monacoRef = useRef<typeof monaco>()

  const addOutput = (message: string) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearOutput = () => {
    setOutput([])
  }

  // Setup demo utilities and completion system
  const setupDemoUtilities = async () => {
    setIsLoading(true)
    addOutput('🎯 Setting up TypeScript completion system...')

    try {
      if (!monacoRef.current) {
        addOutput('❌ Monaco not loaded yet')
        return
      }

      // Import the TypeScript completion system
      const { setupDemoUtilities } = await import('@/lib/editor/typescript-completion/setup')
      
      addOutput('📦 Parsing demo utilities...')
      const result = setupDemoUtilities(monacoRef.current)
      
      if (result.success) {
        addOutput(`✅ Setup complete!`)
        addOutput(`📊 Utilities: ${result.stats.totalUtilities}`)
        addOutput(`🎯 Completion items: ${result.stats.totalCompletionItems}`)
        addOutput('💡 Now try typing "result." in the editor!')
      } else {
        addOutput(`❌ Setup failed:`)
        result.errors.forEach(error => addOutput(`   ${error}`))
      }

    } catch (error) {
      addOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Parse custom utility
  const parseCustomUtility = async () => {
    setIsLoading(true)
    addOutput('🔧 Parsing custom utility...')

    try {
      if (!monacoRef.current) {
        addOutput('❌ Monaco not loaded yet')
        return
      }

      const customUtilityCode = `
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
}

function searchProducts(query: string): ProductSearchResult {
  // Implementation here
  return {} as ProductSearchResult;
}
`

      const { parseUtilityAndSetupCompletion } = await import('@/lib/editor/typescript-completion/setup')
      
      const result = await parseUtilityAndSetupCompletion('searchProducts', customUtilityCode)
      
      if (result.success) {
        addOutput(`✅ Parsed searchProducts utility!`)
        addOutput(`📊 Return type: ${result.returnType}`)
        addOutput(`🎯 Completion items: ${result.completionItems}`)
        addOutput('💡 Try typing "searchResult = searchProducts(\"test\")" then "searchResult."')
      } else {
        addOutput(`❌ Parse failed: ${result.error}`)
      }

    } catch (error) {
      addOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Test registry stats
  const showRegistryStats = async () => {
    try {
      const { interfaceRegistry } = await import('@/lib/editor/typescript-completion')
      const stats = interfaceRegistry.getStats()
      const utilities = interfaceRegistry.getUtilityNames()
      
      addOutput('📊 Registry Stats:')
      addOutput(`   Utilities: ${stats.totalUtilities}`)
      addOutput(`   Completion items: ${stats.totalCompletionItems}`)
      addOutput(`   Cache size: ${stats.cacheSize}`)
      addOutput(`   Utility names: ${utilities.join(', ')}`)
      
    } catch (error) {
      addOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    addOutput('✅ Monaco editor loaded and ready')
    addOutput('💡 Click "Setup Demo Utilities" to enable TypeScript completion')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎯 TypeScript Completion Test</h1>
        <p className="text-gray-600">
          Test the new TypeScript interface → Monaco completion system
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={setupDemoUtilities}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '⏳ Setting up...' : '🎯 Setup Demo Utilities'}
        </button>
        
        <button
          onClick={parseCustomUtility}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? '⏳ Parsing...' : '🔧 Parse Custom Utility'}
        </button>
        
        <button
          onClick={showRegistryStats}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          📊 Show Registry Stats
        </button>
        
        <button
          onClick={clearOutput}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🗑️ Clear Output
        </button>
      </div>

      {/* Editor and Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monaco Editor */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-semibold">Monaco Editor (business-rules language)</h3>
            <p className="text-sm text-gray-600">Type "result." to test completion</p>
          </div>
          <div className="h-96">
            <Editor
              height="100%"
              language="business-rules"
              value={editorCode}
              onChange={(value) => setEditorCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                wordBasedSuggestions: false
              }}
            />
          </div>
        </div>

        {/* Output Console */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-semibold">Output Console</h3>
            <p className="text-sm text-gray-600">System logs and results</p>
          </div>
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 font-mono text-sm">
            {output.length === 0 ? (
              <div className="text-gray-500 italic">
                Click "Setup Demo Utilities" to begin...
              </div>
            ) : (
              output.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 How to Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click <strong>"Setup Demo Utilities"</strong> to parse the demo interfaces</li>
          <li>In the editor, type: <code>result = getUserData(123)</code></li>
          <li>On the next line, type: <code>result.</code> (with the dot)</li>
          <li>You should see IntelliSense suggestions for: <code>user</code>, <code>success</code>, <code>message</code></li>
          <li>Try typing: <code>result.user.</code> to see nested properties like <code>name</code>, <code>email</code>, <code>address</code></li>
          <li>Click <strong>"Parse Custom Utility"</strong> to add a product search utility</li>
          <li>Test with: <code>searchResult = searchProducts("test")</code> then <code>searchResult.</code></li>
        </ol>
      </div>

      {/* Architecture Info */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold mb-2">🏗️ New Architecture:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>InterfaceRegistry:</strong> Stores parsed TypeScript interfaces</li>
          <li><strong>Monaco Provider:</strong> Provides completion items based on variable context</li>
          <li><strong>TypeScript Parser:</strong> Regex-based offline parsing (no TypeScript compiler)</li>
          <li><strong>Zero Legacy:</strong> Completely standalone, no integration with old systems</li>
          <li><strong>Pattern Detection:</strong> Automatically detects utility calls and variable assignments</li>
        </ul>
      </div>
    </div>
  )
}
