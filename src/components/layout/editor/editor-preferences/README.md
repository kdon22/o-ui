# Editor Preferences System

A clean, focused architecture for managing Monaco Editor preferences with live updates and persistent storage.

## 🏗️ Architecture

### **Directory Structure**
```
editor-preferences/
├── index.ts                    # Main exports
├── types/                      # TypeScript interfaces
│   └── editor-preferences.ts   
├── constants/                  # Static configuration
│   ├── theme-options.ts        
│   └── font-options.ts         
├── hooks/                      # Custom React hooks
│   ├── use-editor-preferences.ts
│   └── use-font-availability.ts
└── components/                 # UI components
    ├── editor-preferences-modal.tsx  # Main modal
    ├── appearance-tab.tsx       
    ├── font-tab.tsx            
    ├── editor-tab.tsx          
    ├── theme-selector.tsx      
    ├── font-selector.tsx       
    ├── preferences-status.tsx  
    └── editor-options.tsx      
```

## 🎯 Key Features

### **Live Updates**
- Changes apply instantly to Monaco Editor
- No modal closing on preference changes
- Real-time preview of theme, font, and editor settings

### **Persistent Storage**
- Preferences saved to user session (database)
- LocalStorage backup for instant loading
- Debounced API calls to prevent spam

### **Clean Architecture**
- Small, focused components (<100 lines each)
- Separated concerns (UI, logic, data)
- TypeScript throughout with proper types

## 🔧 Usage

```typescript
import { EditorPreferencesModal } from '@/components/layout/editor/editor-preferences'

// Simple usage - all logic handled internally
<EditorPreferencesModal />
```

## 🎨 Available Preferences

- **Theme**: Light, Dark, High Contrast
- **Font Size**: 8-32px with keyboard shortcuts
- **Font Family**: Fira Code, Monaco, Consolas, etc.
- **Word Wrap**: Toggle line wrapping
- **Line Numbers**: Show/hide line numbers

## 🚀 Monaco Integration

The system dispatches `editorPreferencesChanged` events that Monaco editors listen for via the `useEditorPreferences` hook, ensuring all editors stay in sync.

## 📝 Component Sizes

- **Main Modal**: ~150 lines
- **Tab Components**: ~30-50 lines each  
- **Selector Components**: ~50-80 lines each
- **Hooks**: ~100-150 lines each

*Much more maintainable than the original 654-line monolith!*