'use client';

import React from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TagDisplayProps } from '../types';

export function TagDisplay({
  tags,
  showGroup = false,
  size = 'md',
  variant = 'default',
  onTagClick,
  onTagRemove,
  editable = false
}: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <TagIcon className="w-4 h-4" />
        <span>No tags</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5', 
    lg: 'text-base px-3 py-2'
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant={variant === 'solid' ? 'default' : variant === 'outline' ? 'outline' : 'secondary'}
          className={`
            flex items-center gap-1.5 ${sizeClasses[size]}
            ${onTagClick ? 'cursor-pointer hover:opacity-80' : ''}
            ${editable ? 'pr-1' : ''}
          `}
          onClick={() => onTagClick?.(tag)}
          style={{
            backgroundColor: variant === 'solid' ? tag.color : undefined,
            borderColor: variant === 'outline' ? tag.color : undefined,
            color: variant === 'solid' ? '#ffffff' : tag.color
          }}
        >
          {/* Color indicator */}
          <div 
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              variant === 'solid' ? 'bg-white/80' : ''
            }`}
            style={{
              backgroundColor: variant === 'solid' ? 'rgba(255,255,255,0.8)' : tag.color
            }}
          />
          
          {/* Tag name */}
          <span className="truncate">
            {tag.name}
          </span>

          {/* Group name (if enabled) */}
          {showGroup && tag.group && (
            <span className="text-xs opacity-75">
              ({tag.group.name})
            </span>
          )}

          {/* Remove button (if editable) */}
          {editable && onTagRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTagRemove(tag.id);
              }}
              className="h-4 w-4 p-0 hover:bg-white/20 ml-1"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
    </div>
  );
} 