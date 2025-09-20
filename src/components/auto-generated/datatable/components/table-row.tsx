/**
 * Table Row - Individual table row component
 * Extracted from auto-datatable.tsx for better maintainability
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Components
import { TableCell } from './table-cell';

// Types
import {
  TableDataRow,
  TableSchema,
  EditingCell
} from '../types';

interface TableRowProps {
  row: TableDataRow;
  rowIndex: number;
  schema: TableSchema;
  editingCell: EditingCell | null;
  isSelected: boolean;
  changes: Record<string, any>;
  onCellEdit: (column: string) => void;
  onCellSave: (column: string, value: any) => void;
  onRowSelect: (selected: boolean) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  rowIndex,
  schema,
  editingCell,
  isSelected,
  changes,
  onCellEdit,
  onCellSave,
  onRowSelect
}) => {
  const columns = schema.columns;
  
  // Check row states
  const isInherited = !!row.originalTableDataId;
  const isOptimistic = row.__optimistic === true;
  const hasChanges = Object.keys(changes).length > 0;
  const isEditingThisRow = editingCell?.rowId === row.id;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRowSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onRowSelect(event.target.checked);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <tr 
      className={cn(
        "hover:bg-gray-50 transition-colors",
        isInherited && "bg-blue-50/30",
        isOptimistic && "bg-yellow-50",
        hasChanges && "bg-orange-50/50",
        isEditingThisRow && "bg-blue-50/50",
        isSelected && "bg-blue-100/50"
      )}
    >
      {/* Row number */}
      <td
        className="px-3 py-2 border-r border-gray-200 text-xs text-gray-500 sticky left-0 bg-inherit"
        style={{ 
          borderBottom: '1px solid #e5e7eb', 
          width: 40,
          zIndex: 5
        }}
      >
        {rowIndex + 1}
      </td>

      {/* Row select */}
      <td
        className="px-3 py-2 border-r border-gray-200"
        style={{ borderBottom: '1px solid #e5e7eb', width: 40 }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleRowSelect}
          onClick={(e) => e.stopPropagation()}
          className="rounded"
        />
      </td>

      {/* Data cells */}
      {columns.map((column, colIndex) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.column === column.name;
        const cellValue = changes[column.name] !== undefined 
          ? changes[column.name] 
          : row.data[column.name];

        return (
          <TableCell
            key={`${row.id}-${column.name}-${colIndex}`}
            value={cellValue}
            column={column}
            isEditing={isEditing}
            onChange={(value) => onCellSave(column.name, value)}
            onSave={() => {/* Cell handles its own save */}}
            onCancel={() => {/* Cell handles its own cancel */}}
            onEdit={() => onCellEdit(column.name)}
          />
        );
      })}

      {/* Empty cell for add column space */}
      <td
        className="px-3 py-2 border-r border-gray-200"
        style={{ borderBottom: '1px solid #e5e7eb', width: 120 }}
      >
        {/* Empty space for add column button alignment */}
      </td>
    </tr>
  );
};
