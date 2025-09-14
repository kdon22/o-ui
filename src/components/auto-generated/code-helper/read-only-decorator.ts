// Read-Only Decoration Manager for Helper Blocks
import type * as monaco from 'monaco-editor'
import { BlockBoundaryDetector, type HelperBlockBoundaries } from './block-boundary-detector'

interface HelperBlockState {
  id: string
  schemaId: string
  isReadOnly: boolean
  isEditMode: boolean
  decorations: string[]
}

export class ReadOnlyDecorator {
  private editor: monaco.editor.IStandaloneCodeEditor
  private boundaryDetector: BlockBoundaryDetector
  private helperBlockStates: Map<string, HelperBlockState> = new Map()
  
  // Callbacks
  onEditModeToggled?: (blockId: string, isEditMode: boolean) => void
  onBlockContentChanged?: (blockId: string, newContent: string) => void
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.boundaryDetector = new BlockBoundaryDetector(editor)
    this.setupReadOnlyBehavior()
  }
  
  // Setup read-only behavior and edit detection
  private setupReadOnlyBehavior() {
    // Prevent editing in read-only helper blocks
    this.editor.onDidChangeModelContent((e) => {
      this.handleContentChange(e)
    })
    
    // Handle cursor position changes for UI updates
    this.editor.onDidChangeCursorPosition((e) => {
      this.handleCursorChange(e)
    })
    
    // Setup key bindings for edit mode toggle
    this.setupKeyBindings()
    
    // Initial scan for helper blocks
    this.scanForHelperBlocks()
  }
  
  // Setup key bindings for helper block interactions
  private setupKeyBindings() {
    // F2 to toggle edit mode for current helper block
    this.editor.addCommand(monaco.KeyCode.F2, () => {
      const position = this.editor.getPosition()
      if (position) {
        const block = this.boundaryDetector.findHelperBlockBoundaries(position)
        if (block) {
          this.toggleEditMode(block.blockId)
        }
      }
    })
    
    // Escape to exit edit mode
    this.editor.addCommand(monaco.KeyCode.Escape, () => {
      const position = this.editor.getPosition()
      if (position) {
        const block = this.boundaryDetector.findHelperBlockBoundaries(position)
        if (block) {
          const state = this.helperBlockStates.get(block.blockId)
          if (state && state.isEditMode) {
            this.setEditMode(block.blockId, false)
          }
        }
      }
    })
  }
  
  // Scan for all helper blocks and set up decorations
  public scanForHelperBlocks() {
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    
    // Remove states for blocks that no longer exist
    const currentBlockIds = new Set(blocks.map(b => b.blockId))
    for (const [blockId] of this.helperBlockStates) {
      if (!currentBlockIds.has(blockId)) {
        this.removeHelperBlockState(blockId)
      }
    }
    
    // Add/update states for current blocks
    for (const block of blocks) {
      if (!this.helperBlockStates.has(block.blockId)) {
        this.addHelperBlock(block)
      } else {
        this.updateHelperBlockDecorations(block)
      }
    }
  }
  
  // Add new helper block with read-only decorations
  private addHelperBlock(block: HelperBlockBoundaries) {
    const state: HelperBlockState = {
      id: block.blockId,
      schemaId: block.schemaId,
      isReadOnly: true,
      isEditMode: false,
      decorations: []
    }
    
    this.helperBlockStates.set(block.blockId, state)
    this.updateHelperBlockDecorations(block)
  }
  
  // Update decorations for a helper block
  private updateHelperBlockDecorations(block: HelperBlockBoundaries) {
    const state = this.helperBlockStates.get(block.blockId)
    if (!state) return
    
    // Remove existing decorations
    if (state.decorations.length > 0) {
      this.editor.deltaDecorations(state.decorations, [])
    }
    
    // Create new decorations based on state
    const decorations: monaco.editor.IModelDeltaDecoration[] = []
    
    if (state.isReadOnly && !state.isEditMode) {
      // Read-only styling
      decorations.push({
        range: block.range,
        options: {
          className: 'helper-block-readonly',
          glyphMarginClassName: 'helper-block-glyph-readonly',
          hoverMessage: { value: '🔒 Helper Block (F2 to edit)' },
          minimap: {
            color: '#4a90e2',
            position: monaco.editor.MinimapPosition.Inline
          }
        }
      })
      
      // Content area styling (excluding markers)
      decorations.push({
        range: block.contentRange,
        options: {
          className: 'helper-block-content-readonly',
          inlineClassName: 'helper-block-inline-readonly'
        }
      })
    } else if (state.isEditMode) {
      // Edit mode styling
      decorations.push({
        range: block.range,
        options: {
          className: 'helper-block-editing',
          glyphMarginClassName: 'helper-block-glyph-editing',
          hoverMessage: { value: '✏️ Editing Helper Block (ESC to finish)' },
          minimap: {
            color: '#f39c12',
            position: monaco.editor.MinimapPosition.Inline
          }
        }
      })
      
      // Editable content area
      decorations.push({
        range: block.contentRange,
        options: {
          className: 'helper-block-content-editing',
          inlineClassName: 'helper-block-inline-editing'
        }
      })
    }
    
    // Apply decorations
    state.decorations = this.editor.deltaDecorations([], decorations)
  }
  
  // Remove helper block state and decorations
  private removeHelperBlockState(blockId: string) {
    const state = this.helperBlockStates.get(blockId)
    if (!state) return
    
    // Remove decorations
    if (state.decorations.length > 0) {
      this.editor.deltaDecorations(state.decorations, [])
    }
    
    // Remove state
    this.helperBlockStates.delete(blockId)
  }
  
  // Handle content changes to prevent editing in read-only blocks
  private handleContentChange(e: monaco.editor.IModelContentChangedEvent) {
    for (const change of e.changes) {
      // Skip if no actual content change
      if (change.text === '' && change.rangeLength === 0) continue
      
      const changeRange = new monaco.Range(
        change.range.startLineNumber,
        change.range.startColumn,
        change.range.endLineNumber,
        change.range.endColumn
      )
      
      // Find affected helper blocks
      const affectedBlocks = this.boundaryDetector.findBlocksAffectedByRange(changeRange)
      
      for (const block of affectedBlocks) {
        const state = this.helperBlockStates.get(block.blockId)
        if (!state) continue
        
        // If block is read-only and not in edit mode, revert the change
        if (state.isReadOnly && !state.isEditMode) {
          // Check if change affects content area (not markers)
          if (changeRange.intersectRanges(block.contentRange)) {
            this.revertChangeInBlock(change, block)
          }
        } else if (state.isEditMode) {
          // In edit mode, track content changes
          this.onBlockContentChanged?.(block.blockId, this.getBlockContentOnly(block))
        }
      }
    }
  }
  
  // Revert unauthorized changes in read-only blocks
  private revertChangeInBlock(change: monaco.editor.IModelContentChange, block: HelperBlockBoundaries) {
    // This is tricky because the change already happened
    // We need to schedule a revert on the next tick
    setTimeout(() => {
      try {
        // Get the current content and try to restore original
        // This is a simplified approach - in production you might want to maintain snapshots
        console.warn(`Attempted to edit read-only helper block ${block.blockId}. Use F2 to enter edit mode.`)
        
        // You could implement more sophisticated undo here
        // For now, we'll rely on the user using Cmd+Z
      } catch (error) {
        console.error('Error reverting change in read-only block:', error)
      }
    }, 0)
  }
  
  // Get only the content of a helper block (excluding markers)
  private getBlockContentOnly(block: HelperBlockBoundaries): string {
    const model = this.editor.getModel()
    if (!model) return ''
    
    const lines: string[] = []
    for (let line = block.startLine + 1; line <= block.endLine - 1; line++) {
      lines.push(model.getLineContent(line))
    }
    return lines.join('\n')
  }
  
  // Handle cursor position changes for UI updates
  private handleCursorChange(e: monaco.editor.ICursorPositionChangedEvent) {
    const block = this.boundaryDetector.findHelperBlockBoundaries(e.position)
    
    // Update UI to show current helper block status
    if (block) {
      const state = this.helperBlockStates.get(block.blockId)
      if (state) {
        // Could emit events for UI updates here
        // e.g., show edit button in toolbar
      }
    }
  }
  
  // Toggle edit mode for a helper block
  public toggleEditMode(blockId: string) {
    const state = this.helperBlockStates.get(blockId)
    if (!state) return
    
    this.setEditMode(blockId, !state.isEditMode)
  }
  
  // Set edit mode for a helper block
  public setEditMode(blockId: string, isEditMode: boolean) {
    const state = this.helperBlockStates.get(blockId)
    if (!state || state.isEditMode === isEditMode) return
    
    state.isEditMode = isEditMode
    
    // Update decorations
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    const block = blocks.find(b => b.blockId === blockId)
    if (block) {
      this.updateHelperBlockDecorations(block)
    }
    
    // Notify callback
    this.onEditModeToggled?.(blockId, isEditMode)
    
    // If entering edit mode, focus on the content area
    if (isEditMode && block) {
      const contentStartPosition = new monaco.Position(block.startLine + 1, 1)
      this.editor.setPosition(contentStartPosition)
      this.editor.focus()
    }
  }
  
  // Set read-only state for a helper block
  public setReadOnly(blockId: string, isReadOnly: boolean) {
    const state = this.helperBlockStates.get(blockId)
    if (!state) return
    
    state.isReadOnly = isReadOnly
    
    // Update decorations
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    const block = blocks.find(b => b.blockId === blockId)
    if (block) {
      this.updateHelperBlockDecorations(block)
    }
  }
  
  // Check if a position is in a read-only area
  public isPositionReadOnly(position: monaco.Position): boolean {
    const block = this.boundaryDetector.findHelperBlockBoundaries(position)
    if (!block) return false
    
    const state = this.helperBlockStates.get(block.blockId)
    if (!state) return false
    
    return state.isReadOnly && !state.isEditMode
  }
  
  // Get current helper block at position
  public getHelperBlockAtPosition(position: monaco.Position): {block: HelperBlockBoundaries, state: HelperBlockState} | null {
    const block = this.boundaryDetector.findHelperBlockBoundaries(position)
    if (!block) return null
    
    const state = this.helperBlockStates.get(block.blockId)
    if (!state) return null
    
    return { block, state }
  }
  
  // Get all helper block states
  public getAllHelperBlockStates(): Array<{block: HelperBlockBoundaries, state: HelperBlockState}> {
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    const result: Array<{block: HelperBlockBoundaries, state: HelperBlockState}> = []
    
    for (const block of blocks) {
      const state = this.helperBlockStates.get(block.blockId)
      if (state) {
        result.push({ block, state })
      }
    }
    
    return result
  }
  
  // Cleanup all decorations
  public dispose() {
    for (const state of this.helperBlockStates.values()) {
      if (state.decorations.length > 0) {
        this.editor.deltaDecorations(state.decorations, [])
      }
    }
    this.helperBlockStates.clear()
  }
} 