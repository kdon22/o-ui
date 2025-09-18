### Data & Filters

Fetching:
- Uses `useActionQuery('{resourceKey}.list', { filters, options })` with `staleTime: 5m` and `fallbackToCache: true`
- Supports passing `enhancedData` to override API result for custom overlays (e.g., rule hierarchy)

Processing:
- `useTableData` computes `processedEntities` and `columns` from schema and state:
  - Search term filter
  - Per-column filter values
  - Sort config `{ field, direction }`
  - Level 1 & Level 2 schema-defined filters via `FilteringConfig`

Level filters:
- `level1Filter` and `level2Filter` can be controlled via props, with callbacks
- Internal state maintained in `useTableState` when not controlled


