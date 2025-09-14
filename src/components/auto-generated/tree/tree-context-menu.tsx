/**
 * TreeContextMenu Component - Right-click context menu for tree nodes
 * 
 * Features:
 * - Add Node, Add Process, Add Office actions
 * - Delete Node action
 * - Clean separation line between add and delete actions
 * - Proper positioning and click-outside-to-close behavior
 * - Keyboard navigation support
 */

"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { TreeNodeData } from './auto-tree';
import { Plus, Trash2, FileText, Settings, Building, RefreshCw, Eye, EyeOff } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface TreeContextMenuProps {
  node: TreeNodeData;
  position: { x: number; y: number };
  visible: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
  // Settings state for checkmarks
  showInheritedSettings?: boolean;
  showIgnoredSettings?: boolean;
}

interface MenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  isDangerous?: boolean;
  separator?: boolean;
  isChecked?: boolean;
}

// ============================================================================
// MENU ACTIONS CONFIGURATION
// ============================================================================

const getMenuActions = (showInheritedSettings?: boolean, showIgnoredSettings?: boolean): MenuAction[] => [
  {
    id: 'add-node',
    label: 'Add Node',
    icon: <Plus className="w-4 h-4" />,
  },
  {
    id: 'add-process',
    label: 'Add Process',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'refresh-tree',
    label: 'Refresh Tree',
    icon: <RefreshCw className="w-4 h-4" />,
    separator: true,
  },
  {
    id: 'show-inherited-settings',
    label: 'Show Inherited Settings',
    icon: showInheritedSettings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
    isChecked: showInheritedSettings,
  },
  {
    id: 'show-ignored-settings',
    label: 'Show Ignored Settings',
    icon: showIgnoredSettings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
    isChecked: showIgnoredSettings,
  },
  {
    id: 'delete',
    label: 'Delete Node',
    icon: <Trash2 className="w-4 h-4" />,
    isDangerous: true,
    separator: true,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  node,
  position,
  visible,
  onAction,
  onClose,
  showInheritedSettings = false,
  showIgnoredSettings = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  
  const MENU_ACTIONS = getMenuActions(showInheritedSettings, showIgnoredSettings);

  // ============================================================================
  // POSITIONING AND VIEWPORT ADJUSTMENT
  // ============================================================================
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return position;
    
    const menu = menuRef.current;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    
    const menuRect = menu.getBoundingClientRect();
    let { x, y } = position;
    
    // Adjust horizontal position if menu would go off-screen
    if (x + menuRect.width > viewport.width) {
      x = viewport.width - menuRect.width - 8;
    }
    
    // Adjust vertical position if menu would go off-screen
    if (y + menuRect.height > viewport.height) {
      y = viewport.height - menuRect.height - 8;
    }
    
    // Ensure menu doesn't go off the left or top edge
    x = Math.max(8, x);
    y = Math.max(8, y);
    
    return { x, y };
  }, [position]);

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % MENU_ACTIONS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + MENU_ACTIONS.length) % MENU_ACTIONS.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < MENU_ACTIONS.length) {
          onAction(MENU_ACTIONS[focusedIndex].id);
        }
        break;
    }
  }, [visible, focusedIndex, onAction, onClose]);

  // ============================================================================
  // CLICK OUTSIDE TO CLOSE
  // ============================================================================
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [visible, handleKeyDown, handleClickOutside]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleActionClick = (actionId: string) => {
    console.log('🔥 [TreeContextMenu] handleActionClick called', {
      actionId,
      node,
      nodeId: node.id,
      nodeName: node.name,
      timestamp: new Date().toISOString()
    });
    onAction(actionId);
  };

  const handleMouseEnter = (index: number) => {
    setFocusedIndex(index);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!visible) return null;

  const adjustedPosition = getAdjustedPosition();

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[160px] max-w-[200px]"
      style={{ 
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      role="menu"
      aria-labelledby="tree-context-menu"
    >
      {MENU_ACTIONS.map((action, index) => (
        <React.Fragment key={action.id}>
          {action.separator && (
            <div className="border-t border-gray-200 my-1" />
          )}
          
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
              "hover:bg-gray-50 active:bg-gray-100",
              action.isDangerous 
                ? "text-red-600 hover:bg-red-50 hover:text-red-700" 
                : "text-gray-700 hover:text-gray-900",
              focusedIndex === index && "bg-gray-50"
            )}
            onClick={() => handleActionClick(action.id)}
            onMouseEnter={() => handleMouseEnter(index)}
            role="menuitem"
            type="button"
          >
            <span className="flex-shrink-0">
              {action.icon}
            </span>
            <span className="flex-1 truncate">
              {action.label}
            </span>
            {action.isChecked !== undefined && (
              <span className="flex-shrink-0 ml-2">
                {action.isChecked ? (
                  <span className="text-blue-600">✓</span>
                ) : (
                  <span className="text-gray-300">✓</span>
                )}
              </span>
            )}
          </button>
        </React.Fragment>
      ))}
      
      {/* Optional: Show node info at bottom */}
      <div className="border-t border-gray-200 mt-1 px-3 py-2">
        <div className="text-xs text-gray-500 truncate">
          {node.name}
        </div>
      </div>
    </div>
  );
}; 