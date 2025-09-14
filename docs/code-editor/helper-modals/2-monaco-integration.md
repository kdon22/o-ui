# Monaco Editor Integration - Read-Only Blocks & Smart Editing

## 🎯 Overview

This guide covers the **complete Monaco integration** for helper blocks, focusing on the key features: read-only protection, spacebar/click activation for editing, and atomic deletion.

## 🔒 **Read-Only Helper Blocks**

### **Core Concept**
Once a helper generates code, that code becomes **read-only** and can ONLY be modified by reopening the helper modal. This prevents users from accidentally breaking the generated code structure.

### **Implementation Architecture**
```typescript
// o-ui/src/components/editor/helpers/helper-block-manager.ts
export class HelperBlockManager {
  private editor: monaco.editor.IStandaloneCodeEditor
  private helperBlocks: Map<string, HelperBlock> = new Map()
  private readOnlyDecorations: string[] = []
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.setupEventHandlers()
  }
  
  // Mark helper block as read-only
  markBlockAsReadOnly(block: HelperBlock) {
    const decorations = this.editor.deltaDecorations([], [{
      range: block.range,
      options: {
        className: 'helper-block-readonly',
        hoverMessage: { value: '🔒 Helper block - Press spacebar or click to edit' },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }])
    
    this.readOnlyDecorations.push(...decorations)
    this.helperBlocks.set(block.id, block)
  }
}
```

### **Helper Block Detection**
```typescript
// Detect if cursor is inside a helper block
isInsideHelperBlock(position: monaco.Position): HelperBlock | null {
  const model = this.editor.getModel()
  
  for (const [id, block] of this.helperBlocks) {
    if (block.range.containsPosition(position)) {
      return block
    }
  }
  
  return null
}

// Find helper block boundaries by markers
findHelperBlockByMarkers(position: monaco.Position): HelperBlock | null {
  const model = this.editor.getModel()
  const totalLines = model.getLineCount()
  
  let startLine = null
  let endLine = null
  let helperId = null
  
  // Search backwards for HELPER_START
  for (let line = position.lineNumber; line >= 1; line--) {
    const content = model.getLineContent(line)
    const startMatch = content.match(/# HELPER_START:(.+)/)
    if (startMatch) {
      startLine = line
      helperId = startMatch[1]
      break
    }
  }
  
  // Search forwards for HELPER_END
  for (let line = position.lineNumber; line <= totalLines; line++) {
    const content = model.getLineContent(line)
    if (content.includes(`# HELPER_END:${helperId}`)) {
      endLine = line
      break
    }
  }
  
  if (startLine && endLine && helperId) {
    return {
      id: `${helperId}-${startLine}-${endLine}`,
      schemaId: helperId,
      range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
      markers: {
        start: new monaco.Position(startLine, 1),
        end: new monaco.Position(endLine, model.getLineMaxColumn(endLine))
      }
    }
  }
  
  return null
}
```

## ⌨️ **Spacebar Activation**

### **Implementation**
```typescript
// Handle spacebar press inside helper blocks
private handleSpacebarActivation = (e: monaco.IKeyboardEvent) => {
  if (e.keyCode !== monaco.KeyCode.Space) return
  
  const position = this.editor.getPosition()
  const helperBlock = this.isInsideHelperBlock(position)
  
  if (helperBlock) {
    e.preventDefault()
    e.stopPropagation()
    
    // Extract current data from the block
    const currentData = this.extractHelperData(helperBlock)
    
    // Open helper modal with existing data
    this.openHelperModalForEditing(helperBlock, currentData)
  }
}

// Setup event handler
private setupEventHandlers() {
  this.editor.onKeyDown(this.handleSpacebarActivation)
}
```

### **Visual Feedback**
```typescript
// Show visual indicator when spacebar is detected
showSpacebarHint(block: HelperBlock) {
  const decoration = this.editor.deltaDecorations([], [{
    range: block.range,
    options: {
      className: 'helper-block-spacebar-hint',
      afterContentClassName: 'helper-spacebar-icon',
      hoverMessage: { value: '⌨️ Press SPACEBAR to edit this helper' }
    }
  }])
  
  // Auto-remove hint after 2 seconds
  setTimeout(() => {
    this.editor.deltaDecorations(decoration, [])
  }, 2000)
}
```

## 🖱️ **Click Activation**

### **Implementation**
```typescript
// Handle mouse clicks inside helper blocks
private handleClickActivation = (e: monaco.editor.IEditorMouseEvent) => {
  const position = e.target.position
  if (!position) return
  
  const helperBlock = this.isInsideHelperBlock(position)
  
  if (helperBlock) {
    // Prevent default cursor positioning
    e.preventDefault()
    
    // Extract current data and open modal
    const currentData = this.extractHelperData(helperBlock)
    this.openHelperModalForEditing(helperBlock, currentData)
  }
}

