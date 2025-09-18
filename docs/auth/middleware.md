## Middleware Protection

File: `src/middleware.ts`

### Behavior
- Allows public and framework paths: `/api`, `/_next`, `/public`, `/favicon`, `/`, `/login`, `/devices`, and any path containing `/auth/`.
- For protected paths (see matcher), validates an auth token via `getToken`.
- If no token, redirects to `/login` with `callbackUrl` so users return to their original destination after sign-in.

### Matcher
The middleware applies to these routes:
- `/nodes/:path*`
- `/rules/:path*`
- `/classes/:path*`
- `/marketplace/:path*`
- `/test-parser`
- `/test-typescript-completion`

### Notes
- Ensure `NEXTAUTH_SECRET` is set; `getToken` relies on it.
- To protect additional routes, add them to `config.matcher`.


