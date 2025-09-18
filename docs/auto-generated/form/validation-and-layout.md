### Validation & Layout

Validation (Zod):
- Built per-field based on `FieldSchema.type`
- Handles nullable/optional; arrays default to `[]` when optional/nullable
- Business rule: if both `executionMode` and `runOrder` exist, a transform sets `executionMode` from `runOrder`

Visible vs validatable fields:
- System fields hidden from UI: `id, tenantId, branchId, original*Id, createdAt, updatedAt, createdById, updatedById, version`
- `getVisibleFormFields` returns fields with `form` config and not in system list
- `getValidatableFields` includes required or fields with `form`, respecting exclude flags

Tabs & rows:
- `getFormTabs` groups by `field.tab` (default `General` if unspecified)
- `organizeFieldsIntoRows` groups by `form.row` and sorts by `form.order`

Width classes (12-col grid):
- `getFieldWidthClass` maps `full|xl|lg|md|sm|xs|half|third|quarter` to responsive col spans
- `getFormWidthClass` maps schema `form.width` to container max widths: `sm|max-w-lg`, `md|max-w-2xl`, `lg|max-w-4xl`, `xl|max-w-6xl`, `full|max-w-full`


