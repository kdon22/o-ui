# 9. Migration Guide - From Hook System to Factory System

## 🎯 **Overview**

This guide provides **step-by-step migration** from the old hook-based Monaco system to the new bulletproof factory architecture while preserving all existing functionality.

## 📊 **Migration Benefits**

### **Before (Hook System Issues)**
- ✖️ 9+ interdependent hooks causing complexity
- ✖️ Broken auto-indentation on Enter key
- ✖️ Performance issues with real-time parsing
- ✖️ Complex state management bugs
- ✖️ Provider registration conflicts

### **After (Factory System Benefits)**
- ✅ Centralized service management
- ✅ Bulletproof auto-indentation
- ✅ Advanced caching and performance
- ✅ Provider conflict resolution
- ✅ Preserved Python generation

## 🔄 **Migration Steps**

### **Step 1: Update Imports**

#### **Old Hook-Based Imports**
```typescript
// ❌ Old way - multiple hook imports
import { useAutoIndentation } from './hooks/use-auto-indentation'
import { useSyntaxHighlighting } from './hooks/use-syntax-highlighting'
import { useAutocomplete } from './hooks/use-autocomplete'
import { useErrorValidation } from './hooks/use-error-validation'
import { useKeyboardHandlers } from './hooks/use-keyboard-handlers'
import { useLineOperations } from './hooks/use-line-operations'
import { useBracketMatching } from './hooks/use-bracket-matching'
import { useCodeFolding } from './hooks/use-code-folding'
import { useLineEditorState } from './hooks/use-line-editor-state'
```

#### **New Factory-Based Imports**
```typescript
// ✅ New way - single factory import
import { getMonacoServiceFactory } from '@/components/editor/services/monaco-editor'
```

### **Step 2: Replace Hook Usage**

#### **Old Hook-Based Component**
```typescript
// ❌ Old complex hook-based component
export function BusinessRuleEditor() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  
  // Multiple hook dependencies
  const autoIndentation = useAutoIndentation(editor)
  const syntaxHighlighting = useSyntaxHighlighting(editor)
  const autocomplete = useAutocomplete(editor)
  const errorValidation = useErrorValidation(editor)
  const keyboardHandlers = useKeyboardHandlers(editor)
  const lineOperations = useLineOperations(editor)
  const bracketMatching = useBracketMatching(editor)
  const codeFolding = useCodeFolding(editor)
  const editorState = useLineEditorState(editor)

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setEditor(editor)
    
    // Manual initialization of each hook
    autoIndentation.initialize()
    syntaxHighlighting.initialize()
    autocomplete.initialize()
    // ... more manual initialization
  }

  return (
    <MonacoEditor
      language="business-rules"
      onMount={handleEditorMount}
      // ... other props
    />
  )
}
```

#### **New Factory-Based Component**
```typescript
// ✅ New simple factory-based component
export function BusinessRuleEditor() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const [isFactoryReady, setIsFactoryReady] = useState(false)

  const handleEditorMount = async (
    editor: monaco.editor.IStandaloneCodeEditor, 
    monaco: Monaco
  ) => {
    setEditor(editor)
    
    try {
      // Single factory initialization replaces all hooks
      const factory = getMonacoServiceFactory()
      await factory.initialize(monaco)
      
      setIsFactoryReady(true)
      console.log('✅ All Monaco features ready!')
      
    } catch (error) {
      console.error('❌ Factory initialization failed:', error)
      // Editor still works with basic features
    }
  }

  return (
    <MonacoEditor
      language="business-rules"
      onMount={handleEditorMount}
      // ... other props
    />
  )
}
```

### **Step 3: Update Configuration**

#### **Old Configuration Pattern**
```typescript
// ❌ Old way - scattered configuration across hooks
const autoIndentationConfig = {
  enableAutoIndent: true,
  indentSize: 2,
  preserveWhitespace: false
}

const autocompleteConfig = {
  enableIntelliSense: true,
  maxSuggestions: 30,
  debounceMs: 200
}

const validationConfig = {
  enableRealTimeValidation: true,
  maxErrors: 50,
  showInfoMessages: true
}

// Each hook configured separately
const autoIndentation = useAutoIndentation(editor, autoIndentationConfig)
const autocomplete = useAutocomplete(editor, autocompleteConfig)
const validation = useErrorValidation(editor, validationConfig)
```

#### **New Unified Configuration**
```typescript
// ✅ New way - single centralized configuration
const factory = getMonacoServiceFactory({
  // All features configured in one place
  enableTypeInference: true,
  enableSchemaValidation: true,
  enableDebugMode: process.env.NODE_ENV === 'development',
  
  // Performance settings
  maxCacheSize: 1000,
  cacheTimeoutMs: 5 * 60 * 1000,
  maxRetries: 3,
  
  // IntelliSense settings
  maxCompletionItems: 50,
  completionTimeout: 1000,
  hoverTimeout: 500,
  
  // Schema paths
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/number-methods'
  ]
})
```

