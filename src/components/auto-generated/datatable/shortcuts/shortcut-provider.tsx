/**
 * Shortcut Provider - React context for managing keyboard shortcuts
 * 
 * Features:
 * - Global shortcut registration
 * - Context-aware shortcut handling
 * - Platform-specific shortcuts
 * - Shortcut help/documentation
 * - Enable/disable shortcuts
 */

"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';

// Utils
import { matchesShortcut } from '../utils/keyboard-utils';

// Definitions
import {
  ShortcutDefinition,
  ALL_SHORTCUTS,
  getCurrentPlatform,
  getShortcutsForPlatform
} from './shortcut-definitions';

// ============================================================================
// TYPES
// ============================================================================

export interface ShortcutHandler {
  (shortcut: ShortcutDefinition, event: KeyboardEvent): boolean | void;
}

export interface ShortcutContextValue {
  // Registration
  registerShortcut: (name: string, handler: ShortcutHandler) => void;
  unregisterShortcut: (name: string) => void;
  
  // Control
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  isEnabled: boolean;
  
  // Platform
  platform: 'mac' | 'windows' | 'linux';
  shortcuts: ShortcutDefinition[];
  
  // Help
  showHelp: boolean;
  toggleHelp: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export const useShortcuts = (): ShortcutContextValue => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ShortcutProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const ShortcutProvider: React.FC<ShortcutProviderProps> = ({
  children,
  enabled = true
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isEnabled, setIsEnabled] = useState(enabled);
  const [showHelp, setShowHelp] = useState(false);
  const [platform] = useState(() => getCurrentPlatform());
  
  // Get platform-specific shortcuts
  const [shortcuts] = useState(() => getShortcutsForPlatform(platform));
  
  // Store registered handlers
  const handlersRef = useRef<Map<string, ShortcutHandler>>(new Map());

  // ============================================================================
  // SHORTCUT REGISTRATION
  // ============================================================================

  const registerShortcut = useCallback((name: string, handler: ShortcutHandler) => {
    handlersRef.current.set(name, handler);
  }, []);

  const unregisterShortcut = useCallback((name: string) => {
    handlersRef.current.delete(name);
  }, []);

  // ============================================================================
  // CONTROL FUNCTIONS
  // ============================================================================

  const enableShortcuts = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableShortcuts = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // ============================================================================
  // KEYBOARD EVENT HANDLING
  // ============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled
    if (!isEnabled) return;

    // Don't handle shortcuts in input elements (unless it's a navigation key)
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';

    // Allow certain shortcuts even in input elements
    const allowInInputs = ['Escape', 'F1', 'F2'];
    if (isInputElement && !allowInInputs.includes(event.key)) {
      // Allow navigation shortcuts in table cells
      if (!target.closest('[data-table-cell]')) {
        return;
      }
    }

    // Check each shortcut definition
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        // Get registered handler
        const handler = handlersRef.current.get(shortcut.name);
        
        if (handler) {
          // Call handler - if it returns false, prevent default
          const result = handler(shortcut, event);
          
          if (result !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          
          return;
        }
      }
    }

    // Built-in help shortcut
    if (event.key === 'F1' || (event.key === '?' && event.shiftKey)) {
      event.preventDefault();
      toggleHelp();
      return;
    }
  }, [isEnabled, shortcuts, toggleHelp]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [handleKeyDown, isEnabled]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: ShortcutContextValue = {
    registerShortcut,
    unregisterShortcut,
    enableShortcuts,
    disableShortcuts,
    isEnabled,
    platform,
    shortcuts,
    showHelp,
    toggleHelp
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
      {showHelp && <ShortcutHelpModal />}
    </ShortcutContext.Provider>
  );
};

// ============================================================================
// SHORTCUT HELP MODAL
// ============================================================================

const ShortcutHelpModal: React.FC = () => {
  const { shortcuts, toggleHelp, platform } = useShortcuts();

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutDefinition[]>);

  const getDisplayString = (shortcut: ShortcutDefinition): string => {
    const parts: string[] = [];
    
    if (shortcut.metaKey) parts.push(platform === 'mac' ? '⌘' : 'Ctrl');
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('⇧');
    if (shortcut.altKey) parts.push(platform === 'mac' ? '⌥' : 'Alt');
    
    let keyDisplay = shortcut.key;
    if (keyDisplay.startsWith('Arrow')) {
      const direction = keyDisplay.replace('Arrow', '');
      const arrows = { Left: '←', Right: '→', Up: '↑', Down: '↓' };
      keyDisplay = arrows[direction as keyof typeof arrows] || direction;
    }
    
    parts.push(keyDisplay);
    
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={toggleHelp}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-gray-900 capitalize border-b pb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div key={shortcut.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 flex-1">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800 ml-4">
                        {getDisplayString(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">F1</kbd> or{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
};
