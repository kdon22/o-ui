/**
 * Shortcut Definitions - Define all keyboard shortcuts for datatable
 * 
 * Professional keyboard shortcuts similar to Excel/Airtable/Google Sheets
 * Organized by category with descriptions and platform variants
 */

import { KeyboardShortcut } from '../utils/keyboard-utils';

// ============================================================================
// SHORTCUT CATEGORIES
// ============================================================================

export interface ShortcutDefinition extends KeyboardShortcut {
  name: string;
  description: string;
  category: ShortcutCategory;
  platforms?: ('mac' | 'windows' | 'linux')[];
}

export type ShortcutCategory = 
  | 'navigation' 
  | 'editing' 
  | 'selection' 
  | 'column' 
  | 'row' 
  | 'data' 
  | 'view';

// ============================================================================
// NAVIGATION SHORTCUTS
// ============================================================================

export const NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'move-up',
    key: 'ArrowUp',
    description: 'Move to cell above',
    category: 'navigation'
  },
  {
    name: 'move-down',
    key: 'ArrowDown',
    description: 'Move to cell below',
    category: 'navigation'
  },
  {
    name: 'move-left',
    key: 'ArrowLeft',
    description: 'Move to cell on left',
    category: 'navigation'
  },
  {
    name: 'move-right',
    key: 'ArrowRight',
    description: 'Move to cell on right',
    category: 'navigation'
  },
  {
    name: 'move-next-cell',
    key: 'Tab',
    description: 'Move to next cell',
    category: 'navigation'
  },
  {
    name: 'move-previous-cell',
    key: 'Tab',
    shiftKey: true,
    description: 'Move to previous cell',
    category: 'navigation'
  },
  {
    name: 'move-down-enter',
    key: 'Enter',
    description: 'Move to cell below (save current)',
    category: 'navigation'
  },
  {
    name: 'move-up-shift-enter',
    key: 'Enter',
    shiftKey: true,
    description: 'Move to cell above (save current)',
    category: 'navigation'
  },
  {
    name: 'move-to-first-cell',
    key: 'Home',
    metaKey: true,
    description: 'Move to first cell in table',
    category: 'navigation',
    platforms: ['mac']
  },
  {
    name: 'move-to-first-cell-windows',
    key: 'Home',
    ctrlKey: true,
    description: 'Move to first cell in table',
    category: 'navigation',
    platforms: ['windows', 'linux']
  },
  {
    name: 'move-to-last-cell',
    key: 'End',
    metaKey: true,
    description: 'Move to last cell in table',
    category: 'navigation',
    platforms: ['mac']
  },
  {
    name: 'move-to-last-cell-windows',
    key: 'End',
    ctrlKey: true,
    description: 'Move to last cell in table',
    category: 'navigation',
    platforms: ['windows', 'linux']
  },
  {
    name: 'move-to-row-start',
    key: 'Home',
    description: 'Move to first cell in row',
    category: 'navigation'
  },
  {
    name: 'move-to-row-end',
    key: 'End',
    description: 'Move to last cell in row',
    category: 'navigation'
  }
];

// ============================================================================
// EDITING SHORTCUTS
// ============================================================================

export const EDITING_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'edit-cell',
    key: 'F2',
    description: 'Edit current cell',
    category: 'editing'
  },
  {
    name: 'save-cell',
    key: 'Enter',
    description: 'Save current cell edit',
    category: 'editing'
  },
  {
    name: 'cancel-edit',
    key: 'Escape',
    description: 'Cancel current cell edit',
    category: 'editing'
  },
  {
    name: 'clear-cell',
    key: 'Delete',
    description: 'Clear cell content',
    category: 'editing'
  },
  {
    name: 'clear-cell-backspace',
    key: 'Backspace',
    description: 'Clear cell content',
    category: 'editing'
  },
  {
    name: 'copy-cell',
    key: 'c',
    metaKey: true,
    description: 'Copy cell content',
    category: 'editing',
    platforms: ['mac']
  },
  {
    name: 'copy-cell-windows',
    key: 'c',
    ctrlKey: true,
    description: 'Copy cell content',
    category: 'editing',
    platforms: ['windows', 'linux']
  },
  {
    name: 'paste-cell',
    key: 'v',
    metaKey: true,
    description: 'Paste into cell',
    category: 'editing',
    platforms: ['mac']
  },
  {
    name: 'paste-cell-windows',
    key: 'v',
    ctrlKey: true,
    description: 'Paste into cell',
    category: 'editing',
    platforms: ['windows', 'linux']
  },
  {
    name: 'cut-cell',
    key: 'x',
    metaKey: true,
    description: 'Cut cell content',
    category: 'editing',
    platforms: ['mac']
  },
  {
    name: 'cut-cell-windows',
    key: 'x',
    ctrlKey: true,
    description: 'Cut cell content',
    category: 'editing',
    platforms: ['windows', 'linux']
  },
  {
    name: 'undo',
    key: 'z',
    metaKey: true,
    description: 'Undo last action',
    category: 'editing',
    platforms: ['mac']
  },
  {
    name: 'undo-windows',
    key: 'z',
    ctrlKey: true,
    description: 'Undo last action',
    category: 'editing',
    platforms: ['windows', 'linux']
  },
  {
    name: 'redo',
    key: 'z',
    metaKey: true,
    shiftKey: true,
    description: 'Redo last action',
    category: 'editing',
    platforms: ['mac']
  },
  {
    name: 'redo-windows',
    key: 'y',
    ctrlKey: true,
    description: 'Redo last action',
    category: 'editing',
    platforms: ['windows', 'linux']
  }
];

