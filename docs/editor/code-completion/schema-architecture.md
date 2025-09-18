## Schema Architecture (SSOT)

Purpose

- Centralize language data (methods, modules, business objects) for completion, typing, and generation.
- Provide a stable API (schema bridge) to query return types and parameters without coupling to file layout.

Components

- Method Schemas (`schemas/methods/**`)
  - Per-category files (string, number, array, object, date, boolean)
  - Aggregated by `schemas/methods/index.ts` → `ALL_METHOD_SCHEMAS`

- Module Schemas (`schemas/modules/**`)
  - http, date, math, json, vendor
  - Aggregated into `ALL_MODULE_SCHEMAS`

- Business Objects (`schemas/business-objects/**`)
  - Domain object properties for property completion and type fallback

- Schema Bridge (`type-system/schema-bridge.ts`)
  - Indexes methods and modules once
  - Functions:
    - `getTypeMethodReturnType(baseType, method)`
    - `getParametersForTypeMethod(baseType, method)`
    - `getModuleReturnType(module, method)`
    - `getBusinessObjectPropertyType(typeName, propName, allText)`

Guidelines

- Keep schemas small; one responsibility per file
- Use `returnType` for primitives; `returnInterface` for structured results
- Prefer helpers for multi-line logic and keep generators one-line


