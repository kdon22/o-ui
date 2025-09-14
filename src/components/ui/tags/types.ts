// ============================================================================
// SHARED TAG TYPES
// ============================================================================

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
}

export interface TagFieldProps {
  value?: string[];
  onChange: (tagIds: string[]) => void;
  entityType?: string;
  entityId?: string;
  className?: string;
  disabled?: boolean;
}

export interface TagOperationsState {
  isCreating: boolean;
  newTagName: string;
  newTagDescription: string;
  newTagColor: string;
  editingTagId: string | null;
  draggedTagId: string | null;
}

export interface TagOperationsActions {
  setIsCreating: (value: boolean) => void;
  setNewTagName: (value: string) => void;
  setNewTagDescription: (value: string) => void;
  setNewTagColor: (value: string) => void;
  setEditingTagId: (value: string | null) => void;
  setDraggedTagId: (value: string | null) => void;
  resetCreateForm: () => void;
}

export interface TagOperationsHandlers {
  handleCreateTag: () => Promise<void>;
  handleRemoveTag: (tagId: string) => Promise<void>;
  handleAddExistingTag: (tag: Tag) => Promise<void>;
}

export interface UseTagOperationsProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  entityType: string;
  entityId?: string;
  hasValidEntity: boolean;
}

export interface UseTagOperationsReturn extends TagOperationsState, TagOperationsActions, TagOperationsHandlers {
  allTags: Tag[];
  assignedTags: any[];
  createTagMutation: any;
  assignTagMutation: any;
  unassignTagMutation: any;
  handleDragStart: (tagId: string) => void;
  handleDragEnd: () => void;
  resetCreateForm: () => void;
} 