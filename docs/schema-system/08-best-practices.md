# 🎯 Best Practices - SSOT Schema System

## 🚀 **Core Principles**

### **1. Single Source of Truth (SSOT)**
- ✅ **One interface definition per module** - Never duplicate
- ✅ **Runtime objects only** - No TypeScript interfaces for completion
- ✅ **Explicit references** - Always use `returnInterface` in schemas
- ❌ **No auto-discovery** - Explicit is better than implicit

### **2. Simplicity Over Cleverness**
- ✅ **Direct object access** - Simple hash table lookups
- ✅ **Clear naming** - Descriptive interface and property names
- ✅ **Minimal abstraction** - Avoid over-engineering
- ❌ **No complex parsing** - Keep it simple and reliable

### **3. Performance First**
- ✅ **Cache everything** - Load once, use many times
- ✅ **Lazy loading** - Load interfaces when needed
- ✅ **Fast lookups** - <1ms interface resolution
- ❌ **No real-time parsing** - Pre-process everything

## 📋 **Interface Design Best Practices**

### **Naming Conventions**

#### **Interface Names**
```typescript
// ✅ EXCELLENT: Clear, specific, follows pattern
HttpResponse          // Service + Response
DateParseResult      // Action + Result  
ValidationError      // Type + Error
FileProcessResult    // Domain + Action + Result

// ✅ GOOD: Descriptive and clear
UserProfile
ApiResponse
ProcessingResult

// ❌ AVOID: Too generic or unclear
Response            // What kind of response?
Result              // Result of what?
Data                // What data?
Object              // Not descriptive
```

#### **Property Names**
```typescript
// ✅ EXCELLENT: Clear, consistent, descriptive
{
  name: 'statusCode',      // Clear what it represents
  name: 'errorMessage',    // Specific type of message
  name: 'totalCount',      // Specific count type
  name: 'isValid',         // Boolean with clear meaning
  name: 'createdAt',       // Clear timestamp purpose
}

// ❌ AVOID: Vague or inconsistent
{
  name: 'code',           // Code for what?
  name: 'message',        // What kind of message?
  name: 'count',          // Count of what?
  name: 'valid',          // Use isValid for booleans
  name: 'created',        // Created what? When?
}
```

### **Property Type Guidelines**

#### **Use Specific Types**
```typescript
// ✅ EXCELLENT: Specific, helpful types
{ name: 'statusCode', type: 'number', description: 'HTTP status code (200, 404, 500, etc.)' }
{ name: 'isActive', type: 'boolean', description: 'Whether the item is currently active' }
{ name: 'items', type: 'array', description: 'Array of result items' }
{ name: 'metadata', type: 'object', description: 'Additional response metadata' }

// ✅ ACCEPTABLE: Generic when truly dynamic
{ name: 'data', type: 'any', description: 'Dynamic response data of any type' }

// ❌ AVOID: Vague types without good reason
{ name: 'value', type: 'any', description: 'Some value' } // Be more specific!
```

#### **Nullability and Optionality**
```typescript
// ✅ EXCELLENT: Clear nullability rules
{
  name: 'error',
  type: 'string',
  nullable: true,  // Can be null when no error
  description: 'Error message if request failed, null if successful'
}

{
  name: 'metadata',
  type: 'object',
  optional: true,  // May not be present
  description: 'Additional metadata (optional)'
}

{
  name: 'result',
  type: 'any',
  nullable: true,
  optional: true,  // Both nullable AND optional
  description: 'Processing result (optional, null if processing failed)'
}
```

### **Description Best Practices**

#### **Excellent Descriptions**
```typescript
// ✅ EXCELLENT: Detailed, helpful, includes examples
{
  name: 'statusCode',
  type: 'number',
  description: 'HTTP status code (200=success, 404=not found, 500=server error)'
}

{
  name: 'timestamp',
  type: 'number',
  description: 'Unix timestamp in milliseconds when response was generated'
}

{
  name: 'retryAfter',
  type: 'number',
  nullable: true,
  description: 'Seconds to wait before retrying (null if no retry needed)'
}
```

