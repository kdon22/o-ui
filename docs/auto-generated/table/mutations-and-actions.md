### Mutations & Row Actions

Mutations (`use-table-mutations.ts`):
- `createMutation`, `updateMutation`, `deleteMutation` via `useActionMutation('{resourceKey}.create|update|delete')`
- Optimistic updates; logs; optional inheritance cache invalidation for processes with `nodeId`
- Optional batch version tracking via `onBatchChange`

Row and bulk actions (`useTableActions`):
- Handles add/edit/delete/duplicate and custom context menu actions from schema
- Supports bulk actions via `resource.table.bulkSelectOptions`
- Integrates with navigation context for contextual actions

Header actions:
- `headerActions` prop accepts React nodes or function `(handleAdd) => ReactNode`
- `TableHeader` renders add button state and custom actions


