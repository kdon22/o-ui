/**
 * Column Utils - Helper functions for column operations
 * 
 * Functions for:
 * - Column manipulation (insert, delete, reorder)
 * - Column validation
 * - Column name generation
 * - Column default values
 */

import {
  TableColumn,
  TableSchema,
  ColumnFieldType,
  getSmartColumnDefaults
} from '../types';

// ============================================================================
// COLUMN NAME GENERATION
// ============================================================================

/**
 * Generate unique column name
 */
export const generateUniqueColumnName = (
  existingColumns: TableColumn[],
  baseName: string = 'Column'
): string => {
  const existingNames = existingColumns.map(col => col.name.toLowerCase());
  
  // If base name doesn't exist, use it
  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName;
  }
  
  // Find next available number
  let counter = 1;
  while (existingNames.includes(`${baseName.toLowerCase()} ${counter}`)) {
    counter++;
  }
  
  return `${baseName} ${counter}`;
};

/**
 * Convert string to camelCase for programmatic field names
 */
export const toCamelCase = (input: string): string => {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 0) return '';
  
  return parts
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

/**
 * Convert camelCase to human-readable title
 */
export const toTitleCase = (input: string): string => {
  return input
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// ============================================================================
// COLUMN VALIDATION
// ============================================================================

/**
 * Validate column configuration
 */
export interface ColumnValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateColumn = (column: TableColumn): ColumnValidationResult => {
  const errors: string[] = [];
  
  // Name validation
  if (!column.name || !column.name.trim()) {
    errors.push('Column name is required');
  }
  
  if (column.name && column.name.length > 100) {
    errors.push('Column name must be 100 characters or less');
  }
  
  // Type-specific validation
  if (column.type === 'select' || column.type === 'multi_select') {
    if (!column.options || column.options.length === 0) {
      errors.push('Select fields must have at least one option');
    }
    
    if (column.options && column.options.some(opt => !opt.trim())) {
      errors.push('All select options must have a value');
    }
  }
  
  // Description validation
  if (column.description && column.description.length > 500) {
    errors.push('Column description must be 500 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate schema integrity
 */
export const validateSchema = (schema: TableSchema): ColumnValidationResult => {
  const errors: string[] = [];
  
  // Check for duplicate column names
  const columnNames = schema.columns.map(col => col.name.toLowerCase());
  const duplicateNames = columnNames.filter((name, index) => 
    columnNames.indexOf(name) !== index
  );
  
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate column names found: ${duplicateNames.join(', ')}`);
  }
  
  // Validate each column
  schema.columns.forEach((column, index) => {
    const columnValidation = validateColumn(column);
    if (!columnValidation.isValid) {
      errors.push(`Column ${index + 1}: ${columnValidation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// COLUMN MANIPULATION
// ============================================================================

/**
 * Insert column at specific position
 */
export const insertColumn = (
  schema: TableSchema,
  newColumn: TableColumn,
  position: number
): TableSchema => {
  const columns = [...schema.columns];
  columns.splice(position, 0, newColumn);
  
  return {
    ...schema,
    columns
  };
};

/**
 * Remove column at specific position
 */
export const removeColumn = (
  schema: TableSchema,
  position: number
): TableSchema => {
  const columns = [...schema.columns];
  columns.splice(position, 1);
  
  return {
    ...schema,
    columns
  };
};

/**
 * Move column from one position to another
 */
export const moveColumn = (
  schema: TableSchema,
  fromIndex: number,
  toIndex: number
): TableSchema => {
  const columns = [...schema.columns];
  const [movedColumn] = columns.splice(fromIndex, 1);
  columns.splice(toIndex, 0, movedColumn);
  
  return {
    ...schema,
    columns
  };
};

/**
 * Update column at specific position
 */
export const updateColumn = (
  schema: TableSchema,
  position: number,
  updatedColumn: TableColumn
): TableSchema => {
  const columns = [...schema.columns];
  columns[position] = updatedColumn;
  
  return {
    ...schema,
    columns
  };
};

/**
 * Duplicate column at specific position
 */
export const duplicateColumn = (
  schema: TableSchema,
  position: number
): TableSchema => {
  const originalColumn = schema.columns[position];
  const duplicatedColumn: TableColumn = {
    ...originalColumn,
    name: generateUniqueColumnName(schema.columns, `${originalColumn.name} copy`)
  };
  
  return insertColumn(schema, duplicatedColumn, position + 1);
};

// ============================================================================
// COLUMN DEFAULTS
// ============================================================================

/**
 * Create new column with smart defaults
 */
export const createNewColumn = (
  existingColumns: TableColumn[],
  type?: ColumnFieldType,
  name?: string
): TableColumn => {
  const smartDefaults = getSmartColumnDefaults(existingColumns);
  
  return {
    name: name || generateUniqueColumnName(existingColumns),
    type: type || smartDefaults.type || 'text',
    required: smartDefaults.required || false,
    options: smartDefaults.options,
    format: smartDefaults.format,
    description: ''
  };
};

/**
 * Get default value for column type
 */
export const getDefaultValue = (column: TableColumn): any => {
  switch (column.type) {
    case 'text':
      return '';
    case 'number':
      return null;
    case 'boolean':
      return false;
    case 'date':
      return null;
    case 'select':
      return null;
    case 'multi_select':
      return [];
    default:
      return '';
  }
};

// ============================================================================
// COLUMN SORTING
// ============================================================================

/**
 * Sort columns alphabetically
 */
export const sortColumnsAlphabetically = (schema: TableSchema): TableSchema => {
  const sortedColumns = [...schema.columns].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  return {
    ...schema,
    columns: sortedColumns
  };
};

/**
 * Sort columns by type
 */
export const sortColumnsByType = (schema: TableSchema): TableSchema => {
  const typeOrder = ['text', 'number', 'boolean', 'date', 'select', 'multi_select'];
  
  const sortedColumns = [...schema.columns].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.type);
    const bIndex = typeOrder.indexOf(b.type);
    
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  return {
    ...schema,
    columns: sortedColumns
  };
};
