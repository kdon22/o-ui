## Login Flow & UX

File: `src/app/(auth)/login/page.tsx`

### Steps
1) Email step: user provides email → app calls `POST /api/auth/totp/generate`.
2) TOTP step: user enters 6‑digit code → app calls `signIn('totp', { email, code, redirect: false })`.
3) On success, step shows a success state and redirects to `callbackUrl` (default `/`).

### UX Details
- Remembers user preference (7‑day remember) via localStorage.
- Code input enforces numeric, length 6, centered visually.
- Resend code button calls the generate endpoint again.
- Clear, minimal error messages; no sensitive info leakage.

### Routing
- Honors `callbackUrl` query param set by middleware (original path + search).
- Uses `next/navigation` for client-side navigation.


