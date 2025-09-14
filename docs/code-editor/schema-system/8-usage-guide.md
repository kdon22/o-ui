# 8. Usage Guide - Practical Factory System Implementation

## 🎯 **Overview**

This guide provides **step-by-step instructions** for using the Monaco Factory System in your business rule editor, from basic setup to advanced customization.

## 🚀 **Quick Start**

### **1. Basic Factory Initialization**
```typescript
// app/business-rule-editor/page.tsx
import { getMonacoServiceFactory } from '@/components/editor/services/monaco-editor'
import { MonacoEditor } from '@monaco-editor/react'

export default function BusinessRuleEditorPage() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const [isFactoryReady, setIsFactoryReady] = useState(false)

  const handleEditorMount = async (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    setEditor(editor)
    
    try {
      // Initialize factory with default configuration
      const factory = getMonacoServiceFactory()
      await factory.initialize(monaco)
      
      console.log('✅ Monaco Factory System ready!')
      setIsFactoryReady(true)
      
    } catch (error) {
      console.error('❌ Factory initialization failed:', error)
      // Editor still works with basic features
    }
  }

  return (
    <div className="w-full h-96">
      <MonacoEditor
        language="business-rules"
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          glyphMargin: true // Enable breakpoint gutter
        }}
      />
      
      {isFactoryReady && (
        <div className="mt-2 text-green-600">
          🎯 Enhanced IntelliSense active
        </div>
      )}
    </div>
  )
}
```

### **2. Custom Configuration**
```typescript
// Custom factory configuration for your specific needs
const customFactory = getMonacoServiceFactory({
  // Core settings
  enableTypeInference: true,
  enableSchemaValidation: true,
  enableDebugMode: process.env.NODE_ENV === 'development',
  
  // Performance tuning
  maxCacheSize: 2000,
  cacheTimeoutMs: 10 * 60 * 1000, // 10 minutes
  maxRetries: 5,
  
  // Schema paths - customize for your project
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/number-methods',
    '@/lib/editor/schemas/methods/custom-business-methods' // Your custom methods
  ],
  
  helperSchemaPaths: [
    '@/lib/editor/schemas/helpers',
    '@/lib/custom-helpers' // Your custom helper modals
  ],
  
  // IntelliSense settings
  maxCompletionItems: 100,
  completionTimeout: 2000,
  hoverTimeout: 1000
})

await customFactory.initialize(monaco)
```

## 🔧 **Adding Custom Methods**

### **1. Create Custom Method Schema**
```typescript
// lib/editor/schemas/methods/custom-business-methods.ts
import type { MethodSchema } from '../types'

export const CUSTOM_BUSINESS_METHODS: MethodSchema[] = [
  {
    type: 'method',
    id: 'customer-get-tier',
    name: 'getTier',
    category: 'customer',
    description: 'Get customer loyalty tier (Bronze, Silver, Gold, Platinum)',
    parameters: [],
    returnType: 'str',
    pythonGenerator: (target: string) => `get_customer_tier(${target})`,
    examples: [
      {
        businessRule: 'customer.getTier()',
        pythonCode: 'get_customer_tier(customer)',
        description: 'Get loyalty tier for customer'
      }
    ],
    tags: ['business', 'loyalty', 'customer-service']
  },

  {
    type: 'method',
    id: 'order-calculate-discount',
    name: 'calculateDiscount',
    category: 'order',
    description: 'Calculate discount amount based on order total and customer tier',
    parameters: [
      {
        name: 'customerTier',
        type: 'str',
        required: true,
        description: 'Customer tier (Bronze, Silver, Gold, Platinum)'
      }
    ],
    returnType: 'float',
    pythonGenerator: (target: string, tier: string) => 
      `calculate_order_discount(${target}, ${tier})`,
    examples: [
      {
        businessRule: 'order.calculateDiscount("Gold")',
        pythonCode: 'calculate_order_discount(order, "Gold")',
        description: 'Calculate discount for Gold tier customer'
      }
    ],
    tags: ['business', 'pricing', 'discount']
  }
]
```

### **2. Register Custom Methods**
```typescript
// Update your configuration to include custom methods
const factory = getMonacoServiceFactory({
  methodSchemaPaths: [
    '@/lib/editor/schemas/methods/string-methods',
    '@/lib/editor/schemas/methods/number-methods',
    '@/lib/editor/schemas/methods/custom-business-methods' // Added this
  ]
})
```

## 🎨 **Creating Custom Helper Modals**

