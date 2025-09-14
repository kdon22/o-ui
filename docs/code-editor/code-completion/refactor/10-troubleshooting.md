# Troubleshooting

## No completions appear
- Ensure schema connector `loadFromExistingSystem` runs without throwing.
- Confirm providers were registered after schema load.
- Check language ID on model is `business-rules`.

## Wrong or missing types
- Verify the relevant class/module/method exists in the schema registry.
- For local classes, confirm the class is defined before usage in the file.

## Duplicate suggestions
- Check for duplicate provider registrations. Dispose on unmount.
