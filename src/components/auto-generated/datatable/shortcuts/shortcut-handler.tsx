/**
 * Shortcut Handler - Convenient hooks and utilities for using shortcuts
 * 
 * Features:
 * - Easy shortcut registration hooks
 * - Component-scoped shortcuts
 * - Shortcut conflict detection
 * - Conditional shortcut enable/disable
 */

"use client";

import { useEffect, useCallback } from 'react';

// Context
import { useShortcuts, ShortcutHandler } from './shortcut-provider';

// Definitions
import { ShortcutDefinition, findShortcut } from './shortcut-definitions';

// ============================================================================
// INDIVIDUAL SHORTCUT HOOK
// ============================================================================

/**
 * Hook to register a single shortcut
 */
export const useShortcut = (
  shortcutName: string,
  handler: ShortcutHandler,
  enabled: boolean = true,
  deps?: React.DependencyList
) => {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  const memoizedHandler = useCallback(handler, deps || []);

  useEffect(() => {
    if (enabled) {
      registerShortcut(shortcutName, memoizedHandler);
      return () => {
        unregisterShortcut(shortcutName);
      };
    }
  }, [shortcutName, memoizedHandler, enabled, registerShortcut, unregisterShortcut]);
};

// ============================================================================
// MULTIPLE SHORTCUTS HOOK
// ============================================================================

/**
 * Hook to register multiple shortcuts at once
 */
export const useShortcuts = (
  shortcuts: Record<string, ShortcutHandler>,
  enabled: boolean = true,
  deps?: React.DependencyList
) => {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  useEffect(() => {
    if (enabled) {
      // Register all shortcuts
      Object.entries(shortcuts).forEach(([name, handler]) => {
        registerShortcut(name, handler);
      });

      return () => {
        // Cleanup all shortcuts
        Object.keys(shortcuts).forEach(name => {
          unregisterShortcut(name);
        });
      };
    }
  }, [shortcuts, enabled, registerShortcut, unregisterShortcut, ...(deps || [])]);
};

// ============================================================================
// NAVIGATION SHORTCUTS HOOK
// ============================================================================

export interface NavigationShortcutHandlers {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveNext?: () => void;
  onMovePrevious?: () => void;
  onMoveFirst?: () => void;
  onMoveLast?: () => void;
  onMoveRowStart?: () => void;
  onMoveRowEnd?: () => void;
}

/**
 * Hook for navigation shortcuts (arrow keys, tab, etc.)
 */
export const useNavigationShortcuts = (
  handlers: NavigationShortcutHandlers,
  enabled: boolean = true
) => {
  const shortcuts: Record<string, ShortcutHandler> = {};

  if (handlers.onMoveUp) {
    shortcuts['move-up'] = () => handlers.onMoveUp?.();
  }
  if (handlers.onMoveDown) {
    shortcuts['move-down'] = () => handlers.onMoveDown?.();
    shortcuts['move-down-enter'] = () => handlers.onMoveDown?.();
  }
  if (handlers.onMoveLeft) {
    shortcuts['move-left'] = () => handlers.onMoveLeft?.();
  }
  if (handlers.onMoveRight) {
    shortcuts['move-right'] = () => handlers.onMoveRight?.();
  }
  if (handlers.onMoveNext) {
    shortcuts['move-next-cell'] = () => handlers.onMoveNext?.();
  }
  if (handlers.onMovePrevious) {
    shortcuts['move-previous-cell'] = () => handlers.onMovePrevious?.();
    shortcuts['move-up-shift-enter'] = () => handlers.onMovePrevious?.();
  }
  if (handlers.onMoveFirst) {
    shortcuts['move-to-first-cell'] = () => handlers.onMoveFirst?.();
    shortcuts['move-to-first-cell-windows'] = () => handlers.onMoveFirst?.();
  }
  if (handlers.onMoveLast) {
    shortcuts['move-to-last-cell'] = () => handlers.onMoveLast?.();
    shortcuts['move-to-last-cell-windows'] = () => handlers.onMoveLast?.();
  }
  if (handlers.onMoveRowStart) {
    shortcuts['move-to-row-start'] = () => handlers.onMoveRowStart?.();
  }
  if (handlers.onMoveRowEnd) {
    shortcuts['move-to-row-end'] = () => handlers.onMoveRowEnd?.();
  }

  useShortcuts(shortcuts, enabled);
};

// ============================================================================
// EDITING SHORTCUTS HOOK
// ============================================================================

