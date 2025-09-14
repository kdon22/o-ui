'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/generalUtils';

// Local imports
import { useTagOperations } from './use-tag-operations';
import { TagDisplay } from './tag-display';
import { TagCreateForm } from './tag-create-form';
import { AvailableTags } from './available-tags';
import type { TagFieldProps } from './types';

// ============================================================================
// UTILS
// ============================================================================

// Auto-detect entity type from URL if not provided
function detectEntityType(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.includes('/rules')) return 'rule';
    if (path.includes('/nodes')) return 'node';
    if (path.includes('/processes')) return 'process';
    if (path.includes('/offices')) return 'office';
    if (path.includes('/workflows')) return 'workflow';
    if (path.includes('/classes')) return 'class';
  }
  return 'rule';
}

// ============================================================================
// MAIN TAG FIELD COMPONENT
// ============================================================================

export function TagField({
  value = [],
  onChange,
  entityType,
  entityId,
  className,
  disabled = false
}: TagFieldProps) {

  // ============================================================================
  // SETUP
  // ============================================================================
  const detectedEntityType = entityType || detectEntityType();
  const hasValidEntity = Boolean(entityId && entityId !== 'new' && entityId.trim() !== '');

  // ============================================================================
  // BUSINESS LOGIC
  // ============================================================================
  const {
    // State
    isCreating,
    newTagName,
    newTagDescription,
    newTagColor,
    setDraggedTagId,
    
    // Actions
    setIsCreating,
    setNewTagName,
    setNewTagDescription,
    setNewTagColor,
    resetCreateForm,
    
    // Handlers
    handleCreateTag,
    handleRemoveTag,
    handleAddExistingTag,
    
    // Data
    allTags,
    assignedTags,
    
    // Mutations
    createTagMutation,
    assignTagMutation,
    unassignTagMutation
  } = useTagOperations({
    value,
    onChange,
    entityType: detectedEntityType,
    entityId,
    hasValidEntity
  });

  // ============================================================================
  // COMPUTED VALUES - OPTIMISTIC SELECTED TAGS
  // ============================================================================
  
  // Combine server data (assignedTags) with optimistic updates (value)
  const selectedTags = React.useMemo(() => {
    // Start with server-confirmed tags
    const confirmedTags = assignedTags.filter(tag => tag.id && tag.name);
    
    // Add optimistic tags that aren't yet confirmed by server
    const optimisticTagIds = value.filter(tagId => 
      !confirmedTags.some(tag => tag.id === tagId)
    );
    
    const optimisticTags = optimisticTagIds
      .map(tagId => allTags.find(tag => tag.id === tagId))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
    
    return [...confirmedTags, ...optimisticTags];
  }, [assignedTags, value, allTags]);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToSelected = (e: React.DragEvent) => {
    e.preventDefault();
    const tagId = e.dataTransfer.getData('text/plain');
    const tag = allTags.find(t => t.id === tagId);
    
    if (tag && !value.includes(tagId)) {
      // Immediately update the value optimistically (hides from Available Tags)
      const newValue = [...value, tagId];
      onChange(newValue);
      
      // Then handle the API call (which may fail and rollback)
      handleAddExistingTag(tag);
    }
    setDraggedTagId(null);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderEmptyState = () => (
    <div className={cn('space-y-4', className)}>
      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center bg-muted/20">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Create {detectedEntityType} to add tags
        </div>
        <div className="text-xs text-muted-foreground">
          Tags require an existing {detectedEntityType} to be linked to
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!hasValidEntity) {
    return renderEmptyState();
  }

  return (
    <div className={cn('space-y-6 w-full', className)}>
      
      {/* 1. Add Tag Section */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-900">Add New Tag</div>
        
        {!isCreating ? (
          <Button
            onClick={() => setIsCreating(true)}
            variant="outline"
            size="sm"
            className="h-8 px-4 text-sm"
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        ) : (
          <div className="max-w-lg">
            <TagCreateForm
              newTagName={newTagName}
              newTagDescription={newTagDescription}
              newTagColor={newTagColor}
              onTagNameChange={setNewTagName}
              onTagDescriptionChange={setNewTagDescription}
              onTagColorChange={setNewTagColor}
              onSubmit={handleCreateTag}
              onCancel={resetCreateForm}
              isCreating={createTagMutation.isPending}
              isAssigning={assignTagMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* 2. Selected Tags Section - Always show if there are selected tags OR during drag */}
      {(selectedTags.length > 0 || value.length > 0) && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">
            Selected Tags
            {assignTagMutation.isPending && (
              <span className="ml-2 text-xs text-blue-600">(Adding...)</span>
            )}
          </div>
          <div 
            className="min-h-[60px] p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDropToSelected}
          >
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <TagDisplay
                  key={tag.id}
                  tag={tag}
                  onRemove={handleRemoveTag}
                  onDragStart={setDraggedTagId}
                  onDragEnd={() => setDraggedTagId(null)}
                  isRemoving={unassignTagMutation.isPending}
                />
              ))}
              {selectedTags.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  Drag tags here from Available Tags below
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty Selected Tags Drop Zone (when no tags selected) */}
      {selectedTags.length === 0 && value.length === 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">Selected Tags</div>
          <div 
            className="min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center"
            onDragOver={handleDragOver}
            onDrop={handleDropToSelected}
          >
            <div className="text-sm text-gray-500 italic">
              Drag tags here from Available Tags below
            </div>
          </div>
        </div>
      )}

      {/* 3. Available Tags Section */}
      {allTags.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">Available Tags</div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter(tag => !value.includes(tag.id))
                .map(tag => (
                  <button
                    key={tag.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', tag.id);
                      setDraggedTagId(tag.id);
                    }}
                    onDragEnd={() => setDraggedTagId(null)}
                    onClick={() => handleAddExistingTag(tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm",
                      "border border-gray-200 hover:shadow-sm transition-all cursor-move",
                      "bg-white hover:bg-gray-50",
                      assignTagMutation.isPending && "opacity-50 cursor-not-allowed"
                    )}
                    title={`${tag.description || tag.name} - Click to add or drag to Selected Tags`}
                    disabled={assignTagMutation.isPending}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                  </button>
                ))}
            </div>
            {allTags.filter(tag => !value.includes(tag.id)).length === 0 && (
              <div className="text-sm text-gray-500 italic text-center py-4">
                All available tags are already selected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export default TagField; 