### Context Menu

Schema-driven actions:
- Configure actions in `ResourceSchema.table.contextMenu` (edit, duplicate, delete, custom)
- Each item: `{ id, label, icon?, action, className?, confirmMessage?, separator? }`

Runtime integration:
- `useTableActions` builds `contextMenuActions` mapping action ids to handlers
- `TableStructure` passes actions to row context menu and actions column

Custom handlers:
- Hook `useChangeHistory` exposes handlers (e.g., view history); pass as `customHandlers` to `useTableActions`