// ============================================================================
// SELECTION SHORTCUTS
// ============================================================================

export const SELECTION_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'select-all',
    key: 'a',
    metaKey: true,
    description: 'Select all rows',
    category: 'selection',
    platforms: ['mac']
  },
  {
    name: 'select-all-windows',
    key: 'a',
    ctrlKey: true,
    description: 'Select all rows',
    category: 'selection',
    platforms: ['windows', 'linux']
  },
  {
    name: 'select-row',
    key: ' ',
    shiftKey: true,
    description: 'Toggle row selection',
    category: 'selection'
  },
  {
    name: 'extend-selection-up',
    key: 'ArrowUp',
    shiftKey: true,
    description: 'Extend selection upward',
    category: 'selection'
  },
  {
    name: 'extend-selection-down',
    key: 'ArrowDown',
    shiftKey: true,
    description: 'Extend selection downward',
    category: 'selection'
  },
  {
    name: 'extend-selection-left',
    key: 'ArrowLeft',
    shiftKey: true,
    description: 'Extend selection left',
    category: 'selection'
  },
  {
    name: 'extend-selection-right',
    key: 'ArrowRight',
    shiftKey: true,
    description: 'Extend selection right',
    category: 'selection'
  },
  {
    name: 'clear-selection',
    key: 'Escape',
    description: 'Clear all selections',
    category: 'selection'
  }
];

// ============================================================================
// COLUMN SHORTCUTS
// ============================================================================

export const COLUMN_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'add-column',
    key: '+',
    metaKey: true,
    shiftKey: true,
    description: 'Add new column',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'add-column-windows',
    key: '+',
    ctrlKey: true,
    shiftKey: true,
    description: 'Add new column',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'insert-column-left',
    key: 'l',
    metaKey: true,
    shiftKey: true,
    description: 'Insert column to the left',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'insert-column-left-windows',
    key: 'l',
    ctrlKey: true,
    shiftKey: true,
    description: 'Insert column to the left',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'insert-column-right',
    key: 'r',
    metaKey: true,
    shiftKey: true,
    description: 'Insert column to the right',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'insert-column-right-windows',
    key: 'r',
    ctrlKey: true,
    shiftKey: true,
    description: 'Insert column to the right',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'delete-column',
    key: 'd',
    metaKey: true,
    shiftKey: true,
    description: 'Delete current column',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'delete-column-windows',
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    description: 'Delete current column',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'edit-column',
    key: 'e',
    metaKey: true,
    shiftKey: true,
    description: 'Edit column properties',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'edit-column-windows',
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    description: 'Edit column properties',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'sort-ascending',
    key: 's',
    metaKey: true,
    description: 'Sort column ascending',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'sort-ascending-windows',
    key: 's',
    ctrlKey: true,
    description: 'Sort column ascending',
    category: 'column',
    platforms: ['windows', 'linux']
  },
  {
    name: 'sort-descending',
    key: 's',
    metaKey: true,
    shiftKey: true,
    description: 'Sort column descending',
    category: 'column',
    platforms: ['mac']
  },
  {
    name: 'sort-descending-windows',
    key: 's',
    ctrlKey: true,
    shiftKey: true,
    description: 'Sort column descending',
    category: 'column',
    platforms: ['windows', 'linux']
  }
];

// ============================================================================
// ROW SHORTCUTS
// ============================================================================

