// ============================================================================
// TAG SYSTEM EXPORTS
// ============================================================================

// Main component
export { TagField, default as TagFieldDefault } from './tag-field';

// Focused sub-components
export { TagDisplay } from './tag-display';
export { TagCreateForm } from './tag-create-form';
export { AvailableTags } from './available-tags';

// Business logic hook
export { useTagOperations } from './use-tag-operations';

// Types
export type {
  Tag,
  TagFieldProps,
  TagOperationsState,
  TagOperationsActions,
  TagOperationsHandlers,
  UseTagOperationsProps,
  UseTagOperationsReturn
} from './types';

// Legacy exports (for compatibility during migration)
export { TagFormField } from './tag-form-field';
export { TagSection } from './tag-section';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export { TagField as default } from './tag-field'; 