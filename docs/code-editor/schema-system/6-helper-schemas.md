# 6. Helper Schemas - Building Helper Modal Systems

## 🎯 **Overview**

Helper schemas define **visual helper modals** that appear in IntelliSense to help non-technical users build complex business rules without coding knowledge.

## 📋 **Schema Structure**

### **Basic Helper Schema**
```typescript
interface HelperSchema extends UnifiedSchema {
  type: 'helper'
  id: string                    // Unique identifier
  name: string                  // Helper name (e.g., 'Expression Builder')
  category: string              // Helper category (e.g., 'condition')
  description: string           // IntelliSense description
  icon: string                  // Icon (emoji or component name)
  helperUI: HelperUIConfig      // Modal UI configuration
  triggerConditions: TriggerCondition[] // When to show this helper
  outputTemplate: string        // How to insert generated code
  supportedTypes: UnifiedType[] // Types this helper works with
  examples: ExampleUsage[]      // Usage examples
}
```

### **Helper UI Configuration**
```typescript
interface HelperUIConfig {
  modalTitle: string            // Modal window title
  modalSize: 'sm' | 'md' | 'lg' | 'xl' // Modal size
  component: string             // React component name
  props?: Record<string, any>   // Component props
  validation?: ValidationRule[] // Input validation rules
}

interface TriggerCondition {
  contextPattern: RegExp        // When to show (regex pattern)  
  cursorPosition: 'start' | 'end' | 'any' // Cursor position requirement
  confidence: number            // Confidence score (0-1)
}
```

## 🔧 **Creating Helper Schemas**

### **Expression Builder Helper**
```typescript
// o-ui/src/lib/editor/schemas/helpers/expression-builder.ts
import type { HelperSchema } from '../types'

export const EXPRESSION_BUILDER_HELPER: HelperSchema = {
  type: 'helper',  
  id: 'expression-builder',
  name: 'Expression Builder',
  category: 'condition',
  description: 'Build complex expressions visually',
  icon: '🔧',
  helperUI: {
    modalTitle: 'Build Expression',
    modalSize: 'lg',
    component: 'ExpressionBuilderModal',
    props: {
      enableAdvancedOperators: true,
      showTypeHints: true,
      maxComplexity: 5
    },
    validation: [
      {
        rule: 'required',
        message: 'Expression cannot be empty'
      },
      {
        rule: 'maxLength',
        value: 500,
        message: 'Expression too long (max 500 characters)'
      }
    ]
  },
  triggerConditions: [
    {
      contextPattern: /^\s*if\s+$/,        // After "if "
      cursorPosition: 'end',
      confidence: 0.9
    },
    {
      contextPattern: /^\s*and\s+$/,       // After "and "
      cursorPosition: 'end', 
      confidence: 0.8
    },
    {
      contextPattern: /^\s*or\s+$/,        // After "or "
      cursorPosition: 'end',
      confidence: 0.8
    }
  ],
  outputTemplate: '{{expression}}',
  supportedTypes: ['bool', 'str', 'int', 'float'],
  examples: [
    {
      businessRule: 'if {{expression}}',
      pythonCode: 'if customer_age > 18 and customer_type == "premium":',
      description: 'Complex conditional expression'
    }
  ]
}
```

### **Variable Browser Helper**
```typescript
export const VARIABLE_BROWSER_HELPER: HelperSchema = {
  type: 'helper',
  id: 'variable-browser', 
  name: 'Variable Browser',
  category: 'variable',
  description: 'Browse and select available variables',
  icon: '🗂️',
  helperUI: {
    modalTitle: 'Select Variable',
    modalSize: 'md',
    component: 'VariableBrowserModal',
    props: {
      enableSearch: true,
      showTypeInfo: true,
      groupByCategory: true
    }
  },
  triggerConditions: [
    {
      contextPattern: /^\s*\w*$/,          // Variable assignment start
      cursorPosition: 'any',
      confidence: 0.7
    },
    {
      contextPattern: /=\s*$/,             // After assignment operator
      cursorPosition: 'end',
      confidence: 0.8
    }
  ],
  outputTemplate: '{{selectedVariable}}',
  supportedTypes: ['any'],
  examples: [
    {
      businessRule: '{{selectedVariable}}',
      pythonCode: 'customer.profile.age',
      description: 'Selected nested variable'
    }
  ]
}
```

### **Operator Selector Helper**
```typescript
export const OPERATOR_SELECTOR_HELPER: HelperSchema = {
  type: 'helper',
  id: 'operator-selector',
  name: 'Operator Selector', 
  category: 'operator',
  description: 'Choose comparison or logical operators',
  icon: '⚖️',
  helperUI: {
    modalTitle: 'Select Operator',
    modalSize: 'sm',
    component: 'OperatorSelectorModal',
    props: {
      categories: ['comparison', 'logical', 'string'],
      showExamples: true
    }
  },
  triggerConditions: [
    {
      contextPattern: /\w+\s*$/,           // After variable name
      cursorPosition: 'end',
      confidence: 0.6
    },
    {
      contextPattern: /\)\s*$/,            // After closing parenthesis
      cursorPosition: 'end',
      confidence: 0.5
    }
  ],
  outputTemplate: ' {{operator}} ',
  supportedTypes: ['bool'],
  examples: [
    {
      businessRule: 'age {{operator}} 18',
      pythonCode: 'age >= 18',
      description: 'Age comparison with selected operator'
    }
  ]
}
```

## 🎨 **Modal Component Integration**

