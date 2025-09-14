'use client';

import React from 'react';
import { useTagContext } from '@/components/providers/tag-provider';
import { EntityTagModal } from '@/components/ui/enhanced-tag-modal';
import { useActionMutation } from '@/hooks/use-action-api';

// ============================================================================
// JUNCTION TABLE MAPPING
// ============================================================================

const JUNCTION_TABLE_MAP = {
  rule: 'ruleTag',
  class: 'classTag',
  office: 'officeTag',
  node: 'nodeTag',
  process: 'processTag',
  workflow: 'workflowTag'
} as const;

// ============================================================================
// GLOBAL TAG MODAL RENDERER
// ============================================================================

export function GlobalTagModalRenderer() {
  const { modalState, closeTagModal, updateSelectedTags } = useTagContext();

  if (!modalState.isOpen || !modalState.entityType || !modalState.entityId) {
    return null;
  }

  return (
    <EntityTagModal
      isOpen={modalState.isOpen}
      onClose={closeTagModal}
      entityType={modalState.entityType}
      entityId={modalState.entityId}
      selectedTagIds={modalState.selectedTagIds}
      onTagsChange={(tagIds) => {
        updateSelectedTags(tagIds);
        // The modal will close itself after saving
      }}
    />
  );
}

// ============================================================================
// CONVENIENCE HOOK FOR TAG OPERATIONS
// ============================================================================

export function useEntityTagOperations(entityType: string, entityId: string) {
  const junctionTableKey = JUNCTION_TABLE_MAP[entityType as keyof typeof JUNCTION_TABLE_MAP];
  
  const { mutateAsync: createJunction } = useActionMutation(`${junctionTableKey}.create`);
  const { mutateAsync: deleteJunction } = useActionMutation(`${junctionTableKey}.delete`);

  const addTag = async (tagId: string) => {
    await createJunction({
      [`${entityType}Id`]: entityId,
      tagId: tagId
    });
  };

  const removeTag = async (junctionId: string) => {
    await deleteJunction({ id: junctionId });
  };

  return {
    addTag,
    removeTag,
    junctionTableKey
  };
} 