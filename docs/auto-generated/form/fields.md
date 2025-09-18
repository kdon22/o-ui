### Field Rendering

Supported types (`form-field.tsx`):
- `text`, `email`, `url` → `Input` with type
- `textarea` → `TextArea`
- `number` → `Input` numeric with empty-string→undefined conversion
- `switch` → `Switch`
- `select` → `Select` with static or dynamic options
- `date` → `Input` type `datetime-local`
- `tags` → `TagsField` (array of strings)
- `component-selector` → `ComponentSelector` (supports `multiSelect`, previews)
- `currency` → `CurrencyField` with min/max from validation

Labels, descriptions, errors:
- Required asterisk and checkmark when completed
- Error message shown beneath field

Dynamic options (`use-dynamic-options.ts`):
- Interface: `field.options.dynamic = { resource, valueField, labelField, filter? }`
- Current implementation is mocked; integrate with ActionClient for production