### **Step 4: Update Python Generation**

#### **Old Python Generation Pattern**
```typescript
// ❌ Old way - separate code generation service
import { CodeGeneratorService } from './utils/code-generator'

const generatePython = async () => {
  const businessRuleCode = editor.getValue()
  
  const codeGenerator = new CodeGeneratorService()
  const pythonCode = await codeGenerator.generatePython(businessRuleCode)
  
  setPythonCode(pythonCode)
}
```

#### **New Factory-Integrated Generation**
```typescript
// ✅ New way - integrated with factory system
const generatePython = async () => {
  const businessRuleCode = editor.getValue()
  
  // Get code generator from factory
  const factory = getMonacoServiceFactory()
  const codeGenerator = factory.getService('codeGeneratorService')
  
  if (codeGenerator) {
    const result = await codeGenerator.generatePythonWithMapping(businessRuleCode)
    
    setPythonCode(result.pythonCode)
    setDebugMapping(result.debugMapping) // New: debug support
  }
}
```

### **Step 5: Update Error Handling**

#### **Old Error Handling**
```typescript
// ❌ Old way - manual error handling for each hook
useEffect(() => {
  try {
    autoIndentation.initialize()
  } catch (error) {
    console.error('Auto-indentation failed:', error)
  }
  
  try {
    syntaxHighlighting.initialize()
  } catch (error) {
    console.error('Syntax highlighting failed:', error)
  }
  
  // ... repeat for each hook
}, [editor])
```

#### **New Centralized Error Handling**
```typescript
// ✅ New way - factory handles all errors gracefully
const initializeEditor = async (monaco: Monaco) => {
  try {
    const factory = getMonacoServiceFactory()
    await factory.initialize(monaco)
    
    // Check what services are available
    const status = factory.getStatus()
    console.log('✅ Services initialized:', status.services)
    
  } catch (error) {
    console.error('❌ Factory initialization failed:', error)
    
    // Factory automatically provides fallback functionality
    // Editor still works with basic features
  }
}
```

## 🔧 **Preserving Existing Functionality**

### **Helper Modal Integration**

#### **Old Helper Integration**
```typescript
// ❌ Old way - manual helper modal management
const [showExpressionBuilder, setShowExpressionBuilder] = useState(false)

const handleHelperComplete = (expression: string) => {
  const position = editor.getPosition()
  editor.executeEdits('helper', [{
    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
    text: expression
  }])
  setShowExpressionBuilder(false)
}

return (
  <>
    <MonacoEditor onMount={handleMount} />
    <ExpressionBuilderModal 
      isOpen={showExpressionBuilder}
      onComplete={handleHelperComplete}
    />
  </>
)
```

#### **New Factory-Integrated Helpers**
```typescript
// ✅ New way - helpers automatically integrated via IntelliSense
const handleEditorMount = async (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
  const factory = getMonacoServiceFactory({
    // Helper modals automatically appear in IntelliSense
    helperSchemaPaths: ['@/lib/editor/schemas/helpers']
  })
  
  await factory.initialize(monaco)
  
  // Helpers now appear as completion items with 🔧 icons
  // Users can access them through IntelliSense (Ctrl+Space)
}
```

### **Custom Method Support**

#### **Migration from Old Method Registration**
```typescript
// ❌ Old way - manual method registration
const customMethods = [
  {
    name: 'toUpper',
    category: 'string',
    pythonCode: (target: string) => `${target}.upper()`
  }
]

// Register with autocomplete hook
const autocomplete = useAutocomplete(editor, {
  customMethods: customMethods
})
```

#### **New Schema-Based Methods**
```typescript
// ✅ New way - create method schemas
// lib/editor/schemas/methods/custom-methods.ts
export const CUSTOM_METHOD_SCHEMAS: MethodSchema[] = [
  {
    type: 'method',
    id: 'string-to-upper',
    name: 'toUpper',
    category: 'string',
    description: 'Convert text to uppercase',
    parameters: [],
    returnType: 'str',
    pythonGenerator: (target: string) => `${target}.upper()`,
    examples: [
      {
        businessRule: 'text.toUpper()',
        pythonCode: 'text.upper()',
        description: 'Convert to uppercase'
      }
    ]
  }
]

// Factory automatically loads schemas
const factory = getMonacoServiceFactory({
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/custom-methods' // Include your schemas
  ]
})
```

## 🚀 **Performance Improvements**

### **Before vs After Comparison**

