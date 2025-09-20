### Integration Guide

#### 1) Mount the component
Prefer dynamic import (client‑only):

```tsx
import dynamic from 'next/dynamic'

const QueryTestBench = dynamic(
  () => import('@/components/editor/query-tester/query-test-bench')
    .then(mod => ({ default: mod.QueryTestBench })),
  { ssr: false }
)

<QueryTestBench />
```

Switch to integrated layout (optional):

```tsx
<QueryTestBench layout="integrated" />
```

Receive generated query text (copy to editor, etc.):

```tsx
<QueryTestBench onQueryGenerated={(q) => myEditorApi.insert(q)} />
```

#### 2) Ensure Editor Context is set
The completion cache uses `EditorContextService` for tenant/branch. Set it once when the app initializes:

```ts
import { EditorContextService } from '@/components/editor/language/editor-context'

EditorContextService.set({
  tenantId: session.user.tenantId,
  branchContext: {
    currentBranchId: branchStore.current,
    defaultBranchId: branchStore.default,
  }
})
```

#### 3) Action System endpoints required
- `tables.list` — list all data tables (with categoryId)
- `tableCategory.list` — list all table categories
- `tables.read` — read one table; returns `config.columns`
- `tableData.list` — returns rows for a tableId

`tableData.list` must be called with `skipCache: true` (already set by `useQueryExecution`).

#### 4) Data model expectations
- Table entity should have:
  - `id`, `name`, optional `tableName` (sanitized programmatic name), `description`
  - `config.columns`: array of `{ name: string; type?: string }`
  - Branch fields: `branchId`, `originalTableId`

#### 5) Styling & layout
Both layouts are designed to fill their container; wrap in a parent with constrained height (e.g., `h-full`).


