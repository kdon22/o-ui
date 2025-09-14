# Schema-Driven Business Rule Editor

## 🎯 Overview

This schema-driven system provides a single source of truth that powers:
- **Monaco IntelliSense** - Auto-completion for methods
- **Python Code Generation** - Consistent code output
- **Debug Mappings** - Line-by-line debugging support  
- **Helper UI Screens** - Guided interfaces for non-coders

## 📁 Architecture

```
schemas/
├── types.ts                  # Core interfaces
├── factory.ts               # Single generation factory
├── methods/                 # IntelliSense methods
│   ├── string-methods.ts    
│   └── index.ts
├── helpers/                 # UI helpers for non-coders
│   ├── remark-helpers.ts
│   └── index.ts
└── index.ts                 # Main exports
```

## 🚀 Quick Start

### Import Everything
```typescript
import { 
  ALL_METHOD_SCHEMAS, 
  ALL_HELPER_SCHEMAS,
  SchemaFactory,
  getSchemaById 
} from '@/lib/editor/schemas'
```

### Use Methods in Monaco
```typescript
import { SchemaFactory } from '@/lib/editor/schemas'

// Generate completions
const completions = SchemaFactory.generateMonacoCompletions(ALL_METHOD_SCHEMAS, monaco)

// Generate Python code
const result = SchemaFactory.generate({
  type: 'method',
  schema: getSchemaById('string-to-upper'),
  context: {
    variable: 'customer.name',
    resultVar: 'uppercase_name'
  }
})
// Result: { code: 'uppercase_name = customer.name.upper()', imports: [] }
```

### Use Helpers in UI
```typescript
import { HelperFactory, useHelperFactory } from '@/components/auto-generated/code-helper'

function MyComponent() {
  const { openHelper } = useHelperFactory()
  
  const handleOpenRemark = () => {
    const schema = getSchemaById('find-remark-helper')
    openHelper(schema)
  }
  
  return <HelperFactory ... />
}
```

## 📝 Creating New Schemas

### Method Schema Example
```typescript
{
  id: 'string-to-upper',
  name: 'toUpper',
  type: 'method',
  category: 'string',
  returnType: 'string',
  description: 'Converts string to uppercase',
  examples: ['name.toUpper()'],
  pythonGenerator: (variable, resultVar = 'result') => 
    `${resultVar} = ${variable}.upper()`,
  pythonImports: []
}
```

### Helper Schema Example  
```typescript
{
  id: 'find-remark-helper',
  name: 'Add Vendor Remark',
  type: 'helper',
  category: 'remarks',
  description: 'Add remarks to vendor systems with conditions',
  examples: ['Add remark to Amadeus with conditions'],
  pythonGenerator: (variable, resultVar, params) => {
    // Complex multi-line generation logic
    return generateRemarkCode(params)
  },
  pythonImports: [],
  helperUI: {
    title: 'Add Vendor Remark',
    description: 'Add remarks to vendor booking systems',
    category: 'Booking Systems', 
    fields: [
      {
        name: 'systems',
        label: 'Select Systems',
        type: 'checkboxGroup',
        required: true,
        options: [
          { value: 'amadeus', label: 'Amadeus' },
          { value: 'galileo', label: 'Galileo' }
        ]
      },
      // ... more fields
    ]
  }
}
```

## 🔧 Field Types

The helper UI system supports these field types:

- `text` - Single line text input
- `textarea` - Multi-line text input  
- `select` - Dropdown selection
- `multiselect` - Multiple selection dropdown
- `checkbox` - Single checkbox
- `checkboxGroup` - Multiple checkboxes
- `radio` - Radio button group
- `number` - Number input

Each field can have:
- `required: boolean`
- `placeholder: string` 
- `description: string`
- `options: {value, label}[]` (for select/radio/checkbox types)
- `validation: {min, max, pattern}`

## 🎨 Integration Examples

### Monaco IntelliSense
```typescript
// Register language
monaco.languages.register({ id: 'business-rules' })

// Add completions
monaco.languages.registerCompletionItemProvider('business-rules', {
  provideCompletionItems: () => ({
    suggestions: [
      ...SchemaFactory.generateMonacoCompletions(ALL_METHOD_SCHEMAS, monaco),
      ...addHelpersToMonacoCompletions(monaco) // Helper shortcuts
    ]
  })
})
```

### React Component
```typescript
import { TestRemarkHelper } from '@/components/auto-generated/code-helper'

// Shows working end-to-end demo
<TestRemarkHelper />
```

## 🔍 Factory Pattern Benefits

### Single Source of Truth
- ✅ Schema defines everything (UI + Python + Debug + IntelliSense)
- ✅ No duplication between systems
- ✅ Changes propagate automatically

### Type Safety
- ✅ Full TypeScript throughout
- ✅ Validated schemas
- ✅ Compile-time error checking

### Extensibility  
- ✅ Add new methods by extending arrays
- ✅ Add new helpers with UI definitions
- ✅ Factory handles everything automatically

## 🧪 Testing Your Schemas

1. **Import the test component:**
```typescript
import { TestRemarkHelper } from '@/components/auto-generated/code-helper'
```

2. **Add to a page:**
```typescript
export default function TestPage() {
  return <TestRemarkHelper />
}
```

3. **Open and test:**
- Click "Open Add Vendor Remark Helper"  
- Fill out the form
- Click "Generate Code"
- See the generated Python output

## 📋 Best Practices

### Method Schemas
- Keep `pythonGenerator` functions simple for methods
- Use template strings for basic transformations
- Return single expressions when possible

### Helper Schemas  
- Use complex logic in `pythonGenerator` for helpers
- Generate multi-line Python with proper indentation
- Include comments in generated code
- Handle all form field combinations

### Performance
- Schema factory operations are fast (cached)
- UI generation happens on-demand
- Python generation is synchronous
- Debug mapping is auto-generated

## 🔮 Future Enhancements

- [ ] **Array/Number Methods** - Add more method categories
- [ ] **Loop/Condition Helpers** - Complex control flow helpers
- [ ] **Debug Integration** - Full line-by-line debugging  
- [ ] **Validation** - Real-time schema validation
- [ ] **Import Detection** - Smart import deduplication

---

**Everything goes through the schema factory - methods, helpers, debug mappings, UI generation. Single source of truth, maximum DRY, bulletproof consistency.** 