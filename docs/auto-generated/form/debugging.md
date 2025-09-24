### Debugging

FormDebugComponent (`form-debug.tsx`):
- Shows session/tenant/branch, form validity, submission state
- Lists required fields and missing ones
- Prints current form values and provides quick actions to log state or test submit
- Extra sections for ID tracking and submission flow

Recommended usage:
- Keep enabled during development to inspect context, required fields, and errors

Common pitfalls:
- Missing tenant/branch context leads to submission errors → verify `useActionClientContext` and `useBranchContext`
- Dynamic options are mocked → ensure integration with action system when going live


