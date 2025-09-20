/**
 * useKeyboardNavigation - Centralized keyboard navigation for table
 * 
 * Handles:
 * - Cell navigation (Tab, Enter, Arrow keys)
 * - Editing mode entry/exit (F2, Escape)
 * - Cell focus management and input selection
 * - Save/cancel operations
 */

import { useCallback, useEffect, useRef } from 'react';
import { TableState, TableStateActions } from './use-table-state';
import { TableEventHandlers } from './use-table-event-handlers';
import type { TableColumn, TableDataRow } from '../types';

export interface KeyboardNavigationOptions {
  // Data
  rows: TableDataRow[];
  columns: TableColumn[];
  
  // State
  tableState: TableState & TableStateActions;
  
  // Event handlers
  eventHandlers: TableEventHandlers;
  
  // DOM refs
  tableRef: React.RefObject<HTMLTableElement>;
}

export interface KeyboardNavigationActions {
  // Navigation
  findNextCell: (currentRowId: string, currentColumn: string, direction?: 'next' | 'prev') => { rowId: string; column: string } | null;
  focusCell: (rowId: string, columnName: string) => void;
  
  // Keyboard handlers
  handleKeyDown: (e: React.KeyboardEvent) => void;
  
  // Focus management
  handleClickOutside: (event: MouseEvent) => void;
  
  // Input refs for focus management
  editInputRef: React.RefObject<HTMLInputElement>;
  editSelectRef: React.RefObject<HTMLSelectElement>;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions): KeyboardNavigationActions {
  const { rows, columns, tableState, eventHandlers, tableRef } = options;
  
  // Refs for focus management
  const editInputRef = useRef<HTMLInputElement>(null);
  const editSelectRef = useRef<HTMLSelectElement>(null);

  // ============================================================================
  // NAVIGATION UTILITIES
  // ============================================================================

  const findNextCell = useCallback((currentRowId: string, currentColumn: string, direction: 'next' | 'prev' = 'next') => {
    const currentRowIndex = rows.findIndex(r => r.id === currentRowId);
    const currentColIndex = columns.findIndex(c => c.name === currentColumn);
    
    if (direction === 'next') {
      // Next column in same row
      if (currentColIndex < columns.length - 1) {
        return { rowId: currentRowId, column: columns[currentColIndex + 1].name };
      }
      // First column in next row
      if (currentRowIndex < rows.length - 1) {
        return { rowId: rows[currentRowIndex + 1].id, column: columns[0].name };
      }
    } else {
      // Previous column in same row
      if (currentColIndex > 0) {
        return { rowId: currentRowId, column: columns[currentColIndex - 1].name };
      }
      // Last column in previous row
      if (currentRowIndex > 0) {
        return { rowId: rows[currentRowIndex - 1].id, column: columns[columns.length - 1].name };
      }
    }
    
    return null;
  }, [rows, columns]);

  const focusCell = useCallback((rowId: string, columnName: string) => {
    const column = columns.find(c => c.name === columnName);
    const row = rows.find(r => r.id === rowId);
    
    if (row && column) {
      eventHandlers.handleCellClick(rowId, columnName, row.data[columnName]);
    }
  }, [columns, rows, eventHandlers]);

  // ============================================================================
  // KEYBOARD EVENT HANDLERS
  // ============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!tableState.editingCell) return;

    const { rowId, column } = tableState.editingCell;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next row, same column
      const currentRowIndex = rows.findIndex(r => r.id === rowId);
      if (currentRowIndex < rows.length - 1) {
        const nextRow = rows[currentRowIndex + 1];
        focusCell(nextRow.id, column);
      } else {
        // Exit editing if at last row
        tableState.setEditingCell(null);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Move to next/previous cell
      const nextCell = findNextCell(rowId, column, e.shiftKey ? 'prev' : 'next');
      if (nextCell) {
        // Check if we're moving to a different row
        if (nextCell.rowId !== rowId) {
          // Save current row before moving to next row
          eventHandlers.handleRowExit(rowId);
        }
        
        setTimeout(() => {
          focusCell(nextCell.rowId, nextCell.column);
        }, 50);
      } else {
        // No next cell, exit editing
        eventHandlers.handleRowExit(rowId);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      eventHandlers.handleCellCancel();
    }
  }, [tableState.editingCell, rows, findNextCell, focusCell, eventHandlers, tableState]);

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  // Focus edit input when editing starts
  useEffect(() => {
    if (tableState.editingCell) {
      const column = columns.find(c => c.name === tableState.editingCell!.column);
      if (column?.type === 'bool') {
        editSelectRef.current?.focus();
      } else {
        editInputRef.current?.focus();
        // Select text on first focus to avoid re-selecting on each keystroke
        editInputRef.current?.select();
      }
    }
    // Intentionally exclude rows from deps to prevent re-select on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableState.editingCell, columns]);

  // Handle clicks outside table to save current row
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (tableState.editingRow && tableRef.current && !tableRef.current.contains(event.target as Node)) {
      eventHandlers.handleRowExit(tableState.editingRow);
    }
  }, [tableState.editingRow, tableRef, eventHandlers]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // ============================================================================
  // ARROW KEY NAVIGATION (Future enhancement)
  // ============================================================================

  const handleArrowNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!tableState.editingCell) return;

    const { rowId, column } = tableState.editingCell;
    const currentRowIndex = rows.findIndex(r => r.id === rowId);
    const currentColIndex = columns.findIndex(c => c.name === column);

    let newRowIndex = currentRowIndex;
    let newColIndex = currentColIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          newRowIndex = currentRowIndex - 1;
        }
        break;
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          newRowIndex = currentRowIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (currentColIndex > 0) {
          newColIndex = currentColIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (currentColIndex < columns.length - 1) {
          newColIndex = currentColIndex + 1;
        }
        break;
      default:
        return;
    }

    // If position changed, navigate
    if (newRowIndex !== currentRowIndex || newColIndex !== currentColIndex) {
      e.preventDefault();
      const newRow = rows[newRowIndex];
      const newColumn = columns[newColIndex];
      
      if (newRow && newColumn) {
        focusCell(newRow.id, newColumn.name);
      }
    }
  }, [tableState.editingCell, rows, columns, focusCell]);

  // Enhanced keyboard handler with arrow navigation
  const enhancedHandleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle basic navigation first
    handleKeyDown(e);
    
    // Handle arrow navigation if not already handled
    if (!e.defaultPrevented && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      handleArrowNavigation(e);
    }
  }, [handleKeyDown, handleArrowNavigation]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Navigation
    findNextCell,
    focusCell,
    
    // Keyboard handlers
    handleKeyDown: enhancedHandleKeyDown,
    
    // Focus management
    handleClickOutside,
    
    // Input refs
    editInputRef,
    editSelectRef,
  };
}
