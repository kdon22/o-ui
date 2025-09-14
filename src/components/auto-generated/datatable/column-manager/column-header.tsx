/**
 * Column Header - Airtable-like column header with dropdown
 * 
 * Features:
 * - Column type icon
 * - Column name
 * - Dropdown menu on hover
 * - Sort indicators
 * - Required field indicator
 */

"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  List,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ColumnHeaderDropdown } from './column-header-dropdown';
import { ColumnTypeEditor } from './column-type-editor';

interface TableColumn {
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'boolean';
  required?: boolean;
  options?: string[];
  format?: string;
  description?: string;
}

interface ColumnHeaderProps {
  column: TableColumn;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc' | null) => void;
  onColumnUpdate?: (column: TableColumn) => void;
  onColumnDelete?: () => void;
  onColumnDuplicate?: () => void;
  onInsertColumn?: (position: 'left' | 'right') => void;
}

const COLUMN_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  select: List,
  multi_select: List
};

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  sortDirection,
  onSort,
  onColumnUpdate,
  onColumnDelete,
  onColumnDuplicate,
  onInsertColumn
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const Icon = COLUMN_TYPE_ICONS[column.type];

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

  const handleEditField = () => {
    setIsEditorOpen(true);
  };

  const handleSaveColumn = (updatedColumn: TableColumn) => {
    onColumnUpdate?.(updatedColumn);
    setIsEditorOpen(false);
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

  const handleSortAsc = () => {
    onSort?.('asc');
  };

  const handleSortDesc = () => {
    onSort?.('desc');
  };

  const handleFilter = () => {
    // TODO: Implement filtering
    console.log('Filter by', column.name);
  };

  const handleHideField = () => {
    // TODO: Implement field hiding
    console.log('Hide field', column.name);
  };

  const handleDeleteField = () => {
    onColumnDelete?.();
  };

  const handleEditDescription = () => {
    // TODO: Implement description editing
    console.log('Edit description for', column.name);
  };

  const handleEditPermissions = () => {
    // TODO: Implement permissions editing
    console.log('Edit permissions for', column.name);
  };

  return (
    <>
      <th
        className={cn(
          "group px-3 py-2 text-left text-sm font-medium text-gray-700 border-r border-gray-200 min-w-[120px] cursor-pointer hover:bg-gray-100",
          sortDirection && "bg-blue-50"
        )}
        style={{ borderBottom: '1px solid #e5e7eb' }}
        onClick={handleSort}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{column.name}</span>
            {column.required && <span className="text-red-500 flex-shrink-0">*</span>}
            
            {/* Sort Indicator */}
            {sortDirection === 'asc' && <ArrowUp className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            {sortDirection === 'desc' && <ArrowDown className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          </div>
          
          {/* Dropdown Menu */}
          <div className="flex-shrink-0">
            <ColumnHeaderDropdown
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
        </div>
      </th>

      {/* Column Type Editor Modal */}
      <ColumnTypeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        column={column}
        onSave={handleSaveColumn}
      />
    </>
  );
};
