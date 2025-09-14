// Monaco Code Insertion Service for Universal Search
import type * as monaco from 'monaco-editor'
import type { SearchResult } from './universal-rule-search'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a class name to camelCase variable name
 * Examples:
 * - "Traveler" -> "traveler"
 * - "Hotel Booking" -> "hotelBooking"  
 * - "AIR_SEGMENT" -> "airSegment"
 * - "test" -> "test"
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase())
}

/**
 * Extract actual class name from source code
 */
function extractClassNameFromSource(sourceCode: string): string | null {
  if (!sourceCode) return null
  
  // Look for class definition: "class ClassName" or "class ClassName {"
  const classMatch = sourceCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[{:]/)
  return classMatch ? classMatch[1] : null
}

/**
 * Generate class instantiation snippet from search result
 */
function generateClassSnippet(result: SearchResult): string {
  // Debug: log the source code to see what we're working with
  console.log('🔍 [generateClassSnippet] Result source code:', result.sourceCode?.substring(0, 200) + '...')
  
  // First try to extract the actual class name from source code
  const actualClassName = result.sourceCode ? extractClassNameFromSource(result.sourceCode) : null
  
  
  const className = actualClassName || result.pythonName || result.name
  
  // Use a more descriptive variable name instead of the class name
  const varName = 'saveVariable' // More descriptive placeholder for user editing
  
  
  return `${varName} = ${className}()`
}

// ============================================================================
// GLOBAL MONACO EDITOR REGISTRY
// ============================================================================

interface MonacoEditorRegistration {
  id: string
  editor: monaco.editor.IStandaloneCodeEditor
  isActive: boolean
  lastFocused?: number
}

class MonacoEditorRegistry {
  private editors = new Map<string, MonacoEditorRegistration>()
  private activeEditorId: string | null = null

  register(id: string, editor: monaco.editor.IStandaloneCodeEditor): () => void {

    
    this.editors.set(id, {
      id,
      editor,
      isActive: false,
      lastFocused: Date.now()
    })

    // Set up focus tracking
    const disposable = editor.onDidFocusEditorText(() => {
      this.setActiveEditor(id)
    })

    // Return cleanup function
    return () => {
  
      disposable.dispose()
      this.editors.delete(id)
      if (this.activeEditorId === id) {
        this.activeEditorId = null
      }
    }
  }

  private setActiveEditor(id: string): void {
    // Update all editors to inactive
    this.editors.forEach(reg => {
      reg.isActive = false
    })

    // Set the focused editor as active
    const registration = this.editors.get(id)
    if (registration) {
      registration.isActive = true
      registration.lastFocused = Date.now()
      this.activeEditorId = id
  
    }
  }

  getActiveEditor(): monaco.editor.IStandaloneCodeEditor | null {
    if (this.activeEditorId) {
      const registration = this.editors.get(this.activeEditorId)
      if (registration) {
        return registration.editor
      }
    }

    // Fallback: return most recently focused editor
    let mostRecent: MonacoEditorRegistration | null = null
    this.editors.forEach(reg => {
      if (!mostRecent || (reg.lastFocused && reg.lastFocused > (mostRecent?.lastFocused || 0))) {
        mostRecent = reg
      }
    })

    return mostRecent ? mostRecent.editor : null
  }

  getAllEditors(): monaco.editor.IStandaloneCodeEditor[] {
    return Array.from(this.editors.values()).map(reg => reg.editor)
  }
}

// Global instance
const monacoRegistry = new MonacoEditorRegistry()

// ============================================================================
// MONACO EDITOR DETECTION
// ============================================================================

/**
 * Find the currently active/focused Monaco editor instance
 */
function findActiveMonacoEditor(): monaco.editor.IStandaloneCodeEditor | null {
  // Try to find focused editor through DOM
  const activeElement = document.activeElement
  
  if (!activeElement) return null
  
  // Look for Monaco editor container
  let current = activeElement as Element
  while (current && current !== document.body) {
    // Check if this element or parent has Monaco editor data
    if (current.classList.contains('monaco-editor') || 
        current.querySelector('.monaco-editor')) {
      
      // Try to get editor instance from various possible locations
      const monacoContainer = current.classList.contains('monaco-editor') 
        ? current 
        : current.querySelector('.monaco-editor')
        
      if (monacoContainer) {
        // Monaco editors are often stored on the container element
        const editor = (monacoContainer as any)?._editor || 
                      (monacoContainer as any)?.__monacoEditor ||
                      (current as any)?._monacoEditor
        
        if (editor && typeof editor.getPosition === 'function') {
          return editor
        }
      }
    }
    current = current.parentElement!
  }
  
  // Fallback: try to find any Monaco editor in the DOM
  const monacoEditors = document.querySelectorAll('.monaco-editor')
  for (const container of monacoEditors) {
    const editor = (container as any)?._editor || 
                   (container as any)?.__monacoEditor
                   
    if (editor && typeof editor.getPosition === 'function') {
      // Check if this editor has focus or is visible
      const editorDom = editor.getDomNode?.()
      if (editorDom && (editorDom.contains(document.activeElement) || 
          window.getComputedStyle(editorDom).display !== 'none')) {
        return editor
      }
    }
  }
  
  return null
}

/**
 * Alternative: try to find Monaco editor through global references
 */
