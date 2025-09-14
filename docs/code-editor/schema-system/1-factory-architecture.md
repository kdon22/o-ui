# 1. Factory Architecture - Dependency Injection System

## 🎯 **Overview**

The Monaco Service Factory uses **dependency injection** to create bulletproof, testable services with proper lifecycle management and error recovery.

## 🏗️ **Factory Pattern**

### **Service Creation Flow**
```
MonacoServiceFactory.initialize()
├── 1. Provider Registry    → Foundation layer
├── 2. Schema Service       → Data layer  
├── 3. Type Inference       → Intelligence layer
├── 4. Language Service     → Feature layer
└── 5. Monaco Service       → Orchestration layer
```

### **Dependency Graph**
```
Monaco Service
├── depends on → Language Service
│   ├── depends on → Provider Registry
│   ├── depends on → Schema Service  
│   └── depends on → Type Inference Service
│       └── depends on → Schema Service
```

## 🔧 **Factory Configuration**

### **Configuration Interface**
```typescript
interface MonacoServiceFactoryConfig {
  // Core settings
  enableTypeInference: boolean
  enableSchemaValidation: boolean
  enableDebugMode: boolean
  
  // Performance settings
  maxCacheSize: number
  cacheTimeoutMs: number
  maxRetries: number
  
  // Schema paths
  schemaBasePath: string
  methodSchemaPaths: string[]
  helperSchemaPaths: string[]
  
  // Provider settings
  maxCompletionItems: number
  completionTimeout: number
  hoverTimeout: number
}
```

### **Default Configuration**
```typescript
const defaultConfig: MonacoServiceFactoryConfig = {
  enableTypeInference: true,
  enableSchemaValidation: true,
  enableDebugMode: false,
  maxCacheSize: 1000,
  cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  schemaBasePath: '@/lib/editor/schemas',
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/number-methods',
    '@/lib/editor/schemas/methods/array-methods',
    '@/lib/editor/schemas/methods/object-methods'
  ],
  helperSchemaPaths: ['@/lib/editor/schemas/helpers'],
  maxCompletionItems: 50,
  completionTimeout: 1000,
  hoverTimeout: 500
}
```

## 🚀 **Usage Examples**

### **Basic Initialization**
```typescript
import { getMonacoServiceFactory } from '@/components/editor/services/monaco-editor'

// Get singleton factory
const factory = getMonacoServiceFactory()

// Initialize with Monaco instance
await factory.initialize(monaco)

// Services are now ready
const status = factory.getStatus()
console.log('Services initialized:', status.initialized)
```

### **Custom Configuration**
```typescript
const factory = getMonacoServiceFactory({
  enableDebugMode: true,
  maxCacheSize: 2000,
  completionTimeout: 500,
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/custom-methods'
  ]
})

await factory.initialize(monaco)
```

### **Service Access**
```typescript
// Get specific services
const schemaService = factory.getService<SchemaService>('schemaService')
const typeInference = factory.getService<TypeInferenceService>('typeInferenceService')
const providerRegistry = factory.getService<ProviderRegistry>('providerRegistry')

// Check service status
const schemaStatus = schemaService?.getStatus()
const typeStatus = typeInference?.getStatus()
```

## 🔄 **Error Recovery**

### **Graceful Degradation**
```typescript
// Factory handles service failures gracefully
try {
  await factory.initialize(monaco)
} catch (error) {
  // Factory automatically attempts minimal initialization
  console.log('Full initialization failed, running with basic features')
}

// Check what services are available
const status = factory.getStatus()
console.log('Available services:', status.services)
```

### **Service Retry Logic**
```typescript
// Each service creation is retried automatically
private async createSchemaService(): Promise<SchemaService> {
  const serviceKey = 'schemaService'
  
  try {
    if (this.services.has(serviceKey)) {
      return this.services.get(serviceKey)
    }
    
    const schemaService = await SchemaServiceFactory.create({...config})
    this.services.set(serviceKey, schemaService)
    return schemaService
    
  } catch (error) {
    this.handleServiceCreationError(serviceKey, error)
    throw error
  }
}
```

## 🧪 **Testing Support**

### **Service Mocking**
```typescript
// Create factory with mock services for testing
const mockSchemaService = {
  getSchemasForType: jest.fn().mockReturnValue([]),
  getStatus: jest.fn().mockReturnValue({ initialized: true })
}

const factory = getMonacoServiceFactory()
// Inject mock service
factory['services'].set('schemaService', mockSchemaService)
```

### **Status Monitoring**
```typescript
// Monitor factory health
const status = factory.getStatus()

console.log('Factory Status:', {
  initialized: status.initialized,
  serviceCount: status.serviceCount,
  services: status.services,
  errors: status.errors,
  config: status.config
})
```

## 🔍 **Lifecycle Management**

### **Proper Cleanup**
```typescript
// Dispose all services properly
await factory.dispose()

// All Monaco providers are unregistered
// All caches are cleared
// All resources are freed
```

### **Service Dependencies**
The factory ensures services are created in the correct order:

1. **Provider Registry** - Must exist before any providers are registered
2. **Schema Service** - Must load before type inference needs schemas
3. **Type Inference** - Must exist before completion provider needs it
4. **Language Service** - Orchestrates all features
5. **Monaco Service** - Final orchestration layer

---

**The factory pattern ensures bulletproof service creation with proper error handling and graceful degradation.** 🏗️ 