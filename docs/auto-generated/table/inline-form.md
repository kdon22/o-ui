### Inline Form

Behavior:
- Inline form slides in when adding/editing; portal-rendered at top-level in table
- Uses the same `ResourceSchema` field definitions as modal forms
- Submits via AutoForm’s submission path (parent data and navigation context passed)

Props (from `types.ts` → `InlineFormProps`):
- `resource`, `entity?`, `onSubmit`, `onCancel`, `mode`, `parentData?`, `navigationContext?`

Parent data:
- When embedding processes under a node, `parentData={{ nodeId }}` is passed so junctions auto-create server-side


