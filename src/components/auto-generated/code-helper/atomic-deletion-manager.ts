// Atomic Deletion Manager with Undo/Redo Support
import type * as monaco from 'monaco-editor'
import { BlockBoundaryDetector, type HelperBlockBoundaries } from './block-boundary-detector'

interface DeletionBackup {
  id: string
  timestamp: number
  blocks: Array<{
    boundaries: HelperBlockBoundaries
    content: string
  }>
}

export class AtomicDeletionManager {
  private editor: monaco.editor.IStandaloneCodeEditor
  private boundaryDetector: BlockBoundaryDetector
  private isDeleting = false
  private deletionHistory: DeletionBackup[] = []
  
  // Callbacks
  onHelperBlockDeleted?: (blockId: string, schemaId: string) => void
  onDeletionError?: (error: string) => void
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.boundaryDetector = new BlockBoundaryDetector(editor)
    this.setupDeletionDetection()
  }
  
  // Setup deletion detection with undo-friendly operations
  private setupDeletionDetection() {
    // Handle content changes for deletion detection
    this.editor.onDidChangeModelContent((e) => {
      if (this.isDeleting) return // Prevent recursion
      
      this.handleContentChanges(e.changes)
    })
    
    // Handle key events for immediate deletion with undo support
    this.editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Delete || e.keyCode === monaco.KeyCode.Backspace) {
        this.handleDeleteKey(e)
      }
    })
  }
  
  // Handle delete key press with undo support
  private handleDeleteKey(e: monaco.IKeyboardEvent) {
    const selections = this.editor.getSelections()
    if (!selections) return
    
    for (const selection of selections) {
      // Check if selection affects any helper block
      const affectedBlocks = this.boundaryDetector.findBlocksAffectedByRange(selection)
      
      if (affectedBlocks.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        
        // Perform atomic deletion of all affected blocks with undo support
        this.performUndoFriendlyDeletion(affectedBlocks, 'user-key-delete')
        return
      }
    }
  }
  
  // Handle content changes for deletion detection
  private handleContentChanges(changes: monaco.editor.IModelContentChange[]) {
    const deletedBlocks = new Set<string>()
    
    for (const change of changes) {
      if (change.text !== '') continue // Only care about deletions
      
             // Check if this change affects helper markers
      if (this.isDeletionAffectingHelperMarkers(change)) {
        const changeRange = new monaco.Range(
          change.range.startLineNumber,
          change.range.startColumn,
          change.range.endLineNumber,
          change.range.endColumn
        )
        const affectedBlocks = this.boundaryDetector.findBlocksAffectedByRange(changeRange)
        
        for (const block of affectedBlocks) {
          if (!deletedBlocks.has(block.blockId)) {
            deletedBlocks.add(block.blockId)
            this.performUndoFriendlyDeletion([block], 'content-change-auto')
          }
        }
      }
    }
  }
  
  // Check if deletion affects helper markers
  private isDeletionAffectingHelperMarkers(change: monaco.editor.IModelContentChange): boolean {
    const model = this.editor.getModel()
    if (!model) return false
    
    // Check lines in the deletion range for helper markers
    for (let line = change.range.startLineNumber; line <= change.range.endLineNumber; line++) {
      if (line <= model.getLineCount()) {
        const content = model.getLineContent(line)
        if (content.includes('HELPER_START:') || content.includes('HELPER_END:')) {
          return true
        }
      }
    }
    
    return false
  }
  
  // Perform undo-friendly deletion with backup
  private performUndoFriendlyDeletion(blocks: HelperBlockBoundaries[], source: string) {
    if (blocks.length === 0) return
    
    // Validate blocks before deletion
    const validBlocks = this.validateBlocksForDeletion(blocks)
    if (validBlocks.length === 0) {
      this.onDeletionError?.('No valid blocks to delete')
      return
    }
    
    // Create backup for undo functionality
    const backup = this.createDeletionBackup(validBlocks, source)
    
    this.isDeleting = true
    
    try {
      // Sort blocks by line number (delete from bottom to top to maintain line numbers)
      const sortedBlocks = validBlocks.sort((a, b) => b.startLine - a.startLine)
      
      // Perform deletion as single undo-able operation
      const edits: monaco.editor.IIdentifiedSingleEditOperation[] = sortedBlocks.map(block => ({
        range: block.range,
        text: '',
        forceMoveMarkers: true
      }))
      
      // Execute all deletions as a single undo-able operation
      this.editor.executeEdits(`atomic-helper-deletion-${backup.id}`, edits)
      
      // Notify about deletions
      for (const block of sortedBlocks) {
        this.onHelperBlockDeleted?.(block.blockId, block.schemaId)
      }
      
      // Store backup for potential manual recovery
      this.deletionHistory.push(backup)
      this.cleanupOldBackups()
      
    } catch (error) {
      this.onDeletionError?.(`Failed to delete helper blocks: ${error}`)
    } finally {
      this.isDeleting = false
    }
  }
  
  // Create deletion backup for undo support
  private createDeletionBackup(blocks: HelperBlockBoundaries[], source: string): DeletionBackup {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const backup: DeletionBackup = {
      id: backupId,
      timestamp: Date.now(),
      blocks: blocks.map(block => ({
        boundaries: { ...block },
        content: this.getBlockContent(block)
      }))
    }
    
    // Store in session storage for recovery across page reloads
    sessionStorage.setItem(`deletion-backup-${backupId}`, JSON.stringify({
      ...backup,
      source,
      editorModelUri: this.editor.getModel()?.uri.toString()
    }))
    
    return backup
  }
  
  // Get content of a helper block
  private getBlockContent(block: HelperBlockBoundaries): string {
    const model = this.editor.getModel()
    if (!model) return ''
    
    const lines: string[] = []
    for (let line = block.startLine; line <= block.endLine; line++) {
      lines.push(model.getLineContent(line))
    }
    return lines.join('\n')
  }
  
  // Validate blocks for deletion
  private validateBlocksForDeletion(blocks: HelperBlockBoundaries[]): HelperBlockBoundaries[] {
    const model = this.editor.getModel()
    if (!model) return []
    
    return blocks.filter(block => {
      // Validate block is still present and intact
      if (block.startLine > model.getLineCount() || block.endLine > model.getLineCount()) {
        return false
      }
      
      const startContent = model.getLineContent(block.startLine)
      const endContent = model.getLineContent(block.endLine)
      
      return startContent.includes(`HELPER_START:${block.blockId}`) &&
             endContent.includes(`HELPER_END:${block.blockId}`)
    })
  }
  
  // Clean up old backups (keep last 10)
  private cleanupOldBackups() {
    if (this.deletionHistory.length > 10) {
      const toRemove = this.deletionHistory.splice(0, this.deletionHistory.length - 10)
      toRemove.forEach(backup => {
        sessionStorage.removeItem(`deletion-backup-${backup.id}`)
      })
    }
  }
  
  // Public method to manually delete a helper block (with undo)
  public deleteHelperBlock(blockId: string) {
    const allBlocks = this.boundaryDetector.getAllHelperBlocks()
    const targetBlock = allBlocks.find(block => block.blockId === blockId)
    
    if (targetBlock) {
      this.performUndoFriendlyDeletion([targetBlock], 'manual-api')
    } else {
      this.onDeletionError?.(`Helper block not found: ${blockId}`)
    }
  }
  
  // Public method to restore a deleted block (for manual recovery)
  public restoreDeletedBlock(backupId: string): boolean {
    const backupData = sessionStorage.getItem(`deletion-backup-${backupId}`)
    if (!backupData) {
      this.onDeletionError?.(`Backup not found: ${backupId}`)
      return false
    }
    
    try {
      const backup = JSON.parse(backupData)
      
      // Find a good insertion point (end of document)
      const model = this.editor.getModel()
      if (!model) return false
      
      const lastLine = model.getLineCount()
      const insertPosition = new monaco.Position(lastLine + 1, 1)
      
      // Restore all blocks from backup
      const edits: monaco.editor.IIdentifiedSingleEditOperation[] = backup.blocks.map((block: any, index: number) => ({
        range: new monaco.Range(insertPosition.lineNumber + index, 1, insertPosition.lineNumber + index, 1),
        text: (index > 0 ? '\n' : '') + block.content + '\n',
        forceMoveMarkers: true
      }))
      
      this.editor.executeEdits(`restore-helper-blocks-${backupId}`, edits)
      
      // Remove from session storage after restoration
      sessionStorage.removeItem(`deletion-backup-${backupId}`)
      this.deletionHistory = this.deletionHistory.filter(b => b.id !== backupId)
      
      return true
    } catch (error) {
      this.onDeletionError?.(`Failed to restore backup: ${error}`)
      return false
    }
  }
  
  // Get available backups for manual recovery
  public getAvailableBackups(): Array<{id: string, timestamp: number, blockCount: number}> {
    return this.deletionHistory.map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      blockCount: backup.blocks.length
    }))
  }
  
  // Check if position is in helper block (for read-only protection)
  public isPositionInHelperBlock(position: monaco.Position): boolean {
    return this.boundaryDetector.isInsideHelperBlock(position)
  }
  
  // Get all current helper blocks
  public getAllHelperBlocks(): HelperBlockBoundaries[] {
    return this.boundaryDetector.getAllHelperBlocks()
  }
} 