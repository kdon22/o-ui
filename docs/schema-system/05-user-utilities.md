# 🔧 User Utilities Integration - Dynamic Interface System

## 🎯 **Overview**

User utilities are custom functions defined by business users that can have their own return types and interfaces. The SSOT schema system supports **dynamic interface registration** with **user-first priority**.

### **Key Principles**
- ✅ **User interfaces override built-in interfaces** (same name priority)
- ✅ **Dynamic registration** from database/IndexedDB
- ✅ **Runtime interface creation** from user utility definitions
- ✅ **Seamless integration** with existing completion system

## 🏗️ **Architecture Overview**

### **Priority System**
```
1. User-Defined Interfaces (Highest Priority)
   ↓
2. Built-In Module Interfaces (Fallback)
   ↓
3. Not Found (Return null)
```

### **Data Flow**
```
User Utility Definition → Interface Generator → User Interface Cache → Completion System
        ↓                        ↓                    ↓                    ↓
   (Database/IndexedDB)    → Runtime Interface → SimpleInterfaceService → Monaco Editor
```

## 🔧 **Implementation Strategy**

### **Phase 1: User Interface Cache**

#### **Extended SimpleInterfaceService**
```typescript
export class SimpleInterfaceService {
  private interfaceCache = new Map<string, InterfaceDefinition>()
  private userInterfaceCache = new Map<string, InterfaceDefinition>() // ← New user cache

  async getInterface(name: string): Promise<InterfaceDefinition | null> {
    // 1. Check user-defined interfaces first (highest priority)
    if (this.userInterfaceCache.has(name)) {
      const userInterface = this.userInterfaceCache.get(name)!
      console.log(`[SimpleInterfaceService] ✅ Found user interface: ${name}`)
      return userInterface
    }
    
    // 2. Check built-in module interfaces (fallback)
    if (this.interfaceCache.has(name)) {
      const builtInInterface = this.interfaceCache.get(name)!
      console.log(`[SimpleInterfaceService] ✅ Found built-in interface: ${name}`)
      return builtInInterface
    }
    
    // 3. Try to load user interface from database
    const userInterface = await this.loadUserInterface(name)
    if (userInterface) {
      this.userInterfaceCache.set(name, userInterface)
      console.log(`[SimpleInterfaceService] ✅ Loaded user interface from database: ${name}`)
      return userInterface
    }
    
    console.log(`[SimpleInterfaceService] ❌ Interface not found: ${name}`)
    return null
  }
}
```

### **Phase 2: User Interface Loading**

#### **Database Integration**
```typescript
private async loadUserInterface(name: string): Promise<InterfaceDefinition | null> {
  try {
    // Load user utility definitions from existing system
    const { userUtilityRegistry } = await import('./user-utility-registry')
    const userUtilities = await userUtilityRegistry.getAllUserSchemas(this.tenantId)
    
    // Find utility with matching return interface
    const utility = userUtilities.find(u => u.returnInterface === name)
    if (!utility) return null
    
    // Generate interface from utility definition
    return this.generateInterfaceFromUtility(utility)
    
  } catch (error) {
    console.error(`[SimpleInterfaceService] Error loading user interface ${name}:`, error)
    return null
  }
}
```

#### **Interface Generation from User Utility**
```typescript
private generateInterfaceFromUtility(utility: any): InterfaceDefinition {
  // Extract interface definition from user utility schema
  const properties: InterfaceProperty[] = []
  
  if (utility.returnObject && utility.returnObject.properties) {
    // Convert existing returnObject to interface properties
    for (const [propName, propDef] of Object.entries(utility.returnObject.properties)) {
      const def = propDef as any
      properties.push({
        name: propName,
        type: def.type || 'any',
        description: def.description || `User-defined property: ${propName}`,
        nullable: def.nullable || false,
        optional: def.optional || false
      })
    }
  } else {
    // Generate basic interface for utility without explicit return object
    properties.push(
      { name: 'result', type: 'any', description: 'User utility result' },
      { name: 'success', type: 'boolean', description: 'Whether utility executed successfully' },
      { name: 'error', type: 'string', nullable: true, description: 'Error message if execution failed' }
    )
  }
  
  return {
    name: utility.returnInterface || utility.name,
    properties
  }
}
```

