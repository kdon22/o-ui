/**
 * 🔍 TRANSFORMATION DEBUG HELPER
 * 
 * Utility functions to help debug and trace transformation factory behavior
 */

import { transformationFactory } from './transformation-pattern-factory'
import { generateEnhancedSourceMap } from './enhanced-source-map-generator'
import type { TransformationMetadata } from './types'

/**
 * 🧪 Test transformation factory with your business rules
 */
export function debugTransformation(businessRules: string): void {
  console.log('🧪 [DEBUG] Starting transformation debug session...')
  console.log('📝 [DEBUG] Input business rules:')
  console.log('=' .repeat(50))
  console.log(businessRules)
  console.log('=' .repeat(50))
  
  const lines = businessRules.split('\n')
  console.log(`📊 [DEBUG] Total lines: ${lines.length}`)
  
  // Show line-by-line analysis
  console.log('📋 [DEBUG] Line-by-line analysis:')
  lines.forEach((line, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}: "${line}" (${line.trim() ? 'content' : 'empty'})`)
  })
  
  // Test transformation factory on each line
  console.log('\n🔍 [DEBUG] Testing transformation factory on each line...')
  const transformationMetadata: TransformationMetadata[] = []
  let pythonLineOffset = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    console.log(`\n--- Testing line ${i + 1}: "${line.trim()}" ---`)
    
    const result = transformationFactory.transform(line, lines, i, {
      currentPythonLineOffset: pythonLineOffset,
      businessLines: lines,
      indentLevel: line.match(/^(\s*)/)?.[1].length || 0,
      options: {
        generateComments: true,
        strictMode: false,
        debugMode: true
      }
    })
    
    if (result) {
      console.log(`✅ [DEBUG] Transformation successful!`)
      console.log(`   Python lines generated: ${result.pythonLines.length}`)
      console.log(`   Business lines consumed: ${result.consumedLines}`)
      console.log(`   Special mappings: ${result.metadata.specialMappings.length}`)
      
      // Update metadata with correct Python line range
      result.metadata.pythonLineRange = [pythonLineOffset, pythonLineOffset + result.pythonLines.length - 1]
      transformationMetadata.push(result.metadata)
      
      pythonLineOffset += result.pythonLines.length
      i += result.consumedLines - 1 // Skip consumed lines
    } else {
      console.log(`❌ [DEBUG] No transformation applied`)
      pythonLineOffset += 1 // Simple line would add 1 Python line
    }
  }
  
  console.log(`\n🎯 [DEBUG] Final transformation summary:`)
  console.log(`   Total transformations: ${transformationMetadata.length}`)
  transformationMetadata.forEach((meta, i) => {
    console.log(`   ${i + 1}. ${meta.type}: BR lines ${meta.businessLineRange[0]}-${meta.businessLineRange[1]} → PY lines ${meta.pythonLineRange[0]}-${meta.pythonLineRange[1]}`)
    meta.specialMappings.forEach(mapping => {
      console.log(`      - BR ${mapping.businessLine} → PY ${mapping.pythonLine} (${mapping.type}, confidence: ${mapping.confidence})`)
    })
  })
}

/**
 * 🗺️ Test source map generation
 */
export function debugSourceMap(businessRules: string, pythonCode: string, transformationMetadata: TransformationMetadata[]): void {
  console.log('\n🗺️ [DEBUG] Testing source map generation...')
  
  const result = generateEnhancedSourceMap(businessRules, pythonCode, transformationMetadata)
  
  console.log('📊 [DEBUG] Source map results:')
  console.log(`   Total mappings: ${result.sourceMap.mappings.length}`)
  console.log(`   Transformations: ${result.sourceMap.transformations.length}`)
  
  console.log('\n📋 [DEBUG] All mappings:')
  result.sourceMap.mappings
    .sort((a, b) => a.businessLine - b.businessLine)
    .forEach(mapping => {
      console.log(`   BR ${mapping.businessLine} → PY ${mapping.pythonLine} (${mapping.type}, confidence: ${mapping.confidence})`)
      if (mapping.description) {
        console.log(`      "${mapping.description}"`)
      }
    })
}

/**
 * 🎯 Find mappings for a specific business rule line
 */
export function findMappingsForBusinessLine(businessLine: number, transformationMetadata: TransformationMetadata[]): void {
  console.log(`\n🎯 [DEBUG] Finding mappings for business rule line ${businessLine}...`)
  
  const allMappings = transformationMetadata.flatMap(meta => meta.specialMappings)
  const matchingMappings = allMappings.filter(mapping => mapping.businessLine === businessLine)
  
  if (matchingMappings.length === 0) {
    console.log(`❌ [DEBUG] No mappings found for business line ${businessLine}`)
  } else {
    console.log(`✅ [DEBUG] Found ${matchingMappings.length} mapping(s) for business line ${businessLine}:`)
    matchingMappings.forEach((mapping, i) => {
      console.log(`   ${i + 1}. → Python line ${mapping.pythonLine} (${mapping.type}, confidence: ${mapping.confidence})`)
      console.log(`      "${mapping.description}"`)
    })
  }
}

/**
 * 🧪 Complete debug session for your specific issue
 */
export function debugYourIssue(): void {
  const businessRules = `// this is a test

class Test {
  name = "ell"
  age = 12
}

air = "123"

newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [newCls, new1Cls]

if any testcls in testClasses has testcls.age = 4
  if newCls.age = 5
    air = ""
  elseif newCls.age = 3
    air = "gthan"

else
  air = "RR"
`

  console.log('🚨 [DEBUG] Testing your specific line 31 issue...')
  debugTransformation(businessRules)
  
  // Find mappings for line 31 (the else clause)
  const lines = businessRules.split('\n')
  const elseLineNumber = lines.findIndex(line => line.trim() === 'else') + 1
  console.log(`\n🎯 [DEBUG] Your else clause is at line ${elseLineNumber}`)
  
  // This would need the actual transformation metadata from the debug session above
  console.log(`\n💡 [DEBUG] After running the transformation, check the mappings for line ${elseLineNumber}`)
}