export interface EditingShortcutHandlers {
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Hook for editing shortcuts (F2, Enter, Escape, etc.)
 */
export const useEditingShortcuts = (
  handlers: EditingShortcutHandlers,
  enabled: boolean = true
) => {
  const shortcuts: Record<string, ShortcutHandler> = {};

  if (handlers.onEdit) {
    shortcuts['edit-cell'] = () => handlers.onEdit?.();
  }
  if (handlers.onSave) {
    shortcuts['save-cell'] = () => handlers.onSave?.();
  }
  if (handlers.onCancel) {
    shortcuts['cancel-edit'] = () => handlers.onCancel?.();
  }
  if (handlers.onClear) {
    shortcuts['clear-cell'] = () => handlers.onClear?.();
    shortcuts['clear-cell-backspace'] = () => handlers.onClear?.();
  }
  if (handlers.onCopy) {
    shortcuts['copy-cell'] = () => handlers.onCopy?.();
    shortcuts['copy-cell-windows'] = () => handlers.onCopy?.();
  }
  if (handlers.onPaste) {
    shortcuts['paste-cell'] = () => handlers.onPaste?.();
    shortcuts['paste-cell-windows'] = () => handlers.onPaste?.();
  }
  if (handlers.onCut) {
    shortcuts['cut-cell'] = () => handlers.onCut?.();
    shortcuts['cut-cell-windows'] = () => handlers.onCut?.();
  }
  if (handlers.onUndo) {
    shortcuts['undo'] = () => handlers.onUndo?.();
    shortcuts['undo-windows'] = () => handlers.onUndo?.();
  }
  if (handlers.onRedo) {
    shortcuts['redo'] = () => handlers.onRedo?.();
    shortcuts['redo-windows'] = () => handlers.onRedo?.();
  }

  useShortcuts(shortcuts, enabled);
};

// ============================================================================
// TABLE SHORTCUTS HOOK
// ============================================================================

export interface TableShortcutHandlers {
  // Navigation
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onMoveToFirst?: () => void;
  onMoveToLast?: () => void;
  
  // Editing
  onEditCell?: () => void;
  onSaveCell?: () => void;
  onCancelEdit?: () => void;
  
  // Selection
  onSelectAll?: () => void;
  onSelectRow?: () => void;
  onClearSelection?: () => void;
  
  // Column operations
  onAddColumn?: () => void;
  onInsertColumnLeft?: () => void;
  onInsertColumnRight?: () => void;
  onDeleteColumn?: () => void;
  onEditColumn?: () => void;
  onSortAscending?: () => void;
  onSortDescending?: () => void;
  
  // Row operations
  onAddRow?: () => void;
  onInsertRowAbove?: () => void;
  onInsertRowBelow?: () => void;
  onDeleteRow?: () => void;
  onDuplicateRow?: () => void;
  
