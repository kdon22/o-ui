/**
 * 🎯 DEMO - TypeScript Parser demonstration
 * 
 * Shows how to use the TypeScript parser with UTR schema
 * Provides working example and testing utilities
 * Small demo file for development and testing
 */

import { parseUTRSchema, debugUTRParseResult } from './utr-parser'
import { businessObjectRegistry } from '../../business-objects/registry'

// =============================================================================
// DEMO FUNCTIONS
// =============================================================================

/**
 * Demo: Parse UTR schema and show results
 */
export async function demoUTRParsing(utrSchemaSource: string): Promise<void> {
  console.group('🎯 UTR Schema Parsing Demo')
  
  try {
    // Parse UTR schema
    console.log('📝 Parsing UTR schema...')
    const result = await parseUTRSchema(utrSchemaSource)
    
    // Debug results
    debugUTRParseResult(result)
    
    if (result.success) {
      // Register with business object registry
      console.log('📋 Registering with business object registry...')
      businessObjectRegistry.registerSchemas(result.schemaResult!.businessObjects)
      businessObjectRegistry.registerGlobalVariables(result.globalVariables)
      
      // Show what's now available for completion
      console.log('✅ Available for completion:')
      console.log('- Business Objects:', businessObjectRegistry.getSchemaNames())
      console.log('- Global Variables:', businessObjectRegistry.getGlobalVariableNames())
      
      // Demo completion examples
      demoCompletionExamples()
      
    } else {
      console.error('❌ Parsing failed:', result.errors)
    }
    
  } catch (error) {
    console.error('💥 Demo failed:', error)
  }
  
  console.groupEnd()
}

/**
 * Show completion examples that would now work
 */
function demoCompletionExamples(): void {
  console.group('💡 Completion Examples Now Available')
  
  const examples = [
    'utr.passengers[0].name.first',
    'utr.segments[0].carrier',
    'utr.office.responsibilityOffice',
    'utr.invoices[0].totalCharged.amount',
    'utr.serviceRequests.filter()',
    'utr.passengers.length',
    'utr.segments[0].operationalInfo.carbonEmissions.amount'
  ]
  
  examples.forEach(example => {
    console.log(`✨ ${example}`)
  })
  
  console.groupEnd()
}

/**
 * Test parsing with minimal UTR schema
 */
export function testWithMinimalSchema(): void {
  const minimalUTRSchema = `
export interface UTR {
  passengers: Passenger[]
  segments: TravelSegment[]
  office: Office
}

export interface Passenger {
  name: {
    first: string
    last: string
  }
  passengerNumber: number
}

export interface TravelSegment {
  carrier: string
  flightNumber: string
  departureDate: string
}

export interface Office {
  responsibilityOffice: string
  creationOffice: string
}
`

  console.log('🧪 Testing with minimal UTR schema...')
  demoUTRParsing(minimalUTRSchema)
}

/**
 * Benchmark parsing performance
 */
export async function benchmarkParsing(utrSchemaSource: string): Promise<{
  parseTime: number
  schemaGenerationTime: number
  completionGenerationTime: number
  totalTime: number
}> {
  const startTime = performance.now()
  
  // Parse
  const parseStart = performance.now()
  const result = await parseUTRSchema(utrSchemaSource)
  const parseTime = performance.now() - parseStart
  
  if (!result.success) {
    throw new Error('Parsing failed')
  }
  
  // Schema generation time is included in parse time
  const schemaGenerationTime = 0 // Already included
  
  // Completion generation time is included in parse time  
  const completionGenerationTime = 0 // Already included
  
  const totalTime = performance.now() - startTime
  
  return {
    parseTime,
    schemaGenerationTime,
    completionGenerationTime,
    totalTime
  }
}

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Quick test function for development
 */
export function quickTest(): void {
  console.log('🚀 Quick TypeScript Parser Test')
  testWithMinimalSchema()
}

/**
 * Reset and clean up for testing
 */
export function resetForTesting(): void {
  businessObjectRegistry.clearSchemas()
  console.log('🧹 Registry cleared for testing')
}

/**
 * Show current registry state
 */
export function showRegistryState(): void {
  console.group('📊 Current Registry State')
  businessObjectRegistry.debug()
  console.groupEnd()
}

// =============================================================================
// EXPORT FOR CONSOLE TESTING
// =============================================================================

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).utrParserDemo = {
    demoUTRParsing,
    testWithMinimalSchema,
    quickTest,
    resetForTesting,
    showRegistryState,
    benchmarkParsing
  }
}
