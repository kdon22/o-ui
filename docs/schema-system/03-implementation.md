# 📝 Implementation Guide - SSOT Schema System

## 🚀 **Quick Setup (5 Minutes)**

### **Step 1: Create Runtime Interface Definition**
```typescript
// In your module file (e.g., math.module.ts)

// 🎯 SSOT: Runtime Interface Definition
export const MATH_RESULT_INTERFACE = {
  name: 'MathResult',
  properties: [
    { name: 'value', type: 'number', description: 'Calculated result' },
    { name: 'precision', type: 'number', description: 'Decimal precision used' },
    { name: 'overflow', type: 'boolean', description: 'Whether overflow occurred' }
  ]
}
```

### **Step 2: Create Interface Collection**
```typescript
// At bottom of module file
export const MATH_MODULE_INTERFACES = {
  MathResult: MATH_RESULT_INTERFACE
}
```

### **Step 3: Reference in Schemas**
```typescript
// In your module schemas
{
  id: 'math-add',
  module: 'math',
  name: 'add',
  returnInterface: 'MathResult', // ← Points to runtime definition
  parameters: [...]
}
```

### **Step 4: Register with Service**
```typescript
// In SimpleInterfaceService.loadModuleInterfaces()
const { MATH_MODULE_INTERFACES } = await import('../schemas/modules/math.module.ts')

// Add to cache
for (const [name, interfaceDef] of Object.entries(MATH_MODULE_INTERFACES)) {
  this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
}
```

**Done!** Your interface will now show up in Monaco completions.

## 📋 **Detailed Implementation Steps**

### **Step 1: Define Interface Properties**

#### **Basic Property**
```typescript
{ 
  name: 'statusCode', 
  type: 'number', 
  description: 'HTTP status code (200, 404, 500, etc.)' 
}
```

#### **Nullable Property**
```typescript
{ 
  name: 'error', 
  type: 'string', 
  nullable: true, 
  description: 'Error message if request failed, null if successful' 
}
```

#### **Optional Property**
```typescript
{ 
  name: 'metadata', 
  type: 'object', 
  optional: true, 
  description: 'Additional metadata (optional)' 
}
```

#### **Complex Property**
```typescript
{ 
  name: 'headers', 
  type: 'object', 
  description: 'HTTP response headers',
  // Future: nestedInterface: 'HttpHeaders'
}
```

### **Step 2: Create Complete Interface Definition**

#### **Simple Interface**
```typescript
export const DATE_PARSE_RESULT_INTERFACE = {
  name: 'DateParseResult',
  properties: [
    { name: 'year', type: 'number', description: 'Year component' },
    { name: 'month', type: 'number', description: 'Month component (1-12)' },
    { name: 'day', type: 'number', description: 'Day component' },
    { name: 'timestamp', type: 'number', description: 'Unix timestamp' }
  ]
}
```

#### **Complex Interface with Optional/Nullable**
```typescript
export const API_RESPONSE_INTERFACE = {
  name: 'ApiResponse',
  properties: [
    { name: 'success', type: 'boolean', description: 'Whether request succeeded' },
    { name: 'data', type: 'object', nullable: true, description: 'Response data if successful' },
    { name: 'error', type: 'string', nullable: true, description: 'Error message if failed' },
    { name: 'metadata', type: 'object', optional: true, description: 'Additional response metadata' },
    { name: 'timestamp', type: 'number', description: 'Response timestamp' }
  ]
}
```

### **Step 3: Create Module Interface Collection**

#### **Single Interface Module**
```typescript
// For modules with one interface
export const JSON_MODULE_INTERFACES = {
  JsonParseResult: JSON_PARSE_RESULT_INTERFACE
}
```

#### **Multiple Interface Module**
```typescript
// For modules with multiple interfaces
export const HTTP_MODULE_INTERFACES = {
  HttpResponse: HTTP_RESPONSE_INTERFACE,
  HttpHeaders: HTTP_HEADERS_INTERFACE,
  HttpError: HTTP_ERROR_INTERFACE
}
```

### **Step 4: Update Schema Definitions**

#### **Replace returnObject with returnInterface**
```typescript
// ❌ OLD: Dual system
{
  id: 'http-get',
  returnInterface: 'HttpResponse',
  returnObject: {
    name: 'HttpResponse',
    properties: { ... } // ← Remove this!
  }
}

// ✅ NEW: Single source of truth
{
  id: 'http-get',
  returnInterface: 'HttpResponse' // ← Only this needed
}
```

#### **Multiple Schemas, Same Interface**
```typescript
// Multiple schemas can reference the same interface
export const HTTP_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'http-get',
    returnInterface: 'HttpResponse' // ← Same interface
  },
  {
    id: 'http-post',
    returnInterface: 'HttpResponse' // ← Same interface
  },
  {
    id: 'http-put',
    returnInterface: 'HttpResponse' // ← Same interface
  }
]
```

### **Step 5: Register with Interface Service**