function findMonacoEditorGlobal(): monaco.editor.IStandaloneCodeEditor | null {
  // Check if there's a global reference
  if (typeof window !== 'undefined') {
    // Some Monaco setups store references globally
    const global = window as any
    
    if (global.monacoEditor && typeof global.monacoEditor.getPosition === 'function') {
      return global.monacoEditor
    }
    
    if (global.__activeMonacoEditor && typeof global.__activeMonacoEditor.getPosition === 'function') {
      return global.__activeMonacoEditor
    }
  }
  
  return null
}

// ============================================================================
// CODE INSERTION SERVICE
// ============================================================================

export class MonacoCodeInsertion {
  /**
   * Register a Monaco editor with the global registry
   */
  static registerEditor(id: string, editor: monaco.editor.IStandaloneCodeEditor): () => void {
    return monacoRegistry.register(id, editor)
  }

  /**
   * Insert a class instantiation snippet into the active Monaco editor
   */
  static async insertClassSnippet(result: SearchResult): Promise<boolean> {

    
    try {
      // Generate the snippet first
      const snippet = generateClassSnippet(result)
  
      
      // Find active Monaco editor using multiple strategies
      let editor = monacoRegistry.getActiveEditor()
  
      
      if (!editor) {
        editor = findActiveMonacoEditor()
    
      }
      
      if (!editor) {
        editor = findMonacoEditorGlobal()
    
      }
      
      if (!editor) {
        console.warn('⚠️ [MonacoCodeInsertion] No active Monaco editor found using any method')
        return false
      }
      
  
      
      // Get current cursor position
      const position = editor.getPosition()
      if (!position) {
        console.warn('⚠️ [MonacoCodeInsertion] Could not get cursor position')
        return false
      }
      
  
      
      // Insert the code at cursor position
      const model = editor.getModel()
      if (!model) {
        console.warn('⚠️ [MonacoCodeInsertion] Could not get editor model')
        return false
      }
      
      // Check if we're on a new line or need to add one
      const currentLine = model.getLineContent(position.lineNumber)
      const textBeforeCursor = currentLine.substring(0, position.column - 1)
      const needsNewLine = textBeforeCursor.trim().length > 0
      
      // Prepare the text to insert
      const textToInsert = needsNewLine ? `\n${snippet}` : snippet
      
      // Create VSCode-style snippet with selectable variable name
      // Convert "varName = className()" to "${1:varName} = className()"
      const snippetText = textToInsert.replace(/^(\n?)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/, '$1${1:$2} =')
      
  
      
      // Method 1: Try Monaco's snippet controller first
      try {
        editor.trigger('universal-search', 'editor.action.insertSnippet', {
          snippet: snippetText
        })
    
      } catch (snippetError) {
        console.warn('⚠️ [MonacoCodeInsertion] Monaco snippet insertion failed:', snippetError)
      }
      
      // Method 2: Fallback to direct text insertion with selection
      try {
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }
        
        // Insert the plain text (without snippet syntax for fallback)
        const plainText = textToInsert.replace(/\$\{\d+:([^}]+)\}/g, '$1') // Convert ${1:test} back to test
        
        const operation = {
          range: range,
          text: plainText,
          forceMoveMarkers: true
        }
        
        editor.executeEdits('universal-search-insertion', [operation])
    
        
        // Try to select the variable name for editing (if it's at the start of the line)
        if (!needsNewLine) {
          const varNameMatch = plainText.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/)
          if (varNameMatch) {
            const varName = varNameMatch[1]
            const startColumn = position.column
            const endColumn = position.column + varName.length
            
            editor.setSelection({
              startLineNumber: position.lineNumber,
              startColumn: startColumn,
              endLineNumber: position.lineNumber,
              endColumn: endColumn
            })
        
          }
        }
      } catch (editError) {
        console.error('❌ [MonacoCodeInsertion] Direct insertion also failed:', editError)
        return false
      }
      
      // Focus the editor
      editor.focus()
      
  
      return true
      
    } catch (error) {
      console.error('❌ [MonacoCodeInsertion] Error inserting snippet:', error)
      return false
    }
  }
  
  /**
   * Insert generic code snippet (for future expansion)
   */
  static async insertGenericSnippet(code: string): Promise<boolean> {
    // Try registry first, then fallback methods
    let editor = monacoRegistry.getActiveEditor()
    if (!editor) {
      editor = findActiveMonacoEditor()
    }
    if (!editor) {
      editor = findMonacoEditorGlobal()
    }
    
    if (!editor) {
      console.warn('⚠️ [MonacoCodeInsertion] No active Monaco editor found')
      return false
    }
    
    try {
      const position = editor.getPosition()
      if (!position) return false
      
      const operation: monaco.editor.IIdentifiedSingleEditOperation = {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: code,
        forceMoveMarkers: true
      }
      
      editor.executeEdits('universal-search-generic-insertion', [operation])
      editor.focus()
      
      return true
    } catch (error) {
      console.error('❌ [MonacoCodeInsertion] Error inserting generic snippet:', error)
      return false
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  generateClassSnippet, 
  toCamelCase,
  extractClassNameFromSource,
  findActiveMonacoEditor,
  findMonacoEditorGlobal,
  monacoRegistry
}