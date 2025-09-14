import * as monaco from 'monaco-editor'
import type { Variable } from '../types'

export interface DebugDecoration {
  id: string
  range: monaco.Range
  options: monaco.editor.IModelDecorationOptions
}

export class MonacoDebugService {
  private editor: monaco.editor.IStandaloneCodeEditor
  private breakpoints = new Set<number>()
  private decorationIds: string[] = []
  private currentExecutionLine?: number

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.setupBreakpointHandling()
  }

  private setupBreakpointHandling() {
    // Handle breakpoint clicks in gutter
    this.editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber
        if (lineNumber) {
          this.toggleBreakpoint(lineNumber)
        }
      }
    })
  }

  // Breakpoint Management
  toggleBreakpoint(lineNumber: number): boolean {
    if (this.breakpoints.has(lineNumber)) {
      this.breakpoints.delete(lineNumber)
      this.updateBreakpointDecorations()
      return false
    } else {
      this.breakpoints.add(lineNumber)
      this.updateBreakpointDecorations()
      return true
    }
  }

  clearAllBreakpoints() {
    this.breakpoints.clear()
    this.updateBreakpointDecorations()
  }

  getBreakpoints(): number[] {
    return Array.from(this.breakpoints)
  }

  // Execution Pointer Management
  setExecutionPointer(lineNumber: number) {
    this.currentExecutionLine = lineNumber
    this.updateExecutionDecoration()
  }

  clearExecutionPointer() {
    this.currentExecutionLine = undefined
    this.updateExecutionDecoration()
  }

  // Variable Hover and Decorations (like TypeScript debugging)
  showVariableValues(variables: Variable[]) {
    // Register hover provider for variable inspection
    const model = this.editor.getModel()
    if (!model) return

    monaco.languages.registerHoverProvider('business-rules', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null

        const variable = variables.find(v => v.name.includes(word.word))
        if (!variable) return null

        return {
          range: new monaco.Range(
            position.lineNumber, 
            word.startColumn, 
            position.lineNumber, 
            word.endColumn
          ),
          contents: [
            { value: `**${variable.name}**: ${variable.type}` },
            { value: `**Current**: \`${variable.value}\`` },
            ...(variable.changed ? [{ value: `**Status**: Changed` }] : [])
          ]
        }
      }
    })
  }

  // Clean up debug session
  cleanup() {
    this.clearAllBreakpoints()
    this.clearExecutionPointer()
  }

  private updateBreakpointDecorations() {
    const newDecorations: DebugDecoration[] = Array.from(this.breakpoints).map(line => ({
      id: `breakpoint-${line}`,
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: 'debug-breakpoint-glyph',
        glyphMarginHoverMessage: { value: 'Breakpoint' }
      }
    }))

    this.updateDecorations(newDecorations)
  }

  private updateExecutionDecoration() {
    const decorations: DebugDecoration[] = []

    if (this.currentExecutionLine) {
      decorations.push({
        id: 'execution-pointer',
        range: new monaco.Range(this.currentExecutionLine, 1, this.currentExecutionLine, 1),
        options: {
          className: 'debug-current-line',
          glyphMarginClassName: 'debug-current-line-glyph',
          glyphMarginHoverMessage: { value: 'Current execution line' }
        }
      })
    }

    this.updateDecorations(decorations, 'execution')
  }

  private updateDecorations(decorations: DebugDecoration[], type = 'breakpoint') {
    const newIds = decorations.map(d => d.id)
    this.decorationIds = this.editor.deltaDecorations(
      type === 'execution' ? [] : this.decorationIds, 
      decorations.map(d => ({ range: d.range, options: d.options }))
    )
  }
} 