# Enhanced Helper System - Complete Guide

## 🎯 Overview

The Enhanced Helper System provides a professional-grade code helper experience with **atomic deletion**, **undo support**, and **read-only/edit mode switching** for Monaco Editor.

## ✨ Key Features

### 🔒 **Read-Only Helper Blocks**
- Helper blocks are **read-only by default**
- Visual indicators (🔒 lock icon, blue border)
- Prevents accidental editing of generated code
- **F2 key** to enter edit mode

### ✏️ **Edit Mode**
- **F2** toggles edit mode for current helper block
- **ESC** exits edit mode
- Visual indicators (✏️ edit icon, orange border)
- Content changes tracked and reported

### 🗑️ **Atomic Deletion**
- Deleting any part of a helper block **deletes the entire block**
- Prevents orphaned code fragments
- Works with Delete, Backspace, Cut operations
- **Undo-friendly** - single operation for Monaco's undo stack

### ↩️ **Undo Support**
- **Cmd+Z / Ctrl+Z** restores deleted helper blocks
- Automatic backup creation before deletion
- Manual restore from deletion history
- Session storage for recovery across page reloads

## 🚀 Quick Start

### 1. Import the Enhanced System

```typescript
import { 
  EnhancedHelperManager, 
  HelperFactory,
  useHelperFactory,
  type HelperBlockInfo 
} from '@/components/auto-generated/code-helper'

// Import CSS styles
import '@/components/auto-generated/code-helper/helper-block-styles.css'
```

### 2. Initialize with Monaco Editor

```typescript
const editor = monaco.editor.create(container, {
  // ... your Monaco options
})

// Create enhanced helper manager
const helperManager = new EnhancedHelperManager(editor, {
  enableAtomicDeletion: true,   // ✅ Atomic deletion 
  enableUndoSupport: true,      // ✅ Cmd+Z undo support
  enableReadOnlyMode: true,     // ✅ Read-only protection  
  defaultReadOnly: true,        // ✅ New helpers start read-only
  enableEditMode: true,         // ✅ F2/ESC edit mode
})

// Connect events
helperManager.onHelperBlockDeleted = (info) => {
  console.log(`Helper deleted: ${info.id}`)
}

helperManager.onEditModeChanged = (info) => {
  console.log(`Edit mode: ${info.id} -> ${info.isEditMode}`)
}
```

### 3. Insert Helper Blocks

```typescript
// Using helper factory
const handleInsertCode = (code: string, schemaId: string) => {
  const blockId = helperManager.insertHelperBlock(code, schemaId)
  console.log(`Inserted helper: ${blockId}`)
}

// Manual insertion
const blockId = helperManager.insertHelperBlock(
  `# Add vendor remark\namadeus_remark = f"RM/TEST"`,
  'vendor-remark-helper'
)
```

## 🎮 User Interactions

### **Keyboard Shortcuts**

| Key | Action |
|-----|--------|
| **F2** | Toggle edit mode for current helper block |
| **ESC** | Exit edit mode |  
| **Cmd+Z / Ctrl+Z** | Undo helper block deletion |
| **Delete/Backspace** | Delete entire helper block (atomic) |

### **Visual Indicators**

| State | Border | Icon | Description |
|-------|--------|------|-------------|
| **Read-Only** | 🔵 Blue | 🔒 | Helper is protected from editing |
| **Edit Mode** | 🟠 Orange | ✏️ | Helper can be edited |
| **Selected** | Highlighted | - | Current helper at cursor |

### **Helper Block Format**

```python
# HELPER_START:helper-123:remark-helper
# Add vendor remark  
amadeus_remark = f"RM/TEST"
galileo_remark = f"RM/TEST"

if not any(r.text == "TEST" for r in existing_remarks):
    add_remark_to_systems(["amadeus", "galileo"])
# HELPER_END:helper-123:remark-helper
```

## 📋 API Reference

### **EnhancedHelperManager**

```typescript
class EnhancedHelperManager {
  // Get all helper blocks with their states
  getAllHelperBlocks(): HelperBlockInfo[]
  
  // Get helper block at cursor position
  getHelperBlockAtCursor(): HelperBlockInfo | null
  
  // Edit mode controls
  toggleEditMode(blockId: string): void
  setEditMode(blockId: string, isEditMode: boolean): void
  
  // Read-only controls
  setReadOnly(blockId: string, isReadOnly: boolean): void
  
  // Block management
  insertHelperBlock(code: string, schemaId: string): string
  deleteHelperBlock(blockId: string): void
  updateHelperBlockContent(blockId: string, newContent: string): boolean
  
  // Undo/restore
  getDeletionHistory(): Array<{id: string, timestamp: number, blockCount: number}>
  restoreDeletedBlock(backupId: string): boolean
  
  // Utilities
  isCursorInReadOnlyArea(): boolean
  getStatistics(): {total: number, readOnly: number, inEditMode: number, schemas: number}
  
  // Cleanup
  dispose(): void
}
```

### **HelperBlockInfo Interface**

```typescript
interface HelperBlockInfo {
  id: string                    // Unique helper block ID
  schemaId: string             // Schema that generated this helper  
  boundaries: HelperBlockBoundaries  // Line boundaries in editor
  isReadOnly: boolean          // Read-only state
  isEditMode: boolean          // Edit mode state
  content: string              // Helper content (excluding markers)
}
```

## 🎨 Styling & Themes

### **CSS Classes**

```css
/* Read-only helper blocks */
.helper-block-readonly {
  background-color: rgba(74, 144, 226, 0.1);
  border-left: 3px solid #4a90e2;
}

.helper-block-glyph-readonly::before {
  content: "🔒";
}

