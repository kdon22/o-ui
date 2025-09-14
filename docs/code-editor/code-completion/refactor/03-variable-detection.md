# Variable Detection

## Purpose
- Decide what to suggest at a given cursor position and what types are in scope.

## Responsibilities
- Provide a `detectAtPosition(lines, position)` returning:
  - `completionType`: variable | property | method | module | function_parameter | none
  - `availableVariables`: current scope symbols (name/type/source).
  - Optional: `baseVariable`, `expectedParameterType`.

## Inputs
- Model text (lines)
- Monaco `position`
- Schema registry
- Symbol table (assignments, loop vars, utility returns)

## Outputs
- Lightweight context the providers can consume.

## Notes
- Keep it regex-light; prefer token info if available.
- Don’t parse entire file; only what’s needed at the cursor.

## Context states (SSOT)

The context analyzer emits the following states used by completion routing:

- `variable_typing`: typing an identifier; suggest variables (and class names).
- `value_typing`: typing a value after an operator (e.g., `x = Pe|`); suggest variables (and class names).
- `method_access`: after a dot on a variable chain (e.g., `obj.sub.`); suggest properties/methods.
- `module_access`: after a dot on a recognized module (e.g., `Http.`); suggest module members.
- `awaiting_value`: right after `=`; suggest variables.
- `keyword_started`: after a keyword like `if`, `for`; suggest variables.
- `none`: default fallback; suggest variables.

Type definitions updated:

- `StatementContext` includes `module_access`.
- `ContextAnalysis.suggestions` includes `'modules'`.
- `ContextAnalysis` now has optional `module?: string`.
