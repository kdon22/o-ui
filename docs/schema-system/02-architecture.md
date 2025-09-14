# 🏗️ Architecture Guide - SSOT Schema System

## 🎯 **Core Components**

### **1. Runtime Interface Definitions**

#### **Interface Property Structure**
```typescript
interface InterfaceProperty {
  name: string          // Property name (e.g., 'statusCode')
  type: string          // Type (e.g., 'number', 'string', 'object')
  description: string   // Human-readable description
  nullable?: boolean    // Can be null (optional)
  optional?: boolean    // Property is optional (optional)
}
```

#### **Interface Definition Structure**
```typescript
interface InterfaceDefinition {
  name: string                    // Interface name (e.g., 'HttpResponse')
  properties: InterfaceProperty[] // Array of properties
}
```

#### **Example Implementation**
```typescript
// In http.module.ts
export const HTTP_RESPONSE_INTERFACE = {
  name: 'HttpResponse',
  properties: [
    { 
      name: 'statusCode', 
      type: 'number', 
      description: 'HTTP status code (200, 404, 500, etc.)' 
    },
    { 
      name: 'error', 
      type: 'string', 
      nullable: true, 
      description: 'Error message if request failed, null if successful' 
    },
    { 
      name: 'response', 
      type: 'object', 
      description: 'Response data from the API' 
    }
  ]
}
```

### **2. Module Interface Collections**

#### **Collection Structure**
```typescript
// At bottom of each module file
export const [MODULE_NAME]_MODULE_INTERFACES = {
  [InterfaceName]: [INTERFACE_DEFINITION],
  // Add more interfaces as needed
}

// Example:
export const HTTP_MODULE_INTERFACES = {
  HttpResponse: HTTP_RESPONSE_INTERFACE,
  HttpHeaders: HTTP_HEADERS_INTERFACE, // Future interface
}
```

### **3. Schema Integration**

#### **Schema Reference**
```typescript
// In module schemas
{
  id: 'http-get',
  module: 'http',
  name: 'get',
  type: 'method',
  category: 'http',
  returnInterface: 'HttpResponse', // ← References interface by name
  parameters: [...],
  pythonGenerator: (...) => { ... }
}
```

#### **No More returnObject**
```typescript
// ❌ OLD: Redundant returnObject
{
  returnInterface: 'HttpResponse',
  returnObject: {
    name: 'HttpResponse',
    properties: { ... } // ← Duplicate definition!
  }
}

// ✅ NEW: Single source of truth
{
  returnInterface: 'HttpResponse' // ← Points to runtime definition
}
```

## 🔄 **Data Flow Architecture**

### **1. Interface Registration Flow**
```
Module Load → Interface Definitions → Interface Collections → Service Cache
     ↓              ↓                      ↓                    ↓
http.module.ts → HTTP_RESPONSE_INTERFACE → HTTP_MODULE_INTERFACES → SimpleInterfaceService
```

### **2. Completion Request Flow**
```
User Types → Monaco Provider → Interface Service → Module Lookup → Properties
    ↓             ↓               ↓                 ↓              ↓
  result.|    → getInterface() → loadModuleInterfaces() → HTTP_MODULE_INTERFACES → properties[]
```

### **3. Service Layer Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Monaco Editor                            │
│                 (Completion Provider)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              UnifiedSchemaService                           │
│            (Integration Layer)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│             SimpleInterfaceService                          │
│              (Core Interface Logic)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Module Interface Collections                   │
│    HTTP_MODULE_INTERFACES, DATE_MODULE_INTERFACES, etc.    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 **SimpleInterfaceService Architecture**

### **Core Methods**
```typescript
export class SimpleInterfaceService {
  // Cache for loaded interfaces
  private interfaceCache = new Map<string, InterfaceDefinition>()

  // Load all module interfaces into cache
  async loadModuleInterfaces(): Promise<void>
  
  // Get specific interface by name
  async getInterface(name: string): Promise<InterfaceDefinition | null>
  
  // Get just the properties for completion
  async getInterfaceProperties(name: string): Promise<InterfaceProperty[]>
  
  // Check if interface exists
  async hasInterface(name: string): Promise<boolean>
  
  // Get all available interface names
  async getAllInterfaceNames(): Promise<string[]>
  
  // Clear cache and reload
  async refresh(): Promise<void>
}
```