### **Phase 3: Dynamic Registration**

#### **Runtime Interface Registration**
```typescript
// For newly created user utilities
async registerUserInterface(interfaceDef: InterfaceDefinition): Promise<void> {
  this.userInterfaceCache.set(interfaceDef.name, interfaceDef)
  console.log(`[SimpleInterfaceService] ✅ Registered user interface: ${interfaceDef.name}`)
}

// For bulk loading user interfaces
async loadAllUserInterfaces(tenantId: string): Promise<void> {
  try {
    const { userUtilityRegistry } = await import('./user-utility-registry')
    const userUtilities = await userUtilityRegistry.getAllUserSchemas(tenantId)
    
    for (const utility of userUtilities) {
      if (utility.returnInterface) {
        const interfaceDef = this.generateInterfaceFromUtility(utility)
        this.userInterfaceCache.set(interfaceDef.name, interfaceDef)
        console.log(`[SimpleInterfaceService] ✅ Loaded user interface: ${interfaceDef.name}`)
      }
    }
    
    console.log(`[SimpleInterfaceService] Loaded ${this.userInterfaceCache.size} user interfaces`)
    
  } catch (error) {
    console.error('[SimpleInterfaceService] Error loading user interfaces:', error)
  }
}
```

## 📋 **User Utility Interface Patterns**

### **Pattern 1: Simple Return Value**
```typescript
// User utility: calculateDiscount(amount, percentage)
// Generated interface:
{
  name: 'DiscountResult',
  properties: [
    { name: 'originalAmount', type: 'number', description: 'Original amount before discount' },
    { name: 'discountAmount', type: 'number', description: 'Amount of discount applied' },
    { name: 'finalAmount', type: 'number', description: 'Final amount after discount' },
    { name: 'percentage', type: 'number', description: 'Discount percentage used' }
  ]
}
```

### **Pattern 2: Data Processing Result**
```typescript
// User utility: processCustomerData(customerInfo)
// Generated interface:
{
  name: 'CustomerProcessResult',
  properties: [
    { name: 'customer', type: 'object', description: 'Processed customer information' },
    { name: 'validationErrors', type: 'array', description: 'Array of validation errors found' },
    { name: 'enrichedData', type: 'object', description: 'Additional data added during processing' },
    { name: 'processingTime', type: 'number', description: 'Time taken to process in milliseconds' }
  ]
}
```

### **Pattern 3: External API Integration**
```typescript
// User utility: fetchWeatherData(location)
// Generated interface:
{
  name: 'WeatherData',
  properties: [
    { name: 'location', type: 'string', description: 'Location for weather data' },
    { name: 'temperature', type: 'number', description: 'Current temperature' },
    { name: 'humidity', type: 'number', description: 'Current humidity percentage' },
    { name: 'conditions', type: 'string', description: 'Weather conditions description' },
    { name: 'forecast', type: 'array', description: 'Array of forecast data' },
    { name: 'lastUpdated', type: 'string', description: 'When data was last updated' }
  ]
}
```

## 🔄 **Integration with Existing User Utility System**

### **Schema Enhancement**
```typescript
// Enhanced user utility schema to include interface definition
interface UserUtilitySchema extends UnifiedSchema {
  // Existing fields...
  returnInterface?: string  // Name of return interface
  
  // Enhanced return object with detailed property definitions
  returnObject?: {
    name: string
    properties: Record<string, {
      type: string
      description: string
      nullable?: boolean
      optional?: boolean
      examples?: any[]
    }>
  }
}
```

### **User Utility Creation Flow**
```typescript
// When user creates a new utility function
async createUserUtility(utilityData: any): Promise<void> {
  // 1. Create the utility schema
  const utilitySchema = {
    ...utilityData,
    returnInterface: utilityData.returnInterfaceName || `${utilityData.name}Result`
  }
  
  // 2. Save to database/IndexedDB
  await saveUserUtility(utilitySchema)
  
  // 3. Register interface with service
  if (utilitySchema.returnInterface && utilitySchema.returnObject) {
    const interfaceDef = generateInterfaceFromUtility(utilitySchema)
    await simpleInterfaceService.registerUserInterface(interfaceDef)
  }
  
  // 4. Refresh completion system
  await simpleInterfaceService.refresh()
}
```

