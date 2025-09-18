### Branching & Change History

Branch-aware reads:
- `useActionQuery` uses the action system which applies branch overlay (current branch plus default where missing)
- `fallbackToCache: true` ensures IndexedDB is used when offline

Change history:
- `useChangeHistory({ resourceKey, tenantId, branchId })` provides change history modal handlers
- `ChangeHistoryModal` is rendered by AutoTable with props from the hook

Batch version tracking (optional):
- `useBatchVersionTracking` can be wired for navigation-based save flows; the indicator is present but disabled by default


