# 🧪 Testing Guide - SSOT Schema System

## 🎯 **Testing Overview**

This guide covers comprehensive testing strategies for the SSOT schema system, from unit tests to integration testing and Monaco Editor validation.

## 🚀 **Quick Validation (2 Minutes)**

### **Test 1: Interface Loading**
```bash
# In o-ui directory
cd o-ui
node -e "
(async () => {
  const { simpleInterfaceService } = require('./src/lib/editor/services/simple-interface-service.ts');
  const properties = await simpleInterfaceService.getInterfaceProperties('HttpResponse');
  console.log('✅ HttpResponse properties:', properties.map(p => p.name));
})();
"
```

### **Test 2: Schema Integration**
```bash
node -e "
const { HTTP_MODULE_SCHEMAS } = require('./src/lib/editor/schemas/modules/http.module.ts');
const schema = HTTP_MODULE_SCHEMAS.find(s => s.id === 'http-get');
console.log('✅ Schema returnInterface:', schema.returnInterface);
"
```

### **Test 3: Unified Service Integration**
```bash
node -e "
(async () => {
  const { unifiedSchemaService } = require('./src/lib/editor/services/unified-schema-service.ts');
  const properties = await unifiedSchemaService.getInterfaceProperties('HttpResponse');
  console.log('✅ Unified service properties:', properties?.map(p => p.name));
})();
"
```

## 📋 **Comprehensive Test Suite**

### **Unit Tests: SimpleInterfaceService**

#### **Test: Interface Loading and Caching**
```typescript
// test/simple-interface-service.test.ts
import { SimpleInterfaceService } from '../src/lib/editor/services/simple-interface-service'

describe('SimpleInterfaceService', () => {
  let service: SimpleInterfaceService
  
  beforeEach(() => {
    service = new SimpleInterfaceService()
  })
  
  test('should load HTTP interfaces', async () => {
    const httpResponse = await service.getInterface('HttpResponse')
    
    expect(httpResponse).toBeDefined()
    expect(httpResponse?.name).toBe('HttpResponse')
    expect(httpResponse?.properties).toHaveLength(3)
    expect(httpResponse?.properties.map(p => p.name)).toContain('statusCode')
    expect(httpResponse?.properties.map(p => p.name)).toContain('error')
    expect(httpResponse?.properties.map(p => p.name)).toContain('response')
  })
  
  test('should return null for non-existent interface', async () => {
    const result = await service.getInterface('NonExistentInterface')
    expect(result).toBeNull()
  })
  
  test('should cache interfaces after first load', async () => {
    // First call loads from module
    const first = await service.getInterface('HttpResponse')
    
    // Second call should come from cache (faster)
    const start = Date.now()
    const second = await service.getInterface('HttpResponse')
    const duration = Date.now() - start
    
    expect(second).toEqual(first)
    expect(duration).toBeLessThan(5) // Should be very fast from cache
  })
  
  test('should get interface properties', async () => {
    const properties = await service.getInterfaceProperties('HttpResponse')
    
    expect(properties).toHaveLength(3)
    expect(properties[0]).toHaveProperty('name')
    expect(properties[0]).toHaveProperty('type')
    expect(properties[0]).toHaveProperty('description')
  })
  
  test('should list all interface names', async () => {
    const names = await service.getAllInterfaceNames()
    
    expect(names).toContain('HttpResponse')
    expect(names.length).toBeGreaterThan(0)
  })
})
```

#### **Test: Interface Property Validation**
```typescript
describe('Interface Property Validation', () => {
  test('HttpResponse properties should have correct types', async () => {
    const service = new SimpleInterfaceService()
    const properties = await service.getInterfaceProperties('HttpResponse')
    
    const statusCode = properties.find(p => p.name === 'statusCode')
    expect(statusCode?.type).toBe('number')
    expect(statusCode?.description).toContain('HTTP status code')
    
    const error = properties.find(p => p.name === 'error')
    expect(error?.type).toBe('string')
    expect(error?.nullable).toBe(true)
    
    const response = properties.find(p => p.name === 'response')
    expect(response?.type).toBe('object')
  })
  
  test('should handle nullable and optional properties', async () => {
    // Test with interface that has nullable/optional properties
    const service = new SimpleInterfaceService()
    
    // Mock interface with nullable/optional properties
    const mockInterface = {
      name: 'TestInterface',
      properties: [
        { name: 'required', type: 'string', description: 'Required property' },
        { name: 'nullable', type: 'string', nullable: true, description: 'Nullable property' },
        { name: 'optional', type: 'string', optional: true, description: 'Optional property' },
        { name: 'both', type: 'string', nullable: true, optional: true, description: 'Both nullable and optional' }
      ]
    }
    
    await service.registerUserInterface(mockInterface)
    const properties = await service.getInterfaceProperties('TestInterface')
    
    const nullable = properties.find(p => p.name === 'nullable')
    expect(nullable?.nullable).toBe(true)
    
    const optional = properties.find(p => p.name === 'optional')
    expect(optional?.optional).toBe(true)
    
    const both = properties.find(p => p.name === 'both')
    expect(both?.nullable).toBe(true)
    expect(both?.optional).toBe(true)
  })
})
```

