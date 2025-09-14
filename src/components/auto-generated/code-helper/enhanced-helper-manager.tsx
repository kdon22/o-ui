// Enhanced Helper Block Manager - Complete Integration
import type * as monaco from 'monaco-editor'
import { AtomicDeletionManager } from './atomic-deletion-manager'
import { ReadOnlyDecorator } from './read-only-decorator'
import { BlockBoundaryDetector, type HelperBlockBoundaries } from './block-boundary-detector'

interface EnhancedHelperManagerOptions {
  // Deletion options
  enableAtomicDeletion?: boolean
  enableUndoSupport?: boolean
  
  // Read-only options
  enableReadOnlyMode?: boolean
  defaultReadOnly?: boolean
  
  // Edit options
  enableEditMode?: boolean
  editModeKey?: monaco.KeyCode // Default F2
  exitEditKey?: monaco.KeyCode // Default ESC
  
  // Click-to-edit options
  enableClickToEdit?: boolean
}

export interface HelperBlockInfo {
  id: string
  schemaId: string
  boundaries: HelperBlockBoundaries
  isReadOnly: boolean
  isEditMode: boolean
  content: string
}

export class EnhancedHelperManager {
  private editor: monaco.editor.IStandaloneCodeEditor
  private boundaryDetector!: BlockBoundaryDetector
  private deletionManager?: AtomicDeletionManager
  private readOnlyDecorator?: ReadOnlyDecorator
  private options: Required<EnhancedHelperManagerOptions>
  
  // Event callbacks
  onHelperBlockDeleted?: (info: { id: string; schemaId: string }) => void
  onHelperBlockContentChanged?: (info: { id: string; content: string }) => void
  onEditModeChanged?: (info: { id: string; isEditMode: boolean }) => void
  onHelperBlockClicked?: (info: { id: string; schemaId: string; content: string; initialData?: Record<string, any> }) => void
  onError?: (error: string) => void
  
  constructor(
    editor: monaco.editor.IStandaloneCodeEditor, 
    options: EnhancedHelperManagerOptions = {}
  ) {
    this.editor = editor
    
    // Set default options
    this.options = {
      enableAtomicDeletion: true,
      enableUndoSupport: true,
      enableReadOnlyMode: true,
      defaultReadOnly: true,
      enableEditMode: true,
      editModeKey: monaco.KeyCode.F2,
      exitEditKey: monaco.KeyCode.Escape,
      enableClickToEdit: true,
      ...options
    }
    
    this.initializeManagers()
    this.setupIntegration()
  }
  
  // Initialize all managers
  private initializeManagers() {
    this.boundaryDetector = new BlockBoundaryDetector(this.editor)
    
    if (this.options.enableAtomicDeletion) {
      this.deletionManager = new AtomicDeletionManager(this.editor)
    }
    
    if (this.options.enableReadOnlyMode) {
      this.readOnlyDecorator = new ReadOnlyDecorator(this.editor)
    }
  }
  
  // Setup integration between managers
  private setupIntegration() {
    // Connect deletion manager callbacks
    if (this.deletionManager) {
      this.deletionManager.onHelperBlockDeleted = (blockId, schemaId) => {
        // Clean up read-only decorations
        if (this.readOnlyDecorator) {
          // The read-only decorator will clean up automatically when scanning
          this.readOnlyDecorator.scanForHelperBlocks()
        }
        
        // Notify external listeners
        this.onHelperBlockDeleted?.({ id: blockId, schemaId })
      }
      
      this.deletionManager.onDeletionError = (error) => {
        this.onError?.(error)
      }
    }
    
    // Connect read-only decorator callbacks
    if (this.readOnlyDecorator) {
      this.readOnlyDecorator.onEditModeToggled = (blockId, isEditMode) => {
        this.onEditModeChanged?.({ id: blockId, isEditMode })
      }
      
      this.readOnlyDecorator.onBlockContentChanged = (blockId, newContent) => {
        this.onHelperBlockContentChanged?.({ id: blockId, content: newContent })
      }
    }
    
    // Setup content monitoring for integration
    this.editor.onDidChangeModelContent(() => {
      this.syncManagers()
    })
    
    // Setup click-to-edit functionality
    if (this.options.enableClickToEdit) {
      this.setupClickToEdit()
    }
  }
  
  // Sync all managers when content changes
  private syncManagers() {
    if (this.readOnlyDecorator) {
      this.readOnlyDecorator.scanForHelperBlocks()
    }
  }
  
