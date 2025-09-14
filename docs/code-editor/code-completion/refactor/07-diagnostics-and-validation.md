# Diagnostics and Validation

## Strategy
- Single debounced validator computes markers.
- Use `monaco.editor.setModelMarkers(model, owner, markers)`.

## Typical Checks
- Unknown property/method on a type.
- Type-incompatible assignments or comparisons.
- Missing required parameters in calls.

## Performance
- Validate on content change with debounce.
- Avoid revalidating non-business-rules models.
