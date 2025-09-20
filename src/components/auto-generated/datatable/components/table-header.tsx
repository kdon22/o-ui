/**
 * Table Header - Renders table header with column management
 * Extracted from auto-datatable.tsx for better maintainability
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Components
import { ColumnHeader, AddColumnButton } from '../column-manager';

// Types
import {
  TableHeaderProps,
  TableSchema,
  SortConfig,
  TableColumn
} from '../types';

export const TableHeader: React.FC<TableHeaderProps> = ({
  schema,
  sortConfig,
  onSort,
  onSchemaChange
}) => {
  const columns = schema.columns;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig?.column === column) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        direction = null; // Clear sort
      }
    }
    
    onSort(column, direction);
  };

  const handleColumnUpdate = (index: number, updatedColumn: TableColumn) => {
    const newColumns = [...columns];
    newColumns[index] = updatedColumn;
    
    onSchemaChange({
      ...schema,
      columns: newColumns
    });
  };

  const handleColumnDelete = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    
    onSchemaChange({
      ...schema,
      columns: newColumns
    });
  };

  const handleColumnDuplicate = (index: number) => {
    const columnToDuplicate = columns[index];
    const duplicatedColumn = {
      ...columnToDuplicate,
      name: `${columnToDuplicate.name} copy`
    };
    
    const newColumns = [...columns];
    newColumns.splice(index + 1, 0, duplicatedColumn);
    
    onSchemaChange({
      ...schema,
      columns: newColumns
    });
  };

  const handleInsertColumn = (index: number, position: 'left' | 'right') => {
    const insertIndex = position === 'left' ? index : index + 1;
    const newColumn: TableColumn = {
      name: `Column ${columns.length + 1}`,
      type: 'text'
    };
    
    const newColumns = [...columns];
    newColumns.splice(insertIndex, 0, newColumn);
    
    onSchemaChange({
      ...schema,
      columns: newColumns
    });
  };

  const handleAddColumn = (newColumn: TableColumn) => {
    const newColumns = [...columns, newColumn];
    
    onSchemaChange({
      ...schema,
      columns: newColumns
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <thead>
      <tr style={{ backgroundColor: '#f8fafc' }}>
        {/* Row number header */}
        <th
          className="px-3 py-2 border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50"
          style={{ 
            borderBottom: '2px solid #e5e7eb',
            width: 40,
            zIndex: 10
          }}
        >
          #
        </th>

        {/* Row select header */}
        <th
          className="px-3 py-2 border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          style={{ 
            borderBottom: '2px solid #e5e7eb',
            width: 40
          }}
        >
          <input
            type="checkbox"
            className="rounded"
            onChange={() => {
              // TODO: Implement select all functionality
            }}
          />
        </th>

        {/* Column headers */}
        {columns.map((column, index) => (
          <th
            key={`${column.name}-${index}`}
            className="px-3 py-2 border-r border-gray-200 text-left"
            style={{ 
              borderBottom: '2px solid #e5e7eb',
              minWidth: 150,
              maxWidth: 300
            }}
          >
            <ColumnHeader
              column={column}
              sortDirection={
                sortConfig?.column === column.name 
                  ? sortConfig.direction 
                  : null
              }
              onSort={() => handleSort(column.name)}
              onColumnUpdate={(updatedColumn) => handleColumnUpdate(index, updatedColumn)}
              onColumnDelete={() => handleColumnDelete(index)}
              onColumnDuplicate={() => handleColumnDuplicate(index)}
              onInsertColumn={(position) => handleInsertColumn(index, position)}
            />
          </th>
        ))}

        {/* Add column header */}
        <th
          className="px-3 py-2 border-r border-gray-200"
          style={{ 
            borderBottom: '2px solid #e5e7eb',
            width: 120
          }}
        >
          <AddColumnButton
            onAddColumn={handleAddColumn}
            existingColumns={columns}
          />
        </th>
      </tr>
    </thead>
  );
};
