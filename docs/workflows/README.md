## Workflow Definition - Visual JSON Spec

This document explains the workflow definition JSON we persist in `workflow.definition`. The builder creates this structure; the runtime uses it to execute.

### Goals
- Minimal, stable shape focused on graph topology
- Dynamic runtime behavior (rules/retries/timeouts) handled by the job engine, not persisted in the graph

### Top-level structure
```json
{
  "definition": {
    "visual": { "nodes": [], "connections": [], "viewport": {}, "layout": {} },
    "execution": {},
    "metadata": { "nodeCount": 0, "connectionCount": 0, "complexity": 0 }
  }
}
```

### Nodes
- Common fields: `id`, `type`, `position {x,y}`, `size {width,height}`, `label`
- Types:
  - start: optional `trigger { type: manual|scheduled|event, config? }`
  - process: `processId?`, `processName?`, `processType?` (no rules/timeout/retry persisted)
  - end: optional `action { type: success|failure|custom, message? }`
  - exclusive-gateway: optional `condition { type: rule|expression|custom, value, ruleId? }`, `defaultBranch?`
  - parallel-gateway: `executionMode: all|first|any`, `maxConcurrent?`

### Connections
- Fields: `id`, `sourceNodeId`, `targetNodeId`, optional `sourcePort`, `targetPort`, `label`, `condition`
- Conventions:
  - From process: `sourcePort` can be `success` or `error`
  - Use `condition` on a connection to indicate skips or branch selection hints

### Sample JSON
- See `o-ui/docs/workflows/sample-basic.json` for:
  - Start → Process A → Process B (forward)
  - Start → Process A → End Success (skip over Process B when `condition: "skip_b"`)
  - Start → Process A → End Fail (on error)

### Builder behavior
- The builder emits nodes without `rules`, `timeout`, `retryCount`.
- Auto-save writes to `workflow.definition` via the `workflow.update` action.
- Creation sets an initial `definition` with Start/End and any nodes you add.

### Runtime responsibilities
- Evaluate rules/expressions at execution time.
- Handle timeouts/retries per process dynamically.
- Use `sourcePort` and optional `condition` on connections to decide routing.

### Extending the spec
- Prefer adding metadata under `visual.nodes[i]` or `visual.connections[i]` rather than new top-level fields.
- Keep persisted shape stable; derive runtime-only details at execution time.



