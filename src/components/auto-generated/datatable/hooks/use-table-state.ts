/**
 * useTableState - Manages all table state
 * 
 * Extracts state management logic from the main AutoDataTable component
 * Handles: editing state, row changes, sorting, and selection
 */

import { useState, useCallback } from 'react';
import type { TableColumn } from '../types';

export interface TableState {
  editingCell: { rowId: string; column: string } | null;
  editingRow: string | null;
  rowChanges: Record<string, Record<string, any>>;
  sortConfig: { column: string; direction: 'asc' | 'desc' } | null;
  selectedRowIds: Set<string>;
}

export interface TableStateActions {
  // Editing state
  setEditingCell: (cell: { rowId: string; column: string } | null) => void;
  setEditingRow: (rowId: string | null) => void;
  
  // Row changes
  setRowChanges: (changes: Record<string, Record<string, any>>) => void;
  updateRowChange: (rowId: string, columnName: string, value: any) => void;
  clearRowChanges: (rowId: string) => void;
  hasRowChanges: (rowId: string) => boolean;
  
  // Sorting
  setSortConfig: (config: { column: string; direction: 'asc' | 'desc' } | null) => void;
  handleSort: (columnName: string, direction: 'asc' | 'desc' | null) => void;
  
  // Selection
  setSelectedRowIds: (ids: Set<string>) => void;
  toggleSelectRow: (rowId: string) => void;
  toggleSelectAll: (allRowIds: string[]) => void;
  clearSelection: () => void;
  isAllSelected: (allRowIds: string[]) => boolean;
  
  // Reset all state
  resetState: () => void;
}

export function useTableState(): TableState & TableStateActions {
  // State
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowChanges, setRowChanges] = useState<Record<string, Record<string, any>>>({});
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Row changes actions
  const updateRowChange = useCallback((rowId: string, columnName: string, value: any) => {
    setRowChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnName]: value
      }
    }));
  }, []);

  const clearRowChanges = useCallback((rowId: string) => {
    setRowChanges(prev => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, []);

  const hasRowChanges = useCallback((rowId: string) => {
    return !!rowChanges[rowId] && Object.keys(rowChanges[rowId]).length > 0;
  }, [rowChanges]);

  // Sorting actions
  const handleSort = useCallback((columnName: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig(direction ? { column: columnName, direction } : null);
  }, []);

  // Selection actions
  const toggleSelectRow = useCallback((rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const isAllSelected = useCallback((allRowIds: string[]) => {
    return allRowIds.length > 0 && allRowIds.every(id => selectedRowIds.has(id));
  }, [selectedRowIds]);

  const toggleSelectAll = useCallback((allRowIds: string[]) => {
    const next = new Set<string>();
    if (!isAllSelected(allRowIds)) {
      allRowIds.forEach(id => next.add(id));
    }
    setSelectedRowIds(next);
  }, [isAllSelected]);

  const clearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setEditingCell(null);
    setEditingRow(null);
    setRowChanges({});
    setSortConfig(null);
    setSelectedRowIds(new Set());
  }, []);

  return {
    // State
    editingCell,
    editingRow,
    rowChanges,
    sortConfig,
    selectedRowIds,
    
    // Actions
    setEditingCell,
    setEditingRow,
    setRowChanges,
    updateRowChange,
    clearRowChanges,
    hasRowChanges,
    setSortConfig,
    handleSort,
    setSelectedRowIds,
    toggleSelectRow,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    resetState,
  };
}