  // View
  onRefresh?: () => void;
  onToggleFilters?: () => void;
  onFocusSearch?: () => void;
}

/**
 * Hook for comprehensive table shortcuts
 */
export const useTableShortcuts = (
  handlers: TableShortcutHandlers,
  enabled: boolean = true
) => {
  const shortcuts: Record<string, ShortcutHandler> = {};

  // Navigation
  if (handlers.onNavigate) {
    shortcuts['move-up'] = () => handlers.onNavigate?.('up');
    shortcuts['move-down'] = () => handlers.onNavigate?.('down');
    shortcuts['move-down-enter'] = () => handlers.onNavigate?.('down');
    shortcuts['move-left'] = () => handlers.onNavigate?.('left');
    shortcuts['move-right'] = () => handlers.onNavigate?.('right');
    shortcuts['move-next-cell'] = () => handlers.onNavigate?.('right');
    shortcuts['move-previous-cell'] = () => handlers.onNavigate?.('left');
    shortcuts['move-up-shift-enter'] = () => handlers.onNavigate?.('up');
  }

  if (handlers.onMoveToFirst) {
    shortcuts['move-to-first-cell'] = () => handlers.onMoveToFirst?.();
    shortcuts['move-to-first-cell-windows'] = () => handlers.onMoveToFirst?.();
  }

  if (handlers.onMoveToLast) {
    shortcuts['move-to-last-cell'] = () => handlers.onMoveToLast?.();
    shortcuts['move-to-last-cell-windows'] = () => handlers.onMoveToLast?.();
  }

  // Editing
  if (handlers.onEditCell) {
    shortcuts['edit-cell'] = () => handlers.onEditCell?.();
  }
  if (handlers.onSaveCell) {
    shortcuts['save-cell'] = () => handlers.onSaveCell?.();
  }
  if (handlers.onCancelEdit) {
    shortcuts['cancel-edit'] = () => handlers.onCancelEdit?.();
  }

  // Selection
  if (handlers.onSelectAll) {
    shortcuts['select-all'] = () => handlers.onSelectAll?.();
    shortcuts['select-all-windows'] = () => handlers.onSelectAll?.();
  }
  if (handlers.onSelectRow) {
    shortcuts['select-row'] = () => handlers.onSelectRow?.();
  }
  if (handlers.onClearSelection) {
    shortcuts['clear-selection'] = () => handlers.onClearSelection?.();
  }

  // Column operations
  if (handlers.onAddColumn) {
    shortcuts['add-column'] = () => handlers.onAddColumn?.();
    shortcuts['add-column-windows'] = () => handlers.onAddColumn?.();
  }
  if (handlers.onInsertColumnLeft) {
    shortcuts['insert-column-left'] = () => handlers.onInsertColumnLeft?.();
    shortcuts['insert-column-left-windows'] = () => handlers.onInsertColumnLeft?.();
  }
  if (handlers.onInsertColumnRight) {
    shortcuts['insert-column-right'] = () => handlers.onInsertColumnRight?.();
    shortcuts['insert-column-right-windows'] = () => handlers.onInsertColumnRight?.();
  }
  if (handlers.onDeleteColumn) {
    shortcuts['delete-column'] = () => handlers.onDeleteColumn?.();
    shortcuts['delete-column-windows'] = () => handlers.onDeleteColumn?.();
  }
  if (handlers.onEditColumn) {
    shortcuts['edit-column'] = () => handlers.onEditColumn?.();
    shortcuts['edit-column-windows'] = () => handlers.onEditColumn?.();
  }
  if (handlers.onSortAscending) {
    shortcuts['sort-ascending'] = () => handlers.onSortAscending?.();
    shortcuts['sort-ascending-windows'] = () => handlers.onSortAscending?.();
  }
  if (handlers.onSortDescending) {
    shortcuts['sort-descending'] = () => handlers.onSortDescending?.();
    shortcuts['sort-descending-windows'] = () => handlers.onSortDescending?.();
  }

  // Row operations
  if (handlers.onAddRow) {
    shortcuts['add-row'] = () => handlers.onAddRow?.();
    shortcuts['add-row-windows'] = () => handlers.onAddRow?.();
  }
  if (handlers.onInsertRowAbove) {
    shortcuts['insert-row-above'] = () => handlers.onInsertRowAbove?.();
    shortcuts['insert-row-above-windows'] = () => handlers.onInsertRowAbove?.();
  }
  if (handlers.onInsertRowBelow) {
    shortcuts['insert-row-below'] = () => handlers.onInsertRowBelow?.();
    shortcuts['insert-row-below-windows'] = () => handlers.onInsertRowBelow?.();
  }
  if (handlers.onDeleteRow) {
    shortcuts['delete-row'] = () => handlers.onDeleteRow?.();
    shortcuts['delete-row-windows'] = () => handlers.onDeleteRow?.();
  }
  if (handlers.onDuplicateRow) {
    shortcuts['duplicate-row'] = () => handlers.onDuplicateRow?.();
    shortcuts['duplicate-row-windows'] = () => handlers.onDuplicateRow?.();
  }

  // View
  if (handlers.onRefresh) {
    shortcuts['refresh-table'] = () => handlers.onRefresh?.();
    shortcuts['refresh-table-windows'] = () => handlers.onRefresh?.();
  }
  if (handlers.onToggleFilters) {
    shortcuts['toggle-filters'] = () => handlers.onToggleFilters?.();
    shortcuts['toggle-filters-windows'] = () => handlers.onToggleFilters?.();
  }
  if (handlers.onFocusSearch) {
    shortcuts['focus-search'] = () => handlers.onFocusSearch?.();
    shortcuts['focus-search-windows'] = () => handlers.onFocusSearch?.();
  }

  useShortcuts(shortcuts, enabled);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get shortcut definition by name
 */
export const useShortcutDefinition = (name: string): ShortcutDefinition | undefined => {
  return findShortcut(name);
};

/**
 * Check if shortcuts are enabled
 */
export const useShortcutsEnabled = (): boolean => {
  const { isEnabled } = useShortcuts();
  return isEnabled;
};

// ============================================================================
// SHORTCUT HANDLER COMPONENT
// ============================================================================

interface ShortcutHandlerProps {
  shortcuts: Record<string, ShortcutHandler>;
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Component that registers shortcuts for its children
 */
export const ShortcutHandler: React.FC<ShortcutHandlerProps> = ({
  shortcuts,
  enabled = true,
  children
}) => {
  useShortcuts(shortcuts, enabled);
  return <>{children}</>;
};
