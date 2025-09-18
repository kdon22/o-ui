## Schemas and Methods

Where

- Methods live under `o-ui/src/lib/editor/schemas/methods/**`
- Aggregated in `methods/index.ts` as `ALL_METHOD_SCHEMAS`
- Examples: `string/encoding.ts` (toBase64/fromBase64), `string/utilities.ts` (toInt), `array-methods.ts`

Schema fields (most used)

- `name`: method identifier (e.g., `toBase64`)
- `category`: base type family (`string`, `array`, etc.)
- `noParensAllowed`: if true, completion uses no parentheses (e.g., `length`)
- `parameters`: optional list of named parameters for snippets and generation
- `returnType` or `returnInterface`: drives completion detail and type inference
- `pythonGenerator(variable, resultVar, params, debugContext)`: emits Python
- `pythonImports`: list of std imports (e.g., `['base64']`)
- `debugInfo.helperFunction`: helper hint (e.g., `string_helpers.encode_base64`)

Examples

- String → Base64
  - File: `schemas/methods/string/encoding.ts`
  - `toBase64` has `noParensAllowed: true`, returns `string`, uses helper or `base64` inline

- String → Int
  - File: `schemas/methods/string/utilities.ts`
  - `toInt()` returns `number`, one-line Python: `int(variable)`

- Array utilities
  - `length` (no parens), `first`, `last`, `isEmpty`
  - Mutations (`push`, `pop`) keep results predictable; helpers recommended for complex variants

Conventions

- Use single, clear categories; `schema-bridge` maps category → base type
- Prefer `returnType` over interfaces unless you need rich object hovers
- For multi-line logic, prefer helpers and keep `pythonGenerator` one-line
- Provide `parameters` with clear names for snippet UX and argument parsing

Advanced notes (from legacy schema docs)

- Validation: ensure each schema has id, name, category, returnType/returnInterface, and a function `pythonGenerator`
- Parameters should define `required` explicitly; optional params may include `defaultValue`
- Chainable methods: methods returning the same base type enable natural chaining in both typing and completion