#### **Add to loadModuleInterfaces()**
```typescript
// In SimpleInterfaceService.loadModuleInterfaces()
async loadModuleInterfaces(): Promise<void> {
  try {
    // Load existing modules
    const { HTTP_MODULE_INTERFACES } = await import('../schemas/modules/http.module.ts')
    const { DATE_MODULE_INTERFACES } = await import('../schemas/modules/date.module.ts')
    
    // Add your new module
    const { MATH_MODULE_INTERFACES } = await import('../schemas/modules/math.module.ts')
    
    // Cache all interfaces
    const allInterfaces = {
      ...HTTP_MODULE_INTERFACES,
      ...DATE_MODULE_INTERFACES,
      ...MATH_MODULE_INTERFACES // ← Add your module
    }
    
    for (const [name, interfaceDef] of Object.entries(allInterfaces)) {
      this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
      console.log(`[SimpleInterfaceService] ✅ Loaded interface: ${name}`)
    }
    
  } catch (error) {
    console.error('[SimpleInterfaceService] Error loading module interfaces:', error)
  }
}
```

## 🧪 **Testing Your Implementation**

### **Step 1: Test Interface Loading**
```typescript
// Test in Node.js or browser console
const { simpleInterfaceService } = require('./src/lib/editor/services/simple-interface-service.ts')

// Test interface exists
const hasInterface = await simpleInterfaceService.hasInterface('MathResult')
console.log('Interface exists:', hasInterface) // Should be true

// Test interface properties
const properties = await simpleInterfaceService.getInterfaceProperties('MathResult')
console.log('Properties:', properties) // Should show your properties
```

### **Step 2: Test Schema Integration**
```typescript
// Test schema references interface correctly
const { MATH_MODULE_SCHEMAS } = require('./src/lib/editor/schemas/modules/math.module.ts')
const schema = MATH_MODULE_SCHEMAS.find(s => s.id === 'math-add')
console.log('Return interface:', schema.returnInterface) // Should be 'MathResult'
```

### **Step 3: Test Completion Integration**
```typescript
// Test unified schema service integration
const { unifiedSchemaService } = require('./src/lib/editor/services/unified-schema-service.ts')
const properties = await unifiedSchemaService.getInterfaceProperties('MathResult')
console.log('Unified service properties:', properties) // Should show converted properties
```

## 🔧 **Common Implementation Patterns**

### **Pattern 1: Simple Return Type**
```typescript
// For functions that return a single value type
export const STRING_RESULT_INTERFACE = {
  name: 'StringResult',
  properties: [
    { name: 'value', type: 'string', description: 'The resulting string' },
    { name: 'length', type: 'number', description: 'Length of the string' }
  ]
}
```

### **Pattern 2: Success/Error Pattern**
```typescript
// For operations that can succeed or fail
export const OPERATION_RESULT_INTERFACE = {
  name: 'OperationResult',
  properties: [
    { name: 'success', type: 'boolean', description: 'Whether operation succeeded' },
    { name: 'result', type: 'any', nullable: true, description: 'Result data if successful' },
    { name: 'error', type: 'string', nullable: true, description: 'Error message if failed' }
  ]
}
```

### **Pattern 3: Collection Response**
```typescript
// For operations that return collections
export const LIST_RESULT_INTERFACE = {
  name: 'ListResult',
  properties: [
    { name: 'items', type: 'array', description: 'Array of result items' },
    { name: 'count', type: 'number', description: 'Total number of items' },
    { name: 'hasMore', type: 'boolean', description: 'Whether more items are available' }
  ]
}
```

### **Pattern 4: Metadata Pattern**
```typescript
// For operations that include metadata
export const ENRICHED_RESULT_INTERFACE = {
  name: 'EnrichedResult',
  properties: [
    { name: 'data', type: 'any', description: 'Primary result data' },
    { name: 'metadata', type: 'object', description: 'Additional metadata' },
    { name: 'timestamp', type: 'number', description: 'When result was generated' },
    { name: 'source', type: 'string', description: 'Source of the data' }
  ]
}
```

## ⚠️ **Common Pitfalls**

### **1. Forgetting to Export Interface Collection**
```typescript
// ❌ WRONG: Interface defined but not exported in collection
export const MY_INTERFACE = { ... }
// Missing: export const MY_MODULE_INTERFACES = { MyInterface: MY_INTERFACE }

// ✅ CORRECT: Always export the collection
export const MY_MODULE_INTERFACES = {
  MyInterface: MY_INTERFACE
}
```

### **2. Typo in Interface Name**
```typescript
// ❌ WRONG: Typo in schema reference
{
  returnInterface: 'HttpRespons' // ← Missing 'e'
}

// ✅ CORRECT: Exact match with interface name
{
  returnInterface: 'HttpResponse' // ← Matches HTTP_RESPONSE_INTERFACE.name
}
```

### **3. Forgetting to Register Module**
```typescript
// ❌ WRONG: Interface defined but not loaded by service
// Missing import in SimpleInterfaceService.loadModuleInterfaces()

// ✅ CORRECT: Always add to loadModuleInterfaces()
const { MY_MODULE_INTERFACES } = await import('../schemas/modules/my.module.ts')
```

---

**Next: Read [Adding Interfaces](./04-adding-interfaces.md) to learn advanced interface patterns.**
