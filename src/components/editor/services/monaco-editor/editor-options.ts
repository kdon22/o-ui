// Monaco Editor Options Configuration
import type * as MonacoTypes from 'monaco-editor'

/**
 * Create editor options based on editor type
 */
export function createEditorOptions(
  userOptions: MonacoTypes.editor.IStandaloneEditorConstructionOptions,
  type: 'business-rules' | 'python' | 'debug'
): MonacoTypes.editor.IStandaloneEditorConstructionOptions {
  const baseOptions: MonacoTypes.editor.IStandaloneEditorConstructionOptions = {
    language: type === 'python' ? 'python' : 'business-rules',
    theme: 'vs',
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    folding: true,
    foldingHighlight: true,
    foldingStrategy: 'indentation',
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    autoIndent: 'full',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'smart',
    quickSuggestionsDelay: 100,
    suggestSelection: 'first',
    tabCompletion: 'on',
    suggest: {
      preview: true,
      showIcons: true,
      showStatusBar: true,
      showStatus: false, // Disable "no suggestions" bubble
    },
    wordWrap: 'on',
    wordWrapColumn: 120,
    wrappingIndent: 'indent',
    matchBrackets: 'always',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'Monaco, "Cascadia Code", "Courier New", monospace',
    lineHeight: 1.5,
    renderWhitespace: 'boundary',
    selectOnLineNumbers: true,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    automaticLayout: true,
    hover: {
      enabled: true,
      delay: 300,
      sticky: true,
      above: false,
    },
    contextmenu: true,
    scrollbar: {
      useShadows: false,
      verticalHasArrows: true,
      horizontalHasArrows: true
    }
  }

  // Debug-specific options
  if (type === 'debug') {
    baseOptions.glyphMargin = true
    baseOptions.renderLineHighlight = 'line'
    baseOptions.lineHeight = 20
  }

  return { ...baseOptions, ...userOptions }
} 