# Cache Invalidation (Schema-Driven)

This guide documents the schema-driven cache invalidation system used by the Action System. It eliminates hardcoded action → cache mappings and discovers invalidation rules directly from resource schemas.

## Why this matters
- Zero hardcoding: rules come from schemas
- Works automatically for new resources/junctions
- Branch-aware and debounced for performance

## Files
```
o-ui/src/lib/action-client/react/query/invalidation/
├── index.ts                # Public API exports
├── gateway.ts              # Orchestrates invalidation
├── schema-scanner.ts       # Discovers rules from schemas
├── cache-key-factory.ts    # Builds query keys
└── types.ts                # Types for schema metadata
```

## Core flow
```
useActionMutation → invalidateAfterMutation →
  SchemaScanner (actionImpacts, cacheImpacts) →
  CacheKeyFactory (derive keys) →
  TanStack Query (precise refetch)
```

## Schema additions
- actionImpacts on resources
- cacheImpacts on junctions (optional)

Example (resource):
```ts
actionImpacts: {
    'node.create': {
        derivedCaches: ['nodeInheritance', 'treeStructure'],
        entityResolver: (variables, result) => {
            const keys: string[] = []
            if (result?.data?.id) keys.push(`nodeInheritance.${result.data.id}`)
            if (variables.parentId) keys.push(`treeStructure.children.${variables.parentId}`)
            return keys
        },
        description: 'Node creation affects tree structure and inheritance'
    }
}
```

Example (junction):
```ts
junctionConfig: {
    cacheImpacts: {
        derivedCaches: ['nodeInheritance', 'processRules'],
        affectedEntityResolver: (junction, op) => [
            `nodeInheritance.${junction.nodeId}`,
            `processRules.${junction.processId}`
        ],
        description: 'ProcessRule changes affect nodes and process rule lists'
    }
}
```

## Using it
```ts
import { useActionMutation } from '@/hooks/use-action-api'

const { mutate: createNode } = useActionMutation('node.create')
createNode({ name: 'New', parentId: 'P1' })
// → Schema-driven invalidation runs automatically
```

Manual trigger (rare):
```ts
import { invalidateAfterMutation } from '@/lib/action-client/react/query/invalidation'
await invalidateAfterMutation(queryClient, {
    action: 'custom.operation',
    variables: { id: '1' },
    result,
    branchContext
})
```

## Derived cache key patterns
- nodeInheritance.{nodeId}
- nodeInheritance.processAffected.{processId}
- nodeInheritance.ruleAffected.{ruleId}
- treeStructure.children.{parentId}
- processRules.{processId}

## Performance & debugging
- Schema scan ~10ms (cached ~1 min)
- Rule application ~2–5ms/action
- Logs include total keys invalidated and time taken

```ts
const result = await invalidateAfterMutation(queryClient, ctx)
console.log('Invalidation:', {
    totalKeysInvalidated: result.totalKeysInvalidated,
    timeTakenMs: result.timeTakenMs,
    caches: result.invalidatedCaches
})
```

## Migration notes
- Legacy helpers removed: invalidateCacheAfterMutation, invalidateResourceFamily, invalidateEverything
- Use invalidateAfterMutation or rely on useActionMutation defaults

## References
- ACTION_CLIENT_INTEGRATION_COMPLETE.md
- SCHEMA_DRIVEN_INVALIDATION_IMPLEMENTATION.md
- CACHE_INVALIDATION_DOCS_COMPLETE.md
