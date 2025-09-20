/**
 * TableProvider - Context provider for table state and operations
 * 
 * Orchestrates all table hooks and provides a unified API:
 * - State management (useTableState)
 * - Mutations (useTableMutations)
 * - Event handling (useTableEventHandlers)
 * - Keyboard navigation (useKeyboardNavigation)
 * - Selection (useTableSelection)
 * 
 * This allows the main AutoDataTable component to be a simple presentation layer
 */

import React, { createContext, useContext, useRef, useMemo } from 'react';
import { useTableState } from '../hooks/use-table-state';
import { useTableMutations } from '../hooks/use-table-mutations';
import { useTableEventHandlers } from '../hooks/use-table-event-handlers';
import { useKeyboardNavigation } from '../hooks/use-keyboard-navigation';
import { useTableSelection } from '../hooks/use-table-selection';
import type { TableColumn, TableDataRow, TableSchema } from '../types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface TableContextValue {
  // Data
  tableId: string;
  columns: TableColumn[];
  rows: TableDataRow[];
  baseRows: TableDataRow[];
  tableSchema: TableSchema;
  
  // State from useTableState
  state: ReturnType<typeof useTableState>;
  
  // Mutations from useTableMutations
  mutations: ReturnType<typeof useTableMutations>;
  
  // Event handlers from useTableEventHandlers
  eventHandlers: ReturnType<typeof useTableEventHandlers>;
  
  // Keyboard navigation from useKeyboardNavigation
  keyboard: ReturnType<typeof useKeyboardNavigation>;
  
  // Selection from useTableSelection
  selection: ReturnType<typeof useTableSelection>;
  
  // DOM refs
  tableRef: React.RefObject<HTMLTableElement>;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

export interface TableProviderProps {
  // Required props
  tableId: string;
  columns: TableColumn[];
  rows: TableDataRow[];
  baseRows: TableDataRow[];
  tableSchema: TableSchema;
  
  // Optional props
  isLoading?: boolean;
  isError?: boolean;
  error?: Error;
  
  // Callbacks
  onCellFocus?: (rowId: string, columnName: string) => void;
  onRowEnter?: (rowId: string) => void;
  onRowExit?: (rowId: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onRowCreated?: (newRowId: string) => void;
  onRowUpdated?: (rowId: string) => void;
  onRowDeleted?: (rowId: string) => void;
  onSchemaUpdated?: () => void;
  
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT IMPLEMENTATION
// ============================================================================

const TableContext = createContext<TableContextValue | null>(null);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

export const TableProvider: React.FC<TableProviderProps> = ({
  tableId,
  columns,
  rows,
  baseRows,
  tableSchema,
  isLoading = false,
  isError = false,
  error,
  onCellFocus,
  onRowEnter,
  onRowExit,
  onSelectionChange,
  onRowCreated,
  onRowUpdated,
  onRowDeleted,
  onSchemaUpdated,
  children,
}) => {
  // DOM refs
  const tableRef = useRef<HTMLTableElement>(null);

  // ============================================================================
  // INITIALIZE HOOKS
  // ============================================================================

  // 1. State management
  const state = useTableState();

  // 2. Mutations
  const mutations = useTableMutations({
    tableId,
    onRowCreated,
    onRowUpdated,
    onRowDeleted,
    onSchemaUpdated,
  });

  // 3. Event handlers
  const eventHandlers = useTableEventHandlers({
    rows,
    baseRows,
    columns,
    tableState: state,
    mutations,
    onCellFocus,
    onRowEnter,
    onRowExit,
  });

  // 4. Keyboard navigation
  const keyboard = useKeyboardNavigation({
    rows,
    columns,
    tableState: state,
    eventHandlers,
    tableRef,
  });

  // 5. Selection
  const selection = useTableSelection({
    rows,
    onBulkDelete: mutations.bulkDeleteRows,
    onSelectionChange,
  });

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue = useMemo((): TableContextValue => ({
    // Data
    tableId,
    columns,
    rows,
    baseRows,
    tableSchema,
    
    // Hook instances
    state,
    mutations,
    eventHandlers,
    keyboard,
    selection,
    
    // DOM refs
    tableRef,
    
    // Loading states
    isLoading,
    isError,
    error,
  }), [
    tableId,
    columns,
    rows,
    baseRows,
    tableSchema,
    state,
    mutations,
    eventHandlers,
    keyboard,
    selection,
    isLoading,
    isError,
    error,
  ]);

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to access table state
 */
export const useTableStateContext = () => {
  const { state } = useTableContext();
  return state;
};

/**
 * Hook to access table mutations
 */
export const useTableMutationsContext = () => {
  const { mutations } = useTableContext();
  return mutations;
};

/**
 * Hook to access table event handlers
 */
export const useTableEventHandlersContext = () => {
  const { eventHandlers } = useTableContext();
  return eventHandlers;
};

/**
 * Hook to access keyboard navigation
 */
export const useTableKeyboardContext = () => {
  const { keyboard } = useTableContext();
  return keyboard;
};

/**
 * Hook to access table selection
 */
export const useTableSelectionContext = () => {
  const { selection } = useTableContext();
  return selection;
};

/**
 * Hook to access table data
 */
export const useTableDataContext = () => {
  const { tableId, columns, rows, baseRows, tableSchema } = useTableContext();
  return { tableId, columns, rows, baseRows, tableSchema };
};

/**
 * Hook to access table loading state
 */
export const useTableLoadingContext = () => {
  const { isLoading, isError, error } = useTableContext();
  return { isLoading, isError, error };
};

// ============================================================================
// HIGHER-ORDER COMPONENTS
// ============================================================================

/**
 * HOC to inject table context into any component
 */
export function withTableContext<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const tableContext = useTableContext();
    return <Component {...props} tableContext={tableContext} />;
  };
}

// ============================================================================
// CONTEXT UTILITIES
// ============================================================================

/**
 * Get the current editing state
 */
export const useCurrentEditingState = () => {
  const { state } = useTableContext();
  return {
    editingCell: state.editingCell,
    editingRow: state.editingRow,
    isEditing: !!state.editingCell,
    hasChanges: Object.keys(state.rowChanges).length > 0,
  };
};

/**
 * Get the current selection state
 */
export const useCurrentSelectionState = () => {
  const { selection } = useTableContext();
  return {
    selectedRowIds: selection.selectedRowIds,
    selectedCount: selection.selectedCount,
    hasSelection: selection.hasSelection,
    isAllSelected: selection.isAllSelected,
  };
};

/**
 * Get mutation loading states
 */
export const useMutationLoadingStates = () => {
  const { mutations } = useTableContext();
  return {
    isUpdating: mutations.isUpdating,
    isCreating: mutations.isCreating,
    isDeleting: mutations.isDeleting,
    isBulkDeleting: mutations.isBulkDeleting,
    isUpdatingSchema: mutations.isUpdatingSchema,
    isAnyMutationPending: mutations.isUpdating || mutations.isCreating || mutations.isDeleting || mutations.isBulkDeleting || mutations.isUpdatingSchema,
  };
};
