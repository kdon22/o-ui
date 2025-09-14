import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import type { Tag } from './types';

// ============================================================================
// TYPES
// ============================================================================
interface AvailableTagsProps {
  tags: Tag[];
  selectedTagIds: string[];
  onAddTag: (tag: Tag) => Promise<void>;
  isAddingTag?: boolean;
}

// ============================================================================
// AVAILABLE TAGS COMPONENT
// ============================================================================
export function AvailableTags({
  tags,
  selectedTagIds,
  onAddTag,
  isAddingTag = false
}: AvailableTagsProps) {
  
  // Filter out already selected tags
  const availableTags = tags.filter((tag: Tag) => !selectedTagIds.includes(tag.id));

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-gray-700">Available Tags</div>
      <div className="flex flex-wrap gap-1.5">
        {availableTags.map((tag: Tag) => (
          <button
            key={tag.id}
            onClick={() => onAddTag(tag)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
              "border border-gray-200 hover:shadow-sm transition-all cursor-pointer",
              "bg-white hover:bg-gray-50",
              isAddingTag && "opacity-50 cursor-not-allowed"
            )}
            title={tag.description || tag.name}
            disabled={isAddingTag}
          >
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: tag.color }}
            />
            <span className="font-medium">{tag.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AvailableTags; 