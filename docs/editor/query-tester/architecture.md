### Query Tester Architecture

High‑level flow:
1) UI (QueryTestBench) → Select table → Build query → Execute
2) Tables metadata from IndexedDB (schema‑driven), overlayed by branch
3) Data rows from server (`tableData.list`) with `skipCache: true`
4) Client filters rows using parsed WHERE (optional)
5) Columns fed to EditorContext cache → improves IntelliSense

#### Modules
- UI containers: `three-panel-query-interface.tsx`, `integrated-query-interface.tsx`
- Components: `table-tree-selector`, `smart-examples-panel`, `results-modal`, `query-variables-panel`
- Hooks: `use-table-selection`, `use-query-execution`, `use-query-variables`
- Utils: `simple-sql-parser`

#### Data sources
- Schema‑driven tables list
  - `tables.list` (enterprise action) → returns tables (and categories via `tableCategory.list`)
  - Tables have `config.columns` used to constrain visible columns
- Table details
  - `tables.read` (action) → resolves specific table `config.columns`
- Data rows
  - `tableData.list` (action mutation) with `{ skipCache: true }` to bypass IndexedDB

#### Branching & SSOT
- Branch overlay applied only to metadata (tables/columns) via `sql-provider` and `EditorContextService`
- Data reads remain branch‑strict server calls
- Editor completion cache key includes tenant and branch (`tenantId@currentBranchId:tableName`)

#### Responsibilities
- UI containers own layout and UX transitions
- Hooks own fetching, execution, validation, and caching mechanics
- Parser owns strict bracketed identifier rules


