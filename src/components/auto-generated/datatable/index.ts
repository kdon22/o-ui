/**
 * Auto-Generated DataTable Components
 * 
 * This module provides Airtable-like functionality for user-defined tables:
 * - Dynamic column generation from table schema
 * - Inline cell editing with type-aware inputs
 * - Branch overlay and Copy-on-Write support
 * - JSON data storage and rendering
 * - Factory-driven architecture
 * - Mobile-first responsive design
 * 
 * REFACTORED ARCHITECTURE:
 * - Small, focused components and hooks
 * - Context-driven state management
 * - Clean separation of concerns
 * - Excellent patterns and maintainability
 */

// Main component (refactored only - no backward compatibility)
export { AutoDataTable } from './auto-datatable';

// Provider and context system
export {
  TableProvider,
  useTableContext,
  useTableStateContext,
  useTableMutationsContext,
  useTableEventHandlersContext,
  useTableKeyboardContext,
  useTableSelectionContext,
  useTableDataContext,
  useTableLoadingContext,
  useCurrentEditingState,
  useCurrentSelectionState,
  useMutationLoadingStates,
  withTableContext,
} from './providers/table-provider';

// Focused hooks
export { useTableState } from './hooks/use-table-state';
export { useTableEventHandlers } from './hooks/use-table-event-handlers';
export { useKeyboardNavigation } from './hooks/use-keyboard-navigation';
export { useTableSelection } from './hooks/use-table-selection';

// Table component parts
export { 
  TableContainer,
  TableHeader, 
  TableBody,
  TableRow,
  TableCell
} from './components';

// Cell rendering
export { 
  CellRenderer, 
  EnhancedCellRenderer,
  getPlaceholderForColumn,
  validateCellValue,
  formatCellValue
} from './components/cell-renderer';

// Selection UI
export {
  SelectionToolbar,
  EnhancedSelectionToolbar,
  SelectionKeyboardHints
} from './components/selection-toolbar';

// Column management
export { 
  ColumnHeader, 
  AddColumnButton,
  FieldTypePicker 
} from './column-manager';

// Cell editors
export {
  BaseCellEditor,
  TextCellEditor,
  NumberCellEditor,
  BooleanCellEditor,
  DateCellEditor,
  SelectCellEditor
} from './cell-editors';

// Types - comprehensive export
export type { 
  // Main types
  AutoDataTableProps,
  TableColumn,
  TableDataRow,
  TableSchema,
  CellValue,
  
  // State types
  TableState,
  SortConfig,
  EditingCell,
  
  // Column types
  ColumnFieldType,
  SortDirection,
  
  // Component prop types
  TableContainerProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
} from './types';

// Utils
export * from './utils';