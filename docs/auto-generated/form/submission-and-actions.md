### Submission & Actions

Paths:
- If parent `onSubmit` is provided, AutoForm calls it with `submissionData` (create/edit)
- Otherwise (create mode only), an internal mutation is used via `getActionClient(tenantId, branchContext)`

Internal create mutation:
- Action: `${schema.actionPrefix}.create`
- Data: `submissionData` (cleaned values)
- Options: `{ navigationContext: mergedNavigationContext }`
- `branchContext` is passed to the ActionClient call
- On success: extracts `entity.data` from contextual result, then calls `onSubmit(actualEntityData)` to notify parent (e.g., modal)

Junction auto-creation:
- Enabled by default in create mode via `enableJunctionCreation`
- Navigation context (`nodeId/processId/workflowId/...`) is merged and passed in options; backend auto-creates junctions

UI states:
- Loading overlay shown when loading/submitting
- Keyboard shortcut: Ctrl/Cmd+Enter submits the form


