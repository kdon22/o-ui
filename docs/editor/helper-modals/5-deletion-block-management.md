# Deletion & Block Management - Atomic Operations

## 🎯 Overview

This guide covers **atomic deletion and block management** for helper blocks, ensuring that when users delete helpers, everything is cleaned up properly without orphaned code.

## 🗑️ **Atomic Deletion Concept**

### **Core Principle**
When a user deletes any part of a helper block (especially the marker lines), the **entire block must be deleted atomically**. This prevents:
- ❌ Orphaned code fragments
- ❌ Broken helper markers
- ❌ Incomplete deletions
- ❌ Editor inconsistency

### **Deletion Triggers**
```typescript
// User actions that should trigger atomic deletion:
// 1. Delete helper marker lines (HELPER_START: or HELPER_END:)
// 2. Select entire helper block and press Delete
// 3. Cut/paste operations affecting helper boundaries
// 4. Programmatic deletion via API
```

## 🔍 **Block Boundary Detection**

### **Helper Block Structure**
```python
# HELPER_START:helper-123:find-remark-helper
# Add Vendor Remark
amadeus_remark = f"RMT/TEST"
galileo_remark = f"RMT/TEST"

if not any(r.text == "TEST" for r in existing_remarks):
    add_remark_to_systems(["amadeus", "galileo"])
# HELPER_END:helper-123:find-remark-helper
```

### **Boundary Detection Implementation**
```typescript
// o-ui/src/components/editor/helpers/block-boundary-detector.ts
export class BlockBoundaryDetector {
  private editor: monaco.editor.IStandaloneCodeEditor
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
  }
  
  // Find complete helper block boundaries
  findHelperBlockBoundaries(position: monaco.Position): HelperBlockBoundaries | null {
    const model = this.editor.getModel()
    if (!model) return null
    
    let startLine: number | null = null
    let endLine: number | null = null
    let blockId: string | null = null
    let schemaId: string | null = null
    
    // Search backwards for HELPER_START
    for (let line = position.lineNumber; line >= 1; line--) {
      const content = model.getLineContent(line)
      const startMatch = content.match(/# HELPER_START:([^:]+):(.+)/)
      
      if (startMatch) {
        startLine = line
        blockId = startMatch[1]
        schemaId = startMatch[2]
        break
      }
    }
    
    // Search forwards for matching HELPER_END
    if (startLine && blockId && schemaId) {
      for (let line = position.lineNumber; line <= model.getLineCount(); line++) {
        const content = model.getLineContent(line)
        if (content.includes(`# HELPER_END:${blockId}:${schemaId}`)) {
          endLine = line
          break
        }
      }
    }
    
    if (startLine && endLine && blockId && schemaId) {
      return {
        startLine,
        endLine,
        blockId,
        schemaId,
        range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
        contentRange: new monaco.Range(startLine + 1, 1, endLine - 1, model.getLineMaxColumn(endLine - 1))
      }
    }
    
    return null
  }
  
  // Check if position is inside any helper block
  isInsideHelperBlock(position: monaco.Position): boolean {
    return this.findHelperBlockBoundaries(position) !== null
  }
  
  // Get all helper blocks in the editor
  getAllHelperBlocks(): HelperBlockBoundaries[] {
    const model = this.editor.getModel()
    if (!model) return []
    
    const blocks: HelperBlockBoundaries[] = []
    const totalLines = model.getLineCount()
    
    for (let line = 1; line <= totalLines; line++) {
      const content = model.getLineContent(line)
      const startMatch = content.match(/# HELPER_START:([^:]+):(.+)/)
      
      if (startMatch) {
        const blockId = startMatch[1]
        const schemaId = startMatch[2]
        
        // Find matching end
        for (let endLine = line + 1; endLine <= totalLines; endLine++) {
          const endContent = model.getLineContent(endLine)
          if (endContent.includes(`# HELPER_END:${blockId}:${schemaId}`)) {
            blocks.push({
              startLine: line,
              endLine,
              blockId,
              schemaId,
              range: new monaco.Range(line, 1, endLine, model.getLineMaxColumn(endLine)),
              contentRange: new monaco.Range(line + 1, 1, endLine - 1, model.getLineMaxColumn(endLine - 1))
            })
            break
          }
        }
      }
    }
    
    return blocks
  }
}