### **Integration Tests: Schema System**

#### **Test: Schema to Interface Resolution**
```typescript
// test/schema-integration.test.ts
import { HTTP_MODULE_SCHEMAS } from '../src/lib/editor/schemas/modules/http.module'
import { simpleInterfaceService } from '../src/lib/editor/services/simple-interface-service'

describe('Schema Integration', () => {
  test('all schemas with returnInterface should resolve to valid interfaces', async () => {
    const schemasWithInterfaces = HTTP_MODULE_SCHEMAS.filter(s => s.returnInterface)
    
    for (const schema of schemasWithInterfaces) {
      const interfaceDef = await simpleInterfaceService.getInterface(schema.returnInterface!)
      
      expect(interfaceDef).toBeDefined()
      expect(interfaceDef?.name).toBe(schema.returnInterface)
      expect(interfaceDef?.properties.length).toBeGreaterThan(0)
    }
  })
  
  test('should not have any returnObject definitions in schemas', () => {
    // Ensure we've removed all returnObject definitions
    const schemasWithReturnObject = HTTP_MODULE_SCHEMAS.filter(s => s.returnObject)
    expect(schemasWithReturnObject).toHaveLength(0)
  })
  
  test('schema IDs should match expected patterns', () => {
    HTTP_MODULE_SCHEMAS.forEach(schema => {
      expect(schema.id).toMatch(/^http-\w+$/)
      expect(schema.module).toBe('http')
      expect(schema.category).toBe('http')
    })
  })
})
```

#### **Test: UnifiedSchemaService Integration**
```typescript
describe('UnifiedSchemaService Integration', () => {
  test('should get interface properties through unified service', async () => {
    const { unifiedSchemaService } = await import('../src/lib/editor/services/unified-schema-service')
    
    const properties = await unifiedSchemaService.getInterfaceProperties('HttpResponse')
    
    expect(properties).toBeDefined()
    expect(properties?.length).toBeGreaterThan(0)
    
    // Should convert to PropertyDefinition format
    properties?.forEach(prop => {
      expect(prop).toHaveProperty('name')
      expect(prop).toHaveProperty('type')
      expect(prop).toHaveProperty('description')
      expect(prop).toHaveProperty('nullable')
      expect(prop).toHaveProperty('optional')
      expect(prop).toHaveProperty('isCollection')
    })
  })
})
```

### **Performance Tests**

#### **Test: Interface Lookup Performance**
```typescript
describe('Performance Tests', () => {
  test('interface lookup should be fast after caching', async () => {
    const service = new SimpleInterfaceService()
    
    // First call (loads from module)
    const start1 = Date.now()
    await service.getInterface('HttpResponse')
    const firstCallDuration = Date.now() - start1
    
    // Subsequent calls (from cache)
    const start2 = Date.now()
    await service.getInterface('HttpResponse')
    const cachedCallDuration = Date.now() - start2
    
    expect(cachedCallDuration).toBeLessThan(firstCallDuration)
    expect(cachedCallDuration).toBeLessThan(5) // Should be very fast
  })
  
  test('should handle multiple concurrent requests', async () => {
    const service = new SimpleInterfaceService()
    
    // Make multiple concurrent requests
    const promises = Array(10).fill(0).map(() => 
      service.getInterface('HttpResponse')
    )
    
    const results = await Promise.all(promises)
    
    // All should return the same result
    results.forEach(result => {
      expect(result).toEqual(results[0])
    })
  })
})
```

## 🎯 **Monaco Editor Integration Tests**

