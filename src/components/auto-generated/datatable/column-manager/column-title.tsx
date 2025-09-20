/**
 * Column Title - Column name display with double-click edit functionality
 * 
 * Features:
 * - Displays column name with type icon
 * - Double-click opens ColumnTypeEditor modal (Airtable-like)
 * - Shows required indicator
 * - Clean, focused component
 */

"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Components
import { ColumnTypeEditor } from './column-type-editor';

// Types
import { TableColumn, getColumnIcon } from '../types';

interface ColumnTitleProps {
  column: TableColumn;
  onColumnUpdate: (column: TableColumn) => void;
  className?: string;
}

export const ColumnTitle: React.FC<ColumnTitleProps> = ({
  column,
  onColumnUpdate,
  className
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Get the appropriate icon for the column type
  const IconComponent = getColumnIcon(column.type);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsEditorOpen(true);
  };

  const handleEditorSave = (updatedColumn: TableColumn) => {
    onColumnUpdate(updatedColumn);
    setIsEditorOpen(false);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Column Title Display */}
      <div
        className={cn(
          "flex items-center space-x-2 cursor-pointer select-none group",
          "hover:bg-gray-100/50 px-2 py-1 rounded",
          className
        )}
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit field"
      >
        {/* Type Icon */}
        <div className="flex-shrink-0">
          <IconComponent className="w-4 h-4 text-gray-600" />
        </div>

        {/* Column Name */}
        <span 
          className={cn(
            "font-medium text-sm text-gray-700 truncate",
            "group-hover:text-gray-900"
          )}
        >
          {column.name}
        </span>

        {/* Required Indicator */}
        {column.required && (
          <span className="text-red-500 text-xs">*</span>
        )}

        {/* Visual hint for double-click (subtle) */}
        <div className="opacity-0 group-hover:opacity-30 transition-opacity">
          <span className="text-xs text-gray-400">✎</span>
        </div>
      </div>

      {/* Column Type Editor Modal */}
      <ColumnTypeEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        column={column}
        onSave={handleEditorSave}
      />
    </>
  );
};
