### Editor Tabs Integration

Location: `components/layout/editor/editor-tabs.tsx`

Lazy loading:
- `PromptEditor` is dynamically imported: `() => import('../../editor/components/prompt-editor')`
- Only loads when the `prompt` tab is active; SSR disabled

Tab config:
- The `prompt` tab (`Palette` icon) is disabled in create mode until a rule exists
- When active and rule exists: `<PromptEditor ruleId={rule.id} onSave={onSave} />`

Tab-switch save:
- On any tab change, `EditorTabs` dispatches `tab-switch-save` with `{ ruleId, fromTab, toTab }`
- `PromptEditor` listens and calls `savePromptOnTabSwitch()` via its `useEditorSave` hook
- Ensures prompt edits persist before switching to other tabs (e.g., Code, Docs)

Shared state:
- Rule tabs manage rule source code, debug, docs, etc.; the Prompt tab manages prompt records tied to the same `ruleId`
- No direct coupling beyond `ruleId` and the tab-switch save event


