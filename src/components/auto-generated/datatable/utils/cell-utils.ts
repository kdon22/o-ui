/**
 * Cell Utils - Helper functions for cell operations
 * 
 * Functions for:
 * - Cell value formatting and parsing
 * - Cell value validation
 * - Cell value conversion between types
 * - Cell editing utilities
 */

import {
  TableColumn,
  CellValue,
  TextValue,
  NumberValue,
  SelectValue,
  MultiSelectValue,
  DateValue,
  BooleanValue
} from '../types';

// ============================================================================
// CELL VALUE FORMATTING
// ============================================================================

/**
 * Format cell value for display
 */
export const formatCellValue = (value: CellValue, column: TableColumn): string => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (column.type) {
    case 'text':
      return String(value);

    case 'number':
      if (typeof value === 'number') {
        // Apply number formatting if specified
        if (column.format) {
          try {
            const decimalPlaces = parseInt(column.format) || 0;
            return value.toFixed(decimalPlaces);
          } catch {
            return value.toString();
          }
        }
        return value.toLocaleString();
      }
      return String(value);

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === 'string') {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      }
      return String(value);

    case 'select':
      return String(value);

    case 'multi_select':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);

    default:
      return String(value);
  }
};

/**
 * Format cell value for editing
 */
export const formatCellValueForEdit = (value: CellValue, column: TableColumn): string => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (column.type) {
    case 'multi_select':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);

    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      if (typeof value === 'string') {
        try {
          return new Date(value).toISOString().split('T')[0];
        } catch {
          return String(value);
        }
      }
      return String(value);

    case 'boolean':
      return Boolean(value).toString();

    default:
      return String(value);
  }
};

// ============================================================================
// CELL VALUE PARSING
// ============================================================================

/**
 * Parse cell value from string input
 */
export const parseCellValue = (input: string, column: TableColumn): CellValue => {
  if (!input || input.trim() === '') {
    return getEmptyValue(column);
  }

  switch (column.type) {
    case 'text':
      return input;

    case 'number':
      const num = parseFloat(input);
      return isNaN(num) ? null : num;

    case 'boolean':
      return input.toLowerCase() === 'true' || input === '1';

    case 'date':
      try {
        const date = new Date(input);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }

    case 'select':
      // Validate against options if available
      if (column.options && column.options.length > 0) {
        return column.options.includes(input) ? input : null;
      }
      return input;

    case 'multi_select':
      const values = input.split(',').map(v => v.trim()).filter(Boolean);
      // Validate against options if available
      if (column.options && column.options.length > 0) {
        return values.filter(v => column.options!.includes(v));
      }
      return values;

    default:
      return input;
  }
};

/**
 * Get empty value for column type
 */
export const getEmptyValue = (column: TableColumn): CellValue => {
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
// CELL VALUE VALIDATION
// ============================================================================

export interface CellValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate cell value
 */
export const validateCellValue = (value: CellValue, column: TableColumn): CellValidationResult => {
  // Required field validation
  if (column.required) {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, error: 'This field is required' };
    }
    
    if (column.type === 'multi_select' && Array.isArray(value) && value.length === 0) {
      return { isValid: false, error: 'This field is required' };
    }
  }

  // Type-specific validation
  switch (column.type) {
    case 'number':
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
      }
      break;

    case 'select':
      if (value && column.options && column.options.length > 0) {
        if (!column.options.includes(String(value))) {
          return { isValid: false, error: 'Must select a valid option' };
        }
      }
      break;

    case 'multi_select':
      if (Array.isArray(value) && column.options && column.options.length > 0) {
        const invalidOptions = value.filter(v => !column.options!.includes(String(v)));
        if (invalidOptions.length > 0) {
          return { isValid: false, error: `Invalid options: ${invalidOptions.join(', ')}` };
        }
      }
      break;

    case 'date':
      if (value && typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Must be a valid date' };
        }
      }
      break;
  }

  return { isValid: true };
};

// ============================================================================
// CELL VALUE COMPARISON
// ============================================================================

/**
 * Compare two cell values for equality
 */
export const compareCellValues = (a: CellValue, b: CellValue): boolean => {
  if (a === b) return true;
  
  if (a === null || a === undefined) {
    return b === null || b === undefined;
  }
  
  if (b === null || b === undefined) {
    return false;
  }

  // Array comparison for multi_select
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  return String(a) === String(b);
};

/**
 * Sort cell values
 */
export const sortCellValues = (
  a: CellValue, 
  b: CellValue, 
  column: TableColumn, 
  direction: 'asc' | 'desc' = 'asc'
): number => {
  // Handle null/undefined values
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0;
    return direction === 'asc' ? 1 : -1;
  }
  
  if (b === null || b === undefined) {
    return direction === 'asc' ? -1 : 1;
  }

  let comparison = 0;

  switch (column.type) {
    case 'number':
      const numA = typeof a === 'number' ? a : parseFloat(String(a));
      const numB = typeof b === 'number' ? b : parseFloat(String(b));
      comparison = numA - numB;
      break;

    case 'date':
      const dateA = new Date(String(a));
      const dateB = new Date(String(b));
      comparison = dateA.getTime() - dateB.getTime();
      break;

    case 'boolean':
      const boolA = Boolean(a);
      const boolB = Boolean(b);
      comparison = boolA === boolB ? 0 : boolA ? 1 : -1;
      break;

    case 'multi_select':
      const arrayA = Array.isArray(a) ? a : [a];
      const arrayB = Array.isArray(b) ? b : [b];
      comparison = arrayA.length - arrayB.length;
      if (comparison === 0) {
        comparison = arrayA.join(',').localeCompare(arrayB.join(','));
      }
      break;

    default:
      comparison = String(a).localeCompare(String(b));
      break;
  }

  return direction === 'desc' ? -comparison : comparison;
};

// ============================================================================
// CELL UTILITIES
// ============================================================================

/**
 * Check if cell value is empty
 */
export const isCellEmpty = (value: CellValue): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
};

/**
 * Convert cell value to export format (CSV, etc.)
 */
export const formatCellValueForExport = (value: CellValue, column: TableColumn): string => {
  if (isCellEmpty(value)) return '';

  switch (column.type) {
    case 'multi_select':
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }
      return String(value);

    case 'text':
      // Escape quotes for CSV
      const text = String(value);
      if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;

    default:
      return formatCellValue(value, column);
  }
};
