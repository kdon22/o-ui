// Monaco Helper System - IntelliSense Integration

import type * as monaco from 'monaco-editor'
import { getAllHelpers, getHelperByIntelliSenseTrigger, type HelperConfig } from './helper-registry'
import type { MonacoHelperFactory } from './helper-factory'

/**
 * Create completion items for helper triggers
 * These appear in IntelliSense when user types
 */
export function createHelperCompletionItems(
  monacoInstance: typeof monaco,
  helperFactory: MonacoHelperFactory
): monaco.languages.CompletionItem[] {
  const completionItems: monaco.languages.CompletionItem[] = []

  const helpers = getAllHelpers()
  
  for (const helper of helpers) {
    // Add completion items for each IntelliSense trigger
    for (const trigger of helper.triggers) {
      if (trigger.type === 'intellisense') {
        const triggerValue = trigger.value as string

        completionItems.push({
          label: triggerValue,
          kind: monacoInstance.languages.CompletionItemKind.Function,
          insertText: '', // We'll handle insertion via the helper modal
          detail: `${helper.description} (${trigger.description})`,
          documentation: `**${helper.name}**\n\n${helper.description}\n\n${trigger.description}`,
          command: {
            id: 'helper.trigger',
            title: `Open ${helper.name}`,
            arguments: [helper.id, triggerValue]
          },
          sortText: `00_${triggerValue}`, // Sort helpers to top
          filterText: triggerValue,
          preselect: true,
          range: new monacoInstance.Range(1, 1, 1, 1) // Dummy range, will be set by Monaco
        })
      }
    }
  }

  console.log(`📝 [HelperIntelliSense] Created ${completionItems.length} completion items`)
  return completionItems
}

/**
 * Check if current context should show helper triggers
 */
export function shouldShowHelperTriggers(
  textBeforeCursor: string,
  currentLine: string
): boolean {
  // Show helper triggers at start of line or after whitespace
  const trimmed = textBeforeCursor.trim()
  
  // Show if:
  // 1. Empty line / start of line
  if (trimmed === '') return true
  
  // 2. After whitespace (new statement)
  if (textBeforeCursor.match(/\s$/)) return true
  
  // 3. Typing a potential helper trigger
  if (trimmed.match(/(call|utility|snippet|var):?$/i)) return true
  
  return false
}

/**
 * Handle helper trigger completion
 * Called when user selects a helper trigger from IntelliSense
 */
export function handleHelperTriggerCompletion(
  helperFactory: MonacoHelperFactory,
  helperId: string,
  trigger: string,
  position: monaco.Position
) {
  console.log(`🎯 [HelperIntelliSense] Handling trigger completion:`, { helperId, trigger })
  
  // Open the helper with IntelliSense context
  helperFactory.handleIntelliSenseTrigger(trigger, position)
}

/**
 * Enhanced completion provider that includes helper triggers
 * This extends/integrates with the existing business rules completion system
 */
export function createHelperEnhancedCompletionProvider(
  monacoInstance: typeof monaco,
  helperFactory: MonacoHelperFactory,
  originalProvider?: monaco.languages.CompletionItemProvider
): monaco.languages.CompletionItemProvider {
  
  return {
    triggerCharacters: ['.', ':'], // Include ':' for helper triggers
    
    async provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      context: monaco.languages.CompletionContext
    ): Promise<monaco.languages.CompletionList | undefined> {
      
      try {
        // Get text context
        const currentLine = model.getLineContent(position.lineNumber)
        const textBeforeCursor = currentLine.substring(0, position.column - 1)
        
        console.log('🔍 [HelperIntelliSense] Completion triggered:', {
          line: currentLine,
          textBeforeCursor,
          triggerCharacter: context.triggerCharacter
        })

        let suggestions: monaco.languages.CompletionItem[] = []
        
        // Get suggestions from original provider first
        if (originalProvider?.provideCompletionItems) {
          const originalResult = await originalProvider.provideCompletionItems(model, position, context, undefined as unknown as monaco.CancellationToken)
          if (originalResult && 'suggestions' in originalResult) {
            suggestions = [...originalResult.suggestions]
          }
        }

        // Add helper triggers if appropriate
        if (shouldShowHelperTriggers(textBeforeCursor, currentLine)) {
          const helperItems = createHelperCompletionItems(monacoInstance, helperFactory)
          suggestions = [...suggestions, ...helperItems]
          
          console.log(`➕ [HelperIntelliSense] Added ${helperItems.length} helper triggers`)
        }

        // Check for specific helper trigger patterns
        const triggerMatch = textBeforeCursor.match(/(call:|utility:|snippet:|var:)$/)
        if (triggerMatch) {
          const triggerValue = triggerMatch[1]
          const helper = getHelperByIntelliSenseTrigger(triggerValue)
          
          if (helper) {
            console.log(`🎯 [HelperIntelliSense] Detected helper trigger: ${triggerValue}`)
            
            // Add special "open helper" completion
            suggestions.unshift({
              label: `Open ${helper.name}`,
              kind: monacoInstance.languages.CompletionItemKind.Function,
              insertText: '',
              detail: helper.description,
              documentation: `Press Enter to open **${helper.name}**\n\n${helper.description}`,
              command: {
                id: 'helper.open',
                title: `Open ${helper.name}`,
                arguments: [helper.id, triggerValue, position]
              },
              sortText: '00_open_helper',
              preselect: true,
              range: new monacoInstance.Range(1, 1, 1, 1) // Dummy range, will be set by Monaco
            })
          }
        }

        console.log(`✅ [HelperIntelliSense] Returning ${suggestions.length} suggestions`)

        const limited = suggestions.slice(0, 100)
        if (limited.length === 0) return undefined
        return {
          suggestions: limited // Limit to prevent UI lag
        }

      } catch (error) {
        console.error('❌ [HelperIntelliSense] Error in completion provider:', error)
        return undefined
      }
    }
  }
}

/**
 * Register helper commands with Monaco
 * These handle the helper trigger commands from IntelliSense
 */
export function registerHelperCommands(
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoInstance: typeof monaco,
  helperFactory: MonacoHelperFactory
) {
  console.log('🎯 [HelperIntelliSense] Registering helper commands...')

  // Command to handle helper trigger selection
  editor.addAction({
    id: 'helper.trigger',
    label: 'Trigger Helper',
    run: (ed, helperId: string, trigger: string) => {
      const position = ed.getPosition()
      if (position) {
        handleHelperTriggerCompletion(helperFactory, helperId, trigger, position)
      }
    }
  })

  // Command to open helper directly
  editor.addAction({
    id: 'helper.open',
    label: 'Open Helper',
    run: (ed, helperId: string, trigger: string, position: monaco.Position) => {
      helperFactory.handleIntelliSenseTrigger(trigger, position)
    }
  })

  console.log('✅ [HelperIntelliSense] Helper commands registered')
} 