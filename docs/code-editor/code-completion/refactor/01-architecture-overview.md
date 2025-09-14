# Architecture Overview

- **Goal**: Schema-driven, Monaco-native completion with minimal, reliable glue.
- **Principles**:
  - Single source of truth: editor schemas (no mocks).
  - Thin variable detection and expression resolution.
  - Monaco built-ins for providers and diagnostics.

## High-Level Flow
1. Load schemas → build a registry (methods, modules, classes, BOs).
2. Register Monaco language (tokenizer/config).
3. Register providers (completion, hover, signature help, diagnostics).
4. On keystroke, resolve local context (identifier/chain/call) against registry and symbol table.
5. Return completions/hover/signature help; set markers for diagnostics.

## Primary Responsibilities
- Schema connector: read/normalize schema data.
- Variable detection: decide which suggestions are relevant at position.
- Expression resolver: resolve `obj.prop`, `obj.method()`, `module.fn()` types.
- Providers: Monaco integration points that call the above.
