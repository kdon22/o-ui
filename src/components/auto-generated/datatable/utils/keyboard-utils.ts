/**
 * Keyboard Utils - Helper functions for keyboard navigation and shortcuts
 * 
 * Functions for:
 * - Keyboard event handling
 * - Navigation between cells
 * - Keyboard shortcuts detection
 * - Focus management
 */

import { CellPosition, NavigationDirection } from '../types';

// ============================================================================
// KEYBOARD EVENT DETECTION
// ============================================================================

/**
 * Check if event is a navigation key
 */
export const isNavigationKey = (event: React.KeyboardEvent): boolean => {
  const navKeys = ['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  return navKeys.includes(event.key);
};

/**
 * Check if event is an editing key (should start cell edit mode)
 */
export const isEditingKey = (event: React.KeyboardEvent): boolean => {
  // F2 is the standard edit key
  if (event.key === 'F2') return true;
  
  // Printable characters should start editing
  return (
    event.key.length === 1 && 
    !event.metaKey && 
    !event.ctrlKey && 
    !event.altKey
  );
};

/**
 * Check if event should save current edit
 */
export const isSaveKey = (event: React.KeyboardEvent): boolean => {
  return event.key === 'Enter' || event.key === 'Tab';
};

/**
 * Check if event should cancel current edit
 */
export const isCancelKey = (event: React.KeyboardEvent): boolean => {
  return event.key === 'Escape';
};

/**
 * Get navigation direction from keyboard event
 */
export const getNavigationDirection = (event: React.KeyboardEvent): NavigationDirection | null => {
  if (event.key === 'Tab' && event.shiftKey) return 'shift-tab';
  if (event.key === 'Tab') return 'tab';
  if (event.key === 'Enter' && event.shiftKey) return 'shift-enter';
  if (event.key === 'Enter') return 'enter';
  if (event.key === 'ArrowUp') return 'up';
  if (event.key === 'ArrowDown') return 'down';
  if (event.key === 'ArrowLeft') return 'left';
  if (event.key === 'ArrowRight') return 'right';
  
  return null;
};

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcut detection
 */
export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * Check if keyboard event matches shortcut
 */
export const matchesShortcut = (
  event: React.KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean => {
  return (
    event.key === shortcut.key &&
    !!event.metaKey === !!shortcut.metaKey &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.shiftKey === !!shortcut.shiftKey &&
    !!event.altKey === !!shortcut.altKey
  );
};

/**
 * Common keyboard shortcuts for datatable
 */
export const DATATABLE_SHORTCUTS = {
  // Column operations
  ADD_COLUMN_LEFT: { key: 'l', metaKey: true, shiftKey: true } as KeyboardShortcut,
  ADD_COLUMN_RIGHT: { key: 'r', metaKey: true, shiftKey: true } as KeyboardShortcut,
  DELETE_COLUMN: { key: 'd', metaKey: true, shiftKey: true } as KeyboardShortcut,
  
  // Row operations  
  ADD_ROW: { key: 'n', metaKey: true } as KeyboardShortcut,
  DELETE_ROW: { key: 'Backspace', metaKey: true } as KeyboardShortcut,
  
  // Cell operations
  EDIT_CELL: { key: 'F2' } as KeyboardShortcut,
  COPY_CELL: { key: 'c', metaKey: true } as KeyboardShortcut,
  PASTE_CELL: { key: 'v', metaKey: true } as KeyboardShortcut,
  
  // Selection
  SELECT_ALL: { key: 'a', metaKey: true } as KeyboardShortcut,
  SELECT_ROW: { key: ' ', ctrlKey: true } as KeyboardShortcut,
  
  // Navigation
  MOVE_TO_FIRST_CELL: { key: 'Home', metaKey: true } as KeyboardShortcut,
  MOVE_TO_LAST_CELL: { key: 'End', metaKey: true } as KeyboardShortcut,
  
  // Sorting
  SORT_ASC: { key: 's', metaKey: true } as KeyboardShortcut,
  SORT_DESC: { key: 's', metaKey: true, shiftKey: true } as KeyboardShortcut,
} as const;

/**
 * Get shortcut description for display
 */
export const getShortcutDescription = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('⇧');
  if (shortcut.altKey) parts.push('⌥');
  
  parts.push(shortcut.key);
  
  return parts.join(' + ');
};

// ============================================================================
// CELL NAVIGATION
// ============================================================================

/**
 * Calculate next cell position based on navigation direction
 */
export const getNextCellPosition = (
  currentPosition: CellPosition,
  direction: NavigationDirection,
  totalRows: number,
  totalColumns: number
): CellPosition | null => {
  const { rowIndex, columnIndex } = currentPosition;
  
  switch (direction) {
    case 'up':
      if (rowIndex > 0) {
        return { rowIndex: rowIndex - 1, columnIndex };
      }
      break;
      
    case 'down':
    case 'enter':
      if (rowIndex < totalRows - 1) {
        return { rowIndex: rowIndex + 1, columnIndex };
      }
      break;
      
    case 'left':
    case 'shift-tab':
      if (columnIndex > 0) {
        return { rowIndex, columnIndex: columnIndex - 1 };
      } else if (rowIndex > 0) {
        return { rowIndex: rowIndex - 1, columnIndex: totalColumns - 1 };
      }
      break;
      
    case 'right':
    case 'tab':
      if (columnIndex < totalColumns - 1) {
        return { rowIndex, columnIndex: columnIndex + 1 };
      } else if (rowIndex < totalRows - 1) {
        return { rowIndex: rowIndex + 1, columnIndex: 0 };
      }
      break;
      
    case 'shift-enter':
      if (rowIndex > 0) {
        return { rowIndex: rowIndex - 1, columnIndex };
      }
      break;
  }
  
  return null;
};

/**
 * Get cell ID for focus management
 */
export const getCellId = (rowId: string, columnName: string): string => {
  return `cell-${rowId}-${columnName}`;
};

/**
 * Get cell element by position
 */
export const getCellElement = (
  rowId: string, 
  columnName: string
): HTMLElement | null => {
  const cellId = getCellId(rowId, columnName);
  return document.getElementById(cellId);
};

/**
 * Focus cell by position
 */
export const focusCell = (rowId: string, columnName: string): boolean => {
  const cellElement = getCellElement(rowId, columnName);
  
  if (cellElement) {
    cellElement.focus();
    return true;
  }
  
  return false;
};

/**
 * Focus input within cell
 */
export const focusInputInCell = (
  rowId: string, 
  columnName: string
): boolean => {
  const cellElement = getCellElement(rowId, columnName);
  
  if (cellElement) {
    const input = cellElement.querySelector('input, select, textarea') as HTMLElement;
    if (input) {
      input.focus();
      
      // Select text in input for easy editing
      if (input instanceof HTMLInputElement && input.type === 'text') {
        input.select();
      }
      
      return true;
    }
  }
  
  return false;
};

// ============================================================================
// KEYBOARD EVENT UTILITIES
// ============================================================================

/**
 * Prevent default behavior for navigation keys
 */
export const preventDefaultNavigation = (event: React.KeyboardEvent): void => {
  if (isNavigationKey(event)) {
    event.preventDefault();
  }
};

/**
 * Stop event propagation to prevent parent handlers
 */
export const stopEventPropagation = (event: React.KeyboardEvent): void => {
  event.stopPropagation();
};

/**
 * Handle common keyboard patterns
 */
export const handleCommonKeyboardPatterns = (
  event: React.KeyboardEvent,
  callbacks: {
    onNavigate?: (direction: NavigationDirection) => void;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onShortcut?: (shortcut: keyof typeof DATATABLE_SHORTCUTS) => void;
  }
): boolean => {
  // Check for navigation
  const direction = getNavigationDirection(event);
  if (direction && callbacks.onNavigate) {
    event.preventDefault();
    callbacks.onNavigate(direction);
    return true;
  }
  
  // Check for editing
  if (isEditingKey(event) && callbacks.onEdit) {
    callbacks.onEdit();
    return true;
  }
  
  // Check for save
  if (isSaveKey(event) && callbacks.onSave) {
    event.preventDefault();
    callbacks.onSave();
    return true;
  }
  
  // Check for cancel
  if (isCancelKey(event) && callbacks.onCancel) {
    event.preventDefault();
    callbacks.onCancel();
    return true;
  }
  
  // Check for shortcuts
  if (callbacks.onShortcut) {
    for (const [name, shortcut] of Object.entries(DATATABLE_SHORTCUTS)) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        callbacks.onShortcut(name as keyof typeof DATATABLE_SHORTCUTS);
        return true;
      }
    }
  }
  
  return false;
};
