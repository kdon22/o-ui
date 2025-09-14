// Monaco Helper System - Factory

import type * as monaco from 'monaco-editor'
import { getAllHelpers, getHelperConfig, getHelperByIntelliSenseTrigger, type HelperConfig } from './helper-registry'

export interface HelperState {
  activeHelper: string | null
  isModalOpen: boolean
  modalData: any
}

export interface HelperModalController {
  open: (helperId: string, data?: any) => void
  close: () => void
}

/**
 * Monaco Helper System Factory
 * Manages all helpers for a Monaco editor instance
 */
export class MonacoHelperFactory {
  private editor: monaco.editor.IStandaloneCodeEditor
  private monacoInstance: typeof monaco
  private modalController: HelperModalController | null = null
  private state: HelperState = {
    activeHelper: null,
    isModalOpen: false,
    modalData: null
  }

  constructor(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) {
    this.editor = editor
    this.monacoInstance = monacoInstance
  }

  /**
   * Register modal controller (called by React component)
   */
  setModalController(controller: HelperModalController) {
    this.modalController = controller
  }

  /**
   * Register all helpers with Monaco
   * - Keyboard shortcuts
   * - IntelliSense completions
   */
  registerAllHelpers() {

    
    const helpers = getAllHelpers()
    
    for (const helper of helpers) {
      this.registerHelper(helper)
    }


  }

  /**
   * Register individual helper
   */
  private registerHelper(helper: HelperConfig) {


    // Register keyboard shortcuts
    for (const trigger of helper.triggers) {
      if (trigger.type === 'keybinding') {
        this.registerKeybinding(helper, trigger)
      }
    }

    // IntelliSense triggers are handled by the completion provider

  }

  /**
   * Register keyboard shortcut for helper
   */
  private registerKeybinding(helper: HelperConfig, trigger: any) {
    try {
      const keybinding = typeof trigger.value === 'function' 
        ? trigger.value(this.monacoInstance)
        : trigger.value

      const commandId = this.editor.addCommand(
        keybinding,
        () => {

          this.openHelper(helper.id)
        },
        ''
      )


    } catch (error) {
      console.error(`❌ [HelperFactory] Failed to register keybinding for ${helper.id}:`, error)
    }
  }

  /**
   * Open helper modal
   */
  openHelper(helperId: string, data?: any) {
    // Check for context-aware editing
    const currentContext = data?.existingCall ? data : this.parseCurrentContext()
    const isEditMode = currentContext.isOverExistingCode || data?.context === 'edit'

    console.log('🔧 [HelperFactory] Opening helper:', {
      helperId,
      editMode: isEditMode,
      existingCall: currentContext.utilityCall?.utilityName,
      context: data?.context || 'keyboard'
    })

    if (!this.modalController) {

      return
    }

    try {
      this.state.activeHelper = helperId
      this.state.modalData = {
        ...data,
        editMode: isEditMode,
        existingCall: currentContext.utilityCall,
        currentContext
      }
      this.state.isModalOpen = true
      
      this.modalController.open(helperId, this.state.modalData)

      console.log('✅ [HelperFactory] Helper opened successfully:', {
        helperId,
        mode: isEditMode ? 'edit' : 'create'
      })
    } catch (error) {

    }
  }

  /**
   * Close helper modal
   */
  closeHelper() {
    if (!this.state.isModalOpen) return



    if (this.modalController) {
      this.modalController.close()
    }

    this.state.activeHelper = null
    this.state.modalData = null
    this.state.isModalOpen = false


  }

  /**
   * Handle IntelliSense trigger
   * Called by completion provider when helper trigger is detected
   */
  handleIntelliSenseTrigger(trigger: string, position: monaco.Position) {


    const helper = getHelperByIntelliSenseTrigger(trigger)
    if (!helper) {

      return
    }

    // Parse context to check for existing code
    const context = this.parseCurrentContext(position)

    // Open helper with context
    this.openHelper(helper.id, {
      trigger,
      position,
      context: context.isOverExistingCode ? 'edit' : 'intellisense',
      existingCall: context.utilityCall
    })
  }

  /**
   * Parse current editor context for existing code
   */
  parseCurrentContext(position?: monaco.Position) {
    const { parseCodeContext } = require('./code-context-parser')
    return parseCodeContext(this.editor, position)
  }

  /**
   * Insert code at cursor position
   */
  insertCode(code: string) {
    const position = this.editor.getPosition()
    if (!position) return

    const model = this.editor.getModel()
    if (!model) return

    // Check if we need to replace trigger text (for IntelliSense triggers)
    const currentLine = model.getLineContent(position.lineNumber)
    const beforeCursor = currentLine.substring(0, position.column - 1)
    
    let insertPosition = position
    
    // Check if cursor is after a trigger (like "call:")
    const triggerMatch = beforeCursor.match(/(call:|utility:|snippet:|var:)$/)
    if (triggerMatch) {
      // Replace the trigger with the generated code
      const triggerStart = position.column - triggerMatch[0].length
      insertPosition = new this.monacoInstance.Position(position.lineNumber, triggerStart)
      
      const operation: monaco.editor.IIdentifiedSingleEditOperation = {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: triggerStart,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: code,
        forceMoveMarkers: true
      }

      this.editor.executeEdits('helper-factory', [operation])
    } else {
      // Insert at current position
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

      this.editor.executeEdits('helper-factory', [operation])
    }

    // Position cursor at end of inserted code
    const lines = code.split('\n')
    const newPosition = new this.monacoInstance.Position(
      insertPosition.lineNumber + lines.length - 1,
      lines.length === 1 
        ? insertPosition.column + code.length 
        : lines[lines.length - 1].length + 1
    )

    this.editor.setPosition(newPosition)
    this.editor.focus()

    console.log('✅ [HelperFactory] Code inserted successfully')
  }

  /**
   * Get current helper state
   */
  getState(): HelperState {
    return { ...this.state }
  }

  /**
   * Get helper context for debugging
   */
  getDebugInfo() {
    return {
      hasEditor: !!this.editor,
      editorId: this.editor.getId?.(),
      monacoAvailable: !!this.monacoInstance,
      modalControllerAvailable: !!this.modalController,
      currentState: this.state,
      registeredHelpers: getAllHelpers().map(h => ({
        id: h.id,
        name: h.name,
        triggers: h.triggers.map(t => ({ type: t.type, description: t.description }))
      }))
    }
  }
}

/**
 * Create Monaco Helper Factory instance
 */
export function createMonacoHelperFactory(
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoInstance: typeof monaco
): MonacoHelperFactory {
  console.log('🏭 [HelperFactory] Creating helper factory instance...')
  
  const factory = new MonacoHelperFactory(editor, monacoInstance)
  
  // Register all helpers immediately
  factory.registerAllHelpers()
  
  console.log('✅ [HelperFactory] Helper factory created and initialized')
  return factory
}