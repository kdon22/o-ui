## Branch Context in Session

Files:
- NextAuth config: `src/lib/auth/config.ts`
- Session API: `src/app/api/auth/session/branch/route.ts`
- Session service (server patterns): `src/features/session/services/session-service.ts`

### What is stored
- `session.user.branchContext` contains:
  - `currentBranchId`
  - `defaultBranchId`
  - Optional: `availableBranches` (kept minimal in token; ActionClient can load full lists from IndexedDB)

### How it’s set
- On sign‑in (JWT callback), we fetch branches for the tenant (with timeout/fallback) and set minimal context.
- On session update (JWT update trigger), we deep‑merge updates to `branchContext`.
- The session callback ensures `currentBranchId`/`defaultBranchId` are always present.

### Updating the Current Branch
- API: `POST /api/auth/session/branch` with `{ branchId }`.
- Validates that `branchId` exists in session’s available branches and updates the server session.
- If your token omits `availableBranches`, ensure your client preloads and sends a valid `branchId`, or adapt the route to validate branch existence server‑side.

### Recommended Client Pattern
- Use a centralized branch store in the UI.
- When switching branches:
  1) Update local UI state.
  2) Call `/api/auth/session/branch` to persist.
  3) Trigger a NextAuth `session.update` to refresh token/session if needed.


