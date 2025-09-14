// Main completion provider orchestrator
// Coordinates all completion strategies and returns the best match

import type * as monaco from 'monaco-editor'
import { typeInferenceService } from '../../type-inference-service'
import { sqlCompletionHandler } from '../handlers/sql-completion-handler'
import { parameterCompletionHandler } from '../handlers/parameter-completion-handler'
import { keywordCompletionHandler } from '../handlers/keyword-completion-handler'
import { propertyCompletionHandler } from '../handlers/property-completion-handler'
import { classCompletionHandler } from '../handlers/class-completion-handler'
import { defaultCompletionHandler } from '../handlers/default-completion-handler'
import { getModuleNames } from '@/lib/editor/schemas/modules'
import { getVariablesUsingMasterSystem, convertToLegacyFormat } from '../utils/master-variable-detection'
import { getGlobalFunctions } from '@/lib/editor/schemas/global-functions'

export function createCompletionProviderFactory(monacoInstance: typeof monaco): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: [
      '.', ',', '['
    ],

    async provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): Promise<monaco.languages.CompletionList | undefined> {
      try {
        

        // Refresh SSOT type inference
        typeInferenceService.refresh(model)

        // Get current line context for SQL space trigger and general completion
        const currentLine = model.getLineContent(position.lineNumber)
        const before = currentLine.substring(0, position.column - 1)
        const trimmed = before.trim()
        

        // Special case: immediately after "if " we want variables, modules, and classes, not the 'if' snippet
        const afterIfWithSpace = /\bif\s+$/.test(before)
        if (afterIfWithSpace) {
          

          // Variables using Master Type Detection System (same as hover provider)
          const allText = model.getValue()
          const masterVariables = getVariablesUsingMasterSystem(allText)
          const vars = masterVariables.map(v => ({
            label: v.name,
            kind: monacoInstance.languages.CompletionItemKind.Variable,
            insertText: v.name,
            detail: v.detail, // Now shows "varName: type" like hover
            documentation: v.documentation, // Rich documentation like hover
            sortText: `0_${v.name}`
          } as monaco.languages.CompletionItem))

          // Modules from MODULE_REGISTRY (fast!)
          const moduleNames = getModuleNames()
          const moduleItems = moduleNames.map(name => ({
            label: name,
            kind: monacoInstance.languages.CompletionItemKind.Module,
            insertText: `${name}.`,
            detail: `${name} module`,
            sortText: `1_${name}`
          } as monaco.languages.CompletionItem))

          // Classes from class indexer + built-in business objects
          const classItems = classCompletionHandler.getClassCompletions(
            monacoInstance,
            model.getValue()
          )

          // Global Functions: debug(), log(), regex(), etc.
          const globalFunctions = getGlobalFunctions()
          const functionItems = globalFunctions.map(func => ({
            label: func.name,
            kind: monacoInstance.languages.CompletionItemKind.Function,
            insertText: `${func.name}("$1")`,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `${func.name}() - ${func.returnType}`,
            documentation: func.description,
            sortText: `0_${func.name}` // High priority for global functions
          } as monaco.languages.CompletionItem))

          const suggestions = [...functionItems, ...vars, ...moduleItems, ...classItems].slice(0, 50)
          
          if (suggestions.length === 0) return undefined
          return { suggestions }
        }

        // If typing after control keyword (e.g., "if a"), show variables/modules/classes
        const typingAfterControl = /\b(if|while|for|when|unless|any|all)\s+\w*$/.test(before)
        if (typingAfterControl) {
          const defaultResultAfterControl = defaultCompletionHandler.handle(monacoInstance, model, position)
          
          return defaultResultAfterControl
        }

        // Start-of-line or bare identifier on a new statement: show defaults
        const atStartOfLine = trimmed.length === 0
        const isBareIdentifierAtSOL = /^\s*[A-Za-z_]\w*$/.test(before)
        if (atStartOfLine || isBareIdentifierAtSOL) {
          const defaultAtSOL = defaultCompletionHandler.handle(monacoInstance, model, position)
          if (!defaultAtSOL || !defaultAtSOL.suggestions.length) return undefined
          return defaultAtSOL
        }

        // SQL completions (must run BEFORE generic operator handling to avoid being shadowed)
        
        const sqlResult = await sqlCompletionHandler.handle(monacoInstance, model, position)
        if (sqlResult) {
          
          return sqlResult
        }

        // for … in ‹cursor›  → suggest iterable candidates (arrays, query results, maps)
        const forInMatch = before.match(/\bfor\s+[A-Za-z_][\w]*\s+in\s+([A-Za-z_][\w]*)?$/)
        if (forInMatch) {
          const prefix = forInMatch[1] || ''
          const allText = model.getValue()
          const masterVariables = getVariablesUsingMasterSystem(allText)
          const allVars = convertToLegacyFormat(masterVariables)

          // Gather variable names that look like SQL query assignments
          let queryVars: string[] = []
          try {
            const text = model.getValue()
            const re = /^\s*([A-Za-z_][\w]*)\s*=\s*SELECT\b/img
            const names = new Set<string>()
            let m: RegExpExecArray | null
            while ((m = re.exec(text)) !== null) names.add(m[1])
            queryVars = Array.from(names)
          } catch {}

          const isIterableType = (t: string): boolean => {
            if (!t) return false
            const tt = String(t)
            // Treat SQL SELECT assignments (queryrows:table) as iterables
            return tt.startsWith('queryrows:') || tt.startsWith('queryrow:') || /\[\]$/.test(tt) || /array/i.test(tt) || /list/i.test(tt) || /map/i.test(tt) || /record/i.test(tt) || /dict/i.test(tt)
          }

          const varItems = allVars
            .filter(v => (prefix ? v.name.startsWith(prefix) : true))
            .filter(v => isIterableType(v.type) || queryVars.includes(v.name))
            .map(v => ({
              label: v.name,
              kind: monacoInstance.languages.CompletionItemKind.Variable,
              insertText: v.name,
              detail: v.type,
              documentation: `${v.name}: ${v.type}`,
              sortText: `0_${v.name}`
            } as monaco.languages.CompletionItem))

          if (varItems.length) return { suggestions: varItems }
          const fallback = defaultCompletionHandler.handle(monacoInstance, model, position)
          if (fallback && fallback.suggestions.length) return fallback
        }

        // After assignment or operator (e.g., "= ", "and ", "or ", arithmetic)
        // When user types the next identifier char, offer default typed variables/modules
        const afterAssignmentOrOperator = /(?:^|\s)(=|\+|\-|\*|\/|%|and|or|not|in|contains|beginsWith|endsWith|matches)\s+\w*$/i.test(before)
        if (afterAssignmentOrOperator) {
          const defaultAfterOp = defaultCompletionHandler.handle(monacoInstance, model, position)
          if (!defaultAfterOp || !defaultAfterOp.suggestions.length) return undefined
          return defaultAfterOp
        }

        // Parameter-aware suggestions
        
        const paramResult = parameterCompletionHandler.handle(monacoInstance, model, position)
        if (paramResult) {
          
          return paramResult
        }

        // Keyword-only guard: when user is starting a control statement
        
        const keywordResult = keywordCompletionHandler.handle(monacoInstance, model, position, trimmed)
        if (keywordResult) {
          
          return keywordResult
        }

        // Property access: variable.
        
        const propertyResult = await propertyCompletionHandler.handle(monacoInstance, model, position, trimmed)
        if (propertyResult) {
          
          return propertyResult
        }

        // Class completions: user-defined classes like "Test"
        
        const classResult = classCompletionHandler.handle(monacoInstance, model, position, trimmed)
        if (classResult) {
          
          return classResult
        }

        // Default: typed variables + module names
        
        const defaultResult = defaultCompletionHandler.handle(monacoInstance, model, position)
        if (!defaultResult || !defaultResult.suggestions.length) return undefined
        return defaultResult
        return defaultResult
      } catch (error) {
        console.error(`[CompletionProvider] CRITICAL ERROR in provideCompletionItems:`, error)
        console.error(`[CompletionProvider] Error stack:`, error instanceof Error ? error.stack : String(error))
        console.error(`[CompletionProvider] Position:`, position)
        console.error(`[CompletionProvider] Model URI:`, model.uri.toString())
        return undefined
      }
    }
  }
}
