# Migration and Cleanup

## What we removed
- Mock schema data.
- UTR JSON auto-load in the editor.
- Legacy/duplicate provider systems (recommended cleanup if still present).

## What we added
- Schema-backed connector, factory wiring, detector/provider API alignment.

## Post-migration checklist
- Verify only one completion provider is active for `business-rules`.
- Confirm schemas load without mocks.
- Validate diagnostics appear and disappear correctly on edits.
