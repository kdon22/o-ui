// Code Context Parser - Detect and Parse Existing Code Context

import type * as monaco from 'monaco-editor'

export interface UtilityCallContext {
  utilityName: string
  parameters: Record<string, any>
  startPosition: monaco.Position
  endPosition: monaco.Position
  fullText: string
}

export interface CodeContext {
  isOverExistingCode: boolean
  utilityCall?: UtilityCallContext
  currentLine: string
  position: monaco.Position
}

/**
 * Parse current cursor context to detect existing utility calls
 */
export function parseCodeContext(
  editor: monaco.editor.IStandaloneCodeEditor,
  position?: monaco.Position
): CodeContext {
  const currentPosition = position || editor.getPosition()
  if (!currentPosition) {
    return { isOverExistingCode: false, currentLine: '', position: currentPosition! }
  }

  const model = editor.getModel()
  if (!model) {
    return { isOverExistingCode: false, currentLine: '', position: currentPosition }
  }

  const currentLine = model.getLineContent(currentPosition.lineNumber)
  
  // Check if we're over an existing utility call
  const utilityCall = detectUtilityCallAtPosition(model, currentPosition)
  
  return {
    isOverExistingCode: !!utilityCall,
    utilityCall,
    currentLine,
    position: currentPosition
  }
}

/**
 * Detect if cursor position is within a utility call
 */
function detectUtilityCallAtPosition(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): UtilityCallContext | undefined {
  
  // Get the line content
  const lineNumber = position.lineNumber
  const lineContent = model.getLineContent(lineNumber)
  
  // Look for utility call patterns
  const utilityCallPattern = /call\s+utility\s+"([^"]+)"(?:\s+with:\s*(.*))?/gi
  
  let match
  while ((match = utilityCallPattern.exec(lineContent)) !== null) {
    const matchStart = match.index
    const matchEnd = match.index + match[0].length
    const cursorColumn = position.column
    
    // Check if cursor is within this match
    if (cursorColumn >= matchStart + 1 && cursorColumn <= matchEnd + 1) {
      const utilityName = match[1]
      const parametersText = match[2]?.trim() || ''
      
      // Parse parameters from the text
      const parameters = parseParametersFromText(parametersText)
      
      return {
        utilityName,
        parameters,
        startPosition: new monaco.Position(lineNumber, matchStart + 1),
        endPosition: new monaco.Position(lineNumber, matchEnd + 1),
        fullText: match[0]
      }
    }
  }

  // Check for multi-line utility calls (more complex parsing)
  return detectMultilineUtilityCall(model, position)
}

/**
 * Detect multi-line utility calls
 */
function detectMultilineUtilityCall(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): UtilityCallContext | undefined {
  
  const lineNumber = position.lineNumber
  const totalLines = model.getLineCount()
  
  // Look backwards and forwards to find utility call boundaries
  let startLine = lineNumber
  let endLine = lineNumber
  let utilityName = ''
  let foundStart = false
  
  // Look backwards for the start of a utility call
  for (let line = lineNumber; line >= Math.max(1, lineNumber - 10); line--) {
    const lineContent = model.getLineContent(line).trim()
    
    // Check if this line starts a utility call
    const startMatch = lineContent.match(/^call\s+utility\s+"([^"]+)"/i)
    if (startMatch) {
      utilityName = startMatch[1]
      startLine = line
      foundStart = true
      break
    }
    
    // If we hit a blank line or other statement, stop looking
    if (line < lineNumber && lineContent === '') {
      break
    }
  }
  
  if (!foundStart) {
    return undefined
  }
  
  // Look forwards for the end of the utility call
  let parametersText = ''
  for (let line = startLine; line <= Math.min(totalLines, startLine + 20); line++) {
    const lineContent = model.getLineContent(line)
    
    if (line === startLine) {
      // Extract parameters from the first line
      const withMatch = lineContent.match(/with:\s*(.*)$/i)
      if (withMatch) {
        parametersText += withMatch[1]
      }
    } else {
      const trimmed = lineContent.trim()
      
      // If we hit an empty line or new statement, stop
      if (trimmed === '' || trimmed.match(/^(if|call|return|set)/i)) {
        endLine = line - 1
        break
      }
      
      // Add this line to parameters
      parametersText += ' ' + trimmed
      endLine = line
    }
  }
  
  // Check if cursor position is within the detected range
  const cursorLine = position.lineNumber
  if (cursorLine < startLine || cursorLine > endLine) {
    return undefined
  }
  
  // Parse parameters
  const parameters = parseParametersFromText(parametersText.trim())
  
  const startContent = model.getLineContent(startLine)
  const endContent = model.getLineContent(endLine)
  
  return {
    utilityName,
    parameters,
    startPosition: new monaco.Position(startLine, 1),
    endPosition: new monaco.Position(endLine, endContent.length + 1),
    fullText: model.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: endContent.length + 1
    })
  }
}

