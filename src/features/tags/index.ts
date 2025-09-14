/**
 * Tags Feature - Main Exports
 * 
 * Centralized exports for the tag management system including:
 * - Schemas and types
 * - UI components
 * - Modal components
 */

// Schemas
export { TAG_SCHEMA } from './tags.schema';
export { TAG_GROUP_SCHEMA } from './tag-groups.schema';

// Types
export type {
  TagEntity,
  TagGroupEntity,
  CreateTagInput,
  UpdateTagInput,
  CreateTagGroupInput,
  UpdateTagGroupInput,
  TagModalProps,
  TagSelectorProps,
  TagDisplayProps,
  RuleTagRelation,
  TagsResponse,
  TagGroupsResponse,
  TagsByGroupResponse,
  TagFilters,
  TagGroupFilters,
  BulkTagOperation,
  BulkTagGroupOperation,
  TagValidationResult,
  TagGroupValidationResult
} from './types';

// Components
export { TagModal } from './components/tag-modal';
export { TagDisplay } from './components/tag-display';

// Hooks (if created later)
// export { useTagManagement } from './hooks/use-tag-management';
// export { useTagGroups } from './hooks/use-tag-groups'; 