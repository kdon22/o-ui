/**
 * Table Types - Core table and schema types
 * Defines the structure of tables, schemas, and data rows
 */

import { TableColumn } from './column-types';

// ============================================================================
// TABLE SCHEMA
// ============================================================================

export interface TableSchema {
  columns: TableColumn[];
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// TABLE DATA ROW
// ============================================================================

export interface TableDataRow {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  branchId: string;
  originalTableDataId?: string;
  __optimistic?: boolean;
}

// ============================================================================
// TABLE METADATA
// ============================================================================

export interface TableMetadata {
  id: string;
  name: string;
  description?: string;
  schema: TableSchema;
  tenantId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
}

// ============================================================================
// TABLE STATE
// ============================================================================

export interface TableState {
  isLoading: boolean;
  error: string | null;
  selectedRowIds: Set<string>;
  sortConfig: SortConfig | null;
  editingCell: EditingCell | null;
  editingRow: string | null;
  rowChanges: Record<string, Record<string, any>>;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface EditingCell {
  rowId: string;
  column: string;
}

// ============================================================================
// TABLE PROPS
// ============================================================================

export interface AutoDataTableProps {
  tableId: string;
  className?: string;
  onCellEdit?: (rowId: string, column: string, value: any) => void;
  onRowAdd?: () => void;
  onRowDelete?: (rowIds: string[]) => void;
  onSchemaChange?: (schema: TableSchema) => void;
}

// ============================================================================
// TABLE COMPONENT PROPS
// ============================================================================

export interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  schema: TableSchema;
  sortConfig: SortConfig | null;
  onSort: (column: string, direction: 'asc' | 'desc' | null) => void;
  onSchemaChange: (schema: TableSchema) => void;
}

export interface TableBodyProps {
  rows: TableDataRow[];
  schema: TableSchema;
  editingCell: EditingCell | null;
  selectedRowIds: Set<string>;
  rowChanges: Record<string, Record<string, any>>;
  onCellEdit: (rowId: string, column: string) => void;
  onCellSave: (rowId: string, column: string, value: any) => void;
  onRowSelect: (rowId: string, selected: boolean) => void;
}

export interface TableRowProps {
  row: TableDataRow;
  schema: TableSchema;
  editingCell: EditingCell | null;
  isSelected: boolean;
  changes: Record<string, any>;
  onCellEdit: (column: string) => void;
  onCellSave: (column: string, value: any) => void;
  onRowSelect: (selected: boolean) => void;
}

export interface TableCellProps {
  value: any;
  column: TableColumn;
  isEditing: boolean;
  onChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CellValue = string | number | boolean | string[] | Date | null | undefined;

export type TableActionType = 'create' | 'update' | 'delete' | 'schema-change';

export interface TableAction {
  type: TableActionType;
  payload: any;
  timestamp: Date;
}

// ============================================================================
// QUERY TYPES (for data fetching)
// ============================================================================

export interface TableQueryOptions {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface TableQueryResult {
  rows: TableDataRow[];
  total: number;
  hasMore: boolean;
}