interface HelperBlockBoundaries {
  startLine: number
  endLine: number
  blockId: string
  schemaId: string
  range: monaco.Range
  contentRange: monaco.Range
}
```

## ⚡ **Atomic Deletion Implementation**

### **Deletion Manager**
```typescript
// o-ui/src/components/editor/helpers/atomic-deletion-manager.ts
export class AtomicDeletionManager {
  private editor: monaco.editor.IStandaloneCodeEditor
  private boundaryDetector: BlockBoundaryDetector
  private isDeleting = false
  
  // Callbacks
  onHelperBlockDeleted?: (blockId: string, schemaId: string) => void
  onDeletionError?: (error: string) => void
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.boundaryDetector = new BlockBoundaryDetector(editor)
    this.setupDeletionDetection()
  }
  
  // Setup deletion detection
  private setupDeletionDetection() {
    this.editor.onDidChangeModelContent((e) => {
      if (this.isDeleting) return // Prevent recursion
      
      this.handleContentChanges(e.changes)
    })
    
    // Also handle key events for immediate deletion
    this.editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Delete || e.keyCode === monaco.KeyCode.Backspace) {
        this.handleDeleteKey(e)
      }
    })
  }
  
  // Handle delete key press
  private handleDeleteKey(e: monaco.IKeyboardEvent) {
    const selections = this.editor.getSelections()
    if (!selections) return
    
    for (const selection of selections) {
      // Check if selection affects any helper block
      const affectedBlocks = this.findBlocksAffectedByRange(selection)
      
      if (affectedBlocks.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        
        // Perform atomic deletion of all affected blocks
        this.performAtomicDeletion(affectedBlocks)
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
        const affectedBlocks = this.findBlocksAffectedByRange(change.range)
        
        for (const block of affectedBlocks) {
          if (!deletedBlocks.has(block.blockId)) {
            deletedBlocks.add(block.blockId)
            this.performAtomicDeletion([block])
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
    
    // Also check if the deletion affects the structure of helper blocks
    const allBlocks = this.boundaryDetector.getAllHelperBlocks()
    for (const block of allBlocks) {
      if (change.range.intersectRanges(block.range)) {
        return true
      }
    }
    
    return false
  }
  
  // Find blocks affected by a range
  private findBlocksAffectedByRange(range: monaco.Range): HelperBlockBoundaries[] {
    const allBlocks = this.boundaryDetector.getAllHelperBlocks()
    const affectedBlocks: HelperBlockBoundaries[] = []
    
    for (const block of allBlocks) {
      // Block is affected if:
      // 1. Range overlaps with block boundaries
      // 2. Range contains any part of the block
      // 3. Block contains any part of the range
      
      if (range.intersectRanges(block.range)) {
        affectedBlocks.push(block)
      }
    }
    
    return affectedBlocks
  }
  
  // Perform atomic deletion of helper blocks
  private performAtomicDeletion(blocks: HelperBlockBoundaries[]) {
    if (blocks.length === 0) return
    
    this.isDeleting = true
    
    try {
      // Sort blocks by line number (delete from bottom to top to maintain line numbers)
      const sortedBlocks = blocks.sort((a, b) => b.startLine - a.startLine)
      
      // Delete each block atomically
      for (const block of sortedBlocks) {
        this.deleteHelperBlockRange(block)
        
        // Notify about deletion
        this.onHelperBlockDeleted?.(block.blockId, block.schemaId)
      }
      
    } catch (error) {
      this.onDeletionError?.(`Failed to delete helper blocks: ${error}`)
    } finally {
      this.isDeleting = false
    }
  }
  
  // Delete single helper block range
  private deleteHelperBlockRange(block: HelperBlockBoundaries) {
    // Delete the entire range including markers
    this.editor.executeEdits('atomic-helper-deletion', [{
      range: block.range,
      text: ''
    }])
    
    // If the deletion left empty lines, clean them up
    this.cleanupEmptyLines(block.startLine)
  }
  
  // Clean up empty lines after deletion
  private cleanupEmptyLines(startLine: number) {
    const model = this.editor.getModel()
    if (!model) return
    
    // Check if the line where the block was is now empty
    if (startLine <= model.getLineCount()) {
      const lineContent = model.getLineContent(startLine).trim()
      if (lineContent === '') {
        // Remove the empty line
        this.editor.executeEdits('cleanup-empty-line', [{
          range: new monaco.Range(startLine, 1, startLine + 1, 1),
          text: ''
        }])
      }
    }
  }
  
  // Public method to manually delete a helper block
  public deleteHelperBlock(blockId: string) {
    const allBlocks = this.boundaryDetector.getAllHelperBlocks()
    const targetBlock = allBlocks.find(block => block.blockId === blockId)
    
    if (targetBlock) {
      this.performAtomicDeletion([targetBlock])
    } else {
      this.onDeletionError?.(`Helper block not found: ${blockId}`)
    }
  }
  
  // Public method to check if position is in a helper block
  public isPositionInHelperBlock(position: monaco.Position): boolean {
    return this.boundaryDetector.isInsideHelperBlock(position)
  }
}
```

## 🔄 **Undo/Redo Support**

### **Undo-Friendly Deletion**
```typescript
// Ensure atomic deletions work properly with Monaco's undo/redo
class UndoFriendlyDeletionManager extends AtomicDeletionManager {
  private deleteHelperBlockRange(block: HelperBlockBoundaries) {
    // Use a single edit operation for undo/redo consistency
    this.editor.executeEdits('atomic-helper-deletion', [{
      range: block.range,
      text: ''
    }])
    
    // Store metadata for potential undo operations
    this.storeUndoMetadata(block)
  }
  
  private storeUndoMetadata(block: HelperBlockBoundaries) {
    // Store information about deleted block for recovery
    const metadata = {
      blockId: block.blockId,
      schemaId: block.schemaId,
      deletedAt: Date.now(),
      range: {
        startLine: block.startLine,
        endLine: block.endLine
      }
    }
    
    // Could store in session storage or memory for recovery
    sessionStorage.setItem(`deleted-helper-${block.blockId}`, JSON.stringify(metadata))
  }
}
```

## 🛡️ **Error Handling & Recovery**

### **Robust Error Handling**
```typescript
export class SafeDeletionManager extends AtomicDeletionManager {
  private performAtomicDeletion(blocks: HelperBlockBoundaries[]) {
    // Validate blocks before deletion
    const validBlocks = this.validateBlocksForDeletion(blocks)
    
    if (validBlocks.length === 0) {
      this.onDeletionError?.('No valid blocks to delete')
      return
    }
    
    // Create backup before deletion
    const backup = this.createDeletionBackup(validBlocks)
    
    this.isDeleting = true
    
    try {
      // Perform deletion
      super.performAtomicDeletion(validBlocks)
      
      // Clear backup on successful deletion
      this.clearDeletionBackup(backup.id)
      
    } catch (error) {
      // Restore from backup on failure
      this.restoreFromBackup(backup)
      throw error
    } finally {
      this.isDeleting = false
    }
  }
  
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
  
  private createDeletionBackup(blocks: HelperBlockBoundaries[]) {
    const backupId = `backup-${Date.now()}`
    const backup = {
      id: backupId,
      timestamp: Date.now(),
      blocks: blocks.map(block => ({
        ...block,
        content: this.getBlockContent(block)
      }))
    }
    
    sessionStorage.setItem(`deletion-backup-${backupId}`, JSON.stringify(backup))
    return backup
  }
  
  private getBlockContent(block: HelperBlockBoundaries): string {
    const model = this.editor.getModel()
    if (!model) return ''
    
    const lines: string[] = []
    for (let line = block.startLine; line <= block.endLine; line++) {
      lines.push(model.getLineContent(line))
    }
    return lines.join('\n')
  }
}
```

## 🔧 **Integration with Helper Block Manager**

### **Complete Integration**
```typescript
// o-ui/src/components/editor/helpers/enhanced-helper-block-manager.ts
export class EnhancedHelperBlockManager extends HelperBlockManager {
  private deletionManager: AtomicDeletionManager
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    super(editor)
    
    // Initialize deletion manager
    this.deletionManager = new SafeDeletionManager(editor)
    
    // Connect deletion events
    this.deletionManager.onHelperBlockDeleted = (blockId, schemaId) => {
      // Clean up tracking
      this.helperBlocks.delete(blockId)
      this.removeBlockDecorations(blockId)
      
      // Notify parent component
      this.onHelperBlockDeleted?.({ id: blockId, schemaId })
    }
    
    this.deletionManager.onDeletionError = (error) => {
      console.error('Helper block deletion failed:', error)
      // Could show user-friendly error message
    }
  }
  
  // Override deletion to use atomic deletion manager
  public deleteHelperBlock(blockId: string) {
    this.deletionManager.deleteHelperBlock(blockId)
  }
  
  // Check if position is in helper block (prevents direct editing)
  public isPositionInHelperBlock(position: monaco.Position): boolean {
    return this.deletionManager.isPositionInHelperBlock(position)
  }
  
  // Remove decorations for deleted block
  private removeBlockDecorations(blockId: string) {
    // Remove read-only decorations
    this.readOnlyDecorations = this.readOnlyDecorations.filter(decoration => {
      // Implementation would track which decorations belong to which blocks
      return true // Simplified for example
    })
  }
}
```

## 🧪 **Testing Atomic Deletion**

### **Unit Tests**
```typescript
// Tests for atomic deletion
describe('AtomicDeletionManager', () => {
  let editor: monaco.editor.IStandaloneCodeEditor
  let manager: AtomicDeletionManager
  
  beforeEach(() => {
    editor = createMockEditor()
    manager = new AtomicDeletionManager(editor)
  })
  
  it('should delete entire helper block when marker is deleted', () => {
    const content = `
# HELPER_START:test-123:find-remark-helper
# Add Vendor Remark
amadeus_remark = f"RMTEST/TEST"
# HELPER_END:test-123:find-remark-helper
    `.trim()
    
    editor.setValue(content)
    
    // Delete the start marker line
    const range = new monaco.Range(1, 1, 1, 100)
    editor.executeEdits('test-delete', [{ range, text: '' }])
    
    // Should trigger atomic deletion of entire block
    expect(editor.getValue().trim()).toBe('')
  })
  
  it('should handle nested deletion properly', () => {
    const content = `
# HELPER_START:outer-123:container-helper
# Container helper
# HELPER_START:inner-456:remark-helper  
# Inner remark
amadeus_remark = f"RMTEST/TEST"
# HELPER_END:inner-456:remark-helper
# End container
# HELPER_END:outer-123:container-helper
    `.trim()
    
    editor.setValue(content)
    
    // Delete inner helper marker
    const range = new monaco.Range(3, 1, 3, 100)
    editor.executeEdits('test-delete', [{ range, text: '' }])
    
    // Should delete entire inner helper block but preserve outer
    const result = editor.getValue()
    expect(result).toContain('HELPER_START:outer-123')
    expect(result).not.toContain('HELPER_START:inner-456')
  })
})
```

### **Manual Testing Checklist**
- [ ] Delete start marker → Entire block deleted
- [ ] Delete end marker → Entire block deleted  
- [ ] Delete content inside block → Block preserved (read-only)
- [ ] Select entire block and delete → Block deleted atomically
- [ ] Cut/paste helper block → Works correctly
- [ ] Undo deletion → Block restored completely
- [ ] Multiple helper blocks → Independent deletion
- [ ] Nested helpers → Proper boundary detection

## 🎯 **Best Practices**

### **1. Performance**
- Use efficient range operations
- Batch multiple deletions
- Minimize DOM updates during deletion

### **2. User Experience**
- Provide visual feedback during deletion
- Show confirmation for large deletions
- Support undo/redo operations

### **3. Error Recovery**
- Always validate before deletion
- Provide backup/restore mechanisms
- Handle edge cases gracefully

### **4. Testing**
- Test all deletion scenarios
- Verify undo/redo compatibility
- Check performance with large documents

This atomic deletion system ensures **clean, predictable behavior** when users delete helper blocks, maintaining editor integrity while providing a professional user experience. 