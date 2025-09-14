/**
 * Floating Bulk Actions Component
 * 
 * Animated floating action bar that appears at the bottom center
 * when items are selected in the table.
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { Button } from '@/components/ui';
import type { FloatingBulkActionsProps } from './types';

export const FloatingBulkActions: React.FC<FloatingBulkActionsProps> = ({ 
  resource, 
  selectedCount, 
  onAction, 
  isVisible 
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
        isVisible 
          ? "translate-y-0 opacity-100 scale-100" 
          : "translate-y-full opacity-0 scale-95 pointer-events-none"
      )}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} selected
        </span>
        
        <div className="flex items-center gap-2">
          {resource.table?.bulkSelectOptions?.map((option) => (
            <Button
              key={option.id}
              variant={option.id === 'delete' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => onAction(option.id)}
              className={cn("flex items-center gap-1", option.className)}
            >
              {option.icon && <span className="text-xs">{option.icon}</span>}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}; 