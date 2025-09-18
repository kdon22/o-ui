### AutoTable Overview

AutoTable renders schema-driven tables with filtering, sorting, inline forms, context menus, and branch-aware data via the action system.

Key files:
- `components/auto-generated/table/auto-table.tsx` – Main orchestrator; data fetch, filters, inline form, table structure, bulk actions, change history
- `components/auto-generated/table/types.ts` – Props and internal types
- `components/auto-generated/table/hooks/*` – Data/Mutations/Actions/State/ChangeHistory/Junction helpers
- `components/auto-generated/table/components/*` – Header, filters, structure, inline form, bulk actions

Core flow:
1) Locate schema by `resourceKey` (matches `actionPrefix` in `ResourceSchema`)
2) Fetch data with `useActionQuery('{resourceKey}.list', { filters, options })` (branch-aware)
3) Process data for search, column filters, sort, and level 1/2 schema-driven filters
4) Render header, filters, inline form (portal), table rows/columns, and bulk actions
5) Provide `useTableMutations` (create/update/delete) with optimistic updates and optional batch version tracking


