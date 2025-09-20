/**
 * Table Body - Renders table body with rows
 * Extracted from auto-datatable.tsx for better maintainability
 */

"use client";

import React from 'react';

// Components
import { TableRow } from './table-row';

// Types
import {
  TableBodyProps
} from '../types';

export const TableBody: React.FC<TableBodyProps> = ({
  rows,
  schema,
  editingCell,
  selectedRowIds,
  rowChanges,
  onCellEdit,
  onCellSave,
  onRowSelect
}) => {
  const columns = schema.columns;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <tbody>
      {rows.map((row, rowIndex) => (
        <TableRow
          key={row.id}
          row={row}
          rowIndex={rowIndex}
          schema={schema}
          editingCell={editingCell}
          isSelected={selectedRowIds.has(row.id)}
          changes={rowChanges[row.id] || {}}
          onCellEdit={(column) => onCellEdit(row.id, column)}
          onCellSave={(column, value) => onCellSave(row.id, column, value)}
          onRowSelect={(selected) => onRowSelect(row.id, selected)}
        />
      ))}
    </tbody>
  );
};
