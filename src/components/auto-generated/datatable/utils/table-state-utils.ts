/**
 * Table State Utils - Helper functions for managing table state
 * 
 * Functions for:
 * - Row selection management
 * - Sort state management
 * - Edit state management
 * - Table data filtering and searching
 * - State persistence
 */

import {
  TableState,
  SortConfig,
  EditingCell,
  TableDataRow,
  TableSchema,
  CellValue
} from '../types';

import { sortCellValues } from './cell-utils';

// ============================================================================
// ROW SELECTION UTILITIES
// ============================================================================

/**
 * Toggle single row selection
 */
export const toggleRowSelection = (
  selectedRowIds: Set<string>,
  rowId: string
): Set<string> => {
  const newSelection = new Set(selectedRowIds);
  
  if (newSelection.has(rowId)) {
    newSelection.delete(rowId);
  } else {
    newSelection.add(rowId);
  }
  
  return newSelection;
};

/**
 * Select all rows
 */
export const selectAllRows = (rows: TableDataRow[]): Set<string> => {
  return new Set(rows.map(row => row.id));
};

/**
 * Clear all selections
 */
export const clearAllSelections = (): Set<string> => {
  return new Set();
};

/**
 * Select range of rows
 */
export const selectRowRange = (
  rows: TableDataRow[],
  fromRowId: string,
  toRowId: string
): Set<string> => {
  const fromIndex = rows.findIndex(row => row.id === fromRowId);
  const toIndex = rows.findIndex(row => row.id === toRowId);
  
  if (fromIndex === -1 || toIndex === -1) {
    return new Set();
  }
  
  const startIndex = Math.min(fromIndex, toIndex);
  const endIndex = Math.max(fromIndex, toIndex);
  
  const selectedIds = new Set<string>();
  for (let i = startIndex; i <= endIndex; i++) {
    selectedIds.add(rows[i].id);
  }
  
  return selectedIds;
};

/**
 * Get selection statistics
 */
export interface SelectionStats {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isNoneSelected: boolean;
}

export const getSelectionStats = (
  selectedRowIds: Set<string>,
  totalRows: number
): SelectionStats => {
  const selectedCount = selectedRowIds.size;
  
  return {
    selectedCount,
    totalCount: totalRows,
    isAllSelected: selectedCount === totalRows && totalRows > 0,
    isNoneSelected: selectedCount === 0
  };
};

// ============================================================================
// SORT STATE UTILITIES
// ============================================================================

/**
 * Toggle sort direction for column
 */
export const toggleSortDirection = (
  currentSortConfig: SortConfig | null,
  columnName: string
): SortConfig | null => {
  if (!currentSortConfig || currentSortConfig.column !== columnName) {
    return { column: columnName, direction: 'asc' };
  }
  
  if (currentSortConfig.direction === 'asc') {
    return { column: columnName, direction: 'desc' };
  }
  
  // Clear sort on third click
  return null;
};

/**
 * Apply sort to rows
 */
export const applySortToRows = (
  rows: TableDataRow[],
  sortConfig: SortConfig | null,
  schema: TableSchema
): TableDataRow[] => {
  if (!sortConfig) {
    return rows;
  }
  
  const column = schema.columns.find(col => col.name === sortConfig.column);
  if (!column) {
    return rows;
  }
  
  return [...rows].sort((a, b) => {
    const aValue = a.data[sortConfig.column];
    const bValue = b.data[sortConfig.column];
    
    return sortCellValues(aValue, bValue, column, sortConfig.direction);
  });
};

// ============================================================================
// EDIT STATE UTILITIES
// ============================================================================

/**
 * Check if cell is currently being edited
 */
export const isCellEditing = (
  editingCell: EditingCell | null,
  rowId: string,
  columnName: string
): boolean => {
  return editingCell?.rowId === rowId && editingCell?.column === columnName;
};

/**
 * Check if row has any editing cells
 */
export const isRowEditing = (
  editingCell: EditingCell | null,
  rowId: string
): boolean => {
  return editingCell?.rowId === rowId;
};

/**
 * Clear editing state
 */
export const clearEditingState = (): EditingCell | null => {
  return null;
};

/**
 * Set editing state for cell
 */
export const setEditingCell = (
  rowId: string,
  columnName: string
): EditingCell => {
  return { rowId, column: columnName };
};

// ============================================================================
// ROW CHANGES UTILITIES
// ============================================================================

/**
 * Set row change for specific field
 */
export const setRowChange = (
  rowChanges: Record<string, Record<string, any>>,
  rowId: string,
  fieldName: string,
  value: CellValue
): Record<string, Record<string, any>> => {
  return {
    ...rowChanges,
    [rowId]: {
      ...(rowChanges[rowId] || {}),
      [fieldName]: value
    }
  };
};

