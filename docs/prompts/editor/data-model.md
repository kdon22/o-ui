### Data Model & Schema

Types (prompt editor module `components/prompt-editor/types.ts`):
- `ComponentType` and `ComponentConfig` – visual/form config
- `ComponentItem { id, type, x, y, label?, config }`
- `PromptLayout { items, canvasWidth?, canvasHeight? }`
- `PromptEntity { id, ruleId, promptName, content?, layout, isPublic, executionMode, createdAt, updatedAt }`
- `CreatePromptInput`, `UpdatePromptInput`

Renderer-side types (`components/prompt/types.ts`):
- `PromptLayoutItem` – normalized for runtime rendering
- `PromptLayout { items, canvasWidth, canvasHeight }`
- `FormValidation { isValid, missingRequired, errors }`
- `PromptFormData` – includes optional `__validation`

Resource schema (`features/prompts/prompts.schema.ts`):
- `PROMPT_SCHEMA` defines fields: `promptName`, `content`, `executionMode`, `isPublic`, `layout`(json), `ruleId`
- `actions`: `create`, `update`, `delete`, `duplicate`, `bulk`, `optimistic: false` (server-first writes)
- `relationships` to `rules`, `tenants`, `branches`, `users`, and `originalPrompt`
- `indexedDBKey: (record) => record.id`

Storage & Actions:
- CRUD action keys: `prompt.create`, `prompt.update`, `prompt.delete`, `prompt.list`
- Left panel uses `useActionQuery('prompt.list', { filters: { ruleId } })`
- Saves via `useEditorSave(promptAdapter)` with payload subset `{ layout, promptName, content, isPublic, executionMode }`


