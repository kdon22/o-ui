/**
 * Auto-Generated Table Components
 * 
 * This is the main entry point for the auto-generated table system.
 * It provides a complete, schema-driven table component with:
 * - Inline forms for create/edit operations
 * - Bulk selection and actions
 * - Column filtering and sorting
 * - Mobile-first responsive design
 * - Optimistic updates with action system integration
 * - Junction relationship discovery and creation
 * - Level 1 and Level 2 filtering support
 * - Floating bulk actions menu
 * - Context menu for row actions
 * - Field positioning system (1-3 fields per row)
 * - Auto-generated from ResourceSchema
 */

export { AutoTable } from './auto-table';
export { HeaderActions, AttachAction, AddAction, AttachAndAddActions, createAutoTableHeaderActions } from './header-actions';
export { InlineForm } from './inline-form';
export { FloatingBulkActions } from './floating-bulk-actions';
export { ContextMenu } from './context-menu';
export { ColumnFilter } from './column-filter';
export { FilterTabBar } from './filter-tab-bar';

export type { 
  AutoTableProps, 
  InlineFormProps, 
  SortConfig, 
  FloatingBulkActionsProps, 
  ContextMenuProps, 
  ColumnFilterProps, 
  TableColumn,
  HeaderActionProps,
  HeaderActionsProps 
} from './types'; 