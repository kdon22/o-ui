## Devices & Trusted Devices

UI: `src/app/(auth)/devices/page.tsx`

### Purpose
Let users review and manage devices that accessed their account, marking devices as trusted to reduce MFA prompts.

### Expected APIs
- `GET /api/auth/devices` → returns `{ devices: UserDevice[] }`
- `POST /api/auth/devices/trust` with `{ deviceId }`
- `POST /api/auth/devices/revoke` with `{ deviceId }`

### Device Model (UI)
```
id, deviceId, name, type (DESKTOP|MOBILE|TABLET|UNKNOWN),
platform, browser, ipAddress, location,
isTrusted, trustLevel, isActive,
firstSeenAt, lastSeenAt, trustedAt
```

### UX Details
- Icons reflect device type.
- Trust badge shows Untrusted / Partial / Trusted.
- Actions: Trust device, Revoke access.
- Includes last seen, location, IP when available.

### Security Notes
- Backends should verify the requester owns the device and log all changes.
- Pair with audit logs and risk scoring (new device, new location, etc.).


