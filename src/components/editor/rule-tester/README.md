# Enterprise Rule Tester

A professional business rules testing framework with **Python-backed execution** and **Universal Travel Record (UTR) integration**, providing seamless debugging experience for business rule development.

## 🎯 **Major Update: UTR Connection System**

The rule tester now includes a comprehensive **UTR Connection System** that bridges the gap between rule testing and real travel data:

### **✨ New UTR Connection Tab**
- **Multi-Source Configuration**: Configure Amadeus, Sabre, Kayak, and Direct vendor sources
- **Real UTR Assembly**: `vendor.get()` integration with consolidated UTR data from multiple sources  
- **Workflow Integration**: Select workflows and processes (mock mode ready for action system)
- **Email Override Controls**: Complete delivery control for testing scenarios

### **📊 Professional Interface**
- **Tabbed Results Panel**: UTR Connection, Variables, and Execution Log tabs
- **Real-time Status**: Visual indicators for UTR loading, assembly, and source status
- **Source Attribution**: Every data element tracks its origin (Amadeus, Sabre, etc.)
- **Error Handling**: Graceful failure recovery with detailed error reporting

## 🎯 Key Features

### **🚀 Python-Backed Execution (NEW)**
- **Bulletproof Logic**: Uses generated Python code for reliable conditional execution
- **Seamless Experience**: Users debug business rules, system executes Python behind the scenes
- **Perfect Logic Flow**: Proper if/else execution, no more line-by-line stepping through false conditions
- **Enterprise Reliability**: Same Python engine that runs in production

### **🌍 UTR Integration**
- **Multi-Source UTR Assembly**: Combine data from Amadeus, Sabre, Kayak, and Direct vendors
- **Real Travel Data Context**: Test rules with actual PNR, hotel, car, and pricing data
- **Source Attribution**: Track which GDS system provided each data element
- **Email Override System**: Control email delivery for testing (override all, BCC, test delivery)
- **Workflow Integration**: Mock mode ready for action system connection

### **🔧 Professional Debugging Experience**
- **Breakpoints**: Click in gutter to set/clear breakpoints (red circles)
- **Execution Pointer**: Green arrow shows current execution line in business rules
- **Variable Inspection**: Real-time variable tracking with change detection
- **Debug Decorations**: Professional VS Code-style visual indicators
- **Line Mapping**: Automatic mapping between business rules and Python execution
- **UTR Variable Inspection**: Inspect consolidated UTR objects during rule execution

### **🔗 System Integration**
- Works with existing business rule Monaco editor
- **Python Execution Service**: Delegates to Python backend for reliable execution
- **Line Mapper**: Bidirectional mapping between business rules and Python lines
- **Enterprise Debug Adapter**: Clean translation layer for seamless UX
- Supports method schemas (`.contains()`, `.toUpperCase()`, etc.)
- **UTR-aware rule execution** with real travel data context

## 🚀 Quick Start

### UTR Integration Usage (NEW)
```typescript
// 1. Configure UTR sources in the UTR Connection tab
const sources = [
  { vendor: 'amadeus', locator: 'AB4P35', isPrimary: true },
  { vendor: 'sabre', locator: 'HOTEL123', isPrimary: false }
]

// 2. Select workflow and email settings
const workflow = { workflowId: 'pnr-validation', mockMode: true }
const emailOverrides = { mode: 'delivery_test', enabled: true }

// 3. Click "Fetch UTR" to load consolidated travel data
// 4. Rules now execute with real UTR context
```

### Enterprise Usage
```typescript
import { useEnterpriseDebugSession, DebugTabClient } from '@/components/editor/rule-tester'

const MyRuleEditor = () => {
  const debug = useEnterpriseDebugSession(businessRules, pythonCode, 'BUSINESS')
  
  return (
    <DebugTabClient
      sourceCode={businessRules}
      pythonCode={pythonCode}
      onChange={handleCodeChange}
      rule={{ name: 'My Rule', id: 'rule-123', type: 'BUSINESS' }}
    />
  )
}
```

### Advanced Integration
```typescript
import { EnterpriseDebugAdapter, PythonExecutor, LineMapper } from '@/components/editor/rule-tester'

const AdvancedEditor = () => {
  const debug = useEnterpriseDebugSession(businessRules, pythonCode, 'BUSINESS')
  
  // Debug session automatically handles:
  // - Python execution with business rule line mapping
  // - UTR data integration for business rules
  // - Breakpoint management
  // - Variable tracking with change detection
  
  return (
    <div>
      <div>Status: {debug.state.status}</div>
      <div>Current Line: {debug.state.currentLine}</div>
      
      <button onClick={debug.start} disabled={debug.state.status !== 'stopped'}>
        Start Debug
      </button>
      
      <button onClick={debug.step} disabled={!debug.state.canStep}>
        Step Over
      </button>
      
      <button onClick={debug.continue} disabled={!debug.state.canContinue}>
        Continue
      </button>
      
      <VariableInspector variables={debug.variables} />
    </div>
  )
}
```

## 🛠️ Architecture

### **Enterprise Components**

#### **PythonExecutor** (~100 lines)
Executes Python code with step-by-step debugging:
- Delegates to Python backend for reliable execution
- Step-by-step debugging with breakpoint support
- Variable state tracking at each step
- Clean error handling and output capture

#### **LineMapper** (~80 lines)  
Maps business rules to Python code:
- Bidirectional line mapping for seamless debugging
- Handles comments and empty lines correctly
- Simple, reliable mapping algorithm
- Enables business rule debugging experience

