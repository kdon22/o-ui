### Migration Notes

Recent cleanup:
- Removed legacy components: `query-builder-pane`, `results-pane`
- Removed demo files: `integration-example.tsx`, `examples/integrated-usage-example.tsx`
- Removed unused `python-generator.ts`
- Updated `index.ts` to stop re‑exporting deleted modules

What to import now:
- `QueryTestBench` (default)
- `ThreePanelQueryInterface` or `IntegratedQueryInterface` if you need direct control
- Hooks: `useTableSelection`, `useQueryExecution`

Do not import removed components; they no longer exist.


