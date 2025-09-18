## Troubleshooting & FAQ

### Users stuck on /login or infinite redirect
- Ensure `NEXTAUTH_SECRET` is set and consistent.
- Check middleware matcher; public routes should be allowed.
- Verify `getToken` works (token present after successful sign-in).

### TOTP code not received
- Check email transport/service in `TotpService.generateAndSendCode`.
- Rate limit may be throttling; inspect server logs.
- Verify the email address is registered.

### Invalid TOTP errors immediately
- Confirm the client sends numeric 6 digits only.
- Check clock skew/expiry in `TotpService.verifyCode`.
- Review attempt counters; account may be temporarily locked.

### Session not reflecting branch switch
- After calling `/api/auth/session/branch`, also trigger a NextAuth session update if needed.
- Ensure JWT `update` trigger merges `branchContext`.
- Avoid hardcoded branch names; use real IDs.

### Slow sign-in
- DB calls in JWT sign-in are timeout‑wrapped; verify timeouts and indexes.
- Keep token payload minimal; move heavy data to ActionClient/IndexedDB.

### Devices page empty
- Implement `/api/auth/devices` family routes.
- Ensure device fingerprints are captured in audit services.


