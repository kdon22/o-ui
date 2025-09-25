import React, { useState } from 'react';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { v4 as uuidv4 } from 'uuid'; // Add UUID generation
import type { 
  Tag, 
  UseTagOperationsProps, 
  UseTagOperationsReturn 
} from './types';

// ============================================================================
// TAG OPERATIONS HOOK
// ============================================================================

export function useTagOperations({
  value,
  onChange,
  entityType,
  entityId,
  hasValidEntity
}: UseTagOperationsProps): UseTagOperationsReturn {
  
  // ============================================================================
  // STATE
  // ============================================================================
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6b7280');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);

  // ============================================================================
  // QUERIES - FIXED API FORMAT
  // ============================================================================
  
  // Get all available tags
  const allTagsResponse = useActionQuery(
    'tag.list',
    undefined,
    { 
      // Server-only handled by schema serverOnly: true
      enabled: true 
    }
  );

  // Get assigned tags for this entity - WITH TAG DETAILS
  const assignedTagsResponse = useActionQuery(
    `${entityType}Tag.list`,
    hasValidEntity ? { 
      [`${entityType}Id`]: entityId,
      include: ['tag'] // 🎯 Include tag details for display
    } : undefined,
    { 
      // Server-only handled by schema serverOnly: true
      enabled: hasValidEntity 
    }
  );

  // ============================================================================
  // MUTATIONS - DIRECT JUNCTION OPERATIONS (WORKING PATTERN)
  // ============================================================================
  const createTagMutation = useActionMutation('tag.create');
  const createJunctionMutation = useActionMutation(`${entityType}Tag.create`); // Dynamic: ruleTag, nodeTag, etc.
  const deleteJunctionMutation = useActionMutation(`${entityType}Tag.delete`); // Dynamic deletion

  // ============================================================================
  // COMPUTED VALUES - EXTRACT DATA FROM RESPONSE
  // ============================================================================
  const allTags: Tag[] = allTagsResponse?.data?.data || [];
  
  // 🎯 TRANSFORM JUNCTION RECORDS TO TAG OBJECTS
  const assignedTags: Tag[] = React.useMemo(() => {
    const junctionRecords = assignedTagsResponse?.data?.data || [];
    return junctionRecords
      .map((junction: any) => junction.tag) // Extract tag object from junction
      .filter(Boolean) // Remove any null/undefined tags
      .sort((a: Tag, b: Tag) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [assignedTagsResponse?.data?.data]);

  // Remove duplicates and sort
  const uniqueTags = allTags
    .filter((tag: Tag, index: number, arr: Tag[]) => 
      arr.findIndex((t: Tag) => t.id === tag.id) === index
    )
    .sort((a: Tag, b: Tag) => a.sortOrder - b.sortOrder);

  // ============================================================================
  // ACTION HELPERS
  // ============================================================================
  const resetCreateForm = () => {
    setNewTagName('');
    setNewTagDescription('');
    setNewTagColor('#6b7280');
    setIsCreating(false);
  };

  // ============================================================================
  // SSOT ID GENERATION & HANDLERS
  // ============================================================================
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      // 🎯 SSOT: Generate ID once, use everywhere
      const tagId = uuidv4();
      
      console.log('🔥 [TagOperations] SSOT ID Generation:', {
        tagId,
        tagName: newTagName.trim(),
        willConnectToEntity: hasValidEntity,
        entityType,
        entityId
      });
      
      // Create the tag with explicit ID
      const tagResponse = await createTagMutation.mutateAsync({
        id: tagId, // 🎯 Use SSOT ID
        name: newTagName.trim(),
        description: newTagDescription.trim() || undefined,
        color: newTagColor,
        sortOrder: assignedTags.length,
        isActive: true
      });

      // 🎯 DIRECT JUNCTION CREATION: Use working node-process pattern
      if (hasValidEntity) {
        await createJunctionMutation.mutateAsync({
          [`${entityType}Id`]: entityId, // Dynamic: ruleId, nodeId, etc.
          tagId: tagId // Tag ID from SSOT
          // Junction record gets its own ID (auto-generated or composite)
        });
      }

      // Update form state with SSOT ID
      const newTagIds = [...value, tagId];
      onChange(newTagIds);

      // Reset form
      resetCreateForm();
    } catch (error) {
      
    }
  };

  const handleAddExistingTag = async (tag: Tag) => {
    if (!value.includes(tag.id)) {
      try {
        // 🎯 DIRECT JUNCTION CREATION: Use working pattern
        if (hasValidEntity) {
          await createJunctionMutation.mutateAsync({
            [`${entityType}Id`]: entityId, // Dynamic: ruleId, nodeId, etc.
            tagId: tag.id // Existing tag ID
            // Junction record gets its own ID (auto-generated or composite)
          });
        }

        // Update form state
        const newTagIds = [...value, tag.id];
        onChange(newTagIds);
      } catch (error) {
        
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      // 🎯 DIRECT JUNCTION DELETION: Delete by component IDs
      if (hasValidEntity) {
        // Delete junction record by component IDs (action system handles lookup)
        await deleteJunctionMutation.mutateAsync({
          [`${entityType}Id`]: entityId, // Dynamic: ruleId, nodeId, etc.
          tagId: tagId // Tag to disconnect
        });
      }

      // Update form state
      const newTagIds = value.filter(id => id !== tagId);
      onChange(newTagIds);
    } catch (error) {
      
    }
  };

  const handleDragStart = (tagId: string) => {
    setDraggedTagId(tagId);
  };

  const handleDragEnd = () => {
    setDraggedTagId(null);
  };

  // ============================================================================
  // RETURN INTERFACE - MATCH EXPECTED TYPE
  // ============================================================================
  return {
    // State
    isCreating,
    newTagName,
    newTagDescription, 
    newTagColor,
    editingTagId,
    draggedTagId,
    
    // Data
    allTags: uniqueTags,
    assignedTags,
    
    // State setters
    setIsCreating,
    setNewTagName,
    setNewTagDescription,
    setNewTagColor,
    setEditingTagId,
    setDraggedTagId: (id: string | null) => setDraggedTagId(id),
    
    // Handlers
    handleCreateTag,
    handleRemoveTag,
    handleAddExistingTag,
    handleDragStart,
    handleDragEnd,
    resetCreateForm,
    
    // Mutations (required by interface)
    createTagMutation,
    assignTagMutation: createJunctionMutation, // Schema-driven relationship operations
    unassignTagMutation: deleteJunctionMutation // Schema-driven relationship operations
  };
}