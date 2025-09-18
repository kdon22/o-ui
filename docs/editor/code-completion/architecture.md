## Architecture – Completion + Generation (SSOT)

High‑level flow (read left → right):

- Monaco Editor → Completion Provider (`o-ui/src/lib/editor/completion/providers/core/main-provider.ts`)
  - Detects context (if/for, start-of-line, SQL vs BR, parameters, property access)
  - Delegates to handlers in `providers/handlers/*`
  - Uses SSOT services:
    - Type inference: `completion/type-inference-service.ts` (wraps Master Type Detector)
    - Schemas: `lib/editor/schemas/**` (methods, modules, business objects)
    - SQL: `sql-query-analyzer.ts`, `sql-assignment-completion.ts`

- Schemas (Single Source of Truth)
  - Methods: `lib/editor/schemas/methods/**`, aggregated in `methods/index.ts` → `ALL_METHOD_SCHEMAS`
  - Modules: `schemas/modules/**` → `ALL_MODULE_SCHEMAS`
  - Business Objects: `schemas/business-objects/**` → properties/types

- Python Generation
  - Entrypoint: `python-generation/index.ts` → `simple-generator.ts`
  - Method Invocation Translator: `python-generation/method-invocation-translator.ts`
    - Looks up schema `pythonGenerator` for owner.method[()] and emits Python
    - Aggregates `pythonImports` and helper imports

- Type Inference
  - `type-system/master-type-detector.ts`
    - Assignment RHS analysis (literals, constructors, alias, method/property chains)
    - Chain-aware method return types via `schemaBridge.getTypeMethodReturnType`
    - Property type fallback via `schemaBridge.getBusinessObjectPropertyType`

Key principles

- Schema‑driven: completion, generation, and typing read the same method schemas
- Minimal parsing: pattern-based detection for speed and reliability
- Helpers first: multi-line/complex logic routed through `helper_functions`
- Imports aggregated once per translation

Core files

- Completion
  - `completion/index.ts`, `providers/core/main-provider.ts`
  - `providers/handlers/*` (default, keyword, parameter, property, SQL)
  - `providers/utils/*` (type/schema bridges, variable detection)
- Schemas
  - `schemas/methods/string/*`, `array-methods.ts`, etc.; `methods/index.ts`
  - `schemas/modules/*`; `schemas/business-objects/*`
- Typing
  - `completion/type-inference-service.ts`
  - `type-system/master-type-detector.ts`
  - `type-system/schema-bridge.ts`
- Generation
  - `python-generation/simple-generator.ts`
  - `python-generation/method-invocation-translator.ts`

Monaco integration (from legacy notes)

- Register in order:
  1) Language ID `'business-rules'`
  2) Tokenizer + language configuration (indent, onEnter)
  3) Providers: completion, hover, signature help (optional)
  4) Diagnostics: set model markers (debounced)
- Always dispose provider registrations on unmount to avoid duplicates.

Performance & disposal notes

- Avoid full-file AST; use cursor-local analysis and schema caches
- Debounce heavy work (validation/schema refresh)
- Cache method lists per type; memoize schema lookups
- Track disposables and clean up on editor unmount/tab switch


