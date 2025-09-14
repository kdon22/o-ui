/**
 * 🗺️ ENHANCED SOURCE MAP GENERATOR - Transformation-Aware Mapping
 * 
 * Generates source maps that properly handle multi-line transformations
 * with special mappings for generated code (break statements, etc.)
 */

import type {
  EnhancedSourceMap,
  EnhancedSourceMapping,
  TransformationMetadata
} from './types'

export interface SourceMapGenerationResult {
  sourceMap: EnhancedSourceMap
  debugInfo: {
    totalMappings: number
    transformationCount: number
    directMappings: number
    specialMappings: number
  }
}

/**
 * 🚀 MAIN GENERATION FUNCTION
 * 
 * Creates enhanced source map with transformation awareness
 */
export function generateEnhancedSourceMap(
  businessRules: string,
  pythonCode: string,
  transformationMetadata: TransformationMetadata[] = []
): SourceMapGenerationResult {
  
  console.log('🗺️ [EnhancedSourceMap] Generating transformation-aware source map...')
  console.log('📊 [EnhancedSourceMap] Input analysis:', {
    businessRulesLength: businessRules.length,
    pythonCodeLength: pythonCode.length,
    transformationCount: transformationMetadata.length
  })
  
  const businessLines = businessRules.split('\n')
  const pythonLines = pythonCode.split('\n')
  const mappings: EnhancedSourceMapping[] = []

  console.log('📝 [EnhancedSourceMap] Line counts:', {
    businessLines: businessLines.length,
    pythonLines: pythonLines.length
  })

  console.log('🔍 [EnhancedSourceMap] Business rules preview:')
  businessLines.slice(0, 5).forEach((line, i) => {
    console.log(`  ${i + 1}: "${line}"`)
  })

  console.log('🐍 [EnhancedSourceMap] Python code preview:')
  pythonLines.slice(0, 5).forEach((line, i) => {
    console.log(`  ${i + 1}: "${line}"`)
  })

  if (transformationMetadata.length > 0) {
    console.log('🏭 [EnhancedSourceMap] Transformation metadata:')
    transformationMetadata.forEach((meta, i) => {
      console.log(`  ${i + 1}. ${meta.type}:`, {
        businessLineRange: meta.businessLineRange,
        pythonLineRange: meta.pythonLineRange,
        specialMappings: meta.specialMappings.length
      })
    })
  }

  // Track which business lines are handled by transformations
  const transformedBusinessLines = new Set<number>()
  const transformedPythonLines = new Set<number>()

  // 1. Process transformation-specific mappings first
  let specialMappingCount = 0
  for (const metadata of transformationMetadata) {
    console.log(`🔄 [EnhancedSourceMap] Processing ${metadata.type} transformation:`, {
      businessRange: metadata.businessLineRange,
      pythonRange: metadata.pythonLineRange,
      specialMappings: metadata.specialMappings.length
    })

    // Mark business lines as transformed
    for (let i = metadata.businessLineRange[0]; i <= metadata.businessLineRange[1]; i++) {
      transformedBusinessLines.add(i)
    }

    // Mark Python lines as transformed
    for (let i = metadata.pythonLineRange[0]; i <= metadata.pythonLineRange[1]; i++) {
      transformedPythonLines.add(i)
    }

    // Add special mappings from the transformation
    for (const specialMapping of metadata.specialMappings) {
      mappings.push({
        businessLine: specialMapping.businessLine,
        pythonLine: specialMapping.pythonLine,
        confidence: specialMapping.confidence,
        type: specialMapping.type,
        transformationType: metadata.type,
        description: specialMapping.description || `${metadata.type} mapping`
      })
      specialMappingCount++
    }
  }

  // 2. Generate basic 1:1 mappings for non-transformed lines
  let directMappingCount = 0
  const maxLines = Math.min(businessLines.length, pythonLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const businessLineNum = i + 1
    const pythonLineNum = i + 1
    const businessLine = businessLines[i].trim()
    const pythonLine = pythonLines[i].trim()
    
    // Skip empty lines
    if (!businessLine && !pythonLine) continue
    
    // Skip if this line is part of a transformation
    if (transformedBusinessLines.has(businessLineNum) || transformedPythonLines.has(pythonLineNum)) {
      continue
    }
    
    // Skip if lines don't have meaningful content
    if (!businessLine || !pythonLine) continue
    
    // Skip comments (they're handled separately)
    if (businessLine.startsWith('//') || pythonLine.startsWith('#')) {
      // Map comments directly
      mappings.push({
        businessLine: businessLineNum,
        pythonLine: pythonLineNum,
        confidence: 1.0,
        type: 'direct',
        description: 'Comment mapping'
      })
      directMappingCount++
      continue
    }

    // Create direct mapping
    mappings.push({
      businessLine: businessLineNum,
      pythonLine: pythonLineNum,
      confidence: 1.0,
      type: 'direct',
      description: 'Direct 1:1 mapping'
    })
    directMappingCount++
  }

  // 3. Handle remaining unmapped lines (fallback mappings)
  const unmappedBusinessLines = []
  const unmappedPythonLines = []
  
  for (let i = 1; i <= businessLines.length; i++) {
    if (!transformedBusinessLines.has(i) && !mappings.some(m => m.businessLine === i)) {
      const line = businessLines[i - 1].trim()
      if (line && !line.startsWith('//')) {
        unmappedBusinessLines.push(i)
      }
    }
  }
  
  for (let i = 1; i <= pythonLines.length; i++) {
    if (!transformedPythonLines.has(i) && !mappings.some(m => m.pythonLine === i)) {
      const line = pythonLines[i - 1].trim()
      if (line && !line.startsWith('#')) {
        unmappedPythonLines.push(i)
      }
    }
  }

  // Create fallback mappings for unmapped lines
  const fallbackMappings = Math.min(unmappedBusinessLines.length, unmappedPythonLines.length)
  for (let i = 0; i < fallbackMappings; i++) {
    mappings.push({
      businessLine: unmappedBusinessLines[i],
      pythonLine: unmappedPythonLines[i],
      confidence: 0.7,
      type: 'direct',
      description: 'Fallback mapping'
    })
  }

  // 4. Sort mappings by Python line number for proper ordering
  mappings.sort((a, b) => a.pythonLine - b.pythonLine)

  // 5. Remove duplicate mappings (keep highest confidence)
  const deduplicatedMappings = deduplicateMappings(mappings)

  const sourceMap: EnhancedSourceMap = {
    version: 1,
    mappings: deduplicatedMappings,
    transformations: transformationMetadata,
    businessLines,
    pythonLines
  }

  const debugInfo = {
    totalMappings: deduplicatedMappings.length,
    transformationCount: transformationMetadata.length,
    directMappings: directMappingCount,
    specialMappings: specialMappingCount
  }

  console.log('✅ [EnhancedSourceMap] Source map generated:', debugInfo)

  return {
    sourceMap,
    debugInfo
  }
}

