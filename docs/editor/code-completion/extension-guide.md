## Extension Guide: Adding Methods and Modules

Goal

- Add a new schema-driven method or module function that:
  - Appears in completion
  - Generates correct Python (helpers preferred)
  - Infers correct types (including chaining)

Add a method (example: String → toSnakeCase)

1) Implement/confirm Python helper (if multi-line or reused):
   - File: `helper-functions/string_helpers.py`
   - Export via `helper-functions/__init__.py` (submodule already available as `string_helpers`).

2) Create method schema:
   - File: `o-ui/src/lib/editor/schemas/methods/string/utilities.ts` (or new file under `string/`)
   - Fields:
     - `name: 'toSnakeCase'`
     - `category: 'string'`
     - `returnType: 'string'`
     - `snippetTemplate: 'toSnakeCase()'`
     - `pythonGenerator`: prefer helper call when `debugContext?.useHelpers` else inline 1-liner
     - `debugInfo.helperFunction: 'string_helpers.to_snake_case'`
     - `pythonImports`: [] (if no stdlib needed)

3) Re-export in `schemas/methods/index.ts` so it’s included in `ALL_METHOD_SCHEMAS`.

4) Verify in editor:
   - Typing `myStr.` shows `toSnakeCase()`
   - Assignment `x = myStr.toSnakeCase()` produces helper call and imports
   - `x` infers as `string` and participates in chaining

Add a module function (example: json.parse)

1) Add schema under `o-ui/src/lib/editor/schemas/modules/json.module.ts`.
   - Provide `name: 'parse'`, `module: 'json'`, `returnInterface` if structured, `parameters`, and `pythonGenerator`.

2) Ensure it’s exported in module index (if present) and covered by `ALL_MODULE_SCHEMAS`.

3) Validate completion and typing:
   - `json.parse(text)` completion shows with signature on focus
   - Return type/Interface reflects in hovers and typing

Best practices

- Keep `pythonGenerator` a single line when feasible; route complex logic through helpers
- Always set `returnType` (or `returnInterface`) for accurate type inference
- Use `noParensAllowed` for property-like methods (e.g., `length`)
- Provide clear `parameters` with names to support snippet insertion and argument parsing

Troubleshooting

- Not showing in completion: ensure the file is included in `ALL_METHOD_SCHEMAS` or `ALL_MODULE_SCHEMAS`.
- No Python generated: confirm RHS matches `owner.method` or `owner.method(...)` and schema has `pythonGenerator`.
- Wrong typing: check `category` → base type mapping and `returnType`.


