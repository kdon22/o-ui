### Hooks

#### `useTableSelection`
Purpose: fetch and manage available tables and current selection.

Sources:
- `useEnterpriseActionQuery('tables.list', {})` — lists tables

Returns:
- `availableTables: DataTable[]`
- `selectedTable: DataTable | null`
- `selectTable(id: string)`
- `tablesLoading: boolean`

#### `useQueryVariables`
Purpose: detect `{variable}` placeholders and substitute values.

Behavior:
- Detects unique names with `/\{(\w+)\}/g`
- `hasAllVariableValues` guards execution until all values provided
- `getFinalQuery()` performs substitution; auto‑quotes strings if needed

#### `useQueryExecution`
Purpose: execute query against server and produce a result set with columns.

Actions used:
- `useActionQuery('tables.read', { id })` — fetches `config.columns`
- `useActionMutation('tableData.list', {})` — gets rows (schema serverOnly: true)

Client‑side filtering:
- If query has WHERE, `simple-sql-parser` parses conditions and filters `result.data`

Column extraction:
- If `config.columns` present, project rows to only those columns (in order) and build column descriptors accordingly; else infer from rows

Completion cache:
- After success, caches columns via `EditorContextService.cacheColumns(cacheKey, columns)`
- Also clears type detection cache for fresh suggestions


