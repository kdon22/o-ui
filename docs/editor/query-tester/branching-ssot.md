### Branching & SSOT Alignment

Policy:
- Storage remains branch‑strict; overlay is applied only for metadata views that require it
- Query Tester fetches tables metadata with branch awareness and overlay where applicable (categories and tables), and always fetches row data from server for the selected table

Mechanics:
- Editor context is provided via `EditorContextService.set({ tenantId, branchContext })`
- Column caches are keyed by `tenantId@currentBranchId:tableName`
- When `useQueryExecution` runs, it:
  - Clears type‑detection cache
  - Invalidates cached columns for the table key
  - Caches fresh columns derived from `config.columns` or response rows

Outcome:
- Monaco completion can suggest accurate column names for the selected table without stale data, consistent with the active branch


