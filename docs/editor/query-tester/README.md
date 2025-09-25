### Query Tester — Overview and Quickstart

This module provides a professional, schema‑aware SQL‑like query testing UI embedded in the Rule Editor. It lets users select a data table, build a simple query with variables, run it against the server, and preview results instantly. It also feeds column metadata back into the editor completion system.

Key entry points:
- UI entry: `EditorTabs` → `QueryTestBench`
- Default layout: `components/three-panel-query-interface.tsx`
- Alternate layout: `components/integrated-query-interface.tsx` (opt‑in via prop)

Core principles:
- Uses existing Action System (IndexedDB for metadata, server for data fetch)
- Branch‑aware table/column overlay (via EditorContext/SSOT)
- Server reads for table data (schema serverOnly: true), per Data Sync Flow
- Variable substitution and basic SQL WHERE parsing in the browser

#### Quickstart: Embedding in a page

```tsx
import dynamic from 'next/dynamic'

const QueryTestBench = dynamic(
  () => import('@/components/editor/query-tester/query-test-bench')
    .then(mod => ({ default: mod.QueryTestBench })),
  { ssr: false }
)

export default function QueryPage() {
  return (
    <div className="h-screen">
      <QueryTestBench />
    </div>
  )
}
```

To use the integrated layout:

```tsx
<QueryTestBench layout="integrated" />
```

#### What happens at runtime
- Tables list: `useTableSelection` calls `tables.list` (enterprise action) to show available tables and categories from schema.
- Table details: `useQueryExecution` calls `tables.read` (action) to read `config.columns` for the selected table.
- Data fetch: `useQueryExecution` executes `tableData.list` with schema `serverOnly: true` for server-only execution.
- WHERE filtering: client applies `simple-sql-parser` to filter server rows when the query includes a WHERE clause.
- Completion feedback: after a run, column names are cached via `EditorContextService` for editor IntelliSense.

#### Files to know
- `query-test-bench.tsx` — switches between three‑panel and integrated layouts
- `components/three-panel-query-interface.tsx` — default UI
- `components/integrated-query-interface.tsx` — compact, mobile‑friendly UI
- `hooks/use-table-selection.ts` — tables list
- `hooks/use-query-execution.ts` — data execution + column caching
- `hooks/use-query-variables.ts` — variable detection/substitution
- `utils/simple-sql-parser.ts` — parser and filter helpers

See the rest of this folder for deeper topics (architecture, integration, components, hooks, SQL parser, SSOT/branching, testing, migration, and API surface).


