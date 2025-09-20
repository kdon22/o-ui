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

import React, { useState, useRef, useEffect } from 'react';
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

// Types
import type { TableColumn, SortDirection, ColumnOperationCallbacks } from '../types';
import { COLUMN_TYPE_ICONS } from '../types';

interface ColumnHeaderProps extends ColumnOperationCallbacks {
  column: TableColumn;
  sortDirection?: SortDirection;
}

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
  // Initialize from persisted width if available
  const [width, setWidth] = useState<number | undefined>(column.width);
  const thRef = useRef<HTMLTableCellElement | null>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
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

  // ----------------------------------------------------------------------------
  // Resize handlers (basic column resize by dragging right edge)
  // ----------------------------------------------------------------------------
  const onMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(80, startWidthRef.current + delta);
    setWidth(newWidth);
  };

  const onMouseUp = () => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // Persist the new width to schema
    if (width && onColumnUpdate) {
      onColumnUpdate({ ...column, width });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    const el = thRef.current;
    startWidthRef.current = el ? el.getBoundingClientRect().width : (width || 120);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <th
        ref={thRef}
        className={cn(
          // Tighter padding and smaller default min width
          "group relative px-2 py-1.5 text-left text-sm font-medium text-gray-700 border-r border-gray-200 min-w-[100px] cursor-pointer hover:bg-gray-100",
          sortDirection && "bg-blue-50"
        )}
        style={{ 
          borderBottom: '1px solid #e5e7eb',
          width: width ? `${width}px` : column.width ? `${column.width}px` : undefined
        }}
        onClick={handleSort}
      >
        <div className="flex items-center justify-between">
          {/* Left cluster: icon, title, sort */}
          <div className="flex items-center gap-2 pr-1 min-w-0">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{column.name}</span>
            {column.required && <span className="text-red-500 flex-shrink-0">*</span>}
            
            {/* Sort Indicator */}
            {sortDirection === 'asc' && <ArrowUp className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            {sortDirection === 'desc' && <ArrowDown className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          </div>
          
          {/* Right cluster: dropdown pinned to cell edge */}
          <div className="flex-shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
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

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{
            // subtle visual separator when hovering the handle
            background:
              'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)'
          }}
          onClick={(e) => e.stopPropagation()}
        />
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