#### **Old Performance Issues**
```typescript
// ❌ Old performance problems
- Real-time parsing on every keystroke
- No caching of completion items
- Multiple hook re-renders
- Provider registration conflicts
- State synchronization issues
```

#### **New Performance Benefits**
```typescript
// ✅ New performance optimizations
- Advanced caching with TTL
- Debounced completion requests
- Single factory initialization
- Conflict-free provider management
- Optimized state management
```

### **Performance Monitoring**
```typescript
// Monitor performance improvements
const factory = getMonacoServiceFactory()
await factory.initialize(monaco)

// Check cache performance
const typeService = factory.getService('typeInferenceService')
const stats = typeService?.getStats()

console.log('Performance Metrics:', {
  cacheHitRate: stats.cacheHits / (stats.cacheHits + stats.cacheMisses),
  averageResponseTime: stats.averageResponseTime,
  totalCachedItems: stats.cacheSize
})
```

## 🧪 **Testing Migration**

### **1. Functionality Verification**
```typescript
// Test that all old functionality still works
const testMigration = async () => {
  const factory = getMonacoServiceFactory()
  await factory.initialize(monaco)
  
  // Test auto-indentation (was broken in old system)
  editor.setValue('if condition')
  editor.trigger('keyboard', 'type', { text: '\n' })
  
  const currentLine = editor.getModel().getLineContent(2)
  console.log('Auto-indent working:', currentLine.startsWith('    ')) // Should be indented
  
  // Test IntelliSense
  editor.setValue('text.')
  editor.setPosition({ lineNumber: 1, column: 6 })
  
  const completions = await monaco.languages.getCompletions(
    editor.getModel(),
    { lineNumber: 1, column: 6 }
  )
  
  console.log('IntelliSense working:', completions.suggestions.length > 0)
  
  // Test Python generation
  const codeGenerator = factory.getService('codeGeneratorService')
  const result = await codeGenerator.generatePython('text.toUpper()')
  console.log('Python generation working:', result.includes('.upper()'))
}
```

### **2. Error Handling Verification**
```typescript
// Test that error handling is more robust
const testErrorHandling = async () => {
  // Simulate schema loading failure
  const factoryWithBadPaths = getMonacoServiceFactory({
    methodSchemaPaths: ['@/nonexistent/path']
  })
  
  try {
    await factoryWithBadPaths.initialize(monaco)
    
    // Should still work with fallback functionality
    const status = factoryWithBadPaths.getStatus()
    console.log('Graceful degradation working:', status.initialized)
    
  } catch (error) {
    console.log('Error handled gracefully:', error.message)
  }
}
```

## 📋 **Migration Checklist**

### **Pre-Migration**
- [ ] **Backup current code** - Save working version
- [ ] **Document custom methods** - List all custom business rule methods
- [ ] **Document helper modals** - List all existing helper components
- [ ] **Test current functionality** - Verify what works/doesn't work

### **During Migration**
- [ ] **Update imports** - Replace hook imports with factory import
- [ ] **Simplify components** - Remove hook usage, add factory initialization
- [ ] **Convert custom methods** - Create method schemas
- [ ] **Convert helper modals** - Create helper schemas
- [ ] **Update configuration** - Centralize all settings

### **Post-Migration**
- [ ] **Test auto-indentation** - Verify Enter key works correctly
- [ ] **Test IntelliSense** - Verify all methods appear
- [ ] **Test Python generation** - Verify output is correct
- [ ] **Test helper modals** - Verify they appear in IntelliSense
- [ ] **Monitor performance** - Check cache hit rates and response times

## 🚨 **Common Migration Issues**

### **Issue 1: Missing Custom Methods**
```typescript
// Problem: Custom methods don't appear in IntelliSense
// Solution: Ensure method schemas are properly created and paths configured

const factory = getMonacoServiceFactory({
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/your-custom-methods' // Add this
  ]
})
```

### **Issue 2: Helper Modals Not Appearing**
```typescript
// Problem: Helper shortcuts don't show in completion list
// Solution: Create helper schemas and register modal components

// 1. Create helper schema
export const YOUR_HELPER_SCHEMA: HelperSchema = {
  type: 'helper',
  id: 'your-helper',
  name: 'Your Helper',
  // ... configuration
}

// 2. Register component
const HelperModalRegistry = {
  'YourHelperModal': YourHelperModal
}
```

### **Issue 3: Python Generation Differences**
```typescript
// Problem: Generated Python code format changed
// Solution: Update pythonGenerator functions in schemas

const updatedSchema: MethodSchema = {
  // ... other fields
  pythonGenerator: (target: string) => {
    // Ensure output matches expected format
    return `${target}.your_method()`
  }
}
```

---

**Follow this migration guide to seamlessly upgrade from the old hook system to the new bulletproof factory architecture while preserving all existing functionality.** 🔄 