/**
 * 🔧 DEDUPLICATE MAPPINGS - Remove duplicates, keeping highest confidence
 */
function deduplicateMappings(mappings: EnhancedSourceMapping[]): EnhancedSourceMapping[] {
  const mappingMap = new Map<string, EnhancedSourceMapping>()
  
  for (const mapping of mappings) {
    const key = `${mapping.businessLine}:${mapping.pythonLine}`
    const existing = mappingMap.get(key)
    
    if (!existing || mapping.confidence > existing.confidence) {
      mappingMap.set(key, mapping)
    }
  }
  
  return Array.from(mappingMap.values()).sort((a, b) => a.pythonLine - b.pythonLine)
}

/**
 * 🔍 FIND BUSINESS LINE FOR PYTHON LINE - Debugging helper
 */
export function findBusinessLineForPythonLine(
  pythonLine: number,
  sourceMap: EnhancedSourceMap
): { businessLine: number; confidence: number; type: string } | null {
  
  // Find the mapping with the highest confidence for this Python line
  const mappings = sourceMap.mappings
    .filter(m => m.pythonLine === pythonLine)
    .sort((a, b) => b.confidence - a.confidence)
  
  if (mappings.length === 0) {
    return null
  }
  
  const bestMapping = mappings[0]
  return {
    businessLine: bestMapping.businessLine,
    confidence: bestMapping.confidence,
    type: bestMapping.type
  }
}

/**
 * 🔍 FIND PYTHON LINE FOR BUSINESS LINE - Reverse lookup
 */
export function findPythonLineForBusinessLine(
  businessLine: number,
  sourceMap: EnhancedSourceMap
): { pythonLine: number; confidence: number; type: string }[] {
  
  return sourceMap.mappings
    .filter(m => m.businessLine === businessLine)
    .sort((a, b) => b.confidence - a.confidence)
    .map(m => ({
      pythonLine: m.pythonLine,
      confidence: m.confidence,
      type: m.type
    }))
}
