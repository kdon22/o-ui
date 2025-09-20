/**
 * Column Dropdown Trigger - The chevron button that opens the column menu
 * 
 * Features:
 * - Clean chevron button (keep as requested)
 * - Integrates with ColumnHeaderDropdown
 * - Hover states and accessibility
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Components
import { ColumnHeaderDropdown } from './column-header-dropdown';

// Types
import { TableColumn } from '../types';

interface ColumnDropdownTriggerProps {
  column: TableColumn;
  onEditField: () => void;
  onDuplicateField: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onFilter: () => void;
  onHideField: () => void;
  onDeleteField: () => void;
  onEditDescription?: () => void;
  onEditPermissions?: () => void;
}

export const ColumnDropdownTrigger: React.FC<ColumnDropdownTriggerProps> = ({
  column,
  onEditField,
  onDuplicateField,
  onInsertLeft,
  onInsertRight,
  onSortAsc,
  onSortDesc,
  onFilter,
  onHideField,
  onDeleteField,
  onEditDescription,
  onEditPermissions
}) => {
  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => {
        // Prevent header sort when clicking dropdown
        e.stopPropagation();
      }}
    >
      <ColumnHeaderDropdown
        column={column}
        onEditField={onEditField}
        onDuplicateField={onDuplicateField}
        onInsertLeft={onInsertLeft}
        onInsertRight={onInsertRight}
        onSortAsc={onSortAsc}
        onSortDesc={onSortDesc}
        onFilter={onFilter}
        onHideField={onHideField}
        onDeleteField={onDeleteField}
        onEditDescription={onEditDescription}
        onEditPermissions={onEditPermissions}
      />
    </div>
  );
};