### **Test: Completion Provider Integration**
```typescript
// test/monaco-integration.test.ts
import * as monaco from 'monaco-editor'

describe('Monaco Editor Integration', () => {
  let editor: monaco.editor.IStandaloneCodeEditor
  
  beforeEach(() => {
    // Create test editor
    const container = document.createElement('div')
    editor = monaco.editor.create(container, {
      value: '',
      language: 'business-rules'
    })
  })
  
  afterEach(() => {
    editor.dispose()
  })
  
  test('should provide completions for HttpResponse interface', async () => {
    // Set editor content
    editor.setValue('const result = http.get("https://api.example.com")\nresult.')
    
    // Position cursor after "result."
    const position = new monaco.Position(2, 8)
    editor.setPosition(position)
    
    // Get completions
    const completions = await monaco.languages.getCompletionItems(
      'business-rules',
      editor.getModel()!,
      position
    )
    
    // Should include HttpResponse properties
    const suggestions = completions.suggestions
    const labels = suggestions.map(s => s.label)
    
    expect(labels).toContain('statusCode')
    expect(labels).toContain('error')
    expect(labels).toContain('response')
  })
  
  test('completion items should have correct details', async () => {
    // Test that completion items have proper type information
    editor.setValue('const result = http.get("url")\nresult.')
    const position = new monaco.Position(2, 8)
    
    const completions = await monaco.languages.getCompletionItems(
      'business-rules',
      editor.getModel()!,
      position
    )
    
    const statusCode = completions.suggestions.find(s => s.label === 'statusCode')
    expect(statusCode?.detail).toContain('number')
    
    const error = completions.suggestions.find(s => s.label === 'error')
    expect(error?.detail).toContain('string')
    expect(error?.detail).toContain('null')
  })
})
```

## 🔧 **Manual Testing Procedures**

### **Test 1: Basic Interface Completion**
1. **Open Monaco Editor** with business rules language
2. **Type**: `const result = http.get("https://api.example.com")`
3. **Press Enter and type**: `result.`
4. **Verify**: Completion popup shows `statusCode`, `error`, `response`
5. **Select `statusCode`** and verify it completes correctly

### **Test 2: Multiple Interface Types**
1. **Type**: `const httpResult = http.get("url")`
2. **Type**: `const dateResult = date.parse("2024-01-01")`
3. **Test `httpResult.`** shows HTTP interface properties
4. **Test `dateResult.`** shows Date interface properties
5. **Verify**: Different interfaces show different properties

### **Test 3: Nested Property Access**
1. **Type**: `const result = http.get("url")`
2. **Type**: `result.response.`
3. **Verify**: Shows object properties (if implemented)
4. **Test error handling**: `result.error.` should show string methods

### **Test 4: Interface Override (User Utilities)**
1. **Create user utility** with return interface `HttpResponse`
2. **Add custom properties** to user interface
3. **Test completion** shows user properties instead of built-in
4. **Verify priority**: User interface overrides built-in

## 🐛 **Debugging Common Issues**

### **Issue 1: Interface Not Found**
```typescript
// Debug: Check if interface is loaded
const service = new SimpleInterfaceService()
const allNames = await service.getAllInterfaceNames()
console.log('Available interfaces:', allNames)

// Check if specific interface exists
const hasInterface = await service.hasInterface('YourInterfaceName')
console.log('Interface exists:', hasInterface)
```

### **Issue 2: Properties Not Showing**
```typescript
// Debug: Check interface properties
const properties = await service.getInterfaceProperties('YourInterfaceName')
console.log('Interface properties:', properties)

// Check property structure
properties.forEach(prop => {
  console.log(`${prop.name}: ${prop.type} - ${prop.description}`)
})
```

### **Issue 3: Schema Not Referencing Interface**
```typescript
// Debug: Check schema configuration
const { YOUR_MODULE_SCHEMAS } = require('./path/to/your.module.ts')
const schema = YOUR_MODULE_SCHEMAS.find(s => s.id === 'your-schema-id')
console.log('Schema returnInterface:', schema?.returnInterface)

// Check if returnObject exists (should be removed)
console.log('Schema returnObject (should be undefined):', schema?.returnObject)
```

### **Issue 4: Service Not Loading Interfaces**
```typescript
// Debug: Check module loading
const service = new SimpleInterfaceService()

// Force load and check for errors
try {
  await service.loadModuleInterfaces()
  console.log('Modules loaded successfully')
} catch (error) {
  console.error('Module loading error:', error)
}
```

## 📊 **Test Coverage Requirements**

### **Unit Test Coverage**
- ✅ **Interface loading** from all modules
- ✅ **Property retrieval** with correct types
- ✅ **Caching behavior** and performance
- ✅ **Error handling** for missing interfaces
- ✅ **User interface registration** and priority

### **Integration Test Coverage**
- ✅ **Schema to interface resolution** for all modules
- ✅ **UnifiedSchemaService integration** 
- ✅ **Monaco completion provider** integration
- ✅ **User utility interface** loading and override

### **Performance Test Coverage**
- ✅ **Interface lookup speed** (<5ms cached)
- ✅ **Concurrent request handling**
- ✅ **Memory usage** with large interface sets
- ✅ **Cache efficiency** and hit rates

---

**Next: Read [Migration Guide](./07-migration.md) to learn how to migrate from legacy systems.**
