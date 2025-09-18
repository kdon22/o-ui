### Architecture

This documentation covers the Prompt Editor system used for building interactive prompt forms attached to a rule. It consolidates all moving parts and how they interact.

Key modules:
- `components/prompt-editor/index.tsx` – Orchestrator composing panels, canvas, properties, preview. Fetches prompts via `useActionQuery('prompt.list')`. Uses `useEditorSave(promptAdapter)` for debounced autosave and tab-switch saves.
- `components/prompt-editor/canvas-editor.tsx` – Visual drag-and-drop canvas for layout items, multi-select movement, resizing canvas.
- `components/prompt-editor/properties-modal.tsx` – Slide-out editor for component configuration sections.
- `components/prompt-editor/prompts-panel.tsx` – Left panel: list/create/edit/delete prompts, plus `ComponentPalette`.
- `components/prompt-editor/component-palette.tsx` – Draggable component types (label, inputs, select, radio, checkbox, button, divider).
- `components/prompt-editor/preview-panel.tsx` – Bottom panel with tabs for live preview, data, and JSON.
- `components/prompt/prompt-renderer.tsx` – Renders a layout into interactive form, handles validation and onChange payloads.
- `features/prompts/prompts.schema.ts` – `PROMPT_SCHEMA` ResourceSchema powering CRUD, auto-generated forms/modals, and action-system integration.

Data flow:
- Load prompts: `useActionQuery('prompt.list', { filters: { ruleId } })` returns `PromptEntity[]`.
- Select a prompt: `PromptEditor` holds `selectedPrompt` state and initializes save snapshot.
- Edit layout: `CanvasEditor` emits `onLayoutChange` and `onComponentUpdate`; orchestrator updates state and triggers debounced autosave via `useEditorSave`.
- Properties: `PropertiesModal` immediately updates selected component config; orchestrator updates snapshot and debounced save.
- Preview: `PreviewPanel` uses `PromptRenderer` to render, collect form data, and surface validation via `__validation`.

Saving:
- `useEditorSave(promptAdapter)` provides `save`, `updateSnapshot`, `isDirty`, `saveOnTabSwitch`, `setLastSaved`.
- Debounced autosave (2s) writes `{ layout, promptName, content, isPublic, executionMode }` for the selected prompt.
- A global `window` `tab-switch-save` event is dispatched by `EditorTabs` on tab change; `PromptEditor` listens and calls `saveOnTabSwitch()` to persist before navigation.

Types (prompt editor):
- `PromptEntity { id, ruleId, promptName, content?, layout: PromptLayout, isPublic, executionMode, createdAt, updatedAt }`
- `PromptLayout { items: ComponentItem[], canvasWidth?, canvasHeight? }`
- `ComponentItem { id, type, x, y, label?, config: ComponentConfig }`

Execution:
- For live runtime execution pages, see `components/prompt/prompt-execution-page.tsx`; it fetches execution via `/api/prompt/executions/:id`, renders prompts with `PromptRenderer`, collects `responsePayload`, and POSTs results.


