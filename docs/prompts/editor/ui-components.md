### UI Components

Files and responsibilities:

1) `components/prompt-editor/index.tsx` (PromptEditor)
- Composes Left (PromptsPanel), Center (CanvasEditor), Bottom (PreviewPanel), and Properties modal
- Handles selection, multi-select, debounced autosave, keyboard delete
- Listens for `tab-switch-save` to persist on navigation

2) `components/prompt-editor/prompts-panel.tsx` (PromptsPanel)
- Lists prompts for a rule; inline creation; edit/delete via actions
- Uses `useActionMutation('prompt.create'|'prompt.update'|'prompt.delete')`
- Integrates `AutoModal` with `PROMPT_SCHEMA` for editing
- Renders `ComponentPalette` beneath the list

3) `components/prompt-editor/component-palette.tsx` (ComponentPalette)
- Draggable items: `label`, `text-input`, `select`, `radio`, `checkbox`, `button`, `divider`
- Drag payload is `application/json` with `{ type, label }`

4) `components/prompt-editor/canvas-editor.tsx` (CanvasEditor)
- Drop new components with defaults; move existing via custom DnD
- Multi-select group drag; resize canvas via corner handle
- Emits `onLayoutChange`, `onComponentUpdate`, selection and double-click events

5) `components/prompt-editor/properties-modal.tsx` (PropertiesModal)
- Slide-out panel; immediate updates to selected component config
- Sections from `./components` (`BasicPropertiesSection`, `StylingSection`, `OptionsSection`)

6) `components/prompt-editor/preview-panel.tsx` (PreviewPanel)
- Collapsible tabs: Preview, Data, Layout JSON
- Uses `PromptRenderer` to render layout and collect `formData`

7) `components/prompt/prompt-renderer.tsx` (PromptRenderer)
- Renders absolute-positioned components from `PromptLayout`
- Handles default values for radio/select (`isDefault`), inline validation with `__validation`
- Calls `onChange` with deltas and validation info

8) `components/prompt-editor/fallback-prompt-editor.tsx`
- Minimal placeholder to avoid hydration/bundle issues if needed


