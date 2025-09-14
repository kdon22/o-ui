// Class completion handler
// Provides user-defined class suggestions (like "Test", "Customer", etc.)

import type * as monaco from 'monaco-editor'

export const classCompletionHandler = {
  handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    trimmed: string
  ): monaco.languages.CompletionList | undefined {
    console.log(`[ClassCompletionHandler] Checking for class completions...`)
    
    // Only provide class suggestions when user is typing at the start of a line or after certain keywords
    const shouldSuggestClasses = this.shouldSuggestClasses(trimmed)
    console.log(`[ClassCompletionHandler] Should suggest classes: ${shouldSuggestClasses}`)
    
    if (!shouldSuggestClasses) {
      return undefined
    }

    const allText = model.getValue()
    const classCompletions = this.getClassCompletions(monacoInstance, allText)
    
    console.log(`[ClassCompletionHandler] Found ${classCompletions.length} class completions:`, classCompletions.map(c => `${c.label} (${c.detail})`))
    
    if (classCompletions.length === 0) {
      return undefined
    }

    return { suggestions: classCompletions }
  },

  shouldSuggestClasses(trimmed: string): boolean {
    console.log(`[ClassCompletionHandler] shouldSuggestClasses checking: "${trimmed}"`)
    
    // Suggest classes when:
    // 1. Starting a new line (empty or just whitespace)
    // 2. After assignment operators
    // 3. After "new" keyword
    // 4. After certain keywords like "if", "while", etc.
    // 5. When typing a single letter (like "T")
    
    if (trimmed === '') {
      console.log(`[ClassCompletionHandler] Empty line - suggesting classes`)
      return true
    }
    
    // After assignment (like "new1 = T")
    if (/\w+\s*=\s*\w*$/.test(trimmed)) {
      console.log(`[ClassCompletionHandler] After assignment - suggesting classes`)
      return true
    }
    
    // After "new" keyword
    if (/\bnew\s+\w*$/.test(trimmed)) {
      console.log(`[ClassCompletionHandler] After 'new' keyword - suggesting classes`)
      return true
    }
    
    // After control flow keywords
    if (/\b(if|while|for|when)\s+\w*$/.test(trimmed)) {
      console.log(`[ClassCompletionHandler] After control flow keyword - suggesting classes`)
      return true
    }
    
    // After function parameters or method calls
    if (/[,(]\s*\w*$/.test(trimmed)) {
      console.log(`[ClassCompletionHandler] After function parameter - suggesting classes`)
      return true
    }
    
    // Single letter typing (like just "T")
    if (/^\w+$/.test(trimmed) && trimmed.length <= 3) {
      console.log(`[ClassCompletionHandler] Single letter/short typing - suggesting classes`)
      return true
    }
    
    console.log(`[ClassCompletionHandler] No pattern matched - not suggesting classes`)
    return false
  },

  getClassCompletions(
    monacoInstance: typeof monaco,
    allText: string
  ): monaco.languages.CompletionItem[] {
    const completions: monaco.languages.CompletionItem[] = []
    
    try {
      // Use ClassIndexer to find user-defined classes
      const { ClassIndexer } = require('../../../type-system/class-indexer')
      const indexedClasses = ClassIndexer.index(allText)
      
      console.log(`[ClassCompletionHandler] ClassIndexer found classes:`, Object.keys(indexedClasses))
      
      // Add each user-defined class as a completion
      Object.entries(indexedClasses).forEach(([className, classInfo]: [string, any]) => {
        completions.push({
          label: className,
          kind: monacoInstance.languages.CompletionItemKind.Class,
          insertText: className,
          detail: `Class: ${className}`,
          documentation: classInfo.description || `User-defined class with ${classInfo.properties?.length || 0} properties and ${classInfo.actions?.length || 0} methods`,
          sortText: `0_${className}` // High priority for classes
        })
      })
      
    } catch (error) {
      console.error(`[ClassCompletionHandler] Error getting class completions:`, error)
    }
    
    // Also add built-in business object types
    try {
      const { ALL_BUSINESS_OBJECT_SCHEMAS } = require('../../../schemas/business-objects')
      
      ALL_BUSINESS_OBJECT_SCHEMAS.forEach((schema: any) => {
        if (schema.name && !schema.isUserDefined) {
          completions.push({
            label: schema.name,
            kind: monacoInstance.languages.CompletionItemKind.Class,
            insertText: schema.name,
            detail: `Built-in Class: ${schema.name}`,
            documentation: schema.description || `Built-in business object type`,
            sortText: `1_${schema.name}` // Lower priority than user-defined
          })
        }
      })
    } catch (error) {
      console.error(`[ClassCompletionHandler] Error getting built-in class completions:`, error)
    }
    
    return completions
  }
}