### **Loading Strategy**
```typescript
async loadModuleInterfaces(): Promise<void> {
  // Load HTTP module interfaces
  const { HTTP_MODULE_INTERFACES } = await import('../schemas/modules/http.module.ts')
  
  // Load DATE module interfaces  
  const { DATE_MODULE_INTERFACES } = await import('../schemas/modules/date.module.ts')
  
  // Load MATH module interfaces
  const { MATH_MODULE_INTERFACES } = await import('../schemas/modules/math.module.ts')
  
  // Cache all interfaces
  for (const [name, interfaceDef] of Object.entries({
    ...HTTP_MODULE_INTERFACES,
    ...DATE_MODULE_INTERFACES,
    ...MATH_MODULE_INTERFACES
  })) {
    this.interfaceCache.set(name, interfaceDef as InterfaceDefinition)
  }
}
```

## 🔗 **Integration Points**

### **1. UnifiedSchemaService Integration**
```typescript
// UnifiedSchemaService delegates to SimpleInterfaceService
async getInterfaceProperties(interfaceName: string): Promise<PropertyDefinition[] | null> {
  const { simpleInterfaceService } = await import('./simple-interface-service')
  const properties = await simpleInterfaceService.getInterfaceProperties(interfaceName)
  
  // Convert to existing PropertyDefinition format
  return properties.map(prop => ({
    name: prop.name,
    type: prop.type,
    description: prop.description,
    nullable: prop.nullable || false,
    optional: prop.optional || false,
    isCollection: false
  }))
}
```

### **2. Monaco Completion Provider Integration**
```typescript
// In completion provider
const interfaceProperties = await unifiedSchemaService.getInterfaceProperties('HttpResponse')
const completions = interfaceProperties.map(prop => ({
  label: prop.name,
  kind: monaco.languages.CompletionItemKind.Property,
  detail: `${prop.type}${prop.optional ? ' (optional)' : ''}${prop.nullable ? ' | null' : ''}`,
  documentation: prop.description
}))
```

## 🎯 **User Utility Integration Architecture**

### **Priority System**
```typescript
async getInterface(name: string): Promise<InterfaceDefinition | null> {
  // 1. Check user-defined interfaces first (highest priority)
  const userInterface = await this.getUserInterface(name)
  if (userInterface) return userInterface
  
  // 2. Check built-in module interfaces (fallback)
  const builtInInterface = this.interfaceCache.get(name)
  return builtInInterface || null
}

private async getUserInterface(name: string): Promise<InterfaceDefinition | null> {
  // Load from IndexedDB/database where user utilities are stored
  // Implementation depends on existing user utility system
  return null // Placeholder for now
}
```

### **Dynamic Registration**
```typescript
// For user-defined utilities
async registerUserInterface(interfaceDef: InterfaceDefinition): Promise<void> {
  // Store in user interface cache (higher priority than built-in)
  this.userInterfaceCache.set(interfaceDef.name, interfaceDef)
}
```

## 🔧 **Extension Points**

### **1. Adding New Modules**
```typescript
// In loadModuleInterfaces(), add new module:
const { CRYPTO_MODULE_INTERFACES } = await import('../schemas/modules/crypto.module.ts')

// Merge into cache
Object.assign(allInterfaces, CRYPTO_MODULE_INTERFACES)
```

### **2. Advanced Interface Features**
```typescript
// Future: Nested interfaces
interface AdvancedInterfaceProperty extends InterfaceProperty {
  nestedInterface?: string    // Reference to another interface
  isCollection?: boolean      // Array of this type
  elementType?: string        // Type of array elements
}

// Future: Generic interfaces
interface GenericInterfaceDefinition extends InterfaceDefinition {
  generics?: string[]         // Generic type parameters
  constraints?: Record<string, string> // Type constraints
}
```

---

**Next: Read [Implementation Guide](./03-implementation.md) to learn how to set up the system.**
