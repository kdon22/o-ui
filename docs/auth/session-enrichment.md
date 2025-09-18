## Session Enrichment (JWT → Session)

The system preloads essential context on sign‑in to achieve fast initial render and consistent offline‑first initialization.

### Sign‑in (jwt callback)
- Look up the user + userTenants.
- Pick the default tenant; set `tenantId`, `rootNodeId`, `currentTenant`.
- Optionally fetch a small workspace structure (root nodes) and `rootNodeIdShort` (with timeouts and fallbacks).
- Load a minimal set of branches (or create a safe default) and set `branchContext` with `currentBranchId` and `defaultBranchId`.
- Store minimal `preferences`, `permissions`, and `codeEditorPreferences`.
- Add metadata: `dataLastSync`, `cacheVersion`.

If any DB call times out or fails, store a compact fallback token so the UI remains usable and ActionClient can hydrate from IndexedDB later.

### Session mapping (session callback)
- Directly copy from token to `session.user` (no DB calls).
- Ensure `branchContext` has `currentBranchId` and `defaultBranchId` (derive from list or defaults if necessary).

### Session updates (jwt update trigger)
- Supports branch switching and preference refresh without re‑sign‑in.
- Accepts partial updates, deep‑merging `branchContext` and refreshing editor prefs.

### Best Practices
- Keep token small; avoid embedding large lists.
- Wrap DB queries with short timeouts and provide safe fallbacks.
- Do not hardcode branch names like `main`; use real IDs.