### **React Component Structure**
```typescript
// Example modal component interface
interface ExpressionBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (expression: string) => void
  initialValue?: string
  enableAdvancedOperators?: boolean
  showTypeHints?: boolean  
  maxComplexity?: number
}

// Modal component registration
const HelperModalRegistry = {
  'ExpressionBuilderModal': ExpressionBuilderModal,
  'VariableBrowserModal': VariableBrowserModal,
  'OperatorSelectorModal': OperatorSelectorModal,
  // Add more components as needed
}
```

### **Helper Service Integration**
```typescript
// Helper service handles modal lifecycle
class HelperService {
  openHelper(helperId: string, context: HelperContext): void {
    const schema = this.getHelperSchema(helperId)
    const ModalComponent = HelperModalRegistry[schema.helperUI.component]
    
    if (!ModalComponent) {
      throw new Error(`Modal component ${schema.helperUI.component} not found`)
    }
    
    // Open modal with schema configuration
    this.modalManager.open(ModalComponent, {
      ...schema.helperUI.props,
      onComplete: (result: string) => {
        const output = this.processTemplate(schema.outputTemplate, { result })
        context.onComplete(output)
        this.modalManager.close()
      }
    })
  }
}
```

## 🎯 **IntelliSense Integration**

### **Helper Completion Items**
```typescript
// Convert helper schema to completion item
const generateHelperCompletion = (schema: HelperSchema): CompletionItem => {
  return {
    label: `${schema.icon} ${schema.name}`,
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'Helper modal',
    documentation: schema.description,
    insertText: '', // No direct text insertion
    command: {
      id: 'openHelper',
      title: schema.name,
      arguments: [{ helperId: schema.id }]
    },
    sortText: `0-helper-${schema.category}`, // High priority
    filterText: schema.name.toLowerCase()
  }
}
```

### **Context-Aware Helper Suggestions**
```typescript
// Determine which helpers to show based on context
const getApplicableHelpers = (
  context: string,
  position: monaco.Position
): HelperSchema[] => {
  const applicableHelpers: Array<{ schema: HelperSchema; confidence: number }> = []
  
  for (const schema of ALL_HELPER_SCHEMAS) {
    for (const condition of schema.triggerConditions) {
      if (condition.contextPattern.test(context)) {
        applicableHelpers.push({
          schema,
          confidence: condition.confidence
        })
        break // One matching condition is enough
      }
    }
  }
  
  // Sort by confidence (highest first)
  return applicableHelpers
    .sort((a, b) => b.confidence - a.confidence)
    .map(item => item.schema)
}
```

## 🗂️ **File Organization**

### **Helper Category Files**
```
o-ui/src/lib/editor/schemas/helpers/
├── expression-builder.ts     # Complex condition builder
├── variable-browser.ts       # Variable selection
├── operator-selector.ts      # Operator selection
├── loop-builder.ts          # Loop construction helper
├── data-formatter.ts        # Data formatting helper
└── index.ts                 # Export all schemas
```

### **Index File Pattern**
```typescript
// o-ui/src/lib/editor/schemas/helpers/index.ts
import { EXPRESSION_BUILDER_HELPER } from './expression-builder'
import { VARIABLE_BROWSER_HELPER } from './variable-browser'
import { OPERATOR_SELECTOR_HELPER } from './operator-selector'
import { LOOP_BUILDER_HELPER } from './loop-builder'
import { DATA_FORMATTER_HELPER } from './data-formatter'

export const ALL_HELPER_SCHEMAS = [
  EXPRESSION_BUILDER_HELPER,
  VARIABLE_BROWSER_HELPER,
  OPERATOR_SELECTOR_HELPER,
  LOOP_BUILDER_HELPER,
  DATA_FORMATTER_HELPER
]

// Export individual helpers
export {
  EXPRESSION_BUILDER_HELPER,
  VARIABLE_BROWSER_HELPER,
  OPERATOR_SELECTOR_HELPER,
  LOOP_BUILDER_HELPER,
  DATA_FORMATTER_HELPER
}
```

## 🔄 **Template Processing**

### **Output Template System**
```typescript
// Process helper output with template substitution
class TemplateProcessor {
  process(template: string, variables: Record<string, any>): string {
    let result = template
    
    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(pattern, String(value))
    }
    
    return result
  }
  
  // Advanced template with conditional logic
  processAdvanced(template: string, context: HelperContext): string {
    // Support for conditional templates
    if (template.includes('{{#if')) {
      return this.processConditionalTemplate(template, context)
    }
    
    // Support for loop templates
    if (template.includes('{{#each')) {
      return this.processLoopTemplate(template, context)
    }
    
    return this.process(template, context.variables)
  }
}
```

## 📊 **Helper Analytics**

### **Usage Tracking**
```typescript
// Track helper usage for optimization
interface HelperStats {
  helperId: string
  timesTriggered: number
  completionRate: number        // How often users complete vs cancel
  averageTimeToComplete: number // Milliseconds
  mostCommonOutputs: string[]   // Popular generated expressions
}

class HelperAnalytics {
  trackHelperTrigger(helperId: string): void {
    // Track when helper is opened
  }
  
  trackHelperCompletion(helperId: string, timeMs: number, output: string): void {
    // Track successful completion
  }
  
  trackHelperCancellation(helperId: string, timeMs: number): void {
    // Track when user cancels
  }
  
  getHelperStats(): HelperStats[] {
    // Return usage statistics
  }
}
```

---

**Helper schemas enable non-technical users to build complex business rules through visual interfaces seamlessly integrated with Monaco IntelliSense.** 🎨 