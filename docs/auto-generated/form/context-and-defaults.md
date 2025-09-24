### Context & Defaults

Default values:
- Computed via `generateCompleteDefaultValues(schema, mode, initialData, parentData, navigationContext, session)` (from `../modal/utils`)
- Covers autoValue fields (IDs, tenant/branch, etc.) and schema `defaultValue`

Session/branch:
- `useActionClientContext()` to get `tenantId` and `branchContext`
- `useBranchContext()` for branch switching and derived state

Submission preparation:
- `prepareSubmissionData` merges defaults + form data
- Converts empty `''|undefined` to `null` (server validates)
- Ensures autoValue fields are present (added as `null` to trigger server auto-population when missing)
- Adds `parentData` for context; navigation/junctions handled by action system

Auto pythonName for Rules:
- When `schema.databaseKey === 'rule'`, watches `name` and sets `pythonName` using `convertToPythonName`