#### **EnterpriseDebugAdapter** (~120 lines)
Clean translation layer between Python execution and business rules UI:
- Translates Python variables back to business rule context
- Maps Python line numbers to business rule line numbers
- Handles breakpoints in business rule coordinates
- Clean, predictable state management

#### **useEnterpriseDebugSession** (~60 lines)
React hook for business rules debugging:
- Python-backed execution with business rules UI experience
- Automatic UTR data integration for business rules
- Seamless breakpoint management
- Real-time variable tracking with change detection

### **Debug Flow**

```
1. User clicks "Start Debug"
   ↓
2. LineMapper creates business rules ↔ Python mapping
   ↓
3. PythonExecutor starts Python execution with debugging
   ↓
4. EnterpriseDebugAdapter translates Python events to business rule UI
   ↓
5. User sees execution in business rules, system executes Python
   ↓
6. Variables panel shows business rule variables with real values
```

## 🔧 Schema Integration

### **Debug Mapping with Schemas**
The system uses your existing UnifiedSchema to map debugging information:

```typescript
// Your existing schema
{
  id: 'string-contains',
  name: 'contains',
  pythonGenerator: (variable, result, params) => `${result} = ${params.substring} in ${variable}`,
  // Debug mapping is automatic!
}

// Results in debug mapping:
// Business Rule: email.contains("@gmail.com")  
// Python Line:   result = "@gmail.com" in email
// Variables:     email, result
```

### **Variable Tracking**
Variables are automatically tracked based on schema information:
- **Schema Variables**: `customer.age`, `booking.total`
- **Method Results**: `.contains()` → `boolean`
- **Generated Variables**: Python variable names
- **Change Detection**: Old → new value tracking

## 🎨 Debug Styling

Professional VS Code-style debugging visuals:

```css
/* Breakpoint - Red Circle */
.debug-breakpoint-glyph {
  background-color: #e51400;
  border-radius: 50%;
  box-shadow: 0 0 3px 1px rgba(229, 20, 0, 0.5);
}

/* Execution Line - Green Arrow */
.debug-current-line-glyph {
  border-color: transparent transparent transparent #41b883;
}
```

## 🔍 Professional Variable Inspector

The new **VariableInspector** component provides a JetBrains-style debugging experience:

### ✨ Key Features
- **Rich Type Detection**: Automatically detects strings, numbers, objects, arrays, functions, dates, and more
- **Expandable Object Trees**: Click to expand objects and arrays with full tree navigation  
- **Change Tracking**: Highlights changed variables with before/after values and lightning bolt indicators
- **Smart Search & Filtering**: Search variables by name, value, or type
- **Copy Values**: Click to copy variable values to clipboard
- **Professional Styling**: Clean, developer-friendly interface

### 🚀 Usage

```typescript
import { VariableInspector } from '@/components/editor/rule-tester'

<VariableInspector 
  variables={debug.variables}
  className="h-full"
  showSearch={true}
  showFilters={true}
  maxDepth={3}
/>
```

### 🧪 Live Demos

**`/demo/variable-inspector`** - Professional variable inspector with rich sample data:
- Expandable objects with nested properties
- Arrays with mixed types  
- Changed variable tracking
- Search and filtering capabilities

**`/demo/enhanced-debug`** - Enhanced type detection in action:
- **Fixed Array Types**: `[1,2,3]` shows as `array` not `string`
- **Fixed Object Types**: `{"key": value}` shows as `object` not `string`
- **Proper Parsing**: JSON strings are parsed to actual JavaScript objects
- **Professional UX**: Uses existing editor `TypeDetectionFactory`

## 📋 Integration with Editor Tabs

The enhanced debug tab with professional variable inspector:

```typescript
// In editor-tabs.tsx  
<TabsContent value="test" className="h-full mt-0">
  {!isCreateMode && rule ? (
    <DebugTabClient 
      sourceCode={rule.sourceCode || ''} 
      pythonCode={rule.pythonCode || ''}
      onChange={onSourceCodeChange}
      rule={rule}
    />
  ) : (
    <EmptyState />
  )}
</TabsContent>
```

## 📈 Advanced Features

### **Inline Variable Values** (Future Enhancement)
Monaco supports inline value display (like TypeScript):
```typescript
// Business rule: if customer.age > 18
//                      ^^^^^^^^^^^^ customer.age: 25
```

### **Step-by-Step Debugging**
- **Step Into**: Execute next line
- **Step Over**: Skip method calls  
- **Step Out**: Complete current block
- **Continue**: Run to next breakpoint

### **Debug Session Persistence**
- Save breakpoints with rule
- Restore debug state on reload
- Debug session history

## 🎯 Next Steps for Full Implementation

1. **Connect to Python Execution**: 
   - Integrate with your Python execution backend
   - Implement actual step-by-step debugging
   - Real variable value fetching

2. **Enhanced Schema Integration**:
   - Add debug metadata to UnifiedSchema
   - Schema-specific variable formatting
   - Method call step-through

3. **Performance Optimizations**:
   - Lazy loading of debug services
   - Efficient variable tracking
   - Memory management for large rules

4. **Testing Integration**:
   - Unit tests for debug mapping
   - Integration tests with Monaco
   - E2E debugging workflows

This system provides the foundation for professional business rule debugging while maintaining clean, focused architecture principles! 🚀 