export const ROW_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'add-row',
    key: 'n',
    metaKey: true,
    description: 'Add new row',
    category: 'row',
    platforms: ['mac']
  },
  {
    name: 'add-row-windows',
    key: 'n',
    ctrlKey: true,
    description: 'Add new row',
    category: 'row',
    platforms: ['windows', 'linux']
  },
  {
    name: 'insert-row-above',
    key: 'ArrowUp',
    metaKey: true,
    shiftKey: true,
    description: 'Insert row above',
    category: 'row',
    platforms: ['mac']
  },
  {
    name: 'insert-row-above-windows',
    key: 'ArrowUp',
    ctrlKey: true,
    shiftKey: true,
    description: 'Insert row above',
    category: 'row',
    platforms: ['windows', 'linux']
  },
  {
    name: 'insert-row-below',
    key: 'ArrowDown',
    metaKey: true,
    shiftKey: true,
    description: 'Insert row below',
    category: 'row',
    platforms: ['mac']
  },
  {
    name: 'insert-row-below-windows',
    key: 'ArrowDown',
    ctrlKey: true,
    shiftKey: true,
    description: 'Insert row below',
    category: 'row',
    platforms: ['windows', 'linux']
  },
  {
    name: 'delete-row',
    key: 'Backspace',
    metaKey: true,
    description: 'Delete selected rows',
    category: 'row',
    platforms: ['mac']
  },
  {
    name: 'delete-row-windows',
    key: 'Delete',
    ctrlKey: true,
    description: 'Delete selected rows',
    category: 'row',
    platforms: ['windows', 'linux']
  },
  {
    name: 'duplicate-row',
    key: 'd',
    metaKey: true,
    description: 'Duplicate current row',
    category: 'row',
    platforms: ['mac']
  },
  {
    name: 'duplicate-row-windows',
    key: 'd',
    ctrlKey: true,
    description: 'Duplicate current row',
    category: 'row',
    platforms: ['windows', 'linux']
  }
];

// ============================================================================
// VIEW SHORTCUTS
// ============================================================================

export const VIEW_SHORTCUTS: ShortcutDefinition[] = [
  {
    name: 'refresh-table',
    key: 'r',
    metaKey: true,
    description: 'Refresh table data',
    category: 'view',
    platforms: ['mac']
  },
  {
    name: 'refresh-table-windows',
    key: 'F5',
    description: 'Refresh table data',
    category: 'view',
    platforms: ['windows', 'linux']
  },
  {
    name: 'toggle-filters',
    key: 'f',
    metaKey: true,
    shiftKey: true,
    description: 'Toggle column filters',
    category: 'view',
    platforms: ['mac']
  },
  {
    name: 'toggle-filters-windows',
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    description: 'Toggle column filters',
    category: 'view',
    platforms: ['windows', 'linux']
  },
  {
    name: 'focus-search',
    key: 'f',
    metaKey: true,
    description: 'Focus search box',
    category: 'view',
    platforms: ['mac']
  },
  {
    name: 'focus-search-windows',
    key: 'f',
    ctrlKey: true,
    description: 'Focus search box',
    category: 'view',
    platforms: ['windows', 'linux']
  }
];

// ============================================================================
// COMBINED SHORTCUTS
// ============================================================================

export const ALL_SHORTCUTS: ShortcutDefinition[] = [
  ...NAVIGATION_SHORTCUTS,
  ...EDITING_SHORTCUTS,
  ...SELECTION_SHORTCUTS,
  ...COLUMN_SHORTCUTS,
  ...ROW_SHORTCUTS,
  ...VIEW_SHORTCUTS
];

// ============================================================================
// SHORTCUT UTILITIES
// ============================================================================

/**
 * Get shortcuts by category
 */
export const getShortcutsByCategory = (category: ShortcutCategory): ShortcutDefinition[] => {
  return ALL_SHORTCUTS.filter(shortcut => shortcut.category === category);
};

/**
 * Get platform-specific shortcuts
 */
export const getShortcutsForPlatform = (platform: 'mac' | 'windows' | 'linux'): ShortcutDefinition[] => {
  return ALL_SHORTCUTS.filter(shortcut => 
    !shortcut.platforms || shortcut.platforms.includes(platform)
  );
};

/**
 * Find shortcut by name
 */
export const findShortcut = (name: string): ShortcutDefinition | undefined => {
  return ALL_SHORTCUTS.find(shortcut => shortcut.name === name);
};

/**
 * Get display string for shortcut
 */
export const getShortcutDisplayString = (shortcut: ShortcutDefinition): string => {
  const parts: string[] = [];
  
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('⇧');
  if (shortcut.altKey) parts.push('⌥');
  
  // Format key name for display
  let keyDisplay = shortcut.key;
  if (keyDisplay.startsWith('Arrow')) {
    keyDisplay = keyDisplay.replace('Arrow', '') + ' Arrow';
  }
  
  parts.push(keyDisplay);
  
  return parts.join(' + ');
};

/**
 * Get current platform
 */
export const getCurrentPlatform = (): 'mac' | 'windows' | 'linux' => {
  if (typeof window !== 'undefined') {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    return 'linux';
  }
  return 'mac'; // Default fallback
};