  // Setup click-to-edit functionality
  private setupClickToEdit() {
    this.editor.onMouseDown((e) => {
      if (!e.target || !this.options.enableClickToEdit) return
      
      const position = e.target.position
      if (!position) return
      
      // Check if click is inside a helper block
      const block = this.boundaryDetector.findHelperBlockBoundaries(position)
      if (!block) return
      
      // Only handle clicks if the block is read-only (not in edit mode)
      const readOnlyInfo = this.readOnlyDecorator?.getHelperBlockAtPosition(position)
      if (!readOnlyInfo?.state.isReadOnly || readOnlyInfo?.state.isEditMode) return
      
      // Get block content and attempt to parse it
      const content = this.getHelperBlockContent(block)
      console.log(`📄 Extracted block content for ${block.blockId}:`, content)
      
      let initialData: Record<string, any> | undefined
      
      // If it's a utility call, try to parse it for editing
      if (block.schemaId === 'call-utility-helper') {
        initialData = this.parseUtilityCall(content)
      }
      
      // Notify the parent component
      this.onHelperBlockClicked?.({
        id: block.blockId,
        schemaId: block.schemaId,
        content,
        initialData
      })
    })
  }
  
  // Parse utility call content for editing
  private parseUtilityCall(content: string): Record<string, any> | undefined {
    console.log('🔍 Parsing utility call content:', content)
    
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => 
        line && !line.startsWith('#') && !line.startsWith('//')
      )
      
      console.log('📝 Filtered lines:', lines)
      
      if (lines.length === 0) return undefined
      