#### **Good Descriptions**
```typescript
// ✅ GOOD: Clear and informative
{
  name: 'totalItems',
  type: 'number',
  description: 'Total number of items in the collection'
}

{
  name: 'hasMore',
  type: 'boolean',
  description: 'Whether more items are available for pagination'
}
```

#### **Poor Descriptions**
```typescript
// ❌ POOR: Vague, redundant, or unhelpful
{
  name: 'data',
  type: 'object',
  description: 'Data object'  // Doesn't add any information!
}

{
  name: 'result',
  type: 'any',
  description: 'The result'  // What result? Of what?
}
```

## 🏗️ **Module Organization Best Practices**

### **File Structure**
```typescript
// ✅ EXCELLENT: Well-organized module file
// math.module.ts

// 1. Imports at top
import type { UnifiedSchema } from '../types'

// 2. Helper functions/validators (if needed)
export function validateMathInput(value: any): boolean { ... }

// 3. Interface definitions
export const MATH_RESULT_INTERFACE = { ... }
export const MATH_COMPARISON_INTERFACE = { ... }

// 4. Schema definitions
export const MATH_MODULE_SCHEMAS: UnifiedSchema[] = [ ... ]

// 5. Interface collection at bottom
export const MATH_MODULE_INTERFACES = {
  MathResult: MATH_RESULT_INTERFACE,
  MathComparison: MATH_COMPARISON_INTERFACE
}
```

### **Interface Grouping**
```typescript
// ✅ EXCELLENT: Logical grouping of related interfaces
export const HTTP_MODULE_INTERFACES = {
  // Response interfaces
  HttpResponse: HTTP_RESPONSE_INTERFACE,
  HttpError: HTTP_ERROR_INTERFACE,
  
  // Configuration interfaces
  HttpRequestConfig: HTTP_REQUEST_CONFIG_INTERFACE,
  HttpHeaders: HTTP_HEADERS_INTERFACE,
  
  // Result interfaces
  HttpUploadResult: HTTP_UPLOAD_RESULT_INTERFACE,
  HttpDownloadResult: HTTP_DOWNLOAD_RESULT_INTERFACE
}
```

### **Schema-Interface Consistency**
```typescript
// ✅ EXCELLENT: Consistent schema-interface mapping
export const HTTP_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'http-get',
    returnInterface: 'HttpResponse'  // ← Matches interface name exactly
  },
  {
    id: 'http-post', 
    returnInterface: 'HttpResponse'  // ← Same interface, different operation
  },
  {
    id: 'http-upload',
    returnInterface: 'HttpUploadResult'  // ← Specific interface for specific operation
  }
]
```

## 🔧 **Service Integration Best Practices**

### **SimpleInterfaceService Usage**

#### **Efficient Loading**
```typescript
// ✅ EXCELLENT: Load all modules efficiently
async loadModuleInterfaces(): Promise<void> {
  try {
    // Load all modules in parallel
    const [
      { HTTP_MODULE_INTERFACES },
      { DATE_MODULE_INTERFACES },
      { MATH_MODULE_INTERFACES },
      { JSON_MODULE_INTERFACES }
    ] = await Promise.all([
      import('../schemas/modules/http.module.ts'),
      import('../schemas/modules/date.module.ts'),
      import('../schemas/modules/math.module.ts'),
      import('../schemas/modules/json.module.ts')
    ])
    
    // Merge all interfaces
    const allInterfaces = {
      ...HTTP_MODULE_INTERFACES,
      ...DATE_MODULE_INTERFACES,
      ...MATH_MODULE_INTERFACES,
      ...JSON_MODULE_INTERFACES
    }
    
    // Cache efficiently
    for (const [name, interfaceDef] of Object.entries(allInterfaces)) {
      this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
    }
    
  } catch (error) {
    console.error('[SimpleInterfaceService] Error loading modules:', error)
  }
}
```

