# 7. Debug Mapping - TypeScript-like Debugging Support

## 🎯 **Overview**

The Debug Mapping system provides **TypeScript-like debugging** for business rules by generating precise source maps that link business rule syntax to generated Python code with breakpoint support.

## 🗺️ **Source Map Generation**

### **Mapping Structure**
```typescript
interface DebugMapping {
  version: number                    // Source map version
  file: string                      // Generated Python file
  sourceRoot: string                // Business rules source root
  sources: string[]                 // Source files (business rules)
  names: string[]                   // Symbol names
  mappings: string                  // VLQ encoded mappings
  sourcesContent: string[]          // Original business rule content
}

interface LineMapping {
  businessRuleLine: number          // Line in business rule
  businessRuleColumn: number        // Column in business rule
  pythonLine: number               // Line in generated Python
  pythonColumn: number             // Column in generated Python
  name?: string                    // Variable/function name
}
```

### **Mapping Generation Process**
```typescript
class DebugMappingGenerator {
  generateMapping(
    businessRuleCode: string,
    pythonCode: string,
    transformations: CodeTransformation[]
  ): DebugMapping {
    
    const mappings: LineMapping[] = []
    
    // Process each transformation
    for (const transform of transformations) {
      const lineMapping: LineMapping = {
        businessRuleLine: transform.sourceRange.startLine,
        businessRuleColumn: transform.sourceRange.startColumn,
        pythonLine: transform.targetRange.startLine,
        pythonColumn: transform.targetRange.startColumn,
        name: transform.symbolName
      }
      
      mappings.push(lineMapping)
    }
    
    return {
      version: 3,
      file: 'generated.py',
      sourceRoot: '/business-rules/',
      sources: ['rule.br'],
      names: this.extractSymbolNames(transformations),
      mappings: this.encodeVLQ(mappings),
      sourcesContent: [businessRuleCode]
    }
  }
}
```

## 🔍 **Code Transformation Tracking**

### **Transformation Interface**
```typescript
interface CodeTransformation {
  id: string                        // Unique transformation ID
  type: 'variable' | 'method' | 'operator' | 'control' // Transformation type
  sourceRange: SourceRange          // Original business rule range
  targetRange: SourceRange          // Generated Python range
  symbolName?: string               // Symbol name for debugging
  pythonGenerator: PythonGenerator  // The generator that created this
  metadata: TransformationMetadata  // Additional debug info
}

interface SourceRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

interface TransformationMetadata {
  originalText: string              // Original business rule text
  generatedText: string             // Generated Python text
  schemaId?: string                 // Schema that generated this
  confidence: number                // Generation confidence
  warningMessages?: string[]        // Any warnings
}
```

### **Enhanced Python Generators with Mapping**
```typescript
// Enhanced Python generator that tracks transformations for debugging
type MappingPythonGenerator = (
  target: string,
  sourceRange: SourceRange,
  transformationTracker: TransformationTracker,
  ...args: string[]
) => GenerationResult

interface GenerationResult {
  pythonCode: string                // Generated Python code
  transformation: CodeTransformation // Debug mapping info
}

// Example: String method with mapping
const toUpperWithMapping: MappingPythonGenerator = (
  target: string,
  sourceRange: SourceRange,
  tracker: TransformationTracker
) => {
  const pythonCode = `${target}.upper()`
  
  const transformation: CodeTransformation = {
    id: `string-to-upper-${Date.now()}`,
    type: 'method',
    sourceRange,
    targetRange: tracker.getNextTargetRange(pythonCode.length),
    symbolName: 'toUpper',
    pythonGenerator: toUpperWithMapping,
    metadata: {
      originalText: `${target}.toUpper()`,
      generatedText: pythonCode,
      schemaId: 'string-to-upper',
      confidence: 1.0
    }
  }
  
  tracker.addTransformation(transformation)
  
  return {
    pythonCode,
    transformation
  }
}
```

## 🏗️ **Schema-Driven Debug Generation**

### **Enhanced Method Schemas with Debug Support**
```typescript
interface DebugMethodSchema extends MethodSchema {
  debugInfo: {
    generateMapping: boolean         // Should generate debug mapping
    breakpointSupport: boolean       // Supports breakpoints
    symbolName: string              // Debug symbol name
    category: 'core' | 'helper' | 'custom' // Debug category
  }
  
  // Enhanced Python generator with debug mapping
  pythonGeneratorWithMapping: MappingPythonGenerator
}

// Example enhanced schema
const STRING_TO_UPPER_DEBUG: DebugMethodSchema = {
  // ... existing schema fields
  debugInfo: {
    generateMapping: true,
    breakpointSupport: true,
    symbolName: 'str_to_upper',
    category: 'core'
  },
  pythonGeneratorWithMapping: toUpperWithMapping
}
```

