# Schema Registry

## Source of Truth
- Methods by base type (e.g., string/number/object).
- Modules with functions (http/json/math/date/vendor).
- Business objects/classes with properties/methods.
- Utility rule signatures (function-like with returnType/params).

## Normalization
- Ensure `returnType` and parameter types are strings or normalized shape.
- Lowercase keys for lookup (module names, class names).

## Access API (examples)
- `getModules(): { name, methods[] }[]`
- `getModule(name): { name, methods[] } | null`
- `getClassSchema(name): Class | null`
- `getBusinessObject(name): BO | null`
- `getTypeMethods(typeName): Method[]`

## Best Practices
- Never embed mock data.
- Keep registry construction fast and cacheable.
