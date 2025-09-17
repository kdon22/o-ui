## Rule Update - Enterprise Best Practices

### Root Cause
- Relationship processing replaced the entire update payload, dropping scalar fields like `sourceCode`/`pythonCode`.

### Correct Pattern (Prisma)
1) Partition payload by schema:
- Scalar updates: keys NOT in `schema.relationships`
- Relationship updates: keys IN `schema.relationships`

2) Process only relationship updates into nested writes:
```ts
const relWrites = processRelationships(relationshipUpdates, schema.relationships || {})
```

3) Merge and update with include:
```ts
const finalData = { ...scalarUpdates, ...relWrites }
await model.update({ where: { id }, data: finalData, include: buildInclude(schema) })
```

### Field Whitelisting (Optional Hardening)
- Derive allowed scalar keys from `RULE_SCHEMA.fields`.
- Reject or strip unexpected keys (defense in depth).
- Add `updatable?: boolean` in FieldSchema to explicitly allow writes.

### Cleaners (Do/Don’t)
- Do: convert only optional FK empty strings to null (see `isOptionalForeignKeyField`).
- Don’t: null-coerce user content fields (e.g., `sourceCode`, `pythonCode`).

### API Surface
- Keep `rule.update` accepting a flat payload of scalars + relationships.
- Avoid overloading with relationship-specific shapes; let processor handle it.

### Telemetry
- Log partition counts: `{ scalarCount, relationshipCount }`.
- Log removed fields from cleaners.
- Sample payload sizes for large content fields.

### Tests
- Unit: updating `sourceCode` persists and returns same value.
- Unit: relationship connect/disconnect merges with scalars.
- Integration: large `sourceCode` updates (10–50 KB) succeed.

### Performance
- Avoid JSON.parse/stringify loops on large text fields.
- Don’t double-serialize large content.
- Include graph only as needed by UI.

### Migration Checklist
- Update `UpdateOperationsService.executeInPlaceUpdate` to partition/merge.
- Ensure `processRelationships` signature stays `(relationshipPayload, schema.relationships)`.
- Add unit tests for rule scalar + relationship updates.
