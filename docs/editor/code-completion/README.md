## Code Completion and Generation – Architecture and Guide

This folder documents the Monaco completion system, schema-driven methods, Python generation, and type inference. It explains how the pieces fit together and how to extend them safely.

Contents:
- architecture.md – High-level data flow and provider pipeline
- schemas-and-methods.md – Method schemas, categories, and examples
- method-visibility-matrix.md – Grid of methods × contexts (condition | expression | assignment)
- python-generation.md – Method invocation translator and imports
- type-inference.md – Assignment typing and chain-aware detection
- integration-map.md – File-by-file responsibilities and relationships
- extension-guide.md – Steps to add new methods/modules cleanly
- troubleshooting.md – Common issues and fixes
 - HELPER_FUNCTIONS_IMPLEMENTATION_COMPLETE.md – Helper library and 1:1 debug mapping overview

Related systems:
- See `o-ui/docs/schema-system/` for the full schema system docs that power method schemas and completion.

Start with architecture.md, then review the other topics as needed.


