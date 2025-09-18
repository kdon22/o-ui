## Type Inference (Assignments, Chaining)

Core files

- `o-ui/src/lib/editor/type-system/master-type-detector.ts`
- `o-ui/src/lib/editor/completion/type-inference-service.ts`
- `o-ui/src/lib/editor/type-system/schema-bridge.ts`

What it does

- Rebuilds types from the buffer (assignments, loops, properties)
- Analyzes assignment RHS for:
  - Literals (string, number, float, boolean, array, dict)
  - Constructors (e.g., `Customer()`)
  - Aliases (`x = y`)
  - Method/property chains (`x = a.toBase64.toInt()`)

Method return types

- Chaining resolver splits `owner.method(...) . next(...)`
- For each method segment:
  - Use `schemaBridge.getTypeMethodReturnType(baseType, method)`
  - Fallback to schema `returnType` or `object` when base is unknown
  - Property fallback via `schemaBridge.getBusinessObjectPropertyType`

Results

- `newBase = air1.toBase64` → `string`
- `new1 = air3.toInt()` → `number`
- Chained methods resolve step by step


