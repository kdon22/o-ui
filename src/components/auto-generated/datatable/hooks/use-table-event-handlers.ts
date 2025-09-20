/**
 * useTableEventHandlers - Centralized event handling for table operations
 * 
 * Extracts all event handling logic from AutoDataTable:
 * - Cell interaction events (click, value change, exit)
 * - Row operations (add, edit, save, cancel)
 * - Column operations (add, update, delete, duplicate)
 * - State coordination between editing and mutations
 */

import { useCallback } from 'react';
import { TableState, TableStateActions } from './use-table-state';
import { UseTableDataReturn } from './use-table-data';
import type { TableColumn, TableDataRow } from '../types';

export interface TableEventHandlerOptions {
  // Data
  rows: TableDataRow[];
  baseRows: TableDataRow[];
  columns: TableColumn[];
  
  // State management
  tableState: TableState & TableStateActions;
  
  // Mutations
  mutations: UseTableDataReturn;
  
  // Callbacks
  onCellFocus?: (rowId: string, columnName: string) => void;
  onRowEnter?: (rowId: string) => void;
  onRowExit?: (rowId: string) => void;
}

export interface TableEventHandlers {
  // Cell events
  handleCellClick: (rowId: string, columnName: string, currentValue: any) => void;
  handleCellValueChange: (rowId: string, columnName: string, newValue: any) => void;
  handleCellCancel: () => void;
  
  // Row events
  handleRowExit: (rowId: string) => Promise<void>;
  handleAddRow: () => Promise<void>;
  
  // Column events
  handleAddColumn: (column: TableColumn) => Promise<void>;
  handleUpdateColumn: (columnIndex: number, updatedColumn: TableColumn) => Promise<void>;
  handleDeleteColumn: (columnIndex: number) => Promise<void>;
  handleDuplicateColumn: (columnIndex: number) => Promise<void>;
  handleInsertColumn: (columnIndex: number, position: 'left' | 'right') => Promise<void>;
  
  // Sorting
  handleSort: (columnName: string, direction: 'asc' | 'desc' | null) => void;
}

