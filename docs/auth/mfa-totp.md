## MFA / TOTP Flow

Email + TOTP provides a secure, low‑friction MFA experience.

### User Flow
1) User enters email on `/login`.
2) App calls `POST /api/auth/totp/generate` → sends 6‑digit code to email.
3) User enters code → app calls `signIn('totp')` with `{ email, code }`.
4) On success, NextAuth triggers JWT sign‑in enrichment and redirects.

### Endpoints
- `POST /api/auth/totp/generate`
  - Validates JSON/body.
  - Extracts device info (IP, UA, fingerprint) via `AuthAuditService`.
  - Calls `TotpService.generateAndSendCode(email, purpose, deviceInfo)`.
  - Logs a security event on success.

- `POST /api/auth/totp/verify`
  - Validates required fields.
  - Calls `TotpService.verifyCode(email, code, purpose)`.
  - Logs success/failure and may increment attempt counts.

### NextAuth Credentials Provider (`id: 'totp'`)
- On authorize, verifies the code via `TotpService.verifyCode` and returns `{ id, email, name }`.

### Security & Hardening
- Rate‑limit TOTP generation and verification endpoints.
- Track attempts per email/device/IP; lock or step‑up after repeated failures.
- Use short expiry (e.g., 5–10 minutes) and single‑use codes.
- Audit all events with device fingerprinting and geo/IP data.

### UX Notes
- Show neutral errors (“Invalid code”) to avoid leaking validity.
- Provide resend option with sensible backoff.