### **1. Create Helper Modal Component**
```tsx
// components/editor/helpers/customer-tier-selector.tsx
interface CustomerTierSelectorProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (tier: string) => void
  currentTier?: string
}

export function CustomerTierSelector({
  isOpen,
  onClose,
  onComplete,
  currentTier
}: CustomerTierSelectorProps) {
  const [selectedTier, setSelectedTier] = useState(currentTier || '')
  
  const tiers = [
    { value: 'Bronze', description: 'Basic customers', color: 'orange' },
    { value: 'Silver', description: 'Regular customers', color: 'gray' },
    { value: 'Gold', description: 'Premium customers', color: 'yellow' },
    { value: 'Platinum', description: 'VIP customers', color: 'purple' }
  ]

  const handleComplete = () => {
    if (selectedTier) {
      onComplete(`"${selectedTier}"`) // Return quoted string
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Customer Tier</DialogTitle>
          <DialogDescription>
            Choose the customer tier for your business rule
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <div 
              key={tier.value}
              className={`p-4 border rounded cursor-pointer ${
                selectedTier === tier.value ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedTier(tier.value)}
            >
              <div className="font-medium">{tier.value}</div>
              <div className="text-sm text-gray-600">{tier.description}</div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleComplete} disabled={!selectedTier}>
            Select Tier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### **2. Create Helper Schema**
```typescript
// lib/editor/schemas/helpers/customer-tier-selector.ts
import type { HelperSchema } from '../types'

export const CUSTOMER_TIER_SELECTOR_HELPER: HelperSchema = {
  type: 'helper',
  id: 'customer-tier-selector',
  name: 'Customer Tier Selector',
  category: 'business',
  description: 'Select customer loyalty tier',
  icon: '👑',
  helperUI: {
    modalTitle: 'Select Customer Tier',
    modalSize: 'md',
    component: 'CustomerTierSelector'
  },
  triggerConditions: [
    {
      contextPattern: /\.getTier\(\)\s*[=!<>]+\s*$/,
      cursorPosition: 'end',
      confidence: 0.9
    },
    {
      contextPattern: /customerTier\s*=\s*$/,
      cursorPosition: 'end',
      confidence: 0.8
    }
  ],
  outputTemplate: '{{selectedTier}}',
  supportedTypes: ['str'],
  examples: [
    {
      businessRule: 'if customer.getTier() == {{selectedTier}}',
      pythonCode: 'if get_customer_tier(customer) == "Gold":',
      description: 'Check customer tier with visual selector'
    }
  ]
}
```

### **3. Register Helper Modal**
```typescript
// Register your custom helper component
import { CustomerTierSelector } from '@/components/editor/helpers/customer-tier-selector'

// Add to your helper registry
const HelperModalRegistry = {
  'CustomerTierSelector': CustomerTierSelector,
  // ... other helpers
}
```

## 📊 **Monitoring and Debugging**

### **1. Check Factory Status**
```typescript
// Get comprehensive factory status
const factory = getMonacoServiceFactory()
const status = factory.getStatus()

console.log('Factory Status:', {
  initialized: status.initialized,
  serviceCount: status.serviceCount,
  services: status.services,
  errors: status.errors
})

// Check individual service status
const schemaService = factory.getService('schemaService')
const typeInference = factory.getService('typeInferenceService')

console.log('Schema Service:', schemaService?.getStatus())
console.log('Type Inference:', typeInference?.getStats())
```

### **2. Debug Mode**
```typescript
// Enable debug mode for detailed logging
const debugFactory = getMonacoServiceFactory({
  enableDebugMode: true,
  enableSchemaValidation: true
})

await debugFactory.initialize(monaco)

// All services will now log detailed information
// Check browser console for debug output
```

### **3. Performance Monitoring**
```typescript
// Monitor completion provider performance
const completionProvider = factory.getService('completionProvider')
const stats = completionProvider?.getStats()

console.log('Completion Performance:', {
  totalRequests: stats.totalRequests,
  cacheHitRate: stats.cacheHits / stats.totalRequests,
  averageResponseTime: stats.averageResponseTime,
  mostUsedCompletions: stats.mostUsedCompletions.slice(0, 5)
})

// Monitor type inference performance
const typeService = factory.getService('typeInferenceService')
const typeStats = typeService?.getStats()

console.log('Type Inference Performance:', {
  totalInferences: typeStats.totalInferences,
  cacheHitRate: typeStats.cacheHits / (typeStats.cacheHits + typeStats.cacheMisses),
  averageConfidence: typeStats.averageConfidence
})
```