/**
 * Clear changes for specific row
 */
export const clearRowChanges = (
  rowChanges: Record<string, Record<string, any>>,
  rowId: string
): Record<string, Record<string, any>> => {
  const newChanges = { ...rowChanges };
  delete newChanges[rowId];
  return newChanges;
};

/**
 * Clear all row changes
 */
export const clearAllRowChanges = (): Record<string, Record<string, any>> => {
  return {};
};

/**
 * Get changed rows
 */
export const getChangedRows = (
  rowChanges: Record<string, Record<string, any>>
): string[] => {
  return Object.keys(rowChanges);
};

/**
 * Check if row has changes
 */
export const hasRowChanges = (
  rowChanges: Record<string, Record<string, any>>,
  rowId: string
): boolean => {
  return rowId in rowChanges && Object.keys(rowChanges[rowId]).length > 0;
};

// ============================================================================
// TABLE FILTERING AND SEARCHING
// ============================================================================

/**
 * Filter rows by search text
 */
export const filterRowsBySearch = (
  rows: TableDataRow[],
  searchText: string,
  schema: TableSchema
): TableDataRow[] => {
  if (!searchText.trim()) {
    return rows;
  }
  
  const searchLower = searchText.toLowerCase();
  
  return rows.filter(row => {
    return schema.columns.some(column => {
      const value = row.data[column.name];
      if (value === null || value === undefined) {
        return false;
      }
      
      const stringValue = String(value).toLowerCase();
      return stringValue.includes(searchLower);
    });
  });
};

/**
 * Filter rows by column values
 */
export const filterRowsByColumn = (
  rows: TableDataRow[],
  columnName: string,
  filterValues: any[]
): TableDataRow[] => {
  if (filterValues.length === 0) {
    return rows;
  }
  
  return rows.filter(row => {
    const value = row.data[columnName];
    return filterValues.includes(value);
  });
};

/**
 * Get unique values for column (for filter options)
 */
export const getUniqueColumnValues = (
  rows: TableDataRow[],
  columnName: string
): any[] => {
  const values = rows.map(row => row.data[columnName])
    .filter(value => value !== null && value !== undefined);
  
  return [...new Set(values)].sort();
};

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Serialize table state for persistence
 */
export const serializeTableState = (state: Partial<TableState>): string => {
  const serializable = {
    sortConfig: state.sortConfig,
    selectedRowIds: state.selectedRowIds ? Array.from(state.selectedRowIds) : [],
  };
  
  return JSON.stringify(serializable);
};

/**
 * Deserialize table state from persistence
 */
export const deserializeTableState = (serialized: string): Partial<TableState> => {
  try {
    const parsed = JSON.parse(serialized);
    
    return {
      sortConfig: parsed.sortConfig || null,
      selectedRowIds: new Set(parsed.selectedRowIds || []),
      editingCell: null, // Don't persist editing state
      editingRow: null,
      rowChanges: {}, // Don't persist unsaved changes
      isLoading: false,
      error: null
    };
  } catch {
    return {
      sortConfig: null,
      selectedRowIds: new Set(),
      editingCell: null,
      editingRow: null,
      rowChanges: {},
      isLoading: false,
      error: null
    };
  }
};

/**
 * Get default table state
 */
export const getDefaultTableState = (): TableState => {
  return {
    isLoading: false,
    error: null,
    selectedRowIds: new Set(),
    sortConfig: null,
    editingCell: null,
    editingRow: null,
    rowChanges: {}
  };
};

// ============================================================================
// ROW DATA UTILITIES
// ============================================================================

/**
 * Create new empty row
 */
export const createEmptyRow = (
  schema: TableSchema,
  branchId: string,
  userId?: string
): Omit<TableDataRow, 'id'> => {
  const data: Record<string, any> = {};
  
  // Initialize with default values based on column types
  schema.columns.forEach(column => {
    switch (column.type) {
      case 'text':
        data[column.name] = '';
        break;
      case 'number':
        data[column.name] = null;
        break;
      case 'boolean':
        data[column.name] = false;
        break;
      case 'date':
        data[column.name] = null;
        break;
      case 'select':
        data[column.name] = null;
        break;
      case 'multi_select':
        data[column.name] = [];
        break;
      default:
        data[column.name] = '';
    }
  });
  
  const now = new Date().toISOString();
  
  return {
    data,
    createdAt: now,
    updatedAt: now,
    branchId,
    __optimistic: true
  };
};

/**
 * Merge row changes into row data
 */
export const mergeRowChanges = (
  row: TableDataRow,
  changes: Record<string, any>
): TableDataRow => {
  if (Object.keys(changes).length === 0) {
    return row;
  }
  
  return {
    ...row,
    data: {
      ...row.data,
      ...changes
    },
    updatedAt: new Date().toISOString()
  };
};
