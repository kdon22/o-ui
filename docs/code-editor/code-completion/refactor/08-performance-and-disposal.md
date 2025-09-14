# Performance and Disposal

## Performance
- Cursor-local parsing only; no full-file AST.
- Debounce expensive operations (validation, schema refresh).
- Cache registry lookups and method lists per type.

## Disposal
- Track all provider disposables and dispose on unmount.
- Ensure language is registered once; avoid duplicate providers.

### Idempotent registration + global disposal
- `registerBusinessRulesLanguageFactory(monaco)` registers language + tokenizer + config once, and guards a single completion provider via a global disposable.
- On unmount (e.g., switching tabs), call the global cleanup to prevent duplicates:

```ts
import { disposeBusinessRulesLanguageProviders } from '@/components/editor/language/language-registration'

// in editor cleanup
disposeBusinessRulesLanguageProviders()
```