export function useTableEventHandlers(options: TableEventHandlerOptions): TableEventHandlers {
  const { rows, baseRows, columns, tableState, mutations, onCellFocus, onRowEnter, onRowExit } = options;

  // ============================================================================
  // CELL EVENT HANDLERS
  // ============================================================================

  const handleCellClick = useCallback((rowId: string, columnName: string, currentValue: any) => {
    tableState.setEditingCell({ rowId, column: columnName });
    tableState.setEditingRow(rowId);
    
    onCellFocus?.(rowId, columnName);
    onRowEnter?.(rowId);
  }, [tableState, onCellFocus, onRowEnter]);

  const handleCellValueChange = useCallback((rowId: string, columnName: string, newValue: any) => {
    // Update local row changes
    tableState.updateRowChange(rowId, columnName, newValue);

    // Get the current row data with any existing changes
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const updatedData = {
      ...row.data,
      [columnName]: newValue
    };

    // Trigger debounced save
    mutations.debouncedSaveRow(rowId, updatedData);
  }, [rows, tableState, mutations]);

  const handleCellCancel = useCallback(() => {
    if (tableState.editingCell) {
      // Revert changes for this cell
      const { rowId, column } = tableState.editingCell;
      
      // Remove the specific change from row changes
      tableState.setRowChanges((prev: Record<string, Record<string, any>>) => {
        const newChanges = { ...prev };
        if (newChanges[rowId]) {
          delete newChanges[rowId][column];
          if (Object.keys(newChanges[rowId]).length === 0) {
            delete newChanges[rowId];
          }
        }
        return newChanges;
      });
    }
    tableState.setEditingCell(null);
  }, [tableState]);

  // ============================================================================
  // ROW EVENT HANDLERS
  // ============================================================================

  const handleRowExit = useCallback(async (rowId: string) => {
    // Save immediately when leaving the row
    if (tableState.hasRowChanges(rowId)) {
      const row = baseRows.find(r => r.id === rowId);
      if (row) {
        const changes = tableState.rowChanges[rowId];
        const updatedData = { ...row.data, ...changes };
        
        try {
          await mutations.updateRowMutation.mutateAsync({ id: rowId, data: updatedData });
          
          // Clear changes after successful save
          tableState.clearRowChanges(rowId);
        } catch (error) {
          console.error('Failed to save row on exit:', error);
          // Don't clear changes on error - keep them for retry
          return;
        }
      }
    }
    
    tableState.setEditingRow(null);
    tableState.setEditingCell(null);
    onRowExit?.(rowId);
  }, [baseRows, tableState, mutations, onRowExit]);

  const handleAddRow = useCallback(async () => {
    const emptyData: Record<string, any> = {};
    
    // Initialize empty data based on column types
    columns.forEach(col => {
      switch (col.type) {
        case 'email':
          emptyData[col.name] = '';
          break;
        case 'currency':
          emptyData[col.name] = 0;
          break;
        case 'bool':
          emptyData[col.name] = false;
          break;
        case 'int':
          emptyData[col.name] = 0;
          break;
        case 'list':
          emptyData[col.name] = [];
          break;
        case 'date':
          emptyData[col.name] = '';
          break;
        default: // 'str'
          emptyData[col.name] = '';
      }
    });

    // Create the row (this will handle optimistic updates)
    await mutations.createRowMutation.mutateAsync({
      tableId: '', // TODO: Pass tableId from options
      data: emptyData
    });
  }, [columns, mutations]);

  // ============================================================================
  // COLUMN EVENT HANDLERS
  // ============================================================================

  const handleAddColumn = useCallback(async (column: TableColumn) => {
    const updatedColumns = [...columns, column];
    await mutations.updateTableSchema({ columns: updatedColumns });
  }, [columns, mutations]);

  const handleUpdateColumn = useCallback(async (columnIndex: number, updatedColumn: TableColumn) => {
    const updatedColumns = columns.map((col, index) => 
      index === columnIndex ? updatedColumn : col
    );
    await mutations.updateTableSchema({ columns: updatedColumns });
  }, [columns, mutations]);

  const handleDeleteColumn = useCallback(async (columnIndex: number) => {
    const updatedColumns = columns.filter((_, index) => index !== columnIndex);
    await mutations.updateTableSchema({ columns: updatedColumns });
  }, [columns, mutations]);

  // Convert whitespace-separated words to camelCase; leaves non-space separators intact
  const toCamelFromSpaces = (input: string): string => {
    const parts = String(input).trim().split(/\s+/);
    if (parts.length === 0) return '';
    return parts
      .map((w, i) => {
        const lower = w.toLowerCase();
        return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  };

  const handleDuplicateColumn = useCallback(async (columnIndex: number) => {
    const columnToDuplicate = columns[columnIndex];
    const duplicatedColumn = {
      ...columnToDuplicate,
      // Ensure no spaces: convert spaced names to camelCase, append -copy
      name: `${(/\s/.test(String(columnToDuplicate.name)) 
        ? toCamelFromSpaces(String(columnToDuplicate.name)) 
        : String(columnToDuplicate.name))}-copy`
    };
    const updatedColumns = [
      ...columns.slice(0, columnIndex + 1),
      duplicatedColumn,
      ...columns.slice(columnIndex + 1)
    ];
    await mutations.updateTableSchema({ columns: updatedColumns });
  }, [columns, mutations]);

  const handleInsertColumn = useCallback(async (columnIndex: number, position: 'left' | 'right') => {
    const newColumn: TableColumn = {
      // Default to camelCase for dot access in code
      name: 'newField',
      type: 'str',
      required: false
    };
    
    const insertIndex = position === 'left' ? columnIndex : columnIndex + 1;
    const updatedColumns = [
      ...columns.slice(0, insertIndex),
      newColumn,
      ...columns.slice(insertIndex)
    ];
    await mutations.updateTableSchema({ columns: updatedColumns });
  }, [columns, mutations]);

  // ============================================================================
  // SORTING EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((columnName: string, direction: 'asc' | 'desc' | null) => {
    tableState.handleSort(columnName, direction);
  }, [tableState]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Cell events
    handleCellClick,
    handleCellValueChange,
    handleCellCancel,
    
    // Row events
    handleRowExit,
    handleAddRow,
    
    // Column events
    handleAddColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleDuplicateColumn,
    handleInsertColumn,
    
    // Sorting
    handleSort,
  };
}
