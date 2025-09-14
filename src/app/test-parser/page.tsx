'use client'

/**
 * 🎯 TYPESCRIPT PARSER TEST PAGE
 * 
 * Test page for the TypeScript interface parser
 * Navigate to /test-parser to run tests
 */

import { useState } from 'react'

export default function TestParserPage() {
  const [output, setOutput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runQuickTest = async () => {
    setIsLoading(true)
    setOutput('🚀 Running offline interface parser test...\n')
    
    try {
      // Import the offline demo utilities
      const { demoCompleteWorkflow, testDifferentPatterns } = await import('@/lib/editor/schemas/typescript-parser/offline/demo-test')
      
      // Capture console output
      const originalLog = console.log
      const originalGroup = console.group
      const originalGroupEnd = console.groupEnd
      const originalError = console.error
      
      let capturedOutput = ''
      
      const captureToOutput = (...args: any[]) => {
        capturedOutput += args.join(' ') + '\n'
      }
      
      console.log = (...args) => {
        captureToOutput(...args)
        originalLog(...args)
      }
      
      console.group = (label) => {
        capturedOutput += `\n=== ${label} ===\n`
        originalGroup(label)
      }
      
      console.groupEnd = () => {
        capturedOutput += '=================\n\n'
        originalGroupEnd()
      }
      
      console.error = (...args) => {
        captureToOutput('ERROR:', ...args)
        originalError(...args)
      }
      
      // Run the offline parser demo
      demoCompleteWorkflow()
      testDifferentPatterns()
      
      // Restore console
      console.log = originalLog
      console.group = originalGroup
      console.groupEnd = originalGroupEnd
      console.error = originalError
      
      setOutput(capturedOutput)
      
    } catch (error) {
      setOutput(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nStack: ${error instanceof Error ? error.stack : ''}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runUTRTest = async () => {
    setIsLoading(true)
    setOutput('🎯 Running UTR schema test...\n')
    
    try {
      // Import UTR schema and demo utilities
      const utrSchemaModule = await import('@/lib/editor/schemas/utr-schema')
      const { demoUTRParsing } = await import('@/lib/editor/schemas/typescript-parser/utils/demo')
      
      // Get UTR schema source code (we'll need to read it as string)
      // For now, let's use a minimal example
      const minimalUTRSchema = `
export interface UTR {
  passengers: Passenger[]
  segments: TravelSegment[]
  office: Office
  invoices: Invoice[]
}

export interface Passenger {
  passengerNumber: number
  name: {
    first: string
    last: string
    displayName: string
  }
  contactInfo: ContactInfo[]
}

export interface TravelSegment {
  segmentNumber: number
  carrier: string
  flightNumber: string
  departureDate: string
  arrivalDate: string
  departureAirport: string
  arrivalAirport: string
}

export interface Office {
  responsibilityOffice: string
  creationOffice: string
  posCity: string
  posCountry: string
}

export interface Invoice {
  number: number
  invoiceDate: string
  totalCharged: {
    currencyCode: string
    amount: number
  }
}

export interface ContactInfo {
  type: string
  value: string
  isPrimary: boolean
}
`
      
      // Capture console output
      const originalLog = console.log
      const originalGroup = console.group
      const originalGroupEnd = console.groupEnd
      const originalError = console.error
      
      let capturedOutput = ''
      
      const captureToOutput = (...args: any[]) => {
        capturedOutput += args.join(' ') + '\n'
      }
      
      console.log = (...args) => {
        captureToOutput(...args)
        originalLog(...args)
      }
      
      console.group = (label) => {
        capturedOutput += `\n=== ${label} ===\n`
        originalGroup(label)
      }
      
      console.groupEnd = () => {
        capturedOutput += '=================\n\n'
        originalGroupEnd()
      }
      
      console.error = (...args) => {
        captureToOutput('ERROR:', ...args)
        originalError(...args)
      }
      
      // Run the UTR parsing demo
      await demoUTRParsing(minimalUTRSchema)
      
      // Restore console
      console.log = originalLog
      console.group = originalGroup
      console.groupEnd = originalGroupEnd
      console.error = originalError
      
      setOutput(capturedOutput)
      
    } catch (error) {
      setOutput(`❌ UTR test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nStack: ${error instanceof Error ? error.stack : ''}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearOutput = () => {
    setOutput('')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🎯 TypeScript Parser Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={runQuickTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Running...' : '🎯 Offline Parser Test'}
          </button>
          
          <button
            onClick={runUTRTest}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Running...' : '🎯 UTR Schema Test'}
          </button>
          
          <button
            onClick={clearOutput}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🧹 Clear
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p><strong>Offline Parser Test:</strong> Tests the solid, offline-capable interface parser</p>
          <p><strong>UTR Schema Test:</strong> Tests with a realistic UTR schema subset</p>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Output:</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border max-h-96 overflow-y-auto">
          {output || 'Click a test button to see results...'}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 What to expect:</h3>
        <ul className="text-sm space-y-1">
          <li>• Parser extracts interfaces from TypeScript code</li>
          <li>• Generates BusinessObjectSchema for each interface</li>
          <li>• Creates completion schemas for Monaco editor</li>
          <li>• Registers global variables (like 'utr')</li>
          <li>• Shows available completions that would work</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">🔧 Browser Console Testing:</h3>
        <p className="text-sm">You can also test directly in the browser console:</p>
        <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
          utrParserDemo.quickTest()<br/>
          utrParserDemo.testWithMinimalSchema()<br/>
          utrParserDemo.showRegistryState()
        </code>
      </div>
    </div>
  )
}
