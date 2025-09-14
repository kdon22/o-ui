/**
 * Tree Renderer Component
 * 
 * Handles the actual rendering of tree nodes with:
 * - Virtualization for performance
 * - Expand/collapse animations
 * - Node selection states
 * - Context menus and interactions
 */

'use client';

import React, { useMemo } from 'react';
import type { 
  TreeRendererProps, 
  TreeNode, 
  TreeState,
  TreeConfig,
  TreeDisplayOptions,
  TreeEventHandlers 
} from './tree-types';

// Simple utility function for className merging
function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TREE RENDERER COMPONENT
// ============================================================================

export function TreeRenderer({
  nodes,
  structure,
  state,
  config,
  displayOptions,
  eventHandlers,
  className
}: TreeRendererProps) {

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = state.expandedNodes.has(node.id);
    const isSelected = state.selectedNodes.has(node.id);
    const isFocused = state.focusedNodeId === node.id;
    const hasChildren = node.childCount > 0;
    const isLoading = state.loadingNodes.has(node.id);

    return (
      <div key={node.id} className="select-none">
        {/* Node Row */}
        <div
          className={cn(
            'flex items-center py-1 px-2 rounded cursor-pointer transition-colors',
            'hover:bg-gray-50',
            isSelected && 'bg-blue-50 text-blue-900',
            isFocused && 'ring-1 ring-blue-500',
            !node.isActive && 'opacity-60'
          )}
          style={{ paddingLeft: `${level * displayOptions.indentSize + 8}px` }}
          onClick={(e) => eventHandlers.onNodeClick?.(node, e.nativeEvent)}
          onDoubleClick={(e) => eventHandlers.onNodeDoubleClick?.(node, e.nativeEvent)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                if (isExpanded) {
                  eventHandlers.onNodeCollapse?.(node);
                } else {
                  eventHandlers.onNodeExpand?.(node);
                }
              }}
            >
              {isLoading ? (
                <span className="animate-spin">⟳</span>
              ) : isExpanded ? (
                '▼'
              ) : (
                '▶'
              )}
            </button>
          )}

          {/* Node Icon */}
          {displayOptions.showIcons && (
            <div className={cn(
              'w-4 h-4 flex items-center justify-center text-xs mr-2',
              node.color === 'blue' && 'text-blue-600',
              node.color === 'green' && 'text-green-600',
              node.color === 'orange' && 'text-orange-600',
              !node.color && 'text-gray-600'
            )}>
              {node.icon === 'folder' && (hasChildren ? '📁' : '📂')}
              {node.icon === 'file' && '📄'}
              {!node.icon && '🗂️'}
            </div>
          )}

          {/* Multi-select Checkbox */}
          {state.multiSelectEnabled && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                eventHandlers.onNodeSelect?.(node, e.target.checked);
              }}
              className="mr-2"
            />
          )}

          {/* Node Name */}
          <span className={cn(
            'flex-1 truncate text-sm',
            displayOptions.compactMode ? 'font-normal' : 'font-medium'
          )}>
            {node.name}
          </span>

          {/* Node Badges */}
          {displayOptions.showBadges && node.childCount > 0 && (
            <span className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {node.childCount}
            </span>
          )}

          {/* Node Type Badge */}
          {node.type && node.type !== 'NODE' && (
            <span className="ml-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              {node.type}
            </span>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && node.children && (
          <div className="ml-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const visibleNodes = useMemo(() => {
    if (state.mode === 'search' && state.searchResults.length > 0) {
      return state.searchResults.map(result => result.node);
    }
    return structure.rootNodes;
  }, [state.mode, state.searchResults, structure.rootNodes]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (structure.totalCount === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-gray-500', className)}>
        <div className="text-center">
          <div className="text-2xl mb-2">🌳</div>
          <div className="text-sm">No nodes found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto p-2', className)}>
      {visibleNodes.map(node => renderNode(node))}
    </div>
  );
} 