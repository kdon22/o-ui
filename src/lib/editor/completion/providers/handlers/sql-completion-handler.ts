// SQL completion handler
// Handles both SQL assignment completions and general SQL query completions

import type * as monaco from 'monaco-editor'
import { sqlAssignmentCompletion } from '@/lib/editor/completion/sql-assignment-completion'

export const sqlCompletionHandler = {
  async handle(
    monacoInstance: typeof monaco,
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList | undefined> {
    // Ensure SQL completion helpers have monaco
    try { sqlAssignmentCompletion.setMonacoInstance(monacoInstance) } catch {}

    // SQL Assignment completions (highest priority for assignment patterns)
    try {
      const sqlAssignmentSuggestions = await sqlAssignmentCompletion.provideSqlAssignmentCompletions(model, position)
      if (sqlAssignmentSuggestions && sqlAssignmentSuggestions.suggestions.length) {
        return sqlAssignmentSuggestions
      } else {
      }
    } catch (sqlAssignmentError) {
      console.error(`[SQLCompletionHandler] SQL assignment completion failed:`, sqlAssignmentError)
    }

    // No general SQL completions; limited to assignment contexts per SSOT

    return undefined
  }
}
