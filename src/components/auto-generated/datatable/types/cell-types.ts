/**
 * Cell Types - Cell editing and input types
 * Defines types for cell editors and input components
 */

import { TableColumn, ColumnFieldType } from './column-types';

// ============================================================================
// CELL EDITING STATE
// ============================================================================

export interface CellEditingState {
  isEditing: boolean;
  originalValue: any;
  currentValue: any;
  isValid: boolean;
  error?: string;
}

// ============================================================================
// CELL EDITOR PROPS
// ============================================================================

export interface BaseCellEditorProps {
  value: any;
  column: TableColumn;
  onChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isValid?: boolean;
  error?: string;
  autoFocus?: boolean;
  className?: string;
}

export interface TextCellEditorProps extends BaseCellEditorProps {
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

export interface NumberCellEditorProps extends BaseCellEditorProps {
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
}

export interface SelectCellEditorProps extends BaseCellEditorProps {
  options: string[];
  allowCustomValues?: boolean;
  searchable?: boolean;
}

export interface MultiSelectCellEditorProps extends BaseCellEditorProps {
  options: string[];
  maxSelections?: number;
  allowCustomValues?: boolean;
}

export interface DateCellEditorProps extends BaseCellEditorProps {
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  format?: string;
}

export interface BooleanCellEditorProps extends BaseCellEditorProps {
  trueLabel?: string;
  falseLabel?: string;
  variant?: 'checkbox' | 'toggle' | 'radio';
}

// ============================================================================
// CELL VALUE TYPES
// ============================================================================

export type TextValue = string;
export type NumberValue = number | null;
export type SelectValue = string | null;
export type MultiSelectValue = string[];
export type DateValue = string | Date | null; // ISO string or Date object
export type BooleanValue = boolean;

export type CellValue = 
  | TextValue 
  | NumberValue 
  | SelectValue 
  | MultiSelectValue 
  | DateValue 
  | BooleanValue 
  | null 
  | undefined;

// ============================================================================
// CELL VALIDATION
// ============================================================================

export interface CellValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface CellValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// CELL FORMATTING
// ============================================================================

export interface NumberFormat {
  decimalPlaces?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
  showNegativeInParentheses?: boolean;
}

export interface DateFormat {
  format: string; // e.g., 'MM/DD/YYYY', 'DD/MM/YYYY', etc.
  includeTime?: boolean;
  timezone?: string;
}

export interface TextFormat {
  case?: 'upper' | 'lower' | 'title';
  trim?: boolean;
}

export type CellFormat = NumberFormat | DateFormat | TextFormat;

// ============================================================================
// CELL EDITOR REGISTRY
// ============================================================================

export interface CellEditorConfig {
  type: ColumnFieldType;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  validator?: (value: any, column: TableColumn) => CellValidationResult;
  formatter?: (value: any, format?: string) => string;
  parser?: (value: string, column: TableColumn) => any;
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface KeyboardNavigationState {
  currentCell: CellPosition | null;
  isEditing: boolean;
  selectedRange: {
    start: CellPosition;
    end: CellPosition;
  } | null;
}

export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab' | 'enter' | 'shift-enter';

// ============================================================================
// CELL INTERACTION EVENTS
// ============================================================================

export interface CellClickEvent {
  rowId: string;
  columnName: string;
  position: CellPosition;
  originalEvent: React.MouseEvent;
}

export interface CellKeyDownEvent {
  rowId: string;
  columnName: string;
  position: CellPosition;
  key: string;
  originalEvent: React.KeyboardEvent;
}

export interface CellDoubleClickEvent extends CellClickEvent {
  // For double-click to edit functionality
}

// ============================================================================
// CELL EDITOR FACTORY TYPES
// ============================================================================

export type CellEditorFactory = (column: TableColumn) => React.ComponentType<BaseCellEditorProps>;

export interface CellEditorRegistry {
  [key: string]: CellEditorFactory;
}

// ============================================================================
// UTILITY FUNCTIONS TYPES
// ============================================================================

export type CellValueValidator = (value: any, column: TableColumn) => CellValidationResult;
export type CellValueFormatter = (value: any, column: TableColumn) => string;
export type CellValueParser = (input: string, column: TableColumn) => any;
