## Auth Routes & APIs

### NextAuth Handler
- Path: `GET|POST /api/auth/[...nextauth]`
- File: `src/app/api/auth/[...nextauth]/route.ts`
- Purpose: Initializes NextAuth using `src/lib/auth/config.ts`.

### TOTP: Generate Code
- Path: `POST /api/auth/totp/generate`
- File: `src/app/api/auth/totp/generate/route.ts`
- Body (JSON):
```json
{ "email": "user@example.com", "purpose": "login" }
```
- Response (200):
```json
{ "success": true, "message": "Code sent", "userId": "...", "riskInfo": {"isNewDevice": false} }
```
- Errors: 400 invalid JSON/body; 500 internal.
- Notes: Extracts device info for audit; calls `TotpService.generateAndSendCode()` and logs a security event.

### TOTP: Verify Code
- Path: `POST /api/auth/totp/verify`
- File: `src/app/api/auth/totp/verify/route.ts`
- Body (JSON):
```json
{ "email": "user@example.com", "code": "123456", "purpose": "login" }
```
- Response (200):
```json
{ "success": true, "user": { "id": "...", "email": "..." } }
```
- Errors: 400 missing fields; 200 with `success:false` on invalid code (includes `remainingAttempts`); 500 internal.
- Notes: Logs attempts and security events; may increment attempt counts via `TotpService.incrementAttemptCount()`.

### Session: Update Branch
- Path: `POST /api/auth/session/branch`
- File: `src/app/api/auth/session/branch/route.ts`
- Body (JSON):
```json
{ "branchId": "<uuid>" }
```
- Response (200):
```json
{ "success": true, "branchId": "<uuid>", "branchName": "feature-x" }
```
- Errors: 401 unauthorized; 400 invalid branchId; 404 if not found in session's available branches.
- Notes: Updates the current branch in the server session. If your session token omits `availableBranches` (for minimal payload), ensure the client pre-validates the branch or the API is adapted to validate branchId server-side.

### Devices (UI Expectations)
- The devices page calls:
  - `GET /api/auth/devices`
  - `POST /api/auth/devices/trust`
  - `POST /api/auth/devices/revoke`
- Implement these with appropriate auth and audit logging if not already present.

### Middleware
- File: `src/middleware.ts`
- Protects core app paths; unauthenticated requests are redirected to `/login` with a `callbackUrl`.