#### **Error Handling**
```typescript
// ✅ EXCELLENT: Robust error handling
async getInterface(name: string): Promise<InterfaceDefinition | null> {
  try {
    // Try cache first
    if (this.interfaceCache.has(name)) {
      return this.interfaceCache.get(name)!
    }
    
    // Try loading if not cached
    if (this.interfaceCache.size === 0) {
      await this.loadModuleInterfaces()
      
      if (this.interfaceCache.has(name)) {
        return this.interfaceCache.get(name)!
      }
    }
    
    // Not found
    return null
    
  } catch (error) {
    console.error(`[SimpleInterfaceService] Error getting interface ${name}:`, error)
    return null  // Graceful degradation
  }
}
```

### **User Interface Priority**
```typescript
// ✅ EXCELLENT: Clear priority system
async getInterface(name: string): Promise<InterfaceDefinition | null> {
  // 1. User interfaces (highest priority)
  const userInterface = this.userInterfaceCache.get(name)
  if (userInterface) {
    console.log(`[SimpleInterfaceService] Using user interface: ${name}`)
    return userInterface
  }
  
  // 2. Built-in interfaces (fallback)
  const builtInInterface = await this.getBuiltInInterface(name)
  if (builtInInterface) {
    console.log(`[SimpleInterfaceService] Using built-in interface: ${name}`)
    return builtInInterface
  }
  
  // 3. Not found
  console.log(`[SimpleInterfaceService] Interface not found: ${name}`)
  return null
}
```

## 🧪 **Testing Best Practices**

### **Comprehensive Test Coverage**
```typescript
// ✅ EXCELLENT: Complete test suite
describe('Interface System', () => {
  // Unit tests
  test('should load all module interfaces', async () => { ... })
  test('should handle missing interfaces gracefully', async () => { ... })
  test('should cache interfaces correctly', async () => { ... })
  
  // Integration tests
  test('should integrate with Monaco completions', async () => { ... })
  test('should support user interface priority', async () => { ... })
  
  // Performance tests
  test('should lookup interfaces in <1ms after caching', async () => { ... })
  test('should handle concurrent requests efficiently', async () => { ... })
})
```

### **Test Data Management**
```typescript
// ✅ EXCELLENT: Reusable test interfaces
const TEST_INTERFACES = {
  SimpleTest: {
    name: 'SimpleTest',
    properties: [
      { name: 'value', type: 'string', description: 'Test value' }
    ]
  },
  
  ComplexTest: {
    name: 'ComplexTest',
    properties: [
      { name: 'required', type: 'string', description: 'Required property' },
      { name: 'optional', type: 'string', optional: true, description: 'Optional property' },
      { name: 'nullable', type: 'string', nullable: true, description: 'Nullable property' }
    ]
  }
}
```

## 🚀 **Performance Optimization**

### **Caching Strategies**
```typescript
// ✅ EXCELLENT: Multi-level caching
export class SimpleInterfaceService {
  private interfaceCache = new Map<string, InterfaceDefinition>()      // Built-in interfaces
  private userInterfaceCache = new Map<string, InterfaceDefinition>()  // User interfaces
  private propertyCache = new Map<string, InterfaceProperty[]>()       // Property cache
  
  async getInterfaceProperties(name: string): Promise<InterfaceProperty[]> {
    // Check property cache first (fastest)
    if (this.propertyCache.has(name)) {
      return this.propertyCache.get(name)!
    }
    
    // Get interface and cache properties
    const interfaceDef = await this.getInterface(name)
    if (interfaceDef) {
      this.propertyCache.set(name, interfaceDef.properties)
      return interfaceDef.properties
    }
    
    return []
  }
}
```

