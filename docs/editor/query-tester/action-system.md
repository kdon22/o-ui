### Action System Integration

This module follows the Data Synchronization Flow and IndexedDB‑first architecture for metadata, while forcing server reads for table rows.

Endpoints used:
- `tables.list` (enterprise) — list tables for selection
- `tableCategory.list` (enterprise) — list categories for tree organization
- `tables.read` — returns `config.columns` for selected table
- `tableData.list` — returns rows for selected table

Client usage:
- `useEnterpriseActionQuery('tables.list', {}, { staleTime, refetchOnWindowFocus: false })`
- `useEnterpriseActionQuery('tableCategory.list', {}, { ... })`
- `useActionQuery('tables.read', { id }, { enabled: !!id })`
- `useActionMutation('tableData.list', {})`

Notes:
- TableData schema has `serverOnly: true` ensuring no IndexedDB fallback for row data
- Metadata reads are OK from cache; lists use schema‑driven sources
- Results are post‑processed on client to match configured columns order