## 🔄 **Python Generation Integration**

### **1. Access Python Generator**
```typescript
// Get generated Python code with full mapping information
const handleGeneratePython = async () => {
  const businessRuleCode = editor.getValue()
  
  // Use the factory's code generation service
  const codeGenerator = factory.getService('codeGeneratorService')
  
  if (codeGenerator) {
    try {
      const result = await codeGenerator.generatePythonWithMapping(businessRuleCode)
      
      console.log('Generated Python:', result.pythonCode)
      console.log('Debug Mapping:', result.debugMapping)
      console.log('Transformations:', result.transformations)
      
      // Update Python tab with generated code
      setPythonCode(result.pythonCode)
      setDebugMapping(result.debugMapping)
      
    } catch (error) {
      console.error('Python generation failed:', error)
    }
  }
}
```

### **2. Real-time Python Updates**
```typescript
// Setup real-time Python generation on typing
useEffect(() => {
  if (!editor || !isFactoryReady) return

  const updatePython = debounce(async () => {
    const code = editor.getValue()
    
    try {
      const codeGenerator = factory.getService('codeGeneratorService')
      const result = await codeGenerator.generatePythonWithMapping(code)
      
      // Update Python display
      setPythonCode(result.pythonCode)
      
    } catch (error) {
      // Handle generation errors gracefully
      console.warn('Python generation error:', error)
    }
  }, 1000) // 1 second debounce

  // Listen for content changes
  const disposable = editor.onDidChangeModelContent(updatePython)
  
  return () => disposable.dispose()
}, [editor, isFactoryReady])
```

## 🧪 **Testing Your Setup**

### **1. Validation Test**
```typescript
// Test that your custom schemas are loaded correctly
const testSchemaLoading = async () => {
  const factory = getMonacoServiceFactory()
  await factory.initialize(monaco)
  
  const schemaService = factory.getService('schemaService')
  
  // Test custom method loading
  const customMethods = schemaService.getSchemasByCategory('customer')
  console.log('Custom customer methods:', customMethods)
  
  // Test helper loading
  const helpers = schemaService.getHelperSchemas()
  console.log('Available helpers:', helpers.map(h => h.name))
  
  // Test type inference
  const typeService = factory.getService('typeInferenceService')
  const typeInfo = await typeService.detectVariableType('customer', 'customer = getCustomer()')
  console.log('Type detection:', typeInfo)
}
```

### **2. IntelliSense Test**
```typescript
// Test that IntelliSense shows your custom methods
const testIntelliSense = async () => {
  // Set some business rule code
  editor.setValue('customer.')
  
  // Position cursor after the dot
  editor.setPosition({ lineNumber: 1, column: 10 })
  
  // Trigger completion
  const completions = await monaco.languages.getCompletions(
    editor.getModel(),
    { lineNumber: 1, column: 10 }
  )
  
  console.log('Available completions:', completions.suggestions.map(s => s.label))
  
  // Should include your custom methods like 'getTier()'
}
```

## 🎯 **Production Considerations**

### **1. Error Handling**
```typescript
// Robust error handling for production
const initializeFactoryRobustly = async (monaco: Monaco) => {
  try {
    const factory = getMonacoServiceFactory({
      enableDebugMode: false, // Disable in production
      maxRetries: 3,
      cacheTimeoutMs: 15 * 60 * 1000 // 15 minutes in production
    })
    
    await factory.initialize(monaco)
    return { success: true, factory }
    
  } catch (error) {
    console.error('Factory initialization failed:', error)
    
    // Attempt minimal initialization
    try {
      const minimalFactory = getMonacoServiceFactory({
        enableTypeInference: false,
        enableSchemaValidation: false
      })
      
      await minimalFactory.initialize(monaco)
      return { success: true, factory: minimalFactory, degraded: true }
      
    } catch (minimalError) {
      console.error('Even minimal initialization failed:', minimalError)
      return { success: false, error: minimalError }
    }
  }
}
```

### **2. Performance Optimization**
```typescript
// Optimize for production performance
const productionFactory = getMonacoServiceFactory({
  // Larger cache for better performance
  maxCacheSize: 5000,
  cacheTimeoutMs: 30 * 60 * 1000, // 30 minutes
  
  // Faster timeouts
  completionTimeout: 500,
  hoverTimeout: 300,
  
  // Enable validation but not debug logging
  enableSchemaValidation: true,
  enableDebugMode: false
})
```

---

**This usage guide provides everything you need to implement and customize the Monaco Factory System for your business rule editor.** 🚀 