### **Lazy Loading**
```typescript
// ✅ EXCELLENT: Load modules only when needed
private moduleLoaded = new Set<string>()

async loadModule(moduleName: string): Promise<void> {
  if (this.moduleLoaded.has(moduleName)) {
    return  // Already loaded
  }
  
  try {
    const moduleInterfaces = await import(`../schemas/modules/${moduleName}.module.ts`)
    const interfaces = moduleInterfaces[`${moduleName.toUpperCase()}_MODULE_INTERFACES`]
    
    for (const [name, interfaceDef] of Object.entries(interfaces)) {
      this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
    }
    
    this.moduleLoaded.add(moduleName)
    console.log(`[SimpleInterfaceService] Loaded ${moduleName} module`)
    
  } catch (error) {
    console.error(`[SimpleInterfaceService] Error loading ${moduleName}:`, error)
  }
}
```

## 🔒 **Security Best Practices**

### **Input Validation**
```typescript
// ✅ EXCELLENT: Validate interface definitions
function validateInterfaceDefinition(interfaceDef: any): boolean {
  if (!interfaceDef || typeof interfaceDef !== 'object') {
    return false
  }
  
  if (!interfaceDef.name || typeof interfaceDef.name !== 'string') {
    return false
  }
  
  if (!Array.isArray(interfaceDef.properties)) {
    return false
  }
  
  return interfaceDef.properties.every(validateProperty)
}

function validateProperty(prop: any): boolean {
  return prop &&
         typeof prop.name === 'string' &&
         typeof prop.type === 'string' &&
         typeof prop.description === 'string'
}
```

### **Safe User Interface Registration**
```typescript
// ✅ EXCELLENT: Secure user interface handling
async registerUserInterface(interfaceDef: InterfaceDefinition): Promise<boolean> {
  try {
    // Validate interface definition
    if (!validateInterfaceDefinition(interfaceDef)) {
      console.error('[SimpleInterfaceService] Invalid interface definition')
      return false
    }
    
    // Sanitize interface name
    const safeName = interfaceDef.name.replace(/[^a-zA-Z0-9_]/g, '')
    if (safeName !== interfaceDef.name) {
      console.error('[SimpleInterfaceService] Invalid interface name')
      return false
    }
    
    // Register safely
    this.userInterfaceCache.set(safeName, interfaceDef)
    return true
    
  } catch (error) {
    console.error('[SimpleInterfaceService] Error registering user interface:', error)
    return false
  }
}
```

## 📊 **Monitoring and Debugging**

### **Comprehensive Logging**
```typescript
// ✅ EXCELLENT: Detailed logging for debugging
async getInterface(name: string): Promise<InterfaceDefinition | null> {
  const startTime = Date.now()
  
  try {
    console.log(`[SimpleInterfaceService] Looking up interface: ${name}`)
    
    // Check user cache
    if (this.userInterfaceCache.has(name)) {
      const duration = Date.now() - startTime
      console.log(`[SimpleInterfaceService] ✅ Found user interface: ${name} (${duration}ms)`)
      return this.userInterfaceCache.get(name)!
    }
    
    // Check built-in cache
    if (this.interfaceCache.has(name)) {
      const duration = Date.now() - startTime
      console.log(`[SimpleInterfaceService] ✅ Found built-in interface: ${name} (${duration}ms)`)
      return this.interfaceCache.get(name)!
    }
    
    // Not found
    const duration = Date.now() - startTime
    console.log(`[SimpleInterfaceService] ❌ Interface not found: ${name} (${duration}ms)`)
    return null
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[SimpleInterfaceService] Error getting interface ${name} (${duration}ms):`, error)
    return null
  }
}
```

### **Performance Metrics**
```typescript
// ✅ EXCELLENT: Track performance metrics
export class SimpleInterfaceService {
  private metrics = {
    lookups: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLookupTime: 0
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      averageLookupTime: this.metrics.totalLookupTime / this.metrics.lookups,
      cacheHitRate: this.metrics.cacheHits / this.metrics.lookups
    }
  }
  
  private recordLookup(duration: number, cacheHit: boolean) {
    this.metrics.lookups++
    this.metrics.totalLookupTime += duration
    
    if (cacheHit) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
  }
}
```

---

**🎉 Congratulations! You now have a complete understanding of the SSOT Schema System. This system provides reliable, fast, and maintainable interface completions for Monaco Editor with zero auto-discovery complexity.**
