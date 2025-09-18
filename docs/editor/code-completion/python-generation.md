## Python Generation

Entrypoint

- `o-ui/src/lib/editor/python-generation/index.ts` → `SimplePythonGenerator`
- Translates line-by-line; delegates multi-line constructs to transformation patterns

Method Invocations

- File: `python-generation/method-invocation-translator.ts`
- Detects simple RHS method forms:
  - `owner.method(args)` and `owner.method` (for `noParensAllowed`)
- Looks up method schema in `ALL_METHOD_SCHEMAS`
- Calls `pythonGenerator(owner, lhs, params, { useHelpers: true })`
- Aggregates imports:
  - Std imports → `import base64`
  - Helpers → `import helper_functions.string_helpers as string_helpers`

Examples

- `newBase = air1.toBase64`
  - Emits (helpers): `newBase = string_helpers.encode_base64(air1)`
  - Else: `import base64` + `newBase = base64.b64encode(air1.encode('utf-8')).decode('utf-8')`

- `new1 = air3.toInt()`
  - Emits: `new1 = int(air3)`

Design goals

- Minimal, schema-driven; no heavy AST
- Idempotent imports, deduped at top
- Multi-line logic delegated to helpers


