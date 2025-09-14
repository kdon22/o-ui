# 2. Schema Service - Dynamic Loading & Caching

## 🎯 **Overview**

The Schema Service provides **bulletproof schema loading** with multiple fallback strategies, advanced caching, and automatic validation for method and helper schemas.

## 📚 **Schema Loading Strategies**

### **Multi-Strategy Loading**
```typescript
// The service tries multiple loading strategies automatically:
const strategies = [
  // 1. Direct dynamic import
  () => import('@/lib/editor/schemas/methods/string-methods'),
  
  // 2. Try with .ts extension  
  () => import('@/lib/editor/schemas/methods/string-methods.ts'),
  
  // 3. Try with /index
  () => import('@/lib/editor/schemas/methods/string-methods/index'),
  
  // 4. Fallback to existing ALL_METHOD_SCHEMAS pattern
  () => import('@/lib/editor/schemas/methods').then(m => m.ALL_METHOD_SCHEMAS)
]
```

### **Export Pattern Detection**
```typescript
// Automatically detects common export patterns:
const exportPatterns = [
  'default',                    // export default schemas
  'schemas',                    // export { schemas }
  'ALL_METHOD_SCHEMAS',         // export { ALL_METHOD_SCHEMAS }
  'ALL_HELPER_SCHEMAS',         // export { ALL_HELPER_SCHEMAS }
  'STRING_METHOD_SCHEMAS',      // export { STRING_METHOD_SCHEMAS }
  'NUMBER_METHOD_SCHEMAS',      // etc.
  'ARRAY_METHOD_SCHEMAS',
  'OBJECT_METHOD_SCHEMAS'
]
```

## 🚀 **Configuration**

### **Service Configuration**
```typescript
interface SchemaServiceConfig {
  basePath: string              // Base import path
  methodPaths: string[]         // Method schema locations
  helperPaths: string[]         // Helper schema locations
  enableValidation: boolean     // Validate schemas on load
  cacheSize: number            // Maximum cached schemas
  cacheTimeoutMs?: number      // Cache TTL (optional)
  debugMode: boolean           // Enable debug logging
  retryCount?: number          // Retry attempts
  retryDelayMs?: number        // Delay between retries
}
```

### **Default Configuration**
```typescript
const defaultConfig: SchemaServiceConfig = {
  basePath: '@/lib/editor/schemas',
  methodPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/number-methods',
    '@/lib/editor/schemas/methods/array-methods',
    '@/lib/editor/schemas/methods/object-methods'
  ],
  helperPaths: ['@/lib/editor/schemas/helpers'],
  enableValidation: true,
  cacheSize: 1000,
  cacheTimeoutMs: 10 * 60 * 1000, // 10 minutes
  debugMode: false,
  retryCount: 3,
  retryDelayMs: 1000
}
```

## 🗄️ **Advanced Caching**

### **Multi-Level Cache Structure**
```typescript
interface SchemaCache {
  schemas: Map<string, UnifiedSchema>           // By ID
  byCategory: Map<string, UnifiedSchema[]>     // By category  
  byType: Map<UnifiedType, UnifiedSchema[]>    // By type
  lastUpdated: number                          // Cache timestamp
  version: string                              // Cache version
}
```

### **Cache Operations**
```typescript
// Get all schemas
const allSchemas = schemaService.getAllSchemas()

// Get schema by ID
const schema = schemaService.getSchemaById('string-to-upper')

// Get schemas by category
const stringMethods = schemaService.getSchemasByCategory('string')

// Get schemas for unified type
const strMethods = schemaService.getSchemasForType('str')

// Check cache validity
const isValid = schemaService.isCacheValid()

// Refresh if needed
await schemaService.refreshIfNeeded()
```

## 🔍 **Schema Validation**

### **Validation Rules**
```typescript
// Required fields validation
private validateSchema(schema: UnifiedSchema): void {
  if (!schema.id) throw new Error('Missing required field: id')
  if (!schema.name) throw new Error('Missing required field: name')
  if (!schema.type) throw new Error('Missing required field: type')
  if (!schema.category) throw new Error('Missing required field: category')

  // Type-specific validation
  if (schema.type === 'method') {
    const methodSchema = schema as MethodSchema
    if (!methodSchema.pythonGenerator) {
      throw new Error('Method schema missing pythonGenerator')
    }
  }

  if (schema.type === 'helper') {
    const helperSchema = schema as HelperSchema
    if (!helperSchema.helperUI) {
      throw new Error('Helper schema missing helperUI')
    }
  }
}
```

### **Error Handling**
```typescript
// Graceful error handling with continuation
const validSchemas: MethodSchema[] = []
const errors: string[] = []

for (const schema of schemas) {
  try {
    this.validateSchema(schema)
    validSchemas.push(schema)
  } catch (error) {
    errors.push(`Schema ${schema.id}: ${error}`)
    // Continue loading other schemas
  }
}

if (errors.length > 0) {
  console.warn('⚠️ Schema validation errors:', errors)
}
```

## 📊 **Usage Examples**

### **Basic Service Creation**
```typescript
import { SchemaServiceFactory } from '@/components/editor/services/monaco-editor'

// Create with default config
const schemaService = await SchemaServiceFactory.create()

// Create with custom config  
const customService = await SchemaServiceFactory.create({
  methodPaths: ['@/lib/editor/schemas/methods/custom-methods'],
  enableValidation: false,
  debugMode: true
})
```

### **Schema Access Patterns**
```typescript
// Get method schemas only
const methodSchemas = schemaService.getMethodSchemas()

// Get helper schemas only  
const helperSchemas = schemaService.getHelperSchemas()

// Get schemas for specific type with error handling
try {
  const strSchemas = schemaService.getSchemasForType('str')
  console.log(`Found ${strSchemas.length} string methods`)
} catch (error) {
  console.error('Failed to get string schemas:', error)
}
```

### **Performance Monitoring**
```typescript
// Check service health
const status = schemaService.getStatus()

console.log('Schema Service Status:', {
  initialized: status.initialized,
  cacheValid: status.cacheValid,
  totalSchemas: status.totalSchemas,
  methodSchemas: status.methodSchemas,
  helperSchemas: status.helperSchemas,
  categories: status.categories,
  lastUpdated: status.lastUpdated
})
```

## 🔄 **Retry Logic**

### **Automatic Retries**
```typescript
// Each path is tried with exponential backoff
private async performSchemaLoad(path: string): Promise<UnifiedSchema[]> {
  const maxRetries = this.config.retryCount || 3
  const retryDelay = this.config.retryDelayMs || 1000
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const schemas = await this.tryLoadStrategies(path)
      return schemas
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`)
}
```

## 🎯 **Integration Points**

### **With Type Inference Service**
```typescript
// Schema service provides schemas to type inference
const typeInferenceService = await TypeInferenceServiceFactory.create({
  schemaService: schemaService  // Dependency injection
})

// Type inference uses schemas for enhanced method lookup
const methods = await typeInferenceService.getMethodsForType('str')
```

### **With Language Service**
```typescript
// Language service uses schemas for completion generation
const languageService = await LanguageServiceFactory.create({
  dependencies: {
    schemaService,           // Provides method schemas
    typeInferenceService,    // Uses schema-enhanced type detection
    providerRegistry         // Manages provider lifecycle
  }
})
```

---

**The Schema Service provides bulletproof schema loading with intelligent fallbacks and performance optimization.** 📚 