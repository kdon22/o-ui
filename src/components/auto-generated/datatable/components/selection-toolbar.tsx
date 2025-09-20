/**
 * SelectionToolbar - Floating toolbar for bulk operations
 * 
 * Displays when rows are selected and provides:
 * - Bulk delete action
 * - Clear selection action
 * - Selection count display
 * - Future: Bulk update, export, etc.
 */

import React from 'react';
import { Button } from '@/components/ui';
import { Trash2, X } from 'lucide-react';
import { useTableSelectionContext } from '../providers/table-provider';

export interface SelectionToolbarProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  className = '',
  position = 'bottom-right',
}) => {
  const selection = useTableSelectionContext();
  const toolbarProps = selection.getSelectionToolbarProps();

  if (!toolbarProps.isVisible) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <div
      className={`
        ${positionClasses[position]}
        bg-white border shadow-lg rounded-md px-4 py-2 
        flex items-center gap-3 z-50
        animate-in slide-in-from-bottom-2 duration-200
        ${className}
      `}
    >
      {/* Selection count */}
      <span className="text-sm text-gray-700 font-medium">
        {toolbarProps.selectedCount} selected
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Bulk delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={toolbarProps.onBulkDelete}
          className="h-8"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        {/* Clear selection */}
        <Button
          variant="outline"
          size="sm"
          onClick={toolbarProps.onClearSelection}
          className="h-8"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>

        {/* Future: Additional bulk actions */}
        {toolbarProps.onBulkUpdate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={toolbarProps.onBulkUpdate}
            className="h-8"
          >
            Update
          </Button>
        )}

        {toolbarProps.onBulkExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={toolbarProps.onBulkExport}
            className="h-8"
          >
            Export
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ENHANCED SELECTION TOOLBAR WITH MORE FEATURES
// ============================================================================

export interface EnhancedSelectionToolbarProps extends SelectionToolbarProps {
  // Additional bulk actions
  onBulkEdit?: () => void;
  onBulkDuplicate?: () => void;
  onBulkArchive?: () => void;
  onBulkTag?: () => void;
  
  // Customization
  showDeleteConfirmation?: boolean;
  maxActionsBeforeMenu?: number;
  
  // Loading states
  isLoading?: boolean;
}

export const EnhancedSelectionToolbar: React.FC<EnhancedSelectionToolbarProps> = ({
  className = '',
  position = 'bottom-right',
  onBulkEdit,
  onBulkDuplicate,
  onBulkArchive,
  onBulkTag,
  showDeleteConfirmation = true,
  maxActionsBeforeMenu = 4,
  isLoading = false,
}) => {
  const selection = useTableSelectionContext();
  const toolbarProps = selection.getSelectionToolbarProps();

  if (!toolbarProps.isVisible) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  const handleBulkDelete = async () => {
    if (showDeleteConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${toolbarProps.selectedCount} selected items?`
      );
      if (!confirmed) return;
    }
    
    await toolbarProps.onBulkDelete();
  };

  return (
    <div
      className={`
        ${positionClasses[position]}
        bg-white border shadow-lg rounded-md px-4 py-2 
        flex items-center gap-3 z-50
        animate-in slide-in-from-bottom-2 duration-200
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      {/* Selection count */}
      <span className="text-sm text-gray-700 font-medium">
        {toolbarProps.selectedCount} item{toolbarProps.selectedCount !== 1 ? 's' : ''} selected
      </span>

      {/* Primary actions */}
      <div className="flex items-center gap-2">
        {/* Bulk delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isLoading}
          className="h-8"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        {/* Bulk edit */}
        {onBulkEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkEdit}
            disabled={isLoading}
            className="h-8"
          >
            Edit
          </Button>
        )}

        {/* Bulk duplicate */}
        {onBulkDuplicate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkDuplicate}
            disabled={isLoading}
            className="h-8"
          >
            Duplicate
          </Button>
        )}

        {/* Clear selection */}
        <Button
          variant="outline"
          size="sm"
          onClick={toolbarProps.onClearSelection}
          disabled={isLoading}
          className="h-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// KEYBOARD SHORTCUT INDICATOR
// ============================================================================

export const SelectionKeyboardHints: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const selection = useTableSelectionContext();

  if (!selection.hasSelection) {
    return null;
  }

  return (
    <div className={`text-xs text-gray-500 flex gap-4 ${className}`}>
      <span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘A</kbd> Select all
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd> Clear selection
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">DEL</kbd> Delete selected
      </span>
    </div>
  );
};
