### API (Props & Types)

Component props (union of `auto-form.tsx` and `types.ts`):

```ts
interface AutoFormProps {
  schema: ResourceSchema;
  mode: 'create' | 'edit';
  initialData?: Record<string, any>;
  parentData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  enableAnimations?: boolean;
  enableKeyboardShortcuts?: boolean;
  onError?: (error: Error) => void;
  showCancel?: boolean;
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string };
  componentContext?: { parentData?: any; contextId?: string };
  enableJunctionCreation?: boolean; // default true in create mode
}
```

Important exports:
- `AutoForm` from `auto-form.tsx`
- `FormField` from `form-field.tsx`
- `useDynamicOptions` from `use-dynamic-options.ts`
- Utilities and types from `form-utils.ts`, `types.ts`

Utilities:
- `getFormValidationSchema(schema, isCreate)` – Zod schema from `ResourceSchema`
- `getVisibleFormFields(schema)` / `getValidatableFields(schema, isCreate)`
- `getFormTabs(visibleFields)` / `organizeFieldsIntoRows(fields)`
- `getFormWidthClass(schema)` / `getFieldWidthClass(field, fieldsInRow)`
- `prepareSubmissionData(data, mode, tenantId, branchId, parentData, schema, navigationContext)`


