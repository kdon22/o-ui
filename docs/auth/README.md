## Auth System Overview

This project uses NextAuth (JWT strategy) with a Prisma adapter and a custom Credentials provider to implement email + TOTP MFA. Sessions are enriched on sign-in to preload tenant, branch, and editor preferences for a fast first render and offline-first initialization.

### Key Capabilities
- Strong MFA via time-based one-time codes (TOTP)
- JWT-based sessions enriched at sign-in for instant context
- Branch context stored in the session for ActionClient initialization
- Middleware-protected app routes with callback redirect support
- Device/audit hooks for risk scoring and security logging

### Core Files
- NextAuth route: `src/app/api/auth/[...nextauth]/route.ts`
- NextAuth config: `src/lib/auth/config.ts`
- TOTP APIs: `src/app/api/auth/totp/generate/route.ts`, `.../verify/route.ts`
- Session branch API: `src/app/api/auth/session/branch/route.ts`
- Middleware: `src/middleware.ts`
- Login page: `src/app/(auth)/login/page.tsx`
- Devices page: `src/app/(auth)/devices/page.tsx`

### High-level Flow
1) User enters email → backend sends a 6-digit TOTP to email.
2) User enters TOTP → we `signIn('totp')` with NextAuth Credentials provider.
3) On sign-in, JWT callback enriches token (tenant, branches, preferences).
4) Session callback maps token→session with minimal transformations.
5) Middleware restricts protected routes; unauthenticated users go to `/login`.

### Environment
- `NEXTAUTH_URL` must point to the app base URL
- `NEXTAUTH_SECRET` must be set for JWT/token encryption

### Performance Notes
- The JWT callback preloads only essential data (minimal, timeout-wrapped DB calls).
- Branch context is kept small; full lists load on demand via ActionClient/IndexedDB.

See the rest of this folder for detailed guides on routes, callbacks, TOTP, middleware, login flow, branch context, and troubleshooting.