// Advanced click detection for different click types
private handleAdvancedClick = (e: monaco.editor.IEditorMouseEvent) => {
  const helperBlock = this.isInsideHelperBlock(e.target.position)
  if (!helperBlock) return
  
  switch (e.target.type) {
    case monaco.editor.MouseTargetType.CONTENT_TEXT:
      // Click on actual code content
      this.handleContentClick(helperBlock, e)
      break
      
    case monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN:
      // Click on gutter - could show helper options
      this.showHelperContextMenu(helperBlock, e)
      break
      
    case monaco.editor.MouseTargetType.CONTENT_WIDGET:
      // Click on decoration or widget
      this.handleDecorationClick(helperBlock, e)
      break
  }
}
```

### **Smart Cursor Management**
```typescript
// Prevent cursor from entering helper blocks during navigation
private manageCursorPosition() {
  this.editor.onDidChangeCursorPosition((e) => {
    const helperBlock = this.isInsideHelperBlock(e.position)
    
    if (helperBlock && e.reason === monaco.editor.CursorChangeReason.Explicit) {
      // User tried to place cursor inside - move to block boundary
      const boundaryPosition = this.findSafeCursorPosition(helperBlock, e.position)
      
      if (boundaryPosition) {
        this.editor.setPosition(boundaryPosition)
      }
    }
  })
}

private findSafeCursorPosition(block: HelperBlock, attemptedPosition: monaco.Position): monaco.Position | null {
  const model = this.editor.getModel()
  
  // Try to place cursor just before the block
  if (block.range.startLineNumber > 1) {
    return new monaco.Position(block.range.startLineNumber - 1, model.getLineMaxColumn(block.range.startLineNumber - 1))
  }
  
  // Try to place cursor just after the block
  if (block.range.endLineNumber < model.getLineCount()) {
    return new monaco.Position(block.range.endLineNumber + 1, 1)
  }
  
  return null
}
```

## 🗑️ **Atomic Deletion**

### **Core Concept**
When a user deletes any part of a helper block (especially the marker lines), the **entire block** gets deleted, including all nested content.

### **Implementation**
```typescript
// Detect helper block deletions
private handleContentChange = (e: monaco.editor.IModelContentChangedEvent) => {
  for (const change of e.changes) {
    // Check if deletion affects helper markers
    if (this.isHelperMarkerDeletion(change)) {
      const affectedBlock = this.findAffectedHelperBlock(change)
      if (affectedBlock) {
        this.performAtomicDeletion(affectedBlock)
      }
    }
  }
}

// Check if a change affects helper markers
private isHelperMarkerDeletion(change: monaco.editor.IModelContentChange): boolean {
  const deletedText = change.text === '' ? 'deletion' : 'insertion'
  
  if (deletedText === 'deletion') {
    // Check if the range being deleted contains helper markers
    const model = this.editor.getModel()
    
    for (let line = change.range.startLineNumber; line <= change.range.endLineNumber; line++) {
      const content = model.getLineContent(line)
      if (content.includes('HELPER_START:') || content.includes('HELPER_END:')) {
        return true
      }
    }
  }
  
  return false
}

// Perform atomic deletion of entire helper block
private performAtomicDeletion(block: HelperBlock) {
  // Prevent recursive deletion detection
  this.editor.onDidChangeModelContent.dispose()
  
  try {
    // Delete the entire block
    this.editor.executeEdits('atomic-helper-deletion', [{
      range: block.range,
      text: ''
    }])
    
    // Clean up tracking
    this.helperBlocks.delete(block.id)
    this.removeBlockDecorations(block)
    
    // Notify about deletion
    this.onHelperBlockDeleted?.(block)
    
  } finally {
    // Re-enable deletion detection
    setTimeout(() => {
      this.editor.onDidChangeModelContent(this.handleContentChange)
    }, 100)
  }
}
```

### **Smart Deletion Detection**
```typescript
// More sophisticated deletion detection
private detectHelperBlockDeletion(changes: monaco.editor.IModelContentChange[]): HelperBlock[] {
  const deletedBlocks: HelperBlock[] = []
  
  for (const change of changes) {
    if (change.text !== '') continue // Only care about deletions
    
    // Check each helper block to see if it was affected
    for (const [id, block] of this.helperBlocks) {
      if (this.isBlockDeletedByChange(block, change)) {
        deletedBlocks.push(block)
      }
    }
  }
  
  return deletedBlocks
}

private isBlockDeletedByChange(block: HelperBlock, change: monaco.editor.IModelContentChange): boolean {
  // Block is deleted if:
  // 1. The change range overlaps with helper markers
  // 2. The start or end marker lines are deleted
  // 3. The entire block range is within the deletion range
  
  const changeRange = change.range
  
  // Check if deletion overlaps with block boundaries
  if (changeRange.intersectRanges(block.range)) {
    return true
  }
  
  // Check if marker lines are affected
  const startMarkerLine = block.markers.start.lineNumber
  const endMarkerLine = block.markers.end.lineNumber
  
  if (changeRange.startLineNumber <= startMarkerLine && changeRange.endLineNumber >= startMarkerLine) {
    return true
  }
  
  if (changeRange.startLineNumber <= endMarkerLine && changeRange.endLineNumber >= endMarkerLine) {
    return true
  }
  
  return false
}
```

## 🔧 **Block Insertion & Wrapping**

### **Helper Code Wrapping**
```typescript
// Wrap generated code with helper markers
wrapWithHelperMarkers(code: string, schemaId: string, blockId?: string): string {
  const id = blockId || `${schemaId}-${Date.now()}`
  
  return `# HELPER_START:${id}:${schemaId}
${code}
# HELPER_END:${id}:${schemaId}`
}

