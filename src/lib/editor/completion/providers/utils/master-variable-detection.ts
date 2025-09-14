/**
 * 🎯 MASTER VARIABLE DETECTION UTILITY
 * 
 * Shared utility for getting variables using the Master Type Detection System.
 * This ensures completion and hover show IDENTICAL type information.
 * 
 * Used by:
 * - main-provider.ts
 * - default-completion-handler.ts
 * - Any other completion handlers that need variable detection
 */

import { detectVariableType } from '@/lib/editor/type-system/master-type-detector'
import { GLOBAL_BUSINESS_VARIABLES } from '@/lib/editor/schemas/business-objects'

export interface MasterVariableInfo {
  name: string
  type: string
  detail: string
  documentation: string
  confidence: number
  source: string
}

/**
 * Get all variables using the Master Type Detection System
 * This ensures completion and hover show IDENTICAL type information
 */
export function getVariablesUsingMasterSystem(allText: string): MasterVariableInfo[] {
  const variables: MasterVariableInfo[] = []

  // 1. Extract variable names from assignments in the text
  const lines = allText.split('\n')
  const variableNames = new Set<string>()
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.includes('=') || trimmed.startsWith('//') || trimmed.startsWith('class ')) {
      continue
    }
    
    const assignmentMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/)
    if (assignmentMatch) {
      variableNames.add(assignmentMatch[1])
    }
    
    // Also detect loop variables
    const forLoopMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+/)
    if (forLoopMatch) {
      variableNames.add(forLoopMatch[1])
    }
  }

  // 2. Use Master Type Detection System for each variable
  for (const varName of variableNames) {
    const typeInfo = detectVariableType(varName, allText)
    
    if (typeInfo.confidence > 0.3) { // Include variables with reasonable confidence
      variables.push({
        name: varName,
        type: typeInfo.type as string,
        detail: `${varName}: ${typeInfo.type}`,
        documentation: `**${varName}** → *${typeInfo.type}*\n\n**Source:** ${typeInfo.source}\n**Evidence:** ${typeInfo.evidence}`,
        confidence: typeInfo.confidence,
        source: typeInfo.source
      })
    }
  }

  // 3. Add global business variables (like 'utr')
  for (const [varName, schema] of Object.entries(GLOBAL_BUSINESS_VARIABLES)) {
    const typeName = (schema as any).name || 'unknown'
    variables.push({
      name: varName,
      type: typeName,
      detail: `${varName}: ${typeName}`,
      documentation: `**${varName}** → *${typeName}*\n\n**Source:** global\n**Evidence:** Built-in business object`,
      confidence: 1.0,
      source: 'global'
    })
  }

  console.log(`[MasterVariableDetection] Found ${variables.length} variables using Master System:`, variables)
  return variables
}

/**
 * Convert Master Variable Info to legacy format for compatibility
 */
export function convertToLegacyFormat(masterVariables: MasterVariableInfo[]): Array<{ name: string; type: string }> {
  return masterVariables.map(v => ({ name: v.name, type: v.type }))
}
