### AutoForm Overview

AutoForm is a schema-driven form generator with **incredible SmartSelect capabilities** 🚀. It renders fields from a `ResourceSchema`, handles validation via Zod, supports tabs/row layouts, declarative conditional options, context-aware defaults, and branch-aware submission.

Key files:
- `src/components/auto-generated/form/auto-form.tsx` – Main component; orchestration, submission, tabs, animations, keyboard shortcuts, context defaults
- `src/components/auto-generated/form/form-utils.ts` – Field visibility, tab/row grouping, field/form width classes, Zod schema factory, submission preparation
- `src/components/auto-generated/form/form-field.tsx` – Field renderer; text/textarea/number/switch/**SmartSelect**/date/tags/component-selector/currency
- `src/components/auto-generated/form/use-smart-select.ts` – **🚀 INCREDIBLE** SmartSelect system with declarative conditional options
- `src/components/auto-generated/form/use-select-options.ts` – Legacy compatibility wrapper for SmartSelect
- `src/components/auto-generated/form/form-debug.tsx` – Optional debug panel with session/validation/state
- `src/components/auto-generated/form/types.ts` – Types used by the form
- `src/components/auto-generated/form/index.ts` – Barrel exports

Core flow:
1) Compute defaults from session/navigation context and schema (`generateCompleteDefaultValues`)
2) Build Zod schema from `ResourceSchema` (`getFormValidationSchema`)
3) Compute visible/validatable fields, tabs, and rows
4) Render fields with `FormField` and collect values with React Hook Form
5) **SmartSelect fields automatically handle conditional dependencies** with action system integration
6) On submit, prepare and submit data (internal mutation for create, or call parent `onSubmit`)

### What Makes SmartSelect Incredible

Instead of complex conditional logic:
```typescript
// 😰 OLD WAY (50+ lines of boilerplate)
options: {
  dynamic: { resource: 'offices', valueField: 'id', labelField: 'name' },
  conditional: [
    { watchField: 'vendor', apiFilters: { vendor: '{value}' } },
    { watchField: 'type', apiFilters: { type: (value) => value === 'GDS' ? { supportedTypes: 'GDS' } : {} } }
  ]
}
```

You get this:
```typescript
// 🚀 NEW WAY (3 lines of pure magic)
options: {
  source: 'offices.list',
  when: { vendor: '=${vendor}', type: { 'GDS': { supportedTypes: 'GDS' } } }
}
```

**90% less code, 100% more readable, infinite possibilities!**