      const utilityCallRegex = /^(?:(\w+)\s*=\s*)?call\s+utility\s+"([^"]+)"(?:\s+with:)?/i
      let utilityName = ''
      let returnVariable = ''
      let parameters: Record<string, any> = {}
      
      // Find the main utility call line
      for (const line of lines) {
        const match = line.match(utilityCallRegex)
        if (match) {
          returnVariable = match[1] || ''
          utilityName = match[2] || ''
          break
        }
      }
      
      if (!utilityName) return undefined
      
      // Extract parameters
      for (const line of lines) {
        const paramMatch = line.match(/^\s*(\w+)\s*=\s*(.+)$/)
        if (paramMatch && !paramMatch[0].includes('call utility')) {
          const paramName = paramMatch[1]
          const paramValue = paramMatch[2]
          
          // Remove quotes and parse value
          if ((paramValue.startsWith('"') && paramValue.endsWith('"')) || 
              (paramValue.startsWith("'") && paramValue.endsWith("'"))) {
            parameters[paramName] = paramValue.slice(1, -1)
          } else {
            parameters[paramName] = paramValue
          }
        }
      }
      
      const result = {
        utilityName,
        ...parameters,
        insertReturn: !!returnVariable,
        returnVariableName: returnVariable,
        wrapInTryCatch: content.includes('try') && content.includes('catch')
      }
      
      console.log('✅ Parsed utility call result:', result)
      return result
      
    } catch (error) {
      console.error('❌ Failed to parse utility call:', error)
      return undefined
    }
  }
  
  // Public API Methods
  
  // Get all current helper blocks with their states
  public getAllHelperBlocks(): HelperBlockInfo[] {
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    const result: HelperBlockInfo[] = []
    
    for (const block of blocks) {
      const readOnlyInfo = this.readOnlyDecorator?.getHelperBlockAtPosition(
        new monaco.Position(block.startLine, 1)
      )
      
      result.push({
        id: block.blockId,
        schemaId: block.schemaId,
        boundaries: block,
        isReadOnly: readOnlyInfo?.state.isReadOnly ?? this.options.defaultReadOnly,
        isEditMode: readOnlyInfo?.state.isEditMode ?? false,
        content: this.getHelperBlockContent(block)
      })
    }
    
    return result
  }
  
  // Get helper block at cursor position
  public getHelperBlockAtCursor(): HelperBlockInfo | null {
    const position = this.editor.getPosition()
    if (!position) return null
    
    const block = this.boundaryDetector.findHelperBlockBoundaries(position)
    if (!block) return null
    
    const readOnlyInfo = this.readOnlyDecorator?.getHelperBlockAtPosition(position)
    
    return {
      id: block.blockId,
      schemaId: block.schemaId,
      boundaries: block,
      isReadOnly: readOnlyInfo?.state.isReadOnly ?? this.options.defaultReadOnly,
      isEditMode: readOnlyInfo?.state.isEditMode ?? false,
      content: this.getHelperBlockContent(block)
    }
  }
  
  // Toggle edit mode for a helper block
  public toggleEditMode(blockId: string) {
    if (!this.readOnlyDecorator || !this.options.enableEditMode) return
    
    this.readOnlyDecorator.toggleEditMode(blockId)
  }
  
  // Set edit mode for a helper block
  public setEditMode(blockId: string, isEditMode: boolean) {
    if (!this.readOnlyDecorator || !this.options.enableEditMode) return
    
    this.readOnlyDecorator.setEditMode(blockId, isEditMode)
  }
  
  // Set read-only state for a helper block
  public setReadOnly(blockId: string, isReadOnly: boolean) {
    if (!this.readOnlyDecorator || !this.options.enableReadOnlyMode) return
    
    this.readOnlyDecorator.setReadOnly(blockId, isReadOnly)
  }
  
  // Delete a helper block (with atomic deletion and undo support)
  public deleteHelperBlock(blockId: string) {
    if (!this.deletionManager || !this.options.enableAtomicDeletion) return
    
    this.deletionManager.deleteHelperBlock(blockId)
  }
  
  // Check if cursor is in a read-only area
  public isCursorInReadOnlyArea(): boolean {
    const position = this.editor.getPosition()
    if (!position) return false
    
    return this.readOnlyDecorator?.isPositionReadOnly(position) ?? false
  }
  
  // Insert a new helper block at cursor position
  public insertHelperBlock(code: string, schemaId: string): string {
    const position = this.editor.getPosition()
    if (!position) throw new Error('No cursor position')
    
    // Generate unique block ID
    const blockId = `helper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Format the helper block
    const helperCode = this.formatHelperBlock(code, blockId, schemaId)
    
    // Insert at cursor position
    this.editor.executeEdits('insert-helper-block', [{
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text: helperCode,
      forceMoveMarkers: true
    }])
    
    // Trigger sync to update managers
    setTimeout(() => this.syncManagers(), 0)
    
    return blockId
  }
  
  // Format helper block with markers
  private formatHelperBlock(code: string, blockId: string, schemaId: string): string {
    const lines = [
      `# HELPER_START:${blockId}:${schemaId}`,
      ...code.split('\n'),
      `# HELPER_END:${blockId}:${schemaId}`,
      '' // Add empty line after
    ]
    return lines.join('\n')
  }
  
  // Get helper block content (excluding markers)
  private getHelperBlockContent(block: HelperBlockBoundaries): string {
    const model = this.editor.getModel()
    if (!model) return ''
    
    const lines: string[] = []
    for (let line = block.startLine + 1; line <= block.endLine - 1; line++) {
      lines.push(model.getLineContent(line))
    }
    return lines.join('\n')
  }
  
  // Update helper block content
  public updateHelperBlockContent(blockId: string, newContent: string): boolean {
    const blocks = this.boundaryDetector.getAllHelperBlocks()
    const block = blocks.find(b => b.blockId === blockId)
    
    if (!block) {
      this.onError?.(`Helper block not found: ${blockId}`)
      return false
    }
    
    // Check if block is in edit mode
    const readOnlyInfo = this.readOnlyDecorator?.getHelperBlockAtPosition(
      new monaco.Position(block.startLine, 1)
    )
    
    if (readOnlyInfo?.state.isReadOnly && !readOnlyInfo?.state.isEditMode) {
      this.onError?.(`Cannot update read-only helper block: ${blockId}`)
      return false
    }
    
    try {
      // Replace content (excluding markers)
      this.editor.executeEdits(`update-helper-content-${blockId}`, [{
        range: block.contentRange,
        text: newContent,
        forceMoveMarkers: true
      }])
      
      return true
    } catch (error) {
      this.onError?.(`Failed to update helper block content: ${error}`)
      return false
    }
  }
  
  // Get deletion history (if undo support is enabled)
  public getDeletionHistory(): Array<{id: string, timestamp: number, blockCount: number}> {
    if (!this.deletionManager || !this.options.enableUndoSupport) return []
    
    return this.deletionManager.getAvailableBackups()
  }
  
  // Restore deleted helper block
  public restoreDeletedBlock(backupId: string): boolean {
    if (!this.deletionManager || !this.options.enableUndoSupport) return false
    
    const success = this.deletionManager.restoreDeletedBlock(backupId)
    
    if (success) {
      // Sync managers after restoration
      setTimeout(() => this.syncManagers(), 0)
    }
    
    return success
  }
  
  // Get statistics about helper blocks
  public getStatistics() {
    const blocks = this.getAllHelperBlocks()
    
    return {
      total: blocks.length,
      readOnly: blocks.filter(b => b.isReadOnly).length,
      inEditMode: blocks.filter(b => b.isEditMode).length,
      schemas: new Set(blocks.map(b => b.schemaId)).size
    }
  }
  
  // Cleanup and dispose
  public dispose() {
    if (this.readOnlyDecorator) {
      this.readOnlyDecorator.dispose()
    }
    
    // Other managers clean up automatically via Monaco editor disposal
  }
} 