# Monaco Business Rules Editor - Scalable Architecture

## 📁 **FILE STRUCTURE** (All files < 300 lines)

```
editor/
├── index.ts                                    # Main exports (< 50 lines)
├── ARCHITECTURE.md                             # This file
│
├── types/                                      # Split types by domain
│   ├── index.ts                               # Re-exports (< 50 lines)
│   ├── variable-types.ts                      # Variable & parsing types (< 200 lines)
│   ├── editor-types.ts                        # Editor component types (< 150 lines)
│   ├── language-service-types.ts              # Monaco language types (< 150 lines)
│   └── conversion-types.ts                    # Bidirectional sync types (< 100 lines)
│
├── language/                                  # Monaco language service
│   ├── index.ts                               # Clean exports (< 50 lines)
│   ├── language-registration.ts               # Main registration (< 100 lines)
│   ├── language-config.ts                     # Editor config (< 200 lines)
│   ├── tokenizer.ts                          # Syntax highlighting (< 200 lines)
│   │
│   └── completion/                            # Split completion by concern
│       ├── index.ts                          # Main completion provider (< 100 lines)
│       ├── context-analyzer.ts               # Parse typing context (< 150 lines)
│       ├── variable-suggester.ts             # Variable completions (< 150 lines)
│       ├── property-suggester.ts             # Property completions (< 150 lines)
│       └── contextual-suggester.ts           # Smart contextual logic (< 200 lines)
│
├── constants/                                 # Split constants by type
│   ├── index.ts                               # Re-exports (< 50 lines)
│   ├── variables/                             # Variable definitions
│   │   ├── index.ts                          # Re-exports (< 50 lines)
│   │   ├── built-in-variables.ts             # Core variables (< 150 lines)
│   │   ├── object-properties.ts              # Object property mappings (< 200 lines)
│   │   └── custom-modules/                   # Extensible module system
│   │       ├── index.ts                      # Module registry (< 100 lines)
│   │       ├── date-module.ts               # Date functions (< 200 lines)
│   │       ├── math-module.ts               # Math functions (< 200 lines)
│   │       └── string-module.ts             # String functions (< 200 lines)
│   │
│   ├── operators/                             # Split operators by category
│   │   ├── index.ts                          # All operators export (< 50 lines)
│   │   ├── comparison-operators.ts           # ==, !=, >, < etc. (< 100 lines)
│   │   ├── logical-operators.ts              # And, Or, Not etc. (< 100 lines)
│   │   ├── string-operators.ts               # Contains, BeginsWith etc. (< 100 lines)
│   │   └── custom-operators.ts               # User-defined operators (< 100 lines)
│   │
│   ├── keywords.ts                            # Language keywords (< 200 lines)
│   └── values.ts                              # Common values (< 100 lines)
│
├── services/                                  # Core business logic services
│   ├── index.ts                               # Service exports (< 50 lines)
│   ├── variable-detection/                    # Advanced variable detection
│   │   ├── index.ts                          # Detection orchestrator (< 100 lines)
│   │   ├── local-variable-parser.ts          # Parse local assignments (< 200 lines)
│   │   ├── object-analyzer.ts                # Deep object analysis (< 200 lines)
│   │   ├── type-inferencer.ts                # Smart type inference (< 250 lines)
│   │   └── module-resolver.ts                # Resolve custom modules (< 150 lines)
│   │
│   ├── code-generation/                       # Python generation
│   │   ├── python-generator.ts               # Main generator (< 250 lines)
│   │   └── reverse-generator.ts              # Python → Rules (< 250 lines)
│   │
│   └── validation/                            # Code validation
│       ├── syntax-validator.ts               # Syntax checking (< 200 lines)
│       └── semantic-validator.ts             # Semantic analysis (< 200 lines)
│
├── components/                                # React components
│   ├── monaco-business-editor.tsx             # Main editor wrapper (< 200 lines)
│   ├── business-rules-editor.tsx              # Business rules tab (< 150 lines)
│   ├── python-editor.tsx                     # Python tab (< 150 lines)
│   ├── sync-indicator.tsx                    # Sync status (< 100 lines)
│   └── editor-toolbar.tsx                    # Action toolbar (< 150 lines)
│
├── utils/                                     # Utility functions
│   ├── editor-helpers.ts                     # Monaco utilities (< 150 lines)
│   ├── block-operations.ts                   # Code block movement (< 200 lines)
│   └── syntax-parser.ts                      # Parse business rule AST (< 250 lines)
│
└── helpers/                                   # Helper widget integration
    ├── expression-builder.ts                 # Expression builder integration (< 150 lines)
    └── action-palette.ts                     # Action palette integration (< 150 lines)
```

## 🎯 **KEY ARCHITECTURAL PRINCIPLES:**

### 1. **Domain Separation**
- **Types**: Split by domain (variables, editor, language service, conversion)
- **Constants**: Split by category (variables, operators, keywords, values)
- **Services**: Split by functionality (detection, generation, validation)

### 2. **Extensibility Focus**
- **Custom Modules**: Easy to add new modules (`date`, `math`, `string`, etc.)
- **Plugin Architecture**: New operators/functions via simple file addition
- **Module Registry**: Central registration for custom functionality

### 3. **Variable Detection Architecture**
```
Variable Detection Flow:
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   User Types Code   │ -> │   Context Analyzer  │ -> │  Variable Suggester │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                       │
                                       v
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  Property Suggester │ <- │   Object Analyzer   │ <- │  Local Var Parser   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                       │
                                       v
                           ┌─────────────────────┐
                           │   Module Resolver   │
                           └─────────────────────┘
```

### 4. **File Size Compliance**
- ✅ **All files < 300 lines**
- ✅ **Index files < 50 lines**
- ✅ **Core services < 250 lines**
- ✅ **Components < 200 lines**

## 🚀 **EXTENSIBILITY BENEFITS:**

### **Adding a New Module (e.g., Database module):**
1. Create `constants/variables/custom-modules/database-module.ts`
2. Add to `constants/variables/custom-modules/index.ts`
3. Done! Auto-detected in IntelliSense

### **Adding New Operators:**
1. Create entry in appropriate operators file
2. Auto-imported via index files
3. Available immediately in completion

### **Adding New Object Types:**
1. Add to `built-in-variables.ts`
2. Add properties to `object-properties.ts`
3. Auto-suggested with property access

This architecture supports **unlimited growth** while maintaining **clean, focused files**. 

## See also

- Code completion system
  - `../editor/code-completion/architecture.md`
  - `../editor/code-completion/schemas-and-methods.md`
  - `../editor/code-completion/schema-architecture.md`
  - `../editor/code-completion/type-inference.md`
  - `../editor/code-completion/python-generation.md`
  - `../editor/code-completion/extension-guide.md`
  - `../editor/code-completion/troubleshooting.md`
