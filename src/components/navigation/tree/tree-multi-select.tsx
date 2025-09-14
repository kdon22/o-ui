/**
 * Tree Multi-Select Component
 * 
 * Provides bulk selection controls and actions for tree nodes:
 * - Selection summary and count
 * - Bulk actions (delete, move, etc.)
 * - Clear selection functionality
 */

'use client';

import React from 'react';
import type { TreeMultiSelectProps, TreeNode, TreeAction } from './tree-types';

// Simple utility function for className merging
function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TREE MULTI-SELECT COMPONENT
// ============================================================================

export function TreeMultiSelect({
  selectedNodes,
  maxSelections = 100,
  showCount,
  showActions,
  actions,
  onSelectionChange,
  onActionClick,
  onClear,
  className
}: TreeMultiSelectProps) {

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectionCount = selectedNodes.length;
  const isMaxReached = maxSelections && selectionCount >= maxSelections;

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSelectedNode = (node: TreeNode) => (
    <div
      key={node.id}
      className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs"
    >
      <span className="truncate max-w-[120px]">{node.name}</span>
      <button
        onClick={() => {
          const newSelection = selectedNodes.filter(n => n.id !== node.id);
          onSelectionChange(newSelection);
        }}
        className="text-blue-600 hover:text-blue-800"
      >
        ✕
      </button>
    </div>
  );

  const renderAction = (action: TreeAction) => (
    <button
      key={action.id}
      onClick={() => onActionClick(action, selectedNodes)}
      disabled={action.disabled || selectionCount === 0}
      className={cn(
        'px-2 py-1 text-xs rounded border transition-colors',
        'hover:bg-gray-50 active:bg-gray-100',
        (action.disabled || selectionCount === 0) && 'opacity-50 cursor-not-allowed'
      )}
      title={action.label}
    >
      {action.label}
    </button>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (selectionCount === 0) {
    return null;
  }

  return (
    <div className={cn('p-2 bg-blue-50 border border-blue-200 rounded', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {showCount && (
            <span className="text-sm font-medium text-blue-800">
              {selectionCount} selected
              {maxSelections && ` of ${maxSelections}`}
            </span>
          )}
          
          {isMaxReached && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Max reached
            </span>
          )}
        </div>

        <button
          onClick={onClear}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Clear all
        </button>
      </div>

      {/* Selected Items Preview */}
      {selectedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedNodes.slice(0, 10).map(node => renderSelectedNode(node))}
          {selectedNodes.length > 10 && (
            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{selectedNodes.length - 10} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && actions.length > 0 && (
        <div className="flex gap-1">
          {actions.map(action => renderAction(action))}
        </div>
      )}
    </div>
  );
} 