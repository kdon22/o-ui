# Monaco Integration

## Providers we use
- Completion: `monaco.languages.registerCompletionItemProvider`
- Hover: `monaco.languages.registerHoverProvider`
- Signature help (optional): `registerSignatureHelpProvider`
- Diagnostics: `monaco.editor.setModelMarkers`
- Language config: `setMonarchTokensProvider`, `setLanguageConfiguration`

## Registration order
1. Ensure `'business-rules'` language registered.
2. Tokenizer + language config (indent, onEnter rules).
3. Providers (completion, hover, signature help).
4. Diagnostics handler (debounced).

## Disposal
- Keep disposables returned by provider registrations.
- Dispose on editor unmount to avoid duplicates.
