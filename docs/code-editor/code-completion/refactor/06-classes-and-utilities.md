# Classes and Utilities

## Global Classes
- Loaded once into the schema registry (server/import step).
- Available in all editors without explicit imports.

## Local Classes
- Parsed from the current model (file) and merged atop global for that model.
- Instantiation detection: `x = ClassName()` or `x = new ClassName()` → `x: ClassName`.

### Class-name completion (inline)
- When typing a capitalized identifier or after an assignment (e.g., `x = Pe|`), completion includes inline class names parsed from the current editor.
- Accepting a class suggestion inserts `ClassName()` to allow immediate construction.
- Parsing supports:
  - `class Name { ... }`
  - Property lines: `prop = Type`, `prop = <Type>`, `prop = ClassName()`, literals.
  - Method lines: `method -> ReturnType` and `method(params) -> ReturnType`.

## Property/Method Access
- `x.prop` → property type from class/BO schema.
- `x.method()` → return type from class/BO schema.

## Modules & Utility Rules
- `module.fn()` → return type from module schema.
- Utility rules treated like functions with typed params/return; types come from saved rule schema.
