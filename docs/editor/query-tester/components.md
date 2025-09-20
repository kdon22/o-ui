### Components

All live components are located under `o-ui/src/components/editor/query-tester/components/`.

- `three-panel-query-interface.tsx`
  - Default layout: left (tables), middle (query), right (results)
  - Uses: `TableTreeSelector`, `SmartExamplesPanel`, `ResultsModal`, `QueryVariablesPanel`

- `integrated-query-interface.tsx`
  - Compact layout ideal for constrained spaces; single column view‑modes (tree/query/results)

- `table-tree-selector.tsx`
  - Fetches categories via `tableCategory.list`
  - Groups tables by category; supports search and compact render

- `smart-examples-panel.tsx`
  - Contextual query examples (per table)

- `results-modal.tsx`
  - Full‑screen results display used by both layouts

- `query-variables-panel.tsx`
  - Renders inputs for `{variable}` placeholders detected in the query

Deleted/legacy components not used at runtime have been removed from the repo to avoid accidental edits.