// Insert helper block with proper positioning
insertHelperBlock(code: string, schemaId: string): HelperBlock {
  const editor = this.editor
  const position = editor.getPosition()
  const model = editor.getModel()
  
  // Generate unique block ID
  const blockId = `helper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Wrap code with markers
  const wrappedCode = this.wrapWithHelperMarkers(code, schemaId, blockId)
  
  // Calculate insertion range
  const startLine = position.lineNumber
  const endLine = startLine + wrappedCode.split('\n').length - 1
  
  // Insert code
  editor.executeEdits('helper-insert', [{
    range: new monaco.Range(startLine, 1, startLine, 1),
    text: wrappedCode + '\n'
  }])
  
  // Create helper block object
  const helperBlock: HelperBlock = {
    id: blockId,
    schemaId,
    range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
    markers: {
      start: new monaco.Position(startLine, 1),
      end: new monaco.Position(endLine, model.getLineMaxColumn(endLine))
    },
    data: {}, // Will be populated from the generated code
    generatedCode: code
  }
  
  // Mark as read-only
  this.markBlockAsReadOnly(helperBlock)
  
  return helperBlock
}
```

## 🎨 **Visual Styling & Decorations**

### **CSS Styling**
```css
/* Read-only helper blocks */
.helper-block-readonly {
  background-color: rgba(100, 149, 237, 0.1);
  border-left: 3px solid #6495ed;
  position: relative;
}

.helper-block-readonly:hover {
  background-color: rgba(100, 149, 237, 0.2);
  cursor: pointer;
}

/* Spacebar hint */
.helper-block-spacebar-hint {
  background-color: rgba(255, 215, 0, 0.2);
  animation: pulse 1s infinite;
}

.helper-spacebar-icon::after {
  content: "⌨️ SPACE";
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { background-color: rgba(255, 215, 0, 0.2); }
  50% { background-color: rgba(255, 215, 0, 0.4); }
}
```

### **Monaco Decorations**
```typescript
// Apply visual decorations to helper blocks
applyHelperBlockDecorations(block: HelperBlock) {
  const decorations = [
    // Main block highlighting
    {
      range: block.range,
      options: {
        className: 'helper-block-readonly',
        hoverMessage: { 
          value: `🔧 ${this.getSchemaName(block.schemaId)} Helper\n⌨️ Press SPACEBAR or 🖱️ click to edit`
        }
      }
    },
    
    // Gutter icon
    {
      range: new monaco.Range(block.range.startLineNumber, 1, block.range.startLineNumber, 1),
      options: {
        glyphMarginClassName: 'helper-block-glyph',
        glyphMarginHoverMessage: { value: 'Helper Block - Click to edit' }
      }
    },
    
    // End marker
    {
      range: new monaco.Range(block.range.endLineNumber, 1, block.range.endLineNumber, 1),
      options: {
        afterContentClassName: 'helper-block-end-marker'
      }
    }
  ]
  
  return this.editor.deltaDecorations([], decorations)
}
```

## 🔄 **Integration with Main Editor**

### **Complete Setup**
```typescript
// o-ui/src/components/editor/helpers/business-rules-editor-with-utility.tsx
export function BusinessRulesEditorWithUtility() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const [helperBlockManager, setHelperBlockManager] = useState<HelperBlockManager>()
  const [modalState, setModalState] = useState<HelperModalState>()
  
  // Initialize helper block manager when editor is ready
  useEffect(() => {
    if (editor) {
      const manager = new HelperBlockManager(editor)
      
      // Set up callbacks
      manager.onHelperBlockActivated = (block, data) => {
        const schema = getSchemaById(block.schemaId)
        setModalState({
          schema,
          mode: 'edit',
          initialData: data,
          sourceBlock: block,
          onComplete: handleHelperUpdate,
          onCancel: () => setModalState(null)
        })
      }
      
      manager.onHelperBlockDeleted = (block) => {
        console.log(`Helper block deleted: ${block.schemaId}`)
      }
      
      setHelperBlockManager(manager)
    }
  }, [editor])
  
  const handleHelperUpdate = (code: string) => {
    if (modalState?.sourceBlock && helperBlockManager) {
      helperBlockManager.replaceHelperBlock(modalState.sourceBlock, code)
      setModalState(null)
    }
  }
  
  return (
    <>
      <MonacoEditor onMount={setEditor} />
      
      {modalState && (
        <HelperFactory
          schema={modalState.schema}
          initialData={modalState.initialData}
          onCodeGenerated={modalState.onComplete}
          onClose={modalState.onCancel}
        />
      )}
    </>
  )
}
```

This Monaco integration provides a **professional, user-friendly experience** where helper-generated code is protected from accidental modification while remaining easily editable through the guided modal interface. The spacebar and click activation makes editing intuitive, while atomic deletion prevents orphaned code fragments. 