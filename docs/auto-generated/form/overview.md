### AutoForm Overview

AutoForm is a schema-driven form generator. It renders fields from a `ResourceSchema`, handles validation via Zod, supports tabs/row layouts, dynamic options, context-aware defaults, and branch-aware submission.

Key files:
- `src/components/auto-generated/form/auto-form.tsx` – Main component; orchestration, submission, tabs, animations, keyboard shortcuts, context defaults
- `src/components/auto-generated/form/form-utils.ts` – Field visibility, tab/row grouping, field/form width classes, Zod schema factory, submission preparation
- `src/components/auto-generated/form/form-field.tsx` – Field renderer; text/textarea/number/switch/select/date/tags/component-selector/currency
- `src/components/auto-generated/form/use-dynamic-options.ts` – Dynamic options hook (current mock; integrate with action system)
- `src/components/auto-generated/form/form-debug.tsx` – Optional debug panel with session/validation/state
- `src/components/auto-generated/form/types.ts` – Types used by the form
- `src/components/auto-generated/form/index.ts` – Barrel exports

Core flow:
1) Compute defaults from session/navigation context and schema (`generateCompleteDefaultValues`)
2) Build Zod schema from `ResourceSchema` (`getFormValidationSchema`)
3) Compute visible/validatable fields, tabs, and rows
4) Render fields with `FormField` and collect values with React Hook Form
5) On submit, prepare and submit data (internal mutation for create, or call parent `onSubmit`)


