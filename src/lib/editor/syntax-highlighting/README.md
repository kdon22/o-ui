# Business Rules Syntax Highlighting & Indentation

Complete syntax highlighting system for the custom business rules language with proper 2-space indentation support.

## 🚀 Quick Setup

### Basic Setup (Language Only)
```typescript
import { setupBusinessRulesSyntaxHighlighting } from './syntax-highlighting'

// Setup syntax highlighting for business-rules language
setupBusinessRulesSyntaxHighlighting(monaco)
```

### Enhanced Setup (With Editor Configuration)
```typescript
import { setupBusinessRulesWithEditor } from './syntax-highlighting'

const editor = monaco.editor.create(container, {
  value: 'if customer.age > 18\n  eligibleForDiscount = true',
  language: 'business-rules'
})

// Setup syntax highlighting AND configure 2-space indentation
setupBusinessRulesWithEditor(monaco, editor)
```

### Integration with Existing Systems
```typescript
import { integrateSyntaxHighlighting } from './syntax-highlighting'

// Call AFTER variable-detection system initializes
integrateSyntaxHighlighting(monaco)
```

## 🎯 Indentation Features

### Automatic Indentation
The system automatically indents after:
- `if`, `else`, `elseif` statements
- `for`, `while` loops
- `class`, `enum` definitions
- `def`, `function` definitions
- Opening braces `{`
- Lines ending with `:`

### Manual Indentation Helpers
```typescript
import { BusinessRulesIndentationHelper } from './syntax-highlighting'

const helper = new BusinessRulesIndentationHelper(editor, monaco)

// Fix current line indentation
helper.fixCurrentLineIndentation()

// Format entire document
helper.formatDocument()
```

## 📋 Supported Syntax

### Control Flow
```
if customer.age > 18
  eligibleForDiscount = true
else
  eligibleForDiscount = false
```

### Loops
```
for item in collection
  process(item)

while condition
  doSomething()
```

### Classes & Functions
```
class Customer
  name: string
  age: number

def validateAge(customer: Customer)
  return customer.age >= 18
```

### Special Constructs
```
if any passengers where age > 65
  applySpecialAssistance = true

if all items where status = "active"
  processAllItems()
```

## 🔧 Configuration Options

### Editor Settings
When using `setupBusinessRulesWithEditor()`, these settings are automatically applied:
- `tabSize: 4` - 4-space indentation (Python standard)
- `insertSpaces: true` - Use spaces instead of tabs
- `detectIndentation: false` - Force 4-space indentation
- `autoIndent: 'full'` - Full automatic indentation
- `formatOnType: true` - Format as you type
- `formatOnPaste: true` - Format on paste

### Language Configuration
- Line comments: `//`
- Block comments: `/* */`
- Auto-closing pairs: `{}`, `[]`, `()`, `""`, `''`
- Bracket matching and folding
- Smart indentation rules

## 🐛 Troubleshooting

### "monaco is not defined" Error (SSR Issue)
This system is designed to work client-side only. The error occurs when Monaco Editor code runs during server-side rendering. Ensure:
1. Monaco Editor components are only rendered on the client
2. Use dynamic imports with `ssr: false` in Next.js
3. All setup functions are called after Monaco is loaded

### Indentation Not Working
1. Ensure you're using `setupBusinessRulesWithEditor()` with the editor instance
2. Check that the language is set to `'business-rules'`
3. Try calling `helper.fixCurrentLineIndentation()` manually

### Syntax Highlighting Missing
1. Verify `monaco.languages.setMonarchTokensProvider()` was called
2. Check browser console for integration errors
3. Ensure language ID is `'business-rules'`

## 📁 File Structure
```
syntax-highlighting/
├── index.ts           # Main integration functions
├── tokenizer.ts       # Syntax highlighting rules
├── indentation.ts     # Indentation configuration
├── keywords.ts        # Language keywords
├── operators.ts       # Language operators  
├── patterns.ts        # Common patterns
└── README.md         # This file
```