/* Edit mode helper blocks */
.helper-block-editing {
  background-color: rgba(243, 156, 18, 0.1);
  border-left: 3px solid #f39c12;
}

.helper-block-glyph-editing::before {
  content: "✏️";
}
```

### **Theme Support**

- ✅ Light theme (`vs`)
- ✅ Dark theme (`vs-dark`) 
- ✅ High contrast (`hc-black`)
- ✅ Custom themes via CSS variables

## 🧪 Complete Example

```typescript
import React, { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import { EnhancedHelperManager } from '@/components/auto-generated/code-helper'
import '@/components/auto-generated/code-helper/helper-block-styles.css'

export function BusinessRuleEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const helperManagerRef = useRef<EnhancedHelperManager | null>(null)
  
  useEffect(() => {
    if (!editorRef.current) return
    
    // Create Monaco editor
    const editor = monaco.editor.create(editorRef.current, {
      value: '# Write your business rules here\n\n',
      language: 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      glyphMargin: true
    })
    
    // Create enhanced helper manager  
    const helperManager = new EnhancedHelperManager(editor, {
      enableAtomicDeletion: true,
      enableUndoSupport: true,
      enableReadOnlyMode: true,
      defaultReadOnly: true,
      enableEditMode: true
    })
    
    helperManagerRef.current = helperManager
    
    // Event handlers
    helperManager.onHelperBlockDeleted = ({ id, schemaId }) => {
      console.log(`Deleted helper: ${id} (${schemaId})`)
    }
    
    helperManager.onEditModeChanged = ({ id, isEditMode }) => {
      console.log(`Edit mode changed: ${id} -> ${isEditMode}`)
    }
    
    helperManager.onHelperBlockContentChanged = ({ id, content }) => {
      console.log(`Content changed: ${id}`)
      // Could sync changes to server here
    }
    
    helperManager.onError = (error) => {
      console.error('Helper error:', error)
    }
    
    // Cleanup
    return () => {
      helperManager.dispose()
      editor.dispose()
    }
  }, [])
  
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div ref={editorRef} style={{ height: '100%' }} />
      
      <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#333', color: '#fff', padding: 10, borderRadius: 5 }}>
        💡 Press F2 to edit helpers • Cmd+Z to undo deletion
      </div>
    </div>
  )
}
```

## 🔧 Advanced Configuration

### **Custom Options**

```typescript
const helperManager = new EnhancedHelperManager(editor, {
  // Deletion options
  enableAtomicDeletion: true,      // Enable atomic deletion
  enableUndoSupport: true,         // Enable Cmd+Z undo
  
  // Read-only options  
  enableReadOnlyMode: true,        // Enable read-only protection
  defaultReadOnly: true,           // New helpers start read-only
  
  // Edit options
  enableEditMode: true,            // Enable F2/ESC edit mode
  editModeKey: monaco.KeyCode.F2,  // Key to enter edit mode
  exitEditKey: monaco.KeyCode.Escape // Key to exit edit mode
})
```

### **Event Handling**

```typescript
// Track all helper block activity
helperManager.onHelperBlockDeleted = ({ id, schemaId }) => {
  // Helper was deleted (atomically)
  analytics.track('helper_deleted', { id, schemaId })
}

helperManager.onEditModeChanged = ({ id, isEditMode }) => {
  // Edit mode was toggled
  if (isEditMode) {
    showEditToolbar(id)
  } else {
    hideEditToolbar()
  }
}

helperManager.onHelperBlockContentChanged = ({ id, content }) => {
  // Content was modified in edit mode
  debounce(() => saveToServer(id, content), 500)
}

helperManager.onError = (error) => {
  // Handle errors gracefully
  showErrorToast(error)
}
```

## 🏆 Best Practices

### **1. User Experience**
- Always show keyboard shortcuts in UI hints
- Provide visual feedback for mode changes
- Use consistent styling across themes
- Test with screen readers for accessibility

### **2. Performance**
- Dispose manager when component unmounts
- Use debounced saves for content changes
- Limit deletion history to reasonable size
- Clean up session storage periodically

### **3. Error Handling**
- Gracefully handle Monaco editor disposal
- Validate helper block structure
- Provide fallbacks for missing features
- Log errors for debugging

### **4. Integration**
- Connect to your helper factory system
- Sync with server-side helper definitions
- Integrate with version control
- Support collaboration features

## 🚨 Troubleshooting

### **Undo Not Working**
- Ensure `enableUndoSupport: true`
- Check Monaco editor's undo/redo settings
- Verify session storage is available

### **Read-Only Not Working**  
- Import CSS styles properly
- Check `enableReadOnlyMode: true`
- Verify Monaco decorations are applied

### **Edit Mode Issues**
- Ensure F2 key binding is registered
- Check for conflicting keyboard shortcuts
- Verify helper block boundaries detection

### **Styling Problems**
- Import `helper-block-styles.css` 
- Check CSS specificity conflicts
- Test with different Monaco themes

## 📈 Performance Tips

1. **Batch Operations**: Use `setTimeout` for UI updates after bulk changes
2. **Debounce Saves**: Don't save on every keystroke in edit mode  
3. **Limit History**: Keep deletion history under 10 items
4. **Dispose Properly**: Always call `dispose()` on cleanup
5. **CSS Optimization**: Use GPU-accelerated properties for animations

---

**🎉 You now have a professional-grade helper system with undo support and read-only/edit functionality!**

The system provides the exact user experience you requested:
- ✅ **Cmd+Z undoes deletions** and restores helper blocks
- ✅ **Read-only protection** prevents accidental editing  
- ✅ **F2 edit mode** allows controlled editing
- ✅ **Atomic deletion** ensures clean block management
- ✅ **Professional UX** with visual indicators and smooth interactions 