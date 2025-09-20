/**
 * Column Sort Indicator - Visual indicator for sort direction
 * 
 * Features:
 * - Shows sort arrows (up/down)
 * - Clean, focused component
 * - Proper accessibility
 */

"use client";

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Types
import { SortDirection } from '../types';

interface ColumnSortIndicatorProps {
  sortDirection: SortDirection;
  className?: string;
}

export const ColumnSortIndicator: React.FC<ColumnSortIndicatorProps> = ({
  sortDirection,
  className
}) => {
  // Don't render anything if no sort direction
  if (!sortDirection) {
    return null;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {sortDirection === 'asc' && (
        <ArrowUp 
          className="w-4 h-4 text-blue-600 flex-shrink-0" 
          aria-label="Sorted ascending"
        />
      )}
      {sortDirection === 'desc' && (
        <ArrowDown 
          className="w-4 h-4 text-blue-600 flex-shrink-0"
          aria-label="Sorted descending"
        />
      )}
    </div>
  );
};
