# Expression Resolution

## Scope
- Chains: `obj.prop.sub`
- Calls: `obj.method(args)`, `module.fn(args)`, `Class()`

## Algorithm (cursor-local)
1. Slice the current line up to the cursor.
2. Tokenize or split conservatively.
3. Identify pattern: chain, call, or variable start.
4. Resolve step-by-step:
   - If starts with variable: get type from symbol table.
   - If starts with module: use module schema.
   - If starts with class: treat `Class()` as constructor → type `Class`.
   - For `.prop`: look up property in class/BO schema → update current type.
   - For `.method()`: use schema method returnType → update current type.

## Return Types
- Always come from the registry; avoid heuristics when possible.

## Tips
- Guard against partial/invalid input; return best-effort types.
