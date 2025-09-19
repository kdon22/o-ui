# UTR-Rule Tester Integration Roadmap

## 🎯 **Goal: Connect Well-Designed UTR System to Functional Rule Tester**

Both the UTR schema system and rule testing framework are well-architected and functional. The missing piece is the **integration layer** that allows rule testing with real travel data context.

## 🏗️ **Current Architecture Analysis**

### **What We Have ✅**
1. **UTR Schemas** (`schemas/utr/`)
   - Complete JSON schema definitions
   - Python and JavaScript templates
   - Real normalized examples (Amadeus, Sabre, multi-source)

2. **Rule Tester** (`o-ui/src/components/editor/rule-tester/`)
   - Functional testing framework with step-by-step execution
   - Variable inspection and debugging capabilities
   - Python code generation and execution

3. **Monaco Editor** (`o-ui/src/components/editor/`)
   - Unified completion system with IntelliSense
   - Business rules language support
   - Real-time code validation

### **Integration Points Needed 🔗**

## 📋 **Phase 1: UTR Connection UI (Week 1-2)**

### **1.1 Replace Variables Panel with Tabbed Interface**
```
Current: Single variables panel at bottom of rule tester
Target:  Tabbed interface with UTR connection + Variables
```

**Files to Create/Modify:**
- `rule-tester/panels/utr-connection-tab.tsx` (NEW)
- `rule-tester/panels/tabbed-results-panel.tsx` (NEW) 
- `rule-tester/rule-tester-tab.tsx` (MODIFY)

### **1.2 UTR Connection Tab Components**

#### **Source Data Section**
```typescript
interface UTRSourceData {
  sources: Array<{
    vendor: 'amadeus' | 'sabre' | 'kayak' | 'direct'
    locator: string
    isPrimary: boolean
    dataTypes: string[] // ['flights', 'hotel', 'car', 'pricing']
  }>
}
```

#### **Workflow Selection Section**
```typescript
interface WorkflowConfig {
  workflowId: string
  processName: string
  mockMode: boolean // True for now, connects to action system later
}
```

#### **Email Override Section**
```typescript
interface EmailOverrides {
  mode: 'override_all' | 'bcc' | 'regular' | 'delivery_test'
  testEmail?: string // For override_all and bcc modes
  deliveryAddress: 'delivery@rule-tester' // Default for testing
}
```

## 📋 **Phase 2: Vendor Integration (Week 3-4)**

### **2.1 Implement vendor.get() Function**
```typescript
// Location: rule-tester/services/vendor-integration.ts
class VendorIntegrationService {
  async getUTR(sources: UTRSourceData): Promise<UTR> {
    // 1. Call vendor.get() for each source
    // 2. Assemble consolidated UTR using schemas/utr logic
    // 3. Return normalized UTR object for rule testing
  }
}
```

### **2.2 UTR Assembly Logic**
```typescript
// Use existing UTR assembly patterns from schemas/utr/
const utrAssembler = new UTRAssembler()
const consolidatedUTR = await utrAssembler.assembleFromSources(
  sourceConfigurations,
  { workflowId, processName }
)
```

### **2.3 Connect to Rule Execution**
```typescript
// Load UTR data into rule execution context
const executionEngine = new BusinessRulesExecutionEngine()
executionEngine.setUTRContext(consolidatedUTR) // New method
executionEngine.setEmailOverrides(emailConfig) // New method
```

## 📋 **Phase 3: Monaco UTR Awareness (Week 5-6)**

### **3.1 Load UTR Templates into Monaco**
```typescript
// Enhanced completion provider with UTR awareness
const utrTemplate = await import('../../../schemas/utr/templates/business-rules-template.js')
monaco.languages.registerCompletionItemProvider('business-rules', {
  provideCompletionItems: (model, position) => {
    return getUTRAwareCompletions(utrTemplate, position)
  }
})
```

### **3.2 Real UTR Data in IntelliSense**
```typescript
// Load actual UTR examples for context-aware suggestions
const amadeusExample = await import('../../../schemas/utr/normalized/amadeus-utr-full.json')
const sabreExample = await import('../../../schemas/utr/normalized/sabre-utr-full.json')

// Provide real field names and structures in completion
const completions = generateUTRCompletions([amadeusExample, sabreExample])
```

## 📋 **Phase 4: End-to-End Testing (Week 7-8)**

### **4.1 Integration Testing Scenarios**
1. **Single Source UTR**: Test with Amadeus-only data
2. **Multi-Source UTR**: Test with Amadeus + Sabre combination
3. **Email Override Testing**: Verify delivery control works
4. **Workflow Integration**: Test different process configurations

### **4.2 Performance Validation**
- UTR assembly: < 500ms for standard multi-source scenarios
- Rule execution with UTR context: < 1 second
- Monaco IntelliSense with UTR data: < 50ms response time

## 🎯 **Implementation Priorities**

### **Immediate (This Week)**
1. Create tabbed interface to replace variables panel
2. Build UTR configuration UI components
3. Add source data, workflow, and email override sections

### **Short Term (Next 2 Weeks)**
1. Implement `vendor.get()` integration service
2. Connect UTR assembly logic from schemas
3. Test with real UTR data loading

### **Medium Term (Month 1)**
1. Full Monaco UTR integration
2. Performance optimization
3. Complete end-to-end testing flow

## 🔧 **Technical Implementation Details**

### **File Structure**
```
rule-tester/
├── panels/
│   ├── utr-connection-tab.tsx      (NEW - Main UTR config)
│   ├── tabbed-results-panel.tsx    (NEW - Tab container)
│   ├── source-data-panel.tsx       (NEW - Vendor/locator config)
│   ├── workflow-selector.tsx       (NEW - Process selection)
│   ├── email-overrides.tsx         (NEW - Delivery control)
│   └── variables-panel.tsx         (EXISTING - Move to tab)
├── services/
│   ├── vendor-integration.ts       (NEW - vendor.get() calls)
│   ├── utr-assembly.ts            (NEW - UTR consolidation)
│   └── email-delivery.ts          (NEW - Override handling)
└── types.ts                       (MODIFY - Add UTR types)
```

### **Integration Points**
- **UTR Schemas**: Direct import and usage of existing templates
- **Action System**: Future connection point for workflow data
- **Monaco Editor**: Enhanced IntelliSense with UTR awareness
- **Email System**: Delivery overrides for testing scenarios

---

**This roadmap leverages your excellent existing architecture to create the missing integration layer. The UTR system and rule tester will work together seamlessly, providing travel-data-aware rule development and testing capabilities.**