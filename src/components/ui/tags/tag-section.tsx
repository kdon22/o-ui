'use client';

import React, { useMemo } from 'react';
import { Tag as TagIcon, Plus, Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActionQuery } from '@/hooks/use-action-api';
import { useTagContext, type TagEntityType } from '@/components/providers/tag-provider';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

export interface TagSectionProps {
  entityType: TagEntityType;
  entityId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showAddButton?: boolean;
  showKeyboardHint?: boolean;
  maxTags?: number;
  onTagsChange?: (tagIds: string[]) => void;
}

// ============================================================================
// JUNCTION TABLE MAPPING
// ============================================================================

const JUNCTION_TABLE_MAP: Record<TagEntityType, string> = {
  rule: 'ruleTag',
  class: 'classTag', 
  office: 'officeTag',
  node: 'nodeTag',
  process: 'processTag',
  workflow: 'workflowTag'
};

const ENTITY_LABELS: Record<TagEntityType, string> = {
  rule: 'Rule',
  class: 'Class',
  office: 'Office', 
  node: 'Node',
  process: 'Process',
  workflow: 'Workflow'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TagSection({
  entityType,
  entityId,
  className,
  size = 'md',
  showAddButton = true,
  showKeyboardHint = true,
  maxTags,
  onTagsChange
}: TagSectionProps) {
  const { openTagModal } = useTagContext();
  
  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  // Fetch junction table relationships for this entity
  const junctionTableKey = JUNCTION_TABLE_MAP[entityType];
  const { data: junctionResponse, isLoading: loadingJunctions } = useActionQuery(
    `${junctionTableKey}.list`,
    { 
      filters: { 
        [`${entityType}Id`]: entityId,
        isActive: true 
      },
      include: ['tag'] // Include tag details
    }
  );

  // Extract current tag IDs and tag data
  const currentTags = useMemo(() => {
    if (!junctionResponse?.data) return [];
    return junctionResponse.data
      .map((junction: any) => junction.tag)
      .filter(Boolean)
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [junctionResponse]);

  const currentTagIds = useMemo(() => 
    currentTags.map((tag: any) => tag.id), 
    [currentTags]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleOpenTagModal = () => {
    openTagModal(entityType, entityId, currentTagIds);
  };

  const handleTagsUpdated = (newTagIds: string[]) => {
    onTagsChange?.(newTagIds);
  };

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================
  
  const renderTag = (tag: any, index: number) => {
    const tagSizes = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-sm px-3 py-1.5'
    };

    return (
      <Badge
        key={tag.id}
        variant="secondary"
        className={cn(
          tagSizes[size],
          'inline-flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors',
          'border border-border/50'
        )}
        onClick={handleOpenTagModal}
        style={{ 
          backgroundColor: `${tag.color}15`,
          borderColor: `${tag.color}40`,
          color: tag.color
        }}
      >
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: tag.color }}
        />
        {tag.name}
      </Badge>
    );
  };

  const renderEmptyState = () => (
    <div 
      className={cn(
        'border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer',
        'hover:border-primary/50 hover:bg-primary/5 transition-all',
        'group'
      )}
      onClick={handleOpenTagModal}
    >
      <TagIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground group-hover:text-primary">
        No tags yet. Click to add tags.
      </p>
      {showKeyboardHint && (
        <p className="text-xs text-muted-foreground/70 mt-1">
          Or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+⌘+T</kbd>
        </p>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loadingJunctions) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
        </div>
        <div className="flex gap-2">
          <div className="animate-pulse bg-muted rounded h-6 w-16" />
          <div className="animate-pulse bg-muted rounded h-6 w-20" />
          <div className="animate-pulse bg-muted rounded h-6 w-14" />
        </div>
      </div>
    );
  }

  const displayTags = maxTags ? currentTags.slice(0, maxTags) : currentTags;
  const hiddenCount = maxTags && currentTags.length > maxTags 
    ? currentTags.length - maxTags 
    : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tags {currentTags.length > 0 && `(${currentTags.length})`}
        </h3>
        
        {showAddButton && currentTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenTagModal}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Tags Display */}
      {currentTags.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-2">
          {/* Tag List */}
          <div className="flex flex-wrap gap-2">
            {displayTags.map(renderTag)}
            
            {hiddenCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={handleOpenTagModal}
              >
                +{hiddenCount} more
              </Badge>
            )}
          </div>
          
          {/* Keyboard Hint */}
          {showKeyboardHint && (
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+⌘+T</kbd> to manage tags
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONVENIENCE VARIANTS
// ============================================================================

export const CompactTagSection = (props: Omit<TagSectionProps, 'size' | 'showKeyboardHint'>) => (
  <TagSection {...props} size="sm" showKeyboardHint={false} maxTags={3} />
);

export const DetailTagSection = (props: Omit<TagSectionProps, 'size'>) => (
  <TagSection {...props} size="md" />
);

export const LargeTagSection = (props: Omit<TagSectionProps, 'size'>) => (
  <TagSection {...props} size="lg" />
); 