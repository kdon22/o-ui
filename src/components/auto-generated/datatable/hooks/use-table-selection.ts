/**
 * useTableSelection - Centralized selection logic for table operations
 * 
 * Handles:
 * - Single row selection/deselection
 * - Select all/deselect all functionality
 * - Bulk operations on selected rows
 * - Selection state management
 * - Selection UI components (floating toolbar)
 */

import { useState, useCallback, useMemo } from 'react';
import type { TableDataRow } from '../types';

export interface TableSelectionOptions {
  rows: TableDataRow[];
  onBulkDelete?: (rowIds: string[]) => Promise<void>;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface TableSelectionState {
  selectedRowIds: Set<string>;
  isAllSelected: boolean;
  selectedCount: number;
  hasSelection: boolean;
}

export interface TableSelectionActions {
  // Selection management
  toggleSelectRow: (rowId: string) => void;
  toggleSelectAll: () => void;
  selectRows: (rowIds: string[]) => void;
  deselectRows: (rowIds: string[]) => void;
  clearSelection: () => void;
  selectAllRows: () => void;
  
  // Bulk operations
  handleBulkDelete: () => Promise<void>;
  handleBulkUpdate: (updates: Record<string, any>) => Promise<void>;
  handleBulkExport: () => void;
  
  // Selection state queries
  isRowSelected: (rowId: string) => boolean;
  getSelectedRows: () => TableDataRow[];
  getSelectedRowIds: () => string[];
  
  // Selection UI
  getSelectionToolbarProps: () => SelectionToolbarProps;
}

export interface SelectionToolbarProps {
  selectedCount: number;
  isVisible: boolean;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onBulkUpdate?: () => void;
  onBulkExport?: () => void;
}

export function useTableSelection(options: TableSelectionOptions): TableSelectionState & TableSelectionActions {
  const { rows, onBulkDelete, onSelectionChange } = options;
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // ============================================================================
  // COMPUTED STATE
  // ============================================================================

  const rowIds = useMemo(() => rows.map(r => r.id), [rows]);
  
  const isAllSelected = useMemo(() => {
    return rowIds.length > 0 && rowIds.every(id => selectedRowIds.has(id));
  }, [rowIds, selectedRowIds]);

  const selectedCount = selectedRowIds.size;
  const hasSelection = selectedCount > 0;

  // ============================================================================
  // SELECTION ACTIONS
  // ============================================================================

  const toggleSelectRow = useCallback((rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      
      // Notify parent of selection change
      onSelectionChange?.(Array.from(next));
      
      return next;
    });
  }, [onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    setSelectedRowIds(prev => {
      const next = new Set<string>();
      
      // If not all selected, select all; otherwise, clear selection
      if (!isAllSelected) {
        rowIds.forEach(id => next.add(id));
      }
      
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [isAllSelected, rowIds, onSelectionChange]);

  const selectRows = useCallback((rowIds: string[]) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      rowIds.forEach(id => next.add(id));
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const deselectRows = useCallback((rowIds: string[]) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      rowIds.forEach(id => next.delete(id));
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const selectAllRows = useCallback(() => {
    const next = new Set(rowIds);
    setSelectedRowIds(next);
    onSelectionChange?.(rowIds);
  }, [rowIds, onSelectionChange]);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const handleBulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    
    const idsToDelete = Array.from(selectedRowIds);
    
    try {
      if (onBulkDelete) {
        await onBulkDelete(idsToDelete);
      }
      
      // Clear selection after successful delete
      clearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      // Selection remains intact on error for retry
    }
  }, [selectedRowIds, selectedCount, onBulkDelete, clearSelection]);

  const handleBulkUpdate = useCallback(async (updates: Record<string, any>) => {
    if (selectedCount === 0) return;
    
    const idsToUpdate = Array.from(selectedRowIds);
    
    // TODO: Implement bulk update logic
    console.log('Bulk update:', { ids: idsToUpdate, updates });
    
    // For now, just log the operation
    // In a real implementation, this would call a bulk update mutation
  }, [selectedRowIds, selectedCount]);

  const handleBulkExport = useCallback(() => {
    if (selectedCount === 0) return;
    
    const selectedRows = getSelectedRows();
    
    // TODO: Implement export logic
    console.log('Bulk export:', selectedRows);
    
    // For now, just log the operation
    // In a real implementation, this would generate a CSV/Excel file
  }, [selectedCount]);

  // ============================================================================
  // SELECTION QUERIES
  // ============================================================================

  const isRowSelected = useCallback((rowId: string) => {
    return selectedRowIds.has(rowId);
  }, [selectedRowIds]);

  const getSelectedRows = useCallback(() => {
    return rows.filter(row => selectedRowIds.has(row.id));
  }, [rows, selectedRowIds]);

  const getSelectedRowIds = useCallback(() => {
    return Array.from(selectedRowIds);
  }, [selectedRowIds]);

  // ============================================================================
  // SELECTION UI
  // ============================================================================

  const getSelectionToolbarProps = useCallback((): SelectionToolbarProps => {
    return {
      selectedCount,
      isVisible: hasSelection,
      onBulkDelete: handleBulkDelete,
      onClearSelection: clearSelection,
      onBulkUpdate: () => handleBulkUpdate({}), // TODO: Pass actual updates
      onBulkExport: handleBulkExport,
    };
  }, [selectedCount, hasSelection, handleBulkDelete, clearSelection, handleBulkUpdate, handleBulkExport]);

  // ============================================================================
  // KEYBOARD SHORTCUTS FOR SELECTION
  // ============================================================================

  const handleSelectionKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Cmd/Ctrl + A - Select all
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      toggleSelectAll();
    }
    
    // Escape - Clear selection
    if (e.key === 'Escape' && hasSelection) {
      e.preventDefault();
      clearSelection();
    }
    
    // Delete/Backspace - Delete selected rows
    if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
      e.preventDefault();
      handleBulkDelete();
    }
  }, [toggleSelectAll, hasSelection, clearSelection, handleBulkDelete]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    selectedRowIds,
    isAllSelected,
    selectedCount,
    hasSelection,
    
    // Actions
    toggleSelectRow,
    toggleSelectAll,
    selectRows,
    deselectRows,
    clearSelection,
    selectAllRows,
    
    // Bulk operations
    handleBulkDelete,
    handleBulkUpdate,
    handleBulkExport,
    
    // Queries
    isRowSelected,
    getSelectedRows,
    getSelectedRowIds,
    
    // UI
    getSelectionToolbarProps,
  };
}
