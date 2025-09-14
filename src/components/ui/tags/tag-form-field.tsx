'use client';

import React from 'react';
import { Plus, Tag as TagIcon, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TagSection } from '@/components/ui/tags/tag-section';
import { useTagContext } from '@/components/providers/tag-provider';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

interface TagFormFieldProps {
  value?: string[];
  onChange: (tagIds: string[]) => void;
  entityType?: string;
  entityId?: string;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// TAG FORM FIELD COMPONENT
// ============================================================================

export function TagFormField({
  value = [],
  onChange,
  entityType,
  entityId,
  className,
  disabled = false
}: TagFormFieldProps) {
  const { openTagModal } = useTagContext();

  // Auto-detect entity type from URL if not provided
  const detectedEntityType = entityType || (() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/rules')) return 'rule';
      if (path.includes('/nodes')) return 'node';
      if (path.includes('/processes')) return 'process';
      if (path.includes('/offices')) return 'office';
      if (path.includes('/workflows')) return 'workflow';
      if (path.includes('/classes')) return 'class';
    }
    return 'rule'; // Default fallback
  })();

  // Try to get entity ID from URL as fallback if not provided
  const fallbackEntityId = (() => {
    if (!entityId && typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Extract ID from paths like /rules/abc123 or /rules/abc123/edit
      const match = path.match(/\/rules\/([^\/]+)/);
      return match ? match[1] : null;
    }
    return entityId;
  })();

  // Check if we have a valid entity ID (not create mode)
  const finalEntityId = fallbackEntityId || entityId;
  const hasValidEntityId = finalEntityId && finalEntityId !== 'new' && finalEntityId.trim() !== '';
  const isCreateMode = !hasValidEntityId;

  // Debug logging to see what's happening
  console.log('🏷️ TagFormField render:', {
    originalEntityId: entityId,
    fallbackEntityId,
    finalEntityId,
    entityType,
    detectedEntityType,
    hasValidEntityId,
    isCreateMode,
    value,
    disabled,
    currentUrl: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  // Handlers for adding tags and tag groups
  const handleAddTag = () => {
    if (!isCreateMode) {
      openTagModal(detectedEntityType as any, finalEntityId!, value);
          } else {
        console.log('TagFormField: Cannot add tags in create mode', {
          originalEntityId: entityId,
          finalEntityId,
          hasValidEntityId,
          isCreateMode,
          detectedEntityType
        });
      }
  };

  const handleAddTagGroup = () => {
    // TODO: Implement tag group creation modal
  };

  // Create mode placeholder (only for truly new entities)
  if (isCreateMode) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center bg-muted/20">
          <TagIcon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Create {detectedEntityType} to add tags
          </div>
          <div className="text-xs text-muted-foreground">
            Tags require an existing {detectedEntityType} to be linked to
          </div>
        </div>
      </div>
    );
  }

  // Edit mode with full functionality
  return (
    <div className={cn('space-y-3', className)}>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTag}
          disabled={disabled}
          className="h-8 px-3 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Tag
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTagGroup}
          disabled={disabled}
          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <FolderPlus className="w-3 h-3 mr-1" />
          New Group
        </Button>
      </div>

      {/* Tag Section */}
      <TagSection
        entityType={detectedEntityType as any}
        entityId={finalEntityId!}
        onTagsChange={onChange}
        showAddButton={false} // We're handling add buttons above
        showKeyboardHint={false} // Remove keyboard shortcuts as requested
        className="space-y-2"
      />

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        Click "Add Tag" to select from existing tags or create new ones
      </div>
    </div>
  );
}

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

export const CompactTagFormField = (props: Omit<TagFormFieldProps, 'className'>) => (
  <TagFormField {...props} className="space-y-2" />
);

export const DetailedTagFormField = (props: Omit<TagFormFieldProps, 'className'>) => (
  <TagFormField {...props} className="space-y-4" />
);