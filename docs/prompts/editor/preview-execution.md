### Preview, Renderer & Execution

Preview (PromptEditor → PreviewPanel):
- Tabbed footer toggles: Preview, Data, Layout JSON
- Uses `PromptRenderer` to render the selected prompt layout and collect `formData`
- Shows simple validity badge based on `__validation`

PromptRenderer specifics:
- Absolute-positioned rendering respecting `canvasWidth`/`canvasHeight`
- Components supported: label, text-input, select, radio, checkbox, divider
- Defaults: applies `isDefault` for select/radio; checkbox defaults to `false`
- Validation: required fields produce `__validation.missingRequired` and `errors[id]`
- `onChange` emits deltas merged in the parent’s `formData` and includes `__validation`

Execution page (`components/prompt/prompt-execution-page.tsx`):
- Fetches execution via `/api/prompt/executions/:id` (polls when PENDING/RUNNING)
- Renders one or more prompts using `PromptRenderer`
- Aggregates values, builds `fields` and `values` per prompt on submit
- POSTs `SubmitExecutionRequest { responseData }` back to `/api/prompt/executions/:id`
- Handles status states (Pending/Running/Completed/Failed/Timeout) and read-only mode