### **Factory Pattern for Debug Generation**
```typescript
class DebugSchemaFactory {
  static createDebugSchema(
    methodSchema: MethodSchema,
    debugConfig: DebugConfig
  ): DebugMethodSchema {
    
    const debugInfo = {
      generateMapping: debugConfig.enableMapping,
      breakpointSupport: debugConfig.enableBreakpoints,
      symbolName: this.generateSymbolName(methodSchema),
      category: this.categorizeSchema(methodSchema)
    }
    
    const pythonGeneratorWithMapping = this.wrapWithMapping(
      methodSchema.pythonGenerator,
      debugInfo
    )
    
    return {
      ...methodSchema,
      debugInfo,
      pythonGeneratorWithMapping
    }
  }
  
  private static wrapWithMapping(
    originalGenerator: PythonGenerator,
    debugInfo: any
  ): MappingPythonGenerator {
    return (target, sourceRange, tracker, ...args) => {
      // Call original generator
      const pythonCode = originalGenerator(target, ...args)
      
      // Create transformation record
      const transformation: CodeTransformation = {
        id: `${debugInfo.symbolName}-${Date.now()}`,
        type: 'method',
        sourceRange,
        targetRange: tracker.getNextTargetRange(pythonCode.length),
        symbolName: debugInfo.symbolName,
        pythonGenerator: originalGenerator,
        metadata: {
          originalText: `${target}.${debugInfo.symbolName}()`,
          generatedText: pythonCode,
          confidence: 1.0
        }
      }
      
      tracker.addTransformation(transformation)
      
      return { pythonCode, transformation }
    }
  }
}
```

## 🎯 **Breakpoint System**

### **Breakpoint Management**
```typescript
interface BusinessRuleBreakpoint {
  id: string                        // Unique breakpoint ID
  businessRuleLine: number          // Line in business rule
  businessRuleColumn: number        // Column in business rule
  pythonLine: number               // Corresponding Python line
  pythonColumn: number             // Corresponding Python column
  condition?: string               // Optional condition
  enabled: boolean                 // Is breakpoint active
  hitCount: number                 // How many times hit
}

class BreakpointManager {
  private breakpoints = new Map<string, BusinessRuleBreakpoint>()
  private debugMapping: DebugMapping
  
  setBreakpoint(
    businessRuleLine: number,
    businessRuleColumn: number = 0,
    condition?: string
  ): string {
    
    // Find corresponding Python location using debug mapping
    const pythonLocation = this.mapToPython(businessRuleLine, businessRuleColumn)
    
    if (!pythonLocation) {
      throw new Error(`Cannot set breakpoint: no mapping for line ${businessRuleLine}`)
    }
    
    const breakpoint: BusinessRuleBreakpoint = {
      id: `bp-${Date.now()}`,
      businessRuleLine,
      businessRuleColumn,
      pythonLine: pythonLocation.line,
      pythonColumn: pythonLocation.column,
      condition,
      enabled: true,
      hitCount: 0
    }
    
    this.breakpoints.set(breakpoint.id, breakpoint)
    
    // Set actual Python breakpoint
    this.setPythonBreakpoint(pythonLocation.line, condition)
    
    return breakpoint.id
  }
  
  private mapToython(line: number, column: number): PythonLocation | null {
    // Use debug mapping to find corresponding Python location
    for (const mapping of this.parseMappings()) {
      if (mapping.businessRuleLine === line && 
          mapping.businessRuleColumn >= column) {
        return {
          line: mapping.pythonLine,
          column: mapping.pythonColumn
        }
      }
    }
    return null
  }
}
```

### **Monaco Breakpoint Integration**
```typescript
// Integrate breakpoints with Monaco Editor
class MonacoBreakpointService {
  private editor: monaco.editor.IStandaloneCodeEditor
  private breakpointManager: BreakpointManager
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor
    this.breakpointManager = new BreakpointManager()
    this.setupBreakpointDecorations()
  }
  
  private setupBreakpointDecorations(): void {
    // Listen for gutter clicks to set breakpoints
    this.editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position.lineNumber
        this.toggleBreakpoint(line)
      }
    })
  }
  
  private toggleBreakpoint(line: number): void {
    const existingBreakpoint = this.findBreakpointAtLine(line)
    
    if (existingBreakpoint) {
      // Remove breakpoint
      this.breakpointManager.removeBreakpoint(existingBreakpoint.id)
      this.updateBreakpointDecorations()
    } else {
      // Add breakpoint
      try {
        const breakpointId = this.breakpointManager.setBreakpoint(line)
        this.updateBreakpointDecorations()
        
        console.log(`✅ Breakpoint set at business rule line ${line}`)
      } catch (error) {
        console.error(`❌ Failed to set breakpoint: ${error.message}`)
      }
    }
  }
  
  private updateBreakpointDecorations(): void {
    const breakpointDecorations = Array.from(this.breakpointManager.getAllBreakpoints())
      .map(bp => ({
        range: new monaco.Range(bp.businessRuleLine, 1, bp.businessRuleLine, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: bp.enabled ? 'breakpoint-glyph' : 'breakpoint-disabled-glyph',
          glyphMarginHoverMessage: {
            value: `Breakpoint ${bp.enabled ? 'enabled' : 'disabled'}\nPython line: ${bp.pythonLine}`
          }
        }
      }))
    
    this.editor.deltaDecorations([], breakpointDecorations)
  }
}
```