/**
 * Parse parameters from text format
 * Examples:
 * - "errorText=Hello, routineID=TEST123"
 * - "{ errorText: 'Hello', routineID: 'TEST123' }"
 */
function parseParametersFromText(text: string): Record<string, any> {
  const parameters: Record<string, any> = {}
  
  if (!text.trim()) {
    return parameters
  }
  
  try {
    // Try parsing as JSON object first
    if (text.trim().startsWith('{')) {
      const parsed = JSON.parse(text)
      return parsed
    }
  } catch {
    // Fall back to key-value parsing
  }
  
  // Parse key=value format
  const kvPattern = /(\w+)\s*[:=]\s*([^,]+)/g
  let match
  
  while ((match = kvPattern.exec(text)) !== null) {
    const key = match[1].trim()
    let value = match[2].trim()
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    // Try to parse as number or boolean
    if (value === 'true') {
      parameters[key] = true
    } else if (value === 'false') {
      parameters[key] = false
    } else if (!isNaN(Number(value))) {
      parameters[key] = Number(value)
    } else {
      parameters[key] = value
    }
  }
  
  return parameters
}

/**
 * Generate updated code from parameters
 */
export function generateUpdatedUtilityCall(
  utilityName: string,
  parameters: Record<string, any>,
  options: {
    multiline?: boolean
    indentLevel?: number
  } = {}
): string {
  const { multiline = false, indentLevel = 0 } = options
  const indent = '  '.repeat(indentLevel)
  
  if (!parameters || Object.keys(parameters).length === 0) {
    return `${indent}call utility "${utilityName}"`
  }
  
  if (multiline && Object.keys(parameters).length > 1) {
    const paramLines = Object.entries(parameters).map(([key, value]) => {
      const formattedValue = typeof value === 'string' ? `"${value}"` : String(value)
      return `${indent}  ${key}: ${formattedValue}`
    }).join(',\n')
    
    return `${indent}call utility "${utilityName}" with:\n${paramLines}`
  } else {
    const paramString = Object.entries(parameters)
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' ? `"${value}"` : String(value)
        return `${key}=${formattedValue}`
      })
      .join(', ')
    
    return `${indent}call utility "${utilityName}" with: ${paramString}`
  }
}

/**
 * Replace existing utility call in editor
 */
export function replaceUtilityCall(
  editor: monaco.editor.IStandaloneCodeEditor,
  context: UtilityCallContext,
  newCode: string
): void {
  const range = {
    startLineNumber: context.startPosition.lineNumber,
    startColumn: context.startPosition.column,
    endLineNumber: context.endPosition.lineNumber,
    endColumn: context.endPosition.column
  }
  
  const operation: monaco.editor.IIdentifiedSingleEditOperation = {
    range,
    text: newCode,
    forceMoveMarkers: true
  }
  
  editor.executeEdits('context-aware-helper', [operation])
  
  // Position cursor at end of inserted code
  const lines = newCode.split('\n')
  const newPosition = new monaco.Position(
    context.startPosition.lineNumber + lines.length - 1,
    lines.length === 1 
      ? context.startPosition.column + newCode.length 
      : lines[lines.length - 1].length + 1
  )
  
  editor.setPosition(newPosition)
  editor.focus()
}

/**
 * Get parameter definitions for a specific utility
 * This would typically fetch from your utility registry or API
 */
export async function getUtilityParameterDefinitions(utilityName: string): Promise<any[]> {
  // This is a mock - in reality, you'd fetch this from your utility registry
  // or from the action system response
  
  const mockDefinitions: Record<string, any[]> = {
    'Document Error And Queue': [
      {
        name: 'errorText',
        type: 'string',
        required: true,
        description: 'Error message to log',
        placeholder: 'Enter error message...'
      },
      {
        name: 'routineID', 
        type: 'string',
        required: true,
        description: 'Routine identifier',
        placeholder: 'Enter routine ID...'
      },
      {
        name: 'severity',
        type: 'enum',
        required: false,
        description: 'Error severity level',
        enumOptions: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        defaultValue: 'MEDIUM'
      }
    ]
  }
  
  return mockDefinitions[utilityName] || []
}