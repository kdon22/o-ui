/**
 * DataTable Types - Main export for all datatable types
 * Single source of truth for all type definitions
 */

// Column Types
export type {
  ColumnFieldType,
  SortDirection,
  TableColumn,
  ColumnTypeConfig,
  ColumnOperationCallbacks,
  ColumnHeaderProps
} from './column-types';

export {
  COLUMN_TYPE_ICONS,
  FIELD_TYPES,
  getColumnTypeConfig,
  getColumnIcon,
  getSmartColumnDefaults
} from './column-types';

// Table Types
export type {
  TableSchema,
  TableDataRow,
  TableMetadata,
  TableState,
  SortConfig,
  EditingCell,
  AutoDataTableProps,
  TableContainerProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  CellValue,
  TableActionType,
  TableAction,
  TableQueryOptions,
  TableQueryResult
} from './table-types';

// Cell Types
export type {
  CellEditingState,
  BaseCellEditorProps,
  TextCellEditorProps,
  NumberCellEditorProps,
  SelectCellEditorProps,
  MultiSelectCellEditorProps,
  DateCellEditorProps,
  BooleanCellEditorProps,
  TextValue,
  NumberValue,
  SelectValue,
  MultiSelectValue,
  DateValue,
  BooleanValue,
  CellValidationRule,
  CellValidationResult,
  NumberFormat,
  DateFormat,
  TextFormat,
  CellFormat,
  CellEditorConfig,
  CellPosition,
  KeyboardNavigationState,
  NavigationDirection,
  CellClickEvent,
  CellKeyDownEvent,
  CellDoubleClickEvent,
  CellEditorFactory,
  CellEditorRegistry,
  CellValueValidator,
  CellValueFormatter,
  CellValueParser
} from './cell-types';

// Re-export specific types that are commonly used
export type { CellValue as CommonCellValue } from './cell-types';
export type { TableColumn as DataTableColumn } from './column-types';
