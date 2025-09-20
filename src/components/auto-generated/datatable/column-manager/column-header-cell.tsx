/**
 * Column Header - Composed from focused sub-components
 * 
 * Composed from:
 * - ColumnTitle (double-click edit)
 * - ColumnSortIndicator (sort arrows)
 * - ColumnDropdownTrigger (chevron menu)
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Components
import { ColumnTitle } from './column-title';
import { ColumnSortIndicator } from './column-sort-indicator';
import { ColumnDropdownTrigger } from './column-dropdown-trigger';

// Types
import {
  TableColumn,
  SortDirection,
  ColumnOperationCallbacks
} from '../types';

export interface ColumnHeaderCellProps extends ColumnOperationCallbacks {
  column: TableColumn;
  sortDirection?: SortDirection;
}

export const ColumnHeaderCell: React.FC<ColumnHeaderCellProps> = ({
  column,
  sortDirection,
  onSort,
  onColumnUpdate,
  onColumnDelete,
  onColumnDuplicate,
  onInsertColumn
}) => {
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = () => {
    if (!onSort) return;
    
    if (sortDirection === 'asc') {
      onSort('desc');
    } else if (sortDirection === 'desc') {
      onSort(null);
    } else {
      onSort('asc');
    }
  };

  const handleSortAsc = () => {
    onSort?.('asc');
  };

  const handleSortDesc = () => {
    onSort?.('desc');
  };

  const handleDuplicateField = () => {
    onColumnDuplicate?.();
  };

  const handleInsertLeft = () => {
    onInsertColumn?.('left');
  };

  const handleInsertRight = () => {
    onInsertColumn?.('right');
  };

  const handleDeleteField = () => {
    onColumnDelete?.();
  };

  const handleColumnUpdate = (updatedColumn: TableColumn) => {
    onColumnUpdate?.(updatedColumn);
  };

  // TODO handlers for future features
  const handleFilter = () => {
    console.log('Filter by', column.name);
  };

  const handleHideField = () => {
    console.log('Hide field', column.name);
  };

  const handleEditDescription = () => {
    console.log('Edit description for', column.name);
  };

  const handleEditPermissions = () => {
    console.log('Edit permissions for', column.name);
  };

  // Placeholder for modal management (ColumnTitle handles this now)
  const handleEditField = () => {
    console.log('Edit field triggered - ColumnTitle handles double-click');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <th
      className={cn(
        "group px-3 py-2 text-left text-sm font-medium text-gray-700",
        "border-r border-gray-200 min-w-[120px] cursor-pointer hover:bg-gray-100",
        sortDirection && "bg-blue-50"
      )}
      style={{ borderBottom: '1px solid #e5e7eb' }}
      onClick={handleSort}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Title + Sort Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Column Title with Double-Click Edit */}
          <ColumnTitle
            column={column}
            onColumnUpdate={handleColumnUpdate}
            className="flex items-center gap-2 min-w-0"
          />
          
          {/* Sort Direction Indicator */}
          <ColumnSortIndicator 
            sortDirection={sortDirection}
            className="flex-shrink-0"
          />
        </div>
        
        {/* Right side: Dropdown Menu Trigger */}
        <ColumnDropdownTrigger
          column={column}
          onEditField={handleEditField}
          onDuplicateField={handleDuplicateField}
          onInsertLeft={handleInsertLeft}
          onInsertRight={handleInsertRight}
          onSortAsc={handleSortAsc}
          onSortDesc={handleSortDesc}
          onFilter={handleFilter}
          onHideField={handleHideField}
          onDeleteField={handleDeleteField}
          onEditDescription={handleEditDescription}
          onEditPermissions={handleEditPermissions}
        />
      </div>
    </th>
  );
};