## 📊 **Debug Information Display**

### **Variable Inspection**
```typescript
interface DebugVariable {
  name: string                      // Variable name in business rule
  pythonName: string               // Corresponding Python variable
  type: UnifiedType                // Detected type
  value: any                       // Current value (when debugging)
  scope: 'local' | 'global'       // Variable scope
  line: number                     // Line where defined
}

class DebugVariableInspector {
  getVariablesAtLine(line: number): DebugVariable[] {
    const variables: DebugVariable[] = []
    
    // Find all variables visible at this line using debug mapping
    const transformations = this.getTransformationsUpToLine(line) 
    
    for (const transform of transformations) {
      if (transform.type === 'variable') {
        variables.push({
          name: transform.metadata.originalText,
          pythonName: transform.metadata.generatedText,
          type: this.inferVariableType(transform),
          value: this.getCurrentValue(transform.metadata.generatedText),
          scope: this.determineScope(transform),
          line: transform.sourceRange.startLine
        })
      }
    }
    
    return variables
  }
}
```

### **Call Stack Mapping**
```typescript
interface BusinessRuleCallFrame {
  functionName: string              // Business rule function name
  pythonFunctionName: string        // Python function name
  businessRuleLine: number          // Line in business rule
  pythonLine: number               // Line in Python
  variables: DebugVariable[]        // Local variables
}

class DebugCallStackMapper {
  mapPythonStackToBusinessRule(pythonStack: any[]): BusinessRuleCallFrame[] {
    const businessRuleStack: BusinessRuleCallFrame[] = []
    
    for (const pythonFrame of pythonStack) {
      const businessRuleLocation = this.mapPythonLineToBusinessRule(
        pythonFrame.filename,
        pythonFrame.lineno
      )
      
      if (businessRuleLocation) {
        businessRuleStack.push({
          functionName: businessRuleLocation.functionName,
          pythonFunctionName: pythonFrame.name,
          businessRuleLine: businessRuleLocation.line,
          pythonLine: pythonFrame.lineno,
          variables: this.getVariablesInFrame(pythonFrame)
        })
      }
    }
    
    return businessRuleStack
  }
}
```

## 🎨 **VS Code-like Debug Experience**

### **Debug Panel Integration**
```typescript
// Create VS Code-like debug panel for business rules
interface DebugPanelState {
  isDebugging: boolean
  currentBreakpoint?: BusinessRuleBreakpoint
  callStack: BusinessRuleCallFrame[]
  variables: DebugVariable[]
  watchExpressions: string[]
}

class BusinessRuleDebugPanel {
  private state: DebugPanelState = {
    isDebugging: false,
    callStack: [],
    variables: [],
    watchExpressions: []
  }
  
  startDebugging(businessRuleCode: string): void {
    // Generate Python code with debug mapping
    const generator = new PythonCodeGenerator()
    const result = generator.generateWithMapping(businessRuleCode)
    
    // Setup debug session
    this.setupDebugSession(result.pythonCode, result.debugMapping)
    
    this.state.isDebugging = true
    this.updateUI()
  }
  
  onBreakpointHit(pythonLocation: PythonLocation): void {
    // Map Python location back to business rule
    const businessRuleLocation = this.mapPythonToBusinessRule(pythonLocation)
    
    if (businessRuleLocation) {
      // Update debug state
      this.state.currentBreakpoint = this.findBreakpointAtLocation(businessRuleLocation)
      this.state.callStack = this.getCallStack()
      this.state.variables = this.getVariables()
      
      // Highlight current line in Monaco
      this.highlightCurrentExecutionLine(businessRuleLocation.line)
      
      this.updateUI()
    }
  }
}
```

---

**The debug mapping system provides TypeScript-like debugging capabilities for business rules with precise source maps, breakpoint support, and variable inspection.** 🗺️ 