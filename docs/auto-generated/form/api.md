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
- `useSmartSelect` from `use-smart-select.ts` 🚀
- `useSelectOptions` from `use-select-options.ts` (SmartSelect compatibility wrapper)
- Utilities and types from `form-utils.ts`, `types.ts`

### SmartSelect Options API

```typescript
interface SmartSelectOptions {
  // CORE CONFIG - ONE LINE TO RULE THEM ALL
  source?: string;                    // 'offices.list', 'workflows.list', etc.
  
  // SMART DEFAULTS (optional)
  valueField?: string;                // Auto-infers 'id' if not specified
  labelField?: string;                // Auto-infers 'name' if not specified  
  searchable?: boolean;               // Auto-enables for 10+ items
  placeholder?: string | 'auto';      // Auto-generates "Select {label}..."
  
  // DECLARATIVE DEPENDENCIES 
  when?: Record<string, any>;         // { vendor: '=${vendor}', type: { 'GDS': {...} }}
  
  // ADVANCED FEATURES (optional)
  transform?: (item: any) => SmartSelectOption;  // Custom display logic
  cache?: string | number;            // Cache duration: '5m', 300, etc.
  debounce?: number;                  // Debounce dependency changes (ms)
  
  // LEGACY SUPPORT (auto-converted)
  static?: Array<{ value: string; label: string; disabled?: boolean }>;
  dynamic?: { resource: string; valueField: string; labelField: string };
  conditional?: any[];                // Legacy conditional format
}

interface SmartSelectOption {
  value: string;
  label: string; 
  disabled?: boolean;
  metadata?: Record<string, any>;
}
```

Utilities:
- `getFormValidationSchema(schema, isCreate)` – Zod schema from `ResourceSchema`
- `getVisibleFormFields(schema)` / `getValidatableFields(schema, isCreate)`
- `getFormTabs(visibleFields)` / `organizeFieldsIntoRows(fields)`
- `getFormWidthClass(schema)` / `getFieldWidthClass(field, fieldsInRow)`
- `prepareSubmissionData(data, mode, tenantId, branchId, parentData, schema, navigationContext)`