### **User Utility Update Flow**
```typescript
// When user updates a utility function
async updateUserUtility(utilityId: string, updates: any): Promise<void> {
  // 1. Update utility in database
  await updateUserUtility(utilityId, updates)
  
  // 2. If return interface changed, update interface cache
  if (updates.returnInterface || updates.returnObject) {
    const updatedUtility = await getUserUtility(utilityId)
    const interfaceDef = generateInterfaceFromUtility(updatedUtility)
    await simpleInterfaceService.registerUserInterface(interfaceDef)
  }
  
  // 3. Refresh completion system
  await simpleInterfaceService.refresh()
}
```

## 🧪 **Testing User Interface Integration**

### **Test 1: User Interface Priority**
```typescript
// Test that user interfaces override built-in ones
async function testUserInterfacePriority() {
  // 1. Create user interface with same name as built-in
  const userInterface = {
    name: 'HttpResponse', // Same name as built-in
    properties: [
      { name: 'customField', type: 'string', description: 'User-defined field' },
      { name: 'statusCode', type: 'number', description: 'HTTP status' }
    ]
  }
  
  // 2. Register user interface
  await simpleInterfaceService.registerUserInterface(userInterface)
  
  // 3. Test lookup returns user interface (not built-in)
  const result = await simpleInterfaceService.getInterface('HttpResponse')
  console.log('Should have customField:', result?.properties.find(p => p.name === 'customField'))
}
```

### **Test 2: Dynamic Loading**
```typescript
// Test loading user interfaces from database
async function testDynamicLoading() {
  // 1. Clear caches
  await simpleInterfaceService.refresh()
  
  // 2. Request interface that should be loaded from database
  const result = await simpleInterfaceService.getInterface('MyCustomResult')
  
  // 3. Verify it was loaded and cached
  console.log('Loaded from database:', result)
  
  // 4. Second request should come from cache
  const cachedResult = await simpleInterfaceService.getInterface('MyCustomResult')
  console.log('Loaded from cache:', cachedResult)
}
```

### **Test 3: Interface Generation**
```typescript
// Test interface generation from user utility
async function testInterfaceGeneration() {
  const mockUtility = {
    name: 'calculateTax',
    returnInterface: 'TaxCalculationResult',
    returnObject: {
      name: 'TaxCalculationResult',
      properties: {
        taxAmount: { type: 'number', description: 'Calculated tax amount' },
        taxRate: { type: 'number', description: 'Tax rate used' },
        originalAmount: { type: 'number', description: 'Amount before tax' },
        totalAmount: { type: 'number', description: 'Amount including tax' }
      }
    }
  }
  
  const interfaceDef = generateInterfaceFromUtility(mockUtility)
  console.log('Generated interface:', interfaceDef)
  
  // Should have 4 properties with correct types and descriptions
  assert(interfaceDef.properties.length === 4)
  assert(interfaceDef.properties.find(p => p.name === 'taxAmount'))
}
```

## 🎯 **Future Enhancements**

### **Advanced Interface Features**
```typescript
// Future: Nested user interfaces
interface AdvancedUserInterface extends InterfaceDefinition {
  nestedInterfaces?: Record<string, InterfaceDefinition>
  generics?: string[]
  constraints?: Record<string, string>
}

// Future: Interface versioning
interface VersionedInterface extends InterfaceDefinition {
  version: string
  previousVersions?: string[]
  migrationGuide?: string
}

// Future: Interface validation
interface ValidatedInterface extends InterfaceDefinition {
  validation?: {
    required?: string[]
    patterns?: Record<string, string>
    ranges?: Record<string, { min?: number; max?: number }>
  }
}
```

---

**Next: Read [Testing Guide](./06-testing.md) to learn how to validate your implementation.**
