import React from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { Tag } from './types';

// ============================================================================
// TYPES
// ============================================================================
interface TagDisplayProps {
  tag: Tag;
  onRemove: (tagId: string) => Promise<void>;
  onDragStart: (tagId: string) => void;
  onDragEnd: () => void;
  isRemoving?: boolean;
}

// ============================================================================
// TAG DISPLAY COMPONENT
// ============================================================================
export function TagDisplay({ 
  tag, 
  onRemove, 
  onDragStart, 
  onDragEnd,
  isRemoving = false 
}: TagDisplayProps) {
  return (
    <div
      key={tag.id}
      className={cn(
        "group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm",
        "border cursor-move hover:shadow-sm transition-all",
        "bg-white"
      )}
      style={{ 
        borderColor: `${tag.color}40`,
        backgroundColor: `${tag.color}08`
      }}
      draggable
      onDragStart={() => onDragStart(tag.id)}
      onDragEnd={onDragEnd}
      title={tag.description || tag.name}
    >
      <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0" 
        style={{ backgroundColor: tag.color }}
      />
      
      <span className="font-medium text-xs" style={{ color: tag.color }}>
        {tag.name}
      </span>
      
      <button
        onClick={() => onRemove(tag.id)}
        className="w-3.5 h-3.5 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove tag"
        disabled={isRemoving}
      >
        <X className="w-2 h-2 text-gray-600 hover:text-red-600" />
      </button>
    </div>
  );
}

export default TagDisplay; 