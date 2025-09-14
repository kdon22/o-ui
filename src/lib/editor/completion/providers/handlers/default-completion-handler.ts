// Default completion handler
// Provides default variable and module suggestions when no specific context matches

import type * as monaco from 'monaco-editor'
import { typeInferenceService } from '../../type-inference-service'
import { getModuleNames } from '@/lib/editor/schemas/modules'
import { getVariablesUsingMasterSystem } from '../utils/master-variable-detection'
import { getGlobalFunctions } from '@/lib/editor/schemas/global-functions'

export const defaultCompletionHandler = {
  handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.CompletionList | undefined {
    console.log(`[DefaultCompletionHandler] Getting default suggestions using Master System...`)
    
    const allText = model.getValue()
    const masterVariables = getVariablesUsingMasterSystem(allText)
    console.log(`[DefaultCompletionHandler] Master System returned ${masterVariables.length} variables:`, masterVariables)
    
    const varItems = masterVariables.map(v => ({
      label: v.name,
      kind: monacoInstance.languages.CompletionItemKind.Variable,
      insertText: v.name,
      detail: v.detail, // Now shows "varName: type" like hover
      documentation: v.documentation, // Rich documentation like hover
      sortText: `1_${v.name}`
    } as monaco.languages.CompletionItem))
    console.log(`[DefaultCompletionHandler] Created ${varItems.length} variable suggestions`)

    // Modules: get directly from MODULE_REGISTRY (fast!)
    console.log(`[DefaultCompletionHandler] Getting modules from MODULE_REGISTRY...`)
    const moduleNames = getModuleNames()
    console.log(`[DefaultCompletionHandler] Unique module names:`, moduleNames)
    
    const moduleItems = moduleNames.map(name => ({
      label: name,
      kind: monacoInstance.languages.CompletionItemKind.Module,
      insertText: `${name}.`,
      detail: `${name} module`,
      sortText: `2_${name}`
    } as monaco.languages.CompletionItem))
    console.log(`[DefaultCompletionHandler] Created ${moduleItems.length} module suggestions`)

    // Global Functions: debug(), log(), regex(), etc.
    console.log(`[DefaultCompletionHandler] Getting global functions...`)
    const globalFunctions = getGlobalFunctions()
    console.log(`[DefaultCompletionHandler] Global functions:`, globalFunctions)
    
    const functionItems = globalFunctions.map(func => ({
      label: func.name,
      kind: monacoInstance.languages.CompletionItemKind.Function,
      insertText: `${func.name}("$1")`,
      insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: `${func.name}() - ${func.returnType}`,
      documentation: func.description,
      sortText: `0_${func.name}` // High priority for global functions
    } as monaco.languages.CompletionItem))
    console.log(`[DefaultCompletionHandler] Created ${functionItems.length} global function suggestions`)

    const suggestions = [...functionItems, ...varItems, ...moduleItems]
    const finalSuggestions = suggestions.slice(0, 50)
    console.log(`[DefaultCompletionHandler] Final suggestions (${finalSuggestions.length}):`, finalSuggestions)

    if (finalSuggestions.length === 0) return undefined
    return { suggestions: finalSuggestions }
  }
}
