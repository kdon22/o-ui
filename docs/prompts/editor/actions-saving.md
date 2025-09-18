### Actions, Saving & Events

Fetching:
- `useActionQuery('prompt.list', { filters: { ruleId } }, { enabled: !!ruleId })` returns `PromptEntity[]`.

Mutations (PromptsPanel):
- `useActionMutation('prompt.create'|'prompt.update'|'prompt.delete')`
- `AutoModal` uses `PROMPT_SCHEMA` to edit selected prompt

Saving layout/content (PromptEditor):
- Unified save: `useEditorSave(promptAdapter, { id: selectedPrompt?.id, tab: 'prompt' })`
- Debounced autosave (2s) via `useDebouncedCallback` writes current selected prompt state
- Snapshot tracking: `updatePromptSnapshot` keeps dirty state accurate for tab switches

Tab-switch save orchestration:
- `EditorTabs` dispatches `window.dispatchEvent(new CustomEvent('tab-switch-save', { detail: { ruleId, fromTab, toTab } }))` on tab changes
- `PromptEditor` listens and calls `savePromptOnTabSwitch()` ensuring prompt changes persist before switching

What is saved:
- `{ layout, promptName, content, isPublic, executionMode }` for the selected prompt

Optimism:
- `PROMPT_SCHEMA.actions.optimistic = false` → server-first writes (no local IndexedDB optimism for prompts)


