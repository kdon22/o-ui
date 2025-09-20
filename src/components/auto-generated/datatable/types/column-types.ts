/**
 * Column Types - Single source of truth for all column-related types
 * Eliminates duplication across components
 */

import { 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  List,
  Mail,
  DollarSign
} from 'lucide-react';

// ============================================================================
// COLUMN FIELD TYPES (Primitive Types - Single Source of Truth)
// ============================================================================

export type ColumnFieldType = 'str' | 'int' | 'bool' | 'date' | 'list' | 'email' | 'currency';

export type SortDirection = 'asc' | 'desc' | null;

// ============================================================================
// COLUMN INTERFACE
// ============================================================================

export interface TableColumn {
  name: string;
  type: ColumnFieldType;
  required?: boolean;
  options?: string[];
  format?: string;
  description?: string;
  richText?: boolean;
}

// ============================================================================
// COLUMN CONFIGURATION
// ============================================================================

export interface ColumnTypeConfig {
  value: ColumnFieldType;
  label: string;
  icon: any;
  description: string;
  hasOptions?: boolean;
  hasFormat?: boolean;
}

// ============================================================================
// COLUMN ICONS (Single source of truth)
// ============================================================================

export const COLUMN_TYPE_ICONS = {
  str: Type,
  int: Hash,
  date: Calendar,
  bool: ToggleLeft,
  list: List,
  email: Mail,
  currency: DollarSign
} as const;

// ============================================================================
// FIELD TYPE DEFINITIONS (Enhanced from existing components)
// ============================================================================

export const FIELD_TYPES: ColumnTypeConfig[] = [
  {
    value: 'str',
    label: 'Text',
    icon: Type,
    description: 'Text values for names, descriptions, etc. Supports HTML: <b>bold</b> <i>italic</i> <a href="#">links</a>',
    hasOptions: false,
    hasFormat: false
  },
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email addresses with validation and mailto links',
    hasOptions: false,
    hasFormat: false
  },
  {
    value: 'currency',
    label: 'Currency',
    icon: DollarSign,
    description: 'Money values with automatic formatting ($1,234.56)',
    hasOptions: false,
    hasFormat: true
  },
  {
    value: 'int',
    label: 'Number',
    icon: Hash,
    description: 'Numeric values for calculations and comparisons',
    hasOptions: false,
    hasFormat: true
  },
  {
    value: 'bool',
    label: 'True/False',
    icon: ToggleLeft,
    description: 'Boolean values for conditions and flags',
    hasOptions: false,
    hasFormat: false
  },
  {
    value: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date values for time-based rules',
    hasOptions: false,
    hasFormat: true
  },
  {
    value: 'list',
    label: 'List',
    icon: List,
    description: 'Multiple values for collections and selections',
    hasOptions: true,
    hasFormat: false
  }
];

// ============================================================================
// COLUMN OPERATION TYPES
// ============================================================================

export interface ColumnOperationCallbacks {
  onSort?: (direction: SortDirection) => void;
  onColumnUpdate?: (column: TableColumn) => void;
  onColumnDelete?: () => void;
  onColumnDuplicate?: () => void;
  onInsertColumn?: (position: 'left' | 'right') => void;
}

export interface ColumnHeaderProps {
  column: TableColumn;
  sortDirection?: SortDirection;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getColumnTypeConfig = (type: ColumnFieldType): ColumnTypeConfig | undefined => {
  return FIELD_TYPES.find(config => config.value === type);
};

export const getColumnIcon = (type: ColumnFieldType) => {
  return COLUMN_TYPE_ICONS[type];
};

export const getSmartColumnDefaults = (existingColumns: TableColumn[]): Partial<TableColumn> => {
  if (existingColumns.length === 0) {
    return { type: 'str' };
  }
  
  const lastColumn = existingColumns[existingColumns.length - 1];
  return {
    type: lastColumn.type,
    options: lastColumn.type === 'list' 
      ? [...(lastColumn.options || [])] 
      : undefined,
    format: lastColumn.format,
    required: false
  };
};
