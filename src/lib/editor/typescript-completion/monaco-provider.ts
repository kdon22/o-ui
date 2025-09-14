/**
 * 🎯 TYPESCRIPT COMPLETION MONACO PROVIDER
 * 
 * Clean Monaco completion provider for TypeScript interface completions
 * Integrates with InterfaceRegistry for user utility return object completions
 */

import type * as monaco from 'monaco-editor'
import { interfaceRegistry } from './interface-registry'

// =============================================================================
// COMPLETION PROVIDER
// =============================================================================

export function createTypeScriptCompletionProvider(
  monacoInstance: typeof monaco
): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['.'],

    async provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): Promise<monaco.languages.CompletionList | undefined> {
      try {
        console.log(`[TypeScriptCompletionProvider] Triggered at position ${position.lineNumber}:${position.column}`)

        // Get current line and context
        const currentLine = model.getLineContent(position.lineNumber)
        const beforeCursor = currentLine.substring(0, position.column - 1)
        
        console.log(`[TypeScriptCompletionProvider] Line: "${currentLine}"`)
        console.log(`[TypeScriptCompletionProvider] Before cursor: "${beforeCursor}"`)

        // Check for utility result access pattern: "result." or "variableName."
        const resultAccessMatch = beforeCursor.match(/(\w+)\.$/);
        if (!resultAccessMatch) {
          console.log(`[TypeScriptCompletionProvider] No result access pattern found`)
          return undefined
        }

        const variableName = resultAccessMatch[1]
        console.log(`[TypeScriptCompletionProvider] Found variable access: ${variableName}`)

        // Look for utility call patterns in the code to determine which utility this result comes from
        const allText = model.getValue()
        const utilityName = detectUtilityFromVariable(allText, variableName, position.lineNumber)
        
        if (!utilityName) {
          console.log(`[TypeScriptCompletionProvider] Could not detect utility for variable: ${variableName}`)
          return undefined
        }

        console.log(`[TypeScriptCompletionProvider] Detected utility: ${utilityName} for variable: ${variableName}`)

        // Get completion items from interface registry
        const completionItems = interfaceRegistry.getCompletionItems(utilityName, variableName)
        
        if (completionItems.length === 0) {
          console.log(`[TypeScriptCompletionProvider] No completion items found for utility: ${utilityName}`)
          return undefined
        }

        // Convert to Monaco completion items
        const monacoItems: monaco.languages.CompletionItem[] = completionItems.map(item => ({
          label: item.label,
          kind: getMonacoCompletionKind(monacoInstance, item.kind),
          insertText: item.insertText,
          documentation: item.documentation,
          detail: item.detail,
          sortText: item.sortText,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - variableName.length - 1, // Include the variable name and dot
            endColumn: position.column
          }
        }))

        console.log(`[TypeScriptCompletionProvider] Returning ${monacoItems.length} completion items`)
        
        return {
          suggestions: monacoItems
        }

      } catch (error) {
        console.error(`[TypeScriptCompletionProvider] Error:`, error)
        return undefined
      }
    }
  }
}

// =============================================================================
// UTILITY DETECTION
// =============================================================================

/**
 * Detect which utility a variable result comes from by analyzing the code
 */
function detectUtilityFromVariable(
  allText: string, 
  variableName: string, 
  currentLine: number
): string | null {
  const lines = allText.split('\n')
  
  // Look backwards from current line to find variable assignment
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i]
    
    // Pattern 1: result = utilityName(...)
    const directAssignMatch = line.match(new RegExp(`\\b${variableName}\\s*=\\s*(\\w+)\\s*\\(`))
    if (directAssignMatch) {
      const utilityName = directAssignMatch[1]
      console.log(`[UtilityDetection] Found direct assignment: ${variableName} = ${utilityName}(...)`)
      return utilityName
    }
    
    // Pattern 2: result = await utilityName(...)
    const awaitAssignMatch = line.match(new RegExp(`\\b${variableName}\\s*=\\s*await\\s+(\\w+)\\s*\\(`))
    if (awaitAssignMatch) {
      const utilityName = awaitAssignMatch[1]
      console.log(`[UtilityDetection] Found await assignment: ${variableName} = await ${utilityName}(...)`)
      return utilityName
    }
    
    // Pattern 3: Multi-line utility call
    const callMatch = line.match(/(\w+)\s*\(/)
    if (callMatch && lines[i + 1] && lines[i + 1].includes(variableName)) {
      const utilityName = callMatch[1]
      console.log(`[UtilityDetection] Found multi-line call: ${utilityName}(...) → ${variableName}`)
      return utilityName
    }
  }
  
  // If variable is "result", try to find the most recent utility call
  if (variableName === 'result') {
    for (let i = currentLine - 1; i >= 0; i--) {
      const line = lines[i]
      const utilityCallMatch = line.match(/(\w+)\s*\(/)
      if (utilityCallMatch) {
        const utilityName = utilityCallMatch[1]
        // Check if this utility is registered
        if (interfaceRegistry.hasUtility(utilityName)) {
          console.log(`[UtilityDetection] Found recent utility call for 'result': ${utilityName}`)
          return utilityName
        }
      }
    }
  }
  
  console.log(`[UtilityDetection] No utility detected for variable: ${variableName}`)
  return null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getMonacoCompletionKind(
  monacoInstance: typeof monaco, 
  kind: string
): monaco.languages.CompletionItemKind {
  switch (kind) {
    case 'Property':
      return monacoInstance.languages.CompletionItemKind.Property
    case 'Method':
      return monacoInstance.languages.CompletionItemKind.Method
    case 'Variable':
      return monacoInstance.languages.CompletionItemKind.Variable
    default:
      return monacoInstance.languages.CompletionItemKind.Property
  }
}

// =============================================================================
// REGISTRATION HELPER
// =============================================================================

/**
 * Register the TypeScript completion provider with Monaco
 */
export function registerTypeScriptCompletionProvider(
  monacoInstance: typeof monaco,
  languageId: string = 'business-rules'
): monaco.IDisposable {
  console.log(`[TypeScriptCompletionProvider] Registering provider for language: ${languageId}`)
  
  const provider = createTypeScriptCompletionProvider(monacoInstance)
  const disposable = monacoInstance.languages.registerCompletionItemProvider(languageId, provider)
  
  console.log(`[TypeScriptCompletionProvider] Provider registered successfully`)
  
  return disposable
}
